<!-- i18n:page_title -->
# Guide d'utilisation
<!-- /i18n:page_title -->

<!-- i18n:intro -->
Cette carte visualise les effectifs de la Coupe du Monde 2026 sous l'angle du lieu de naissance.
Chaque pays est coloré selon le nombre de joueurs nés sur son sol qui représentent **un autre** pays
au tournoi.
<!-- /i18n:intro -->

<!-- i18n:quotes -->
## The Quotes

The header area shows a rotating carousel of 15 famous literary quotes —
from Villon (1461) to Simone de Beauvoir (1949) — each playfully reworded
to swap the original key phrase for a football selection term.
The original line appears in smaller text below so you can spot what changed.

Navigate between quotes using the dot indicators, or swipe left / right on touch screens.
<!-- /i18n:quotes -->

<!-- i18n:control_sidebar -->
## Panneau de filtre et de tri

Le bouton **‹** dans le coin supérieur droit de l'en-tête ouvre le panneau de filtre et de tri,
qui contrôle quels pays apparaissent dans la liste des classements Elo sous la carte.

![Panneau de filtre et de tri](screenshots/control_sidebar.png)

*Colonne de tri (gauche) et matrice de filtre (droite) — cliquez sur un en-tête de ligne ou de colonne pour basculer tout un groupe.*

### La matrice de filtre

Les lignes regroupent les pays par statut de qualification ; les colonnes sélectionnent par rôle export/import.
Cliquez sur l'en-tête de colonne `exp.` pour n'afficher que les pays exportateurs ;
cliquez sur `qualif.` pour basculer toutes les pays qualifiés d'un coup.
<!-- /i18n:control_sidebar -->

<!-- i18n:country_taxonomy -->
## Catégories de pays

Chaque pays est affiché sous forme de **pastille** dont le style CSS encode sa catégorie.

<div class="taxonomy" style="display:flex;flex-direction:column;gap:16px;margin:1rem 0">

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555">Qualifié vs. non qualifié</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cz.svg" alt="">
    <span class="elo-name" data-id="203">Czech Republic</span>
  </span>
  <span style="font-size:.875rem">Bordure pleine — qualifié pour la Coupe du Monde 2026.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ua.svg" alt="">
    <span class="elo-name" data-id="804">Ukraine</span>
  </span>
  <span style="font-size:.875rem">Pas de bordure — non qualifié.</span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555">FIFA vs. non-FIFA</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/is.svg" alt="">
    <span class="elo-name" data-id="352">Iceland</span>
  </span>
  <span style="font-size:.875rem">Texte foncé — membre de la FIFA.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/gl.svg" alt="">
    <span class="elo-name" data-id="304">Greenland</span>
  </span>
  <span style="font-size:.875rem">Texte clair — non membre de la FIFA.</span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555">Né ici / joue pour</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/se.svg" alt="">
    <span class="elo-name" data-id="752">Sweden</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#3b82f6">●</span> Des joueurs nés dans ce pays jouent pour un autre pays qualifié.</span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#ef4444">●</span> Des joueurs nés dans un autre pays jouent pour ce pays.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#3b82f6">●</span><span style="color:#ef4444">●</span> Des joueurs nés ici jouent pour d'autres pays, et des joueurs nés ailleurs jouent pour ce pays.</span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555">Hors carte</div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px">Orthogonal aux catégories ci-dessus.</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/sg.svg" alt="">
    <span class="elo-name" data-id="702">Singapore</span>
  </span>
  <span style="font-size:.875rem">Nom en <em>italique</em> — trop petit pour apparaître sur la carte.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/mc.svg" alt="">
    <span class="elo-name" data-id="492">Monaco</span>
  </span>
  <span style="font-size:.875rem">Idem, ici combiné avec non-FIFA.</span>
</div>
</div>

</div>
<!-- /i18n:country_taxonomy -->

<!-- i18n:map -->
## The Map

### Choropleth & Flags

Each country is shaded by the number of players born there who represent another World Cup squad —
the darker the shade, the more exported players. Countries with no exports appear in a neutral pale tone.
Qualified countries display a circular flag marker at their centroid.

### Zoom & Pan

Scroll (or pinch) to zoom · drag to pan. The **↺** button resets the view.
In dim mode, the **⇔** button zooms and pans to fit all highlighted countries at once.

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

### The Elo Ranking

The default tab lists every country as a pill badge, sorted by
[World Football Elo rating](https://www.eloratings.net/).
The filter & sort panel controls which badges appear and in what order.

Clicking a badge has three possible effects:

- **Exporting countries** (<span style="color:#3b82f6">●</span> blue dot): activates *dim mode* —
  unrelated flags fade on the map, arcs show export flows, and the player table opens
- **Map-visible non-exporters**: the map zooms and pans to centre on that country
- **Off-map / no data**: no interaction

Click the active badge a second time — or press **Esc** — to return to browse mode.

### The Player Table

In dim mode the player table shows three sections for the selected country:

| Section | Contents |
|---|---|
| **Exports** | Players born here, grouped by the country they represent |
| **Natives** | Players born here who also play for this country |
| **Imports** | Players born elsewhere who play for this country, grouped by birth country |

Player names link to their Wikipedia page in the current interface language when available.

### Export Chains

The chain tab shows sequences where player exports link countries together:
a player born in A plays for B, a player born in B plays for C — and so on,
forming a chain of nationalities across the tournament.

The snake diagram reads left to right; each node shows the player's name flanked by
the birth-country flag and the squad-country flag.
<!-- /i18n:bottom_panel -->

<!-- i18n:data_sources -->
## Sources de données

| Source | Utilisation |
|---|---|
| [Wikipedia](https://wikipedia.org) pages des équipes | Noms des joueurs, pays de naissance, nombre de sélections |
| [eloratings.net](https://www.eloratings.net/) | Classements Elo de football mondial |
| [Banque mondiale](https://data.worldbank.org/) | Populations des pays |
<!-- /i18n:data_sources -->
