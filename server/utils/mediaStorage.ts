import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/heic': 'heic',
  'application/pdf': 'pdf',
  'audio/webm': 'webm',
  'audio/ogg': 'ogg',
  'audio/mpeg': 'mp3',
  'audio/mp4': 'm4a',
  'audio/wav': 'wav',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/msword': 'doc',
  'text/csv': 'csv',
  'text/plain': 'txt',
};

// Regex matching data:<mime>;base64,<payload> (allowing optional parameters like codecs=opus)
const DATA_URI_REGEX = /^data:([a-zA-Z0-9.+/-]+)(?:;[^;,]+)*;base64,([A-Za-z0-9+/=\s]+)$/;

export interface OffloadResult {
  extractedCount: number;
  bytesSaved: number;
}

export interface MediaStorageStats {
  fileCount: number;
  totalBytes: number;
  uploadsDir: string;
}

export const ensureUploadsDir = (uploadsDir: string): void => {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
};

/**
 * Decodes a single base64 Data URI to a content-addressed file on disk and returns
 * its public `/api/uploads/<filename>` URL. Returns null if not a valid/qualifying Data URI.
 */
export const saveDataUriToDisk = (
  dataUri: string,
  uploadsDir: string,
  minLength = 2048
): { url: string; bytesWritten: number } | null => {
  if (typeof dataUri !== 'string' || dataUri.length < minLength || !dataUri.startsWith('data:')) {
    return null;
  }

  const match = dataUri.match(DATA_URI_REGEX);
  if (!match) return null;

  const mime = match[1].toLowerCase();
  const base64Body = match[2].replace(/\s+/g, '');
  const ext = MIME_TO_EXT[mime] || 'bin';

  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Body, 'base64');
    if (buffer.length === 0) return null;
  } catch {
    return null;
  }

  ensureUploadsDir(uploadsDir);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex').slice(0, 24);
  const filename = `${hash}.${ext}`;
  const targetPath = path.join(uploadsDir, filename);

  if (!fs.existsSync(targetPath)) {
    fs.writeFileSync(targetPath, buffer);
  }

  return {
    url: `/api/uploads/${filename}`,
    bytesWritten: buffer.length,
  };
};

/**
 * Recursively traverses an object/array in place and offloads any embedded base64
 * Data URIs (>= minLength chars) to `uploadsDir`, replacing them with `/api/uploads/<hash>.<ext>`.
 */
export const offloadBase64MediaInPlace = (
  node: unknown,
  uploadsDir: string,
  minLength = 2048
): OffloadResult => {
  let extractedCount = 0;
  let bytesSaved = 0;

  const visit = (current: unknown): void => {
    if (!current || typeof current !== 'object') return;

    if (Array.isArray(current)) {
      for (let i = 0; i < current.length; i++) {
        const item = current[i];
        if (typeof item === 'string' && item.length >= minLength && item.startsWith('data:')) {
          const saved = saveDataUriToDisk(item, uploadsDir, minLength);
          if (saved) {
            bytesSaved += item.length - saved.url.length;
            current[i] = saved.url;
            extractedCount++;
          }
        } else if (item && typeof item === 'object') {
          visit(item);
        }
      }
      return;
    }

    const record = current as Record<string, unknown>;
    for (const key of Object.keys(record)) {
      const value = record[key];
      if (typeof value === 'string' && value.length >= minLength && value.startsWith('data:')) {
        const saved = saveDataUriToDisk(value, uploadsDir, minLength);
        if (saved) {
          bytesSaved += value.length - saved.url.length;
          record[key] = saved.url;
          extractedCount++;
        }
      } else if (value && typeof value === 'object') {
        visit(value);
      }
    }
  };

  visit(node);
  return { extractedCount, bytesSaved };
};

export const getMediaStorageStats = (uploadsDir: string): MediaStorageStats => {
  ensureUploadsDir(uploadsDir);
  let fileCount = 0;
  let totalBytes = 0;
  try {
    const entries = fs.readdirSync(uploadsDir);
    for (const name of entries) {
      if (name.startsWith('.')) continue;
      const fullPath = path.join(uploadsDir, name);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        fileCount++;
        totalBytes += stat.size;
      }
    }
  } catch {
    // Ignore read errors
  }
  return { fileCount, totalBytes, uploadsDir };
};
