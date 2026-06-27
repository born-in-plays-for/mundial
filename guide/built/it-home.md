<!-- i18n:page_title -->
# Guida utente
<!-- /i18n:page_title -->

<!-- i18n:intro -->
Questa mappa visualizza le rose dei Mondiali 2026 dal punto di vista del luogo di nascita.
Ogni paese è colorato in base al numero di giocatori nati lì che rappresentano **un altro** paese
nel torneo.
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
## Pannello di filtro e ordinamento

Il pulsante **‹** nell'angolo in alto a destra dell'intestazione apre il pannello di filtro e ordinamento,
che controlla quali paesi appaiono nell'elenco dei ranking Elo sotto la mappa.

![Pannello di filtro e ordinamento](screenshots/control_sidebar.png)

*Colonna di ordinamento (sinistra) e matrice di filtro (destra) — clicca su un'intestazione di riga o colonna per attivare/disattivare un intero gruppo.*

### La matrice di filtro

Le righe raggruppano i paesi per stato di qualificazione; le colonne selezionano per ruolo export/import.
Clicca sull'intestazione di colonna `exp.` per mostrare solo i paesi esportatori;
clicca su `qualif.` per attivare/disattivare tutte le paesi qualificate in una volta.
<!-- /i18n:control_sidebar -->

<!-- i18n:tax_heading -->
## Categorie di paesi
<!-- /i18n:tax_heading -->

<!-- i18n:tax_intro -->
Ogni paese è mostrato come una **pillola** il cui stile CSS ne codifica la categoria.
<!-- /i18n:tax_intro -->

<div class="taxonomy" style="display:flex;flex-direction:column;gap:16px;margin:1rem 0">

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_qualified -->
Qualificato vs. non qualificato
<!-- /i18n:tax_label_qualified --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cz.svg" alt="">
    <span class="elo-name" data-id="203">Czech Republic</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_yes -->
Bordo pieno — qualificato per il Mondiale 2026.
<!-- /i18n:tax_desc_border_yes --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ua.svg" alt="">
    <span class="elo-name" data-id="804">Ukraine</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_no -->
Nessun bordo — non qualificato.
<!-- /i18n:tax_desc_border_no --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_fifa -->
FIFA vs. non-FIFA
<!-- /i18n:tax_label_fifa --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/is.svg" alt="">
    <span class="elo-name" data-id="352">Iceland</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_text_dark -->
Testo scuro — membro FIFA.
<!-- /i18n:tax_desc_text_dark --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/gl.svg" alt="">
    <span class="elo-name" data-id="304">Greenland</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_text_light -->
Testo chiaro — non membro FIFA.
<!-- /i18n:tax_desc_text_light --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_born -->
Nato qui / gioca per
<!-- /i18n:tax_label_born --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--exp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/it.svg" alt="">
    <span class="elo-name" data-id="380">Italy</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#3b82f6">●</span> <!-- i18n:tax_desc_exp -->
Giocatori nati in questo paese giocano per un altro paese qualificato.
<!-- /i18n:tax_desc_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#ef4444">●</span> <!-- i18n:tax_desc_imp -->
Giocatori nati in un altro paese giocano per questo paese.
<!-- /i18n:tax_desc_imp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#3b82f6">●</span><span style="color:#ef4444">●</span> <!-- i18n:tax_desc_both -->
Giocatori nati qui giocano per altri paesi, e giocatori nati altrove giocano per questo paese.
<!-- /i18n:tax_desc_both --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555"><!-- i18n:tax_label_offmap -->
Fuori dalla mappa
<!-- /i18n:tax_label_offmap --></div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px"><!-- i18n:tax_note_offmap -->
Ortogonale alle categorie precedenti.
<!-- /i18n:tax_note_offmap --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/sg.svg" alt="">
    <span class="elo-name" data-id="702">Singapore</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_nomap -->
Nome in <em>corsivo</em> — troppo piccolo per apparire sulla mappa.
<!-- /i18n:tax_desc_nomap --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/mc.svg" alt="">
    <span class="elo-name" data-id="492">Monaco</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_nomap_nonfifa -->
Idem, qui combinato con non-FIFA.
<!-- /i18n:tax_desc_nomap_nonfifa --></span>
</div>
</div>

</div>

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
## Fonti dei dati

| Fonte | Utilizzo |
|---|---|
| Pagine delle rose [Wikipedia](https://wikipedia.org) | Nomi dei giocatori, paesi di nascita, presenze |
| [eloratings.net](https://www.eloratings.net/) | Ranking Elo del calcio mondiale |
| [Banca Mondiale](https://data.worldbank.org/) | Popolazioni dei paesi |
<!-- /i18n:data_sources -->
