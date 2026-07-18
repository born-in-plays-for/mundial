<!-- i18n:auth_page_title -->
# Conexión con el servidor
<!-- /i18n:auth_page_title -->

<!-- i18n:auth_intro -->
Esta aplicación se comunica con un pequeño servidor backend — que se ejecuta en el propio ordenador del desarrollador — para el inicio de sesión, las actualizaciones de partidos en directo y para recordar tu sesión entre visitas. Esa conexión puede estar en uno de estos cuatro estados, del mejor al peor. El que aparece marcado abajo es lo que está ocurriendo ahora mismo.
<!-- /i18n:auth_intro -->

<div class="ga-state" data-ga-state="online">

<!-- i18n:auth_state_online -->
## Conectado

Todo funciona: puedes iniciar sesión, la página del partido en directo se actualiza en tiempo real y tu sesión se recuerda en tu próxima visita. El icono de la esquina superior derecha muestra tu foto de perfil, o un simple botón de inicio de sesión si no has iniciado sesión — sin icono de advertencia.
<!-- /i18n:auth_state_online -->

</div>

<div class="ga-state" data-ga-state="connection">

<!-- i18n:auth_state_connection -->
## Servidor inaccesible

Tu conexión a internet funciona bien, pero el propio servidor backend no responde — puede que esté apagado, o que se haya cortado su conexión a internet. El inicio de sesión, tu sesión y la página del partido en directo están en pausa; el mapa, la clasificación de países, la lista de jugadores y todos los filtros/ordenaciones descritos en la otra guía siguen funcionando con normalidad, ya que nada de eso necesita el servidor.

Toca el icono de advertencia para obtener un enlace de WhatsApp — escribe a ese número y el servidor normalmente puede reiniciarse en unos minutos. No hace falta recargar la página: la aplicación reintenta la conexión en segundo plano y se recupera por sí sola en cuanto el servidor vuelve a responder.
<!-- /i18n:auth_state_connection -->

</div>

<div class="ga-state" data-ga-state="server">

<!-- i18n:auth_state_server -->
## Servidor no configurado

Un caso más raro: la aplicación ni siquiera tiene una dirección del servidor que probar. Se trata de un contratiempo de despliegue más que de una caída en directo, por lo que no hay un acceso directo a WhatsApp para este caso — necesita una corrección en el código en lugar de simplemente reiniciar algo. El efecto práctico es el mismo que "servidor inaccesible" arriba: el inicio de sesión y la página del partido en directo están en pausa, todo lo demás funciona con normalidad.
<!-- /i18n:auth_state_server -->

</div>

<div class="ga-state" data-ga-state="offline">

<!-- i18n:auth_state_offline -->
## Sin conexión a internet

Nada de lo que necesita la red funciona en este momento — no solo el inicio de sesión, sino también la obtención de nuevos datos, las actualizaciones en directo o incluso la recarga de esta guía. Vuelve a conectar tu dispositivo y la aplicación se recupera automáticamente, sin necesidad de recargar.
<!-- /i18n:auth_state_offline -->

</div>
