<!-- i18n:page_title -->
# Benutzerhandbuch
<!-- /i18n:page_title -->

<!-- i18n:intro -->
Diese Karte visualisiert die Kader der Fußball-Weltmeisterschaft 2026 unter dem Gesichtspunkt des Geburtsortes.
Jedes Land ist entsprechend der Anzahl der dort geborenen Spieler eingefärbt, die bei dem Turnier
ein **anderes** Land vertreten, normalisiert pro Million Einwohner.
<!-- /i18n:intro -->

<!-- i18n:control_sidebar -->
## Filter- und Sortierbereich

Die Schaltfläche **‹** in der oberen rechten Ecke der Kopfzeile öffnet den Filter- und Sortierbereich,
der steuert, welche Länder in der Elo-Rangliste unter der Karte erscheinen.

![Filter- und Sortierbereich](screenshots/control_sidebar.png)

*Sortierspalte (links) und Filtermatrix (rechts) — auf einen Zeilen- oder Spaltenkopf klicken, um eine ganze Gruppe umzuschalten.*

### Die Filtermatrix

Zeilen gruppieren Länder nach Qualifikationsstatus; Spalten wählen nach Export-/Importrolle aus.
Klicken Sie auf den Spaltenkopf `exp.`, um nur exportierende Länder anzuzeigen;
klicken Sie auf `qualif.`, um alle qualifizierten Nationen auf einmal umzuschalten.
<!-- /i18n:control_sidebar -->

<!-- i18n:country_taxonomy -->
## Länderkategorien

Jedes Land wird als **Pill-Badge** angezeigt, dessen CSS-Stil seine Kategorie kennzeichnet.

<div class="taxonomy" style="display:flex;flex-direction:column;gap:16px;margin:1rem 0">

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555">Qualifiziert vs. nicht qualifiziert</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cz.svg" alt="">
    <span class="elo-name" data-id="203">Czech Republic</span>
  </span>
  <span style="font-size:.875rem">Durchgezogener Rand — qualifiziert für die WM 2026.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ua.svg" alt="">
    <span class="elo-name" data-id="804">Ukraine</span>
  </span>
  <span style="font-size:.875rem">Kein Rand — nicht qualifiziert.</span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555">FIFA vs. Nicht-FIFA</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/is.svg" alt="">
    <span class="elo-name" data-id="352">Iceland</span>
  </span>
  <span style="font-size:.875rem">Dunkler Text — FIFA-Mitglied.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/gl.svg" alt="">
    <span class="elo-name" data-id="304">Greenland</span>
  </span>
  <span style="font-size:.875rem">Heller Text — kein FIFA-Mitglied.</span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555">Hier geboren / spielt für</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/se.svg" alt="">
    <span class="elo-name" data-id="752">Sweden</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#3b82f6">●</span> Spieler, die in diesem Land geboren wurden, spielen für ein anderes qualifiziertes Land.</span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#ef4444">●</span> Spieler, die in einem anderen Land geboren wurden, spielen für dieses Land.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#3b82f6">●</span><span style="color:#ef4444">●</span> Spieler aus diesem Land spielen für andere Länder, und Spieler aus anderen Ländern spielen für dieses Land.</span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555">Nicht auf der Karte</div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px">Orthogonal zu den obigen Kategorien.</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/sg.svg" alt="">
    <span class="elo-name" data-id="702">Singapore</span>
  </span>
  <span style="font-size:.875rem">Name in <em>Kursivschrift</em> — zu klein für die Karte.</span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/mc.svg" alt="">
    <span class="elo-name" data-id="492">Monaco</span>
  </span>
  <span style="font-size:.875rem">Ebenso, hier kombiniert mit Nicht-FIFA.</span>
</div>
</div>

</div>
<!-- /i18n:country_taxonomy -->

<!-- i18n:interaction_flow -->
## Interaktionsmodell

Klicken Sie auf ein beliebiges Land auf der Karte — oder auf ein Badge in der Elo-Liste — um den **Dim-Modus** zu aktivieren:
nicht verbundene Flaggen verblassen, Bögen zeigen Exportflüsse, und die Spielertabelle erscheint unter der Karte.

```mermaid
flowchart LR
    B(Browse) -->|"Land / Elo-Badge anklicken"| D(Dim-Modus)
    D -->|"dasselbe anklicken"| B
    D -->|"anderes Land anklicken"| D
    D -->|Esc| B
```

*Das erneute Anklicken desselben Elements kehrt immer zu Browse zurück.*

> **Tipp:** Ein zweites Klicken auf das aktive Elo-Badge beendet den Dim-Modus, ohne die Karte zu verschieben.
<!-- /i18n:interaction_flow -->

<!-- i18n:data_sources -->
## Datenquellen

| Quelle | Verwendung |
|---|---|
| [Wikipedia](https://wikipedia.org) Kaderseiten | Spielernamen, Geburtsländer, Länderspielanzahl |
| [eloratings.net](https://www.eloratings.net/) | Weltfußball-Elo-Ranglisten |
| [Weltbank](https://data.worldbank.org/) | Länderbevölkerungen |
<!-- /i18n:data_sources -->
