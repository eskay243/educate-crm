import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SQLiteStorageEngine } from '../utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_JSON_PATH = path.resolve(__dirname, '../data/db.json');
const SQLITE_PATH = path.resolve(__dirname, '../data/educate.sqlite');
const UPLOADS_DIR = path.resolve(__dirname, '../uploads');

if (!fs.existsSync(DB_JSON_PATH)) {
  console.error(`❌ Legacy database not found at ${DB_JSON_PATH}`);
  process.exit(1);
}

const jsonBytes = fs.statSync(DB_JSON_PATH).size;
console.log(`📦 Reading legacy JSON database: ${DB_JSON_PATH} (${(jsonBytes / 1024 / 1024).toFixed(2)} MB)`);

const engine = new SQLiteStorageEngine(SQLITE_PATH, UPLOADS_DIR);
const t0 = Date.now();
const result = engine.importFromJsonFile(DB_JSON_PATH);
const elapsedMs = Date.now() - t0;
const stats = engine.getStats();

console.log('\n✅ Migration to SQLite WAL + Disk Media Storage complete!');
console.table({
  'Elapsed Time': `${elapsedMs} ms`,
  'Legacy db.json Size': `${(jsonBytes / 1024 / 1024).toFixed(2)} MB`,
  'New SQLite DB Size': `${(stats.sqliteBytes / 1024).toFixed(1)} KB (${((1 - stats.sqliteBytes / jsonBytes) * 100).toFixed(1)}% smaller)`,
  'Collections Migrated': result.collectionsWritten,
  'Base64 Blobs Offloaded': result.mediaExtracted,
  'Unique Media Files on Disk': stats.media.fileCount,
  'Offloaded Media Disk Size': `${(stats.media.totalBytes / 1024 / 1024).toFixed(2)} MB`,
});

engine.close();
