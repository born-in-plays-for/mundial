<!-- i18n:api_page_title -->
# Guía de la API
<!-- /i18n:api_page_title -->

<!-- i18n:api_intro -->
Referencia técnica de la API de parámetros de URL de la app — cómo enlazar directamente a una configuración concreta de filtro/orden en la página Mapa.
<!-- /i18n:api_intro -->

<!-- i18n:api_url_params -->
## Parámetros de URL

La barra lateral de filtro/orden de la página Mapa (`js/control_sidebar.js`) lee toda su configuración a partir de un puñado de parámetros de URL: `?explain`, `?sort=`, `?dir=`, `?stage=`, `?fifaconf=`, `?show=`. Todos son opcionales e independientes; un parámetro omitido simplemente conserva el valor predeterminado del panel para ese ajuste.

### `?explain` — inspeccionar la configuración actual

El botón `?` de la barra de herramientas del filtro abre un panel que describe los **ajustes actuales** del panel — orden, dirección, fase, celdas de filtro, confederación — en lenguaje claro, junto con un recuento de países visibles. Añade `?explain` a cualquier URL para que se abra automáticamente al cargar.

Este panel describe el panel en vivo, no la URL: tiene exactamente el mismo aspecto tanto si un ajuste vino de un parámetro de URL, de una sesión restaurada, o de un simple clic en el panel. No hay forma de saber, desde el propio panel, cuál de los tres ocurrió — es intencionado, ya que lo que importa es lo que se muestra en pantalla ahora mismo. Ciérralo haciendo clic de nuevo en `?`, en `×`, o pulsando Esc.

Siempre que una URL lleve algún parámetro del panel, esos mismos ajustes actuales también se registran en la consola del navegador, independientemente de `?explain`.

```
?stage=r16&show=QB&explain    → abre el panel al cargar, permanece abierto para revisión
```

### `?sort` — criterio de ordenación

```
?sort=elo              ranking Elo mundial (predeterminado)
?sort=alpha            A–Z por nombre de país
?sort=pop              población
?sort=delta            juega-para menos nacido-en
?sort=elo+alpha        primario: Elo, secundario: A–Z
?sort=pop+delta+alpha  hasta 4 claves; solo las dos primeras son efectivas para ordenar
```

`+` separa las claves (`,` también se acepta). Las claves especificadas van primero, en el orden dado; las claves no especificadas rellenan las posiciones restantes del panel. Se combina con `?dir`.

### `?dir` — dirección de ordenación

```
?dir=desc    descendente (predeterminado)
?dir=asc     ascendente
```

Se aplica solo a la clave de ordenación primaria. `?sort=alpha&dir=desc` da Z–A.

### `?stage` — filtro por fase del torneo

```
?stage=group       predeterminado — todos los países clasificados y sus exportadores
?stage=r32         Dieciseisavos de final
?stage=r16         Octavos de final
?stage=qf          Cuartos de final
?stage=sf          Semifinales
?stage=final       Final
?stage=winner      Solo el campeón
```

Refleja el carrusel de fases del panel de filtro (Fase de grupos → Dieciseisavos de final → Octavos de final → Cuartos de final → Semifinales → Final → Campeón).

**Solo filtra la lista mientras la pestaña Torneo está activa.** Allí es el único filtro: los países clasificados se reducen a los que "alcanzaron" esa fase — todavía en juego al entrar en ella, o habiéndola ya ganado — y cualquier país no clasificado queda oculto sin excepción, sin importar `?show`/`?fifaconf`. En la lista de países (la pestaña predeterminada), `?stage` sigue moviendo el carrusel a su posición para el próximo cambio de pestaña, pero no tiene efecto de filtrado allí — es `?show` lo que filtra en esa pestaña. Ver "Alcance por pestaña" más abajo.

Los valores desconocidos se ignoran silenciosamente y se mantienen los valores predeterminados.

### `?fifaconf` — filtro por confederación FIFA

```
?fifaconf=uefa       UEFA — Europa
?fifaconf=afc        AFC — Asia
?fifaconf=caf        CAF — África
?fifaconf=conmebol   CONMEBOL — América del Sur
?fifaconf=concacaf   CONCACAF — América del Norte y Central
?fifaconf=ofc        OFC — Oceanía
```

Filtra la lista a los miembros FIFA de la confederación indicada únicamente — en la lista de países; en la pestaña Torneo este filtrado de lista se omite por completo, igual que `?show` (ver "Alcance por pestaña" más abajo). Los países no FIFA no se ven afectados por el filtro en sí — permanecen visibles u ocultos según `?show`. Resaltar el límite de la confederación y hacer zoom sobre ella ocurre sin importar qué pestaña esté activa.

Los valores desconocidos se ignoran silenciosamente y se mantienen los valores predeterminados.

### `?show` — lista blanca de filtro

```
?show=<token>[,<token>...]
```

Códigos de celda y/o alias de grupo separados por comas. Cuando `show` está presente, **reemplaza** los valores predeterminados por completo — cualquier celda no listada queda desmarcada. Cuando está ausente, se aplican los valores predeterminados.

Solo filtra la lista en la lista de países — en la pestaña Torneo, `?stage` es el único filtro y `?show` se ignora por completo; ver "Alcance por pestaña" más abajo.

## Códigos de celda

La matriz de filtro refleja la disposición del panel — dos columnas (exportador / conserva a sus jugadores) cruzadas con cuatro grupos de filas. Cada código tiene exactamente **2 letras**: la posición 1 elige el alcance de la fila, la posición 2 elige la columna.

|  | **exportador (`E`)** | **conserva a sus jugadores (`K`)** |
|---|:---:|:---:|
| **clasificado · importa (`I`)** | `IE`&nbsp;&nbsp;✓  | `IK`&nbsp;&nbsp;✓ |
| **clasificado · local, sin importaciones (`H`)** | `HE`&nbsp;&nbsp;✓ | `HK`&nbsp;&nbsp;✓ |
| **no clasificado · FIFA (`F`)** | `FE`&nbsp;&nbsp;○ | `FK`&nbsp;&nbsp;○ |
| **no clasificado · no-FIFA (`N`)** | `NE`&nbsp;&nbsp;○ | `NK`&nbsp;&nbsp;○ |

✓ activado por defecto · ○ desactivado por defecto

Nemotécnicos de letras — posición 1 (alcance de la fila):

- `I` — clasificado, tiene **I**mportaciones
- `H` — clasificado, local (**H**omegrown — plantilla nacida allí por completo, sin importaciones)
- `Q` — todos los **Q**ualificados (ambas filas)
- `F` — miembro **F**IFA, no clasificado
- `N` — **N**o-FIFA
- `U` — todos los no clasificados (**U**nqualified, ambas filas)
- `A` — **A**bsolutamente todo (todas las filas)

Posición 2 (alcance de la columna):

- `E` — **E**xportadores
- `K` — **K**eeps its players — conserva a sus jugadores (no exportadores)
- `B` — ambas columnas (**B**oth)

Cada uno de estos códigos de 2 letras también funciona como atajo de teclado en el panel — ver "Atajo de teclado" más abajo.

### Una nota sobre terminología

El planteamiento oficial de este proyecto es **Nacido en / Juega para**: un jugador *nace en* un país y *juega para* otro. En la matriz de filtro, la misma relación se expresa desde el punto de vista del país como **importaciones / exportaciones**: un país *exporta* un jugador cuando alguien nacido allí juega para otra selección; *importa* un jugador cuando alguien nacido en otro lugar juega para su selección. Los dos planteamientos son intercambiables:

- "Francia exporta 17 jugadores" = "17 jugadores nacidos en Francia juegan para la selección de otro país."
- "Marruecos importa 4 jugadores" = "4 jugadores nacidos fuera de Marruecos juegan para la selección marroquí."
- "Un país `IE` importa y exporta a la vez" = "una selección clasificada que incluye jugadores nacidos en el extranjero *y* tiene jugadores nacidos allí que representan a otras naciones."

## Alias de grupo

| Alias  | Se expande a        | Significado                              |
|--------|--------------------|--------------------------------------|
| `QB`   | `IE,IK,HE,HK`     | Todas las filas clasificadas                   |
| `UB`   | `FE,NE,FK,NK`     | Todas las filas no clasificadas               |
| `AE`   | `IE,HE,FE,NE`     | Columna exportadora                      |
| `AK`   | `IK,HK,FK,NK`     | Columna "conserva a sus jugadores"             |
| `IB`   | `IE,IK`           | Filas importadoras (con o sin exportaciones) |
| `HB`   | `HE,HK`           | Filas locales (clasificadas, sin importaciones) |
| `FB`   | `FE,FK`           | Filas miembros FIFA (no clasificadas)     |
| `NB`   | `NE,NK`           | Filas no-FIFA                        |
| `AB`   | los 8 códigos        | Todas las celdas (incluidas `FK` y `NK`) |

Los alias y los códigos individuales pueden combinarse libremente; el resultado es una unión. Los tokens desconocidos se ignoran silenciosamente — si todos los tokens no son reconocidos, el parámetro se ignora por completo y se mantienen los valores predeterminados.

## Alcance por pestaña — `?stage`, `?show` y `?fifaconf` no se combinan todos

Estos tres no se apilan en un único filtro combinado — cada una de las dos pestañas de la página Mapa lee solo uno de ellos para el filtrado real de la lista:

- **La lista de países** (la pestaña predeterminada): `?show` y `?fifaconf` filtran juntos como de costumbre; `?stage` solo aparca el carrusel para más tarde — sin efecto de filtrado todavía.
- **Pestaña Torneo**: `?stage` es el único filtro — los países clasificados se reducen a los que alcanzaron esa fase, cualquier país no clasificado queda oculto sin excepción; `?show` y `?fifaconf` se ignoran ambos.

Qué pestaña está activa al cargar la página proviene de tu última visita (`localStorage`), o de la lista de países si no hay una preferencia guardada — nunca de la propia URL. Un enlace que combine `?stage=r16&show=QB`, por ejemplo, preconfigura ambos valores, pero solo una de las dos mitades filtra realmente algo, según en qué pestaña aterrices.

## Atajo de teclado

Cada código de celda y alias de arriba también funciona como atajo de teclado dentro del panel de filtro: pulsa **`v`** o **`x`**, luego escribe el código de 2 letras. `v` **muestra** (marca) las celdas indicadas; `x` las **oculta** (desmarca) — las celdas fuera del alcance del código nunca se tocan. Dos prefijos con un estado de destino fijo, en lugar de un único prefijo que alterna, porque un atajo de teclado no puede ver el estado de las casillas que está a punto de cambiar, a diferencia de un clic del ratón sobre la casilla visible — el mismo atajo mostraría u ocultaría según lo que ya estuviera marcado. `v`/`x` retoman la mnemotecnia de copiar-pegar (pegar = insertar / cortar = quitar) en lugar de deletrear "mostrar"/"ocultar". Sin tecla modificadora — los atajos basados en Ctrl/Cmd corren el riesgo de terminar en `Cmd-Q` (cierra todo el navegador en macOS) si se teclea mal, así que aquí se usa un prefijo simple en su lugar, el mismo patrón que usa GitHub para su propia navegación `g` `i`. Solo se activa cuando el foco no está en un campo de texto.

Como cada código tiene exactamente 2 letras, el atajo siempre se resuelve en cuanto se escribe la segunda letra — sin espera, sin ambigüedad entre, por ejemplo, `IE` y un código más largo que empiece igual (no lo hay).

```
v I E    muestra la celda IE (clasificado, importaciones, exportaciones)
x I E    oculta la celda IE
v Q B    muestra todas las filas clasificadas
x A B    oculta todo
```

Encadenar dos atajos permite alcanzar un estado exacto sin importar el estado inicial — por ejemplo, "solo `FK`, sea cual sea el estado de partida" se logra con `x A B` (ocultar todo) seguido de `v F K` (mostrar solo `FK`).

`Esc` en cualquier momento durante un atajo lo cancela; un atajo inactivo también se reinicia automáticamente tras ~1,5s.

## Ejemplos

```
?show=QB                        Lista de países: los 48 países clasificados; no clasificados ocultos.
?show=QB&sort=pop&dir=asc       Lista de países: países clasificados ordenados por población ascendente.
?show=IE                        Lista de países: solo países que importan y exportan jugadores.
?sort=delta&dir=asc&show=QB     Lista de países: países clasificados con menor diferencia juega-para/nacido-en primero.
?show=AB                        Lista de países: las 8 celdas, incluidas FK y NK normalmente ocultas.
?show=QB,FE                     Lista de países: países clasificados + exportadores FIFA no clasificados.
?fifaconf=uefa                  Lista de países: solo miembros UEFA (filtro FIFA; no-FIFA no afectados).
?fifaconf=caf&show=AE           Lista de países: solo exportadores africanos.
?stage=r16                      Pestaña Torneo: países clasificados que alcanzaron los Octavos de final.
?stage=winner                   Pestaña Torneo: solo el campeón final.
```
<!-- /i18n:api_url_params -->
