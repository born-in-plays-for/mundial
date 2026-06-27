<!-- i18n:page_title -->
# Guía del usuario
<!-- /i18n:page_title -->

<!-- i18n:intro -->
Este mapa visualiza las convocatorias del Mundial 2026 desde la perspectiva del lugar de nacimiento.
Cada país se colorea según el número de jugadores nacidos allí que representan a **otro** país
en el torneo.
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
## Panel de filtro y ordenación

El botón **‹** en la esquina superior derecha del encabezado abre el panel de filtro y ordenación,
que controla qué países aparecen en la lista de clasificaciones Elo debajo del mapa.

![Panel de filtro y ordenación](screenshots/control_sidebar.png)

*Columna de ordenación (izquierda) y matriz de filtro (derecha) — haz clic en un encabezado de fila o columna para alternar todo un grupo.*

### La matriz de filtro

Las filas agrupan países por estado de clasificación; las columnas seleccionan por rol de exportación/importación.
Haz clic en el encabezado de columna `exp.` para mostrar solo los países exportadores;
haz clic en `qualif.` para alternar todas las países clasificadas a la vez.
<!-- /i18n:control_sidebar -->

<!-- i18n:country_taxonomy -->
## Categorías de países

Cada país se muestra como una **pastilla** cuyo estilo CSS codifica su categoría.

<div class="taxonomy" style="display:flex;flex-direction:column;gap:16px;margin:1rem 0">

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555">Clasificado vs. no clasificado</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cz.svg" alt="">
    <span class="elo-name" data-id="203">Czech Republic</span>
  </span>
  <span style="font-size:.875rem">Borde sólido — clasificado para el Mundial 2026.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ua.svg" alt="">
    <span class="elo-name" data-id="804">Ukraine</span>
  </span>
  <span style="font-size:.875rem">Sin borde — no clasificado.</span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555">FIFA vs. no-FIFA</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/is.svg" alt="">
    <span class="elo-name" data-id="352">Iceland</span>
  </span>
  <span style="font-size:.875rem">Texto oscuro — miembro de la FIFA.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/gl.svg" alt="">
    <span class="elo-name" data-id="304">Greenland</span>
  </span>
  <span style="font-size:.875rem">Texto claro — no miembro de la FIFA.</span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555">Nacido aquí / juega para</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/se.svg" alt="">
    <span class="elo-name" data-id="752">Sweden</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#3b82f6">●</span> Jugadores nacidos en este país juegan para otro país clasificado.</span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#ef4444">●</span> Jugadores nacidos en otro país juegan para este país.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#3b82f6">●</span><span style="color:#ef4444">●</span> Jugadores nacidos aquí juegan para otros países, y jugadores nacidos en el extranjero juegan para este país.</span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555">Fuera del mapa</div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px">Ortogonal a las categorías anteriores.</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/sg.svg" alt="">
    <span class="elo-name" data-id="702">Singapore</span>
  </span>
  <span style="font-size:.875rem">Nombre en <em>cursiva</em> — demasiado pequeño para aparecer en el mapa.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/mc.svg" alt="">
    <span class="elo-name" data-id="492">Monaco</span>
  </span>
  <span style="font-size:.875rem">Ídem, aquí combinado con no-FIFA.</span>
</div>
</div>

</div>
<!-- /i18n:country_taxonomy -->

<!-- i18n:map -->
## The Map

### Choropleth & Flags

Each country is shaded by the total number of World Cup players born there —
the darker the shade, the more players. Countries with no players born there appear in a neutral pale tone.
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

### The Country List

The default tab lists every country as a pill badge.
The filter & sort panel controls which badges appear and in what order;
the default sort is by [World Football Elo rating](https://www.eloratings.net/).

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
## Fuentes de datos

| Fuente | Uso |
|---|---|
| Páginas de convocatorias de [Wikipedia](https://wikipedia.org) | Nombres de jugadores, países de nacimiento, internacionalidades |
| [eloratings.net](https://www.eloratings.net/) | Rankings Elo de fútbol mundial |
| [Banco Mundial](https://data.worldbank.org/) | Poblaciones de los países |
<!-- /i18n:data_sources -->
