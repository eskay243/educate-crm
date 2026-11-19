import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'events';
import { RealtimeEventBus } from './realtime.js';

class MockResponse extends EventEmitter {
  public headers: Record<string, string> = {};
  public chunks: string[] = [];

  setHeader(key: string, value: string) {
    this.headers[key] = value;
  }

  flushHeaders() {}

  write(chunk: string) {
    this.chunks.push(chunk);
    return true;
  }
}

describe('Phase 3: Real-Time SSE Event Bus', () => {
  it('registers SSE clients, sets streaming headers, and removes them on disconnect', () => {
    const bus = new RealtimeEventBus(0);
    const res = new MockResponse();

    bus.addClient(res as any, { userId: 'usr-1', role: 'super_admin' });
    expect(res.headers['Content-Type']).toBe('text/event-stream');
    expect(res.headers['X-Accel-Buffering']).toBe('no');
    expect(bus.getStats().activeClients).toBe(1);
    expect(res.chunks[0]).toContain('event: connected');

    res.emit('close');
    expect(bus.getStats().activeClients).toBe(0);
    bus.dispose();
  });

  it('broadcasts events with optional role and excludeUserId filters', () => {
    const bus = new RealtimeEventBus(0);
    const adminRes = new MockResponse();
    const mentorRes = new MockResponse();

    bus.addClient(adminRes as any, { userId: 'u-admin', role: 'super_admin' });
    bus.addClient(mentorRes as any, { userId: 'u-mentor', role: 'mentor' });

    const deliveredAll = bus.broadcast('chat:message', { conversationId: 'c1', messageId: 'm1' });
    expect(deliveredAll).toBe(2);
    expect(adminRes.chunks[1]).toContain('event: chat:message');
    expect(mentorRes.chunks[1]).toContain('"conversationId":"c1"');

    const deliveredRole = bus.broadcast(
      'notification:created',
      { title: 'Admin Alert' },
      { roles: ['super_admin'] }
    );
    expect(deliveredRole).toBe(1);
    expect(adminRes.chunks).toHaveLength(3);
    expect(mentorRes.chunks).toHaveLength(2);

    bus.dispose();
  });
});
