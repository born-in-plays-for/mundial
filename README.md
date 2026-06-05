# Mundial 2026 — Exported Players

Interactive D3.js choropleth map of the 2026 FIFA World Cup tracking **player exports**: players born in one country who represent another national team, normalised by population.

**Live:** https://aequologica.cthiebaud.com/mundial/

---

## Main files

| File | Purpose |
|---|---|
| `index.html` | Entry point — redirects to the map |
| `wc2026_map_exported.html` | Main map page (Bootstrap 5) |
| `wc2026_map.js` | All D3 rendering, zoom, tooltips, dim/arc logic, i18n |
| `wc2026_map_data.json` | App data: player exports by birth country + population |
| `uk-nations.geojson` | Polygons for England, Scotland, Wales, Northern Ireland |
| `wc2026_og.png` | 1200×630 Open Graph preview image |
| `wc2026_export_ratio.png` | Bar chart of export ratio (top countries) |

## Data pipeline

| File | Purpose |
|---|---|
| `wc2026_birthplaces.py` | Scraper: Wikipedia → `wc2026_players.csv` |
| `add_wiki_urls.py` | Enriches JSON with per-language Wikipedia links (`wiki_langs`) |
| `wc2026_players.csv` | Full squad roster with birth city/country (source of truth) |
| `wc2026_by_birthcountry.csv` | Aggregated ranking by birth country |
| `wc2026_make_ratio_chart.py` | Generates `wc2026_export_ratio.png` from JSON data |

## chains/

Standalone export-chain infographics visualising the longest multi-hop
birth-country → selection paths.

| File | Purpose |
|---|---|
| `wc2026_chain_parameterized.html` | Generic renderer — loads any chain via `?data=<file>` |
| `wc2026_chain.html` | Standalone chain page |
| `wc2026_chain_main.json` | UK → France → … → Croatia (7 hops, longest) |
| `wc2026_chain_italy.json` | Italy variant (Marcus Thuram first link) |
| `wc2026_chain_kaz.json` | Kazakhstan → … → Algeria (5 hops) |
| `wc2026_chain_loop.json` | Bosnia ⇄ Croatia mutual cycle |
| `wc2026_chain_italy.html` | Standalone Italy chain page |
| `wc2026_chain_kaz.html` | Standalone Kazakhstan chain page |

## images/

Screenshots used in external articles and social posts.

---

## Running locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

The map uses `fetch()` and requires an HTTP server — `file://` will not work.

## i18n

The UI language follows the browser locale. Supported: **French** (`fr`), **German** (`de`), **Italian** (`it`), English (fallback). Country names use the browser's `Intl.DisplayNames` API.

## Tooltip

Hovering a country shows a two-column tooltip when the country both exports players and is a qualified nation — export data on the left, import data on the right. Collapses to one column when either side is empty. Player names in the dim-mode table link to their Wikipedia page in the UI language, with an `(en)` fallback.
