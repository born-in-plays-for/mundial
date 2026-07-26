// js/cached_fetch.js
// Session-persistent cache for static data JSON fetches (map/elo/geo/wiki/subgraph data) —
// the same handful of files get re-fetched from scratch on every full-page navigation between
// index.html/chains/insights/live (no SPA router, no shared JS runtime between them — see
// CLAUDE.md's own note on why a full SPA rewrite was ruled out), which is the biggest single
// cause of the "reload every time you switch tabs" feel. sessionStorage (not localStorage)
// deliberately: data updates roughly daily via the pipeline, and sessionStorage's own per-tab
// lifetime is a free, zero-maintenance expiry — no TTL/ETag bookkeeping needed, a closed tab
// (or a new one) just starts clean and re-fetches for real.
//
// Not for: backend/live API calls (genuinely real-time — wc2026_live.html's own PROXY
// endpoints), auth endpoints (js/auth-bar.js — session-specific in a different sense, must
// always hit the network), or anything already cache-busted on purpose (js/guide-mode.js's
// own ?v=Date.now() fetch, which deliberately wants a fresh copy every time).
const _PREFIX = 'cachedFetch:';

export const cachedFetchJson = async url => {
  // Resolved to an absolute URL for the cache key, not used verbatim — index.html's own
  // 'data/v2/map.json' and chains/index.html's '../data/v2/map.json' are the same real
  // resource, but as literal strings they'd land in two different sessionStorage entries,
  // silently defeating the whole point of sharing this cache across pages.
  const key = _PREFIX + new URL(url, location.href).href;
  const cached = sessionStorage.getItem(key);
  if (cached != null) {
    try { return JSON.parse(cached); } catch { /* corrupt entry — fall through to a real fetch */ }
  }
  const data = await fetch(url).then(r => r.json());
  try { sessionStorage.setItem(key, JSON.stringify(data)); }
  catch { /* quota exceeded or storage disabled (private browsing) — cache is best-effort */ }
  return data;
};
