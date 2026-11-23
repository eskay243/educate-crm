type RealtimeHandler = (payload: any) => void;

const KNOWN_EVENTS = [
  'connected',
  'chat:message',
  'chat:read',
  'notification:created',
  'notification:updated',
  'ticket:updated',
  'attendance:update',
  'scrum:standup',
  'db:sync',
] as const;

export type RealtimeEventName = (typeof KNOWN_EVENTS)[number];

/**
 * Browser SSE client for real-time Educate CRM updates.
 * Automatically reconnects via native EventSource and fans out events to subscribers.
 */
class RealtimeClient {
  private source: EventSource | null = null;
  private listeners: Map<string, Set<RealtimeHandler>> = new Map();
  private currentKey: string | null = null;

  public connect(user?: { id?: string; role?: string } | null): void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') return;
    if (!user?.id) {
      this.disconnect();
      return;
    }

    const key = `${user.id}:${user.role || ''}`;
    if (this.source && this.currentKey === key && this.source.readyState !== EventSource.CLOSED) {
      return;
    }

    this.disconnect();
    this.currentKey = key;

    const params = new URLSearchParams();
    params.set('userId', user.id);
    if (user.role) params.set('role', user.role);

    const es = new EventSource(`/api/events/stream?${params.toString()}`);
    this.source = es;

    KNOWN_EVENTS.forEach((eventName) => {
      es.addEventListener(eventName, (evt: MessageEvent) => {
        let parsed: any = {};
        try {
          parsed = evt.data ? JSON.parse(evt.data) : {};
        } catch {
          parsed = { raw: evt.data };
        }
        const handlers = this.listeners.get(eventName);
        if (handlers) {
          handlers.forEach((fn) => {
            try {
              fn(parsed);
            } catch {
              // Isolate subscriber errors
            }
          });
        }
      });
    });
  }

  public disconnect(): void {
    if (this.source) {
      this.source.close();
      this.source = null;
    }
    this.currentKey = null;
  }

  public subscribe(eventName: RealtimeEventName, handler: RealtimeHandler): () => void {
    let set = this.listeners.get(eventName);
    if (!set) {
      set = new Set();
      this.listeners.set(eventName, set);
    }
    set.add(handler);
    return () => {
      set?.delete(handler);
    };
  }
}

export const realtimeClient = new RealtimeClient();
