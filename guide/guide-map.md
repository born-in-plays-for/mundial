<!-- i18n:page_title -->
# Born In / Plays For
<!-- /i18n:page_title -->

<!-- i18n:intro -->
This map visualises the 2026 FIFA World Cup squads through the lens of birthplace.
Each country is shaded by a player-migration metric you choose — see *The Legend*, below —
covering players born there, players who play there, or the balance between the two.
<!-- /i18n:intro -->

<!-- i18n:quotes -->
## The Twisted Quotes

The header area shows a rotating carousel of 15 famous literary quotes —
from François Villon (1461) to Simone de Beauvoir (1949) — each playfully
twisted into a football line.

Navigate between quotes using the left-oriented chevrons, or swipe right on touch screens.
Long-press (or hold the mouse button) on a quote to reveal the original line; release to go back.

Swiping left, on the other hand, reveals a different panel entirely — the Control Panel,
covering how countries are filtered, sorted, and displayed.
<!-- /i18n:quotes -->

<!-- i18n:control_sidebar -->
## The Control Panel

The <kbd style="background:var(--bg-hover,#f0ede8);border:1px solid var(--border,#e4e0d8);color:var(--text-muted,#999);border-radius:0 4px 4px 0">‹</kbd> button in the top-right corner of the window opens the control panel,
controlling what appears on the map and in the country list.

![Control panel](screenshots/control_sidebar.png)

The panel has five parts: a **toolbar** across the top; **sort** and **view** stacked on the left; the **filter** matrix on the right; and an **infobar** along the bottom.

### Toolbar

- <img class="gp-icon" src="images/solar_linear/alt-arrow-right-svgrepo-com.svg" alt="collapse"> collapses the panel back to its ‹ button.
- <img class="gp-icon" src="images/solar_linear/widget-5-svgrepo-com.svg" alt="confederation"> filters the list to a single FIFA confederation — see *FIFA confederation filter*, below.
- <img class="gp-icon" src="images/solar_linear/share-svgrepo-com.svg" alt="share"> copies a URL reproducing the panel's current configuration.
- <img class="gp-icon" src="images/solar_linear/question-circle-svgrepo-com.svg" alt="params"> shows which URL parameters are active for the current state — the same panel `?explain` opens on any page load.

### Sort

Four reorderable criteria — **Elo ranking** (an independent rating that adjusts after every match based on the result and the opponent's strength — see *Data Sources*, below), **population**, **Δ** (delta of plays-for minus born-in), **A–Z** — plus a direction toggle (↓↑) to reverse ascending/descending. Only the top two criteria are actually used; click a criterion to move it to the top of the list.

### View

Switches the country list between **teams** (one pill per country, the default) and **matches** (one row per fixture, opponents paired side by side) — see *Team / match view*, below.

### Filter

The matrix crosses two **columns** (exporter / non-exporter) with four **rows** in two groups:

- **Qualified** — split by whether the country imports players or not
- **Non-qualified** — split by FIFA membership

Uncheck any cell to hide that category. Click a row or column header to toggle the whole group at once.

### Infobar

Shows how many countries are currently visible out of the total, and the data source (and last-updated date) for whichever criterion is primary in the sort column.

### Team / match view

The view switch only does something once the tournament stage carousel — in the Country List tab below the map, not this panel; see *The Bottom Panel*, below — has moved past **Group stage**: there's no single fixture to pair a team with before the knockout rounds start, so it stays disabled until then.

In match view, each row shows both teams either side of the kickoff date/score:

- Not yet played: the kickoff date, and a wavy top/bottom border on both pills — a "some assembly required" look for a fixture that could still go either way.
- Played: the score (plus penalty shootout result, if it went that far) in place of the date, and the losing team's flag greyed out.

### FIFA confederation filter

The <img class="gp-icon" src="images/solar_linear/widget-5-svgrepo-com.svg" alt="confederation"> button next to the **FIFA** row opens a dropdown to filter the list to a single confederation. Non-FIFA countries are unaffected — they remain visible or hidden according to the rest of the filter matrix.

Selecting a confederation also highlights its external boundary on the map and zooms to fit it in view. Select **All FIFA Confederations** to clear the filter.

### URL query parameters

The filter and sort state can also be configured directly from the URL — `?sort=`, `?dir=`, `?stage=`, `?show=`, `?fifaconf=`, `?display=`. Add `?explain` to any URL to open a panel describing what the active parameters do. The full reference with all cell codes, group aliases and examples is in the [Countries page guide](?guide=countries).

### About the country reference

The map and the list use [eloratings.net](https://www.eloratings.net/) as the source of countries —
not the FIFA member list. This means the list includes non-FIFA territories such as Greenland,
but also unusual cases like the four UK home nations — sub-national entities
with their own FIFA membership, recognised separately by both FIFA and Elo.
The default sort order is by Elo rating; other sort criteria are available in the sort column.
<!-- /i18n:control_sidebar -->

<!-- i18n:tax_heading -->
## Country Categories
<!-- /i18n:tax_heading -->

<!-- i18n:tax_intro -->
Every country is displayed as a **pill badge** whose CSS style encodes its category at a glance.
<!-- /i18n:tax_intro -->

<div class="taxonomy" style="display:flex;flex-direction:column;gap:16px;margin:1rem 0">

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_qualified -->Qualified vs. non-qualified<!-- /i18n:tax_label_qualified --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cz.svg" alt="">
    <span class="elo-name" data-id="203">Czech Republic</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_yes -->Solid border — qualified and still in the tournament.<!-- /i18n:tax_desc_border_yes --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--knocked-out" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ir.svg" alt="">
    <span class="elo-name" data-id="364">Iran</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_dashed -->Dashed border, dimmed name — qualified but knocked out.<!-- /i18n:tax_desc_border_dashed --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ua.svg" alt="">
    <span class="elo-name" data-id="804">Ukraine</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_no -->No border — not qualified.<!-- /i18n:tax_desc_border_no --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_fifa -->FIFA vs. non-FIFA<!-- /i18n:tax_label_fifa --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/is.svg" alt="">
    <span class="elo-name" data-id="352">Iceland</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_text_dark -->Dark text — FIFA member.<!-- /i18n:tax_desc_text_dark --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/gl.svg" alt="">
    <span class="elo-name" data-id="304">Greenland</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_text_light -->Light text — not a FIFA member.<!-- /i18n:tax_desc_text_light --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_born -->Born here / plays for<!-- /i18n:tax_label_born --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--exp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/it.svg" alt="">
    <span class="elo-name" data-id="380">Italy</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#3b82f6">▶</span> <!-- i18n:tax_desc_exp -->Players born in this country play for another qualified country.<!-- /i18n:tax_desc_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#ef4444">◀</span> <!-- i18n:tax_desc_imp -->Players born in another country play for this country.<!-- /i18n:tax_desc_imp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#ef4444">◀</span><span style="color:#3b82f6">▶</span> <!-- i18n:tax_desc_both -->Players born elsewhere play for this country, and players born here play for other countries.<!-- /i18n:tax_desc_both --></span>
</div>
<div style="font-size:.8rem;color:#777;margin:6px 0"><!-- i18n:tax_note_gradient -->The pill's background is itself a red (imports) → white (native) → blue (exports) gradient — the wider a colour's band, the larger that group's share of the country's total player pool.<!-- /i18n:tax_note_gradient --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="--exp-color: rgb(59,130,246); --imp-color: rgb(248,173,173); --imp-pivot: 2.8%; --native-pivot: 25.0%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
    <span class="elo-pts"><span class="elo-pts-primary">3 · 81</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_exp -->Mostly blue — a heavy exporter (81) with only a handful of imports (3).<!-- /i18n:tax_desc_gradient_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="--exp-color: rgb(155,193,250); --imp-color: rgb(248,167,167); --imp-pivot: 14.3%; --native-pivot: 72.8%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/gb-eng.svg" alt="">
    <span class="elo-name" data-id="8260">England</span>
    <span class="elo-pts"><span class="elo-pts-primary">7 · 22</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_mixed -->A visible red band alongside the blue — a more even mix of imports (7) and exports (22).<!-- /i18n:tax_desc_gradient_mixed --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--knocked-out elo-item--imp" style="--imp-color: rgb(239,68,68); --imp-pivot: 96.3%; --native-pivot: 100.0%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
    <span class="elo-pts"><span class="elo-pts-primary">26</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_imp -->Almost entirely red — nearly the whole squad (26) was born elsewhere.<!-- /i18n:tax_desc_gradient_imp --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555"><!-- i18n:tax_label_offmap -->Off the map<!-- /i18n:tax_label_offmap --></div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px"><!-- i18n:tax_note_offmap -->Orthogonal to the categories above.<!-- /i18n:tax_note_offmap --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/sg.svg" alt="">
    <span class="elo-name" data-id="702">Singapore</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_nomap --><em>Italic</em> name and dimmed flag — too small to appear on the map.<!-- /i18n:tax_desc_nomap --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/mc.svg" alt="">
    <span class="elo-name" data-id="492">Monaco</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_nomap_nonfifa -->Same, here combined with non-FIFA.<!-- /i18n:tax_desc_nomap_nonfifa --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555"><!-- i18n:tax_label_fixture -->Fixtures (match view)<!-- /i18n:tax_label_fixture --></div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px"><!-- i18n:tax_note_fixture -->Only shown in match view — see Team / match view, above.<!-- /i18n:tax_note_fixture --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-viz--match" style="display:inline-flex">
    <span class="elo-item elo-item--qualified elo-item--pending" style="flex-shrink:0">
      <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/de.svg" alt="">
      <span class="elo-name" data-id="276">Germany</span>
    </span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_pending -->Wavy border, dimmed name — fixture not yet played.<!-- /i18n:tax_desc_pending --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--lost" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/br.svg" alt="">
    <span class="elo-name" data-id="76">Brazil</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_lost -->Dimmed flag — lost a decided fixture.<!-- /i18n:tax_desc_lost --></span>
</div>
</div>

</div>

<!-- i18n:map -->
## The Map

### Choropleth & Flags

Each country is shaded by the active colour theme's metric (see *The Legend*, below) —
the darker the shade, the higher the value. Countries with no data for that metric appear in a neutral pale tone.
Countries currently included in the filter display a circular flag marker.

### Zoom & Pan

Scroll (or pinch) to zoom · drag to pan. Three round buttons float over the map's bottom-left corner:

- <img class="gp-icon" src="images/solar_linear/global-svgrepo-com.svg" alt="reset"> zooms back out to fit all countries in view.
- <img class="gp-icon" src="images/solar_linear/maximize-square-2-svgrepo-com.svg" alt="span"> — when a country is selected, zooms and pans to fit all highlighted countries at once.
- A small circular colour swatch cycles the map's colour theme — see *The Legend*, below.

### The Legend

The map has three colour themes, cycled via the swatch button described in *Zoom & Pan* above — each shades countries by a different metric:

| Theme | Colours by |
|---|---|
| **Diverging** (default) | Net talent balance — home-grown contribution (exports + native-born players) minus imports. Net exporters and net importers read as two different colours either side of a neutral midpoint. |
| **Forest** | Export count — players born here, now playing elsewhere. |
| **Earthy** | Import count — players born elsewhere, now playing here. |

For **Diverging**, the colour bar at the bottom of the header reads left to right like a number line — negative extreme, neutral 0 in the middle, positive extreme — with a reference tick at each end and midpoint, and a standalone dot *at each end* for the country furthest off scale on that side (biggest net importer, biggest net exporter). For **Forest** and **Earthy**, the bar instead runs dark-to-pale from left to right, with a single standalone dot for the one country furthest off scale.
Whichever theme is selected persists across visits.

### Tooltips

Hover any country to see details. Tooltips are not shown on mobile.

- **Birth countries**: export count and top players, each with their destination flag
- **Qualified countries that also recruit**: a right-hand column adds the import side
- **Non-qualified birth countries**: a *not qualified* badge replaces the squad panel
<!-- /i18n:map -->

<!-- i18n:bottom_panel -->
## The Bottom Panel

The scrollable area below the map has three tabs.

### <img class="gp-icon" src="images/solar_linear/elo_tab_cup.svg" alt=""> The Country List

The default tab lists every country as a pill badge.
The Control Panel controls which badges appear and in what order;
the default sort is by [World Football Elo rating](https://www.eloratings.net/).

A small carousel sits above the list, cycling through seven positions: **Group stage → Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Final → Winner**.

- Use the ‹ › arrows, or swipe left/right on touch screens, to move between stages.
- Each position filters qualified countries down to those that "reached" that stage — still alive going into it, or having already won it.
- Navigation is capped at the furthest stage the tournament has actually reached; later positions stay locked until real fixtures resolve into them.

The carousel acts as an additional filter, layered on top of the Control Panel — you can, for example,
show only Round of 16 teams that are also exporters by advancing the carousel and unchecking the non-exporter column in the panel.
It only filters the four **qualified** rows (importer / non-importer × exporter / non-exporter); the four **non-qualified** rows (FIFA / non-FIFA × exporter / non-exporter) are orthogonal to it and stay unaffected at every position — they have no tournament stage of their own to reach.

Clicking a badge selects that country and zooms the map to it.

For countries with **born-in / plays-for** connections, coloured arrows also appear on the map:

- {{ARROW_BLUE}} **blue arrows**: squads that include players born in the selected country
- {{ARROW_RED}} **red arrows**: countries where players born elsewhere play for this squad

*Arrow thickness is proportional to the number of players.*

The <img class="gp-icon" src="images/solar_linear/maximize-square-2-svgrepo-com.svg" alt="span"> button then fits all connected countries in view at once.
The <img class="gp-icon" src="images/solar_linear/global-svgrepo-com.svg" alt="reset"> button restores the initial pan/zoom, optimised to fit every country in view.

Click the active badge a second time, click anywhere else on the map, or press **Esc** to deselect.

### The Player Table

When a country is selected, the player table shows three sections:

| Section | Contents |
|---|---|
| **Born here / plays for another** | Players born in this country, grouped by the squad they represent |
| **Born here / plays for this country** | Players born here who also represent this country |
| **Born elsewhere / plays for this country** | Players born in another country who represent this squad, grouped by birth country |

Player names link to their Wikipedia page in the current interface language when available.

### <img class="gp-icon" src="images/wc2026.svg" alt=""> Chains

The chain tab shows sequences of countries linked by born-in / plays-for connections:
a player born in A plays for B, a player born in B plays for C — and so on,
forming a chain of nationalities across the tournament.
<!-- /i18n:bottom_panel -->

<!-- i18n:data_sources -->
## Data Sources

| Source | Used for |
|---|---|
| [eloratings.net](https://www.eloratings.net/) | World Football Elo rankings |
| [Wikipedia — 2026 World Cup squads](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads) | Player names, cap counts |
| [Wikipedia API](https://en.wikipedia.org/w/api.php) | Each player's Wikipedia page resolved in 5 languages (en, fr, de, it, es) |
| [Wikipedia — List of FIFA country codes](https://en.wikipedia.org/wiki/List_of_FIFA_country_codes) | FIFA membership |
| [Wikidata](https://www.wikidata.org/) | Birth countries |
| [World Bank](https://data.worldbank.org/) | Country populations |

**Elo ratings** work like the chess rating system they're named after: every match moves both teams'
scores up or down depending on the result, the goal margin, and how strong the opponent was rated
going in — beating a highly-rated team gains far more than beating a weak one. Unlike the official
FIFA World Ranking, which only updates a handful of times a year, Elo recalculates after each match
and reacts immediately to results, which is why [eloratings.net](https://www.eloratings.net/) is used
as this site's country reference instead of FIFA's own list.

**Birth country resolution** is the most delicate step in the pipeline.
The Wikipedia squad page does not list where players were born — it only provides their names
and links to their individual Wikipedia pages.
The pipeline uses those links as keys to query [Wikidata](https://www.wikidata.org/)
via SPARQL, retrieving each player's recorded place of birth and the country that place belongs to.
This two-step lookup (Wikipedia → Wikidata) is what makes it possible to draw the born-in / plays-for connections on the map.

These sources feed an automated pipeline that merges, cross-references,
and enriches the raw data before publishing it to this page.
Elo rankings are refreshed daily; squad data is updated manually when squads change.
<!-- /i18n:data_sources -->

```mermaid
flowchart LR
  ELO["eloratings.net\nElo rankings"] --> P
  WP["Wikipedia\nsquad page · FIFA codes\nplayer pages × 5 languages"] --> P
  WD["Wikidata\nbirth countries"] --> P
  WB["World Bank\npopulations"] --> P
  P(["data pipeline"]) --> M["this page"]
```
