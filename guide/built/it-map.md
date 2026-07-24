<!-- i18n:page_title -->
# Guida utente
<!-- /i18n:page_title -->

<!-- i18n:intro -->
Questa mappa visualizza le rose dei Mondiali 2026 dal punto di vista del luogo di nascita.
Ogni paese è colorato in base al suo bilancio netto di talento — vedi *La legenda*, sotto —
che confronta i giocatori nati lì con i giocatori che vi giocano.
<!-- /i18n:intro -->

<!-- i18n:quotes -->
## Le citazioni

L'intestazione mostra un carosello rotante di 15 famose citazioni letterarie —
da François Villon (1461) a Simone de Beauvoir (1949) — ognuna trasformata con umorismo
in una battuta calcistica.

Naviga tra le citazioni usando i chevron orientati verso sinistra, o scorri verso destra su schermi touch.
Tieni premuto (o tieni premuto il pulsante del mouse) su una citazione per rivelare la riga originale; rilascia per tornare.

Scorrere verso sinistra, invece, apre un pannello completamente diverso — il pannello di controllo,
che regola come i paesi vengono filtrati, ordinati e visualizzati.
<!-- /i18n:quotes -->

<!-- i18n:control_sidebar -->
# Il pannello di controllo

Il pulsante <kbd style="background:var(--bg-hover,#f0ede8);border:1px solid var(--border,#e4e0d8);color:var(--text-muted,#999);border-radius:0 4px 4px 0">‹</kbd> nell'angolo superiore destro della finestra apre il pannello di controllo, che determina cosa appare sulla mappa e nell'elenco dei paesi.

![Pannello di controllo](screenshots/control_sidebar-it.png)

Il pannello ha cinque parti: una **barra degli strumenti** in alto; **Ordina** e **Visualizzare** a sinistra; la matrice **Filtra** a destra; e una **barra informativa** in basso.

## Barra degli strumenti

- <kbd style="font-size:.68em;font-family:var(--bs-font-monospace,ui-monospace,monospace);background:var(--bg-hover,#f0ede8);border:1px solid var(--border,#e4e0d8);color:#1C274C;border-radius:3px;padding:2px 4px;vertical-align:middle">ESC</kbd> richiude il pannello nel suo pulsante ‹.
- <img class="gp-icon" src="images/solar_linear/widget-5-svgrepo-com.svg" alt="confederazione"> filtra l'elenco su una singola confederazione FIFA — vedi *Filtro per confederazione FIFA*, sotto.
- <img class="gp-icon" src="images/solar_linear/share-svgrepo-com.svg" alt="condividi"> e <img class="gp-icon" src="images/solar_linear/question-circle-svgrepo-com.svg" alt="parametri"> formano una coppia: **condividi** copia negli appunti un URL che riproduce la configurazione esatta e attuale del pannello, pronto da incollare su un altro dispositivo o da inviare a qualcuno; **parametri** apre un riepilogo in linguaggio semplice di quelle stesse impostazioni attuali — ordinamento, filtri, fase, e altro — lo stesso pannello che `?explain` apre a ogni caricamento di pagina (vedi *Parametri URL*, sotto).

## Ordina

Quattro criteri riordinabili — **il ranking Elo** (un punteggio indipendente che cambia dopo ogni partita in base al risultato e alla forza dell'avversario — vedi la scheda [Fonti dei dati](?guide=data) per il dettaglio esatto), **popolazione**, **Δ** (delta gioca-per meno nato-in), **A–Z** — più un pulsante di direzione (↓↑) per invertire crescente/decrescente. Solo i primi due criteri sono effettivamente attivi; cliccando su un criterio lo si sposta in prima posizione.

## Visualizzare

Due righe indipendenti di pillole selezionabili, sotto l'ordinamento:

- **Export / nativo / import**: quale ruolo ha dato a un giocatore il suo posto nella tabella — nato qui e selezionato altrove; nato e selezionato qui; nato altrove e selezionato qui.
- **Giocatore / allenatore**: quale tipo di persona viene mostrata.

Ogni casella è selezionata per impostazione predefinita (mostra tutti); deseleziona una casella per nascondere quel gruppo. Attualmente attivo solo in *La tabella dei giocatori*, più sotto — le caselle sono visibili ma restano disabilitate altrove, per ora.

## Filtra

La matrice incrocia due **colonne** (esportatore / non esportatore) con quattro **righe** in due gruppi:

- **Qualificati** — suddivisi in base al fatto che il paese importi giocatori o meno
- **Non qualificati** — suddivisi per appartenenza FIFA

Disattiva una cella per nascondere quella categoria. Clicca su un'intestazione di riga o colonna per attivare/disattivare l'intero gruppo in una volta.

## Barra informativa

Mostra, a sinistra, quanti giocatori e allenatori compaiono attualmente nella tabella dei giocatori (vedi *La tabella dei giocatori*, più sotto) — sempre aggiornata, indipendentemente dalla scheda effettivamente aperta; e a destra, quanti paesi sono attualmente visibili sul totale.

## Filtro per confederazione FIFA

Il pulsante <img class="gp-icon" src="images/solar_linear/widget-5-svgrepo-com.svg" alt="confederazione"> accanto alla riga **FIFA** apre un menu a tendina per filtrare l'elenco su una singola confederazione. I paesi non FIFA non sono interessati — restano visibili o nascosti secondo il resto della matrice dei filtri.

Selezionare una confederazione evidenzia anche il suo confine esterno sulla mappa e vi esegue lo zoom. Seleziona **Tutte le confederazioni FIFA** per rimuovere il filtro.

## Parametri URL

Lo stato di filtro e ordinamento può essere configurato anche direttamente tramite l'URL — `?sort=`, `?dir=`, `?stage=`, `?show=`, `?fifaconf=`, `?pshow=`, oltre a `?bottomtab=` e `?select=` per arrivare direttamente su una scheda con un paese già selezionato. Aggiungi `?explain` a qualsiasi URL per aprire un pannello che riepiloga le impostazioni attuali del pannello — vedi *“?explain” — controllare la configurazione attuale* nella scheda [Guida API](?guide=api) per il dettaglio esatto di cosa mostra e perché. Anche il riferimento completo con tutti i codici delle celle, gli alias dei gruppi e gli esempi si trova lì.

## Sulla fonte di riferimento dei paesi

Mappa ed elenco usano [eloratings.net](https://www.eloratings.net/) come fonte dei paesi — non l'elenco dei membri FIFA. Questo significa che l'elenco include territori senza alcuna appartenenza FIFA, come la Groenlandia.

Include anche le quattro nazioni costitutive del Regno Unito — Inghilterra, Scozia, Galles, Irlanda del Nord — come quattro voci distinte anziché un unico «Regno Unito», per un motivo del tutto diverso: a differenza della Groenlandia, *sono* membri FIFA, ciascuna a pieno titolo. Ciò che è insolito in loro è essere entità sub-nazionali con appartenenza FIFA (ed Elo) individuale, non un'assenza da nessuno dei due elenchi.

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
Testo chiaro e corsivo — non membro FIFA.
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
  <span style="font-size:.875rem"><span style="color:#1d4ed8">▶</span> <!-- i18n:tax_desc_exp -->
Giocatori nati in questo paese giocano per un altro paese qualificato.
<!-- /i18n:tax_desc_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#dc2626">◀</span> <!-- i18n:tax_desc_imp -->
Giocatori nati in un altro paese giocano per questo paese.
<!-- /i18n:tax_desc_imp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#dc2626">◀</span><span style="color:#1d4ed8">▶</span> <!-- i18n:tax_desc_both -->
Giocatori nati altrove giocano per questo paese, e giocatori nati qui giocano per altri paesi.
<!-- /i18n:tax_desc_both --></span>
</div>
<div style="font-size:.8rem;color:#777;margin:6px 0"><!-- i18n:tax_note_gradient -->
Lo sfondo della pillola è a sua volta un gradiente rosso (importazioni) → bianco (nativi) → blu (esportazioni) — più larga la banda di un colore, maggiore la quota di quel gruppo nella rosa totale del paese.
<!-- /i18n:tax_note_gradient --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="--exp-color: rgb(59,130,246); --imp-color: rgb(248,173,173); --imp-pivot: 2.8%; --native-pivot: 25.0%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
    <span class="elo-pts"><span class="elo-pts-primary">3 · 81</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_exp -->
Prevalentemente blu — un grande esportatore (81) con solo una manciata di importazioni (3).
<!-- /i18n:tax_desc_gradient_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="--exp-color: rgb(160,197,250); --imp-color: rgb(248,167,167); --imp-pivot: 18.4%; --native-pivot: 86.4%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/us.svg" alt="">
    <span class="elo-name" data-id="840">United States</span>
    <span class="elo-pts"><span class="elo-pts-primary">7 · 11</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_mixed -->
Una banda rossa visibile accanto al blu — un mix più equilibrato di esportazioni (11) e importazioni (7).
<!-- /i18n:tax_desc_gradient_mixed --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--knocked-out elo-item--imp" style="--imp-color: rgb(239,68,68); --imp-pivot: 96.3%; --native-pivot: 100.0%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
    <span class="elo-pts"><span class="elo-pts-primary">26</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_imp -->
Quasi interamente rosso — quasi tutta la rosa (26) è nata altrove.
<!-- /i18n:tax_desc_gradient_imp --></span>
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
Bandiera attenuata — assente dai dati geografici usati dalla mappa (di solito perché il territorio è troppo piccolo).
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

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555"><!-- i18n:tax_label_fixture -->
Accoppiamenti (vista partite)
<!-- /i18n:tax_label_fixture --></div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px"><!-- i18n:tax_note_fixture -->
Visibile solo in vista partite — vedi Vista squadre / partite, sopra.
<!-- /i18n:tax_note_fixture --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-pair" style="display:inline-flex">
    <span class="elo-item-wrap">
      <span class="elo-item elo-item--qualified" style="flex-shrink:0">
        <span class="elo-flag-wrap"><img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ma.svg" alt=""></span>
        <span class="elo-name" data-id="504">Morocco</span>
      </span>
    </span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_won -->
Segno di spunta verde sulla pillola — ha vinto una partita decisa.
<!-- /i18n:tax_desc_won --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--lost" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/br.svg" alt="">
    <span class="elo-name" data-id="76">Brazil</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_lost -->
Bandiera in scala di grigi — ha perso una partita decisa.
<!-- /i18n:tax_desc_lost --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-viz--match" style="display:inline-flex">
    <span class="elo-item elo-item--qualified elo-item--pending" style="flex-shrink:0">
      <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/de.svg" alt="">
      <span class="elo-name" data-id="276">Germany</span>
    </span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_pending -->
Bordo ondulato — partita non ancora giocata.
<!-- /i18n:tax_desc_pending --></span>
</div>
</div>

</div>

<!-- i18n:map -->
# La mappa

## Coropleta e bandiere

Ogni paese è colorato in base al suo bilancio netto di talento — contributo interno (esportazioni più giocatori nativi) meno importazioni (vedi *La legenda*, sotto). Più questo bilancio è marcato, in un senso o nell'altro, più la tonalità è scura; un paese vicino all'equilibrio neutro appare chiaro. I paesi senza dati per quella metrica appaiono in un tono chiaro neutro.
I paesi attualmente inclusi nel filtro mostrano un marcatore a bandiera circolare.

![Bandiere delle squadre qualificate](screenshots/qualified_flags.png)

## Zoom e panoramica

Scorri (o pizzica) per zoomare · trascina per spostare la vista. Due pulsanti rotondi si trovano nella barra sotto la mappa, a sinistra della legenda:

- <img class="gp-icon" src="images/solar_linear/global-svgrepo-com.svg" alt="ripristina"> allontana lo zoom fino alla vista predefinita — tutti i paesi effettivamente mostrati dalla mappa, adattati all'inquadratura. Una manciata di piccoli territori non ha alcuna presenza sulla mappa e non viene mai inclusa; vedi *Fuori dalla mappa*, sopra.
- <img class="gp-icon" src="images/solar_linear/maximize-square-2-svgrepo-com.svg" alt="adatta"> zooma e sposta la vista per far entrare tutto ciò che è attualmente visibile sulla mappa — ogni bandiera mostrata per impostazione predefinita, oppure solo l'insieme evidenziato mentre un paese è selezionato (o è attivo un focus sulla fase a gironi).

## La legenda

La mappa colora ogni paese in base al suo bilancio netto di talento — contributo interno (esportazioni più giocatori nativi) meno importazioni. Esportatori netti e importatori netti appaiono in due colori distinti ai due lati di un punto neutro centrale.

La barra colorata in fondo all'intestazione si legge da sinistra a destra come una retta numerica — estremo negativo, zero neutro al centro, estremo positivo — con un segno di riferimento a ciascuna estremità e al centro, più un piccolo segno proprio per ogni paese reale, così puoi vedere dove i paesi si raggruppano davvero invece di presumere che il gradiente uniforme significhi una distribuzione omogenea. Un singolo punto a sé stante si trova oltre l'estremità positiva per la **Francia**, il maggiore esportatore netto — abbastanza fuori scala (36 punti oltre il paese successivo) da meritare un proprio indicatore invece di un altro semplice segno sulla barra:

![Legenda](screenshots/legend.png)

**Curaçao**, il maggiore importatore netto (l'intera rosa è nata nei Paesi Bassi), si trova invece all'estremo negativo della barra stessa.

La legenda funge anche da filtro: trascina una delle due maniglie — il piccolo indicatore punteggiato a ciascuna estremità della barra — verso l'interno per restringere l'intervallo visibile. Tutto ciò che è fuori dall'intervallo selezionato scompare dall'elenco dei paesi, dalle bandiere sulla mappa e dalla tabella dei giocatori, come qualsiasi altro filtro. Fai doppio clic in un punto qualsiasi della legenda per tornare all'intervallo completo.

## Tooltip

Passa il mouse su un paese per vedere i dettagli. I tooltip non vengono mostrati su dispositivi mobili.

- **Paesi di nascita**: numero di esportazioni e migliori giocatori, ciascuno con la propria bandiera di destinazione
- **Paesi qualificati che reclutano anche**: una colonna a destra aggiunge il lato delle importazioni
- **Paesi di nascita non qualificati**: un badge *non qualificato* sostituisce il pannello della rosa
<!-- /i18n:map -->

<!-- i18n:bottom_panel -->
# Il pannello inferiore

L'area scorrevole sotto la mappa ha tre schede.

## <img class="gp-icon" src="images/solar_linear/ranking-svgrepo-com.svg" alt=""> L'elenco dei paesi

La scheda predefinita elenca ogni paese — qualificato o no — come badge a pillola, senza carosello del torneo.
Il pannello di controllo determina quali badge appaiono e in quale ordine;
l'ordinamento predefinito è per [rating Elo mondiale](https://www.eloratings.net/).

Clicca su un badge per selezionare quel paese e zoomare la mappa su di esso.

Per i paesi con collegamenti **nato qui / gioca per**, appaiono anche frecce colorate sulla mappa:

- {{ARROW_BLUE}} **frecce blu**: rose che includono giocatori nati nel paese selezionato
- {{ARROW_RED}} **frecce rosse**: paesi in cui giocatori nati altrove giocano per questa rosa

*Lo spessore della freccia varia in base al numero di giocatori.*

I pulsanti di zoom descritti in *Zoom e panoramica*, sopra, si comportano allo stesso modo qui: **adatta** ora inquadra specificamente i paesi evidenziati, **ripristina** torna alla vista predefinita.

Clicca di nuovo sul badge attivo, clicca altrove sulla mappa, o premi **Esc** per deselezionare.

## <img class="gp-icon" src="images/world-cup-svgrepo-com.svg" alt=""> Torneo

La stessa lista di badge, questa volta limitata ai 48 paesi **qualificati**, con un piccolo carosello sopra che attraversa sette posizioni: **Fase a gironi → Sedicesimi di finale → Ottavi di finale → Quarti di finale → Semifinali → Finale → Vincitore**.

- Usa le frecce ‹ › o scorri a sinistra/destra su schermi touch per cambiare fase.
- Ogni posizione filtra i paesi qualificati a quelli che hanno "raggiunto" quella fase — ancora in torneo all'inizio, o già vincitori.
- La navigazione è limitata alla fase effettivamente raggiunta dal torneo; le posizioni successive restano bloccate finché le partite corrispondenti non vengono giocate.

Il carosello è l'unico filtro applicato qui: farlo avanzare, ad esempio, fino agli ottavi di finale mostra esattamente
le squadre che hanno raggiunto quella fase, indipendentemente dalle caselle del pannello di controllo o dal
filtro di confederazione — questi influenzano solo la scheda Squadre predefinita, che non ha un proprio concetto di fase.
Anche i paesi non qualificati non compaiono mai in questa scheda, qualunque sia lo stato delle loro caselle.

Alla **fase a gironi**, la lista di badge viene sostituita dalle classifiche dei gironi — tutti e 12 i gironi (A–L) insieme per impostazione predefinita, oppure ridotti a uno solo tramite il selettore, con il risultato di ogni partita e le squadre qualificate per i sedicesimi evidenziate in base ai risultati reali (un pareggio non dà la spunta a nessuna delle due).

Passata la fase a gironi, i paesi vengono raggruppati automaticamente per accoppiamento: ogni riga accoppia entrambi gli avversari ai due lati della data/risultato —

- Non ancora giocata: la data del calcio d'inizio, e un bordo superiore/inferiore ondulato su entrambi i badge — un aspetto "in sospeso" per una partita che può ancora andare in entrambe le direzioni.
- Giocata: il risultato (più l'esito dei rigori, se si è arrivati a tanto) al posto della data, e la bandiera della squadra perdente sbiadita.

Alla posizione **Finale**, le due squadre sconfitte in semifinale formano una propria coppia — la finale per il 3° posto — in un elenco separato e intitolato sotto la vera finale, così le due partite non vengono mai mescolate.

Cliccare su un badge, le frecce e i pulsanti di zoom si comportano tutti allo stesso modo qui come in *L'elenco dei paesi*, sopra.

## <img class="gp-icon" src="images/solar_linear/user-circle-svgrepo-com.svg" alt=""> La tabella dei giocatori

Sempre la stessa tabella piatta — **nome**, **nato in**, **gioca per**, **presenze** — indipendentemente da cosa è selezionato. Clicca su un'intestazione di colonna per ordinare in base ad essa; clicca di nuovo per invertire l'ordine. I nomi dei giocatori collegano alla loro pagina Wikipedia nella lingua dell'interfaccia corrente, quando disponibile.

Solo le righe cambiano in base alla selezione corrente:

- **Nessuna selezione**: ogni giocatore e allenatore delle 48 rose qualificate attualmente visibili sulla mappa.
- **Un paese selezionato**: ogni giocatore e allenatore legato a esso — nato lì, nato e convocato lì, o nato altrove e convocato lì.
- **Una partita selezionata**: i giocatori di entrambe le squadre combinati.

La riga **visualizzare** nel pannello di controllo (vedi sopra) restringe ulteriormente queste righe mentre questa scheda è aperta.

Senza selezione, le città di nascita vengono anche rappresentate sulla mappa stessa come bolle — un punto per ogni città di nascita unica tra i giocatori elencati, più grande dove più giocatori condividono la stessa città:

![Bolle delle città di nascita](screenshots/bubbles.png)

Passa il mouse su un punto per vedere il nome della città e i giocatori nati lì.

## <img class="gp-icon" src="images/wc2026.svg" alt=""> Catene

Sequenze di paesi collegate da relazioni nato-qui / gioca-per — un giocatore nato in A gioca per B, un giocatore nato in B gioca per C, e così via, formando una catena di nazionalità attraverso il torneo — vengono esplorate nella loro [pagina dedicata](/chains/wc2026_chain_longest.html).
<!-- /i18n:bottom_panel -->
