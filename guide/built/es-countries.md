<!-- i18n:countries_page_title -->
# Países
<!-- /i18n:countries_page_title -->

<!-- i18n:countries_intro -->
Todos los países del ecosistema del Mundial 2026 — selecciones clasificadas y el mundo más amplio del fútbol — clasificados por rating Elo y coloreados según sus conexiones nacido-en / juega-para.
<!-- /i18n:countries_intro -->

<!-- i18n:countries_url_params -->
## Parámetros de URL

Las páginas Países y Mapa admiten parámetros de URL para preconfigurar el panel de filtro y ordenación al cargarse. Todos los parámetros son opcionales e independientes; los parámetros omitidos mantienen los valores predeterminados del panel.

### `?explain` — inspeccionar la configuración actual

El botón `?` de la barra de herramientas del filtro abre un panel que describe los **ajustes actuales** del panel — orden, dirección, fase, celdas de filtro, confederación, modo de visualización — en lenguaje claro, junto con un recuento de países visibles. Añade `?explain` a cualquier URL para que se abra automáticamente al cargar.

Este panel describe el panel tal como está en vivo, no la URL: tiene exactamente el mismo aspecto tanto si un ajuste procede de un parámetro de URL, de una sesión restaurada, o de un simple clic en el panel. No hay forma de distinguir, desde el propio panel, cuál de ellos ocurrió — es intencionado, ya que lo que importa es lo que se ve en pantalla en este momento. Ciérralo volviendo a hacer clic en `?`, en `×`, o pulsando Esc.

Siempre que una URL contenga algún parámetro del panel, los mismos ajustes actuales también se registran en la consola del navegador, independientemente de `?explain`.

```
?stage=r16&show=qual&explain    → abre el panel al cargar, permanece abierto para revisión
```

### `?sort` — criterio de ordenación

```
?sort=elo              clasificación Elo mundial (predeterminado)
?sort=alpha            A–Z nombre de país
?sort=pop              población
?sort=delta            juega-para menos nacido-en
?sort=elo+alpha        primario: Elo, secundario: A–Z
?sort=pop+delta+alpha  hasta 4 claves; solo las dos primeras son efectivas
```

`+` separa las claves (`,` también aceptado). Las claves especificadas van primero en el orden indicado; las claves no especificadas rellenan los espacios restantes en el panel. Se combina con `?dir`.

### `?dir` — dirección de ordenación

```
?dir=desc    descendente (predeterminado)
?dir=asc     ascendente
```

Se aplica solo a la clave de ordenación primaria. `?sort=alpha&dir=desc` produce Z–A.

### `?stage` — filtro de fase del torneo

```
?stage=group       predeterminado — todos los países clasificados y sus exportadores
?stage=r32         Dieciseisavos de final
?stage=r16         Octavos de final
?stage=qf          Cuartos de final
?stage=sf          Semifinales
?stage=final       Final
?stage=winner      Solo el campeón
```

Refleja el carrusel de fase en el panel de filtros (Fase de grupos → Dieciseisavos de final → Octavos de final → Cuartos de final → Semifinales → Final → Campeón). Cada posición filtra los países clasificados hasta aquellos que «alcanzaron» esa fase — aún en juego al inicio de la misma, o ya campeones. Los países exportadores no clasificados (celdas `ef`/`en`) no se ven afectados, al igual que los países no clasificados y no exportadores (celdas `of`/`on`) — ninguno de los dos tiene una posición en el torneo que «alcanzar».

Los valores desconocidos se ignoran silenciosamente y se mantienen los valores predeterminados.

### `?fifaconf` — filtro de confederaciones FIFA

```
?fifaconf=uefa       UEFA — Europa
?fifaconf=afc        AFC — Asia
?fifaconf=caf        CAF — África
?fifaconf=conmebol   CONMEBOL — América del Sur
?fifaconf=concacaf   CONCACAF — América del Norte y Central
?fifaconf=ofc        OFC — Oceanía
```

Filtra la lista a los miembros FIFA de la confederación indicada únicamente. Los países no-FIFA no se ven afectados — permanecen visibles u ocultos según la configuración de `?show` y `?stage`. En la página Mapa, también resalta el límite de la confederación y hace zoom sobre ella.

Los valores desconocidos se ignoran silenciosamente y se mantienen los valores predeterminados.

### `?show` — lista blanca de filtro

```
?show=<token>[,<token>...]
```

Códigos de celda y/o alias de grupo separados por comas. Cuando `show` está presente **reemplaza** completamente los valores predeterminados — cada celda no listada queda desmarcada. Cuando está ausente, se aplican los valores predeterminados.

##  Códigos de celda

La matriz de filtro refleja el diseño del panel — dos columnas (exportador / no exportador) cruzadas con cuatro grupos de filas:

|  | **exportador** | **no exportador** |
|---|:---:|:---:|
| **clasificado · importaciones**     | `qie`&nbsp;&nbsp;✓  | `qi`&nbsp;&nbsp;✓ |
| **clasificado · sin importaciones** |  `qe` &nbsp;&nbsp;✓ |  `q` &nbsp;&nbsp;✓ |
| **no clasificado · FIFA**           |  `ef` &nbsp;&nbsp;○ | `of`&nbsp;&nbsp;○ |
| **no clasificado · no-FIFA**        |  `en` &nbsp;&nbsp;○ | `on`&nbsp;&nbsp;○ |

✓ activo por defecto · ○ inactivo por defecto

Mnemónicos de letras:

- `q` — clasificado
- `i` — importaciones
- `e` — exportaciones
- `f` — miembro FIFA
- `n` — no-FIFA
- `o` — otro (no clasificado, no exportador)

### Nota sobre terminología

El marco oficial de este proyecto es **Nacido En / Juega Para**: un jugador es *nacido en* un país y *juega para* otro. En la matriz de filtro la misma relación se expresa desde el punto de vista del país como **importaciones / exportaciones**: un país *exporta* un jugador cuando alguien nacido allí juega para una selección diferente; *importa* un jugador cuando alguien nacido en el extranjero juega para su selección. Las dos formulaciones son intercambiables:

- «Francia exporta 17 jugadores» = «17 jugadores nacidos en Francia juegan para la selección de otro país.»
- «Marruecos importa 4 jugadores» = «4 jugadores nacidos fuera de Marruecos juegan para la selección marroquí.»
- «Un país `qie` importa y exporta» = «una selección clasificada que incluye jugadores nacidos en el extranjero *y* tiene jugadores nacidos allí representando otras naciones.»

## Alias de grupo

| Alias  | Se expande en      | Significado                                       |
|--------|--------------------|---------------------------------------------------|
| `qual` | `qie,qi,qe,q`     | Todas las filas clasificadas                      |
| `nq`   | `ef,en,of,on`     | Todas las filas no clasificadas                   |
| `exp`  | `qie,qe,ef,en`    | Columna exportadores                              |
| `nexp` | `qi,q,of,on`      | Columna no exportadores                           |
| `imp`  | `qie,qi`          | Filas importadores (con o sin exportaciones)      |
| `all`  | todos los 8 códigos | Todas las celdas (incluidas `of` y `on`)        |

Los alias y los códigos individuales se pueden mezclar libremente; el resultado es una unión. Los tokens desconocidos se ignoran silenciosamente — si todos los tokens son desconocidos el parámetro se ignora por completo y se mantienen los valores predeterminados.

## Combinar `?stage` con `?show`

- `?stage=r16&show=qual` → solo países clasificados que alcanzaron los octavos de final
- `?stage=winner&show=qual` → solo el campeón
- `?stage=r32&show=exp` → exportadores clasificados que alcanzaron los dieciseisavos de final, más todos los exportadores no clasificados (no afectados por la fase)
- `?stage` no tiene efecto en las filas no clasificadas (`ef`/`en`/`of`/`on`) — ninguna tiene una posición en el torneo que alcanzar

## Ejemplos

```
?stage=r16&show=qual          Países clasificados que alcanzaron los octavos de final.
?stage=winner&show=qual       Solo el campeón.
?show=qual                    Los 48 países clasificados; no clasificados ocultos.
?show=qual&sort=pop&dir=asc   Países clasificados ordenados por población ascendente.
?show=qie                     Solo países que tanto importan como exportan jugadores.
?stage=r32&show=exp           Columna exportadores; exportadores clasificados filtrados a los dieciseisavos, exportadores no clasificados no afectados.
?sort=delta&dir=asc&show=qual Países clasificados con menor diferencia juega-para vs. nacido-en primero.
?show=all                     Las 8 celdas incluidas of y on normalmente ocultas.
?show=qual,ef                 Países clasificados + exportadores FIFA no clasificados.
?fifaconf=uefa                    Solo miembros UEFA (filtro FIFA; no-FIFA no afectados).
?fifaconf=caf&show=exp            Solo exportadores africanos.
```
<!-- /i18n:countries_url_params -->
