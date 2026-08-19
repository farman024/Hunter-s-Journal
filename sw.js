// Hunter's Journal — Service Worker v7 (relative paths, network-first navigations)
const CACHE = 'hunters-journal-v7';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './logo.png',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(PRECACHE).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname === 'api.anthropic.com') return;
  if (url.protocol === 'chrome-extension:') return;

  // CDN / Fonts — cache then network
  if (url.hostname.includes('googleapis.com') ||
      url.hostname.includes('gstatic.com') ||
      url.hostname.includes('cdnjs.cloudflare.com')) {
    e.respondWith(
      caches.match(e.request).then(cached => {
        if (cached) return cached;
        return fetch(e.request).then(res => {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        }).catch(() => cached);
      })
    );
    return;
  }

  // App shell — network-first for navigations (always fresh HTML), cache-first for assets
  const isNavigate = e.request.mode === 'navigate';
  e.respondWith(
    isNavigate
      ? fetch(e.request).then(async res => {
          if (res && res.status === 200) {
            const cache = await caches.open(CACHE);
            await cache.put(e.request, res.clone());
          }
          return res;
        }).catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
      : caches.match(e.request).then(cached => {
          const net = fetch(e.request).then(async res => {
            if (res && res.status === 200) {
              const cache = await caches.open(CACHE);
              await cache.put(e.request, res.clone());
            }
            return res;
          }).catch(() => cached || caches.match('./index.html'));
          return cached || net;
        })
  );
});
