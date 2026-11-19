import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { SQLiteStorageEngine } from '../utils/database.js';
import { saveDataUriToDisk } from '../utils/mediaStorage.js';
import { RealtimeEventBus } from '../utils/realtime.js';

const execFileAsync = promisify(execFile);

export interface SystemRouterDeps {
  storageEngine: SQLiteStorageEngine;
  realtimeBus: RealtimeEventBus;
  uploadsDir: string;
  dbJsonFile: string;
  dataDir: string;
  reloadDatabase: () => void;
}

export const createSystemRouter = (deps: SystemRouterDeps): Router => {
  const router = Router();
  const { storageEngine, realtimeBus, uploadsDir, dbJsonFile, dataDir, reloadDatabase } = deps;

  // Direct media upload endpoint (converts base64 Data URI -> /api/uploads/<hash>.<ext>)
  router.post('/uploads', (req: Request, res: Response) => {
    const { dataUri } = req.body || {};
    if (typeof dataUri !== 'string' || !dataUri.startsWith('data:')) {
      return res.status(400).json({ success: false, message: 'A valid base64 dataUri is required.' });
    }
    const saved = saveDataUriToDisk(dataUri, uploadsDir, 1);
    if (!saved) {
      return res.status(400).json({ success: false, message: 'Unsupported or malformed dataUri payload.' });
    }
    return res.json({ success: true, url: saved.url, bytes: saved.bytesWritten });
  });

  // Enterprise Database & Media Storage Telemetry
  router.get('/system/db-stats', (_req: Request, res: Response) => {
    try {
      return res.json({ success: true, data: storageEngine.getStats() });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err?.message || 'Failed to read database stats' });
    }
  });

  // Live Real-Time SSE Broker Telemetry
  router.get('/system/realtime-stats', (_req: Request, res: Response) => {
    return res.json({ success: true, data: realtimeBus.getStats() });
  });

  // Real-Time Server-Sent Events (SSE) Stream
  router.get('/events/stream', (req: Request, res: Response) => {
    const userId = req.query.userId ? String(req.query.userId) : undefined;
    const role = req.query.role ? String(req.query.role) : undefined;
    realtimeBus.addClient(res, { userId, role });
  });

  // LOCAL-ONLY: 1-Click Sync Live Database from Production VPS (72.61.106.87)
  router.post('/dev/sync-from-production', async (req: Request, res: Response) => {
    const host = (req.hostname || '').toLowerCase();
    const isLocalHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';

    if (process.env.NODE_ENV === 'production' || !isLocalHost) {
      return res.status(403).json({
        success: false,
        message: 'Sync from production is strictly disabled outside local development.',
      });
    }

    const backupDir = path.join(dataDir, 'backups');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const localBackupPath = path.join(backupDir, `local_db_backup_${timestamp}.json`);
    const tempDownloadPath = path.join(dataDir, `db_prod_sync_${Date.now()}.tmp.json`);
    const prodHost = process.env.PROD_SSH_HOST || 'root@72.61.106.87';
    const prodDbPath = process.env.PROD_DB_PATH || '/var/www/educate-crm/server/data/db.json';

    try {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      if (fs.existsSync(dbJsonFile)) {
        fs.copyFileSync(dbJsonFile, localBackupPath);
      }

      await execFileAsync('scp', [
        '-o', 'BatchMode=yes',
        '-o', 'ConnectTimeout=15',
        `${prodHost}:${prodDbPath}`,
        tempDownloadPath,
      ]);

      const raw = fs.readFileSync(tempDownloadPath, 'utf-8');
      const parsed = JSON.parse(raw);

      if (!parsed || !Array.isArray(parsed.students) || !Array.isArray(parsed.staffUsers)) {
        throw new Error('Downloaded production snapshot failed schema validation.');
      }

      fs.renameSync(tempDownloadPath, dbJsonFile);
      const imported = storageEngine.importFromJsonFile(dbJsonFile);
      reloadDatabase();
      realtimeBus.broadcast('db:sync', { syncedAt: new Date().toISOString() });

      const summary = {
        students: parsed.students?.length || 0,
        mentors: parsed.mentors?.length || 0,
        staff: parsed.staffUsers?.length || 0,
        courses: parsed.courses?.length || 0,
        expenses: parsed.expenses?.length || 0,
        leads: parsed.leads?.length || 0,
        mediaOffloaded: imported.mediaExtracted,
        syncedAt: new Date().toISOString(),
        backupFile: path.basename(localBackupPath),
      };

      console.log('✅ [DEV SYNC] Cloned live production database locally:', summary);
      return res.json({
        success: true,
        message: `Synced live production database (${summary.students} students, ${summary.mentors} mentors, ${summary.expenses} expenses).`,
        data: summary,
      });
    } catch (error: any) {
      if (fs.existsSync(tempDownloadPath)) {
        try { fs.unlinkSync(tempDownloadPath); } catch {}
      }
      console.error('❌ [DEV SYNC] Failed to sync from production:', error);
      return res.status(500).json({
        success: false,
        message: error?.stderr || error?.message || 'Failed to pull live database from production VPS.',
      });
    }
  });

  return router;
};
