import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { offloadBase64MediaInPlace, getMediaStorageStats, MediaStorageStats } from './mediaStorage.js';

export interface DatabaseStats {
  engine: 'sqlite-wal';
  sqlitePath: string;
  sqliteBytes: number;
  walBytes: number;
  collectionCount: number;
  collections: Array<{
    key: string;
    recordCount: number;
    byteSize: number;
    updatedAt: string;
  }>;
  media: MediaStorageStats;
}

/**
 * ACID-compliant SQLite (WAL mode) persistence engine for Educate CRM.
 * Stores each top-level domain collection as an indexed row with SHA-256 dirty detection
 * so mutations only write the changed collection inside an atomic SQLite transaction.
 */
export class SQLiteStorageEngine {
  private sqlite: Database.Database;
  private sqlitePath: string;
  private uploadsDir: string;
  private lastHashes: Map<string, string> = new Map();

  private upsertStmt: Database.Statement;
  private selectAllStmt: Database.Statement;
  private deleteKeyStmt: Database.Statement;
  private metaUpsertStmt: Database.Statement;

  constructor(sqlitePath: string, uploadsDir: string) {
    this.sqlitePath = sqlitePath;
    this.uploadsDir = uploadsDir;

    const dir = path.dirname(sqlitePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.sqlite = new Database(sqlitePath);
    // Enterprise SQLite tuning: WAL mode for concurrent reads + fast ACID commits
    this.sqlite.pragma('journal_mode = WAL');
    this.sqlite.pragma('synchronous = NORMAL');
    this.sqlite.pragma('foreign_keys = ON');
    this.sqlite.pragma('busy_timeout = 5000');

    this.sqlite.exec(`
      CREATE TABLE IF NOT EXISTS collections (
        key TEXT PRIMARY KEY,
        payload TEXT NOT NULL,
        sha256 TEXT NOT NULL,
        record_count INTEGER NOT NULL DEFAULT 0,
        byte_size INTEGER NOT NULL DEFAULT 0,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS db_meta (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    this.upsertStmt = this.sqlite.prepare(`
      INSERT INTO collections (key, payload, sha256, record_count, byte_size, updated_at)
      VALUES (@key, @payload, @sha256, @record_count, @byte_size, @updated_at)
      ON CONFLICT(key) DO UPDATE SET
        payload = excluded.payload,
        sha256 = excluded.sha256,
        record_count = excluded.record_count,
        byte_size = excluded.byte_size,
        updated_at = excluded.updated_at
    `);

    this.selectAllStmt = this.sqlite.prepare(
      'SELECT key, payload, sha256, record_count, byte_size, updated_at FROM collections'
    );
    this.deleteKeyStmt = this.sqlite.prepare('DELETE FROM collections WHERE key = ?');
    this.metaUpsertStmt = this.sqlite.prepare(`
      INSERT INTO db_meta (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);
  }

  public isEmpty(): boolean {
    const row = this.sqlite.prepare('SELECT COUNT(*) as cnt FROM collections').get() as { cnt: number };
    return row.cnt === 0;
  }

  public loadAll<T extends Record<string, any>>(): T | null {
    const rows = this.selectAllStmt.all() as Array<{
      key: string;
      payload: string;
      sha256: string;
    }>;

    if (rows.length === 0) return null;

    const result: Record<string, any> = {};
    this.lastHashes.clear();

    for (const row of rows) {
      try {
        result[row.key] = JSON.parse(row.payload);
        this.lastHashes.set(row.key, row.sha256);
      } catch (err) {
        console.error(`[SQLite] Failed to parse collection "${row.key}":`, err);
      }
    }

    return result as T;
  }

  /**
   * Atomically persists only the collections whose SHA-256 hash changed since last write.
   * Automatically offloads any embedded base64 media payloads to disk before committing.
   */
  public saveAll<T extends Record<string, any>>(
    data: T,
    options?: { forceFullWrite?: boolean; offloadMedia?: boolean }
  ): { collectionsWritten: number; mediaExtracted: number; bytesSaved: number } {
    let mediaExtracted = 0;
    let bytesSaved = 0;

    if (options?.offloadMedia !== false) {
      const offload = offloadBase64MediaInPlace(data, this.uploadsDir);
      mediaExtracted = offload.extractedCount;
      bytesSaved = offload.bytesSaved;
    }

    const now = new Date().toISOString();
    const keys = Object.keys(data);
    let collectionsWritten = 0;

    const tx = this.sqlite.transaction(() => {
      for (const key of keys) {
        const value = data[key];
        if (value === undefined) continue;

        const payload = JSON.stringify(value);
        const sha256 = crypto.createHash('sha256').update(payload).digest('hex');

        if (!options?.forceFullWrite && this.lastHashes.get(key) === sha256) {
          continue;
        }

        const recordCount = Array.isArray(value) ? value.length : value && typeof value === 'object' ? 1 : 0;

        this.upsertStmt.run({
          key,
          payload,
          sha256,
          record_count: recordCount,
          byte_size: Buffer.byteLength(payload, 'utf8'),
          updated_at: now,
        });

        this.lastHashes.set(key, sha256);
        collectionsWritten++;
      }

      // Remove keys that were deleted from the root object
      const currentKeys = new Set(keys);
      for (const existingKey of Array.from(this.lastHashes.keys())) {
        if (!currentKeys.has(existingKey)) {
          this.deleteKeyStmt.run(existingKey);
          this.lastHashes.delete(existingKey);
        }
      }

      if (collectionsWritten > 0) {
        this.metaUpsertStmt.run('last_write_at', now, now);
      }
    });

    tx();
    return { collectionsWritten, mediaExtracted, bytesSaved };
  }

  /**
   * Imports a legacy db.json file into SQLite, offloading base64 blobs to disk in the process.
   */
  public importFromJsonFile<T extends Record<string, any>>(jsonFilePath: string): {
    data: T;
    collectionsWritten: number;
    mediaExtracted: number;
    bytesSaved: number;
  } {
    const raw = fs.readFileSync(jsonFilePath, 'utf-8');
    const parsed = JSON.parse(raw) as T;
    const stats = this.saveAll(parsed, { forceFullWrite: true, offloadMedia: true });
    const now = new Date().toISOString();
    this.metaUpsertStmt.run('migrated_from_json_at', now, now);
    this.sqlite.pragma('wal_checkpoint(TRUNCATE)');
    return { data: parsed, ...stats };
  }

  public getStats(): DatabaseStats {
    const rows = this.sqlite
      .prepare('SELECT key, record_count, byte_size, updated_at FROM collections ORDER BY byte_size DESC')
      .all() as Array<{
        key: string;
        record_count: number;
        byte_size: number;
        updated_at: string;
      }>;

    const sqliteBytes = fs.existsSync(this.sqlitePath) ? fs.statSync(this.sqlitePath).size : 0;
    const walPath = `${this.sqlitePath}-wal`;
    const walBytes = fs.existsSync(walPath) ? fs.statSync(walPath).size : 0;

    return {
      engine: 'sqlite-wal',
      sqlitePath: this.sqlitePath,
      sqliteBytes,
      walBytes,
      collectionCount: rows.length,
      collections: rows.map((r) => ({
        key: r.key,
        recordCount: r.record_count,
        byteSize: r.byte_size,
        updatedAt: r.updated_at,
      })),
      media: getMediaStorageStats(this.uploadsDir),
    };
  }

  public close(): void {
    this.sqlite.close();
  }
}
