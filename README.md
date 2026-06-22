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
| https://mundial.cthiebaud.com/chains/wc2026_chain_parameterized.html | Chain renderer — `?data=wc2026_chain_main.json` (default), `_italy.json`, `_kaz.json`, `_loop.json`, `_longest.json` |
| https://mundial.cthiebaud.com/chains/wc2026_chain_longest.html | Snake renderer — `?data=subgraphs/longest_both.json` (default), any chain JSON |
| https://mundial.cthiebaud.com/chains/wc2026_chain_directed.html | Directed-graph renderer — hardcoded to `wc2026_chain_directed.json` |

---

## Main files

| File | Purpose |
|---|---|
| `index.html` | Entry point — redirects to the map |
| `wc2026_map_exported.html` | Main map page (Bootstrap 5) |
| `js/wc2026_map.js` | All D3 rendering, zoom, tooltips, filter sidebar, Elo tab, dim/arc logic |
| `css/wc2026_map.css` | Base styles (map, header, legend, tooltips) |
| `js/i18n.js` | Language detection, UI strings, `countryName()`, `wikiUrl()` |
| `js/wc2026_elo_ranking.js` | `<elo-ranking>` Web Component + pill helpers |
| `js/qualified.js` | `QUALIFIED_NAMES`, `QUALIFIED_BY_NAME`, `buildEloItems` |
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

All scripts live in `pipeline/`. See `pipeline/README.md` for full instructions.

| File | Purpose |
|---|---|
| `pipeline/wc2026_birthplaces.py` | Scraper: Wikipedia → `pipeline/wc2026_players.csv` |
| `pipeline/build_json.py` | Rebuilds `wc2026_map_data.json` from CSV |
| `pipeline/add_wiki_urls.py` | Enriches JSON with per-language Wikipedia links (`wiki_langs`) |
| `pipeline/fetch_countries.py` | Builds `countries.json` (pop + capital) from mledoze + World Bank + Wikidata |
| `pipeline/patch_uk_nations.py` | Adds UK home nations (8260–8263) to `countries.json` |
| `pipeline/patch_kosovo.py` | Adds Kosovo (383) to `countries.json` and `wc2026_elo_rank.json` |
| `pipeline/update_elo_rankings.py` | Fetches current Elo ratings from eloratings.net → `wc2026_elo_rank.json` |
| `pipeline/build_elo_history.py` | Parses eloratings.net graph.tsv → `wc2026_elo_history.json` |
| `pipeline/add_gdp.py` | World Bank GDP → `wc2026_gdp.json` |
| `pipeline/add_gdp_pc_ppp.py` | World Bank GDP/capita PPP → `wc2026_gdp_pc_ppp.json` |
| `pipeline/add_hdi.py` | UNDP HDI → `wc2026_hdi.json` |
| `pipeline/wc2026_players.csv` | Full squad roster with birth city/country (source of truth) |
| `pipeline/wc2026_by_birthcountry.csv` | Aggregated ranking by birth country |
| `pipeline/wc2026_make_ratio_chart.py` | Bar chart of players born in a country but playing for another |

## chains/

Infographics visualising multi-hop birth-country → plays-for paths.

**Renderers:**

| File | Purpose |
|---|---|
| `wc2026_chain_parameterized.html` | Generic renderer — loads any chain via `?data=<file>` (default: `_main.json`) |
| `wc2026_chain_longest.html` | Snake renderer for the longest chain — loads any chain via `?data=<file>` (default: `subgraphs/longest_both.json`) |
| `wc2026_chain_directed.html` | Directed-graph renderer — loads `_directed.json` |

**Data:**

| File | Content |
|---|---|
| `wc2026_chain_main.json` | UK → France → … → Croatia (7 hops) |
| `subgraphs/` | Longest paths by direction (fwd/bwd/both) — computed by `subgraphs/compute_longest_paths.py` |
| `wc2026_chain_directed.json` | Directed graph of all chains |
| `wc2026_chain_italy.json` | Italy variant (Marcus Thuram first link) |
| `wc2026_chain_kaz.json` | Kazakhstan → … → Algeria (5 hops) |
| `wc2026_chain_loop.json` | Bosnia ⇄ Croatia mutual cycle |
| `VIDEO_BRIEF.md` | Production brief for the LinkedIn chain video (to be implemented) |

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
