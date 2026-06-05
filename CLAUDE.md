# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Interactive D3.js choropleth map of the 2026 FIFA World Cup tracking player "exports": players born in one country who represent another. Normalised by population. Includes a Python scraping/data pipeline and several standalone infographic HTML files.

Live at: **https://aequologica.cthiebaud.com/mundial/**
GitHub: **https://github.com/cthiebaud/mundial** (standalone repo, also a submodule of `aequologica/aequologica.github.io`)

---

## File structure

| File | Purpose |
|---|---|
| `wc2026_map_exported.html` | Main map page (Bootstrap 5, loads JS + JSON) |
| `wc2026_map.js` | All D3 rendering, zoom, tooltips, dim/arc logic |
| `wc2026_map_data.json` | All data: player exports by birth country + population |
| `uk-nations.geojson` | 4 UK home nations polygons (Natural Earth 50m) — England, Scotland, Wales, Northern Ireland rendered as separate choropleth features |
| `wc2026_birthplaces.py` | Python scraper: Wikipedia → `wc2026_players.csv` |
| `wc2026_players.csv` | Full squad roster with birth city/country (source of truth) |
| `wc2026_by_birthcountry.csv` | Aggregated ranking by birth country |
| `wc2026_make_ratio_chart.py` | Produces `wc2026_export_ratio.png` from JSON data |
| `wc2026_export_ratio.png` | Bar chart of export ratio (top countries) |
| `wc2026_og.png` | 1200×630 Open Graph preview image for LinkedIn/social |
| `wc2026_chain*.html/json` | Export chain infographics (longest path visualisations) |

---

## Running locally

The map uses `fetch()` so it requires a local HTTP server — **will not work from `file://`**.

```bash
python3 -m http.server 8000
# then open http://localhost:8000/wc2026_map_exported.html
```

---

## Data pipeline

```bash
pip install requests beautifulsoup4 pandas lxml pdfplumber
python wc2026_birthplaces.py          # → wc2026_players.csv
```

The JSON data (`wc2026_map_data.json`) is rebuilt from the CSV using inline Python in the session — see git history for the exact rebuild scripts. Key logic: group by birth country, count exports to each destination nation, compute per-nation sorted lists.

### Generating the ratio chart

```bash
pip install matplotlib
python3 wc2026_make_ratio_chart.py              # Curaçao excluded (default)
python3 wc2026_make_ratio_chart.py --with-curacao
```

### Regenerating the OG image

```python
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1200, "height": 630})
    page.goto("https://aequologica.cthiebaud.com/mundial/wc2026_map_exported.html",
              wait_until="networkidle", timeout=30000)
    page.wait_for_timeout(4000)
    page.screenshot(path="wc2026_og.png")
    browser.close()
```

---

## Key architecture decisions

### UK home nations (no "United Kingdom")
The four home nations (England, Scotland, Wales, Northern Ireland) are handled as fully independent entities:
- `wc2026_players.csv` birth countries: all resolved from city lookup — no "United Kingdom" entries
- Synthetic IDs (no ISO 3166-1 numeric): `8260=England`, `8261=Scotland`, `8262=Wales`, `8263=Northern Ireland`
- ISO2 flag codes: `gb-eng`, `gb-sct`, `gb-wls`, `gb-nir`
- Map rendering: world atlas feature 826 (UK) is **skipped**; `uk-nations.geojson` renders the 4 nations as separate polygons
- Scotland centroid manually overridden to `[-4.2, 56.8]` (island bias in auto-centroid)
- England and Scotland flags placed **after** the `.flag-qualified` D3 data join (placing before causes D3's exit selection to remove them)

### Small island nations (standalone flags)
Cape Verde (id=132) and Curaçao (id=531) don't appear reliably in the 110m topojson — placed manually via `STANDALONE_FLAGS` array with explicit lon/lat.

### Zoom-stable flags and arcs
All `.flag-qualified` images store `data-cx`/`data-cy` (SVG centroid coordinates) and `data-sw` (base stroke-width for arcs). The zoom handler reads these to keep flags and arcs visually consistent at any zoom level.

### Dim / arc mode
- Left-click an exporting country → dims all qualified nation flags except destinations; draws curved arcs with √count-scaled width; shows player table below map
- Any second click → clears dim
- `dimActive` flag prevents tooltip from reappearing during dim
- `currentK` tracks current zoom scale so arcs are drawn at correct size on click

### Data join ordering in the render callback
Order matters for SVG z-layering:
1. World choropleth paths (skip 826)
2. Mesh borders
3. UK nation paths (from `uk-nations.geojson`)
4. `.flag-qualified` world topojson data join
5. England/Scotland flags (must be **after** step 4)
6. STANDALONE_FLAGS
7. `arcsGroup` (above everything, below raised source flag)

---

## Git / deployment

Two repos to update on every change:

```bash
# 1. Commit in standalone repo (_Mundial)
git add <files> && git commit -m "..." && git push

# 2. Update submodule pointer in parent repo
cd /Users/christophe.thiebaud/github.com/aequologica/aequologica.github.io/mundial
git pull
cd ..
git add mundial && git commit -m "mundial: ..." && git push
```

If the submodule has local uncommitted changes (from manual file copies), reset first:
```bash
cd .../aequologica.github.io/mundial
git checkout <modified-file>   # or: git reset --hard origin/main
```

After deploying, re-scrape LinkedIn preview:
**https://www.linkedin.com/post-inspector/**

---

## Infographic chain files

`wc2026_chain_parameterized.html` renders any chain JSON via `?data=<file>`:
- `wc2026_chain_main.json` — UK → France → … → Croatia (7 hops, longest)
- `wc2026_chain_italy.json` — Italy variant (Marcus Thuram first link)
- `wc2026_chain_kaz.json` — Kazakhstan → … → Algeria (5 hops, different geography)
- `wc2026_chain_loop.json` — demonstrates Bosnia ⇄ Croatia mutual cycle

Requires a local server (same `fetch()` constraint as the map).
