<!-- i18n:page_title -->
# User's Guide
<!-- /i18n:page_title -->

<!-- i18n:intro -->
This map visualises the 2026 FIFA World Cup squads through the lens of birthplace.
Each country is shaded by how many players born there represent **another** country
at the tournament.
<!-- /i18n:intro -->

<!-- i18n:control_sidebar -->
## The Filter & Sort Panel

The **‹** button in the top-right corner of the header opens the filter and sort panel,
which controls which countries appear in the Elo ranking list below the map.

![Filter and sort panel](screenshots/control_sidebar.png)

*Sort column (left) and filter matrix (right) — click any row or column header to toggle a whole group.*

### The filter matrix

Rows group countries by qualification status; columns select by export/import role.
Click the column header `exp.` to show only exporting countries;
click `qualif.` to toggle all qualified nations at once.
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
  <span class="elo-item elo-item--qualified elo-item--exp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/se.svg" alt="">
    <span class="elo-name" data-id="752">Sweden</span>
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

<!-- i18n:interaction_flow -->
## Interaction Model

Click any country on the map — or any badge in the Elo list — to enter **dim mode**:
unrelated flags fade, arcs show export flows, and the player table appears below the map.

```mermaid
flowchart LR
    B(Browse) -->|"click country / Elo badge"| D(Dim mode)
    D -->|"click same item"| B
    D -->|"click different country"| D
    D -->|Esc| B
```

*Clicking the same item again always returns to Browse.*

> **Tip:** clicking the active Elo badge a second time clears dim mode without moving the map.
<!-- /i18n:interaction_flow -->

<!-- i18n:data_sources -->
## Data Sources

| Source | Used for |
|---|---|
| [Wikipedia](https://wikipedia.org) squad pages | Player names, birth countries, cap counts |
| [eloratings.net](https://www.eloratings.net/) | World Football Elo rankings |
| [World Bank](https://data.worldbank.org/) | Country populations |
<!-- /i18n:data_sources -->
