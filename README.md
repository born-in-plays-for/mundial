# Mundial 2026 — Birthplace of Players

Interactive D3.js choropleth map of the 2026 FIFA World Cup showing **where players were born**: how many players born in each country are playing in the tournament, whether for that country or for another.

**Live:** https://mundial.cthiebaud.com/

---

## Pages

| URL | Description |
|---|---|
| https://mundial.cthiebaud.com/ | Entry point — redirects to the map |
| https://mundial.cthiebaud.com/wc2026_map_exported.html | Main choropleth map |
| https://mundial.cthiebaud.com/wc2026_correlation.html | Economy vs. player migration scatter plot (GDP/HDI) |
| https://mundial.cthiebaud.com/wc2026_elo_ranking.html | Standalone World Football Elo ranking page |
| https://mundial.cthiebaud.com/wc2026_elo_history.html | Animated Elo rating history (bar chart race) |
| https://mundial.cthiebaud.com/infographics/wc2026_top_exporters.html | Top birth-country infographic (1080×1920) |
| https://mundial.cthiebaud.com/infographics/wc2026_top_importers.html | Top importing-country infographic (1080×1920) |
| https://mundial.cthiebaud.com/wc2026_france_departments.html | France departments choropleth |
| https://mundial.cthiebaud.com/wc2026_live_game.html | Live game tracking (requires backend) |
| https://mundial.cthiebaud.com/guide.html | User guide |
| https://mundial.cthiebaud.com/chains/wc2026_chain_longest.html | Chain snake renderer — `?data=subgraphs/longest_both.json` (default), any chain JSON |

---

## Main files

| File | Purpose |
|---|---|
| `index.html` | Entry point — redirects to the map |
| `wc2026_map_exported.html` | Main map page (Bootstrap 5) |
| `js/wc2026_map.js` | All D3 rendering, zoom, tooltips, filter sidebar, Elo tab, dim/arc logic |
| `js/auth-bar.js` | `<mundial-auth-bar>` Web Component — navbar, auth, offline modal, WebSocket |
| `js/control_sidebar.js` | Filter/sort sidebar logic (imported by `wc2026_map.js`) |
| `css/wc2026_map.css` | Base styles (map, header, legend, tooltips) |
| `js/i18n.js` | Language detection, all UI strings (map + auth-bar + live-game), `countryName()`, `wikiUrl()` |
| `js/wc2026_elo_ranking.js` | `<elo-ranking>` Web Component + pill helpers |
| `js/qualified.js` | `QUALIFIED_NAMES`, `QUALIFIED_BY_NAME`, `buildEloItems` |
| `countries.json` | Population + multilingual capital names by ISO numeric id |
| `css/taxonomy.css` | Canonical pill styling (borders, text colors, dots) |
| `css/control-sidebar.css` | Filter/sort sidebar styles |
| `css/map-container.css` | Map container and dim-mode cursor styles |
| `wc2026_map_data.json` | App data: players by birth country (natives + exported) + population + `wiki_langs` |
| `wc2026_elo_rank.json` | Current World Football Elo ratings (source: eloratings.net) |
| `wc2026_elo_history.json` | Monthly Elo rating history for the animated bar chart race |
| `wc2026_gdp.json` | GDP data (used by correlation page) |
| `wc2026_gdp_pc_ppp.json` | GDP per capita PPP data (used by correlation page) |
| `wc2026_hdi.json` | HDI data (used by correlation page) |
| `uk-nations.geojson` | Polygons for England, Scotland, Wales, Northern Ireland |
| `wc2026_og_v3.png` | 1200×640 Open Graph preview image |

## Data pipeline

The data pipeline lives in **[cthiebaud/mundial-build](https://github.com/cthiebaud/mundial-build)**. Pipeline scripts output JSON/CSV files to this repo's root.

## chains/

Infographics visualising multi-hop birth-country → plays-for paths.

**Renderers:**

| File | Purpose |
|---|---|
| `wc2026_chain_longest.html` | Snake renderer — loads any chain JSON via `?data=<file>` (default: `subgraphs/longest_both.json`) |
| `wc2026_chain_render.js` | Shared chain SVG renderer (ES module) |
| `wc2026_chain_loop.json` | Bosnia ⇄ Croatia mutual cycle (bidirectional export edge case) |
| `subgraphs/` | Longest paths by direction (fwd/bwd/both) — see `subgraphs/README.md` |
| `VIDEO_BRIEF.md` | Production brief for the LinkedIn chain video |

---

## Running locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

The map uses `fetch()` and requires an HTTP server — `file://` will not work.

## Layout

The page has three fixed/sticky zones:

- **Fixed header** (`#page-header`, `z-index: 200`): contains the page quote, attribution, and legend bar. Sits at the very top.
- **Fixed map** (`#map-container`, `z-index: 100`): positioned immediately below the header via a CSS variable (`--page-header-h`). `body.paddingTop` is set by JS to the map container's measured bottom edge so content scrolls below it.
- **Scrollable bottom panel** (`#bottom-panel`): three Bootstrap tabs — **Elo ranking**, **Players** (dim-mode player table), **Longest path** (chain infographic).

**Portrait mobile only** (`max-width: 767.98px` + `orientation: portrait`):
- The tab bar is fixed at the bottom of the viewport above the browser chrome.
- `body { padding-bottom: 48px }` keeps the last line of tab content clear of the fixed tab bar.

Landscape mobile and desktop are unaffected by the portrait-only rules.

## Control sidebar

A collapsible filter/sort panel (`#control-sidebar`) lives in the fixed header (right edge, CSS grid overlap via `#sidebar-host`). It controls which countries are shown in the Elo ranking list and which flags are visible on the map. The filter cube is `qualified × importer × exporter`:

| Category | Default |
|---|---|
| Qualified + importer + exporter | ✓ |
| Qualified + importer only | ✓ |
| Qualified + exporter only | ✓ |
| Qualified, neither | ✓ |
| Non-qualified + exporter | ✓ |
| Non-qualified, neither | unchecked |

Clicking any row/column header toggles all its checkboxes at once.

## Map special cases

**UK home nations**: England, Scotland, Wales, and Northern Ireland are treated as independent entities (synthetic IDs 8260–8263, flag codes `gb-eng` / `gb-sct` / `gb-wls` / `gb-nir`). The world atlas feature for "United Kingdom" (id=826) is skipped; `uk-nations.geojson` renders the four nations as separate choropleth polygons.

**Kosovo**: Not in the iso-3166-1 package's numeric table. Assigned id=383, alpha-2=`xk`. The world-atlas 110m topojson has a Kosovo geometry with no `id` field — patched at runtime before any topojson processing. Displayed in the Elo list with `rank: null`.

**Non-qualified countries**: All countries are clickable on the map and in the Elo list. For countries that don't activate dim mode, clicking pans and zooms the map to that country's centroid (`zoomToCentroid`, k=8). In the Elo list these appear as `elo-item--zoomable` pills (cursor:pointer, hover tint, colour stays `#bbb` to preserve the three-tier visual hierarchy).

## i18n

The UI language follows the browser locale. Supported: **French** (`fr`), **German** (`de`), **Italian** (`it`), **Spanish** (`es`), English (fallback). Country names use the browser's `Intl.DisplayNames` API. Wikipedia player links are available in all five languages; other locales fall back to the English Wikipedia URL.

## Tooltip

Hovering a country triggers one of several tooltip variants (desktop only — tooltips are disabled on mobile):

| Situation | Tooltip shown |
|---|---|
| Players born there, playing for another country (any country) | Export tooltip — single column; non-qualified countries show a *not qualified* badge |
| Qualified country, no exports, but imported players | Import-only tooltip |
| Qualified country with both exports and imports | Two-column tooltip: left = exports, right = imports |
| Qualified country, no exports, no imports | Qualified tooltip with "no export / no import" message |

In dim mode (after clicking a country on the map or in the Elo list), hovering a destination flag shows that country's incoming players from the selected source; hovering a birth-country flag shows its players selected by the dim'd nation. Clicking the active country again clears dim mode.

Player names in the dim-mode player table link to their Wikipedia page in the UI language, with an English fallback.
