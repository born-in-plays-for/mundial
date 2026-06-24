# mundial

Static frontend for the [Born In, Plays For](https://github.com/born-in-plays-for) project — interactive D3.js choropleth map of the 2026 FIFA World Cup showing where players were born vs. which country they represent.

**Live at [mundial.cthiebaud.com](https://mundial.cthiebaud.com/)**

## Pages

| URL | Description |
|---|---|
| [/](https://mundial.cthiebaud.com/) | Entry point — redirects to the map |
| [/wc2026_map_exported.html](https://mundial.cthiebaud.com/wc2026_map_exported.html) | Main choropleth map |
| [/wc2026_france_departments.html](https://mundial.cthiebaud.com/wc2026_france_departments.html) | France departments choropleth |
| [/wc2026_live_game.html](https://mundial.cthiebaud.com/wc2026_live_game.html) | Live game tracking (requires backend) |
| [/wc2026_elo_ranking.html](https://mundial.cthiebaud.com/wc2026_elo_ranking.html) | Standalone Elo ranking page |
| [/guide.html](https://mundial.cthiebaud.com/guide.html) | User guide |
| [/pages/wc2026_correlation.html](https://mundial.cthiebaud.com/pages/wc2026_correlation.html) | Economy vs. player migration scatter plot |
| [/pages/wc2026_elo_history.html](https://mundial.cthiebaud.com/pages/wc2026_elo_history.html) | Animated Elo rating history (bar chart race) |
| [/chains/wc2026_chain_longest.html](https://mundial.cthiebaud.com/chains/wc2026_chain_longest.html) | Export chain snake renderer |
| [/infographics/wc2026_top_exporters.html](https://mundial.cthiebaud.com/infographics/wc2026_top_exporters.html) | Top birth-country infographic (1080×1920) |
| [/infographics/wc2026_top_importers.html](https://mundial.cthiebaud.com/infographics/wc2026_top_importers.html) | Top importing-country infographic (1080×1920) |

## Structure

```
index.html                    Entry point (redirect + OG tags)
wc2026_map_exported.html      Main map page
wc2026_france_departments.html
wc2026_live_game.html
wc2026_elo_ranking.html
guide.html
js/
  wc2026_map.js               D3 rendering, zoom, tooltips, dim/arc logic
  auth-bar.js                 <mundial-auth-bar> Web Component
  wc2026_elo_ranking.js       <elo-ranking> Web Component
  control_sidebar.js          Filter/sort sidebar
  i18n.js                     Language detection, UI strings, countryName()
  qualified.js                Qualified countries + Elo item builder
css/
  wc2026_map.css              Map, header, legend, tooltips
  taxonomy.css                Pill styling
  control-sidebar.css         Sidebar styles
  map-container.css           Map container + dim-mode cursor
data/                         ⬅ git submodule → mundial-data
  wc2026_map_data.json        Player exports + population + wiki_langs
  wc2026_elo_rank.json        Current Elo ratings
  wc2026_elo_history.json     Monthly Elo history
  countries.json              Population + multilingual capitals
  uk-nations.geojson          UK home nations polygons
  wc2026_gdp.json             GDP data
  wc2026_gdp_pc_ppp.json      GDP per capita PPP
  wc2026_hdi.json             HDI data
pages/                        Standalone analysis pages
chains/                       Export chain infographics
infographics/                 Social card infographics (1080×1920)
backend_config.json           ngrok URL (auto-updated by mundial-server)
```

## Running locally

```bash
python3 -m http.server 8000
# open http://localhost:8000/
```

The map uses `fetch()` and requires an HTTP server — `file://` will not work.

After cloning, initialise the data submodule:

```bash
git submodule update --init
```

## Tech stack

All dependencies from jsDelivr CDN — no build step:

| Package | Purpose |
|---|---|
| D3 7 | Map rendering, zoom, data joins |
| lit-html 3 | HTML templating (all dynamic HTML) |
| Bootstrap 5 | Responsive layout |
| topojson-client | GeoJSON extraction |
| circle-flags / flag-icons | Country flag SVGs |
| iso-3166-1 | Country code lookups |
| socket.io-client 4 | WebSocket (auth + live game) |
| world-atlas | 110m TopoJSON world map |

## i18n

UI language follows the browser locale. Supported: French, German, Italian, Spanish, English (fallback). Country names via `Intl.DisplayNames`. Wikipedia player links in all five languages.

## See also

- [born-in-plays-for](https://github.com/born-in-plays-for) — org overview + architecture diagram
- [mundial-data](https://github.com/born-in-plays-for/mundial-data) — shared data files (submodule)
- [mundial-build](https://github.com/born-in-plays-for/mundial-build) — data pipeline
- [mundial-server](https://github.com/born-in-plays-for/mundial-server) — backend
