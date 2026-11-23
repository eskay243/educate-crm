import React, { ComponentType, lazy } from 'react';

const isChunkLoadError = (err: unknown): boolean => {
  const msg = String((err as any)?.message || err || '').toLowerCase();
  return (
    msg.includes('importing a module script failed') ||
    msg.includes('failed to fetch dynamically imported module') ||
    msg.includes('loading chunk') ||
    msg.includes('chunkloaderror') ||
    msg.includes('error loading dynamically imported module')
  );
};

export function lazyWithRetry<T extends ComponentType<any>>(
  importer: () => Promise<{ default: T }>,
  chunkKey: string
): React.LazyExoticComponent<T> {
  return lazy(async () => {
    const storageKey = `chunk_retry_${chunkKey}`;
    try {
      const mod = await importer();
      try {
        window.sessionStorage.removeItem(storageKey);
      } catch {
        // Ignore private browsing sessionStorage restrictions
      }
      return mod;
    } catch (err) {
      if (isChunkLoadError(err)) {
        let alreadyRetried = false;
        try {
          alreadyRetried = window.sessionStorage.getItem(storageKey) === '1';
          if (!alreadyRetried) {
            window.sessionStorage.setItem(storageKey, '1');
          }
        } catch {
          alreadyRetried = true;
        }
        if (!alreadyRetried) {
          window.location.reload();
          // Return a never-resolving promise while the browser reloads
          return new Promise<{ default: T }>(() => {});
        }
      }
      throw err;
    }
  });
}
