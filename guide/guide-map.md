<!-- i18n:page_title -->
# User's Guide
<!-- /i18n:page_title -->

<!-- i18n:intro -->
This map visualises the 2026 FIFA World Cup squads through the lens of birthplace.
Each country is shaded by its net talent balance — see *The Legend*, below —
weighing players born there against players who play there.
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
# The Control Panel

The <kbd style="background:var(--bg-hover,#f0ede8);border:1px solid var(--border,#e4e0d8);color:var(--text-muted,#999);border-radius:0 4px 4px 0">‹</kbd> button in the top-right corner of the window opens the control panel,
controlling what appears on the map and in the country list.

![Control panel](screenshots/control_sidebar.png)

The panel has five parts: a **toolbar** across the top; **sort** and **view** on the left; the **filter** matrix on the right; and an **infobar** along the bottom.

## Toolbar

- <kbd style="font-size:.68em;font-family:var(--bs-font-monospace,ui-monospace,monospace);background:var(--bg-hover,#f0ede8);border:1px solid var(--border,#e4e0d8);color:#1C274C;border-radius:3px;padding:2px 4px;vertical-align:middle">ESC</kbd> collapses the panel back to its ‹ button.
- <img class="gp-icon" src="images/solar_linear/widget-5-svgrepo-com.svg" alt="confederation"> filters the list to a single FIFA confederation — see *FIFA confederation filter*, below.
- <img class="gp-icon" src="images/solar_linear/share-svgrepo-com.svg" alt="share"> and <img class="gp-icon" src="images/solar_linear/question-circle-svgrepo-com.svg" alt="params"> form a pair: **share** copies to the clipboard a URL that reproduces the panel's exact current configuration, ready to paste into another device or send to someone else; **params** opens a plain-English summary of those same current settings — sort, filters, stage, and more — the same panel `?explain` opens on any page load (see *URL query parameters*, below).

## Sort

Four reorderable criteria — **Elo ranking** (an independent rating that adjusts after every match based on the result and the opponent's strength — see the [Data Sources tab](?guide=data) for exactly how), **population**, **Δ** (delta of plays-for minus born-in), **A–Z** — plus a direction toggle (↓↑) to reverse ascending/descending. Only the top two criteria are actually used; click a criterion to move it to the top of the list.

## View

Two independent rows of pill toggles, below sort:

- **Export / native / import**: which role earned a player their place in the table — born here and selected elsewhere; born and selected here; born elsewhere and selected here.
- **Player / coach**: which kind of person shows.

Every toggle is checked by default, showing everyone; uncheck one to hide that group. Currently only active within *The Player Table*, below — the toggles show but stay disabled elsewhere, for now.

## Filter

The matrix crosses two **columns** (exporter / non-exporter) with four **rows** in two groups:

- **Qualified** — split by whether the country imports players or not
- **Non-qualified** — split by FIFA membership

Uncheck any cell to hide that category. Click a row or column header to toggle the whole group at once.

## Infobar

Shows, on the left, how many players and coaches are in the currently visible player table (see *The Player Table*, below) — kept live no matter which tab is actually open; and on the right, how many countries are currently visible out of the total.

## FIFA confederation filter

The <img class="gp-icon" src="images/solar_linear/widget-5-svgrepo-com.svg" alt="confederation"> button next to the **FIFA** row opens a dropdown to filter the list to a single confederation. Non-FIFA countries are unaffected — they remain visible or hidden according to the rest of the filter matrix.

Selecting a confederation also highlights its external boundary on the map and zooms to fit it in view. Select **All FIFA Confederations** to clear the filter.

## URL query parameters

The filter and sort state can also be configured directly from the URL — `?sort=`, `?dir=`, `?stage=`, `?show=`, `?fifaconf=`, `?pshow=`, plus `?bottomtab=` and `?select=` for jumping straight to a given tab with a country already selected. Add `?explain` to any URL to open a panel summarizing the panel's current settings — see *`?explain` — inspect the current configuration* on the [API Guide tab](?guide=api) for exactly what it shows and why. The full reference with all cell codes, group aliases and examples is there too.

## About the country reference

The map and the list use [eloratings.net](https://www.eloratings.net/) as the source of countries —
not the FIFA member list. This means the list includes territories with no FIFA membership at all,
such as Greenland.

It also includes the four UK home nations — England, Scotland, Wales, Northern Ireland — as four
separate entries rather than one "United Kingdom," for an unrelated reason: unlike Greenland, they
*are* FIFA members, each in its own right. What's unusual about them is being sub-national entities
with individual FIFA (and Elo) membership, not a gap in either list.

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
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_dashed -->Dashed border — qualified but knocked out.<!-- /i18n:tax_desc_border_dashed --></span>
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
  <span style="font-size:.875rem"><!-- i18n:tax_desc_text_light -->Light, italic text — not a FIFA member.<!-- /i18n:tax_desc_text_light --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_born -->Born here / plays for<!-- /i18n:tax_label_born --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--exp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/it.svg" alt="">
    <span class="elo-name" data-id="380">Italy</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#1d4ed8">▶</span> <!-- i18n:tax_desc_exp -->Players born in this country play for another qualified country.<!-- /i18n:tax_desc_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#dc2626">◀</span> <!-- i18n:tax_desc_imp -->Players born in another country play for this country.<!-- /i18n:tax_desc_imp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#dc2626">◀</span><span style="color:#1d4ed8">▶</span> <!-- i18n:tax_desc_both -->Players born elsewhere play for this country, and players born here play for other countries.<!-- /i18n:tax_desc_both --></span>
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
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="--exp-color: rgb(160,197,250); --imp-color: rgb(248,167,167); --imp-pivot: 18.4%; --native-pivot: 86.4%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/us.svg" alt="">
    <span class="elo-name" data-id="840">United States</span>
    <span class="elo-pts"><span class="elo-pts-primary">7 · 11</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_mixed -->A visible red band alongside the blue — a more even mix of exports (11) and imports (7).<!-- /i18n:tax_desc_gradient_mixed --></span>
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
  <span style="font-size:.875rem"><!-- i18n:tax_desc_nomap -->Dimmed flag — not present in the map's underlying geographic data (typically because the territory is too small).<!-- /i18n:tax_desc_nomap --></span>
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
<div style="font-size:.8rem;color:#777;margin-bottom:6px"><!-- i18n:tax_note_fixture -->Only shown once countries are grouped by fixture — see *Tournament*, below.<!-- /i18n:tax_note_fixture --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-pair" style="display:inline-flex">
    <span class="elo-item-wrap">
      <span class="elo-item elo-item--qualified" style="flex-shrink:0">
        <span class="elo-flag-wrap"><img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ma.svg" alt=""></span>
        <span class="elo-name" data-id="504">Morocco</span>
      </span>
    </span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_won -->Green check on the pill — won a decided fixture.<!-- /i18n:tax_desc_won --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--lost" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/br.svg" alt="">
    <span class="elo-name" data-id="76">Brazil</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_lost -->Grayed flag — lost a decided fixture.<!-- /i18n:tax_desc_lost --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-viz--match" style="display:inline-flex">
    <span class="elo-item elo-item--qualified elo-item--pending" style="flex-shrink:0">
      <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/de.svg" alt="">
      <span class="elo-name" data-id="276">Germany</span>
    </span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_pending -->Wavy border — fixture not yet played.<!-- /i18n:tax_desc_pending --></span>
</div>
</div>

</div>

<!-- i18n:map -->
# The Map

## Choropleth & Flags

Each country is shaded by its net talent balance — home-grown contribution (exports plus native-born players) minus imports (see *The Legend*, below). The more one-sided that balance, in either direction, the darker the shade; a country close to a neutral balance appears pale. Countries with no data for that metric appear in a neutral pale tone.
Countries currently included in the filter display a circular flag marker:

![Qualified teams' flags](screenshots/qualified_flags.png)

## Zoom & Pan

Scroll (or pinch) to zoom · drag to pan. Two round buttons sit in the bar below the map, at the left of the legend:

- <img class="gp-icon" src="images/solar_linear/global-svgrepo-com.svg" alt="reset"> zooms back out to the default view — every country the map actually shows, fit into frame. A handful of small territories have no map presence at all and are never included; see *Off the map*, above.
- <img class="gp-icon" src="images/solar_linear/maximize-square-2-svgrepo-com.svg" alt="span"> zooms and pans to fit whatever's currently visible on the map — every shown flag by default, or just the highlighted set while a country is selected (or a group-stage focus is active).

## The Legend

The map shades every country by its net talent balance — home-grown contribution (exports plus native-born players) minus imports. Net exporters and net importers read as two different colours either side of a neutral midpoint.

The colour bar at the bottom of the header reads left to right like a number line — negative extreme, neutral 0 in the middle, positive extreme — with a reference tick at each end and midpoint, plus a thin tick of its own for every real country, so you can see where countries actually cluster instead of assuming the smooth gradient means an even spread. A single standalone dot sits past the positive end for **France**, the biggest net exporter — off-scale enough (36 points past the next-highest country) to earn its own marker instead of just another tick on the bar:

![Legend](screenshots/legend.png)

**Curaçao**, the biggest net importer (its entire squad is Dutch-born), sits at the bar's own negative extreme instead.

The legend doubles as a filter: drag either grip — the small dotted handle at each end of the bar — inward to narrow the visible range. Everything outside the selected range disappears from the country list, the map's own flags, and the player table, the same as any other filter. Double-click anywhere on the legend to reset back to the full range.

## Tooltips

Hover any country to see details. Tooltips are not shown on mobile.

- **Birth countries**: export count and top players, each with their destination flag
- **Qualified countries that also recruit**: a right-hand column adds the import side
- **Non-qualified birth countries**: a *not qualified* badge replaces the squad panel
<!-- /i18n:map -->

<!-- i18n:bottom_panel -->
# The Bottom Panel

The scrollable area below the map has three tabs.

## <img class="gp-icon" src="images/solar_linear/ranking-svgrepo-com.svg" alt=""> The Country List

The default tab lists every country — qualified or not — as a pill badge, no tournament carousel.
The Control Panel controls which badges appear and in what order;
the default sort is by [World Football Elo rating](https://www.eloratings.net/).

Clicking a badge selects that country and zooms the map to it.

For countries with **born-in / plays-for** connections, coloured arrows also appear on the map:

- {{ARROW_BLUE}} **blue arrows**: squads that include players born in the selected country
- {{ARROW_RED}} **red arrows**: countries where players born elsewhere play for this squad

*Arrow thickness scales with the number of players.*

The zoom buttons described in *Zoom & Pan*, above, behave the same way here: **span** now fits the highlighted countries specifically, **reset** returns to the default view.

Click the active badge a second time, click anywhere else on the map, or press **Esc** to deselect.

## <img class="gp-icon" src="images/world-cup-svgrepo-com.svg" alt=""> Tournament

The same badge list, this time scoped to the 48 **qualified** countries only, with a small carousel above it cycling through seven positions: **Group stage → Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Final → Winner**.

- Use the ‹ › arrows, or swipe left/right on touch screens, to move between stages.
- Each position filters qualified countries down to those that "reached" that stage — still alive going into it, or having already won it.
- Navigation is capped at the furthest stage the tournament has actually reached; later positions stay locked until real fixtures resolve into them.

The carousel is the only filter that applies here: advancing it to, say, Round of 16 shows exactly
the teams that reached that stage, regardless of the Control Panel's checkboxes or confederation
filter — those only affect the default Teams tab, which has no stage concept of its own.
Non-qualified countries never appear in this tab either, whatever their own checkboxes say.

At **Group stage**, the badge list is replaced by group standings — all 12 groups (A–L) at once by default, or narrowed to one at a time via the selector, with each match's result and the teams through to the Round of 32 highlighted based on the actual outcomes (a draw earns no checkmark either way).

Past Group stage, countries are instead grouped by fixture automatically: each row pairs both opponents either side of the kickoff date/score —

- Not yet played: the kickoff date, and a wavy top/bottom border on both pills — a "some assembly required" look for a fixture that could still go either way.
- Played: the score (plus penalty shootout result, if it went that far) in place of the date, and the losing team's flag greyed out.

At the **Final** position, the two Semi-finals losers get their own pairing — the 3rd Place Final — in a separate, headed list below the real Final, so the two matches are never mixed together.

Clicking a badge, arrows, and the zoom buttons all behave the same way here as in *The Country List*, above.

## <img class="gp-icon" src="images/solar_linear/user-circle-svgrepo-com.svg" alt=""> The Player Table

Always the same flat table — **name**, **born-in**, **plays-for**, **caps** — no matter what's selected. Click a column header to sort by it; click again to reverse the order. Player names link to their Wikipedia page in the current interface language when available.

Only the rows change with the current selection:

- **Nothing selected**: every player and coach on all 48 qualified squads currently visible on the map.
- **One country selected**: every player and coach tied to it — born there, born and selected there, or born elsewhere and selected there.
- **A fixture selected**: both teams' players combined.

The **view** row in the Control Panel (see above) narrows these rows further while this tab is open.

With nothing selected, birth cities are also plotted on the map itself as bubbles — one dot per unique birth city among the listed players, bigger where more players share a city:

![Birth-city bubbles](screenshots/bubbles.png)

Hover a dot for the city name and the players born there.

## <img class="gp-icon" src="images/wc2026.svg" alt=""> Chains

Sequences of countries linked by born-in / plays-for connections — a player born in A plays for B, a player born in B plays for C, and so on, forming a chain of nationalities across the tournament — are explored on their own [standalone page](/chains/wc2026_chain_longest.html).
<!-- /i18n:bottom_panel -->
