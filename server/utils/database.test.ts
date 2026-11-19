import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { SQLiteStorageEngine } from './database.js';
import { offloadBase64MediaInPlace } from './mediaStorage.js';

describe('Phase 2: SQLite WAL Storage & Media Offloading', () => {
  let tmpDir: string;
  let sqlitePath: string;
  let uploadsDir: string;
  let engine: SQLiteStorageEngine;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'educate-crm-db-test-'));
    sqlitePath = path.join(tmpDir, 'test.sqlite');
    uploadsDir = path.join(tmpDir, 'uploads');
    engine = new SQLiteStorageEngine(sqlitePath, uploadsDir);
  });

  afterEach(() => {
    engine.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('offloads embedded base64 media to content-addressed files and deduplicates identical blobs', () => {
    const fakePngBase64 = Buffer.alloc(3000, 0x42).toString('base64');
    const dataUri = `data:image/png;base64,${fakePngBase64}`;

    const payload = {
      students: [
        { id: 'stu-1', avatarUrl: dataUri },
        { id: 'stu-2', avatarUrl: dataUri }, // duplicate blob should reuse same file
      ],
      tickets: [
        { id: 'tkt-1', attachments: [{ name: 'proof.png', url: dataUri }] },
      ],
    };

    const result = offloadBase64MediaInPlace(payload, uploadsDir, 500);
    expect(result.extractedCount).toBe(3);
    expect(result.bytesSaved).toBeGreaterThan(10000);

    // All three references point to the exact same deduplicated /api/uploads/<hash>.png URL
    expect(payload.students[0].avatarUrl).toMatch(/^\/api\/uploads\/[a-f0-9]{24}\.png$/);
    expect(payload.students[1].avatarUrl).toBe(payload.students[0].avatarUrl);
    expect(payload.tickets[0].attachments[0].url).toBe(payload.students[0].avatarUrl);

    // Only 1 physical file written on disk
    const files = fs.readdirSync(uploadsDir);
    expect(files.length).toBe(1);
  });

  it('persists collections atomically in SQLite WAL and only writes dirty collections on update', () => {
    const initial = {
      students: [{ id: 's1', name: 'Ada' }],
      mentors: [{ id: 'm1', name: 'Prof. Obi' }],
      settings: { instituteName: 'CODELAB EDUCARE LTD' },
    };

    const firstWrite = engine.saveAll(initial);
    expect(firstWrite.collectionsWritten).toBe(3);

    // Second save with no changes should write 0 collections
    const noOpWrite = engine.saveAll(initial);
    expect(noOpWrite.collectionsWritten).toBe(0);

    // Mutate only students — only 1 collection should be written
    initial.students.push({ id: 's2', name: 'Tunde' });
    const partialWrite = engine.saveAll(initial);
    expect(partialWrite.collectionsWritten).toBe(1);

    // Verify full reload fidelity from SQLite
    const reloaded = engine.loadAll<typeof initial>();
    expect(reloaded?.students).toHaveLength(2);
    expect(reloaded?.mentors[0].name).toBe('Prof. Obi');
    expect(reloaded?.settings.instituteName).toBe('CODELAB EDUCARE LTD');
  });

  it('migrates a legacy db.json file into SQLite while offloading base64 blobs', () => {
    const fakePdfBase64 = Buffer.alloc(4000, 0x25).toString('base64');
    const jsonPath = path.join(tmpDir, 'legacy-db.json');
    fs.writeFileSync(
      jsonPath,
      JSON.stringify({
        expenses: [{ id: 'exp-1', receiptUrl: `data:application/pdf;base64,${fakePdfBase64}` }],
        students: [{ id: 'stu-1', name: 'Chidi' }],
      }),
      'utf-8'
    );

    const migrated = engine.importFromJsonFile<any>(jsonPath);
    expect(migrated.collectionsWritten).toBe(2);
    expect(migrated.mediaExtracted).toBe(1);
    expect(migrated.data.expenses[0].receiptUrl).toMatch(/^\/api\/uploads\/[a-f0-9]{24}\.pdf$/);

    const stats = engine.getStats();
    expect(stats.engine).toBe('sqlite-wal');
    expect(stats.collectionCount).toBe(2);
    expect(stats.media.fileCount).toBe(1);
  });
});
