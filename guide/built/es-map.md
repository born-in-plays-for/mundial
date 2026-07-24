<!-- i18n:page_title -->
# Guía del usuario
<!-- /i18n:page_title -->

<!-- i18n:intro -->
Este mapa visualiza las convocatorias del Mundial 2026 desde la perspectiva del lugar de nacimiento.
Cada país se colorea según su balance neto de talento — ver *La leyenda*, abajo —
que compara a los jugadores nacidos allí con los jugadores que juegan allí.
<!-- /i18n:intro -->

<!-- i18n:quotes -->
## Las citas

El encabezado muestra un carrusel rotativo de 15 famosas citas literarias —
de François Villon (1461) a Simone de Beauvoir (1949) — cada una convertida con humor
en una frase futbolística.

Navega entre las citas usando los chevrones orientados hacia la izquierda, o desliza hacia la derecha en pantallas táctiles.
Mantén presionado (o mantén el botón del ratón pulsado) sobre una cita para revelar la línea original; suelta para volver.

Deslizar hacia la izquierda, en cambio, revela un panel completamente distinto — el panel de control,
que rige cómo se filtran, ordenan y muestran los países.
<!-- /i18n:quotes -->

<!-- i18n:control_sidebar -->
# El panel de control

El botón <kbd style="background:var(--bg-hover,#f0ede8);border:1px solid var(--border,#e4e0d8);color:var(--text-muted,#999);border-radius:0 4px 4px 0">‹</kbd> en la esquina superior derecha de la ventana abre el panel de control, que determina qué aparece en el mapa y en la lista de países.

![Panel de control](screenshots/control_sidebar-es.png)

El panel tiene cinco partes: una **barra de herramientas** arriba; **Ordenar** y **Ver** a la izquierda; la matriz de **Filtrar** a la derecha; y una **barra de información** abajo.

## Barra de herramientas

- <kbd style="font-size:.68em;font-family:var(--bs-font-monospace,ui-monospace,monospace);background:var(--bg-hover,#f0ede8);border:1px solid var(--border,#e4e0d8);color:#1C274C;border-radius:3px;padding:2px 4px;vertical-align:middle">ESC</kbd> vuelve a colapsar el panel a su botón ‹.
- <img class="gp-icon" src="images/solar_linear/widget-5-svgrepo-com.svg" alt="confederación"> filtra la lista a una sola confederación FIFA — ver *Filtro por confederación FIFA*, abajo.
- <img class="gp-icon" src="images/solar_linear/share-svgrepo-com.svg" alt="compartir"> y <img class="gp-icon" src="images/solar_linear/question-circle-svgrepo-com.svg" alt="parámetros"> forman un par: **compartir** copia al portapapeles una URL que reproduce la configuración exacta y actual del panel, lista para pegar en otro dispositivo o enviar a alguien; **parámetros** abre un resumen en lenguaje claro de esos mismos ajustes actuales — orden, filtros, fase, y más — el mismo panel que `?explain` abre en cada carga de página (ver *Parámetros de URL*, abajo).

## Ordenar

Cuatro criterios reordenables — **la clasificación Elo** (una puntuación independiente que cambia después de cada partido según el resultado y la fuerza del rival — ver la pestaña [Fuentes de datos](?guide=data) para el detalle exacto), **población**, **Δ** (delta juega-por menos nacido-en), **A–Z** — más un botón de dirección (↓↑) para invertir ascendente/descendente. Solo los dos criterios superiores están realmente activos; al hacer clic en un criterio se mueve a la primera posición.

## Ver

Dos filas independientes de píldoras seleccionables, debajo de ordenar:

- **Export / nativo / import**: qué rol le dio a un jugador su lugar en la tabla — nacido aquí y seleccionado en otro lugar; nacido y seleccionado aquí; nacido en otro lugar y seleccionado aquí.
- **Jugador / entrenador**: qué tipo de persona se muestra.

Cada casilla está marcada por defecto (mostrando a todos); desmarque una para ocultar ese grupo. Actualmente solo activo dentro de *La tabla de jugadores*, más abajo — las casillas se muestran pero permanecen desactivadas en otros lugares, por ahora.

## Filtrar

La matriz cruza dos **columnas** (exportador / no exportador) con cuatro **filas** en dos grupos:

- **Clasificados** — divididos según si el país importa jugadores o no
- **No clasificados** — divididos por pertenencia a la FIFA

Desactiva una celda para ocultar esa categoría. Haz clic en un encabezado de fila o columna para alternar todo el grupo a la vez.

## Barra de información

Muestra, a la izquierda, cuántos jugadores y seleccionadores hay actualmente en la tabla de jugadores (véase *La tabla de jugadores*, más abajo) — siempre actualizada, sin importar qué pestaña esté realmente abierta; y a la derecha, cuántos países son visibles actualmente del total.

## Filtro por confederación FIFA

El botón <img class="gp-icon" src="images/solar_linear/widget-5-svgrepo-com.svg" alt="confederación"> junto a la fila **FIFA** abre un menú desplegable para filtrar la lista a una sola confederación. Los países no FIFA no se ven afectados — permanecen visibles u ocultos según el resto de la matriz de filtros.

Seleccionar una confederación también resalta su frontera exterior en el mapa y hace zoom sobre ella. Selecciona **Todas las confederaciones FIFA** para quitar el filtro.

## Parámetros de URL

El estado de filtro y orden también puede configurarse directamente mediante la URL — `?sort=`, `?dir=`, `?stage=`, `?show=`, `?fifaconf=`, `?pshow=`, además de `?bottomtab=` y `?select=` para ir directamente a una pestaña con un país ya seleccionado. Añade `?explain` a cualquier URL para abrir un panel que resume los ajustes actuales del panel — ver *«?explain» — inspeccionar la configuración actual* en la pestaña [Guía de la API](?guide=api) para el detalle exacto de qué muestra y por qué. La referencia completa con todos los códigos de celda, alias de grupo y ejemplos también está allí.

## Sobre la referencia de países

El mapa y la lista usan [eloratings.net](https://www.eloratings.net/) como fuente de países — no la lista de miembros de la FIFA. Esto significa que la lista incluye territorios sin ninguna membresía FIFA, como Groenlandia.

También incluye las cuatro naciones constituyentes del Reino Unido — Inglaterra, Escocia, Gales, Irlanda del Norte — como cuatro entradas separadas en lugar de un único «Reino Unido», por una razón distinta: a diferencia de Groenlandia, *sí* son miembros de la FIFA, cada una por derecho propio. Lo inusual en ellas es ser entidades subnacionales con membresía FIFA (y Elo) individual, no una ausencia en ninguna de las dos listas.

El orden por defecto es por puntuación Elo; otros criterios de orden están disponibles en la columna de orden.
<!-- /i18n:control_sidebar -->

<!-- i18n:tax_heading -->
## Categorías de países
<!-- /i18n:tax_heading -->

<!-- i18n:tax_intro -->
Cada país se muestra como una **pastilla** cuyo estilo CSS codifica su categoría de un vistazo.
<!-- /i18n:tax_intro -->

<div class="taxonomy" style="display:flex;flex-direction:column;gap:16px;margin:1rem 0">

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_qualified -->
Clasificado vs. no clasificado
<!-- /i18n:tax_label_qualified --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cz.svg" alt="">
    <span class="elo-name" data-id="203">Czech Republic</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_yes -->
Borde sólido — clasificado y aún en el torneo.
<!-- /i18n:tax_desc_border_yes --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--knocked-out" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ir.svg" alt="">
    <span class="elo-name" data-id="364">Iran</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_dashed -->
Borde discontinuo — clasificado pero eliminado.
<!-- /i18n:tax_desc_border_dashed --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/ua.svg" alt="">
    <span class="elo-name" data-id="804">Ukraine</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_border_no -->
Sin borde — no clasificado.
<!-- /i18n:tax_desc_border_no --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_fifa -->
FIFA vs. no-FIFA
<!-- /i18n:tax_label_fifa --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/is.svg" alt="">
    <span class="elo-name" data-id="352">Iceland</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_text_dark -->
Texto oscuro — miembro de la FIFA.
<!-- /i18n:tax_desc_text_dark --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/gl.svg" alt="">
    <span class="elo-name" data-id="304">Greenland</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_text_light -->
Texto claro y en cursiva — no miembro de la FIFA.
<!-- /i18n:tax_desc_text_light --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:6px;color:#555"><!-- i18n:tax_label_born -->
Nacido aquí / juega para
<!-- /i18n:tax_label_born --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--exp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/it.svg" alt="">
    <span class="elo-name" data-id="380">Italy</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#1d4ed8">▶</span> <!-- i18n:tax_desc_exp -->
Jugadores nacidos en este país juegan para otro país clasificado.
<!-- /i18n:tax_desc_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#dc2626">◀</span> <!-- i18n:tax_desc_imp -->
Jugadores nacidos en otro país juegan para este país.
<!-- /i18n:tax_desc_imp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
  </span>
  <span style="font-size:.875rem"><span style="color:#dc2626">◀</span><span style="color:#1d4ed8">▶</span> <!-- i18n:tax_desc_both -->
Jugadores nacidos en otro país juegan para este país, y jugadores nacidos aquí juegan para otros países.
<!-- /i18n:tax_desc_both --></span>
</div>
<div style="font-size:.8rem;color:#777;margin:6px 0"><!-- i18n:tax_note_gradient -->
El fondo de la píldora es a su vez un degradado rojo (importaciones) → blanco (nativos) → azul (exportaciones) — cuanto más ancha la banda de un color, mayor la proporción de ese grupo en la plantilla total del país.
<!-- /i18n:tax_note_gradient --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="--exp-color: rgb(59,130,246); --imp-color: rgb(248,173,173); --imp-pivot: 2.8%; --native-pivot: 25.0%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/fr.svg" alt="">
    <span class="elo-name" data-id="250">France</span>
    <span class="elo-pts"><span class="elo-pts-primary">3 · 81</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_exp -->
Predominantemente azul — un gran exportador (81) con solo un puñado de importaciones (3).
<!-- /i18n:tax_desc_gradient_exp --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--exp elo-item--imp" style="--exp-color: rgb(160,197,250); --imp-color: rgb(248,167,167); --imp-pivot: 18.4%; --native-pivot: 86.4%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/us.svg" alt="">
    <span class="elo-name" data-id="840">United States</span>
    <span class="elo-pts"><span class="elo-pts-primary">7 · 11</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_mixed -->
Una banda roja visible junto al azul — una mezcla más equilibrada de exportaciones (11) e importaciones (7).
<!-- /i18n:tax_desc_gradient_mixed --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--qualified elo-item--knocked-out elo-item--imp" style="--imp-color: rgb(239,68,68); --imp-pivot: 96.3%; --native-pivot: 100.0%; flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/cw.svg" alt="">
    <span class="elo-name" data-id="531">Curaçao</span>
    <span class="elo-pts"><span class="elo-pts-primary">26</span></span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_gradient_imp -->
Casi enteramente rojo — casi toda la plantilla (26) nació en otro lugar.
<!-- /i18n:tax_desc_gradient_imp --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555"><!-- i18n:tax_label_offmap -->
Fuera del mapa
<!-- /i18n:tax_label_offmap --></div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px"><!-- i18n:tax_note_offmap -->
Ortogonal a las categorías anteriores.
<!-- /i18n:tax_note_offmap --></div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/sg.svg" alt="">
    <span class="elo-name" data-id="702">Singapore</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_nomap -->
Bandera atenuada — ausente de los datos geográficos que usa el mapa (normalmente porque el territorio es demasiado pequeño).
<!-- /i18n:tax_desc_nomap --></span>
</div>
<div style="display:flex;align-items:center;gap:12px">
  <span class="elo-item elo-item--nonfifa elo-item--no-map" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/mc.svg" alt="">
    <span class="elo-name" data-id="492">Monaco</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_nomap_nonfifa -->
Ídem, aquí combinado con no-FIFA.
<!-- /i18n:tax_desc_nomap_nonfifa --></span>
</div>
</div>

<div>
<div style="font-size:.8rem;font-weight:600;margin-bottom:2px;color:#555"><!-- i18n:tax_label_fixture -->
Enfrentamientos (vista de partidos)
<!-- /i18n:tax_label_fixture --></div>
<div style="font-size:.8rem;color:#777;margin-bottom:6px"><!-- i18n:tax_note_fixture -->
Visible solo en la vista de partidos — ver Vista equipos / partidos, arriba.
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
Marca verde en la píldora — ganó un partido decidido.
<!-- /i18n:tax_desc_won --></span>
</div>
<div style="display:flex;align-items:center;gap:12px;margin-bottom:4px">
  <span class="elo-item elo-item--qualified elo-item--lost" style="flex-shrink:0">
    <img class="elo-flag" src="https://cdn.jsdelivr.net/npm/circle-flags@2/flags/br.svg" alt="">
    <span class="elo-name" data-id="76">Brazil</span>
  </span>
  <span style="font-size:.875rem"><!-- i18n:tax_desc_lost -->
Bandera en escala de grises — perdió un partido decidido.
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
Borde ondulado — partido aún no jugado.
<!-- /i18n:tax_desc_pending --></span>
</div>
</div>

</div>

<!-- i18n:map -->
# El mapa

## Coropletas y banderas

Cada país se colorea según su balance neto de talento — contribución local (exportaciones más jugadores nativos) menos importaciones (ver *La leyenda*, abajo). Cuanto más marcado sea ese balance, en cualquier dirección, más oscuro el tono; un país cercano al equilibrio neutro aparece pálido. Los países sin datos para esa métrica aparecen en un tono claro neutro.
Los países actualmente incluidos en el filtro muestran un marcador de bandera circular.

![Banderas de los equipos clasificados](screenshots/qualified_flags.png)

## Zoom y desplazamiento

Desplázate (o pellizca) para hacer zoom · arrastra para desplazar la vista. Dos botones redondos se encuentran en la barra bajo el mapa, a la izquierda de la leyenda:

- <img class="gp-icon" src="images/solar_linear/global-svgrepo-com.svg" alt="restablecer"> aleja el zoom hasta la vista predeterminada — todos los países que el mapa realmente muestra, ajustados al encuadre. Un puñado de territorios pequeños no tiene ninguna presencia en el mapa y nunca se incluye; ver *Fuera del mapa*, arriba.
- <img class="gp-icon" src="images/solar_linear/maximize-square-2-svgrepo-com.svg" alt="ajustar"> hace zoom y desplaza la vista para encajar todo lo actualmente visible en el mapa — cada bandera mostrada por defecto, o solo el conjunto resaltado mientras hay un país seleccionado (o un enfoque de fase de grupos activo).

## La leyenda

El mapa colorea cada país según su balance neto de talento — contribución local (exportaciones más jugadores nativos) menos importaciones. Exportadores netos e importadores netos aparecen en dos colores distintos a cada lado de un punto neutro central.

La barra de color en la parte inferior de la cabecera se lee de izquierda a derecha como una recta numérica — extremo negativo, cero neutro en el centro, extremo positivo — con una marca de referencia en cada extremo y en el centro, además de una pequeña marca propia para cada país real, para que puedas ver dónde se agrupan realmente los países en lugar de suponer que el degradado uniforme significa una distribución homogénea. Un único punto independiente se sitúa más allá del extremo positivo para **Francia**, el mayor exportador neto — suficientemente fuera de escala (36 puntos por encima del siguiente país) como para merecer su propia marca en lugar de una marca más en la barra:

![Leyenda](screenshots/legend.png)

**Curaçao**, el mayor importador neto (toda su plantilla nació en los Países Bajos), se sitúa en cambio en el propio extremo negativo de la barra.

La leyenda también funciona como filtro: arrastra cualquiera de las dos asas — el pequeño indicador punteado en cada extremo de la barra — hacia dentro para acotar el rango visible. Todo lo que quede fuera del rango seleccionado desaparece de la lista de países, de las banderas del mapa y de la tabla de jugadores, igual que con cualquier otro filtro. Haz doble clic en cualquier parte de la leyenda para volver al rango completo.

## Información emergente

Pasa el ratón sobre un país para ver detalles. Las ventanas emergentes no se muestran en dispositivos móviles.

- **Países de nacimiento**: número de exportaciones y mejores jugadores, cada uno con su bandera de destino
- **Países clasificados que también reclutan**: una columna derecha añade el lado de las importaciones
- **Países de nacimiento no clasificados**: una insignia *no clasificado* sustituye al panel de la plantilla
<!-- /i18n:map -->

<!-- i18n:bottom_panel -->
# El panel inferior

El área desplazable bajo el mapa tiene tres pestañas.

## <img class="gp-icon" src="images/solar_linear/ranking-svgrepo-com.svg" alt=""> La lista de países

La pestaña por defecto lista cada país — clasificado o no — como una insignia tipo píldora, sin carrusel de torneo.
El panel de control determina qué insignias aparecen y en qué orden;
el orden por defecto es por [puntuación Elo mundial](https://www.eloratings.net/).

Haz clic en una insignia para seleccionar ese país y hacer zoom en el mapa sobre él.

Para países con vínculos **nacido aquí / juega por**, también aparecen flechas de colores en el mapa:

- {{ARROW_BLUE}} **flechas azules**: plantillas que incluyen jugadores nacidos en el país seleccionado
- {{ARROW_RED}} **flechas rojas**: países donde jugadores nacidos en otro lugar juegan para esta plantilla

*El grosor de la flecha varía según el número de jugadores.*

Los botones de zoom descritos en *Zoom y desplazamiento*, arriba, se comportan igual aquí: **ajustar** ahora encaja específicamente los países resaltados, **restablecer** vuelve a la vista predeterminada.

Haz clic de nuevo en la insignia activa, haz clic en otro lugar del mapa, o pulsa **Esc** para deseleccionar.

## <img class="gp-icon" src="images/world-cup-svgrepo-com.svg" alt=""> Torneo

La misma lista de insignias, esta vez limitada a los 48 países **clasificados**, con un pequeño carrusel encima que recorre siete posiciones: **Fase de grupos → Dieciseisavos de final → Octavos de final → Cuartos de final → Semifinales → Final → Campeón**.

- Usa las flechas ‹ › o desliza a izquierda/derecha en pantallas táctiles para cambiar de fase.
- Cada posición filtra los países clasificados a los que han "alcanzado" esa fase — todavía en el torneo al principio, o ya campeones.
- La navegación está limitada a la fase realmente alcanzada por el torneo; las posiciones posteriores permanecen bloqueadas hasta que se disputen los partidos correspondientes.

El carrusel es el único filtro que se aplica aquí: avanzarlo hasta, digamos, octavos de final muestra exactamente
los equipos que alcanzaron esa fase, independientemente de las casillas del panel de control o del filtro de
confederación — esos solo afectan a la pestaña Equipos predeterminada, que no tiene concepto de fase propio.
Los países no clasificados tampoco aparecen nunca en esta pestaña, sea cual sea el estado de sus propias casillas.

En la **fase de grupos**, la lista de insignias se sustituye por las clasificaciones de grupo — los 12 grupos (A–L) juntos por defecto, o reducidos a uno solo mediante el selector, con el resultado de cada partido y los equipos clasificados para los dieciseisavos resaltados según los resultados reales (un empate no otorga marca a ninguno de los dos).

Pasada la fase de grupos, los países se agrupan automáticamente por enfrentamiento: cada fila empareja a ambos rivales a los dos lados de la fecha/resultado —

- Aún no jugado: la fecha del partido, y un borde superior/inferior ondulado en ambas insignias — un aspecto "pendiente" para un partido que aún puede resolverse en cualquier dirección.
- Jugado: el resultado (más el resultado de penaltis, si se llegó a eso) en lugar de la fecha, y la bandera del equipo perdedor atenuada.

En la posición **Final**, los dos perdedores de semifinales forman su propia pareja — el partido por el tercer puesto — en una lista aparte y con su propio título debajo de la final real, para que los dos partidos nunca se mezclen.

Hacer clic en una insignia, las flechas y los botones de zoom se comportan todos igual aquí que en *La lista de países*, arriba.

## <img class="gp-icon" src="images/solar_linear/user-circle-svgrepo-com.svg" alt=""> La tabla de jugadores

Siempre la misma tabla plana — **nombre**, **nacido en**, **juega por**, **internacionalidades** — sin importar qué esté seleccionado. Haz clic en un encabezado de columna para ordenar por él; haz clic de nuevo para invertir el orden. Los nombres de los jugadores enlazan a su página de Wikipedia en el idioma de la interfaz actual, cuando está disponible.

Solo las filas cambian según la selección actual:

- **Nada seleccionado**: todos los jugadores y entrenadores de las 48 plantillas clasificadas actualmente visibles en el mapa.
- **Un país seleccionado**: todos los jugadores y entrenadores vinculados a él — nacidos allí, nacidos y convocados allí, o nacidos en otro lugar y convocados allí.
- **Un partido seleccionado**: los jugadores de ambos equipos combinados.

La fila **ver** del panel de control (véase arriba) reduce aún más estas filas mientras esta pestaña está abierta.

Sin selección, las ciudades de nacimiento también se representan en el mapa como burbujas — un punto por cada ciudad de nacimiento única entre los jugadores listados, más grande cuando más jugadores comparten una ciudad:

![Burbujas de ciudades de nacimiento](screenshots/bubbles.png)

Pasa el cursor sobre un punto para ver el nombre de la ciudad y los jugadores nacidos allí.

## <img class="gp-icon" src="images/wc2026.svg" alt=""> Cadenas

Secuencias de países vinculados por relaciones nacido-aquí / juega-por — un jugador nacido en A juega por B, un jugador nacido en B juega por C, y así sucesivamente, formando una cadena de nacionalidades a través del torneo — se exploran en su propia [página independiente](/chains/wc2026_chain_longest.html).
<!-- /i18n:bottom_panel -->
