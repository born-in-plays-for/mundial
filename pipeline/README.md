# Data pipeline

Scripts and source data for the Mundial 2026 choropleth map.

All scripts are designed to run from **any working directory** — they resolve
paths relative to `__file__`, so `python3 pipeline/build_json.py` and
`cd pipeline && python3 build_json.py` are equivalent.

---

## Prerequisites

```bash
pip install requests beautifulsoup4 pandas lxml matplotlib
```

---

## Full pipeline (start from scratch)

### Step 1 — Scrape Wikipedia squad pages → CSV

```bash
python3 pipeline/wc2026_birthplaces.py
```

Fetches player rosters from the Wikipedia page
[2026 FIFA World Cup squads](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads)
plus Wikidata for birth city/country lookup.

Outputs:
- `pipeline/wc2026_players.csv` — full squad roster (1 row per player)
- `pipeline/wc2026_by_birthcountry.csv` — aggregated ranking by birth country

**Known issue:** a small number of players (~20) may have `birth_country` set to
`]`, `[a]` (Wikipedia footnote markers) or `NaN` (missing data). These are
scraping artefacts. See *Fixing missing birth countries* below.

---

### Step 2 — Rebuild JSON from CSV

```bash
python3 pipeline/build_json.py
```

Reads `pipeline/wc2026_players.csv`, writes `wc2026_map_data.json` in the
project root.

- Groups players by birth country to build the `data` array (exports).
- Groups players where `birth_country == nation` to build `natives`.
- Preserves any existing `wiki_langs` / `wiki` fields already in the JSON
  (so it is safe to re-run after `add_wiki_urls.py` without losing Wikipedia links).
- Preserves `pop` (population) data from the existing JSON.

---

### Step 3 — Enrich with Wikipedia URLs

```bash
python3 pipeline/add_wiki_urls.py
```

Fetches langlinks (FR / DE / IT) from the Wikipedia API for every player in
`wc2026_map_data.json` (both `data` and `natives` sections).

Writes `wiki_langs: {en, fr?, de?, it?}` onto every player object.

Typical run time: ~5 minutes (one API call per language per batch of 50 titles,
with 1-second sleep between batches).

---

## Partial updates

### Re-scrape only

If squad data changes (injury replacement, late call-up):

```bash
python3 pipeline/wc2026_birthplaces.py   # update CSV
python3 pipeline/build_json.py           # rebuild JSON
python3 pipeline/add_wiki_urls.py        # re-enrich (only new players need new calls)
```

### Fixing missing birth countries

After step 1, check for bad rows:

```python
import pandas as pd
df = pd.read_csv('pipeline/wc2026_players.csv')
print(df[df['birth_country'].isna() | df['birth_country'].isin([']', '[a]'])])
```

For each player with a bad `birth_country`:
1. Look up their birth city/country on Wikipedia or Wikidata.
2. Edit `pipeline/wc2026_players.csv` directly.
3. Re-run steps 2–3.

---

## Generating the export ratio chart

```bash
python3 pipeline/wc2026_make_ratio_chart.py              # Curaçao excluded (default)
python3 pipeline/wc2026_make_ratio_chart.py --with-curacao
```

Outputs `wc2026_export_ratio.png` in the project root.

Requires `matplotlib` (`pip install matplotlib`).

---

## Files

| File | Description |
|---|---|
| `wc2026_birthplaces.py` | Scraper: Wikipedia / Wikidata → CSV |
| `build_json.py` | Rebuilds `wc2026_map_data.json` from CSV |
| `add_wiki_urls.py` | Enriches JSON with per-language Wikipedia URLs |
| `wc2026_make_ratio_chart.py` | Generates export-ratio bar chart PNG |
| `wc2026_players.csv` | Full squad roster — source of truth |
| `wc2026_by_birthcountry.csv` | Aggregated ranking by birth country |

The JSON (`wc2026_map_data.json`) and PNG (`wc2026_export_ratio.png`) live in
the project root because they are served directly by the web app / referenced
by external articles.

---

## Population data

`pop` in `wc2026_map_data.json` maps country name → population in millions.
This is fetched once by `wc2026_birthplaces.py` via Wikidata and preserved
across `build_json.py` runs. It does not need to be refreshed for the 2026
tournament.
