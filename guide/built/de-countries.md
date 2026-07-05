<!-- i18n:countries_page_title -->
# Länder
<!-- /i18n:countries_page_title -->

<!-- i18n:countries_intro -->
Alle Länder im Ökosystem der WM 2026 — qualifizierte Mannschaften und die weitere Fußballwelt — nach Elo-Rating gerankt und nach Geburtsort/spielt-für-Verbindungen farblich kodiert.
<!-- /i18n:countries_intro -->

<!-- i18n:countries_url_params -->
## URL-Parameter

Die Seiten Länder und Karte unterstützen URL-Parameter, um das Filter- und Sortierpanel beim Laden vorzukonfigurieren. Alle Parameter sind optional und unabhängig voneinander; fehlende Parameter behalten die Panel-Standardwerte.

### `?explain` — Debugging-Hilfe

Fügen Sie `?explain` zu einer beliebigen URL hinzu, um beim Laden ein Erklärungspanel zu öffnen, das jeden aktiven Parameter in einfache Sprache übersetzt, zusammen mit einer Anzahl sichtbarer Länder. Das gleiche Panel kann jederzeit über das `?`-Badge umgeschaltet werden, das in der Ecke des Filter-Headers erscheint, wenn nicht standardmäßige Parameter aktiv sind. Schließen Sie es durch erneutes Klicken auf `?`, auf `×` oder durch Drücken von Esc.

Alle aktiven Parameter werden immer in der Browser-Konsole protokolliert, unabhängig von `?explain`.

```
?stage=r16&show=qual&explain    → öffnet das Panel beim Laden, bleibt zur Ansicht geöffnet
```

### `?sort` — Sortierkriterium

```
?sort=elo              Elo-Weltrangliste (Standard)
?sort=alpha            A–Z Ländername
?sort=pop              Bevölkerung
?sort=delta            spielt-für minus geboren-in
?sort=elo+alpha        primär: Elo, sekundär: A–Z
?sort=pop+delta+alpha  bis zu 4 Schlüssel; nur die ersten zwei sind wirksam
```

`+` trennt Schlüssel (`,` ebenfalls akzeptiert). Angegebene Schlüssel kommen zuerst in der angegebenen Reihenfolge; nicht angegebene Schlüssel füllen die verbleibenden Plätze im Panel. Kombinierbar mit `?dir`.

### `?dir` — Sortierrichtung

```
?dir=desc    absteigend (Standard)
?dir=asc     aufsteigend
```

Gilt nur für den primären Sortierschlüssel. `?sort=alpha&dir=desc` ergibt Z–A.

### `?stage` — Turnierphasenfilter

```
?stage=qualified   Standard — alle qualifizierten Länder und ihre Exporteure
?stage=r32         Sechzehntelfinale
?stage=r16         Achtelfinale
?stage=qf          Viertelfinale
?stage=sf          Halbfinale
?stage=final       Finale
?stage=winner      nur Sieger
```

Spiegelt das Phasen-Karussell im Filterpanel wider (Qualifiziert → Sechzehntelfinale → Achtelfinale → Viertelfinale → Halbfinale → Finale → Sieger). Jede Position filtert sowohl qualifizierte Länder als auch ihre nicht qualifizierten Exporteurländer auf jene, die diese Phase „erreicht" haben — zu Beginn noch im Turnier, oder bereits Sieger. Nicht exportierende, nicht qualifizierte Länder (`of`/`on`-Zellen) sind nicht betroffen — sie haben keine Turnierverbindung.

Unbekannte Werte werden stillschweigend ignoriert und die Standardwerte beibehalten.

### `?fifaconf` — FIFA-Konföderationsfilter

```
?fifaconf=uefa       UEFA — Europa
?fifaconf=afc        AFC — Asien
?fifaconf=caf        CAF — Afrika
?fifaconf=conmebol   CONMEBOL — Südamerika
?fifaconf=concacaf   CONCACAF — Nord- und Mittelamerika
?fifaconf=ofc        OFC — Ozeanien
```

Filtert die Liste auf FIFA-Mitglieder der genannten Konföderation. Nicht-FIFA-Länder sind nicht betroffen — sie bleiben sichtbar oder ausgeblendet gemäß den `?show`- und `?stage`-Einstellungen. Auf der Kartenseite wird außerdem die Konföderationsgrenze hervorgehoben und darauf gezoomt.

Unbekannte Werte werden stillschweigend ignoriert und die Standardwerte beibehalten.

### `?show` — Filter-Whitelist

```
?show=<Token>[,<Token>...]
```

Kommagetrennte Zellcodes und/oder Gruppenaliase. Wenn `show` vorhanden ist, **ersetzt** es die Standardwerte vollständig — jede nicht aufgeführte Zelle wird deaktiviert. Wenn nicht vorhanden, gelten die Standardwerte.

##  Zellcodes

Die Filtermatrix spiegelt das Panel-Layout wider — zwei Spalten (Exporteur / Nicht-Exporteur) gekreuzt mit vier Zeilengruppen:

|  | **Exporteur** | **Nicht-Exporteur** |
|---|:---:|:---:|
| **qualifiziert · Importe**        | `qie`&nbsp;&nbsp;✓  | `qi`&nbsp;&nbsp;✓ |
| **qualifiziert · keine Importe**  |  `qe` &nbsp;&nbsp;✓ |  `q` &nbsp;&nbsp;✓ |
| **nicht qualifiziert · FIFA**     |  `ef` &nbsp;&nbsp;✓ | `of`&nbsp;&nbsp;○ |
| **nicht qualifiziert · non-FIFA** |  `en` &nbsp;&nbsp;✓ | `on`&nbsp;&nbsp;○ |

✓ standardmäßig aktiv · ○ standardmäßig inaktiv

Buchstaben-Mnemonik:

- `q` — qualifiziert
- `i` — Importe
- `e` — Exporte
- `f` — FIFA-Mitglied
- `n` — non-FIFA
- `o` — sonstige (nicht qualifiziert, kein Exporteur)

### Hinweis zur Terminologie

Der offizielle Rahmen dieses Projekts ist **Geboren In / Spielt Für**: Ein Spieler ist *geboren in* einem Land und *spielt für* ein anderes. In der Filtermatrix wird dieselbe Beziehung aus Ländersicht als **Importe / Exporte** ausgedrückt: Ein Land *exportiert* einen Spieler, wenn jemand dort Geborener für eine andere Mannschaft spielt; es *importiert* einen Spieler, wenn jemand im Ausland Geborener für seine Mannschaft spielt. Beide Formulierungen sind austauschbar:

- „Frankreich exportiert 17 Spieler" = „17 in Frankreich geborene Spieler spielen für die Mannschaft eines anderen Landes."
- „Marokko importiert 4 Spieler" = „4 außerhalb Marokkos geborene Spieler spielen für die marokkanische Mannschaft."
- „Ein `qie`-Land importiert und exportiert" = „Eine qualifizierte Mannschaft, die im Ausland geborene Spieler einschließt *und* dort geborene Spieler hat, die andere Nationen vertreten."

## Gruppenaliase

| Alias  | Erweitert zu       | Bedeutung                                       |
|--------|--------------------|-------------------------------------------------|
| `qual` | `qie,qi,qe,q`     | Alle qualifizierten Zeilen                      |
| `nq`   | `ef,en,of,on`     | Alle nicht qualifizierten Zeilen                |
| `exp`  | `qie,qe,ef,en`    | Exporteur-Spalte                                |
| `nexp` | `qi,q,of,on`      | Nicht-Exporteur-Spalte                          |
| `imp`  | `qie,qi`          | Importeur-Zeilen (mit oder ohne Exporte)        |
| `all`  | alle 8 Codes       | Alle Zellen (einschließlich `of` und `on`)      |

Aliase und individuelle Codes können frei gemischt werden; das Ergebnis ist eine Vereinigung. Unbekannte Token werden stillschweigend ignoriert — wenn alle Token unbekannt sind, wird der Parameter vollständig ignoriert und die Standardwerte beibehalten.

## Kombination von `?stage` mit `?show`

- `?stage=r16&show=qual` → nur qualifizierte Länder, die das Achtelfinale erreicht haben
- `?stage=winner&show=qual` → nur der Sieger
- `?stage=r32&show=exp` → Exporteure (qualifiziert oder nicht) verknüpft mit Ländern, die das Sechzehntelfinale erreicht haben
- `?stage` hat keinen Effekt auf `of`/`on`-Zellen (sie haben keine Turnierverbindung)

## Beispiele

```
?stage=r16&show=qual          Qualifizierte Länder, die das Achtelfinale erreicht haben.
?stage=winner&show=qual       Nur der Sieger.
?show=qual                    Alle 48 qualifizierten Länder; nicht qualifizierte ausgeblendet.
?show=qual&sort=pop&dir=asc   Qualifizierte Länder aufsteigend nach Bevölkerung sortiert.
?show=qie                     Nur Länder, die sowohl importieren als auch exportieren.
?stage=r32&show=exp           Exporteur-Spalte, gefiltert auf Länder im Sechzehntelfinale.
?sort=delta&dir=asc&show=qual Qualifizierte Länder mit geringstem spielt-für vs. geboren-in zuerst.
?show=all                     Alle 8 Zellen einschließlich der normalerweise versteckten of und on.
?show=qual,ef                 Qualifizierte Länder + nicht qualifizierte FIFA-Exporteure.
?fifaconf=uefa                    Nur UEFA-Mitglieder (FIFA-Filter; non-FIFA nicht betroffen).
?fifaconf=caf&show=exp            Nur afrikanische Exporteure.
```
<!-- /i18n:countries_url_params -->
