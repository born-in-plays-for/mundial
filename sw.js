const CACHE = 'mundial-2026-v2';

const PRECACHE = [
  '/',
  '/wc2026_map_exported.html',
  '/wc2026_map.js',
  '/wc2026_map.css',
  '/i18n.js',
  '/wc2026_map_data.json',
  '/uk-nations.geojson',
  '/chains/wc2026_chain_render.js',
  '/chains/wc2026_chain_longest.json',
  '/images/wc2026.svg',
  '/images/wc2026_192.png',
  '/images/wc2026_512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate for same-origin; skip CDN requests.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  if (new URL(e.request.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const fresh = fetch(e.request).then(res => {
          cache.put(e.request, res.clone());
          return res;
        }).catch(() => cached);
        return cached ?? fresh;
      })
    )
  );
});
