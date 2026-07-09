# mundial

Static frontend for the [Born In, Plays For](https://github.com/born-in-plays-for) project — interactive D3.js choropleth map of the 2026 FIFA World Cup showing where players were born vs. which country they represent.

**Live at [mundial.cthiebaud.com](https://mundial.cthiebaud.com/)**

## Pages

| URL | Description |
|---|---|
| [/](https://mundial.cthiebaud.com/) | Entry point — redirects to the map |
| [/wc2026_map.html](https://mundial.cthiebaud.com/wc2026_map.html) | Main choropleth map |
| [/wc2026_countries.html](https://mundial.cthiebaud.com/wc2026_countries.html) | Countries reference table |
| [/wc2026_players.html](https://mundial.cthiebaud.com/wc2026_players.html) | Players & coaches table |
| [/wc2026_live.html](https://mundial.cthiebaud.com/wc2026_live.html) | Live game tracking (requires backend) |
| [/guide.html](https://mundial.cthiebaud.com/guide.html) | User guide |
| [/chains/wc2026_chain_longest.html](https://mundial.cthiebaud.com/chains/wc2026_chain_longest.html) | Export chain snake renderer |
| [/insights/france.html](https://mundial.cthiebaud.com/insights/france.html) | France departments choropleth |
| [/insights/perf.html](https://mundial.cthiebaud.com/insights/perf.html) | Regional performance analysis |
| [/insights/status.html](https://mundial.cthiebaud.com/insights/status.html) | Elimination status bar chart, toggle between imports/exports ranking |

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

**Tip:** Configure git to automatically update submodules on pull:
```bash
git config submodule.recurse true
```
This eliminates the need to manually run `git submodule update` after each pull.

## Data

All data files live in the `data/` directory, which is a git submodule pointing to [mundial-data](https://github.com/born-in-plays-for/mundial-data). The submodule holds only the pid-keyed `v2/` files consumed by the frontend, plus two top-level files — nothing pipeline-internal is published here anymore (see below):

| File | Contents |
|---|---|
| `v2/map.json` | Player export/import data, populations, capitals, native players (pid-keyed) |
| `v2/live.json` | Live-game player/coach id → pid + birth country lookup, plus API-Football team id → iso2 (`teams` key) |
| `v2/status.json` | Tournament elimination status per team — eliminating round, date, and who knocked them out |
| `v2/wiki_<lang>.json` ×5 | Wikipedia URL templates + per-pid article titles, one file per UI language |
| `elo_rank.json` | Elo rankings for all 48 qualified countries |
| `uk-nations.geojson` | England, Scotland, Wales, Northern Ireland polygons |

`r32_teams.json` (Round-of-32 squad data) has been removed — superseded by `v2/live.json`'s `teams` key. `countries.json` (population/capital lookups) has moved out of this submodule entirely, into `pipeline/countries.json` in [mundial-build](https://github.com/born-in-plays-for/mundial-build) — it's a pipeline build input, not a frontend asset; population/capital already end up baked into `v2/map.json`.

Data is updated daily by the [mundial-build](https://github.com/born-in-plays-for/mundial-build) pipeline and automatically deployed via GitHub Actions.

## Deploy

GitHub Actions deploys to Pages on every push. The `data/` submodule is cached by its commit SHA — the workflow itself finishes in ~5s on a cache hit; the remaining ~3m is artifact upload + GitHub Pages CDN queue.

```mermaid
flowchart TD
    push["push to main (code change)"]
    dispatch["repository_dispatch (daily Elo update)"]
    manual["workflow_dispatch (manual)"]

    sha["resolve HEAD:data SHA"]

    cache{"cache hit? key: data-SHA"}

    hit["use cached data/ (~1s)"]
    miss["git submodule update + save cache (~30s)"]

    upload["upload artifact (~42s)"]
    cdn["Pages CDN queue (~1m 40s)"]

    pages["GitHub Pages live"]

    push --> sha
    dispatch --> sha
    manual --> sha
    sha --> cache
    cache -- yes --> hit --> upload
    cache -- no --> miss --> upload
    upload --> cdn --> pages
```

A cache miss happens only on the first deploy after a data submodule bump — the fresh fetch saves the cache, so the next push hits it immediately.

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

## Control bar state

`wc2026_map.html` and `wc2026_countries.html` share `#control-sidebar` (`js/control_sidebar.js`); `wc2026_players.html` has its own `#sidebar-host` panel (`js/players_sidebar.js`). Both persist to `localStorage` and both are deep-linkable via URL params — a subset of that state is genuinely shared between the two (same `localStorage` slice, same URL param name), the rest is page-private:

```mermaid
flowchart TB
  subgraph SHARED["Shared state — localStorage slice 'shared', same URL param names on both pages"]
    direction TB
    S1["sort criteria order<br/>elo / pop / delta / alpha<br/>(control-sidebar also has 2 hidden-from-UI keys: imp / exp)<br/>URL: sort=k1,k2 (control) · psort=mode:key (players, leading key only)"]
    S2["sort direction<br/>asc / desc<br/>URL: dir="]
    S3["tournament stage<br/>group / r32 / r16 / qf / sf / final / winner<br/>URL: stage="]
    S4["confederation filter<br/>uefa / afc / caf / conmebol / concacaf / ofc / none<br/>URL: fifaconf="]
  end

  subgraph CONTROL["#control-sidebar only — map + countries pages<br/>localStorage slice 'countries'"]
    direction TB
    C1["category cells shown<br/>qie / qi / qe / q / ef / en / of / on<br/>(+ aliases: qual / nq / exp / nexp / imp / all)<br/>URL: show="]
    C2["display mode<br/>team / match<br/>URL: display="]
    C3["not persisted, UI-only:<br/>collapse toggle (ESC) · params-badge explain panel · Share button"]
  end

  subgraph PLAYERS["#sidebar-host only — players page<br/>localStorage slice 'players'"]
    direction TB
    P1["sort mode<br/>player / playsFor / bornIn<br/>(picks which country a row is ranked by; 'player' has no criteria of its own)<br/>URL: bundled into psort="]
    P2["origin filters<br/>native / moved<br/>URL: pshow="]
    P3["confederation scope<br/>bornIn / playsFor<br/>(which country the fifaconf filter checks)<br/>URL: pconfscope="]
    P4["not persisted, UI-only:<br/>Share button"]
  end

  SHARED --- CONTROL
  SHARED --- PLAYERS
```

## See also

- [born-in-plays-for](https://github.com/born-in-plays-for) — org overview + architecture diagram
- [mundial-data](https://github.com/born-in-plays-for/mundial-data) — shared data files (submodule)
- [mundial-build](https://github.com/born-in-plays-for/mundial-build) — data pipeline
- [mundial-server](https://github.com/born-in-plays-for/mundial-server) — backend
