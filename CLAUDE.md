# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Interactive D3.js choropleth map of the 2026 FIFA World Cup tracking player "exports": players born in one country who represent another. Normalised by population. Includes a Python scraping/data pipeline and several standalone infographic HTML files.

Live at: **https://mundial.cthiebaud.com/**
GitHub: **https://github.com/cthiebaud/mundial** (standalone repo)

---

## File structure

| File | Purpose |
|---|---|
| `index.html` | Entry point — redirects to the map, carries OG meta tags |
| `wc2026_map_exported.html` | Main map page (Bootstrap 5, loads JS + JSON via ES module) |

**OG tags:** Both `index.html` and `wc2026_map_exported.html` carry identical OG meta tags. Always update **both files** together when any OG tag changes (og:image, og:url, og:title, og:description, etc.).
| `wc2026_map.js` | ES module — D3 rendering, zoom, tooltips (lit-html), filter sidebar, Elo tab, dim/arc logic |
| `wc2026_map.css` | All custom styles (map, header, legend, tooltips, Elo list, filter table) |
| `wc2026_elo_ranking.js` | ES module — reusable Elo ranking list component |
| `wc2026_elo_rank.json` | Current World Football Elo ratings (fetched at runtime) |
| `i18n.js` | ES module — language detection, `T` strings, `countryName()`, `wikiUrl()` |
| `wc2026_map_data.json` | All data: player exports + natives by birth country + population + `wiki_langs` |
| `uk-nations.geojson` | 4 UK home nations polygons (Natural Earth 50m) — England, Scotland, Wales, Northern Ireland rendered as separate choropleth features |
| `wc2026_og_v3.png` | 1200×640 Open Graph preview image for LinkedIn/social |
| `chains/` | Export chain infographics — see section below |
| `pipeline/` | Data acquisition scripts and source CSVs — see `pipeline/README.md` |

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
| `lit-html` | 3 | HTML templating for all tooltips and the player table |
| `iso-3166-1` | 2 | ISO 3166-1 lookups used by `i18n.js` → `countryName()` (ESM, loaded via jsDelivr) |
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

---

## Data pipeline

```bash
pip install requests beautifulsoup4 pandas lxml matplotlib
python3 pipeline/wc2026_birthplaces.py   # → pipeline/wc2026_players.csv
python3 pipeline/build_json.py           # → wc2026_map_data.json
python3 pipeline/add_wiki_urls.py        # → enriches wc2026_map_data.json in-place
```

Full documentation, partial-update recipes, and troubleshooting notes in **`pipeline/README.md`**.

### Generating the ratio chart

```bash
python3 pipeline/wc2026_make_ratio_chart.py              # Curaçao excluded (default)
python3 pipeline/wc2026_make_ratio_chart.py --with-curacao
```

### Regenerating the OG image

```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1200, "height": 630})
    page.goto("https://mundial.cthiebaud.com/wc2026_map_exported.html",
              wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(4000)
    page.screenshot(path="wc2026_og_v3.png")
    browser.close()
```

---

## lit-html architecture

All tooltip rendering and the player table use **lit-html** tagged templates. The pattern is: compute all data variables first (aligned), then a single `render(html\`...\`, container)` call — no string concatenation, no `innerHTML` assignment.

Key helpers (module-level, return `TemplateResult` or `nothing`):
- `popTag(pop)` — renders `<span class="tt-pop">pop. xM</span>` with locale-aware decimal separator, or `nothing`
- `flagImg(code)` — renders `<img class="tt-flag" src="...">` (circle-flags CDN), or `nothing`
- `ptWikiRow(p)` — renders a player name with optional Wikipedia link in the UI language

Tooltip functions (all module-level, access `app.pop` via the `app` object):
- `buildImportColHtml(nationId)` → `TemplateResult` (reusable import column)
- `showQualifiedTip`, `showExportTip`, `showImportTip`, `showImportSourceTip`, `showCombinedTip` — each calls `render(html\`...\`, tt)`

Player table:
- `playerTableTemplate(sourceId)` — module-level pure function, returns `TemplateResult`
- Called in `applyDim` as `render(playerTableTemplate(sourceId), ptEl)` — replaces the old 70-line imperative DOM block
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
- Map rendering: world atlas feature 826 (UK) is **skipped** (non-qualified flags filter has explicit `id !== 826` guard); `uk-nations.geojson` renders the 4 nations as separate polygons
- All 4 UK nations render their flag on the map — the UK nation filter covers all four: `f._id === 8260 || f._id === 8261 || f._id === 8262 || f._id === 8263`
- Scotland centroid manually overridden to `[-4.2, 56.8]` (island bias in auto-centroid)
- England and Scotland flags placed **after** the `.flag-qualified` D3 data join (placing before causes D3's exit selection to remove them)
- Population + capital patched via `pipeline/patch_uk_nations.py` (Wikidata SPARQL for capitals, 2021/22 census populations); stored in `countries.json` under keys `"8260"`–`"8263"` with alpha2 as the lookup key

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
- Added to `wc2026_elo_rank.json` rankings with `rank: null, pts: null, fifaMember: true` (not on eloratings.net)
- Patched via `pipeline/patch_kosovo.py` (Wikidata SPARQL for Pristina translations, World Bank 2022 population)

### Small island nations (standalone flags)
Cape Verde (id=132) and Curaçao (id=531) don't appear reliably in the 110m topojson — placed manually via `STANDALONE_FLAGS` array with explicit lon/lat.

### Zoom-stable flags and arcs
All `.flag-qualified` images store `data-cx`/`data-cy` (SVG centroid coordinates). Arc `path` and `polygon` elements store `data-sw` (base stroke-width), `data-sx`/`data-sy` (source centroid), and `data-tx`/`data-ty` (target centroid). The zoom handler reads these attributes to rescale flags and recompute arc geometry at any zoom level, keeping both visually consistent.

### i18n
UI language follows the browser locale (`navigator.languages[0]`). Supported: `fr`, `de`, `it`, `es`, `en` (fallback). Country names are resolved by `countryName()` in `i18n.js` using `Intl.DisplayNames` (backed by the `iso-3166-1` npm package for alpha-2 lookups). A small `_OVERRIDE` map handles non-standard cases (UK home nations use subdivision codes `gb-eng` etc., historical states with no ISO code). `T` is the already-resolved label object for the active language — it is not a nested object keyed by language; the internal `_LANG` variable selects the entry at module load time. Static page elements (`<title>`, `<h1>`, etc.) are patched from JS at load time.

i18n is now extracted into **`i18n.js`** (ES module imported by `wc2026_map.js`). It exports `LOCALE`, `T`, `countryName`, and `wikiUrl`. Wikipedia links are provided for `en`, `fr`, `de`, `it`, `es`; all other browser locales fall back to the English Wikipedia URL without an `(en)` suffix.

**Gotcha — non-breaking spaces in i18n strings:** French typography uses non-breaking spaces in several places — `\xa0` (regular non-breaking space) before `": Wikipedia"` in `pageSub`, and ` ` (narrow no-break space) at the start of `pageHeadingSub` strings. The Edit tool matches bytes literally and will silently fail if the search string uses a regular space instead. **Always use a Python script** (`open(...).read()` / `str.replace()` / `open(...).write()`) when editing i18n strings in `i18n.js`, and verify suspicious characters with `python3 -c "print(repr(line))"` first.

### Tooltip — variants and layout
Tooltips are **disabled on mobile** (`/Mobi/i` UA check). On desktop, hovering a country dispatches to one of five functions:

| Function | Trigger |
|---|---|
| `showExportTip` | Any country where `app.byId[id].count > 0` (exports players) — qualified or not |
| `showQualifiedTip` | Qualified nation with no exports |
| `showCombinedTip` | Dim mode: country is both a dim destination and an import source |
| `showImportTip` | Dim mode: hovering a destination flag |
| `showImportSourceTip` | Dim mode: hovering a birth-country source flag |

**`showExportTip` layout:** Non-qualified birth countries show the country name with a *not qualified* badge (`tt-non-qualified` class on `#tooltip`). Qualified nations with both exports and imports render a two-column layout:
- **Left column**: raw export count + ratio/million + destination nations + top 5 players with `→ destination`
- **Right column**: raw import count + birth nations + top 5 players sorted by caps with `← birth country`

Collapses to a single column when the import side is empty.

Every tooltip header shows `[flag] Country name` left-aligned and `pop. xM` right-aligned on the same row. Population uses `Intl.toLocaleString(LOCALE, …)` for locale-aware decimal separators.

`app.importByNation` (property of the module-level `app` object, populated on data load) maps each qualified nation ID to the list of imported players. Self-import is excluded by comparing `countryName()` output for birth country and nation — this catches name-mismatch cases like DR Congo (`id=null`, name="Democratic Republic of the Congo") vs. qualified nation 180 ("DR Congo").

### Wikipedia links in player table
Players in the dim-mode table link to their Wikipedia page in the UI language when available, with `(en)` fallback link otherwise. `wiki_langs: {en, fr?, de?, it?, es?}` is stored per player in the JSON and populated by `add_wiki_urls.py`.

### Fixed header + map architecture
The page uses two fixed elements:
- **`#page-header`** (`position: fixed; top: 0; z-index: 200`): CSS grid with two overlapping `grid-row:1 grid-column:1` children — `#page-heading-sub` (quote + legend) on the left, `#filter-sidebar` on the right (justified-end). Row height = tallest child.
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
- Natives section (conditional): players born there playing for that same country (`app.nativeByNation`)
- Import section (bordered top, conditional): count heading + grouped player rows by birth country
- Player names link to Wikipedia in the UI language when `wiki_langs` data is available

### Elo ranking tab and filter sidebar
The **Elo ranking** tab (default active) shows all countries as pill badges, rendered by `renderEloRanking` from `wc2026_elo_ranking.js`. Countries are filtered by the sidebar cube (`qualified × importer × exporter`); clicking a badge activates dim mode; clicking the active badge clears it.

**Three-tier pill interaction model:**
- `enablesDim(id)` → `true`: badge is `elo-item--clickable` (dark, `#888` label). Click activates dim + arc mode.
- `!enablesDim(id) && !!centroids[id]` → badge is `elo-item--zoomable` (stays `#bbb`, cursor:pointer + hover tint). Click calls `zoomToCentroid(id)` — pans/zooms the map to that country's SVG centroid without activating dim.
- neither → badge is inert (no cursor change, no interaction).

`zoomToCentroid(id)` reads `centroids[id]` (SVG centroid coordinates populated by `renderWorld`), computes a k=8 zoom transform centered on that country, and applies it with a 600ms transition. All map click handlers also call `zoomToCentroid` for countries where `!enablesDim(id)` (instead of opening dim mode).

**Critical ordering**: `_renderElo()` must be called **after** `buildIndices(rawData)` in the `Promise.all` callback. If called before (e.g. when the Elo JSON loads first), `app.byId` is empty, non-qualified exporters get wrongly bucketed as category `'o'` (filtered out by default), and `enablesDim()` returns false for all items (nothing clickable).

The filter sidebar's natural height is measured before its first collapse (`classList.remove('collapsed') → scrollHeight → classList.add('collapsed')`), stored in `--filter-sidebar-h`, which drives the toggle button's `min-height`. The actual header height (`--page-header-h`) is measured separately via `offsetHeight`.

### Dim / arc mode
- Left-click any country on the map or in the Elo list where `enablesDim()` returns true → dims all qualified nation flags except relevant ones; draws curved arcs with √count-scaled width; shows player table below map
- Clicking the **same** active Elo item again → clears dim
- Any other map click → clears dim (or `zoomToCentroid` if the country is zoomable)
- `dimState.active` flag prevents tooltip from reappearing during dim
- `dimState.k` tracks current zoom scale so arcs are redrawn at correct size on zoom
- `_zoomToActiveDimFlags` two-stage animation: stage 1 (source country) maxK=9 / duration=1200ms; stage 2 (linked flags) Math.max(1, Math.min(9, …)) / k2=9 fallback / duration=1500ms

### Data join ordering in the render callback
Order matters for SVG z-layering:
1. `arcsGroup` (below all flags)
2. Leader lines (ocean-clipped)
3. World choropleth paths (skip 826)
4. Mesh borders
5. UK nation paths (from `uk-nations.geojson`)
6. `.flag-qualified` world topojson data join
7. England/Scotland flags (must be **after** step 6)
8. STANDALONE_FLAGS

### `countries.json` — population + capital lookup
`countries.json` (project root) is the canonical source for population and multilingual capital city names. Shape:
```json
{ "250": { "id": 250, "alpha2": "fr", "alpha3": "fra", "name": "France",
           "capital": {"en":"Paris","fr":"Paris","de":"Paris","it":"Parigi","es":"París"},
           "population": 68374591 } }
```
Keys are ISO numeric ids (strings). Special entries: `"8260"`–`"8263"` (UK home nations, alpha2 = `gb-eng` etc.) and `"383"` (Kosovo, alpha2 = `xk`). The pipeline reads this file in `build_json.py` to populate `pop` and `capital` in `wc2026_map_data.json` (looked up by lowercase alpha2).

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

## Git / deployment

**NEVER commit or push unless the user explicitly asks.** Do not commit after making changes — wait for the user to test first. The user will say "commit and push" when ready. Never ask "ready to commit?" either.

**When asked to "commit and push", only commit and push this repo (`cthiebaud/mundial`). Never touch the parent `aequologica.github.io` repo unless explicitly asked.**

```bash
# Standalone repo only
git add <files> && git commit -m "..." && git push
```

The live site is now served directly from the `cthiebaud/mundial` repo at **https://mundial.cthiebaud.com/**.

`aequologica.cthiebaud.com/mundial/` is a static redirect page — it redirects to `https://mundial.cthiebaud.com/` and requires no further maintenance.

After deploying, re-scrape LinkedIn preview:
**https://www.linkedin.com/post-inspector/**

---

## Social card infographics (`infographics/`)

Vertical 1080×1920 cards for Instagram/LinkedIn, rendered as JPGs via Playwright.

### Files

| File | Purpose |
|---|---|
| `wc2026_top_exporters.html` | Top 5 birth countries by raw player count |
| `wc2026_top_importers.html` | Top importing nations (players born elsewhere) |
| `wc2026_top_exporters.jpg` | Rendered output |
| `wc2026_top_importers.jpg` | Rendered output |
| `3664.jpeg` | Background photo (used by top_exporters) |

### Design

- Body fixed at 1080×1920px, `overflow: hidden`
- `.bg` layer: `background-image` + `filter: brightness(…) saturate(…)`
- `.overlay` layer: `linear-gradient` for readability
- `.content` layer: `z-index:1`, flex column, `padding: 110px 90px 90px`
- Flags via `circle-flags` CDN (`cdn.jsdelivr.net/npm/circle-flags@2/flags/<code>.svg`)
- Amber accent: `#fbbf24` / `#d97706`; bars use `linear-gradient(90deg, #d97706, #fbbf24)`

### Rendering

Requires the local server running (`python3 -m http.server 8000`).

```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1080, "height": 1920})
    page.goto("http://localhost:8000/infographics/wc2026_top_exporters.html",
              wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(2000)
    page.screenshot(path="infographics/wc2026_top_exporters.jpg")
    browser.close()
```

---

## Infographic chain files (`chains/`)

Requires a local server (same `fetch()` constraint as the map).

**Renderers:**

| File | Loads |
|---|---|
| `wc2026_chain_parameterized.html` | Any JSON via `?data=<file>`, default: `wc2026_chain_main.json` |
| `wc2026_chain_longest.html` | Any JSON via `?data=<file>`, default: `wc2026_chain_longest.json` |
| `wc2026_chain_directed.html` | Hardcoded to `wc2026_chain_directed.json` |

**Data:**

| File | Content |
|---|---|
| `wc2026_chain_main.json` | UK → France → … → Croatia (7 hops) |
| `wc2026_chain_longest.json` | Full longest chain (37 links, 38 countries — Nigeria → … → Saudi Arabia) |
| `wc2026_chain_directed.json` | Directed graph of all chains |
| `wc2026_chain_italy.json` | Italy variant (Marcus Thuram first link) |
| `wc2026_chain_kaz.json` | Kazakhstan → … → Algeria (5 hops) |
| `wc2026_chain_loop.json` | Bosnia ⇄ Croatia mutual cycle |
| `VIDEO_BRIEF.md` | Handoff brief for the LinkedIn video production (see below) |
