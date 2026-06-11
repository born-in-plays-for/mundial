const CACHE = 'mundial-2026-v6';

const PRECACHE = [
  '/',
  '/wc2026_map_exported.html',
  '/wc2026_map.js',
  '/wc2026_map.css',
  '/i18n.js',
  '/wc2026_map_data.json',
  '/uk-nations.geojson',
  '/wc2026_elo_ranking.js',
  '/wc2026_elo_rank.json',
  '/chains/wc2026_chain_render.js',
  '/chains/wc2026_chain_longest.json',
  '/realfavicongenerator/favicon.svg',
  '/realfavicongenerator/favicon-96x96.png',
  '/realfavicongenerator/apple-touch-icon.png',
  '/realfavicongenerator/web-app-manifest-192x192.png',
  '/realfavicongenerator/web-app-manifest-512x512.png',
  '/realfavicongenerator/site.webmanifest',
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
