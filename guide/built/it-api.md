<!-- i18n:api_page_title -->
# Guida API
<!-- /i18n:api_page_title -->

<!-- i18n:api_intro -->
Riferimento tecnico per l'API dei parametri URL dell'app — come creare un link diretto a una specifica configurazione di filtro/ordinamento nella pagina Mappa.
<!-- /i18n:api_intro -->

<!-- i18n:api_url_params -->
## Parametri URL

La barra laterale di filtro/ordinamento della pagina Mappa (`js/control_sidebar.js`) legge l'intera configurazione da una manciata di parametri URL: `?explain`, `?sort=`, `?dir=`, `?stage=`, `?fifaconf=`, `?show=`. Sono tutti opzionali e indipendenti; un parametro omesso mantiene semplicemente il valore predefinito del pannello per quell'impostazione.

### `?explain` — controllare la configurazione attuale

Il pulsante `?` nella barra degli strumenti del filtro apre un pannello che descrive le **impostazioni attuali** del pannello — ordinamento, direzione, fase, celle del filtro, confederazione — in linguaggio semplice, insieme a un conteggio dei paesi visibili. Aggiungi `?explain` a qualsiasi URL per aprirlo automaticamente al caricamento.

Questo pannello descrive il pannello dal vivo, non l'URL: ha esattamente lo stesso aspetto sia che un'impostazione provenga da un parametro URL, da una sessione ripristinata o da un semplice clic nel pannello. Non c'è modo di distinguere, dal pannello stesso, quale dei tre sia stato — è voluto, poiché ciò che conta è cosa è mostrato sullo schermo in questo momento. Chiudilo cliccando di nuovo su `?`, su `×`, o premendo Esc.

Ogni volta che un URL porta un parametro del pannello, le stesse impostazioni attuali vengono anche registrate nella console del browser, indipendentemente da `?explain`.

```
?stage=r16&show=QB&explain    → apre il pannello al caricamento, resta aperto per la consultazione
```

### `?sort` — criterio di ordinamento

```
?sort=elo              classifica Elo mondiale (predefinito)
?sort=alpha            A–Z per nome del paese
?sort=pop              popolazione
?sort=delta            gioca-per meno nato-in
?sort=elo+alpha        primario: Elo, secondario: A–Z
?sort=pop+delta+alpha  fino a 4 chiavi; solo le prime due sono effettive per l'ordinamento
```

`+` separa le chiavi (`,` è accettato anche). Le chiavi specificate vengono prima, nell'ordine dato; le chiavi non specificate riempiono gli spazi restanti del pannello. Si combina con `?dir`.

### `?dir` — direzione di ordinamento

```
?dir=desc    decrescente (predefinito)
?dir=asc     crescente
```

Si applica solo alla chiave di ordinamento primaria. `?sort=alpha&dir=desc` restituisce Z–A.

### `?stage` — filtro per fase del torneo

```
?stage=group       predefinito — tutti i paesi qualificati e i loro esportatori
?stage=r32         Sedicesimi di finale
?stage=r16         Ottavi di finale
?stage=qf          Quarti di finale
?stage=sf          Semifinali
?stage=final       Finale
?stage=winner      Solo il vincitore
```

Rispecchia il carosello delle fasi nel pannello del filtro (Tutta la competizione → Fase a gironi → Sedicesimi di finale → Ottavi di finale → Quarti di finale → Semifinali → Finale → Vincitore) — eccetto **Tutta la competizione**, la prima posizione del carosello, che non ha un proprio valore `?stage=`; condividere un link da quella posizione ripiega su `?stage=group`, a un clic di carosello di distanza.

**Filtra l'elenco solo quando la scheda Torneo è attiva.** Lì è l'unico filtro: i paesi qualificati vengono ridotti a quelli che hanno "raggiunto" quella fase — ancora in corsa entrandovi, o già vincitori — e ogni paese non qualificato viene nascosto a prescindere, indipendentemente da `?show`/`?fifaconf`. Sull'elenco dei paesi (la scheda predefinita), `?stage` sposta comunque il carosello in posizione per il prossimo cambio di scheda, ma lì non ha alcun effetto di filtro — è `?show` a filtrare su quella scheda. Vedi "Ambito per scheda" più sotto.

I valori sconosciuti vengono ignorati silenziosamente e i valori predefiniti vengono mantenuti.

### `?fifaconf` — filtro per confederazione FIFA

```
?fifaconf=uefa       UEFA — Europa
?fifaconf=afc        AFC — Asia
?fifaconf=caf        CAF — Africa
?fifaconf=conmebol   CONMEBOL — America del Sud
?fifaconf=concacaf   CONCACAF — America del Nord e Centrale
?fifaconf=ofc        OFC — Oceania
```

Filtra l'elenco ai soli membri FIFA della confederazione indicata — sull'elenco dei paesi; sulla scheda Torneo questo filtraggio dell'elenco viene completamente bypassato, come `?show` (vedi "Ambito per scheda" più sotto). I paesi non FIFA non sono interessati dal filtro in sé — restano visibili o nascosti secondo `?show`. Evidenziare il confine della confederazione ed eseguirvi lo zoom avviene indipendentemente da quale scheda sia attiva.

I valori sconosciuti vengono ignorati silenziosamente e i valori predefiniti vengono mantenuti.

### `?show` — whitelist del filtro

```
?show=<token>[,<token>...]
```

Codici di cella e/o alias di gruppo separati da virgola. Quando `show` è presente **sostituisce** interamente i valori predefiniti — ogni cella non elencata viene deselezionata. In sua assenza, si applicano i valori predefiniti.

Filtra l'elenco solo sull'elenco dei paesi — sulla scheda Torneo, `?stage` è l'unico filtro e `?show` viene ignorato del tutto; vedi "Ambito per scheda" più sotto.

## Codici di cella

La matrice del filtro rispecchia la disposizione del pannello — due colonne (esportatore / conserva i suoi giocatori) incrociate con quattro gruppi di righe. Ogni codice è di esattamente **2 lettere**: la posizione 1 sceglie l'ambito della riga, la posizione 2 sceglie la colonna.

|  | **esportatore (`E`)** | **conserva i suoi giocatori (`K`)** |
|---|:---:|:---:|
| **qualificato · importa (`I`)** | `IE`&nbsp;&nbsp;✓  | `IK`&nbsp;&nbsp;✓ |
| **qualificato · locale, senza import (`H`)** | `HE`&nbsp;&nbsp;✓ | `HK`&nbsp;&nbsp;✓ |
| **non qualificato · FIFA (`F`)** | `FE`&nbsp;&nbsp;○ | `FK`&nbsp;&nbsp;○ |
| **non qualificato · non-FIFA (`N`)** | `NE`&nbsp;&nbsp;○ | `NK`&nbsp;&nbsp;○ |

✓ attivo per default · ○ disattivo per default

Mnemonici delle lettere — posizione 1 (ambito della riga):

- `I` — qualificato, ha **I**mportazioni
- `H` — qualificato, locale (**H**omegrown — rosa interamente nata lì, senza import)
- `Q` — tutti i **Q**ualificati (entrambe le righe)
- `F` — membro **F**IFA, non qualificato
- `N` — **N**on-FIFA
- `U` — tutti i non qualificati (**U**nqualified, entrambe le righe)
- `A` — **A**ssolutamente tutto (tutte le righe)

Posizione 2 (ambito della colonna):

- `E` — **E**sportatori
- `K` — **K**eeps its players — conserva i suoi giocatori (non esportatori)
- `B` — entrambe le colonne (**B**oth)

Ognuno di questi codici a 2 lettere funziona anche come scorciatoia da tastiera nel pannello — vedi "Scorciatoia da tastiera" più sotto.

### Una nota sulla terminologia

L'inquadratura ufficiale di questo progetto è **Nato in / Gioca per**: un giocatore è *nato in* un paese e *gioca per* un altro. Nella matrice del filtro la stessa relazione è espressa dal punto di vista del paese come **import / export**: un paese *esporta* un giocatore quando qualcuno nato lì gioca per un'altra selezione; *importa* un giocatore quando qualcuno nato altrove gioca per la sua selezione. Le due formulazioni sono intercambiabili:

- "La Francia esporta 17 giocatori" = "17 giocatori nati in Francia giocano per la selezione di un altro paese."
- "Il Marocco importa 4 giocatori" = "4 giocatori nati fuori dal Marocco giocano per la selezione marocchina."
- "Un paese `IE` importa ed esporta allo stesso tempo" = "una selezione qualificata che include giocatori nati all'estero *e* ha giocatori nati lì che rappresentano altre nazioni."

## Alias di gruppo

| Alias  | Si espande in       | Significato                              |
|--------|--------------------|--------------------------------------|
| `QB`   | `IE,IK,HE,HK`     | Tutte le righe qualificate                   |
| `UB`   | `FE,NE,FK,NK`     | Tutte le righe non qualificate               |
| `AE`   | `IE,HE,FE,NE`     | Colonna esportatore                      |
| `AK`   | `IK,HK,FK,NK`     | Colonna "conserva i suoi giocatori"             |
| `IB`   | `IE,IK`           | Righe importatrici (con o senza export) |
| `HB`   | `HE,HK`           | Righe locali (qualificate, senza import) |
| `FB`   | `FE,FK`           | Righe membri FIFA (non qualificate)     |
| `NB`   | `NE,NK`           | Righe non-FIFA                        |
| `AB`   | tutti gli 8 codici        | Ogni cella (incluse `FK` e `NK`) |

Alias e codici singoli possono essere liberamente combinati; il risultato è un'unione. I token sconosciuti vengono ignorati silenziosamente — se tutti i token non sono riconosciuti, il parametro viene ignorato interamente e i valori predefiniti vengono mantenuti.

## Ambito per scheda — `?stage`, `?show` e `?fifaconf` non si combinano tutti insieme

Questi tre non si sommano in un unico filtro combinato — ciascuna delle due schede della pagina Mappa legge solo uno di essi per il filtraggio effettivo dell'elenco:

- **L'elenco dei paesi** (la scheda predefinita): `?show` e `?fifaconf` filtrano insieme come al solito; `?stage` si limita a parcheggiare il carosello per dopo — nessun effetto di filtro per ora.
- **Scheda Torneo**: `?stage` è l'unico filtro — i paesi qualificati vengono ridotti a quelli che hanno raggiunto quella fase, ogni paese non qualificato viene nascosto a prescindere; `?show` e `?fifaconf` vengono entrambi ignorati.

Quale scheda sia attiva al caricamento della pagina dipende dall'ultima visita (`localStorage`), o dall'elenco dei paesi se non c'è una preferenza salvata — mai dall'URL stesso. Un link che combina `?stage=r16&show=QB`, ad esempio, preimposta entrambi i valori, ma solo una delle due metà filtra effettivamente qualcosa, a seconda della scheda su cui si atterra.

## Scorciatoia da tastiera

Ogni codice di cella e alias sopra funziona anche come scorciatoia da tastiera nel pannello del filtro: premi **`v`** oppure **`x`**, poi digita il codice a 2 lettere. `v` **mostra** (seleziona) le celle indicate; `x` le **nasconde** (deseleziona) — le celle fuori dall'ambito del codice non vengono mai toccate. Due prefissi con uno stato di destinazione fisso, invece di un unico prefisso che attiva/disattiva, perché una scorciatoia da tastiera non vede lo stato delle caselle che sta per modificare, a differenza di un clic del mouse sulla casella visibile — la stessa scorciatoia mostrerebbe o nasconderebbe a seconda di cosa era già selezionato. `v`/`x` riprendono il mnemonico copia-incolla-taglia (incolla = inserisci / taglia = rimuovi) invece di scrivere per esteso "mostra"/"nascondi". Nessun tasto modificatore — le scorciatoie basate su Ctrl/Cmd rischiano di finire su `Cmd-Q` (chiude l'intero browser su macOS) in caso di errore di battitura, quindi qui si usa un prefisso semplice, lo stesso schema che GitHub usa per la propria navigazione `g` `i`. Si attiva solo quando il focus non è in un campo di testo.

Poiché ogni codice è di esattamente 2 lettere, la scorciatoia si risolve sempre non appena viene digitata la seconda lettera — nessuna attesa, nessuna ambiguità tra ad esempio `IE` e un codice più lungo che inizia allo stesso modo (non ce n'è uno).

```
v I E    mostra la cella IE (qualificato, import, export)
x I E    nasconde la cella IE
v Q B    mostra tutte le righe qualificate
x A B    nasconde tutto
```

Concatenare due scorciatoie permette di raggiungere uno stato esatto indipendentemente da quello di partenza — ad esempio, "solo `FK`, qualunque sia lo stato iniziale" si ottiene con `x A B` (nascondi tutto) seguito da `v F K` (mostra solo `FK`).

`Esc` in qualsiasi momento durante una scorciatoia la annulla; una sequenza inattiva si azzera automaticamente anche dopo ~1,5s.

## Esempi

```
?show=QB                        Elenco dei paesi: tutti i 48 paesi qualificati; non qualificati nascosti.
?show=QB&sort=pop&dir=asc       Elenco dei paesi: paesi qualificati ordinati per popolazione crescente.
?show=IE                        Elenco dei paesi: solo i paesi che importano ed esportano giocatori.
?sort=delta&dir=asc&show=QB     Elenco dei paesi: paesi qualificati con il minor scarto gioca-per/nato-in per primi.
?show=AB                        Elenco dei paesi: tutte le 8 celle, incluse FK e NK normalmente nascoste.
?show=QB,FE                     Elenco dei paesi: paesi qualificati + esportatori FIFA non qualificati.
?fifaconf=uefa                  Elenco dei paesi: solo membri UEFA (filtro FIFA; non-FIFA non interessati).
?fifaconf=caf&show=AE           Elenco dei paesi: solo esportatori africani.
?stage=r16                      Scheda Torneo: paesi qualificati che hanno raggiunto gli Ottavi di finale.
?stage=winner                   Scheda Torneo: solo il campione finale.
```
<!-- /i18n:api_url_params -->
