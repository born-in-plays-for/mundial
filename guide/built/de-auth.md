<!-- i18n:auth_page_title -->
# Verbindung zum Server
<!-- /i18n:auth_page_title -->

<!-- i18n:auth_intro -->
Diese App kommuniziert mit einem kleinen Backend-Server — der auf dem eigenen Rechner des Entwicklers läuft — für die Anmeldung, Live-Spielaktualisierungen und das Merken Ihrer Sitzung zwischen Besuchen. Diese Verbindung kann sich in einem von vier Zuständen befinden, vom besten zum schlechtesten. Welcher davon unten markiert ist, zeigt, was gerade passiert.
<!-- /i18n:auth_intro -->

<div class="ga-state" data-ga-state="online">

<!-- i18n:auth_state_online -->
## Verbunden

Alles funktioniert: Sie können sich anmelden, die Live-Spiel-Seite aktualisiert sich in Echtzeit, und Ihre Sitzung wird bei Ihrem nächsten Besuch gespeichert. Das Symbol oben rechts zeigt Ihr Profilbild oder eine einfache Anmelde-Schaltfläche, wenn Sie nicht angemeldet sind — kein Warnsymbol.
<!-- /i18n:auth_state_online -->

</div>

<div class="ga-state" data-ga-state="connection">

<!-- i18n:auth_state_connection -->
## Server nicht erreichbar

Ihre Internetverbindung funktioniert, aber der Backend-Server selbst antwortet nicht — er ist möglicherweise ausgeschaltet, oder seine Verbindung zum Internet wurde unterbrochen. Anmeldung, Ihre Sitzung und die Live-Spiel-Seite sind pausiert; die Karte, die Länderrangliste, die Spielerliste und alle im anderen Guide beschriebenen Filter/Sortierungen funktionieren weiterhin normal, da nichts davon den Server benötigt.

Tippen Sie auf das Warnsymbol für einen WhatsApp-Link — schreiben Sie an diese Nummer, und der Server kann in der Regel innerhalb weniger Minuten neu gestartet werden. Kein Neuladen der Seite nötig: Die App versucht es im Hintergrund automatisch erneut und erholt sich von selbst, sobald der Server wieder antwortet.
<!-- /i18n:auth_state_connection -->

</div>

<div class="ga-state" data-ga-state="server">

<!-- i18n:auth_state_server -->
## Server nicht konfiguriert

Seltener: Die App hat nicht einmal eine Adresse für den Server, die sie versuchen könnte. Das ist eher ein Deployment-Problem als ein laufender Ausfall, daher gibt es dafür keine WhatsApp-Abkürzung — es braucht eine Korrektur auf Code-Ebene statt eines einfachen Neustarts. Die praktische Auswirkung ist dieselbe wie bei „Server nicht erreichbar" oben: Anmeldung und die Live-Spiel-Seite sind pausiert, alles andere funktioniert normal.
<!-- /i18n:auth_state_server -->

</div>

<div class="ga-state" data-ga-state="offline">

<!-- i18n:auth_state_offline -->
## Keine Internetverbindung

Nichts, was das Netzwerk benötigt, funktioniert gerade — nicht nur die Anmeldung, sondern auch das Abrufen neuer Daten, Live-Updates oder sogar das Neuladen dieses Guides. Verbinden Sie Ihr Gerät wieder, und die App erholt sich automatisch, ohne dass ein Neuladen nötig ist.
<!-- /i18n:auth_state_offline -->

</div>
