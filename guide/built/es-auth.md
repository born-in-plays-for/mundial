<!-- i18n:auth_page_title -->
# Conexión con el servidor
<!-- /i18n:auth_page_title -->

<!-- i18n:auth_intro -->
Esta aplicación se comunica con un pequeño servidor backend — que se ejecuta en el propio ordenador del desarrollador — para el inicio de sesión, las actualizaciones de partidos en directo y para recordar tu sesión entre visitas. Esa conexión puede estar en uno de estos cuatro estados, del mejor al peor. El que aparece marcado abajo es lo que está ocurriendo ahora mismo.
<!-- /i18n:auth_intro -->

<div class="ga-state" data-ga-state="online">

<!-- i18n:auth_state_online -->
<img class="ga-icon" src="/images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">

## Conectado

Todo funciona: puedes iniciar sesión, la página del partido en directo se actualiza en tiempo real y tu sesión se recuerda en tu próxima visita. El icono de la esquina superior derecha muestra tu foto de perfil, o un simple botón de inicio de sesión si no has iniciado sesión — sin icono de advertencia.
<!-- /i18n:auth_state_online -->

</div>

<div class="ga-state" data-ga-state="connection">

<!-- i18n:auth_state_connection -->
<img class="ga-icon" src="/images/database-error-svgrepo-com.svg" alt="">

## Servidor inaccesible

Tu conexión a internet funciona bien, pero el propio servidor backend no responde — puede que esté apagado, o que se haya cortado su conexión a internet. El inicio de sesión, tu sesión y la página del partido en directo están en pausa; el mapa, la clasificación de países, la lista de jugadores y todos los filtros/ordenaciones descritos en la otra guía siguen funcionando con normalidad, ya que nada de eso necesita el servidor.

Toca el icono de advertencia para obtener un enlace de WhatsApp — escribe a ese número y el servidor normalmente puede reiniciarse en unos minutos. No hace falta recargar la página: la aplicación reintenta la conexión en segundo plano y se recupera por sí sola en cuanto el servidor vuelve a responder.
<!-- /i18n:auth_state_connection -->

</div>

<div class="ga-state" data-ga-state="server">

<!-- i18n:auth_state_server -->
<img class="ga-icon" src="/images/settings-off-svgrepo-com.svg" alt="">

## Servidor no configurado

Un caso más raro: la aplicación ni siquiera tiene una dirección del servidor que probar. Se trata de un contratiempo de despliegue más que de una caída en directo, por lo que no hay un acceso directo a WhatsApp para este caso — necesita una corrección en el código en lugar de simplemente reiniciar algo. El efecto práctico es el mismo que "servidor inaccesible" arriba: el inicio de sesión y la página del partido en directo están en pausa, todo lo demás funciona con normalidad.
<!-- /i18n:auth_state_server -->

</div>

<div class="ga-state" data-ga-state="offline">

<!-- i18n:auth_state_offline -->
<img class="ga-icon" src="/images/wifi-off-svgrepo-com.svg" alt="">

## Sin conexión a internet

Nada de lo que necesita la red funciona en este momento — no solo el inicio de sesión, sino también la obtención de nuevos datos, las actualizaciones en directo o incluso la recarga de esta guía. Vuelve a conectar tu dispositivo y la aplicación se recupera automáticamente, sin necesidad de recargar.
<!-- /i18n:auth_state_offline -->

</div>

<!-- i18n:auth_after_connect -->
# Una vez conectado

<div class="ga-feature">

<img class="ga-icon" src="/images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">

### Inicio de sesión con Google

Por ahora, iniciar sesión importa sobre todo para el propio Christophe — la única cuenta de administrador del sitio. Con la sesión iniciada como administrador, la foto de perfil de la barra de navegación enlaza con la página de gestión de usuarios y sesiones del servidor, y la página del partido en directo muestra un icono de configuración adicional que lleva a los controles de partidos y descubrimiento.

Para todos los demás, iniciar sesión por ahora solo recuerda quién eres entre visitas — no hay ninguna función exclusiva de administrador que te estés perdiendo. Más adelante podrían llegar otras funciones exclusivas para los visitantes con sesión iniciada.

En la propia barra de navegación: antes de iniciar sesión, solo verás el icono de inicio de sesión (<img class="gp-icon" src="/images/solar_linear/square-bottom-up-svgrepo-com.svg" alt="">). Después de iniciar sesión, se sustituye por tu foto de perfil (<img class="gp-icon" src="/images/Christophe.jpg" alt="" style="border-radius:50%"> — la del propio Christophe, mostrada aquí como ejemplo; la tuya será tu foto real de la cuenta de Google) junto a un pequeño icono de cierre de sesión (<img class="gp-icon" src="/images/solar_linear/square-bottom-down-svgrepo-com.svg" alt="">).

</div>

<div class="ga-feature">

<img class="ga-icon" src="/images/solar_linear/radio-minimalistic-svgrepo-com.svg" alt="">

### Actualizaciones de partidos en directo

La página del partido en directo muestra en tiempo real los eventos, estadísticas y alineaciones de los partidos del Mundial 2026 — disponible para todos, con o sin sesión iniciada. Utiliza la misma conexión al servidor descrita arriba, así que su propio estado sigue los cuatro estados anteriores: en directo y actualizada cuando todo funciona, en pausa con el mismo icono de advertencia siempre que el servidor sea inaccesible o estés sin conexión.

Una vez conectado, esa insignia también refleja un estado de seguimiento más preciso:

- **live** *(verde)* — se está siguiendo un partido; los eventos, estadísticas y alineaciones se actualizan en tiempo real.
- **escuchando** *(azul)* — el servidor está a la espera de partidos, pero ninguno está activo en este momento.
- **El servidor no ve, no oye, no habla** *(gris)* — el servidor no está siguiendo ningún partido en este momento. Haz clic en la insignia para obtener un enlace de WhatsApp y pedirle a Christophe que lo reactive.

</div>
<!-- /i18n:auth_after_connect -->
