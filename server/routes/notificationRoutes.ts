import { Router, Request, Response } from 'express';
import { RealtimeEventBus } from '../utils/realtime.js';

export interface NotificationRouterDeps {
  getNotifications: () => any[];
  setNotifications: (next: any[]) => void;
  saveDb: () => void;
  realtimeBus: RealtimeEventBus;
}

export const createNotificationRouter = (deps: NotificationRouterDeps): Router => {
  const router = Router();
  const { getNotifications, setNotifications, saveDb, realtimeBus } = deps;

  router.get('/', (_req: Request, res: Response) => {
    res.json({ success: true, data: getNotifications() });
  });

  router.patch('/:id/read', (req: Request, res: Response) => {
    const { id } = req.params;
    const notif = getNotifications().find((n) => n.id === id);
    if (notif) notif.read = true;
    saveDb();
    realtimeBus.broadcast('notification:updated', { id, read: true });
    res.json({ success: true, data: notif });
  });

  router.post('/mark-all-read', (_req: Request, res: Response) => {
    getNotifications().forEach((n) => {
      n.read = true;
    });
    saveDb();
    realtimeBus.broadcast('notification:updated', { allRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  });

  router.delete('/', (_req: Request, res: Response) => {
    setNotifications([]);
    saveDb();
    realtimeBus.broadcast('notification:updated', { cleared: true });
    res.json({ success: true, message: 'All notifications cleared' });
  });

  return router;
};
