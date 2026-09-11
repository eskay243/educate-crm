// ==============================================================================
// CODELAB EDUCARE Nexus CRM — High-Performance Mobile Service Worker
// Version: nexus-crm-v1.0.0
// ==============================================================================

const CACHE_NAME = 'nexus-crm-v1.0.0';
const API_CACHE_NAME = 'nexus-api-cache-v1';

// Critical core assets to pre-cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/logo.png',
  '/favicon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

// ------------------------------------------------------------------------------
// Installation Phase
// ------------------------------------------------------------------------------
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core offline app shell');
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Non-fatal precache warning:', err);
      });
    })
  );
});

// ------------------------------------------------------------------------------
// Activation Phase — Purge Obsolete Caches & Claim Clients
// ------------------------------------------------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && key !== API_CACHE_NAME) {
              console.log('[SW] Purging outdated cache:', key);
              return caches.delete(key);
            }
          })
        );
      })
    ])
  );
});

// ------------------------------------------------------------------------------
// Fetch Strategy Handler
// ------------------------------------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only intercept GET requests
  if (request.method !== 'GET') {
    return;
  }

  // 2. Navigation Requests (SPA Routes e.g., /attendance, /student/dashboard, /leads)
  // Network-First with Offline App Shell Fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          console.log('[SW] Offline navigation requested, serving cached app shell for:', url.pathname);
          const cachedApp = await caches.match('/index.html') || await caches.match('/');
          if (cachedApp) return cachedApp;
          return new Response(
            `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nexus CRM - Offline</title><style>body{background:#0B0F19;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:24px;text-align:center;}h1{font-size:22px;color:#38bdf8;}p{color:#94a3b8;font-size:14px;}</style></head><body><div><h1>You are currently offline</h1><p>Connect to the internet to load newly updated data.</p></div></body></html>`,
            { headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // 3. API Requests (/api/*)
  // Network-First with Fallback to API Cache for Read Operations
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(API_CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(async () => {
          console.log('[SW] Network failed for API, checking cache for:', url.pathname);
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response(
            JSON.stringify({
              success: false,
              offline: true,
              message: 'You are currently offline. Live operations will sync once reconnected.'
            }),
            { headers: { 'Content-Type': 'application/json' }, status: 503 }
          );
        })
    );
    return;
  }

  // 4. External Fonts & Material Symbols (Google Fonts, gstatic)
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. Static Assets (JS, CSS, Images, Media)
  // Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// ------------------------------------------------------------------------------
// Message Listener — Skip Waiting on Demand
// ------------------------------------------------------------------------------
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
