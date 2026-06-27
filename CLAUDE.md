# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Interactive D3.js choropleth map of the 2026 FIFA World Cup tracking player "exports": players born in one country who represent another. Normalised by population. Includes a Python scraping/data pipeline and several standalone infographic HTML files.

Live at: **https://mundial.cthiebaud.com/**

### Repositories

| Repo | Content | Deploys to |
|---|---|---|
| **[born-in-plays-for/mundial](https://github.com/born-in-plays-for/mundial)** | Static frontend (HTML, JS, CSS, chains) | GitHub Pages |
| **[born-in-plays-for/mundial-data](https://github.com/born-in-plays-for/mundial-data)** | Shared data files (JSON, GeoJSON) — git submodule in both mundial and mundial-build | Not deployed independently |
| **[born-in-plays-for/mundial-server](https://github.com/born-in-plays-for/mundial-server)** | Backend (Flask, admin, login, WebSocket, API-Football proxy) | Runs locally (+ ngrok) |
| **[born-in-plays-for/mundial-build](https://github.com/born-in-plays-for/mundial-build)** | Data pipeline, scripts, dev tooling | Not deployed |

The backend repo lives at `../mundial-server` and the build repo at `../mundial-build` (sibling directories). The `data/` submodule (`mundial-data`) is shared between `mundial` and `mundial-build`. See their own `README.md` files for documentation.

---

## File structure

| File | Purpose |
|---|---|
| `index.html` | Entry point — redirects to the map, carries OG meta tags |
| `wc2026_map.html` | Main map page (Bootstrap 5, loads JS + JSON via ES module) |

**OG tags:** Both `index.html` and `wc2026_map.html` carry identical OG meta tags. Always update **both files** together when any OG tag changes (og:image, og:url, og:title, og:description, etc.).
| `wc2026_france.html` | France departments choropleth page |
| `wc2026_live.html` | Live game tracking page (Socket.IO, backend-dependent) |
| `wc2026_elo_ranking.html` | Standalone Elo ranking page |
| `guide.html` | User guide page |
| `js/wc2026_map.js` | ES module — D3 rendering, zoom, tooltips (lit-html), filter sidebar, Elo tab, dim/arc logic |
| `js/auth-bar.js` | ES module — `<mundial-auth-bar>` Web Component: navbar, auth, offline modal, WebSocket reconnection (lit-html + unsafeHTML) |
| `js/wc2026_elo_ranking.js` | ES module — `<elo-ranking>` Web Component + pill helpers |
| `js/control_sidebar.js` | ES module — filter/sort sidebar logic (imported by `wc2026_map.js`) |
| `js/i18n.js` | ES module — language detection, `T` strings (map + auth-bar + live-game), `countryName()`, `regionName()`, `wikiUrl()` |
| `js/qualified.js` | ES module — `QUALIFIED_NAMES`, `QUALIFIED_BY_NAME`, `buildEloItems` |
| `css/wc2026_map.css` | All custom styles (map, header, legend, tooltips, Elo list, filter table) |
| `css/taxonomy.css` | Canonical pill styling (borders, text colors, dots via CSS) |
| `css/control-sidebar.css` | Filter/sort sidebar styles |
| `css/map-container.css` | Map container and dim-mode cursor styles |
| `data/` | Git submodule → `mundial-data` repo. Contains all pipeline-generated data: `wc2026_map_data.json`, `wc2026_elo_rank.json`, `wc2026_elo_history.json`, `countries.json`, `uk-nations.geojson`, `wc2026_gdp.json`, `wc2026_gdp_pc_ppp.json`, `wc2026_hdi.json` |
| `wc2026_og_v4.png` | 2400×1260 Open Graph preview image for LinkedIn/social (2x resolution, France tooltip) |
| `chains/` | Export chain infographics — see section below |
| `pages/` | Standalone analysis pages (correlation scatter plot, Elo history bar chart race) |
| `backend_config.json` | ngrok URL for production backend — auto-updated by `mundial-server/start.sh` |

---

## Frontend stack

All dependencies served from a single CDN — **jsDelivr** (`cdn.jsdelivr.net/npm/`):

| Package | Version | Purpose |
|---|---|---|
| `d3` | 7.8.5 | Map rendering, zoom, D3 data joins |
| `topojson-client` | 3.1.0 | GeoJSON feature/mesh extraction |
| `bootstrap` | 5.3.3 | Responsive layout utilities — **planned: replace with custom Bootstrap build, no hand-written CSS** |
| `circle-flags` | 2 | Circular flag SVGs (map flags, tooltip headers) |
| `flag-icons` | 7 | 4×3 rectangular flag SVGs (player lists, player table) — handles subdivision codes (`gb-eng` etc.) |
| `lit-html` | 3 | HTML templating — **all** dynamic HTML must use lit-html (`html` + `render`), never `innerHTML` with string concatenation |
| `iso-3166-1` | 2 | ISO 3166-1 lookups used by `i18n.js` → `countryName()` (ESM, loaded via jsDelivr) |
| `socket.io-client` | 4 | WebSocket client — loaded dynamically by `auth-bar.js` for real-time auth events and by `wc2026_live.html` for live match updates |
| `world-atlas` | 2 | 110m TopoJSON world map fetched at runtime by `wc2026_map.js` |

`wc2026_map.js` is loaded as `<script type="module">` so it can use the `import` statement at the top.

---

## Running locally

The map uses `fetch()` so it requires a local HTTP server — **will not work from `file://`**.

**A server is already running on port 4040.** Use `http://localhost:4040/` directly — do not start a new one.

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

### Submodule workflow

After pulling, configure git to auto-update submodules:
```bash
git config submodule.recurse true
```

This eliminates manual `git submodule update` calls after each pull. The data submodule is automatically updated when new Elo rankings are published by the pipeline.

---

## Data pipeline

The data pipeline lives in the **[born-in-plays-for/mundial-build](https://github.com/born-in-plays-for/mundial-build)** repo (`../mundial-build` sibling directory). Pipeline scripts output JSON/CSV files to the `data/` submodule (the `mundial-data` repo), which is shared between `mundial` and `mundial-build`. See `mundial-build/pipeline/README.md` for full documentation.

### Automated data updates

**No manual steps required.** The workflow is fully automated:

1. **Daily**: Elo rankings are updated in `mundial-build` → published to `mundial-data` (see `mundial-build/README.md` for schedule details)
2. **Automatic dispatch**: `update-data-submodule` workflow is triggered (via repository_dispatch from mundial-build)
3. **Submodule updated**: Workflow fetches latest `mundial-data` and commits the pointer update
4. **Auto-deploy**: Workflow triggers GitHub Pages deployment via repository_dispatch
5. **Site live**: Pages redeploys with new data within minutes
6. **Local pull**: Developers simply `git pull` — submodules auto-update if `submodule.recurse = true`

### Deploy strategy and cache optimization

The `deploy-pages.yml` workflow is smart about when to use caching to balance speed vs. freshness:

| Trigger | Cache behavior | Deploy time | When |
|---------|---|---|---|
| **Push to main** (code-only) | Use cache | ~17-21s ⚡ | Frontend code changes, docs, config updates |
| **repository_dispatch** (from update-data-submodule) | Skip cache, fetch fresh | ~1m 40s | Daily Elo data updates (once per day) |
| **workflow_dispatch** (manual trigger) | Skip cache, fetch fresh | ~1m 40s | Manual refreshes when needed |

**How it works:** The workflow checks `github.event_name` at runtime:
- `push` events use the data submodule cache (fast, for code-only deploys)
- `repository_dispatch` and `workflow_dispatch` skip cache and fetch fresh submodule (ensures data is always current)

This means code changes deploy quickly (~20s) while data updates are always thorough (~1m 40s, only daily).

All frontend `fetch()` calls reference `data/` paths (e.g. `fetch('data/wc2026_map_data.json')`). Pages in `pages/` use `../data/` since they are one level deeper.

### Regenerating the OG image

```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=2)
    page.goto("https://mundial.cthiebaud.com/wc2026_map.html",
              wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(4000)
    page.evaluate('''() => {
        const path = document.querySelector('path[data-id="250"]');
        if (path) {
            const rect = path.getBoundingClientRect();
            const evt = new MouseEvent('mouseover', {
                bubbles: true, clientX: rect.x + 20, clientY: rect.y + 10
            });
            path.dispatchEvent(evt);
            path.dispatchEvent(new MouseEvent('mousemove', {
                bubbles: true, clientX: rect.x + 20, clientY: rect.y + 10
            }));
        }
    }''')
    page.wait_for_timeout(1500)
    page.screenshot(path="wc2026_og_v4.png")
    browser.close()
```

---

## lit-html architecture

**All dynamic HTML generation must use lit-html** — `html` tagged templates + `render()` call. Never use `innerHTML` with string concatenation or template literals. This applies everywhere: tooltips, player table, auth bar, modals, any component that produces HTML from data. For raw HTML/SVG strings that cannot be expressed as lit-html templates (e.g. inline SVG icon constants), use the `unsafeHTML` directive from `lit-html/directives/unsafe-html.js`.

The pattern is: compute all data variables first (aligned), then a single `render(html\`...\`, container)` call. **Never use `textContent = ''` or `innerHTML = ''` on a container managed by lit-html** — it destroys lit-html's internal marker nodes and the next `render()` will crash. To swap a container's content entirely, replace the element with `cloneNode(false)` and render into the fresh clone.

Key helpers (module-level, return `TemplateResult` or `nothing`):
- `popTag(pop)` — renders `<span class="tt-pop">pop. xM</span>` with locale-aware decimal separator, or `nothing`
- `flagImg(code)` — renders `<img class="tt-flag" src="...">` (circle-flags CDN), or `nothing`
- `ptWikiRow(p)` — renders a player name with optional Wikipedia link in the UI language

Tooltip functions (all module-level, access `app.pop` via the `app` object):
- `buildImportColHtml(countryId)` → `TemplateResult` (reusable import column)
- `showQualifiedTip`, `showExportTip`, `showImportTip`, `showImportSourceTip`, `showCombinedTip` — each calls `render(html\`...\`, tt)`

Player table:
- `playerTableTemplate(sourceId)` — module-level pure function, returns `TemplateResult`
- Called in `applySelection` via `render(playerTableTemplate(sourceId), ptEl)` — replaces the old 70-line imperative DOM block
- Import section rendered conditionally via `${importPlayers.length > 0 ? html\`...\` : nothing}` — no `style.display` toggling

"More players" ellipsis:
- Player rows are wrapped in `<div class="tt-players [tt-more]">`
- CSS `::after` on `.tt-players.tt-more` renders the `…` — no sibling div needed

`lastTipKey` is kept as a computation guard (skip recompute on same-country mousemove); lit-html handles DOM efficiency on the render side.

---

## Key architecture decisions

### UK home nations (no "United Kingdom")
The four home nations (England, Scotland, Wales, Northern Ireland) are handled as fully independent entities:
- `wc2026_players.csv` birth countries: all resolved from city lookup — no "United Kingdom" entries
- Synthetic IDs (no ISO 3166-1 numeric): `8260=England`, `8261=Scotland`, `8262=Wales`, `8263=Northern Ireland`
- ISO2 flag codes: `gb-eng`, `gb-sct`, `gb-wls`, `gb-nir`
- Map rendering: world atlas feature 826 (UK) is **skipped** (flags are filtered by `_eloItemsById.has(id)` — only countries in the Elo rankings get a flag); `data/uk-nations.geojson` renders the 4 nations as separate polygons
- All 4 UK nations render their flag on the map — the UK nation filter covers all four: `f._id === 8260 || f._id === 8261 || f._id === 8262 || f._id === 8263`
- Scotland centroid manually overridden to `[-4.2, 56.8]` (island bias in auto-centroid)
- All flags (qualified + non-qualified) placed in a single `forEach` loop filtered by Elo membership
- Population + capital patched via `pipeline/patch_uk_nations.py` (Wikidata SPARQL for capitals, 2021/22 census populations); stored in `data/countries.json` under keys `"8260"`–`"8263"` with alpha2 as the lookup key

### Kosovo (id=383)
Kosovo is absent from the `iso-3166-1` npm package's numeric table and may be absent from `Intl.DisplayNames`. Special handling:
- Assigned numeric id `383` (widely-used user-assigned value), alpha-2 `xk`
- World-atlas 110m topojson has a Kosovo geometry with `{properties:{name:'Kosovo'}}` but **no `id` field** → patched at the top of `renderWorld` before any `topojson.feature()` calls:
  ```js
  const _topoNameToId = { Kosovo: 383 };
  world.objects.countries.geometries.forEach(g => {
    if (!g.id) { const mapped = _topoNameToId[g.properties?.name]; if (mapped) g.id = mapped; }
  });
  ```
- `ISO2` map has `383: 'xk'` so `iso2ForId(383)` returns `'xk'`
- `i18n.js _OVERRIDE` has `383: { fr:'Kosovo', de:'Kosovo', it:'Kosovo', es:'Kosovo', en:'Kosovo' }` — bypasses all ISO lookups
- Added to `data/wc2026_elo_rank.json` rankings with `rank: null, pts: null, fifaMember: true` (not on eloratings.net)
- Patched via `pipeline/patch_kosovo.py` (Wikidata SPARQL for Pristina translations, World Bank 2022 population)

### Small island countries (standalone flags)
Cape Verde (id=132) and Curaçao (id=531) don't appear reliably in the 110m topojson — placed manually via `STANDALONE_FLAGS` array with explicit lon/lat.

### Zoom-stable flags and arcs
All `.flag-qualified` images store `data-cx`/`data-cy` (SVG centroid coordinates). Arc `path` and `polygon` elements store `data-sw` (base stroke-width), `data-sx`/`data-sy` (source centroid), and `data-tx`/`data-ty` (target centroid). The zoom handler reads these attributes to rescale flags and recompute arc geometry at any zoom level, keeping both visually consistent.

### i18n
UI language follows the browser locale (`navigator.languages[0]`). Supported: `fr`, `de`, `it`, `es`, `en` (fallback). Country names are resolved by `countryName()` in `i18n.js` using `Intl.DisplayNames` (backed by the `iso-3166-1` npm package for alpha-2 lookups). A small `_OVERRIDE` map handles non-standard cases (UK home nations use subdivision codes `gb-eng` etc., historical states with no ISO code). `T` is the already-resolved label object for the active language — it is not a nested object keyed by language; the internal `_LANG` variable selects the entry at module load time. Static page elements (`<title>`, `<h1>`, etc.) are patched from JS at load time.

i18n is extracted into **`i18n.js`** (ES module imported by `wc2026_map.js`, `auth-bar.js`, and `wc2026_live.html`). It exports `LOCALE`, `_LANG`, `T`, `countryName`, `regionName`, and `wikiUrl`. `T` contains all UI strings: map labels, tooltips, navbar titles (`navHome`, `navLive`, `navSignIn`, etc.), offline modal text (`offlineTitle`, `offlineBody`, etc.), and live-game strings (`liveTitle`, `liveRetrying`, `liveNoBackend`, etc.). Wikipedia links are provided for `en`, `fr`, `de`, `it`, `es`; all other browser locales fall back to the English Wikipedia URL without an `(en)` suffix.

**Gotcha — non-breaking spaces in i18n strings:** French typography uses non-breaking spaces in several places — `\xa0` (regular non-breaking space) before `": Wikipedia"` in `pageSub`, and ` ` (narrow no-break space) at the start of `pageHeadingSub` strings. The Edit tool matches bytes literally and will silently fail if the search string uses a regular space instead. **Always use a Python script** (`open(...).read()` / `str.replace()` / `open(...).write()`) when editing i18n strings in `i18n.js`, and verify suspicious characters with `python3 -c "print(repr(line))"` first.

### Tooltip — variants and layout
Tooltips are **disabled on mobile** (`/Mobi/i` UA check). On desktop, hovering a country dispatches to one of five functions:

| Function | Trigger |
|---|---|
| `showExportTip` | Any country where `app.byId[id].count > 0` (exports players) — qualified or not |
| `showQualifiedTip` | Qualified country with no exports |
| `showCombinedTip` | Dim mode: country is both a dim destination and an import source |
| `showImportTip` | Dim mode: hovering a destination flag |
| `showImportSourceTip` | Dim mode: hovering a birth-country source flag |

**`showExportTip` layout:** Non-qualified birth countries show the country name with a *not qualified* badge (`tt-non-qualified` class on `#tooltip`). Qualified countries with both exports and imports render a two-column layout:
- **Left column**: raw export count + ratio/million + destination nations + top 5 players with `→ destination`
- **Right column**: raw import count + birth countries + top 5 players sorted by caps with `← birth country`

Collapses to a single column when the import side is empty.

Every tooltip header shows `[flag] Country name` left-aligned and `pop. xM` right-aligned on the same row. Population uses `Intl.toLocaleString(LOCALE, …)` for locale-aware decimal separators.

`app.importByCountry` (property of the module-level `app` object, populated on data load) maps each qualified country ID to the list of imported players. Self-import is excluded by comparing `countryName()` output for birth country and squad country — this catches name-mismatch cases like DR Congo (`id=null`, name="Democratic Republic of the Congo") vs. qualified country 180 ("DR Congo").

### Wikipedia links in player table
Players in the dim-mode table link to their Wikipedia page in the UI language when available, with `(en)` fallback link otherwise. `wiki_langs: {en, fr?, de?, it?, es?}` is stored per player in the JSON and populated by `add_wiki_urls.py`.

### Fixed header + map architecture
The page uses two fixed elements:
- **`#page-header`** (`position: fixed; top: 0; z-index: 200`): CSS grid with two overlapping `grid-row:1 grid-column:1` children — `#page-heading-sub` (quote + legend) on the left, `#sidebar-host / #control-sidebar` on the right (justified-end). Row height = tallest child.
- **`#map-container`** (`position: fixed !important; top: var(--page-header-h)`): sits immediately below the header. `!important` is required to override Bootstrap's `.position-relative`.
- **`body.paddingTop`** is set by JS (`_syncPaddingTop`), measuring `map-container.getBoundingClientRect().bottom` — **not** a CSS formula. A `resize` listener keeps it in sync. Do not add a CSS `padding-top` to body; it will conflict.
- **`--page-header-h`** CSS variable is set once after measuring `_pageHeader.offsetHeight` (forces reflow) so the map's `top` is pixel-accurate.

### Legend
The legend (`#legend`) lives as the third child of `#page-heading-sub`, bottom-aligned via `mt-auto` on a `d-flex flex-column h-100` wrapper.
- **Gradient direction**: `linear-gradient(to left, …)` — **high values (dark) on the left, 0 on the right**. Ticks read: `66 · 55 · 35 · 15 · 0`.
- **Outlier**: France (id=250) is off-scale, rendered black (`#000`), shown as a standalone dot to the left of the gradient bar.
- On narrow screens (`max-width: 767.98px`), the bar and ticks shrink to 90px.

### Mobile layout (`@media (max-width: 767.98px)`)
Legend bar/ticks shrink to 90px. The fixed header and map are always present on all screen sizes.

### Mobile portrait sticky layout (`@media (max-width: 767.98px) and (orientation: portrait)`)
On portrait mobile only (landscape and desktop are unaffected):
- **Tab bar fixed at bottom**: `#bottomTabList` gets `position: fixed !important; bottom: 0; left: 0; right: 0` so the navigation stays visible while the tab content scrolls freely above it.
- **Bottom clearance**: `body { padding-bottom: 48px }` prevents the last line of tab content from being hidden behind the fixed tab bar.

### Player table
Shown below the map in dim mode. Structure rendered by `playerTableTemplate` via lit-html:
- Header row: `[flag] Country` left + `pop. xM` right
- Export section (bordered top): count heading + grouped player rows by destination nation
- Natives section (conditional): players born there playing for that same country (`app.nativeByCountry`)
- Import section (bordered top, conditional): count heading + grouped player rows by birth country
- Player names link to Wikipedia in the UI language when `wiki_langs` data is available

### Auth bar (`<mundial-auth-bar>`)
`js/auth-bar.js` defines a custom element loaded as `<script type="module">` on every page. It renders a fixed 32px navbar with navigation icons (home, france, live game) and an auth section (sign-in/sign-out/admin). All HTML generation uses lit-html `render()` + `html` templates; SVG icons use the `unsafeHTML` directive.

**Backend connection flow:**
1. On load, the auth section is hidden (`visibility: hidden`), navigation is visible immediately
2. `_init()` resolves the backend URL and does a health check (`/api/auth/me`)
3. On success: renders the auth section with sign-in/sign-out callbacks, restores session from localStorage
4. On failure: shows offline state (warning + WhatsApp icons, beige background), starts a 30s retry loop
5. When backend comes back: `_restoreAuthSection()` swaps a fresh container via `cloneNode(false)` and re-renders with callbacks

**Centralized backend connection:** The auth bar is the **single owner** of the Socket.IO connection and backend URL. It exposes `this.BACKEND` and `this.socket` as public properties. Other pages consume the connection via custom events — they never create their own Socket.IO instance or resolve the backend URL independently.

**Custom events dispatched:**
- `auth-bar-ready` `{ detail: { backend } }` — backend URL resolved, auth section visible (socket may still be loading)
- `auth-bar-online` `{ detail: { socket, backend } }` — WebSocket connected (first connect or reconnect after offline)
- `auth-bar-offline` `{ detail: { reason } }` — backend unreachable (initial failure, or 5s after WebSocket disconnect)

**Consumer pattern** (used by `wc2026_live.html`): wait for `auth-bar-online` to get `{ socket, backend }`, subscribe to socket events (`poll_status`, `live_update`), listen for `auth-bar-offline` to update UI. No duplicate health checks, no duplicate Socket.IO client.

**WebSocket lifecycle:** After successful init, loads `socket.io-client@4` dynamically. On disconnect, waits 5s then switches to offline mode. On reconnect, restores auth section and refreshes user session.

**Sibling offset:** `_offsetSibling()` sets `top: 32px` (fixed/sticky siblings) or `marginTop: 32px` (static siblings) on the next element to account for the fixed navbar.

### Elo ranking tab and filter sidebar
The **Elo ranking** tab (default active) shows all countries as pill badges, rendered by the `<elo-ranking>` Web Component (`js/wc2026_elo_ranking.js`). Countries are filtered by the sidebar cube (`qualified × importer × exporter`); clicking a badge activates dim mode; clicking the active badge clears it.

**Three-tier pill interaction model:**
- `enablesDim(id)` → `true`: badge is `elo-item--clickable` (dark, `#888` label). Click activates dim + arc mode.
- `!enablesDim(id) && !!centroids[id]` → badge is `elo-item--zoomable` (stays `#bbb`, cursor:pointer + hover tint). Click calls `zoomToCentroid(id)` — pans/zooms the map to that country's SVG centroid without activating dim.
- neither → badge is inert (no cursor change, no interaction).

`zoomToCentroid(id)` reads `centroids[id]` (SVG centroid coordinates populated by `renderWorld`), computes a k=8 zoom transform centered on that country, and applies it with a 600ms transition. All map click handlers also call `zoomToCentroid` for countries where `!enablesDim(id)` (instead of opening dim mode).

**Critical ordering**: `_renderElo()` must be called **after** `buildIndices(rawData)` in the `Promise.all` callback. If called before (e.g. when the Elo JSON loads first), `app.byId` is empty, non-qualified exporters get wrongly bucketed as category `'o'` (filtered out by default), and `enablesDim()` returns false for all items (nothing clickable).

The filter sidebar's natural height is measured before its first collapse (`classList.remove('collapsed') → scrollHeight → classList.add('collapsed')`), stored in `--csb-h`, which drives the toggle button's `min-height`. The actual header height (`--page-header-h`) is measured separately via `offsetHeight`.

### Dim / arc mode
- Left-click any country on the map or in the Elo list where `enablesDim()` returns true → dims all qualified country flags except relevant ones; draws curved arcs with √count-scaled width; shows player table below map
- Clicking the **same** active Elo item again → clears dim
- Any other map click → clears dim (or `zoomToCentroid` if the country is zoomable)
- `dimState.active` flag prevents tooltip from reappearing during dim
- `dimState.k` tracks current zoom scale so arcs are redrawn at correct size on zoom
- `_zoomToActiveDimFlags` two-stage animation: stage 1 (source country) maxK=9 / duration=1200ms; stage 2 (linked flags) Math.max(1, Math.min(9, …)) / k2=9 fallback / duration=1500ms

### Render ordering in renderWorld
Order matters for SVG z-layering:
1. World choropleth paths (skip 826)
2. Mesh borders
3. UK nation paths (from `data/uk-nations.geojson`)
4. `arcsGroup` (below all flags)
5. Leader lines (ocean-clipped)
6. All flags via unified `forEach` (filtered by `_eloItemsById`)
7. Standalone dots + flags (Cape Verde, Curaçao)
8. UK nation flags

### `wc2026_live.html` — live game page architecture

The live game page is a self-contained HTML file using plain ES module script (no lit-html — dynamic HTML uses template literals and `innerHTML`). It consumes the auth bar's Socket.IO connection via `auth-bar-online` / `auth-bar-offline` events.

**Admin panel access**

An admin-only settings icon appears in the header (right side, next to the WebSocket status) when the signed-in user has `admin: true`. It links to the backend `/admin` page (fixtures & discovery controls). The user's profile picture (in the navbar) links to `/admin-auth` (users & sessions).

**Badge / poll status**

Three states, driven by `discovering` only. The server's auto-track on/off is an internal detail never sent to clients.

| State | Condition | Badge |
|---|---|---|
| Live | `discovering && knownFixtures > 0` | green "live" |
| Listening | `discovering && knownFixtures === 0` | blue "à l'écoute" |
| Deaf & mute | `!discovering` | yellow warning |

`poll_status` socket event shape: `{ discovering, fixtures, wc_only }` — `tracking` field was removed in backend refactor (June 2026). Frontend no longer reads or destructures it.

**Untracked fixtures**

Each fixture in `live_update` carries a `_tracked: bool` flag set by the server. Untracked fixtures are:
- Dimmed (50% opacity)
- Events and statistics accordion items hidden via `d-none` (not removed — gentler, more robust)
- Compositions accordion always shown (stable data even without live tracking)

**Curaçao flag**

`flagCode()` has an explicit `'Curaçao': 'cw'` mapping to prevent the generic 2-char fallback from returning `'cu'` (Cuba).

**Player lookup — team-scoped only**

At load time, `wc2026_map_data.json` is fetched and two per-team indexes are built:
- `_teamWiki[teamName]` → `{ exact, norm, lastName }` — maps player names to `wiki_langs`
- `_teamBC[teamName]` → `{ lastName → birthCountry }` — maps last names to birth country

Export players (`mapData.data[].players`) are indexed under `p.nation` (the squad country). Native players (`mapData.natives[country]` — players born AND playing for the same country) are indexed under `country`.

`getBirthCountry(apiName, teamName)` and `getWikiLangs(apiName, teamName)` search **only within `_teamBC[teamName]` / `_teamWiki[teamName]`** — there is no global fallback. When team is known, a "Smith" on Sweden's team will only match Swedish players named Smith, never a different Smith from another team. Both functions try exact name → normalized name → last name within the team's index, in that order.

Global `_exactBC` / `_normBC` maps are also built (for exact/normalized full-name matches within `getBirthCountry`) but the last-name fallback is strictly team-scoped.

**`mapData.natives` structure**

Top-level key in `wc2026_map_data.json` alongside `data`, `pop`, `capital`. Shape:
```json
{ "Sweden": [{ "name": "Eric Smith", "caps": 1, "wiki_langs": { "en": "...", "fr": "..." } }] }
```
Keys are country names (matching `p.nation` in export records). These players have no "born in" flag since birth country = squad country, but they do get Wikipedia links.

**Accordion and UI behaviour**
- Events and stats accordion items are always rendered for tracked fixtures, even when the API hasn't sent data yet — they just appear empty. Only untracked fixtures hide these sections.
- Untracked fixtures are visually dimmed (50% opacity in match view, dashed border on selector pill).
- `renderGroupResults` only renders finished matches (`FT`, `AET`, `PEN`) — future and live fixtures are excluded to avoid showing placeholder scores.
- `poll_status` socket event shape: `{ discovering, fixtures: {} }` where `fixtures` is an object keyed by fixture id (not an array). `tracking` is intentionally absent — see `../mundial-server/CLAUDE.md` for the rationale.

### `data/countries.json` — population + capital lookup
`data/countries.json` (in the `mundial-data` submodule) is the canonical source for population and multilingual capital city names. Shape:
```json
{ "250": { "id": 250, "alpha2": "fr", "alpha3": "fra", "name": "France",
           "capital": {"en":"Paris","fr":"Paris","de":"Paris","it":"Parigi","es":"París"},
           "population": 68374591 } }
```
Keys are ISO numeric ids (strings). Special entries: `"8260"`–`"8263"` (UK home nations, alpha2 = `gb-eng` etc.) and `"383"` (Kosovo, alpha2 = `xk`). The pipeline reads this file in `build_json.py` to populate `pop` and `capital` in `data/wc2026_map_data.json` (looked up by lowercase alpha2).

Generated by: `pipeline/fetch_countries.py` (mledoze + World Bank + Wikidata). Post-patched by `pipeline/patch_uk_nations.py` and `pipeline/patch_kosovo.py`.

---

## LinkedIn video — chains/

**`chains/VIDEO_BRIEF.md`** contains the complete production brief for a LinkedIn video built around the longest chain.

Concept (two acts):
1. **Puzzle act** (fast): flash all 37 player photos with names → question "what do they have in common?"
2. **Narrative act** (slow): three-panel layout (map | chain snake | player card), one step per player, map zooms to birth country then plays-for country with arc animation.

Files to create (not yet done):
- `chains/wc2026_chain_video.html` — 1920×1080 animated HTML
- `pipeline/fetch_chain_photos.py` — Wikidata P18 photo downloader → `chains/player_photos/`
- `chains/record_chain_video.py` — Playwright recorder → MP4

---

## Terminology

Always use **"country"** (or "pays", "Land", "paese", "país") instead of "nation" in all user-facing text and code. The Elo rankings include entities that are not nations (territories, dependencies, etc.).

---

## Documentation & key locations

| File | Purpose |
|------|---------|
| `CLAUDE.md` (this file) | Frontend project instructions — architecture, components, i18n, deployment |
| `README.md` | Frontend setup guide — running locally, tech stack, repository links |
| `../.github/profile/README.md` | Organization overview — CI/GitHub Actions workflow across all repos |
| `../mundial-server/CLAUDE.md` | Backend project instructions (in that repo) |

The organization README at `../.github/profile/README.md` documents the cross-repo CI pipeline and is the single source of truth for the entire GitHub Actions workflow (Elo updates, data submodule, GitHub Pages deploy).

---

## Git / deployment

**NEVER commit or push unless the user explicitly asks.** Do not commit after making changes — wait for the user to test first. The user will say "commit and push" when ready. Never ask "ready to commit?" either.

**When asked to "commit and push", only commit and push this repo (`born-in-plays-for/mundial`). Never touch `born-in-plays-for/mundial-server` or `aequologica.github.io` unless explicitly asked.**

```bash
# This repo only
git add <files> && git commit -m "..." && git push
```

The live site is served from the `born-in-plays-for/mundial` repo at **https://mundial.cthiebaud.com/** via GitHub Pages.

The backend (`born-in-plays-for/mundial-server`) runs locally and is exposed via ngrok. It is **not** deployed to GitHub Pages. See `../mundial-server/CLAUDE.md` and `../mundial-server/README.md` for backend setup, endpoints, and design decisions.

`backend_config.json` is the only file in this repo that the backend touches — `mundial-server/start.sh` updates it with the ngrok URL and pushes.

`aequologica.cthiebaud.com/mundial/` is a static redirect page — it redirects to `https://mundial.cthiebaud.com/` and requires no further maintenance.

After deploying, re-scrape LinkedIn preview:
**https://www.linkedin.com/post-inspector/**

### CI — deploy-pages.yml cache key

The Pages deploy workflow caches the `data/` submodule. The cache key uses the **actual submodule commit SHA** via `git rev-parse HEAD:data` — do not replace this with `hashFiles('data')`, which always returns the same hash when the submodule is uninitialized (empty directory after checkout without `submodules: true`), causing the cache to never invalidate after daily Elo updates.

---

## Infographic chain files (`chains/`)

Requires a local server (same `fetch()` constraint as the map).

| File | Purpose |
|---|---|
| `wc2026_chain_longest.html` | Snake renderer — loads any chain JSON via `?data=<file>`, default: `subgraphs/longest_both.json` |
| `wc2026_chain_render.js` | Shared chain SVG renderer (ES module, used by map + longest.html) |
| `wc2026_chain_loop.json` | Bosnia ⇄ Croatia mutual cycle (bidirectional export edge case) |
| `subgraphs/` | Longest paths by direction (fwd/bwd/both) + OR-Tools script — see `subgraphs/README.md` |
| `VIDEO_BRIEF.md` | Handoff brief for the LinkedIn video production |
