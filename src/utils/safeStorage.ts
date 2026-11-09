// ==============================================================================
// CODELAB EDUCARE Nexus CRM — Safari-Resilient Safe Storage Utility
// Handles Safari Private Browsing, QuotaExceededError, SecurityError, and 
// third-party cookie restrictions by gracefully falling back to in-memory storage.
// ==============================================================================

const memoryStorageLocal: Record<string, string> = {};
const memoryStorageSession: Record<string, string> = {};

export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Safari SecurityError / QuotaExceeded fallback
    }
    return memoryStorageLocal[key] ?? null;
  },

  setItem(key: string, value: string): void {
    memoryStorageLocal[key] = value;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // QuotaExceededError or Safari SecurityError fallback:
      // Strip oversized inline base64 data URLs (> 100KB) so all text/KYC fields always persist across page reloads
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const compactValue = value.length > 100_000
            ? value.replace(/"data:[^"]{100000,}"/g, '""')
            : value;
          try {
            window.localStorage.setItem(key, compactValue);
            return;
          } catch {
            // Evict non-auth bulky cache keys and retry so auth/user state is never lost
            const keysToKeep = new Set([
              key,
              'nexus_clean_prod_auth_v1',
              'nexus_origin_super_admin_user',
              'nexus_auth',
            ]);
            const allKeys: string[] = [];
            for (let i = 0; i < window.localStorage.length; i++) {
              const k = window.localStorage.key(i);
              if (k && !keysToKeep.has(k)) allKeys.push(k);
            }
            allKeys.forEach(k => {
              try { window.localStorage.removeItem(k); } catch {}
            });
            window.localStorage.setItem(key, compactValue);
            return;
          }
        }
      } catch {
        // Fallback to in-memory storage if localStorage is completely disabled
      }
    }
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Safari fallback
    }
    delete memoryStorageLocal[key];
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.clear();
      }
    } catch {
      // Safari fallback
    }
    for (const key of Object.keys(memoryStorageLocal)) {
      delete memoryStorageLocal[key];
    }
  },
};

export const safeSessionStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        return window.sessionStorage.getItem(key);
      }
    } catch {
      // Safari SecurityError fallback
    }
    return memoryStorageSession[key] ?? null;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(key, value);
        return;
      }
    } catch {
      // Safari SecurityError fallback
    }
    memoryStorageSession[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(key);
      }
    } catch {
      // Safari fallback
    }
    delete memoryStorageSession[key];
  },

  clear(): void {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.clear();
      }
    } catch {
      // Safari fallback
    }
    for (const key of Object.keys(memoryStorageSession)) {
      delete memoryStorageSession[key];
    }
  },
};

export function safeJsonParse<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}
