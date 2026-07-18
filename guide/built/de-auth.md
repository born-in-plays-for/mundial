<!-- i18n:auth_page_title -->
# Verbindung zum Server
<!-- /i18n:auth_page_title -->

<!-- i18n:auth_intro -->
Diese App kommuniziert mit einem kleinen Backend-Server — der auf dem eigenen Rechner des Entwicklers läuft — für die Anmeldung, Live-Spielaktualisierungen und das Merken Ihrer Sitzung zwischen Besuchen. Diese Verbindung kann sich in einem von vier Zuständen befinden, vom besten zum schlechtesten. Welcher davon unten markiert ist, zeigt, was gerade passiert.
<!-- /i18n:auth_intro -->

<div class="ga-state" data-ga-state="online">

<!-- i18n:auth_state_online -->
<img class="ga-icon" src="images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">

## Verbunden

Alles funktioniert: Sie können sich anmelden, die Live-Spiel-Seite aktualisiert sich in Echtzeit, und Ihre Sitzung wird bei Ihrem nächsten Besuch gespeichert. Das Symbol oben rechts zeigt Ihr Profilbild oder eine einfache Anmelde-Schaltfläche, wenn Sie nicht angemeldet sind — kein Warnsymbol.
<!-- /i18n:auth_state_online -->

</div>

<div class="ga-state" data-ga-state="connection">

<!-- i18n:auth_state_connection -->
<img class="ga-icon" src="images/database-error-svgrepo-com.svg" alt="">

## Server nicht erreichbar

Ihre Internetverbindung funktioniert, aber der Backend-Server selbst antwortet nicht — er ist möglicherweise ausgeschaltet, oder seine Verbindung zum Internet wurde unterbrochen. Anmeldung, Ihre Sitzung und die Live-Spiel-Seite sind pausiert; die Karte, die Länderrangliste, die Spielerliste und alle im anderen Guide beschriebenen Filter/Sortierungen funktionieren weiterhin normal, da nichts davon den Server benötigt.

Tippen Sie auf das Warnsymbol für einen WhatsApp-Link — schreiben Sie an diese Nummer, und der Server kann in der Regel innerhalb weniger Minuten neu gestartet werden. Kein Neuladen der Seite nötig: Die App versucht es im Hintergrund automatisch erneut und erholt sich von selbst, sobald der Server wieder antwortet.
<!-- /i18n:auth_state_connection -->

</div>

<div class="ga-state" data-ga-state="server">

<!-- i18n:auth_state_server -->
<img class="ga-icon" src="images/settings-off-svgrepo-com.svg" alt="">

## Server nicht konfiguriert

Seltener: Die App hat nicht einmal eine Adresse für den Server, die sie versuchen könnte. Das ist eher ein Deployment-Problem als ein laufender Ausfall, daher gibt es dafür keine WhatsApp-Abkürzung — es braucht eine Korrektur auf Code-Ebene statt eines einfachen Neustarts. Die praktische Auswirkung ist dieselbe wie bei „Server nicht erreichbar" oben: Anmeldung und die Live-Spiel-Seite sind pausiert, alles andere funktioniert normal.
<!-- /i18n:auth_state_server -->

</div>

<div class="ga-state" data-ga-state="offline">

<!-- i18n:auth_state_offline -->
<img class="ga-icon" src="images/wifi-off-svgrepo-com.svg" alt="">

## Keine Internetverbindung

Nichts, was das Netzwerk benötigt, funktioniert gerade — nicht nur die Anmeldung, sondern auch das Abrufen neuer Daten, Live-Updates oder sogar das Neuladen dieses Guides. Verbinden Sie Ihr Gerät wieder, und die App erholt sich automatisch, ohne dass ein Neuladen nötig ist.
<!-- /i18n:auth_state_offline -->

</div>

<!-- i18n:auth_after_connect -->
# Sobald Sie verbunden sind

<div class="ga-feature">

<img class="ga-icon" src="images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">

### Google-Anmeldung

Im Moment ist die Anmeldung hauptsächlich für Christophe selbst wichtig — das einzige Admin-Konto der Seite. Als Admin angemeldet, verlinkt das Profilbild in der Navigationsleiste auf die Benutzer- und Sitzungsverwaltung des Servers, und die Live-Spiel-Seite zeigt ein zusätzliches Einstellungssymbol, das zu den Spiel- und Erkennungssteuerungen führt.

Für alle anderen merkt sich die Anmeldung derzeit einfach, wer Sie sind, zwischen den Besuchen — es gibt keine Admin-Funktion, die Ihnen entgeht. Weitere anmeldegebundene Funktionen für normale Besucher könnten später hinzukommen.

In der Navigationsleiste selbst: Vor der Anmeldung sehen Sie nur das Anmeldesymbol (<img class="gp-icon" src="images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">). Nach der Anmeldung wird dieses durch Ihr Profilbild ersetzt (<img class="gp-icon" src="images/Christophe.jpg" alt="" style="border-radius:50%"> — Christophes eigenes, hier als Beispiel gezeigt; Ihres wird Ihr tatsächliches Google-Konto-Foto sein), daneben ein kleines Abmeldesymbol (<img class="gp-icon" src="images/solar_linear/square-bottom-down-svgrepo-com.svg" alt="">).

</div>

<div class="ga-feature">

<img class="ga-icon" src="images/solar_linear/tv-svgrepo-com.svg" alt="">

### Live-Spielaktualisierungen

Die Live-Spiel-Seite zeigt Ereignisse, Statistiken und Aufstellungen der Spiele der Weltmeisterschaft 2026 in Echtzeit — verfügbar für alle, angemeldet oder nicht. Sie nutzt dieselbe oben beschriebene Serververbindung, ihr eigener Status folgt also den vier oben genannten Zuständen: live und aktuell, wenn alles funktioniert, pausiert mit demselben Warnsymbol, sobald der Server nicht erreichbar ist oder Sie offline sind.

</div>
<!-- /i18n:auth_after_connect -->
