import { Response } from 'express';
import crypto from 'crypto';

export interface RealtimeClient {
  id: string;
  userId?: string;
  role?: string;
  res: Response;
  connectedAt: string;
}

export interface BroadcastFilter {
  userIds?: string[];
  roles?: string[];
  excludeUserId?: string;
}

export interface RealtimeStats {
  activeClients: number;
  totalEventsDispatched: number;
  startedAt: string;
}

/**
 * Lightweight, zero-dependency Server-Sent Events (SSE) broker for real-time CRM updates.
 * Works natively through both Vite dev proxy and Nginx /api/* proxy without WebSocket upgrades.
 */
export class RealtimeEventBus {
  private clients: Map<string, RealtimeClient> = new Map();
  private totalEventsDispatched = 0;
  private startedAt = new Date().toISOString();
  private heartbeatTimer: NodeJS.Timeout | null = null;

  constructor(heartbeatIntervalMs = 25000) {
    if (heartbeatIntervalMs > 0) {
      this.heartbeatTimer = setInterval(() => {
        for (const [id, client] of this.clients.entries()) {
          try {
            client.res.write(': heartbeat\n\n');
          } catch {
            this.clients.delete(id);
          }
        }
      }, heartbeatIntervalMs);
      // Do not keep Node process alive solely for heartbeats during tests
      if (typeof this.heartbeatTimer.unref === 'function') {
        this.heartbeatTimer.unref();
      }
    }
  }

  public addClient(res: Response, meta: { userId?: string; role?: string } = {}): string {
    const id = crypto.randomUUID();
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders();
    }

    const client: RealtimeClient = {
      id,
      userId: meta.userId,
      role: meta.role,
      res,
      connectedAt: new Date().toISOString(),
    };

    this.clients.set(id, client);

    // Send initial connection acknowledgement
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId: id, timestamp: client.connectedAt })}\n\n`);

    res.on('close', () => {
      this.clients.delete(id);
    });

    return id;
  }

  public removeClient(clientId: string): void {
    this.clients.delete(clientId);
  }

  public broadcast(eventType: string, payload: Record<string, unknown>, filter?: BroadcastFilter): number {
    const frame = `event: ${eventType}\ndata: ${JSON.stringify({ ...payload, _ts: new Date().toISOString() })}\n\n`;
    let delivered = 0;

    for (const [id, client] of this.clients.entries()) {
      if (filter) {
        if (filter.excludeUserId && client.userId === filter.excludeUserId) continue;
        if (filter.userIds && filter.userIds.length > 0 && (!client.userId || !filter.userIds.includes(client.userId))) {
          continue;
        }
        if (filter.roles && filter.roles.length > 0 && (!client.role || !filter.roles.includes(client.role))) {
          continue;
        }
      }

      try {
        client.res.write(frame);
        delivered++;
      } catch {
        this.clients.delete(id);
      }
    }

    if (delivered > 0) {
      this.totalEventsDispatched += delivered;
    }
    return delivered;
  }

  public getStats(): RealtimeStats {
    return {
      activeClients: this.clients.size,
      totalEventsDispatched: this.totalEventsDispatched,
      startedAt: this.startedAt,
    };
  }

  public dispose(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    this.clients.clear();
  }
}
