<!-- i18n:api_page_title -->
# API-Leitfaden
<!-- /i18n:api_page_title -->

<!-- i18n:api_intro -->
Technische Referenz für die URL-Query-Parameter-API der App — wie man direkt zu einer bestimmten Filter-/Sortierkonfiguration auf der Karten-Seite verlinkt.
<!-- /i18n:api_intro -->

<!-- i18n:api_url_params -->
## URL-Parameter

Die Filter-/Sortierseitenleiste der Karten-Seite (`js/control_sidebar.js`) liest ihre gesamte Konfiguration aus einer Handvoll URL-Parametern: `?explain`, `?sort=`, `?dir=`, `?stage=`, `?fifaconf=`, `?show=`. Alle sind optional und unabhängig; ein weggelassener Parameter behält einfach die eigene Standardeinstellung des Panels bei.

### `?explain` — die aktuelle Konfiguration einsehen

Die Schaltfläche `?` in der Filter-Werkzeugleiste öffnet ein Panel, das die **aktuellen Einstellungen** des Panels beschreibt — Sortierung, Richtung, Phase, Filterzellen, Konföderation — in Klartext, zusammen mit einer Anzahl sichtbarer Länder. Fügen Sie `?explain` zu einer beliebigen URL hinzu, damit es beim Laden automatisch geöffnet wird.

Dieses Panel beschreibt das live angezeigte Panel, nicht die URL: Es sieht genau gleich aus, egal ob eine Einstellung von einem URL-Parameter, einer wiederhergestellten Sitzung oder einem einfachen Klick im Panel stammt. Es gibt keine Möglichkeit, allein am Panel zu erkennen, welcher Fall zutrifft — das ist Absicht, denn was zählt, ist, was gerade auf dem Bildschirm zu sehen ist. Schließen Sie es, indem Sie erneut auf `?` klicken, auf `×` klicken, oder Esc drücken.

Sobald eine URL einen Panel-Parameter enthält, werden dieselben aktuellen Einstellungen zusätzlich in der Browser-Konsole protokolliert, unabhängig von `?explain`.

```
?stage=r16&show=QB&explain    → öffnet das Panel beim Laden, bleibt zur Durchsicht offen
```

### `?sort` — Sortierkriterium

```
?sort=elo              Elo-Weltrangliste (Standard)
?sort=alpha            A–Z nach Ländername
?sort=pop              Bevölkerung
?sort=delta            spielt-für minus geboren-in
?sort=elo+alpha        primär: Elo, sekundär: A–Z
?sort=pop+delta+alpha  bis zu 4 Schlüssel; nur die ersten beiden wirken sich auf die Sortierung aus
```

`+` trennt Schlüssel (`,` wird ebenfalls akzeptiert). Angegebene Schlüssel stehen in der angegebenen Reihenfolge vorne; nicht angegebene Schlüssel füllen die verbleibenden Plätze im Panel auf. Kombiniert sich mit `?dir`.

### `?dir` — Sortierrichtung

```
?dir=desc    absteigend (Standard)
?dir=asc     aufsteigend
```

Gilt nur für den primären Sortierschlüssel. `?sort=alpha&dir=desc` ergibt Z–A.

### `?stage` — Turnierphasenfilter

```
?stage=group       Standard — alle qualifizierten Länder und ihre Exporteure
?stage=r32         Sechzehntelfinale
?stage=r16         Achtelfinale
?stage=qf          Viertelfinale
?stage=sf          Halbfinale
?stage=final       Finale
?stage=winner      Nur der Sieger
```

Spiegelt das Phasen-Karussell im Filterpanel wider (Gruppenphase → Sechzehntelfinale → Achtelfinale → Viertelfinale → Halbfinale → Finale → Sieger).

**Filtert die Liste nur, während der Turnier-Tab aktiv ist.** Dort ist es das alleinige Kriterium: qualifizierte Länder werden auf die eingegrenzt, die diese Phase „erreicht" haben — beim Einstieg noch im Rennen, oder sie bereits gewonnen —, und jedes nicht qualifizierte Land wird ausnahmslos ausgeblendet, unabhängig von `?show`/`?fifaconf`. Auf der Länderliste (dem Standard-Tab) bewegt `?stage` das Karussell weiterhin in Position für den nächsten Tab-Wechsel, hat dort aber keine Filterwirkung — dort filtert stattdessen `?show`. Siehe „Tab-Geltungsbereich" unten.

Unbekannte Werte werden stillschweigend ignoriert, und die Standardwerte bleiben erhalten.

### `?fifaconf` — FIFA-Konföderationsfilter

```
?fifaconf=uefa       UEFA — Europa
?fifaconf=afc        AFC — Asien
?fifaconf=caf        CAF — Afrika
?fifaconf=conmebol   CONMEBOL — Südamerika
?fifaconf=concacaf   CONCACAF — Nord- und Mittelamerika
?fifaconf=ofc        OFC — Ozeanien
```

Filtert die Liste auf FIFA-Mitglieder der genannten Konföderation — auf der Länderliste; auf dem Turnier-Tab wird diese Listenfilterung vollständig umgangen, genau wie `?show` (siehe „Tab-Geltungsbereich" unten). Nicht-FIFA-Länder sind vom Filter selbst nicht betroffen — sie bleiben je nach `?show` sichtbar oder ausgeblendet. Das Hervorheben der Konföderationsgrenze und das Heranzoomen geschieht unabhängig davon, welcher Tab aktiv ist.

Unbekannte Werte werden stillschweigend ignoriert, und die Standardwerte bleiben erhalten.

### `?show` — Filter-Whitelist

```
?show=<Token>[,<Token>...]
```

Kommagetrennte Zellcodes und/oder Gruppenaliase. Wenn `show` vorhanden ist, **ersetzt** es die Standardwerte vollständig — jede nicht aufgeführte Zelle wird abgewählt. Wenn es fehlt, gelten die Standardwerte.

Filtert die Liste nur auf der Länderliste — auf dem Turnier-Tab ist `?stage` das alleinige Kriterium, und `?show` wird vollständig ignoriert; siehe „Tab-Geltungsbereich" unten.

## Zellcodes

Die Filtermatrix spiegelt das Layout der Seitenleiste wider — zwei Spalten (Exporteur / behält seine Spieler) gekreuzt mit vier Zeilengruppen. Jeder Code besteht aus genau **2 Buchstaben**: Position 1 wählt den Zeilenbereich, Position 2 die Spalte.

|  | **Exporteur (`E`)** | **behält seine Spieler (`K`)** |
|---|:---:|:---:|
| **qualifiziert · importiert (`I`)** | `IE`&nbsp;&nbsp;✓  | `IK`&nbsp;&nbsp;✓ |
| **qualifiziert · Eigengewächse, keine Importe (`H`)** | `HE`&nbsp;&nbsp;✓ | `HK`&nbsp;&nbsp;✓ |
| **nicht qualifiziert · FIFA (`F`)** | `FE`&nbsp;&nbsp;○ | `FK`&nbsp;&nbsp;○ |
| **nicht qualifiziert · Nicht-FIFA (`N`)** | `NE`&nbsp;&nbsp;○ | `NK`&nbsp;&nbsp;○ |

✓ standardmäßig aktiv · ○ standardmäßig inaktiv

Buchstaben-Eselsbrücken — Position 1 (Zeilenbereich):

- `I` — qualifiziert, hat **I**mporte
- `H` — qualifiziert, Eigengewächse (**H**omegrown — Kader komplett dort geboren, keine Importe)
- `Q` — alle **Q**ualifizierten (beide Zeilen)
- `F` — **F**IFA-Mitglied, nicht qualifiziert
- `N` — **N**icht-FIFA
- `U` — alle Nicht-Qualifizierten (**U**nqualified, beide Zeilen)
- `A` — **A**bsolut alles (alle Zeilen)

Position 2 (Spaltenbereich):

- `E` — **E**xporteure
- `K` — **K**eeps its players — behält seine Spieler (Nicht-Exporteure)
- `B` — beide Spalten (**B**oth)

Jeder dieser 2-Buchstaben-Codes funktioniert auch als Tastaturkürzel im Panel — siehe „Tastaturkürzel" unten.

### Eine Anmerkung zur Terminologie

Der offizielle Rahmen dieses Projekts ist **Geboren in / Spielt für**: Ein Spieler ist *geboren in* einem Land und *spielt für* ein anderes. In der Filtermatrix wird dieselbe Beziehung aus der Sicht des Landes als **Import / Export** ausgedrückt: Ein Land *exportiert* einen Spieler, wenn jemand, der dort geboren wurde, für eine andere Auswahl spielt; es *importiert* einen Spieler, wenn jemand, der anderswo geboren wurde, für seine Auswahl spielt. Die beiden Formulierungen sind austauschbar:

- „Frankreich exportiert 17 Spieler" = „17 in Frankreich geborene Spieler spielen für die Auswahl eines anderen Landes."
- „Marokko importiert 4 Spieler" = „4 außerhalb Marokkos geborene Spieler spielen für die marokkanische Auswahl."
- „Ein `IE`-Land importiert und exportiert zugleich" = „eine qualifizierte Auswahl, die sowohl im Ausland geborene Spieler umfasst, *als auch* dort geborene Spieler hat, die andere Nationen vertreten."

## Gruppenaliase

| Alias  | Erweitert zu        | Bedeutung                              |
|--------|--------------------|--------------------------------------|
| `QB`   | `IE,IK,HE,HK`     | Alle qualifizierten Zeilen                   |
| `UB`   | `FE,NE,FK,NK`     | Alle nicht qualifizierten Zeilen               |
| `AE`   | `IE,HE,FE,NE`     | Exporteur-Spalte                      |
| `AK`   | `IK,HK,FK,NK`     | Spalte „behält seine Spieler"             |
| `IB`   | `IE,IK`           | Importeur-Zeilen (mit oder ohne Exporte) |
| `HB`   | `HE,HK`           | Eigengewächs-Zeilen (qualifiziert, keine Importe) |
| `FB`   | `FE,FK`           | FIFA-Mitglied-Zeilen (nicht qualifiziert)     |
| `NB`   | `NE,NK`           | Nicht-FIFA-Zeilen                        |
| `AB`   | alle 8 Codes        | Jede Zelle (einschließlich `FK` und `NK`) |

Aliase und einzelne Codes können frei gemischt werden; das Ergebnis ist eine Vereinigung. Unbekannte Token werden stillschweigend ignoriert — sind alle Token unbekannt, wird der Parameter vollständig ignoriert und die Standardwerte bleiben erhalten.

## Tab-Geltungsbereich — `?stage`, `?show` und `?fifaconf` kombinieren sich nicht alle

Diese drei stapeln sich nicht zu einem kombinierten Filter — jeder der beiden Tabs der Karten-Seite liest für die tatsächliche Listenfilterung nur einen von ihnen:

- **Die Länderliste** (der Standard-Tab): `?show` und `?fifaconf` filtern wie gewohnt zusammen; `?stage` parkt das Karussell nur für später — noch keine Filterwirkung.
- **Turnier-Tab**: `?stage` ist der alleinige Filter — qualifizierte Länder werden auf die eingegrenzt, die diese Phase erreicht haben, jedes nicht qualifizierte Land wird ausnahmslos ausgeblendet; `?show` und `?fifaconf` werden beide ignoriert.

Welcher Tab beim Laden der Seite aktiv ist, stammt von Ihrem letzten Besuch (`localStorage`), oder ist die Länderliste, falls keine gespeicherte Einstellung vorliegt — niemals von der URL selbst. Ein Link, der `?stage=r16&show=QB` kombiniert, setzt zum Beispiel beide Werte vorab, aber nur eine der beiden Hälften filtert tatsächlich etwas, je nachdem, auf welchem Tab Sie landen.

## Tastaturkürzel

Jeder Zellcode und Alias oben funktioniert auch als Tastaturkürzel im Filterpanel: Drücken Sie **`v`** oder **`x`**, dann geben Sie den 2-Buchstaben-Code ein. `v` **zeigt** die genannten Zellen (aktiviert sie); `x` **blendet** sie **aus** (deaktiviert sie) — Zellen außerhalb des Codes bleiben unberührt. Zwei Präfixe mit einem festen Zielzustand statt eines einzigen umschaltenden Präfixes, da ein Tastaturkürzel die Kontrollkästchen-Zustände, die es gleich ändert, nicht sehen kann — anders als ein Mausklick auf das sichtbare Kontrollkästchen. Dasselbe Kürzel würde je nach bereits aktiviertem Zustand anzeigen oder ausblenden. `v`/`x` greifen die Kopieren-Ausschneiden-Eselsbrücke auf (Einfügen / Ausschneiden) statt „anzeigen"/„ausblenden" auszubuchstabieren. Keine Modifikatortaste — Ctrl/Cmd-basierte Kürzel riskieren bei einem Tippfehler ein `Cmd-Q` (beendet den gesamten Browser unter macOS), daher wird hier stattdessen ein einfacher Präfix verwendet, dasselbe Muster, das GitHub für seine eigene `g` `i`-Navigation nutzt. Es löst nur aus, wenn der Fokus nicht in einem Textfeld liegt.

Da jeder Code aus genau 2 Buchstaben besteht, löst sich das Kürzel immer sofort nach Eingabe des zweiten Buchstabens auf — kein Warten, keine Mehrdeutigkeit zwischen z. B. `IE` und einem längeren Code, der genauso beginnt (den es nicht gibt).

```
v I E    zeigt die Zelle IE (qualifiziert, Importe, Exporte)
x I E    blendet die Zelle IE aus
v Q B    zeigt alle qualifizierten Zeilen
x A B    blendet alles aus
```

Zwei Kürzel nacheinander erreichen unabhängig vom Ausgangszustand einen exakten Zielzustand — z. B. „nur `FK`, egal vom Ausgangszustand" mit `x A B` (alles ausblenden) gefolgt von `v F K` (nur `FK` anzeigen).

`Esc` bricht ein Kürzel jederzeit während der Eingabe ab; ein untätiges Kürzel setzt sich nach ~1,5s auch automatisch zurück.

## Beispiele

```
?show=QB                        Länderliste: alle 48 qualifizierten Länder; nicht qualifizierte ausgeblendet.
?show=QB&sort=pop&dir=asc       Länderliste: qualifizierte Länder nach Bevölkerung aufsteigend sortiert.
?show=IE                        Länderliste: nur Länder, die sowohl importieren als auch exportieren.
?sort=delta&dir=asc&show=QB     Länderliste: qualifizierte Länder mit dem geringsten Überschuss spielt-für gegenüber geboren-in zuerst.
?show=AB                        Länderliste: alle 8 Zellen, einschließlich der normalerweise ausgeblendeten FK und NK.
?show=QB,FE                     Länderliste: qualifizierte Länder + nicht qualifizierte FIFA-Exporteure.
?fifaconf=uefa                  Länderliste: nur UEFA-Mitglieder (FIFA-Filter; Nicht-FIFA nicht betroffen).
?fifaconf=caf&show=AE           Länderliste: nur afrikanische Exporteure.
?stage=r16                      Turnier-Tab: qualifizierte Länder, die das Achtelfinale erreicht haben.
?stage=winner                   Turnier-Tab: nur der eventuelle Champion.
```
<!-- /i18n:api_url_params -->
