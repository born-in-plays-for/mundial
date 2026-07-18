<!-- i18n:auth_page_title -->
# Connessione al server
<!-- /i18n:auth_page_title -->

<!-- i18n:auth_intro -->
Questa app comunica con un piccolo server backend — in esecuzione sul computer dello sviluppatore — per l'accesso, gli aggiornamenti delle partite in diretta e la memorizzazione della sessione tra una visita e l'altra. Questa connessione può trovarsi in uno di quattro stati, dal migliore al peggiore. Quello indicato qui sotto è ciò che sta accadendo in questo momento.
<!-- /i18n:auth_intro -->

<div class="ga-state" data-ga-state="online">

<!-- i18n:auth_state_online -->
<img class="ga-icon" src="/images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">

## Connesso

Tutto funziona: puoi accedere, la pagina della partita in diretta si aggiorna in tempo reale e la tua sessione viene ricordata alla prossima visita. L'icona in alto a destra mostra la tua immagine del profilo, oppure un semplice pulsante di accesso se non hai effettuato l'accesso — nessuna icona di avviso.
<!-- /i18n:auth_state_online -->

</div>

<div class="ga-state" data-ga-state="connection">

<!-- i18n:auth_state_connection -->
<img class="ga-icon" src="/images/database-error-svgrepo-com.svg" alt="">

## Server irraggiungibile

La tua connessione internet funziona, ma il server backend stesso non risponde — potrebbe essere spento, oppure la sua connessione a internet potrebbe essersi interrotta. L'accesso, la tua sessione e la pagina della partita in diretta sono in pausa; la mappa, la classifica dei paesi, l'elenco dei giocatori e tutti i filtri/ordinamenti descritti nell'altra guida continuano a funzionare normalmente, poiché nulla di tutto ciò richiede il server.

Tocca l'icona di avviso per un link WhatsApp — scrivi a quel numero e il server può solitamente essere riavviato in pochi minuti. Non è necessario ricaricare la pagina: l'app riprova automaticamente in background e si ristabilisce da sola non appena il server torna a rispondere.
<!-- /i18n:auth_state_connection -->

</div>

<div class="ga-state" data-ga-state="server">

<!-- i18n:auth_state_server -->
<img class="ga-icon" src="/images/settings-off-svgrepo-com.svg" alt="">

## Server non configurato

Un caso più raro: l'app non ha nemmeno un indirizzo del server da provare. Si tratta di un intoppo di distribuzione piuttosto che di un'interruzione in corso, quindi non c'è alcuna scorciatoia WhatsApp per questo caso — serve una correzione lato codice piuttosto che un semplice riavvio. L'effetto pratico è lo stesso di "server irraggiungibile" sopra: l'accesso e la pagina della partita in diretta sono in pausa, tutto il resto funziona normalmente.
<!-- /i18n:auth_state_server -->

</div>

<div class="ga-state" data-ga-state="offline">

<!-- i18n:auth_state_offline -->
<img class="ga-icon" src="/images/wifi-off-svgrepo-com.svg" alt="">

## Nessuna connessione internet

Nulla di ciò che richiede la rete funziona in questo momento — non solo l'accesso, ma anche il recupero di nuovi dati, gli aggiornamenti in diretta o persino il ricaricamento di questa guida. Riconnetti il tuo dispositivo e l'app si ristabilisce automaticamente, senza bisogno di ricaricare.
<!-- /i18n:auth_state_offline -->

</div>

<!-- i18n:auth_after_connect -->
# Una volta connesso

<div class="ga-feature">

<img class="ga-icon" src="/images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">

### Accesso con Google

Al momento, l'accesso è importante soprattutto per Christophe stesso — l'unico account amministratore del sito. Da amministratore connesso, l'immagine del profilo nella barra di navigazione rimanda alla pagina di gestione utenti e sessioni del server, e la pagina della partita in diretta mostra un'icona di impostazioni aggiuntiva che porta ai controlli delle partite e della scoperta.

Per tutti gli altri, l'accesso al momento si limita a ricordare chi sei tra una visita e l'altra — non c'è nessuna funzione riservata agli amministratori che ti stia perdendo. In futuro potrebbero arrivare altre funzioni riservate a chi ha effettuato l'accesso.

Nella barra di navigazione stessa: prima di accedere, vedrai solo l'icona di accesso (<img class="gp-icon" src="/images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">). Dopo l'accesso, questa viene sostituita dalla tua immagine del profilo (<img class="gp-icon" src="/images/Christophe.jpg" alt="" style="border-radius:50%"> — quella di Christophe stesso, mostrata qui come esempio; la tua sarà la tua vera foto dell'account Google) accanto a una piccola icona di disconnessione (<img class="gp-icon" src="/images/solar_linear/square-bottom-down-svgrepo-com.svg" alt="">).

</div>

<div class="ga-feature">

<img class="ga-icon" src="/images/solar_linear/radio-minimalistic-svgrepo-com.svg" alt="">

### Aggiornamenti delle partite in diretta

La pagina della partita in diretta mostra in tempo reale gli eventi, le statistiche e le formazioni delle partite dei Mondiali 2026 — disponibile per tutti, con o senza accesso effettuato. Utilizza la stessa connessione al server descritta sopra, quindi il suo stato segue i quattro stati sopra indicati: in diretta e aggiornata quando tutto funziona, in pausa con la stessa icona di avviso ogni volta che il server è irraggiungibile o sei offline.

Una volta connesso, quel badge riflette anche uno stato di tracciamento più preciso:

- **live** *(verde)* — una partita è monitorata; eventi, statistiche e formazioni si aggiornano in tempo reale.
- **in ascolto** *(blu)* — il server è in attesa di partite, ma nessuna è attiva al momento.
- **Il server non vede, non sente, non parla** *(grigio)* — il server non sta monitorando nessuna partita al momento. Clicca sul badge per un link WhatsApp e chiedi a Christophe di riattivarlo.

</div>
<!-- /i18n:auth_after_connect -->
