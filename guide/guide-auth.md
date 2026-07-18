<!-- i18n:auth_page_title -->
# Connecting to the Server
<!-- /i18n:auth_page_title -->

<!-- i18n:auth_intro -->
This app talks to a small backend server — running on the developer's own machine — for signing in, live match updates, and remembering your session between visits. That connection can be in one of four states, from best to worst. Whichever one is marked below is what's happening right now.
<!-- /i18n:auth_intro -->

<div class="ga-state" data-ga-state="online">

<!-- i18n:auth_state_online -->
<img class="ga-icon" src="images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">

## Connected

Everything works: you can sign in, the live game page updates in real time, and your session is remembered the next time you visit. The icon in the top-right corner shows your profile picture, or a plain sign-in button if you're not signed in — no warning icon.
<!-- /i18n:auth_state_online -->

</div>

<div class="ga-state" data-ga-state="connection">

<!-- i18n:auth_state_connection -->
<img class="ga-icon" src="images/database-error-svgrepo-com.svg" alt="">

## Server unreachable

Your internet connection is fine, but the backend server itself isn't answering — it might be switched off, or its connection to the internet closed. Signing in, your session, and the live game page are paused; the map, country rankings, player list, and every filter/sort described in the other guide keep working normally, since none of that needs the backend.

Tap the warning icon for a WhatsApp link — message that number and the server can usually be restarted within a few minutes. No need to reload the page: the app quietly retries in the background and recovers on its own once the server answers again.
<!-- /i18n:auth_state_connection -->

</div>

<div class="ga-state" data-ga-state="server">

<!-- i18n:auth_state_server -->
<img class="ga-icon" src="images/settings-off-svgrepo-com.svg" alt="">

## Server not configured

A rarer case: the app doesn't even have an address for the backend to try. This is a deploy hiccup rather than a live outage, so there's no WhatsApp shortcut for it — it needs a fix on the code side rather than just restarting something. The practical effect is the same as "server unreachable" above: signing in and the live game page are paused, everything else works normally.
<!-- /i18n:auth_state_server -->

</div>

<div class="ga-state" data-ga-state="offline">

<!-- i18n:auth_state_offline -->
<img class="ga-icon" src="images/wifi-off-svgrepo-com.svg" alt="">

## No internet connection

Nothing that needs the network works right now — not just signing in, but also fetching new data, live updates, or even reloading this guide. Reconnect your device and the app recovers automatically, no reload needed.
<!-- /i18n:auth_state_offline -->

</div>

<!-- i18n:auth_after_connect -->
# Once you're connected

<div class="ga-feature">

<img class="ga-icon" src="images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">

### Google sign-in

Right now, signing in mainly matters for Christophe himself — the site's one admin account. Signed in as admin, the navbar's profile picture links to the backend's user/session management page, and the live game page shows an extra settings icon linking to fixtures & discovery controls.

For everyone else, signing in currently just remembers who you are between visits — there's no admin-only feature you're missing. More sign-in-only features for regular visitors may come later.

In the navbar itself: before signing in, you'll see just the sign-in icon (<img class="gp-icon" src="images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">). After signing in, that's replaced by your profile picture (<img class="gp-icon" src="images/Christophe.jpg" alt="" style="border-radius:50%"> — Christophe's own, shown here as an example; yours will be your actual Google account photo) next to a small sign-out icon (<img class="gp-icon" src="images/solar_linear/square-bottom-down-svgrepo-com.svg" alt="">).

</div>

<div class="ga-feature">

<img class="ga-icon" src="images/solar_linear/tv-svgrepo-com.svg" alt="">

### Live match updates

The live game page shows real-time World Cup 2026 match events, stats, and lineups as they happen — available to everyone, whether signed in or not. It uses the same backend connection described above, so its own status follows the four states above: live and updating when connected, paused with the same warning icon whenever the server is unreachable or you're offline.

</div>
<!-- /i18n:auth_after_connect -->
