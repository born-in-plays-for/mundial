<!-- i18n:countries_page_title -->
# Paesi
<!-- /i18n:countries_page_title -->

<!-- i18n:countries_intro -->
Tutti i paesi dell'ecosistema dei Mondiali 2026 — squadre qualificate e il più ampio mondo del calcio — classificati per rating Elo e colorati in base alle connessioni nato-in / gioca-per.
<!-- /i18n:countries_intro -->

<!-- i18n:countries_url_params -->
## Parametri URL

Le pagine Paesi e Mappa supportano parametri URL per preconfigurare il pannello di filtro e ordinamento al caricamento. Tutti i parametri sono facoltativi e indipendenti; i parametri omessi mantengono i valori predefiniti del pannello.

### `?explain` — aiuto al debug

Aggiungi `?explain` a qualsiasi URL per aprire al caricamento un pannello esplicativo che traduce ogni parametro attivo in linguaggio chiaro, insieme a un conteggio dei paesi visibili. Lo stesso pannello può essere attivato in qualsiasi momento tramite il badge `?` che appare nell'angolo dell'intestazione del filtro quando sono attivi parametri non predefiniti. Chiudilo cliccando di nuovo su `?`, su `×`, o premendo Esc.

Tutti i parametri attivi vengono sempre registrati nella console del browser, indipendentemente da `?explain`.

```
?stage=r16&show=qual&explain    → apre il pannello al caricamento, rimane aperto per la revisione
```

### `?sort` — criterio di ordinamento

```
?sort=elo              classifica Elo mondiale (predefinito)
?sort=alpha            A–Z nome paese
?sort=pop              popolazione
?sort=delta            gioca-per meno nato-in
?sort=elo+alpha        primario: Elo, secondario: A–Z
?sort=pop+delta+alpha  fino a 4 chiavi; solo le prime due sono effettive
```

`+` separa le chiavi (`,` è anch'esso accettato). Le chiavi specificate vengono prima nell'ordine indicato; le chiavi non specificate riempiono gli slot rimanenti nel pannello. Si combina con `?dir`.

### `?dir` — direzione di ordinamento

```
?dir=desc    decrescente (predefinito)
?dir=asc     crescente
```

Si applica solo alla chiave di ordinamento primaria. `?sort=alpha&dir=desc` produce Z–A.

### `?stage` — filtro fase del torneo

```
?stage=qualified   predefinito — tutti i paesi qualificati e i loro esportatori
?stage=r32         Sedicesimi di finale
?stage=r16         Ottavi di finale
?stage=qf          Quarti di finale
?stage=sf          Semifinali
?stage=final       Finale
?stage=winner      Solo il vincitore
```

Rispecchia il carosello di fase nel pannello filtri (Qualificati → Sedicesimi di finale → Ottavi di finale → Quarti di finale → Semifinali → Finale → Vincitore). Ogni posizione filtra sia i paesi qualificati sia i loro paesi esportatori non qualificati fino a quelli che hanno «raggiunto» quella fase — ancora in gioco all'inizio, o già vincitori. I paesi non qualificati e non esportatori (celle `of`/`on`) non sono interessati — non hanno alcun legame con il torneo.

I valori sconosciuti vengono ignorati silenziosamente e i valori predefiniti vengono mantenuti.

### `?fifaconf` — filtro confederazioni FIFA

```
?fifaconf=uefa       UEFA — Europa
?fifaconf=afc        AFC — Asia
?fifaconf=caf        CAF — Africa
?fifaconf=conmebol   CONMEBOL — America del Sud
?fifaconf=concacaf   CONCACAF — America del Nord e Centrale
?fifaconf=ofc        OFC — Oceania
```

Filtra l'elenco ai soli membri FIFA della confederazione indicata. I paesi non-FIFA non sono interessati — rimangono visibili o nascosti in base alle impostazioni `?show` e `?stage`. Nella pagina Mappa, evidenzia anche il confine della confederazione e vi zooma sopra.

I valori sconosciuti vengono ignorati silenziosamente e i valori predefiniti vengono mantenuti.

### `?show` — lista bianca di filtro

```
?show=<token>[,<token>...]
```

Codici cella e/o alias di gruppo separati da virgola. Quando `show` è presente **sostituisce** completamente i valori predefiniti — ogni cella non elencata viene deselezionata. Quando assente, si applicano i valori predefiniti.

##  Codici cella

La matrice di filtro rispecchia il layout del pannello — due colonne (esportatore / non-esportatore) incrociate con quattro gruppi di righe:

|  | **esportatore** | **non-esportatore** |
|---|:---:|:---:|
| **qualificato · importazioni**      | `qie`&nbsp;&nbsp;✓  | `qi`&nbsp;&nbsp;✓ |
| **qualificato · nessuna import.**   |  `qe` &nbsp;&nbsp;✓ |  `q` &nbsp;&nbsp;✓ |
| **non qualificato · FIFA**          |  `ef` &nbsp;&nbsp;✓ | `of`&nbsp;&nbsp;○ |
| **non qualificato · non-FIFA**      |  `en` &nbsp;&nbsp;✓ | `on`&nbsp;&nbsp;○ |

✓ attivo per impostazione predefinita · ○ disattivo per impostazione predefinita

Mnemonici delle lettere:

- `q` — qualificato
- `i` — importazioni
- `e` — esportazioni
- `f` — membro FIFA
- `n` — non-FIFA
- `o` — altro (non qualificato, non esportatore)

### Nota sulla terminologia

Il quadro ufficiale di questo progetto è **Nato In / Gioca Per**: un giocatore è *nato in* un paese e *gioca per* un altro. Nella matrice di filtro la stessa relazione è espressa dal punto di vista del paese come **importazioni / esportazioni**: un paese *esporta* un giocatore quando qualcuno nato lì gioca per una squadra diversa; *importa* un giocatore quando qualcuno nato all'estero gioca per la sua squadra. Le due formulazioni sono intercambiabili:

- «La Francia esporta 17 giocatori» = «17 giocatori nati in Francia giocano per la squadra di un altro paese.»
- «Il Marocco importa 4 giocatori» = «4 giocatori nati fuori dal Marocco giocano per la squadra marocchina.»
- «Un paese `qie` importa ed esporta» = «una squadra qualificata che include giocatori nati all'estero *e* ha giocatori nati lì che rappresentano altre nazioni.»

## Alias di gruppo

| Alias  | Si espande in      | Significato                                        |
|--------|--------------------|----------------------------------------------------|
| `qual` | `qie,qi,qe,q`     | Tutte le righe qualificate                         |
| `nq`   | `ef,en,of,on`     | Tutte le righe non qualificate                     |
| `exp`  | `qie,qe,ef,en`    | Colonna esportatori                                |
| `nexp` | `qi,q,of,on`      | Colonna non-esportatori                            |
| `imp`  | `qie,qi`          | Righe importatori (con o senza esportazioni)       |
| `all`  | tutti gli 8 codici | Tutte le celle (incluse `of` e `on`)              |

Alias e codici individuali possono essere liberamente mescolati; il risultato è un'unione. I token sconosciuti vengono ignorati silenziosamente — se tutti i token sono sconosciuti il parametro viene ignorato interamente e i valori predefiniti vengono mantenuti.

## Combinare `?stage` con `?show`

- `?stage=r16&show=qual` → solo paesi qualificati che hanno raggiunto gli ottavi di finale
- `?stage=winner&show=qual` → solo il campione
- `?stage=r32&show=exp` → esportatori (qualificati o meno) collegati a paesi che hanno raggiunto i sedicesimi di finale
- `?stage` non ha effetto sulle celle `of`/`on` (non hanno connessione con il torneo)

## Esempi

```
?stage=r16&show=qual          Paesi qualificati che hanno raggiunto gli ottavi di finale.
?stage=winner&show=qual       Solo il campione.
?show=qual                    Tutti i 48 paesi qualificati; non qualificati nascosti.
?show=qual&sort=pop&dir=asc   Paesi qualificati ordinati per popolazione crescente.
?show=qie                     Solo paesi che importano ed esportano giocatori.
?stage=r32&show=exp           Colonna esportatori, filtrata sui paesi che hanno raggiunto i sedicesimi.
?sort=delta&dir=asc&show=qual Paesi qualificati con minor scarto gioca-per vs. nato-in per primi.
?show=all                     Tutte le 8 celle incluse of e on normalmente nascoste.
?show=qual,ef                 Paesi qualificati + esportatori FIFA non qualificati.
?fifaconf=uefa                    Solo membri UEFA (filtro FIFA; non-FIFA non interessati).
?fifaconf=caf&show=exp            Solo esportatori africani.
```
<!-- /i18n:countries_url_params -->
