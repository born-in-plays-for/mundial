<!-- i18n:auth_page_title -->
# Connessione al server
<!-- /i18n:auth_page_title -->

<!-- i18n:auth_intro -->
Questa app comunica con un piccolo server backend — in esecuzione sul computer dello sviluppatore — per l'accesso, gli aggiornamenti delle partite in diretta e la memorizzazione della sessione tra una visita e l'altra. Questa connessione può trovarsi in uno di quattro stati, dal migliore al peggiore. Quello indicato qui sotto è ciò che sta accadendo in questo momento.
<!-- /i18n:auth_intro -->

<div class="ga-state" data-ga-state="online">

<!-- i18n:auth_state_online -->
## Connesso

Tutto funziona: puoi accedere, la pagina della partita in diretta si aggiorna in tempo reale e la tua sessione viene ricordata alla prossima visita. L'icona in alto a destra mostra la tua immagine del profilo, oppure un semplice pulsante di accesso se non hai effettuato l'accesso — nessuna icona di avviso.
<!-- /i18n:auth_state_online -->

</div>

<div class="ga-state" data-ga-state="connection">

<!-- i18n:auth_state_connection -->
## Server irraggiungibile

La tua connessione internet funziona, ma il server backend stesso non risponde — potrebbe essere spento, oppure la sua connessione a internet potrebbe essersi interrotta. L'accesso, la tua sessione e la pagina della partita in diretta sono in pausa; la mappa, la classifica dei paesi, l'elenco dei giocatori e tutti i filtri/ordinamenti descritti nell'altra guida continuano a funzionare normalmente, poiché nulla di tutto ciò richiede il server.

Tocca l'icona di avviso per un link WhatsApp — scrivi a quel numero e il server può solitamente essere riavviato in pochi minuti. Non è necessario ricaricare la pagina: l'app riprova automaticamente in background e si ristabilisce da sola non appena il server torna a rispondere.
<!-- /i18n:auth_state_connection -->

</div>

<div class="ga-state" data-ga-state="server">

<!-- i18n:auth_state_server -->
## Server non configurato

Un caso più raro: l'app non ha nemmeno un indirizzo del server da provare. Si tratta di un intoppo di distribuzione piuttosto che di un'interruzione in corso, quindi non c'è alcuna scorciatoia WhatsApp per questo caso — serve una correzione lato codice piuttosto che un semplice riavvio. L'effetto pratico è lo stesso di "server irraggiungibile" sopra: l'accesso e la pagina della partita in diretta sono in pausa, tutto il resto funziona normalmente.
<!-- /i18n:auth_state_server -->

</div>

<div class="ga-state" data-ga-state="offline">

<!-- i18n:auth_state_offline -->
## Nessuna connessione internet

Nulla di ciò che richiede la rete funziona in questo momento — non solo l'accesso, ma anche il recupero di nuovi dati, gli aggiornamenti in diretta o persino il ricaricamento di questa guida. Riconnetti il tuo dispositivo e l'app si ristabilisce automaticamente, senza bisogno di ricaricare.
<!-- /i18n:auth_state_offline -->

</div>
