<!-- i18n:countries_page_title -->
# API Guide
<!-- /i18n:countries_page_title -->

<!-- i18n:countries_intro -->
Technical reference for the app's URL query parameter API — how to link directly into a specific filter/sort configuration on the Map page or the Players page. (This is reachable from the Players page's guide icon for now; `wc2026_countries.html`, the page this guide was originally written for, is no longer linked from the navbar — its filter cube lives on the Map page itself these days.)
<!-- /i18n:countries_intro -->

<!-- i18n:countries_url_params -->
## URL query parameters

The Map page (`js/control_sidebar.js`) and the Players page (`js/players_sidebar.js`) each have their own filter/sort sidebar with their own URL parameters. Some parameter *names* are shared between the two — `?dir=`, `?stage=`, `?fifaconf=` mean exactly the same thing on both pages, and are even persisted to the same `localStorage` slice, so picking a confederation on one page keeps it selected on the other. Everything else is page-specific: `?explain`, `?sort=`, `?show=` only exist on the Map page; `?psort=`, `?pshow=`, `?pconfscope=` only exist on the Players page. Each section below is marked with which page(s) it applies to. All parameters are optional and independent; omitted parameters keep the sidebar defaults.

### `?explain` — inspect the current configuration *(Map page only)*

The `?` button in the filter toolbar opens a panel describing the sidebar's **current settings** — sort, direction, stage, filter cells, confederation, display mode — in plain English, alongside a count of visible countries. Add `?explain` to any URL to have it open automatically on load.

This panel describes the live sidebar, not the URL: it looks exactly the same whether a setting came from a URL parameter, a restored session, or a plain click in the panel. There's no way to tell, from the panel itself, which one happened — that's by design, since what matters is what's showing on screen right now. Dismiss it by clicking `?` again, clicking `×`, or pressing Esc.

Whenever a URL carries any sidebar parameter, the same current settings are also logged to the browser console, regardless of `?explain`.

```
?stage=r16&show=QB&explain    → opens the panel on load, stays open for review
```

### `?sort` — sort criterion *(Map page only — see `?psort` for the Players page)*

```
?sort=elo              Elo world ranking (default)
?sort=alpha            A–Z country name
?sort=pop              population
?sort=delta            plays-for minus born-in count
?sort=elo+alpha        primary: Elo, secondary: A–Z
?sort=pop+delta+alpha  up to 4 keys; only the first two are effective for sorting
```

`+` separates keys (`,` also accepted). Specified keys come first in the given order; unspecified keys fill the remaining slots in the sidebar. Combines with `?dir`.

### `?dir` — sort direction *(shared — Map & Players pages)*

```
?dir=desc    descending (default)
?dir=asc     ascending
```

Applies to the primary sort key only. `?sort=alpha&dir=desc` yields Z–A.

### `?stage` — tournament stage filter *(shared — Map & Players pages)*

```
?stage=group       default — all qualified countries and their exporters
?stage=r32         Round of 32
?stage=r16         Round of 16
?stage=qf          Quarter-finals
?stage=sf          Semi-finals
?stage=final       Final
?stage=winner      Winner only
```

Mirrors the stage carousel in the filter panel (Group stage → Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Final → Winner). Each position filters qualified countries down to those that "reached" that stage — still alive going into it, or having already won it. Non-qualified exporter countries (`FE`/`NE` cells) are unaffected, same as non-exporter, non-qualified countries (`FK`/`NK` cells) — neither has a tournament position to "reach".

Unknown values are silently ignored and defaults are kept.

### `?fifaconf` — FIFA confederation filter *(shared — Map & Players pages)*

```
?fifaconf=uefa       UEFA — Europe
?fifaconf=afc        AFC — Asia
?fifaconf=caf        CAF — Africa
?fifaconf=conmebol   CONMEBOL — South America
?fifaconf=concacaf   CONCACAF — N. & C. America
?fifaconf=ofc        OFC — Oceania
```

Filters the list to FIFA members of the named confederation only. Non-FIFA countries are unaffected — they remain visible or hidden according to the `?show`/`?pshow` and `?stage` settings. On the Map page, also highlights the confederation boundary and pans/zooms to it. On the Players page, whether this checks a player's birth country or plays-for country is controlled separately — see `?pconfscope` below.

Unknown values are silently ignored and defaults are kept.

### `?show` — filter whitelist *(Map page only — see `?pshow` for the Players page)*

```
?show=<token>[,<token>...]
```

Comma-separated cell codes and/or group aliases. When `show` is present it **replaces** the defaults entirely — every cell not listed is unchecked. When absent, defaults apply.

##  Cell codes

The filter matrix mirrors the sidebar layout — two columns (exporter / keeps its players) crossed with four row groups. Every code is exactly **2 letters**: position 1 picks the row scope, position 2 picks the column.

|  | **exporter (`E`)** | **keeps its players (`K`)** |
|---|:---:|:---:|
| **qualified · imports (`I`)** | `IE`&nbsp;&nbsp;✓  | `IK`&nbsp;&nbsp;✓ |
| **qualified · homegrown, no imports (`H`)** | `HE`&nbsp;&nbsp;✓ | `HK`&nbsp;&nbsp;✓ |
| **non-qualified · FIFA (`F`)** | `FE`&nbsp;&nbsp;○ | `FK`&nbsp;&nbsp;○ |
| **non-qualified · non-FIFA (`N`)** | `NE`&nbsp;&nbsp;○ | `NK`&nbsp;&nbsp;○ |

✓ on by default · ○ off by default

Letter mnemonics — position 1 (row scope):

- `I` — qualified, has **I**mporters
- `H` — qualified, **H**omegrown (entire squad born there, no imports)
- `Q` — all **Q**ualified (both rows)
- `F` — **F**IFA member, non-qualified
- `N` — **N**on-FIFA
- `U` — all **U**nqualified (both rows)
- `A` — **A**bsolutely everything (all rows)

Position 2 (column scope):

- `E` — **E**xporters
- `K` — **K**eeps its players (non-exporters)
- `B` — **B**oth columns

Every one of these 2-letter codes also works as a keyboard shortcut in the sidebar — see "Keyboard shortcut" below.

### A note on terminology

The official framing of this project is **Born In / Plays For**: a player is *born in* one country and *plays for* another. In the filter matrix the same relationship is expressed from the country's point of view as **imports / exports**: a country *exports* a player when someone born there plays for a different squad; it *imports* a player when someone born abroad plays for its squad. The two framings are interchangeable:

- "France exports 17 players" = "17 players born in France play for another country's squad."
- "Morocco imports 4 players" = "4 players born outside Morocco play for the Moroccan squad."
- "An `IE` country both imports and exports" = "a qualified squad that includes players born abroad *and* has players born there representing other nations."

## Group aliases

| Alias  | Expands to         | Meaning                              |
|--------|--------------------|--------------------------------------|
| `QB`   | `IE,IK,HE,HK`     | All qualified rows                   |
| `UB`   | `FE,NE,FK,NK`     | All non-qualified rows               |
| `AE`   | `IE,HE,FE,NE`     | Exporter column                      |
| `AK`   | `IK,HK,FK,NK`     | Keeps-its-players column             |
| `IB`   | `IE,IK`           | Importer rows (with or without exports) |
| `HB`   | `HE,HK`           | Homegrown rows (qualified, no imports) |
| `FB`   | `FE,FK`           | FIFA-member rows (non-qualified)     |
| `NB`   | `NE,NK`           | Non-FIFA rows                        |
| `AB`   | all 8 codes        | Every cell (including `FK` and `NK`) |

Aliases and individual codes may be freely mixed; the result is a union. Unknown tokens are silently ignored — if all tokens are unrecognized the parameter is ignored entirely and defaults are kept.

## Combining `?stage` with `?show` *(Map page only)*

- `?stage=r16&show=QB` → only qualified countries that reached the Round of 16
- `?stage=winner&show=QB` → only the eventual champion
- `?stage=r32&show=AE` → qualified exporters that reached the Round of 32, plus all non-qualified exporters (unaffected by stage)
- `?stage` has no effect on non-qualified rows (`FE`/`NE`/`FK`/`NK`) — none of them have a tournament position to reach

## Keyboard shortcut *(Map page only)*

Every cell code and alias above is also a keyboard shortcut inside the filter sidebar: press **`f`**, then type the 2-letter code. No modifier key — Ctrl/Cmd-based leaders risk landing on `Cmd-Q` (quits the whole browser on macOS) if mistyped, so this uses a bare leader instead, the same pattern GitHub uses for its own `g` `i`-style navigation. It only fires when focus isn't in a text field.

Because every code is exactly 2 letters, the shortcut always resolves the instant the second letter is typed — no waiting, no ambiguity between e.g. `IE` and a longer code that starts the same way (there isn't one).

```
f I E    toggle the IE cell (qualified, imports, exports)
f Q B    toggle all qualified rows
f F B    toggle the FIFA row
f A B    toggle everything (same as clicking "all")
```

`Esc` at any point during a shortcut cancels it; an idle chord also resets itself automatically after ~1.5s.

## Players page parameters *(Players page only)*

The Players page has no cell matrix at all — a player only has 2 states (born where they play, or not), not the qualified/non-qualified × exporter/non-exporter grid the Map page filters on. It has its own 3 parameters instead.

### `?psort` — sort criterion + axis

```
?psort=playsFor:elo   sort by the plays-for team's Elo rank (default)
?psort=bornIn:pop     sort by the birth country's population
?psort=playsFor       axis only, keeps whichever criterion was already leading
?psort=player         sort by player name — no country axis, no criteria
```

Shape is `<axis>:<criterion>` (single criterion, unlike the Map page's `?sort` — no `+`-joined multi-key list here), where axis is `playsFor` or `bornIn` (which of the player's two countries the criterion is evaluated against) — or the bare value `player`, which sorts by name and ignores axis/criterion entirely. Criterion is one of `elo`/`pop`/`delta`/`alpha`, and becomes that axis's new leading criterion (any others already in the sidebar's own reorderable list just shift down, used as tie-breaks — not dropped). Table column headers (Player / Born in / Plays for) are a shortcut for the same thing — clicking one sets `?psort`'s axis to match, or reverses `?dir` if that axis is already active.

### `?pshow` — native/moved filter

```
?pshow=native,moved   both shown (default)
?pshow=native          only players who play for the country they were born in
?pshow=moved           only players who play for a different country (i.e. exports)
?pshow=                everyone hidden
```

Comma-separated, replaces the default whitelist entirely when present — same semantics as `?show`, just over 2 states instead of 8.

### `?pconfscope` — which country the confederation filter checks

```
?pconfscope=playsFor   ?fifaconf checks the plays-for team's confederation (default)
?pconfscope=bornIn     ?fifaconf checks the birth country's confederation
```

Independent of `?psort`'s own axis — you can sort by name but still filter by birth-country confederation, or vice versa.

## Examples

```
?stage=r16&show=QB              Map: qualified countries that reached the Round of 16.
?stage=winner&show=QB           Map: only the eventual champion.
?show=QB                        Map: all 48 qualified countries; non-qualified hidden.
?show=QB&sort=pop&dir=asc       Map: qualified countries sorted by population ascending.
?show=IE                        Map: only countries that both import and export players.
?stage=r32&show=AE              Map: exporter column, qualified exporters filtered to the Round of 32, non-qualified exporters unaffected.
?sort=delta&dir=asc&show=QB     Map: qualified countries with fewest plays-for vs. born-in first.
?show=AB                        Map: all 8 cells including normally-hidden FK and NK.
?show=QB,FE                     Map: qualified countries + non-qualified FIFA exporters.
?fifaconf=uefa                  Map or Players: UEFA members only (FIFA filter; non-FIFA unaffected).
?fifaconf=caf&show=AE           Map: African exporters only.
?psort=bornIn:pop&pshow=moved   Players: exported players only, sorted by birth country population.
?pshow=native                   Players: only players representing their own birth country.
?stage=qf&pconfscope=bornIn&fifaconf=uefa  Players: players born in UEFA countries, teams still in the Quarter-finals or beyond.
```
<!-- /i18n:countries_url_params -->
