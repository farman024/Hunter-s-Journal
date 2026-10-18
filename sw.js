// Hunter's Journal — v9-private. Cache only the exact same-origin app shell
// beneath this registration's scope; user/API/auth data is never cacheable.
const LEGACY_PREFIX = 'hunters-journal-';
const scopeUrl = new URL(self.registration.scope);
const scopePath = scopeUrl.pathname.endsWith('/') ? scopeUrl.pathname : `${scopeUrl.pathname}/`;
const CACHE = `${LEGACY_PREFIX}v9-private-${encodeURIComponent(scopePath)}`;
const SHELL_PATHS = [
  '', 'index.html', 'manifest.json', 'logo.png', 'icon-192.png', 'icon-512.png',
  'config.js', 'private-sync.js', 'app-auth.js', 'render-safe.js'
];
const SHELL_URLS = SHELL_PATHS.map(path => new URL(path, `${scopeUrl.origin}${scopePath}`).href);
const NAVIGATION_URLS = new Set([
  new URL('', `${scopeUrl.origin}${scopePath}`).href,
  new URL('index.html', `${scopeUrl.origin}${scopePath}`).href
]);
const AUTH_HEADERS = ['authorization', 'proxy-authorization', 'cookie', 'x-supabase-auth-token', 'apikey'];

self.addEventListener('install', event => {
  const requests = SHELL_URLS.map(url => new Request(url, {
    method: 'GET', credentials: 'omit', cache: 'reload'
  }));
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(requests).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key !== CACHE && (
          /^hunters-journal-v\d+$/.test(key) ||
          (key.startsWith(LEGACY_PREFIX) && key.endsWith(`-${encodeURIComponent(scopePath)}`))
        ))
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== scopeUrl.origin || !url.pathname.startsWith(scopePath)) return;
  if (request.credentials === 'include') return;
  if (AUTH_HEADERS.some(name => request.headers.has(name))) return;

  // Only root/index navigations may carry a query (e.g. OAuth callback). They
  // always go directly to the network and neither their URL nor response is cached.
  const isNavigation = request.mode === 'navigate';
  const isShellNavigation = isNavigation && NAVIGATION_URLS.has(url.href.split('?')[0]);
  if (isNavigation && isShellNavigation && url.search) {
    event.respondWith(fetch(request));
    return;
  }

  // Do not intercept query URLs, non-shell navigations, or any unlisted path.
  if (url.search || !SHELL_URLS.includes(url.href)) {
    if (isNavigation && isShellNavigation) {
      event.respondWith(fetch(request).catch(async () => {
        const cache = await caches.open(CACHE);
        return cache.match(url.href);
      }));
    }
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(url.href);
    // Even if a caller uses the default same-origin credential mode, fetch
    // this public static file without cookies or other ambient credentials.
    const publicRequest = new Request(request, { credentials: 'omit', cache: 'reload' });
    const network = async () => {
      const response = await fetch(publicRequest);
      if (response && response.status === 200 && response.type !== 'opaque') {
        await cache.put(url.href, response.clone());
      }
      return response;
    };
    if (isNavigation) return network().catch(error => { if (cached) return cached; throw error; });
    return cached || network();
  })());
});
