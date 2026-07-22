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

**Submodule ownership:** `mundial-build` is the **write owner** of `data/` — the pipeline commits new data there directly (the submodule is checked out on `main`, not detached HEAD). `mundial` is the **read path** — it holds a pointer to a specific `mundial-data` commit and treats `data/` as read-only. The submodule exists in `mundial` purely to avoid sparse-checkout complexity; it is never written to from this repo.

---

## File structure

| File | Purpose |
|---|---|
| `index.html` | Entry point — redirects to the map, carries OG meta tags |
| `wc2026_map.html` | Main map page (Bootstrap 5, loads JS + JSON via ES module) |

**OG tags:** Both `index.html` and `wc2026_map.html` carry identical OG meta tags. Always update **both files** together when any OG tag changes (og:image, og:url, og:title, og:description, etc.).
| `wc2026_live.html` | Live game tracking page (Socket.IO, backend-dependent) |
| `js/wc2026_map.js` | ES module — D3 rendering, zoom, tooltips (lit-html), filter sidebar, Elo tab, dim/arc logic |
| `js/auth-bar.js` | ES module — `<mundial-auth-bar>` Web Component: navbar, auth, offline modal, WebSocket reconnection (lit-html + unsafeHTML) |
| `js/elo_ranking.js` | ES module — `<elo-ranking>` Web Component, pill helpers, `initEloRanking` wiring helper |
| `js/control_sidebar.js` | ES module — filter/sort sidebar logic (imported by `wc2026_map.js`) |
| `js/i18n.js` | ES module — language detection, `T` strings (map + auth-bar + live-game), `countryName()`, `regionName()`, `wikiUrl()` |
| `js/qualified.js` | ES module — `QUALIFIED_NAMES`, `QUALIFIED_BY_NAME`, `buildEloItems`, tournament-stage helpers (`ELIM_ROUNDS`, `CAROUSEL_STAGES`, `reachesStage`, `buildBracketState`) |
| `css/wc2026_map.css` | All custom styles (map, header, legend, tooltips, Elo list, filter table) |
| `css/taxonomy.css` | Canonical pill styling (borders, text colors, dots via CSS) |
| `css/control-sidebar.css` | Filter/sort sidebar styles |
| `css/map-container.css` | Map container and dim-mode cursor styles |
| `data/` | Git submodule → `mundial-data` repo. Contains only frontend-consumed data, nothing pipeline-internal: `data/v2/` (pid-keyed frontend files: `map.json`, `live.json`, `wiki_<lang>.json` ×5, `status.json` — tournament elimination status), `elo_rank.json`, `uk-nations.geojson`. (`r32_teams.json` was removed — superseded by `v2/live.json`'s `teams` key. `countries.json` moved out to `mundial-build/pipeline/countries.json` — a pipeline build input, never a frontend asset.) |
| `wc2026_og_v7.jpg` | 4320×2430 Open Graph preview image for LinkedIn/social — France dim/arc mode + tooltip (1440×810 viewport, dpr=3). Regenerate with `tools/regenerate_og_image.py` — **never hand-roll this script inline**, see that section below. |
| `chains/` | Export chain infographics — see section below |
| `pages/` | Standalone analysis pages (correlation scatter plot, Elo history bar chart race) |
| `insights/discipline.html` | Standalone fouls/cards table, one row per team, with the same stage carousel widget (`js/stage_carousel.js`) as `<elo-ranking>`. Reads `data/v2/discipline.json` (iso2-keyed). Restored from the "drop nice-to-have pages" cleanup — the only one of that batch whose feature (fouls/cards discipline stats) has no equivalent anywhere in `wc2026_map.html`, unlike the others below. |
| `backend_config.json` | ngrok URL for production backend — auto-updated by `mundial-server/start.sh` |

**Retired pages:** `wc2026_countries.html`, `wc2026_players.html` (and its own sidebar module,
`js/players_sidebar.js`), `control-sidebar-test.html`, and `insights/france.html` / `status.html` /
`heat-map.html` (and its own KDE module, `js/kde_layer.js`) / `taxonomy.html` have all been
removed — their functionality is superseded by `wc2026_map.html`'s own
tab-teams/tab-tournament/tab-players. They may be rebuilt later under `insights/` against the
current, de-duplicated codebase; until then, don't assume any of these files/pages still exist.

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

The `deploy-pages.yml` workflow caches the `data/` submodule by its commit SHA. All event types participate in both cache restore and cache save:

| Trigger | Cache behavior | Deploy time | When |
|---------|---|---|---|
| **Push to main** (same data SHA) | Cache hit → skip fetch | ~20s ⚡ | Frontend code changes, docs, config updates |
| **repository_dispatch** (new data SHA) | Cache miss → fetch fresh → save cache | ~1m 40s | Daily Elo data updates (once per day) |
| **Push to main** (first push after data update) | Cache hit (warmed by dispatch run) | ~20s ⚡ | Code changes immediately after a data update |
| **workflow_dispatch** | Cache hit or miss depending on SHA | ~20s or ~1m 40s | Manual refreshes |

**How it works:** The cache key is `data-<SHA>` where SHA = `git rev-parse HEAD:data`. A new data SHA always produces a cache miss → fresh fetch → cache saved. Subsequent runs with the same SHA hit the cache immediately, regardless of what triggered the deploy. No event-type branching: freshness is guaranteed by the SHA key itself.

All frontend `fetch()` calls reference `data/` paths (e.g. `fetch('data/v2/map.json')`). Pages in `insights/` use `../data/` since they are one level deeper.

### Regenerating the OG image

Run **`tools/regenerate_og_image.py`** (requires `http://localhost:4040/` — the local dev server, see "Running locally" above). This is the single source of truth for the generation recipe — do not recreate the Playwright script inline from memory or from an old CLAUDE.md diff; past regenerations have silently regressed resolution/quality that way (see script docstring for the incident history: v5 shipped at dpr=1 and looked soft, fixed at dpr=2 in commit `fbab53d`; the same blurriness recurred on the Facebook Sharing Debugger at dpr=2 and was fixed again at dpr=3 for v7).

```bash
python3 tools/regenerate_og_image.py v8   # bump the version each time
```

Output: 4320×2430 JPEG (1440×810 viewport × device_scale_factor=3, quality=95). The script clicks the France flag to activate dim/arc mode and hovers the France path center to show the combined tooltip, matching the composition documented in the "Key architecture decisions" quote-of-the-day / dim-arc sections above.

After running it, by hand:
1. Update `og:image` / `og:image:url` / `og:image:secure_url` / `og:image:width` / `og:image:height` in **both** `index.html` and `wc2026_map.html`
2. `git rm` the previous `wc2026_og_v<N-1>.jpg`
3. After deploy, re-scrape the previews:
   - **LinkedIn**: https://www.linkedin.com/post-inspector/
   - **Facebook**: https://developers.facebook.com/tools/debug/

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
- Population + capital patched via `pipeline/patch_uk_nations.py` (Wikidata SPARQL for capitals, 2021/22 census populations); stored in `mundial-build/pipeline/countries.json` under keys `"8260"`–`"8263"` with alpha2 as the lookup key (this file is a pipeline build input — it never ships in this repo's `data/` submodule; the pipeline bakes its pop/capital values into `data/v2/map.json`, which is what the frontend actually reads)

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
- Added to `data/elo_rank.json` rankings with `rank: null, pts: null, fifaMember: true` (not on eloratings.net)
- Patched via `pipeline/patch_kosovo.py` (Wikidata SPARQL for Pristina translations, World Bank 2022 population)

### Small island countries (standalone flags)
Cape Verde (id=132) and Curaçao (id=531) don't appear reliably in the 110m topojson — placed manually via `STANDALONE_FLAGS` array with explicit lon/lat.

### Zoom-stable flags and arcs
All `.flag-qualified` images store `data-cx`/`data-cy` (SVG centroid coordinates). Arc `path` and `polygon` elements store `data-sw` (base stroke-width), `data-sx`/`data-sy` (source centroid), and `data-tx`/`data-ty` (target centroid). The zoom handler reads these attributes to rescale flags and recompute arc geometry at any zoom level, keeping both visually consistent.

### i18n
UI language follows the browser locale (`navigator.languages[0]`). Supported: `fr`, `de`, `it`, `es`, `en` (fallback). Country names are resolved by `countryName()` in `i18n.js` using `Intl.DisplayNames` (backed by the `iso-3166-1` npm package for alpha-2 lookups). A small `_OVERRIDE` map handles non-standard cases (UK home nations use subdivision codes `gb-eng` etc., historical states with no ISO code). `T` is the already-resolved label object for the active language — it is not a nested object keyed by language; the internal `_LANG` variable selects the entry at module load time. Static page elements (`<title>`, `<h1>`, etc.) are patched from JS at load time.

i18n is extracted into **`i18n.js`** (ES module imported by `wc2026_map.js`, `auth-bar.js`, and `wc2026_live.html`). It exports `LOCALE`, `_LANG`, `T`, `countryName`, `regionName`, and `wikiUrl`. `T` contains all UI strings: map labels, tooltips, navbar titles (`navMap`, `navLive`, `navSignIn`, etc.), offline modal text (`offlineTitle`, `offlineBody`, etc.), and live-game strings (`liveTitle`, `liveRetrying`, `liveNoBackend`, etc.). Wikipedia links are provided for `en`, `fr`, `de`, `it`, `es`; all other browser locales fall back to the English Wikipedia URL without an `(en)` suffix.

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
Players in the dim-mode table link to their Wikipedia page in the UI language when available, with `(en)` fallback link otherwise. Each player/coach record carries a stable integer `pid` (assigned by mundial-build's relational model; the cross-file join key). The actual URL is resolved via `i18n.js`'s `loadWikiData()` / `wikiUrl()` / `wikiUrlEn()`: `loadWikiData()` fetches `data/v2/wiki_<lang>.json` for the active UI language (plus `v2/wiki_en.json` as a fallback tier when the UI language isn't English) — each file is `{ urlTemplate, titles }` where `titles` is an **array indexed by pid** (`null` = no article in that language), values pre-escaped and ready to substitute into `urlTemplate`. Only one or two of the five per-language files are ever fetched, never all five. ⚠ **pid 0 is valid** (Jordan Ayew) — guard pids with `!= null`, never truthiness.

### Fixed header + map architecture
The page uses two fixed elements:
- **`#page-header`** (`position: fixed; top: 0; z-index: 200`): CSS grid with two overlapping `grid-row:1 grid-column:1` children — `#page-heading-sub` (quote + legend) on the left, `#sidebar-host / #control-sidebar` on the right (justified-end). Row height = tallest child.
- **`#map-container`** (`position: fixed !important; top: var(--page-header-h)`): sits immediately below the header. `!important` is required to override Bootstrap's `.position-relative`.
- **`body.paddingTop`** is set by JS (`_syncPaddingTop`), measuring `map-container.getBoundingClientRect().bottom` — **not** a CSS formula. A `resize` listener keeps it in sync. Do not add a CSS `padding-top` to body; it will conflict.
- **`--page-header-h`** CSS variable is set once after measuring `_pageHeader.offsetHeight` (forces reflow) so the map's `top` is pixel-accurate.

### Map show/hide (`#map-toggle-bar` / `#map-collapse`)
The map can be collapsed via a full-width toggle bar (styled like the filter sidebar's `.csb-toggle`, but horizontal) sitting atop it, or Ctrl-M. This is a real Bootstrap `Collapse` (`#map-collapse`, `data-bs-toggle="collapse"` on the bar) — **not** a hand-rolled animation. `#map-container` itself stays `position:fixed` and is never touched by the collapse; only the inner `#map-collapse` wrapper (holding the `<world-map>`, legend, zoom controls) collapses, so `#map-container`'s own box just shrinks like any other resize and `_syncPaddingTop()` (above) keeps working unchanged.

- **Padding sync during the transition**: a single `_syncPaddingTop()` call per Bootstrap event isn't enough to track a ~350ms height animation smoothly — `wc2026_map.js` runs a `requestAnimationFrame` loop calling it every frame between `show.bs.collapse`/`hide.bs.collapse` and `shown.bs.collapse`/`hidden.bs.collapse`, so `#bottomTabContent` follows the collapsing edge in real time instead of jumping once the transition settles. Body's own `transition: padding-top 0.4s ease` (`css/wc2026_map.css`, for the unrelated single-shot `onSidebarToggle` path) is suspended for the duration — left on, it would double-animate against the per-frame writes and visibly lag behind.
- **Persistence**: a dedicated `localStorage` key (`mundial-map-collapsed`), independent of `control_sidebar.js`'s own combined state blob — the toggle lives outside the sidebar entirely now, so it isn't entangled with `hasMap`/sidebar save-restore (removed).
- **Landscape mobile** (`max-height:500px` + `orientation:landscape`, see below): the toggle bar is `display:none` — always-fullscreen-map mode leaves no room for `#bottomTabContent` as an alternative. If the map was left collapsed from portrait, `wc2026_map.js`'s resize listener force-`show()`s it on entering landscape (without touching the saved preference — a separate `_userWantsMapOpen` JS variable tracks what the user actually chose), and restores that real preference on the way back out to portrait.
- **Landscape gotcha — `#map-collapse` needs its own explicit `height:100%`**: `#map-container` gets a definite height there (`top:0;bottom:0`), and `#map` is `height:100% !important` — but percentage heights only resolve against an ancestor with a *definite* height, and the intermediate `#map-collapse` wrapper has none by default (content-driven/auto). Without the explicit override, `#map`'s `height:100%` silently falls back to its intrinsic aspect-ratio height, leaving it shorter than `#map-container`; `justify-content:center` on `#map-container` then splits the leftover space equally above/below `#map` — visible in DevTools' flex overlay as violet bands that look like padding but are actually just unclaimed flex space.
- **`preserveAspectRatio="xMidYMid slice"`** on the map SVG (set once in `map-container.js`'s `WorldMap.connectedCallback`) — the `object-fit:cover` equivalent for SVG: crops overflow to fill its box instead of the default `"meet"` behavior (letterboxing). Only has a visible effect in landscape, where `#map` is forced to `100%/100%` of a box with its own unrelated aspect ratio; in normal layout `#map` is `width:100%;height:auto`, so its box already matches the viewBox's aspect ratio exactly (nothing to crop).

### Map color themes
`js/map-container.js`'s `THEMES` registry (`earthy`, `violet`, `forest`) is not just three palettes on the same number — each theme is its own lens on the data:
- **`ramp`** — the 7-stop light→dark hex sequence fed to `d3.interpolateRgbBasis`.
- **`ease`** — exponent for `normalize()` (`(value / ratioMax) ** ease`), default 2 (quadratic) if omitted. `earthy`/`forest` use `1.4`: the default quadratic curve stays pale for most of the range and only darkens near `ratioMax`, which — given most countries cluster low-to-mid on any of these metrics — made the bulk of the map read as a uniform pale blob. Lowering the exponent reaches the darker/mid ramp stops sooner, so the transition reads more gradual instead of snapping pale almost immediately. `violet` keeps the untouched default.
- **`metric(rec)`** — which number a country is colored by, computed from its `app.byId[id]` record (see `buildIndices()` in `wc2026_map.js` for exactly which fields exist: `count` export, `nativeCount`, `importCount`, `totalCount`). Each theme currently visualizes a different question:
  - `forest` → `count` (exports only) — players born here, playing elsewhere. The site's original pre-theme-system metric.
  - `earthy` → `importCount` — players born elsewhere, now playing for this country.
  - `violet` → `max(0, count + nativeCount − importCount)` — net talent balance (home-grown contribution minus imports). Can go negative (net importers, e.g. Curaçao) — currently clamped to 0, which reads identically to "no data"; a real fix is a diverging scale (two hues either side of a neutral midpoint) rather than clamping, left for later.
- **`ratioMax`** — that metric's own 2nd-highest value, i.e. the domain max for `normalize()`, after excluding `outlierIds`. **Not shared across themes** — imports top out around 26 (Curaçao), exports around 81 (France), the combo metric around 102 (France) — using one theme's ceiling for another would over- or under-saturate everything. Bump it whenever that 2nd place grows past the current ceiling, or a country silently clamps to the darkest color instead of reflecting its real position.
- **`outlierIds`** — whichever country tops that metric, rendered black (`#000`) and shown as a standalone dot instead of on the gradient. **Not always France** — `earthy` (imports) is topped by Curaçao (id 531), whose entire squad is Dutch-born.
- **Satellite colors** (`noData`, `placeholderFill`/`placeholderStroke`/`graticule` for the pre-load placeholder sphere) stay bundled per theme too, so switching themes never again requires hand-matching those separately — the ocean itself (real water) deliberately stays out of the theme, unaffected by land palette.

Theme is switched via `#theme-toggle` (floating over the map, cycles on click) and persists to `localStorage` (`mundial-map-theme`), read before first paint. `setTheme()`/`onThemeChange()` in `map-container.js` expose a small pub/sub so `wc2026_map.js` can repaint (`.country` fills, standalone-dot islands, legend gradient/ticks/outlier count) without `map-container.js` knowing about D3 selections.

### Legend
The legend (`#legend`) lives as the third child of `#page-heading-sub`, bottom-aligned via `mt-auto` on a `d-flex flex-column h-100` wrapper.
- **Gradient direction**: `linear-gradient(to left, …)` — **high values (dark) on the left, 0 on the right**. Ticks (`#legend-ticks`, lit-html-rendered by `_updateLegendTicks()` in `wc2026_map.js`) read `ratioMax × 1 / 0.75 / 0.5 / 0.25 / 0` for the *active theme* — rebuilt on every theme switch, not hardcoded, since `ratioMax` varies per theme (see "Map color themes" above). The three inner waypoints are just illustrative fractions, not tied to any specific country.
- **Outlier**: the active theme's `outlierIds` country (France for `forest`/`violet`, Curaçao for `earthy`) is off-scale, rendered black (`#000`), shown as a standalone dot to the left of the gradient bar. `#legend-outlier-count` (`_updateLegendOutlier()`) shows that country's own `metric()` value, also rebuilt on theme switch.
- On narrow screens (`max-width: 767.98px`), the bar and ticks shrink to 90px.

### Mobile layout (`@media (max-width: 767.98px)`)
Legend bar/ticks shrink to 90px. The fixed header and map are always present on all screen sizes.

### Mobile portrait sticky layout (`@media (max-width: 767.98px) and (orientation: portrait)`)
On portrait mobile only (landscape and desktop are unaffected):
- **Tab bar fixed at bottom**: `#bottomTabList` gets `position: fixed !important; bottom: 0; left: 0; right: 0` so the navigation stays visible while the tab content scrolls freely above it.
- **Bottom clearance**: `body { padding-bottom: 48px }` prevents the last line of tab content from being hidden behind the fixed tab bar.

### Player table (`#tab-players`)
One flat `<table>` (`_playersTableTemplate` in `js/wc2026_map.js`, columns: name, born-in, plays-for, caps), rendered every time `#tab-players`' content changes — there is no other rendering path (an earlier per-country accordion and a separate "click a country" hint state were both merged into this single template; don't reintroduce either). It takes an optional `focusIds` (a `Set` of numeric ids), both cases going through `_currentPlayerSet(focusIds)`:
- **Omitted/`null`** — the ambient view: `_visiblePlayerEntries()` reuses `_focusedPlayers` (below) over the *whole* currently-selected set (`_visibleQualifiedIds()`), rather than a flat native/import-only filter — that's what adds each visible team's own escaped exports to the ambient view too, not just its natives+imports. This is `#tab-players`' default/idle content. `_visibleQualifiedIds()` itself is a thin wrapper over `_isTeamVisible(id)` — the **one** place "is qualified team X currently selected" is answered, shared by the player table, the map's own flag painting (`sidebar.applyFlagFilter`), and the group-stage carousel's single-group override (`_applyGroupFocus`/`_groupFocusIds`): `_isTeamVisible` returns `_groupFocusIds.has(id)` when a single group is focused (a full override — "regardless of what the checkboxes currently say", see `_applyGroupFocus`'s own comment), else `sidebar.catEloChecked(id, fifaMember)`, the exact same predicate `sortAndFilter` uses to build the Elo pill list `#elo-meta-count` counts. An earlier version of `_visibleQualifiedIds()` answered this by re-inspecting the map's own painted flag DOM (`data-hidden-target`) after the fact instead — a second, independent derivation of the same fact that happened to agree with `catEloChecked` in the common case but wasn't provably guaranteed to (animation timing, or any future divergence between the two code paths) — replaced so there's exactly one computation, not two that need to stay in sync by convention. `#elo-meta-count` (Elo pill list count) and `#tab-players-btn`'s own count (below) are **not** expected to show the same number even so — they count different things (currently-selected *teams* vs. distinct *countries* appearing in the resulting player rows) — but both are now traceably built from this one shared selection primitive, including the group-focus case, where they deliberately diverge further still: `#elo-meta-count` stays at the full filtered count (the Elo pill list is a separate concern group-focus doesn't touch) while the player table narrows to just that one group's teams.
- **One id** — a dim-selected team's own players (exports + natives + imports combined, via `_focusedPlayers`, which reads the already-deduped `app.byId`/`app.nativeByCountry`/`app.importByCountry` indices).
- `_focusedPlayers` accepts multiple ids and dedupes by `pid` across them (merging roles — see next paragraph — rather than overwriting), so a future "fixture" focus (both teams in a selected match) can reuse it unchanged — not yet wired up to any UI.

**The country filter applies to both columns of a row, not just the anchor side** — `_currentPlayerSet(focusIds)` (the single function both the table and the birth-city dots read from) requires a player's birth country AND their plays-for country to *each* individually pass `_isCountryCategoryVisible(id)` (`sidebar.catEloChecked`, the same category-matrix/confederation/stage predicate that decides whether that country's own Elo pill shows) — deliberately `_isCountryCategoryVisible`, not `_isTeamVisible`: the group-stage single-group override is about which teams anchor the ambient roster, not about whether a row's own born-in/plays-for country passes the category filter, and reusing `_isTeamVisible` here would wrongly hide a focused group's own exports/imports just for landing outside the group. Before this, the filter only ever gated the anchor side (a team already had to be selected to be pulled into `_focusedPlayers`/`_visiblePlayerEntries` at all) — an export to a hidden category, or an import from one, still showed regardless. Consequence: the default checkbox state (`filter-IE`/`IK`/`HE`/`HK` **and now also every exporter row — `FE`/`NE`** — checked, `FK`/`NK` left unchecked) is what makes the *default*, no-clicks-required view "genuine and complete" — every currently-selected team's actual roster, including players born in a non-qualified country (e.g. Cameroon-born Canada internationals) — since `FK`/`NK` (non-exporting countries, whatever their own category) can never appear in a born-in cell anyway (no exports = no player to reference them), there's nothing to gain by defaulting them on too.

**Export/native/import filter** (`control_sidebar.js`'s `csb-native-table`, 3 buttons below the sort/display tables, header labeled "view" — it reshapes *how* the already-selected countries' players are shown, not which countries are selected) — enabled only while `#tab-players` is the active bottom tab (`sidebar.setPlayersTabActive`, called from the `show.bs.tab` listener), disabled otherwise. `_focusedPlayers` tags each player with the role(s) that earned them a place in the union relative to the *whole* focus set — export (born in a set-country, plays for any other, even another set-country), native (born and plays for the same set-country), import (born **outside the whole set**, plays for a set-country) — deliberately excluding a cross-set move's destination side from import (already counted as the source team's own export), which makes the three a clean partition: verified against real data, sums match exactly (players and coaches) in both single-team and full-48-team views. `_currentPlayerSet(focusIds)` layers this filter (inclusive-OR over `_roles`, read via `sidebar.playersFilterChecked`) on top of `_focusedPlayers`/`_visiblePlayerEntries`, shared by the table and the map's birth-city dots (`_updatePlayerCityDots`/`_buildCityRecords`, also reading `_currentPlayerSet`) so they can't drift apart. Toggling it re-renders the table immediately (`callbacks.onPlayersFilterChange`) rather than waiting for the next tab switch, since — unlike the country-category/confederation filter (see "Elo ranking tab and filter sidebar" above) — it's only ever interactive while the table is already on screen.

Player names link to Wikipedia in the UI language when `pid` resolves in the loaded `data/v2/wiki_<lang>.json` (see "Wikipedia links in player table" above).

**Everything stays live** — the table (both ambient and focused), `#tab-players-btn`'s own pill, and the map's birth-city dots (`_updatePlayerCityDots`) are all refreshed together by one `_refreshPlayersView()`, hooked into **both** `callbacks.afterFlagFilter` (fires on every country-category checkbox toggle, confederation change, or stage-carousel move — the "true" filter, on the *set of countries* shown at all) and `callbacks.onPlayersFilterChange` (the export/native/import filter above, on *how* that set's players are shown). Neither one is a "reopen the tab to see the update" affair. `#tab-players-btn` previews what the tab will show *before* it's opened: a plain icon + a live count of every **distinct country** appearing in the ambient table's born-in *or* plays-for column (not just how many qualified teams are visible — a birth country can be any country in the world, e.g. a non-qualified Cameroon in a Canada export's born-in cell; mirrors `#elo-meta-count`'s own philosophy of counting the actual rendered rows rather than a separately-derived approximation), or the selected team's flag+name pill once dim-selected (`applySelection`). `_renderPlayersTabIdle` (part of `_refreshPlayersView`) no-ops while a team is dim-selected (that pill belongs to `applySelection` instead).

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
The **Elo ranking** tab (default active) shows all countries as pill badges, rendered by the `<elo-ranking>` Web Component (`js/elo_ranking.js`). Countries are filtered by the sidebar cube (`qualified × importer × exporter`) plus the tournament-stage carousel described below; clicking a badge activates dim mode; clicking the active badge clears it.

**Non-qualified is FIFA member (`FE`/`FK`) vs. not (`NE`/`NK`)** (`control_sidebar.js`'s `flagCat`/`catEloChecked`) — `NE`/`NK` also covers eloratings.net's own `weirdo` tier (Northern Cyprus, Kurdistan, Zanzibar, Somaliland, Chagos Islands, Sint Eustatius, Saba, Tibet — real ratings, `id: null`/`iso2: null` since none have an ISO country code). A birth country with no `data/elo_rank.json` entry whatsoever (the Isle of Man was the concrete case that surfaced this — a real, geocoded birth country in the player data, but not a FIFA member and not tracked by eloratings.net either) is handled by a quiet guard instead of its own matrix row: `js/wc2026_map.js`'s `_isCountryCategoryVisible` first checks `_eloRankedIds.has(id)` (every id with a real Elo entry, populated once `elo_rank.json` loads) before deferring to `sidebar.catEloChecked` — no checkbox, no persisted state, nothing for the user to toggle. This is deliberately thin: `mundial-build`'s `pipeline/patch_unrated_birth_countries.py` now runs on every data build and proactively patches a null-rank `elo_rank.json` entry the moment such a gap appears (the same pattern `pipeline/patch_kosovo.py` established by hand for Kosovo specifically), so in practice the guard almost never fires — an earlier version of this surfaced a full 3rd matrix row (`WE`/`WK`, "unrated") for it, but once the pipeline fix shipped that row could hold (almost) nothing worth a dedicated checkbox, so it was folded back into the guard it started as.

**Three-tier pill interaction model:**
- `enablesDim(id)` → `true`: badge is `elo-item--clickable` (dark, `#888` label). Click activates dim + arc mode.
- `!enablesDim(id) && !!centroids[id]` → badge is `elo-item--zoomable` (stays `#bbb`, cursor:pointer + hover tint). Click calls `zoomToCentroid(id)` — pans/zooms the map to that country's SVG centroid without activating dim.
- neither → badge is inert (no cursor change, no interaction).

`zoomToCentroid(id)` reads `centroids[id]` (SVG centroid coordinates populated by `renderWorld`), computes a k=8 zoom transform centered on that country, and applies it with a 600ms transition. All map click handlers also call `zoomToCentroid` for countries where `!enablesDim(id)` (instead of opening dim mode).

**Critical ordering**: `_renderElo()` must be called **after** `buildIndices(rawData)` in the `Promise.all` callback. If called before (e.g. when the Elo JSON loads first), `app.byId` is empty, non-qualified exporters get wrongly bucketed as category `'o'` (filtered out by default), and `enablesDim()` returns false for all items (nothing clickable).

The filter sidebar's natural height is measured before its first collapse (`classList.remove('collapsed') → scrollHeight → classList.add('collapsed')`), stored in `--csb-h`, which drives the toggle button's `min-height`. The actual header height (`--page-header-h`) is measured separately via `offsetHeight`.

### Tournament stage carousel

The `q` cell of the filter sidebar (next to the "importer"/"non-imp." rows) holds a Bootstrap carousel — `#csb-stage-carousel` in `js/control_sidebar.js` — cycling through `CAROUSEL_STAGES` (`js/qualified.js`): `group → r32 → r16 → qf → sf → final → winner`. Each position filters qualified countries down to those that "reached" that stage — non-qualified exporter countries (category `'e'`) are unaffected by the carousel, shown/hidden purely by their own `ef`/`en` checkbox, the same as the non-exporter `of`/`on` cells (neither has a tournament position to "reach"). This replaced an earlier three-state alive/knocked-out toggle (`?in`/`?out` params, `wc2026_alive_and_kicking.json`) — both are gone; **`?stage=<key>`** (e.g. `?stage=r16`) is the only URL param now, persisted the same way in `localStorage` (`stage: CAROUSEL_STAGES[_stage]`).

**Data source**: `data/v2/status.json`, shape `{ "<iso2>": { round, date?, lostTo?, thirdPlace? } }`. Lists **eliminated teams only** — an iso2 key absent from the file means that team is still alive; there is no positive "still in it" list. `round` is one of `ELIM_ROUNDS` (`Group Stage`, `Round of 32`, `Round of 16`, `Quarter-finals`, `Semi-finals`, `Final`), matched verbatim — **guaranteed** (DB CHECK-enforced in mundial-build's pipeline) to never read `"3rd Place Final"`: a Semi-finals loser's `round`/`lostTo` always reflect their real bracket elimination. `date`/`lostTo` are both present for knockout exits and both absent for Group Stage exits (round-robin — no single fixture decided it). `thirdPlace` (`{result: 'won'|'lost', date, opponent}`) is additive and present only for the two Semi-finals losers, once their 3rd Place Final has been played — see `js/qualified.js`'s `playsThirdPlace`/`buildEloItems`.

**Per-team stage math** (`buildEloItems` in `js/qualified.js`):
- `eliminatedAtIndex` — `ELIM_ROUNDS.indexOf(round)`, or `null` if alive. Note this can legitimately be `0` (Group Stage) — comparisons must use `!= null`, never truthiness.
- `pendingFrom` — the carousel stage index from which this team's fate is undecided (fixture not yet played), derived from `wonUpTo` (the furthest knockout round a team is confirmed to have *won*, proven by appearing as someone else's `lostTo`). `null` once eliminated or once the team has actually won the Final.
- `visibleThroughIndex` = `eliminatedAtIndex ?? pendingFrom ?? Infinity` — the last carousel stage a team appears at, period. This is what's stored in `app.stageIndexById` and checked via `reachesStage(index, stagePos)`. A team's blurred ("pending") appearance is its **last** — it does not carry forward into stages beyond it while still undecided, so e.g. a team that just won Round of 32 shows solid at the `r32` stage, blurred at `r16` (its next undecided fixture), and is absent from `qf` onward until that fixture resolves.

**Visual convention** (`css/taxonomy.css`): solid border = confirmed passed; **dashed** border = eliminated (`.elo-item--knocked-out`); **blurred** border alone = pending/undecided (`.elo-item--pending`) — "Schrödinger's team." Neither state also dims the name (tried, dropped as redundant with the border) — the border carries the signal on its own. The blur is applied only to a duplicated `::before` border (`filter: blur(1.3px)`), not the whole pill, so names stay legible.

**Aggregate counts**: `buildBracketState(statusByIso2, all48Iso2)` (`js/qualified.js`) returns, per knockout round, `{ eliminated, passed, playing }` — how many of the 48 qualifiers were knocked out in that round, won through it, or are still contesting it. Powers the carousel's native `title` tooltip (`_updateCarouselTitle` in `control_sidebar.js`). Group Stage exits are tracked separately (`outInGroupStage`) so they aren't conflated with "still alive" — both would otherwise read as `eliminatedAt === null`.

**Navigation is capped at the furthest non-empty stage** — `_refreshCarouselBounds()` walks `CAROUSEL_STAGES` counting visible teams per position (counts are monotonically non-increasing) and disables (`.csb-stage-disabled` / `.csb-stage-locked`, `pointer-events: none`) the next-arrow and indicator dots beyond it. The `slide.bs.carousel` event itself is also guarded (`e.preventDefault()`) so this can't be bypassed via swipe, keyboard, or a stale `?stage=` link — it just unlocks on its own as the tournament progresses and `app.stageIndexById`/`app.bracketState` are refreshed.

**Click handling**: the visible `.elo-item.elo-item--qualified` pill inside the active carousel slide has its own click listener (toggles the `qie/qi/qe/q` show/hide checkboxes, same as `?show=qual` — independent of carousel position); the carousel's own click handler `stopPropagation()`s for clicks on `.carousel-control-prev/-next/.carousel-indicators` so paging never triggers that toggle.

**Elimination tooltip**: knocked-out pills get a `title` (`_eliminationTitle` in `js/elo_ranking.js`) reading e.g. "Eliminated — Round of 32 (Jul 2) · lost to Morocco", built from `eliminatedRound`/`eliminatedDate`/`eliminatedLostTo` (all resolved once in `buildEloItems`, not recomputed per render).

### Team/match display switch — grouped by fixture

A persistent two-state switch (`.csb-display-toggle`, bottom of the sort column, next to the 4 reorderable `elo`/`pop`/`delta`/`alpha` sort items — see "Elo ranking tab and filter sidebar" above) — **not itself a sort criterion**. `team` (default) is the flat pill list, unchanged. `match` groups teams by fixture: each pair shares one row (`<li class="elo-pair">`, underlined — see `css/global.css`), non-breakable (can't split across a flex-wrap line). Real fixture couples (both teams currently visible) always sort first, strictly by ascending kickoff date/time — **the active sort criteria and direction have no effect on them at all**. Only lone/unpaired rows (no visible opponent — see below) fall back to the sort column's own criteria, and always sort after every real fixture. The pills themselves are unchanged — same badge content as team-display mode, just visually paired.

**Only takes effect once the stage carousel is off `group` (stage 0)** — there's no single fixture per team at the group stage. The switch's "match" option is greyed out and inert (`.csb-sort-item--disabled`) at stage 0; `control_sidebar.js`'s `_setDisplayMode()` also self-guards (forces `'team'` if called with `'match'` while `_stage === 0`) rather than relying on callers to check first, and `_updateCarouselTitle()` forces it back to `'team'` if the carousel is navigated back down to stage 0 while it was active. Persisted the same way as the rest of the sidebar's state (`localStorage`). Deliberately **not** exposed as a URL query parameter (no `?display=`) — dropped from `js/control_sidebar.js`'s `_paramTable`/explain panel/Share button so nothing implies a `?display=` link is shareable.

**Fixture data — `qualified.js`'s `buildMatchInfo(statusByIso2, fixturesData, nameByIso2)`**, two layered sources:
- `data/v2/status.json`'s `round`/`date`/`lostTo` — authoritative for **decided** fixtures. Each decided fixture has exactly one explicit loser entry and one winner (only provable by appearing as some entry's `lostTo`), so recording both sides from that single entry recovers the full pairing. This is the only reliable winner signal for penalty-shootout results — `data/fixtures.json`'s `goals` is tied for a PEN/AET decision and doesn't reveal a winner on its own.
- `data/fixtures.json` (mundial-build; **top-level, not under `v2/`** — flat match data with no person/pid/wiki join, so it bypasses `load.py`/`export.py` the same way `elo_rank.json` does) — every WC2026 fixture, played or scheduled: `{ source, updated, fixtures: [{ id, date, round, status, home, away, goals: { home, away }, winner, group?, score? }] }`. `date` is full ISO datetime with timezone; `home`/`away` are iso2; `round` matches `ELIM_ROUNDS` verbatim for knockout rounds, and `"Group Stage - N"` for group play (never matches `ELIM_ROUNDS`, so those are excluded automatically — group stage has no single-opponent fixture concept here anyway). `status` is api-football's raw short code (`'PEN'` for a penalty-shootout decision) — not read for pairing purposes; a fixture is only pulled from here when `status.json` hasn't already decided it. `winner` is `'home'`/`'away'`/`null` (draw, only possible in the group stage). `score.penalty.{home,away}`, when a fixture's `status` is `'PEN'`, is the actual shootout tally (js/elo_ranking.js's `fixtureRow` reads this directly for the "X–Y pen." line — see "Team/match display switch" below). `group` (group-stage fixtures only) is the group letter. Used to fill in **real pairing for fixtures not yet played** — without it, an undecided team would have no opponent info at all until after the match.

`app.matchInfoByIso2` is built once per page load (`wc2026_map.js`) after `statusByIso2` and `data/fixtures.json` both load, keyed by ELIM_ROUNDS index so it lines up 1:1 with the carousel's own `_stage` (`CAROUSEL_STAGES[p] === ELIM_ROUNDS[p]` for p 1..5).

**Grouping + sort (`control_sidebar.js`)**: `_buildGroups()` pairs each filtered/visible team with its `app.matchInfoByIso2` opponent if that opponent is itself visible (category filters can hide one side, leaving the other a lone row); a team with no pairing data at all is also a lone row. `sortAndFilter`'s comparator puts every real 2-member group before any lone row, then sorts real groups purely by `_matchInfo(...).date` ascending (undated/unscheduled fixtures sort last) — the sort column's criteria never affect a real fixture's position. Lone rows instead fall back to `_groupCompare()`, which sums `_aggregateValue()` across group members (trivially just that one member, group size 1) using the active 1st/2nd sort criteria — deliberately **not** the same per-item value `elo`'s own team-display comparator uses (`rank`, an ordinal position, meaningless to add across two teams): `pts` (the actual Elo rating, a cardinal quantity) is summed instead when it matters for a real couple's *internal* ordering (see below). `pop`/`delta` sum their own already-additive values; `alpha` has no numeric aggregate, so lone rows compare by name instead. The two members within a real couple are ordered by that same per-member value (stronger/alphabetically-first leads) — arbitrary but stable; nothing downstream depends on which one leads.

**Rendering (`js/elo_ranking.js`)**: the reusable per-country pill is a `<span>` (not a `<li>` — the `<li>` is now a per-render **row wrapper**, `.elo-row` for one pill or `.elo-pair` for two, rebuilt fresh every `show()` call). `sortAndFilter`'s output is a flat, already-ordered array; adjacent items sharing the same `_pairId` (couple members, tagged by `_buildGroups`/the aggregate sort above) are placed into one row. FLIP position animation runs on the pills (the stable, reused elements), not the disposable row wrappers.

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

**Country and player identity — joined by id, never by name**

`wc2026_live.html` does not fetch `data/v2/map.json` at all. It resolves every identity join through numeric ids shared with `mundial-data`'s build-time resolvers, never by matching name strings — this replaced a recurring bug class where API-Football's own spelling of a country or player name (e.g. `"Congo DR"` vs. this project's canonical `"DR Congo"`, or lineup name `"Lionel Mpasi Nzau"` vs. squad-list name `"Lionel Mpasi"`) silently produced the wrong flag or dropped enrichment.

- **Team/country flags**: `flagForTeam(team)` looks up API-Football's own numeric `team.id` in `data/v2/live.json`'s `teams` key (`{ "<team_id>": "<iso2>" }`, replacing the now-removed `data/r32_teams.json`) to get an iso2 code. `flagForCountry(name)` looks up a canonical country name in `data/elo_rank.json`'s `rankings` (also carries `iso2`) for birth-country flags. Curaçao, Kosovo, the UK home nations, etc. all resolve correctly here with no per-country override — that resolution now happens once, upstream, through `mundial-data`'s shared alias table.
- **Player/coach identity**: `getPlayerWiki(iso, id)` looks up `data/v2/live.json` (shape: `{ "<iso2>": { "<api_football_player_or_coach_id>": { pid, birthCountry } } }`) using `lineup.startXI[].player.id` / `lineup.coach.id` — API-Football's own numeric id, the same id space the file is keyed by. A miss (id not yet resolved upstream) renders the plain name with no wiki link or birth-country tag — a visible, honest gap, not a name-matching fallback.

**`mapData.natives` structure** (`data/v2/map.json`, used by `wc2026_map.js`, not by the live-game page)

Top-level key alongside `data`, `pop`, `capital`. Shape:
```json
{ "Sweden": [{ "name": "Eric Smith", "caps": 1, "pid": 123 }] }
```
Keys are country names (matching `p.nation` in export records). These players have no "born in" flag since birth country = squad country, but they do get Wikipedia links via `pid` (see "Wikipedia links in player table" above).

**Accordion and UI behaviour**
- Events and stats accordion items are always rendered for tracked fixtures, even when the API hasn't sent data yet — they just appear empty. Only untracked fixtures hide these sections.
- Untracked fixtures are visually dimmed (50% opacity in match view, dashed border on selector pill).
- `renderGroupResults` only renders finished matches (`FT`, `AET`, `PEN`) — future and live fixtures are excluded to avoid showing placeholder scores.
- `poll_status` socket event shape: `{ discovering, fixtures: {} }` where `fixtures` is an object keyed by fixture id (not an array). `tracking` is intentionally absent — see `../mundial-server/CLAUDE.md` for the rationale.

### `countries.json` — population + capital lookup (mundial-build pipeline input, not in this repo's `data/`)
`countries.json` is a **mundial-build**-only file (`mundial-build/pipeline/countries.json`) — a pipeline build input, never published into this repo's `data/` submodule. It's the canonical source for population and multilingual capital city names. Shape:
```json
{ "250": { "id": 250, "alpha2": "fr", "alpha3": "fra", "name": "France",
           "capital": {"en":"Paris","fr":"Paris","de":"Paris","it":"Parigi","es":"París"},
           "population": 68374591 } }
```
Keys are ISO numeric ids (strings). Special entries: `"8260"`–`"8263"` (UK home nations, alpha2 = `gb-eng` etc.) and `"383"` (Kosovo, alpha2 = `xk`). The pipeline reads this file in `build_json.py` to populate `pop` and `capital` in `data/v2/map.json` (looked up by lowercase alpha2) — that baked-in result is what this frontend actually fetches.

Generated by: `pipeline/fetch_countries.py` (mledoze + World Bank + Wikidata). Post-patched by `pipeline/patch_uk_nations.py` and `pipeline/patch_kosovo.py`. All three scripts live in `mundial-build`.

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
