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
| `index.html` | Entry point — redirects to the map, carries OG meta tags |
| `wc2026_map_exported.html` | Main map page (Bootstrap 5, loads JS + JSON via ES module) |
| `wc2026_map.js` | ES module — D3 rendering, zoom, tooltips (lit-html), dim/arc logic, i18n |
| `wc2026_map_data.json` | All data: player exports by birth country + population + `wiki_langs` |
| `uk-nations.geojson` | 4 UK home nations polygons (Natural Earth 50m) — England, Scotland, Wales, Northern Ireland rendered as separate choropleth features |
| `wc2026_birthplaces.py` | Python scraper: Wikipedia → `wc2026_players.csv` |
| `add_wiki_urls.py` | Enrichment script: adds `wiki_langs` (en/fr/de/it) to every player in the JSON |
| `wc2026_players.csv` | Full squad roster with birth city/country (source of truth) |
| `wc2026_by_birthcountry.csv` | Aggregated ranking by birth country |
| `wc2026_make_ratio_chart.py` | Produces `wc2026_export_ratio.png` from JSON data |
| `wc2026_export_ratio.png` | Bar chart of export ratio (top countries) |
| `wc2026_og.png` | 1200×630 Open Graph preview image for LinkedIn/social |
| `images/` | Screenshots used in external articles and social posts |
| `chains/` | Export chain infographics — see section below |

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

`wc2026_map.js` is loaded as `<script type="module">` so it can use the `import` statement at the top.

---

## Running locally

The map uses `fetch()` so it requires a local HTTP server — **will not work from `file://`**.

```bash
python3 -m http.server 8000
# then open http://localhost:8000/
```

---

## Data pipeline

```bash
pip install requests beautifulsoup4 pandas lxml pdfplumber
python wc2026_birthplaces.py          # → wc2026_players.csv
```

The JSON data (`wc2026_map_data.json`) is rebuilt from the CSV using inline Python in the session — see git history for the exact rebuild scripts. Key logic: group by birth country, count exports to each destination nation, compute per-nation sorted lists.

After rebuilding, run `add_wiki_urls.py` to re-enrich the JSON with Wikipedia links:

```bash
pip install requests beautifulsoup4
python3 add_wiki_urls.py   # → updates wc2026_map_data.json in-place
```

The script fetches langlinks from the Wikipedia API one language at a time (`lllang=fr`, then `de`, then `it`) so each batch stays within the 500-langlink limit. Results are written as `wiki_langs: {en, fr?, de?, it?}` on each player object.

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

## lit-html architecture

All tooltip rendering and the player table use **lit-html** tagged templates. The pattern is: compute all data variables first (aligned), then a single `render(html\`...\`, container)` call — no string concatenation, no `innerHTML` assignment.

Key helpers (module-level, return `TemplateResult` or `nothing`):
- `popTag(pop)` — renders `<span class="tt-pop">pop. xM</span>` with locale-aware decimal separator, or `nothing`
- `flagImg(code)` — renders `<img class="tt-flag" src="...">` (circle-flags CDN), or `nothing`
- `ptWikiRow(p)` — renders a player name with optional Wikipedia link in the UI language

Tooltip functions (all inside the Promise callback, access `POP` closure):
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
- Map rendering: world atlas feature 826 (UK) is **skipped**; `uk-nations.geojson` renders the 4 nations as separate polygons
- Scotland centroid manually overridden to `[-4.2, 56.8]` (island bias in auto-centroid)
- England and Scotland flags placed **after** the `.flag-qualified` D3 data join (placing before causes D3's exit selection to remove them)

### Small island nations (standalone flags)
Cape Verde (id=132) and Curaçao (id=531) don't appear reliably in the 110m topojson — placed manually via `STANDALONE_FLAGS` array with explicit lon/lat.

### Zoom-stable flags and arcs
All `.flag-qualified` images store `data-cx`/`data-cy` (SVG centroid coordinates) and `data-sw` (base stroke-width for arcs). The zoom handler reads these to keep flags and arcs visually consistent at any zoom level.

### i18n
UI language follows the browser locale (`navigator.languages[0]`). Supported: `fr`, `de`, `it`, `en` (fallback). Country names use `Intl.DisplayNames` keyed by ISO 3166-1 alpha-2 codes (from the `ISO2` map). A small `_OVERRIDE` map handles non-standard cases (UK home nations use subdivision codes `gb-eng` etc., historical states with no ISO code). UI label strings live in the `T` object, indexed by `LANG`. Static page elements (`<title>`, `<h1>`, etc.) are patched from JS at load time.

### Tooltip — two-column layout
Every tooltip header shows `[flag] Country name` left-aligned and `pop. xM` right-aligned on the same row. Population uses `Intl.toLocaleString(LOCALE, …)` for locale-aware decimal separators. `POP_REF` (module-level) holds population by country name for qualified nations without exports; `POP` (Promise closure) holds the full map.

The main (non-dim) tooltip shows two columns when hovering over a country that both exports players AND is a qualified nation:
- **Left column**: raw export count (big number) + ratio/million (small sub) + destination nations + top 5 players with `→ destination`
- **Right column**: raw import count (big number, red) + `/ 26` label + birth nations + top 5 players sorted by caps with `← birth country`

Collapses to a single column when one side is empty.

`IMPORT_BY_NATION` (module-level, populated on data load) maps each qualified nation ID to the list of imported players. Self-import is excluded by comparing `countryName()` output for birth country and nation — this catches name-mismatch cases like DR Congo (`id=null`, name="Democratic Republic of the Congo") vs. qualified nation 180 ("DR Congo").

### Wikipedia links in player table
Players in the dim-mode table link to their Wikipedia page in the UI language when available, with `(en)` fallback link otherwise. `wiki_langs: {en, fr?, de?, it?}` is stored per player in the JSON and populated by `add_wiki_urls.py`.

### Mobile layout
On screens narrower than 768px (`d-md-none` / `d-md-flex` Bootstrap breakpoint):
- The desktop `<header>` is hidden (`d-none d-md-flex`)
- The legend row becomes two columns: **left** = title + subtitle (mobile only, `d-md-none`), **right** = legend bar + caption
- Legend bar and ticks shrink to 90px max-width via `@media (max-width: 767.98px)`
- Legend caption and legend bar are right-aligned on mobile, left-aligned on desktop

### Player table
Shown below the map in dim mode. Structure rendered by `playerTableTemplate` via lit-html:
- Header row: `[flag] Country` left + `pop. xM` right
- Export section (bordered top): count heading + grouped player rows by destination nation
- Import section (bordered top, conditional): count heading + grouped player rows by birth country
- Player names link to Wikipedia in the UI language when `wiki_langs` data is available

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

**When asked to "commit and push", only commit and push the `_Mundial` repo. Never touch the parent `aequologica.github.io` repo unless explicitly asked.**

```bash
# Standalone repo only
git add <files> && git commit -m "..." && git push
```

The parent submodule repo (`aequologica/aequologica.github.io`) is updated manually by the user when they choose. If asked explicitly:

```bash
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

## Infographic chain files (`chains/`)

`chains/wc2026_chain_parameterized.html` renders any chain JSON via `?data=<file>`:
- `wc2026_chain_main.json` — UK → France → … → Croatia (7 hops, longest)
- `wc2026_chain_italy.json` — Italy variant (Marcus Thuram first link)
- `wc2026_chain_kaz.json` — Kazakhstan → … → Algeria (5 hops, different geography)
- `wc2026_chain_loop.json` — demonstrates Bosnia ⇄ Croatia mutual cycle

`chains/wc2026_chain.html`, `chains/wc2026_chain_italy.html`, `chains/wc2026_chain_kaz.html` are standalone versions of the above.

Requires a local server (same `fetch()` constraint as the map).
