<!-- i18n:page_title -->
# User's Guide
<!-- /i18n:page_title -->

<!-- i18n:intro -->
This map visualises the 2026 FIFA World Cup squads through the lens of birthplace.
Each country is shaded by the total number of World Cup players born there —
whether they represent that country or another.
<!-- /i18n:intro -->

<!-- i18n:quotes -->
## The Quotes

The header area shows a rotating carousel of 15 famous literary quotes —
from Villon (1461) to Simone de Beauvoir (1949) — each playfully reworded
to swap the original key phrase for a football selection term.

Navigate between quotes using the dot indicators, or swipe left / right on touch screens.
Long-press (or hold the mouse button) on a quote to reveal the original line; release to go back.
<!-- /i18n:quotes -->

<!-- i18n:control_sidebar -->
## The Filter & Sort Panel

The **‹** button in the top-right corner of the header opens the filter and sort panel,
which controls which country flags appear on the map and which countries appear in the list below.

![Filter and sort panel](screenshots/control_sidebar.png)

*Sort column (left) and filter matrix (right) — click any row or column header to toggle a whole group.*

### The filter matrix

The matrix crosses two **columns** (exporter / non-exporter) with four **rows** in two groups:

- **Qualified** — split by whether the country imports players or not
- **Non-qualified** — split by FIFA membership

Uncheck any cell to hide that category. Click a row or column header to toggle the whole group at once.

### About the country reference

The map and the list use [eloratings.net](https://www.eloratings.net/) as the source of countries —
not the FIFA member list. This means the list includes non-FIFA territories such as Greenland,
Kosovo, or the four UK home nations, which are recognised by Elo but not all by FIFA.
The default sort order is by Elo rating; other sort criteria are available in the sort column.
<!-- /i18n:control_sidebar -->

<!-- i18n:country_taxonomy -->
## Country Categories

Every country is displayed as a **pill badge** whose CSS style encodes its category at a glance.

<div class="taxonomy" style="display:flex;flex-direction:column;gap:16px;margin:1rem 0">

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555">Qualified vs. non-qualified</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cz.svg" alt="">
    <span class="elo-name" data-id="203">Czech Republic</span>
  </span>
  <span style="font-size:.875rem">Solid border — qualified for the 2026 World Cup.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ua.svg" alt="">
    <span class="elo-name" data-id="804">Ukraine</span>
  </span>
  <span style="font-size:.875rem">No border — not qualified.</span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555">FIFA vs. non-FIFA</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/is.svg" alt="">
    <span class="elo-name" data-id="352">Iceland</span>
  </span>
  <span style="font-size:.875rem">Dark text — FIFA member.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/gl.svg" alt="">
    <span class="elo-name" data-id="304">Greenland</span>
  </span>
  <span style="font-size:.875rem">Light text — not a FIFA member.</span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555">Born here / plays for</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--exp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/it.svg" alt="">
    <span class="elo-name" data-id="380">Italy</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#3b82f6">●</span> Players born in this country play for another qualified country.</span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#ef4444">●</span> Players born in another country play for this country.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#3b82f6">●</span><span style="color:#ef4444">●</span> Players born here play for other countries, and players born elsewhere play for this country.</span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555">Off the map</div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px">Orthogonal to the categories above.</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/sg.svg" alt="">
    <span class="elo-name" data-id="702">Singapore</span>
  </span>
  <span style="font-size:.875rem"><em>Italic</em> name — too small to appear on the map.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/mc.svg" alt="">
    <span class="elo-name" data-id="492">Monaco</span>
  </span>
  <span style="font-size:.875rem">Same, here combined with non-FIFA.</span>
</div>
</div>

</div>

<!-- /i18n:country_taxonomy -->

<!-- i18n:map -->
## The Map

### Choropleth & Flags

Each country is shaded by the total number of World Cup players born there —
the darker the shade, the more players. Countries with no players born there appear in a neutral pale tone.
Countries currently included in the filter display a circular flag marker at their centroid.

### Zoom & Pan

Scroll (or pinch) to zoom · drag to pan. The <img class="gp-icon" src="images/solar_linear/global-svgrepo-com.svg" alt="reset"> button resets the view.
When a country is selected, the <img class="gp-icon" src="images/solar_linear/maximize-square-2-svgrepo-com.svg" alt="span"> button zooms and pans to fit all highlighted countries at once.

### The Legend

The colour bar at the bottom of the header runs dark-to-pale from left to right,
with reference tick values **66 · 55 · 35 · 15 · 0**.
France, far off scale, is shown as a standalone black dot to the left of the bar.

### Tooltips

Hover any country to see details. Tooltips are not shown on mobile.

- **Birth countries**: export count and top players, each with their destination flag
- **Qualified countries that also recruit**: a right-hand column adds the import side
- **Non-qualified birth countries**: a *not qualified* badge replaces the squad panel
<!-- /i18n:map -->

<!-- i18n:bottom_panel -->
## The Bottom Panel

The scrollable area below the map has three tabs.

### The Country List

The default tab lists every country as a pill badge.
The filter & sort panel controls which badges appear and in what order;
the default sort is by [World Football Elo rating](https://www.eloratings.net/).

Clicking a badge selects that country and zooms the map to it.

For countries with **born-in / plays-for** connections, coloured arrows also appear on the map:

- <span style="color:#3b82f6">■</span> **blue arrows**: squads that include players born in the selected country
- <span style="color:#ef4444">■</span> **red arrows**: countries where players born elsewhere play for this squad

The <img class="gp-icon" src="images/solar_linear/maximize-square-2-svgrepo-com.svg" alt="span"> button then fits all connected countries in view at once.

Click the active badge a second time, click anywhere else on the map, or press **Esc** to deselect.

### The Player Table

When a country is selected, the player table shows three sections:

| Section | Contents |
|---|---|
| **Born here / plays for another** | Players born in this country, grouped by the squad they represent |
| **Born here / plays for this country** | Players born here who also represent this country |
| **Born elsewhere / plays for this country** | Players born in another country who represent this squad, grouped by birth country |

Player names link to their Wikipedia page in the current interface language when available.

### Export Chains

The chain tab shows sequences where player exports link countries together:
a player born in A plays for B, a player born in B plays for C — and so on,
forming a chain of nationalities across the tournament.

The snake diagram reads left to right; each node shows the player's name flanked by
the birth-country flag and the squad-country flag.
<!-- /i18n:bottom_panel -->

<!-- i18n:data_sources -->
## Data Sources

| Source | Used for |
|---|---|
| [Wikipedia](https://wikipedia.org) squad pages | Player names, birth countries, cap counts |
| [eloratings.net](https://www.eloratings.net/) | World Football Elo rankings |
| [World Bank](https://data.worldbank.org/) | Country populations |
<!-- /i18n:data_sources -->
