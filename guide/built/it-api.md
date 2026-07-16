<!-- i18n:api_page_title -->
# Guida API
<!-- /i18n:api_page_title -->

<!-- i18n:api_intro -->
Riferimento tecnico per l'API dei parametri URL dell'app — come creare un link diretto a una specifica configurazione di filtro/ordinamento nella pagina Mappa. (Nota storica: questa guida è stata originariamente scritta per `wc2026_countries.html`, non più collegata dalla barra di navigazione — il suo cubo di filtri vive oggi nella pagina Mappa stessa.)
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

Rispecchia il carosello delle fasi nel pannello del filtro (Fase a gironi → Sedicesimi di finale → Ottavi di finale → Quarti di finale → Semifinali → Finale → Vincitore). Ogni posizione filtra i paesi qualificati su quelli che hanno "raggiunto" quella fase — ancora in corsa entrandovi, o già vincitori. I paesi esportatori non qualificati (celle `FE`/`NE`) non sono interessati, così come i paesi non esportatori e non qualificati (celle `FK`/`NK`) — nessuno dei due ha una posizione nel torneo da "raggiungere".

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

Filtra l'elenco ai soli membri FIFA della confederazione indicata. I paesi non FIFA non sono interessati — restano visibili o nascosti secondo le impostazioni `?show` e `?stage`. Evidenzia anche il confine della confederazione ed esegue lo zoom per adattarlo alla vista.

I valori sconosciuti vengono ignorati silenziosamente e i valori predefiniti vengono mantenuti.

### `?show` — whitelist del filtro

```
?show=<token>[,<token>...]
```

Codici di cella e/o alias di gruppo separati da virgola. Quando `show` è presente **sostituisce** interamente i valori predefiniti — ogni cella non elencata viene deselezionata. In sua assenza, si applicano i valori predefiniti.

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

## Combinare `?stage` con `?show`

- `?stage=r16&show=QB` → solo i paesi qualificati che hanno raggiunto gli Ottavi di finale
- `?stage=winner&show=QB` → solo il campione finale
- `?stage=r32&show=AE` → colonna esportatore, esportatori qualificati filtrati sui Sedicesimi di finale, esportatori non qualificati non interessati
- `?stage` non ha alcun effetto sulle righe non qualificate (`FE`/`NE`/`FK`/`NK`) — nessuna di esse ha una posizione nel torneo da raggiungere

## Scorciatoia da tastiera

Ogni codice di cella e alias sopra funziona anche come scorciatoia da tastiera nel pannello del filtro: premi **`f`**, poi digita il codice a 2 lettere. Nessun tasto modificatore — le scorciatoie basate su Ctrl/Cmd rischiano di finire su `Cmd-Q` (chiude l'intero browser su macOS) in caso di errore di battitura, quindi qui si usa un prefisso semplice, lo stesso schema che GitHub usa per la propria navigazione `g` `i`. Si attiva solo quando il focus non è in un campo di testo.

Poiché ogni codice è di esattamente 2 lettere, la scorciatoia si risolve sempre non appena viene digitata la seconda lettera — nessuna attesa, nessuna ambiguità tra ad esempio `IE` e un codice più lungo che inizia allo stesso modo (non ce n'è uno).

```
f I E    attiva/disattiva la cella IE (qualificato, import, export)
f Q B    attiva/disattiva tutte le righe qualificate
f F B    attiva/disattiva la riga FIFA
f A B    attiva/disattiva tutto (come cliccare su "tutto")
```

`Esc` in qualsiasi momento durante una scorciatoia la annulla; una sequenza inattiva si azzera automaticamente anche dopo ~1,5s.

## Esempi

```
?stage=r16&show=QB              Paesi qualificati che hanno raggiunto gli Ottavi di finale.
?stage=winner&show=QB           Solo il campione finale.
?show=QB                        Tutti i 48 paesi qualificati; non qualificati nascosti.
?show=QB&sort=pop&dir=asc       Paesi qualificati ordinati per popolazione crescente.
?show=IE                        Solo i paesi che importano ed esportano giocatori.
?stage=r32&show=AE              Colonna esportatore, esportatori qualificati filtrati sui Sedicesimi di finale, esportatori non qualificati non interessati.
?sort=delta&dir=asc&show=QB     Paesi qualificati con il minor scarto gioca-per/nato-in per primi.
?show=AB                        Tutte le 8 celle, incluse FK e NK normalmente nascoste.
?show=QB,FE                     Paesi qualificati + esportatori FIFA non qualificati.
?fifaconf=uefa                  Solo membri UEFA (filtro FIFA; non-FIFA non interessati).
?fifaconf=caf&show=AE           Solo esportatori africani.
```
<!-- /i18n:api_url_params -->
