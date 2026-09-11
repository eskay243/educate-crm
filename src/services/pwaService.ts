// ==============================================================================
// CODELAB EDUCARE Nexus CRM — PWA Service Worker Registration & Lifecycle
// ==============================================================================

type SWUpdateCallback = (registration: ServiceWorkerRegistration) => void;

class PWAService {
  private registration: ServiceWorkerRegistration | null = null;
  private updateCallbacks: SWUpdateCallback[] = [];

  public register(): void {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      console.log('[PWA] Service Worker not supported in this browser environment.');
      return;
    }

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .then((reg) => {
          this.registration = reg;
          console.log('[PWA] Service Worker registered successfully with scope:', reg.scope);

          // Check if an updated service worker is already waiting
          if (reg.waiting) {
            this.notifyUpdate(reg);
          }

          // Listen for new service worker updates
          reg.addEventListener('updatefound', () => {
            const installingWorker = reg.installing;
            if (!installingWorker) return;

            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[PWA] New version of Nexus CRM available.');
                this.notifyUpdate(reg);
              }
            });
          });
        })
        .catch((err) => {
          console.error('[PWA] Service Worker registration failed:', err);
        });

      // Reload page when newly active service worker takes control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          window.location.reload();
        }
      });
    });
  }

  public onUpdate(callback: SWUpdateCallback): () => void {
    this.updateCallbacks.push(callback);
    if (this.registration?.waiting) {
      callback(this.registration);
    }
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter((cb) => cb !== callback);
    };
  }

  private notifyUpdate(reg: ServiceWorkerRegistration): void {
    this.updateCallbacks.forEach((cb) => cb(reg));
  }

  public skipWaiting(): void {
    if (this.registration?.waiting) {
      this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  }

  public async clearCacheAndReload(): Promise<void> {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((r) => r.unregister()));
    }
    window.location.reload();
  }
}

export const pwaService = new PWAService();
