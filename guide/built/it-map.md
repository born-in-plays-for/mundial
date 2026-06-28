<!-- i18n:page_title -->
# Nato in / Gioca per
<!-- /i18n:page_title -->

<!-- i18n:intro -->
Questa mappa visualizza le rose dei Mondiali 2026 dal punto di vista del luogo di nascita.
Ogni paese è colorato in base al numero totale di giocatori del torneo nati lì —
che rappresentino quel paese o un altro.
<!-- /i18n:intro -->

<!-- i18n:quotes -->
## Le citazioni

L'intestazione mostra un carosello rotante di 15 famose citazioni letterarie —
da François Villon (1461) a Simone de Beauvoir (1949) — ognuna riscritta con umorismo
per sostituire l'espressione chiave originale con un termine di selezione calcistica.

Naviga tra le citazioni usando i chevron orientati verso sinistra, o scorri verso sinistra / destra su schermi touch.
Tieni premuto (o tieni premuto il pulsante del mouse) su una citazione per rivelare la riga originale; rilascia per tornare.
<!-- /i18n:quotes -->

<!-- i18n:control_sidebar -->
## Il pannello di filtro e ordinamento

Il pulsante <kbd style="background:var(--bg-hover,#f0ede8);border:1px solid var(--border,#e4e0d8);color:var(--text-muted,#999);border-radius:0 4px 4px 0">‹</kbd> nell'angolo in alto a destra dell'intestazione apre il pannello di filtro e ordinamento,
per controllare cosa appare sulla mappa e nell'elenco dei paesi.

![Pannello di filtro e ordinamento](screenshots/control_sidebar-it.png)

*Matrice di filtro (destra) — clicca su un'intestazione di riga o colonna per attivare/disattivare un intero gruppo in una volta.*<br>*Colonna di ordinamento (sinistra) — solo i primi due criteri sono attivi; fare clic su un criterio lo sposta in cima alla lista.*

### La matrice di filtro

La matrice incrocia due **colonne** (esportatore / non esportatore) con quattro **righe** in due gruppi:

- **Qualificati** — suddivisi in base al fatto che il paese importi giocatori o meno
- **Non qualificati** — suddivisi per appartenenza alla FIFA

Deseleziona una cella per nascondere quella categoria. Clicca su un'intestazione di riga o colonna per attivare/disattivare l'intero gruppo in una volta.

### 💪 Filtro sopravvissuti

Il pulsante **💪 survivors** si trova appena sotto l'intestazione di riga *qualificati*.
Per impostazione predefinita è inattivo (non premuto) — vengono mostrati tutti i 48 paesi qualificati.
Premilo per limitare il gruppo dei qualificati alle **squadre ancora nel torneo**;
i paesi eliminati vengono nascosti sia dall'elenco dei paesi che dalle bandiere sulla mappa.

Il pulsante ha due stati visivi: piatto (disattivato) e scuro / premuto (attivato).
Funziona in combinazione con il resto della matrice di filtro — puoi, ad esempio,
mostrare solo i sopravvissuti esportatori premendo 💪 survivors e deselezionando la colonna non-esportatori.

### Sul riferimento dei paesi

La mappa e l'elenco usano [eloratings.net](https://www.eloratings.net/) come fonte dei paesi —
non l'elenco dei membri FIFA. Ciò significa che l'elenco include territori non-FIFA come la Groenlandia,
ma anche casi particolari come le quattro nazioni britanniche — entità sub-nazionali
con la propria iscrizione alla FIFA, riconosciute separatamente sia dalla FIFA che da Elo.
L'ordinamento predefinito è per rating Elo; altri criteri di ordinamento sono disponibili nella colonna di ordinamento.
<!-- /i18n:control_sidebar -->

<!-- i18n:tax_heading -->
## Categorie di paesi
<!-- /i18n:tax_heading -->

<!-- i18n:tax_intro -->
Ogni paese è mostrato come una **pillola** il cui stile CSS ne codifica la categoria a colpo d'occhio.
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
Bordo pieno — qualificato e ancora nel torneo.
<!-- /i18n:tax_desc_border_yes --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--knocked-out" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ir.svg" alt="">
    <span class="elo-name" data-id="364">Iran</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_dashed -->
Bordo tratteggiato — qualificato ma eliminato.
<!-- /i18n:tax_desc_border_dashed --></span>
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
  <span style="font-size:.875rem"><span style="color:#3b82f6">▶</span> <!-- i18n:tax_desc_exp -->
Giocatori nati in questo paese giocano per un altro paese qualificato.
<!-- /i18n:tax_desc_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#ef4444">◀</span> <!-- i18n:tax_desc_imp -->
Giocatori nati in un altro paese giocano per questo paese.
<!-- /i18n:tax_desc_imp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#ef4444">◀</span><span style="color:#3b82f6">▶</span> <!-- i18n:tax_desc_both -->
Giocatori nati altrove giocano per questo paese, e giocatori nati qui giocano per altri paesi.
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
Nome in <em>corsivo</em> e bandiera attenuata — troppo piccolo per apparire sulla mappa.
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
## La mappa

### Coropleta e bandiere

Ogni paese è colorato in base al numero totale di giocatori del Mondiale nati lì —
più il tono è scuro, più giocatori ci sono. I paesi dove non è nato nessun giocatore appaiono in un tono pallido neutro.
I paesi attualmente inclusi nel filtro mostrano un indicatore circolare con bandiera.

### Zoom e spostamento

Scorri (o pizzica) per zoomare · trascina per spostarti. Il pulsante <img class="gp-icon" src="images/solar_linear/global-svgrepo-com.svg" alt="reimposta"> riduce lo zoom per mostrare tutti i paesi nella vista.
Quando un paese è selezionato, il pulsante <img class="gp-icon" src="images/solar_linear/maximize-square-2-svgrepo-com.svg" alt="adatta"> fa zoom e sposta per mostrare tutti i paesi evidenziati in una volta.

### La legenda

La barra dei colori in fondo all'intestazione va da scuro a chiaro da sinistra a destra,
con i valori di riferimento **66 · 55 · 35 · 15 · 0**.
La Francia (**99**, fuori scala) è mostrata come un punto nero indipendente a sinistra della barra.

### Tooltip

Passa il cursore su qualsiasi paese per vedere i dettagli. I tooltip non vengono mostrati su mobile.

- **Paesi di nascita**: conteggio delle esportazioni e giocatori principali, ognuno con la bandiera di destinazione
- **Paesi qualificati che reclutano anche**: una colonna a destra aggiunge il lato import
- **Paesi di nascita non qualificati**: un badge *non qualificato* sostituisce il pannello della rosa
<!-- /i18n:map -->

<!-- i18n:bottom_panel -->
## Il pannello inferiore

L'area scorrevole sotto la mappa ha tre schede.

### <img class="gp-icon" src="images/solar_linear/elo_tab_cup.svg" alt=""> L'elenco dei paesi

La scheda predefinita elenca ogni paese come pillola.
Il pannello di filtro e ordinamento controlla quali pillole appaiono e in quale ordine;
l'ordinamento predefinito è per [rating Elo mondiale](https://www.eloratings.net/).

Cliccare su una pillola seleziona quel paese e fa zoom sulla mappa.

Per i paesi con connessioni **nato qui / gioca per**, appaiono anche frecce colorate sulla mappa:

- {{ARROW_BLUE}} **frecce blu**: squadre che includono giocatori nati nel paese selezionato
- {{ARROW_RED}} **frecce rosse**: paesi dove giocatori nati altrove giocano per questa squadra

*Lo spessore delle frecce è proporzionale al numero di giocatori.*

Il pulsante <img class="gp-icon" src="images/solar_linear/maximize-square-2-svgrepo-com.svg" alt="adatta"> adatta poi tutti i paesi connessi nella vista.

Clicca di nuovo sulla pillola attiva, clicca altrove sulla mappa, o premi **Esc** per deselezionare.

### La tabella dei giocatori

Quando un paese è selezionato, la tabella dei giocatori mostra tre sezioni:

| Sezione | Contenuto |
|---|---|
| **Nato qui / gioca per un altro** | Giocatori nati in questo paese, raggruppati per la squadra che rappresentano |
| **Nato qui / gioca per questo paese** | Giocatori nati qui che rappresentano anche questo paese |
| **Nato altrove / gioca per questo paese** | Giocatori nati in un altro paese che rappresentano questa squadra, raggruppati per paese di nascita |

I nomi dei giocatori rimandano alla loro pagina Wikipedia nella lingua dell'interfaccia quando disponibile.

### <img class="gp-icon" src="images/wc2026.svg" alt=""> Catene

La scheda delle catene mostra sequenze di paesi collegati da connessioni nato-qui / gioca-per:
un giocatore nato in A gioca per B, un giocatore nato in B gioca per C — e così via,
formando una catena di nazionalità attraverso il torneo.
<!-- /i18n:bottom_panel -->

<!-- i18n:data_sources -->
## Fonti dei dati

| Fonte | Utilizzo |
|---|---|
| [eloratings.net](https://www.eloratings.net/) | Ranking Elo del calcio mondiale |
| [Wikipedia — rose Mondiali 2026](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads) | Nomi dei giocatori, presenze in nazionale |
| [API Wikipedia](https://en.wikipedia.org/w/api.php) | Pagina Wikipedia di ogni giocatore in 5 lingue (en, fr, de, it, es) |
| [Wikipedia — codici paese FIFA](https://en.wikipedia.org/wiki/List_of_FIFA_country_codes) | Appartenenza alla FIFA |
| [Wikidata](https://www.wikidata.org/) | Paesi di nascita |
| [Banca Mondiale](https://data.worldbank.org/) | Popolazioni dei paesi |

**La risoluzione del paese di nascita** è il passaggio più delicato del pipeline.
La pagina Wikipedia delle rose non indica dove sono nati i giocatori — fornisce solo i loro nomi
e i link alle loro pagine Wikipedia individuali.
Il pipeline usa quei link come chiavi per interrogare [Wikidata](https://www.wikidata.org/)
tramite SPARQL, recuperando il luogo di nascita registrato di ogni giocatore e il paese a cui appartiene quel luogo.
Questa ricerca in due fasi (Wikipedia → Wikidata) è ciò che rende possibile tracciare le connessioni nato-qui / gioca-per sulla mappa.

Queste fonti alimentano un pipeline automatizzato che unisce, incrocia e arricchisce i dati grezzi prima di pubblicarli su questa pagina.
I ranking Elo vengono aggiornati quotidianamente; i dati delle rose vengono aggiornati manualmente quando le selezioni cambiano.
<!-- /i18n:data_sources -->

```mermaid
flowchart LR
  ELO["eloratings.net\nElo rankings"] --> P
  WP["Wikipedia\nsquad page · FIFA codes\nplayer pages × 5 languages"] --> P
  WD["Wikidata\nbirth countries"] --> P
  WB["World Bank\npopulations"] --> P
  P(["data pipeline"]) --> M["this page"]
```
