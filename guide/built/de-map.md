<!-- i18n:page_title -->
# Benutzerhandbuch
<!-- /i18n:page_title -->

<!-- i18n:intro -->
Diese Karte visualisiert die Kader der Fußball-Weltmeisterschaft 2026 unter dem Gesichtspunkt des Geburtsortes.
Jedes Land ist entsprechend seiner Netto-Talentbilanz eingefärbt — siehe *Die Legende*, unten —
die hier geborene Spieler gegen hier spielende Spieler abwägt.
<!-- /i18n:intro -->

<!-- i18n:quotes -->
## Die Zitate

Der Kopfbereich zeigt ein rotierendes Karussell mit 15 berühmten Literaturzitaten —
von François Villon (1461) bis Simone de Beauvoir (1949) — jedes humorvoll in ein
Fußball-Zitat verwandelt.

Navigieren Sie zwischen den Zitaten mit den nach links gerichteten Chevrons oder wischen Sie auf Touchscreens nach rechts.
Drücken und halten Sie (oder halten Sie die Maustaste gedrückt) auf ein Zitat, um die Originalzeile anzuzeigen; loslassen, um zurückzukehren.

Ein Wisch nach links öffnet dagegen ein ganz anderes Panel — das Kontrollpanel,
das steuert, wie Länder gefiltert, sortiert und angezeigt werden.
<!-- /i18n:quotes -->

<!-- i18n:control_sidebar -->
# Das Kontrollpanel

Die Schaltfläche <kbd style="background:var(--bg-hover,#f0ede8);border:1px solid var(--border,#e4e0d8);color:var(--text-muted,#999);border-radius:0 4px 4px 0">‹</kbd> in der oberen rechten Ecke des Fensters öffnet das Kontrollpanel, das steuert, was auf der Karte und in der Länderliste erscheint.

![Kontrollpanel](screenshots/control_sidebar-de.png)

Das Panel hat fünf Teile: eine **Werkzeugleiste** oben; **Sortieren** und **Anzeigen** links; die **Filter**-Matrix rechts; und eine **Infoleiste** unten.

## Werkzeugleiste

- <kbd style="font-size:.68em;font-family:var(--bs-font-monospace,ui-monospace,monospace);background:var(--bg-hover,#f0ede8);border:1px solid var(--border,#e4e0d8);color:#1C274C;border-radius:3px;padding:2px 4px;vertical-align:middle">ESC</kbd> klappt das Panel wieder zu seiner ‹-Schaltfläche zusammen.
- <img class="gp-icon" src="images/solar_linear/widget-5-svgrepo-com.svg" alt="Konföderation"> filtert die Liste auf eine einzelne FIFA-Konföderation — siehe *FIFA-Konföderationsfilter*, unten.
- <img class="gp-icon" src="images/solar_linear/share-svgrepo-com.svg" alt="teilen"> und <img class="gp-icon" src="images/solar_linear/question-circle-svgrepo-com.svg" alt="Parameter"> bilden ein Paar: **teilen** kopiert eine URL, die die exakte aktuelle Konfiguration des Panels wiedergibt, in die Zwischenablage — bereit zum Einfügen auf einem anderen Gerät oder zum Versenden; **Parameter** öffnet eine Zusammenfassung derselben aktuellen Einstellungen in Klartext — Sortierung, Filter, Phase und mehr — dasselbe Panel, das `?explain` bei jedem Seitenaufruf öffnet (siehe *URL-Parameter*, unten).

## Sortieren

Vier umsortierbare Kriterien — **die Elo-Bewertung** (ein unabhängiger Wert, der sich nach jedem Spiel je nach Ergebnis und Stärke des Gegners ändert — siehe den Tab [Datenquellen](?guide=data) für die genaue Erklärung), **Bevölkerung**, **Δ** (Delta aus spielt-für minus geboren-in), **A–Z** — plus eine Richtungsschaltfläche (↓↑) zum Umkehren von auf-/absteigend. Nur die obersten zwei Kriterien sind tatsächlich aktiv; ein Klick auf ein Kriterium verschiebt es an die erste Stelle.

## Anzeigen

Zwei unabhängige Reihen von Auswahl-Pillen, unter der Sortierung:

- **Export / einheimisch / Import**: welche Rolle einem Spieler seinen Platz in der Tabelle verschafft hat — hier geboren und anderswo nominiert; hier geboren und hier nominiert; anderswo geboren und hier nominiert.
- **Feldspieler / Trainer**: welche Art von Person angezeigt wird.

Jede Option ist standardmäßig aktiviert (alle werden angezeigt); eine Option deaktivieren blendet diese Gruppe aus. Derzeit nur innerhalb von *Die Spielertabelle*, weiter unten, aktiv — die Optionen werden angezeigt, bleiben aber vorerst anderswo deaktiviert.

## Filter

Die Matrix kreuzt zwei **Spalten** (Exporteur / Nicht-Exporteur) mit vier **Zeilen** in zwei Gruppen:

- **Qualifiziert** — aufgeteilt danach, ob das Land Spieler importiert oder nicht
- **Nicht qualifiziert** — aufgeteilt nach FIFA-Mitgliedschaft

Deaktivieren Sie eine Zelle, um diese Kategorie auszublenden. Klicken Sie auf einen Zeilen- oder Spaltenkopf, um die gesamte Gruppe auf einmal umzuschalten.

## Infoleiste

Zeigt, wie viele Länder derzeit sichtbar sind (von der Gesamtzahl), sowie die Datenquelle (und das letzte Aktualisierungsdatum) für das jeweils oberste Kriterium in der Sortierspalte.

## FIFA-Konföderationsfilter

Die Schaltfläche <img class="gp-icon" src="images/solar_linear/widget-5-svgrepo-com.svg" alt="Konföderation"> neben der **FIFA**-Zeile öffnet ein Dropdown-Menü, um die Liste auf eine einzelne Konföderation zu filtern. Nicht-FIFA-Länder sind nicht betroffen — sie bleiben entsprechend dem Rest der Filtermatrix sichtbar oder ausgeblendet.

Die Auswahl einer Konföderation hebt zudem ihre Außengrenze auf der Karte hervor und zoomt darauf ein. Wählen Sie **Alle FIFA-Konföderationen**, um den Filter aufzuheben.

## URL-Parameter

Der Filter- und Sortierstatus kann auch direkt über die URL konfiguriert werden — `?sort=`, `?dir=`, `?stage=`, `?show=`, `?fifaconf=`, `?pshow=`, sowie `?bottomtab=` und `?select=`, um direkt zu einem Tab mit bereits ausgewähltem Land zu springen. Fügen Sie `?explain` zu einer beliebigen URL hinzu, um ein Panel zu öffnen, das die aktuellen Einstellungen des Panels zusammenfasst — siehe *„?explain“ — die aktuelle Konfiguration einsehen* im Tab [API-Leitfaden](?guide=api) für die genaue Erklärung, was dort angezeigt wird und warum. Die vollständige Referenz mit allen Zellcodes, Gruppenaliasen und Beispielen findet sich dort ebenfalls.

## Zur Länderreferenz

Karte und Liste verwenden [eloratings.net](https://www.eloratings.net/) als Länderquelle — nicht die FIFA-Mitgliederliste. Dies bedeutet, dass die Liste Gebiete ganz ohne FIFA-Mitgliedschaft enthält, wie Grönland.

Sie enthält außerdem die vier britischen Heimnationen — England, Schottland, Wales, Nordirland — als vier eigenständige Einträge statt eines einzigen „Vereinigten Königreichs", aus einem ganz anderen Grund: Anders als Grönland *sind* sie FIFA-Mitglieder, jede für sich. Ungewöhnlich an ihnen ist, dass sie subnationale Einheiten mit eigener FIFA- (und Elo-)Mitgliedschaft sind, nicht eine Lücke in einer der beiden Listen.

Die Standardsortierung erfolgt nach Elo-Bewertung; andere Sortierkriterien sind in der Sortierspalte verfügbar.
<!-- /i18n:control_sidebar -->

<!-- i18n:tax_heading -->
## Länderkategorien
<!-- /i18n:tax_heading -->

<!-- i18n:tax_intro -->
Jedes Land wird als **Pill-Badge** angezeigt, dessen CSS-Stil seine Kategorie auf einen Blick kennzeichnet.
<!-- /i18n:tax_intro -->

<div class="taxonomy" style="display:flex;flex-direction:column;gap:16px;margin:1rem 0">

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_qualified -->
Qualifiziert vs. nicht qualifiziert
<!-- /i18n:tax_label_qualified --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cz.svg" alt="">
    <span class="elo-name" data-id="203">Czech Republic</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_yes -->
Durchgezogener Rand — qualifiziert und noch im Turnier.
<!-- /i18n:tax_desc_border_yes --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--knocked-out" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ir.svg" alt="">
    <span class="elo-name" data-id="364">Iran</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_dashed -->
Gestrichelter Rand — qualifiziert, aber ausgeschieden.
<!-- /i18n:tax_desc_border_dashed --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ua.svg" alt="">
    <span class="elo-name" data-id="804">Ukraine</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_no -->
Kein Rand — nicht qualifiziert.
<!-- /i18n:tax_desc_border_no --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_fifa -->
FIFA vs. Nicht-FIFA
<!-- /i18n:tax_label_fifa --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/is.svg" alt="">
    <span class="elo-name" data-id="352">Iceland</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_text_dark -->
Dunkler Text — FIFA-Mitglied.
<!-- /i18n:tax_desc_text_dark --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/gl.svg" alt="">
    <span class="elo-name" data-id="304">Greenland</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_text_light -->
Heller Text — kein FIFA-Mitglied.
<!-- /i18n:tax_desc_text_light --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_born -->
Hier geboren / spielt für
<!-- /i18n:tax_label_born --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--exp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/it.svg" alt="">
    <span class="elo-name" data-id="380">Italy</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#1d4ed8">▶</span> <!-- i18n:tax_desc_exp -->
Spieler, die in diesem Land geboren wurden, spielen für ein anderes qualifiziertes Land.
<!-- /i18n:tax_desc_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#dc2626">◀</span> <!-- i18n:tax_desc_imp -->
Spieler, die in einem anderen Land geboren wurden, spielen für dieses Land.
<!-- /i18n:tax_desc_imp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#dc2626">◀</span><span style="color:#1d4ed8">▶</span> <!-- i18n:tax_desc_both -->
Spieler aus anderen Ländern spielen für dieses Land, und Spieler aus diesem Land spielen für andere Länder.
<!-- /i18n:tax_desc_both --></span>
</div>
<div style="font-size:.8rem;color:#777;margin:6px 0"><!-- i18n:tax_note_gradient -->
Der Hintergrund der Pille ist selbst ein Verlauf von Rot (Importe) → Weiß (einheimisch) → Blau (Exporte) — je breiter das Band einer Farbe, desto größer der Anteil dieser Gruppe am gesamten Spielerkader des Landes.
<!-- /i18n:tax_note_gradient --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="--exp-color: rgb(59,130,246); --imp-color: rgb(248,173,173); --imp-pivot: 2.8%; --native-pivot: 25.0%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
    <span class="elo-pts"><span class="elo-pts-primary">3 · 81</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_exp -->
Überwiegend blau — ein starker Exporteur (81) mit nur einer Handvoll Importen (3).
<!-- /i18n:tax_desc_gradient_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="--exp-color: rgb(160,197,250); --imp-color: rgb(248,167,167); --imp-pivot: 18.4%; --native-pivot: 86.4%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/us.svg" alt="">
    <span class="elo-name" data-id="840">United States</span>
    <span class="elo-pts"><span class="elo-pts-primary">7 · 11</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_mixed -->
Ein sichtbares rotes Band neben dem Blau — eine ausgewogenere Mischung aus Exporten (11) und Importen (7).
<!-- /i18n:tax_desc_gradient_mixed --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--knocked-out elo-item--imp" style="--imp-color: rgb(239,68,68); --imp-pivot: 96.3%; --native-pivot: 100.0%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
    <span class="elo-pts"><span class="elo-pts-primary">26</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_imp -->
Fast vollständig rot — fast der gesamte Kader (26) wurde anderswo geboren.
<!-- /i18n:tax_desc_gradient_imp --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555"><!-- i18n:tax_label_offmap -->
Nicht auf der Karte
<!-- /i18n:tax_label_offmap --></div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px"><!-- i18n:tax_note_offmap -->
Orthogonal zu den obigen Kategorien.
<!-- /i18n:tax_note_offmap --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/sg.svg" alt="">
    <span class="elo-name" data-id="702">Singapore</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_nomap -->
Gedimmte Flagge — nicht in den zugrunde liegenden Kartendaten enthalten (meist weil das Territorium zu klein ist).
<!-- /i18n:tax_desc_nomap --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/mc.svg" alt="">
    <span class="elo-name" data-id="492">Monaco</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_nomap_nonfifa -->
Ebenso, hier kombiniert mit Nicht-FIFA.
<!-- /i18n:tax_desc_nomap_nonfifa --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555"><!-- i18n:tax_label_fixture -->
Spielpaarungen (Spiele-Ansicht)
<!-- /i18n:tax_label_fixture --></div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px"><!-- i18n:tax_note_fixture -->
Nur in der Spiele-Ansicht sichtbar — siehe Team-/Spiel-Ansicht, oben.
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
Grüner Haken auf der Pille — hat ein entschiedenes Spiel gewonnen.
<!-- /i18n:tax_desc_won --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--lost" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/br.svg" alt="">
    <span class="elo-name" data-id="76">Brazil</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_lost -->
Flagge in Graustufen — hat ein entschiedenes Spiel verloren.
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
Wellenförmiger Rand — Spiel noch nicht ausgetragen.
<!-- /i18n:tax_desc_pending --></span>
</div>
</div>

</div>

<!-- i18n:map -->
# Die Karte

## Choropleth und Flaggen

Jedes Land ist entsprechend seiner Netto-Talentbilanz eingefärbt — hausgemachter Beitrag (Exporte plus einheimische Spieler) minus Importe (siehe *Die Legende*, unten). Je einseitiger diese Bilanz in die eine oder andere Richtung ausfällt, desto dunkler der Farbton; ein Land nahe der neutralen Balance erscheint blass. Länder ohne Daten zu dieser Kennzahl erscheinen in einem neutralen hellen Ton.
Länder, die derzeit im Filter enthalten sind, zeigen eine kreisförmige Flaggenmarkierung.

![Flaggen der qualifizierten Mannschaften](screenshots/qualified_flags.png)

## Zoom und Navigation

Scrollen (oder kneifen) zum Zoomen · ziehen zum Verschieben. Zwei runde Schaltflächen befinden sich in der Leiste unter der Karte, links neben der Legende:

- <img class="gp-icon" src="images/solar_linear/global-svgrepo-com.svg" alt="zurücksetzen"> zoomt heraus zur Standardansicht — alle Länder, die die Karte tatsächlich zeigt, ins Bild eingepasst. Eine Handvoll kleiner Territorien hat überhaupt keine Präsenz auf der Karte und wird nie einbezogen; siehe *Nicht auf der Karte*, oben.
- <img class="gp-icon" src="images/solar_linear/maximize-square-2-svgrepo-com.svg" alt="anpassen"> zoomt und verschiebt, um alles derzeit auf der Karte Sichtbare einzupassen — standardmäßig jede angezeigte Flagge, oder nur die hervorgehobene Auswahl, während ein Land ausgewählt ist (oder ein Gruppenphasen-Fokus aktiv ist).

## Die Legende

Die Karte färbt jedes Land entsprechend seiner Netto-Talentbilanz ein — hausgemachter Beitrag (Exporte plus einheimische Spieler) minus Importe. Netto-Exporteure und Netto-Importeure erscheinen in zwei unterschiedlichen Farben zu beiden Seiten eines neutralen Mittelpunkts.

Der Farbbalken am unteren Rand der Kopfzeile liest sich von links nach rechts wie ein Zahlenstrahl — negatives Extrem, neutrale 0 in der Mitte, positives Extrem — mit einer Referenzmarke an jedem Ende und in der Mitte, sowie einem eigenständigen Punkt *an jedem Ende* für das Land, das auf dieser Seite am weitesten außerhalb der Skala liegt (größter Netto-Importeur, größter Netto-Exporteur).

![Legende](screenshots/legend.png)

Die beiden eigenständigen Punkte sind immer dieselben zwei Länder: **Curaçao**, der größte Netto-Importeur (der gesamte Kader ist in den Niederlanden geboren), am negativen Ende, und **Frankreich**, der größte Netto-Exporteur, am positiven Ende.

## Tooltips

Fahren Sie mit der Maus über ein Land, um Details zu sehen. Tooltips werden auf Mobilgeräten nicht angezeigt.

- **Geburtsländer**: Exportanzahl und Top-Spieler, jeweils mit ihrer Zielflagge
- **Qualifizierte Länder, die auch rekrutieren**: eine rechte Spalte fügt die Importseite hinzu
- **Nicht qualifizierte Geburtsländer**: ein Badge *nicht qualifiziert* ersetzt das Kader-Panel
<!-- /i18n:map -->

<!-- i18n:bottom_panel -->
# Das untere Panel

Der scrollbare Bereich unter der Karte hat drei Registerkarten.

## <img class="gp-icon" src="images/solar_linear/ranking-svgrepo-com.svg" alt=""> Die Länderliste

Die Standardregisterkarte listet jedes Land — qualifiziert oder nicht — als Pille auf, ohne Turnierkarussell.
Das Kontrollpanel steuert, welche Pillen erscheinen und in welcher Reihenfolge;
die Standardsortierung erfolgt nach [Welt-Elo-Bewertung](https://www.eloratings.net/).

Ein Klick auf eine Pille wählt dieses Land aus und zoomt die Karte darauf.

Für Länder mit **geboren hier / spielt für**-Verbindungen erscheinen auch farbige Pfeile auf der Karte:

- {{ARROW_BLUE}} **blaue Pfeile**: Kader, die Spieler einschließen, die im ausgewählten Land geboren wurden
- {{ARROW_RED}} **rote Pfeile**: Länder, in denen anderswo geborene Spieler für diesen Kader spielen

*Die Pfeilstärke richtet sich nach der Anzahl der Spieler.*

Die in *Zoom und Navigation*, oben, beschriebenen Zoom-Schaltflächen verhalten sich hier genauso: **anpassen** passt jetzt gezielt die hervorgehobenen Länder ein, **zurücksetzen** kehrt zur Standardansicht zurück.

Klicken Sie erneut auf die aktive Pille, klicken Sie woanders auf die Karte, oder drücken Sie **Esc**, um die Auswahl aufzuheben.

## <img class="gp-icon" src="images/world-cup-svgrepo-com.svg" alt=""> Turnier

Dieselbe Pillenliste, diesmal beschränkt auf die 48 **qualifizierten** Länder, mit einem kleinen Karussell darüber, das sieben Positionen durchläuft: **Gruppenphase → Sechzehntelfinale → Achtelfinale → Viertelfinale → Halbfinale → Finale → Sieger**.

- Verwenden Sie die Pfeile ‹ › oder wischen Sie auf Touchscreens nach links/rechts, um zwischen den Phasen zu wechseln.
- Jede Position filtert qualifizierte Länder auf jene, die diese Phase „erreicht“ haben — zu Beginn noch im Turnier, oder bereits Sieger.
- Die Navigation ist auf die vom Turnier tatsächlich erreichte Phase begrenzt; weitere Positionen bleiben gesperrt, bis die entsprechenden Spiele ausgetragen sind.

Das Karussell ist hier der einzige geltende Filter: Es bis zum Achtelfinale vorzurücken zeigt genau
die Mannschaften, die diese Phase erreicht haben, unabhängig von den Kontrollkästchen des Kontrollpanels oder dem
Konföderationsfilter — diese wirken sich nur auf den Standard-Tab „Teams" aus, der kein eigenes Phasenkonzept hat.
Nicht qualifizierte Länder erscheinen in diesem Tab ebenfalls nie, egal wie ihre eigenen Kontrollkästchen gesetzt sind.

Bei der **Gruppenphase** wird die Pillenliste durch Gruppentabellen ersetzt — standardmäßig alle 12 Gruppen (A–L) auf einmal, oder über die Auswahl auf eine einzelne verengt, mit dem Ergebnis jedes Spiels und den für die Sechzehntelfinale qualifizierten Teams entsprechend den tatsächlichen Ergebnissen hervorgehoben (ein Unentschieden bringt keinem der beiden ein Häkchen).

Nach der Gruppenphase werden Länder stattdessen automatisch nach Spielpaarung gruppiert: Jede Zeile paart beide Gegner zu beiden Seiten von Anstoßdatum/Ergebnis —

- Noch nicht gespielt: das Anstoßdatum, und ein wellenförmiger oberer/unterer Rand auf beiden Pillen — ein „noch offen“-Look für ein Spiel, das noch in beide Richtungen ausgehen kann.
- Gespielt: das Ergebnis (plus Elfmeterschießen-Resultat, falls es so weit kam) anstelle des Datums, und die Flagge des Verlierer-Teams ausgegraut.

Bei der Position **Finale** bilden die beiden Halbfinal-Verlierer ihr eigenes Paar — das Spiel um Platz 3 — in einer eigenen, überschriebenen Liste unterhalb des echten Finales, sodass die beiden Spiele nie miteinander vermischt werden.

Ein Klick auf eine Pille, die Pfeile und die Zoom-Schaltflächen verhalten sich hier alle genauso wie in *Die Länderliste*, oben.

## <img class="gp-icon" src="images/solar_linear/user-circle-svgrepo-com.svg" alt=""> Die Spielertabelle

Immer dieselbe flache Tabelle — **Name**, **geboren in**, **spielt für**, **Länderspiele** — unabhängig davon, was ausgewählt ist. Klicken Sie auf eine Spaltenüberschrift, um danach zu sortieren; klicken Sie erneut, um die Reihenfolge umzukehren. Spielernamen verlinken auf ihre Wikipedia-Seite in der aktuellen Oberflächensprache, wenn verfügbar.

Nur die Zeilen ändern sich mit der aktuellen Auswahl:

- **Keine Auswahl**: jeder Spieler und Trainer aller 48 qualifizierten Kader, die derzeit auf der Karte sichtbar sind.
- **Ein Land ausgewählt**: jeder Spieler und Trainer, der mit ihm verbunden ist — dort geboren, dort geboren und nominiert, oder anderswo geboren und dort nominiert.
- **Ein Spiel ausgewählt**: die Spieler beider Teams zusammen.

Die Zeile **Anzeigen** im Bedienfeld (siehe oben) schränkt diese Zeilen weiter ein, solange dieser Tab geöffnet ist.

Ohne Auswahl werden Geburtsstädte auch auf der Karte selbst als Bubbles dargestellt — ein Punkt pro einzigartiger Geburtsstadt unter den aufgelisteten Spielern, größer, wenn mehr Spieler sich eine Stadt teilen:

![Geburtsstadt-Bubbles](screenshots/bubbles.png)

Fahren Sie mit der Maus über einen Punkt für Stadtname und die dort geborenen Spieler.

## <img class="gp-icon" src="images/wc2026.svg" alt=""> Ketten

Sequenzen von Ländern, die durch geboren-hier / spielt-für-Verbindungen verknüpft sind — ein Spieler, der in A geboren wurde, spielt für B, ein Spieler, der in B geboren wurde, spielt für C, und so weiter, und bildet eine Kette von Nationalitäten durch das Turnier — werden auf einer eigenen [separaten Seite](/chains/wc2026_chain_longest.html) erkundet.
<!-- /i18n:bottom_panel -->
