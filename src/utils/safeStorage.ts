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
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // Safari SecurityError / QuotaExceeded fallback
    }
    memoryStorageLocal[key] = value;
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
