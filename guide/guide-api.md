<!-- i18n:api_page_title -->
# API Guide
<!-- /i18n:api_page_title -->

<!-- i18n:api_intro -->
Technical reference for the app's URL query parameter API — how to link directly into a specific filter/sort configuration on the Map page.
<!-- /i18n:api_intro -->

<!-- i18n:api_url_params -->
## URL query parameters

The Map page's filter/sort sidebar (`js/control_sidebar.js`) reads its whole configuration from a handful of URL query parameters: `?explain`, `?sort=`, `?dir=`, `?stage=`, `?fifaconf=`, `?show=`, `?pshow=`. Two more, `?bottomtab=` and `?select=`, are read directly by `js/wc2026_map.js` itself rather than the sidebar, to reproduce a full click path (which tab you land on, which country ends up dim-selected) from a URL alone. All are optional and independent; an omitted parameter just keeps the app's own default for that setting.

### `?explain` — inspect the current configuration

The `?` button in the filter toolbar opens a panel describing the sidebar's **current settings** — sort, direction, stage, filter cells, confederation — in plain English, alongside a count of visible countries. Add `?explain` to any URL to have it open automatically on load.

This panel describes the live sidebar, not the URL: it looks exactly the same whether a setting came from a URL parameter, a restored session, or a plain click in the panel. There's no way to tell, from the panel itself, which one happened — that's by design, since what matters is what's showing on screen right now. Dismiss it by clicking `?` again, clicking `×`, or pressing Esc.

Whenever a URL carries any sidebar parameter, the same current settings are also logged to the browser console, regardless of `?explain`.

```
?stage=r16&show=QB&explain    → opens the panel on load, stays open for review
```

### `?sort` — sort criterion

```
?sort=elo              Elo world ranking (default)
?sort=alpha            A–Z country name
?sort=pop              population
?sort=delta            plays-for minus born-in count
?sort=elo+alpha        primary: Elo, secondary: A–Z
?sort=pop+delta+alpha  up to 4 keys; only the first two are effective for sorting
```

`+` separates keys (`,` also accepted). Specified keys come first in the given order; unspecified keys fill the remaining slots in the sidebar. Combines with `?dir`.

### `?dir` — sort direction

```
?dir=desc    descending (default)
?dir=asc     ascending
```

Applies to the primary sort key only. `?sort=alpha&dir=desc` yields Z–A.

### `?stage` — tournament stage filter

```
?stage=group       default — all qualified countries and their exporters
?stage=r32         Round of 32
?stage=r16         Round of 16
?stage=qf          Quarter-finals
?stage=sf          Semi-finals
?stage=final       Final
?stage=winner      Winner only
```

Mirrors the stage carousel in the filter panel (Group stage → Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Final → Winner).

**Only filters the list while the Tournament tab is active.** There, it's the sole gate: qualified countries are narrowed to those that "reached" that stage — still alive going into it, or having already won it — and every non-qualified country is hidden outright, regardless of `?show`/`?fifaconf`. On the Country List (the default tab), `?stage` still moves the carousel into position for whenever you switch tabs, but has no filtering effect there — `?show` is what filters on that tab instead. See "Tab scoping" below.

Unknown values are silently ignored and defaults are kept.

### `?fifaconf` — FIFA confederation filter

```
?fifaconf=uefa       UEFA — Europe
?fifaconf=afc        AFC — Asia
?fifaconf=caf        CAF — Africa
?fifaconf=conmebol   CONMEBOL — South America
?fifaconf=concacaf   CONCACAF — N. & C. America
?fifaconf=ofc        OFC — Oceania
```

Filters the list to FIFA members of the named confederation only — on the Country List; on the Tournament tab this list-filtering is bypassed entirely, same as `?show` (see "Tab scoping" below). Non-FIFA countries are unaffected by the filter itself — they remain visible or hidden according to `?show`. Highlighting the confederation boundary and panning/zooming to it happens regardless of which tab is active.

Unknown values are silently ignored and defaults are kept.

### `?show` — filter whitelist

```
?show=<token>[,<token>...]
```

Comma-separated cell codes and/or group aliases. When `show` is present it **replaces** the defaults entirely — every cell not listed is unchecked. When absent, defaults apply.

Only filters the list on the Country List — on the Tournament tab, `?stage` is the sole gate and `?show` is ignored entirely; see "Tab scoping" below.

### `?pshow` — player/coach role filter

```
?pshow=<token>[,<token>...]
```

Comma-separated tokens from `export,native,import,player,coach` — the same 5 pill toggles as the filter sidebar's **view** row (Export / native / import, and Player / coach), only meaningful on the Player Table (see "Tab scoping" below). Like `?show`, presence **replaces** the defaults entirely — every token not listed is unchecked; all 5 are checked by default when the parameter is absent.

```
?pshow=export,native,import,coach   everyone except players (coaches only)
?pshow=export,native,import,player  everyone except coaches (players only)
```

### `?bottomtab` — active bottom tab

```
?bottomtab=teams        Country List
?bottomtab=tournament   Tournament
?bottomtab=players      Player Table
```

Normally the active tab comes from your last visit (`localStorage`), or the Country List if there's none saved — this parameter overrides that for the page this link opens, without touching what gets saved for next time. Combines with `?select` below: applied *after* it, so `?select=ar&bottomtab=players` reproduces "select Argentina from the Country List, then open the Player Table" in one link. Unknown values are silently ignored.

Named `bottomtab`, not `tab` — `?guide=api`/`?guide=data` (the guide panel itself) has its own, unrelated `&tab=api|data` for which *guide* tab to open; this one is about the Map page's own bottom tab bar underneath it.

### `?select` — dim-select a country

```
?select=<iso2>[:teams|:tournament]
```

Dim-selects a country exactly as clicking its pill or map flag would (arcs, dimmed flags, the Player Table narrowed to that one country) — `ar` for Argentina, `gb-eng` for England, etc., the same iso2 codes used throughout this app.

The optional `:teams`/`:tournament` suffix (default `:teams`) sets which tab's rules were "clicked" under — the Country List and Tournament tabs run different filter rules (`?stage` only gates the Tournament tab, non-qualified countries are hidden outright there, etc.), so the exact same country can resolve a different Player Table roster depending on context. This is independent of `?bottomtab` above: `?select=ar:tournament&bottomtab=teams` is a real, reachable state too — select while viewing the Tournament tab (baking its rules into the selection), then move over to the Country List while keeping that selection active, exactly as switching tabs after a real click always does (a selection is never cleared by switching tabs, only by an explicit deselect).

Unknown iso2 codes are silently ignored.

## Cell codes

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

## Tab scoping — `?stage`, `?show`, and `?fifaconf` don't all combine

These three don't stack into one combined filter — each of the Map page's two Elo tabs reads only one of them for actual list-filtering:

- **The Country List** (the default tab): `?show` and `?fifaconf` filter together as usual; `?stage` only parks the carousel for later — no filtering effect yet.
- **Tournament tab**: `?stage` is the sole filter — qualified countries narrowed to those that reached that stage, every non-qualified country hidden outright; `?show` and `?fifaconf` are both ignored.
- **Player Table**: has no country-category filter of its own — `?pshow` narrows its rows by role instead (see above); which countries it can show at all comes from whichever country is currently dim-selected (`?select`), or every visible country if none is.

Which tab you land on comes from `?bottomtab` when given, otherwise your last visit (`localStorage`), or the Country List if there's no saved preference. A link combining `?stage=r16&show=QB`, for example, pre-sets both values, but only one half actually filters anything, depending on which tab you land on.

## Keyboard shortcut

Every cell code and alias above is also a keyboard shortcut inside the filter sidebar: press **`v`** or **`x`**, then type the 2-letter code. `v` **shows** (checks) the named cells; `x` **hides** (unchecks) them — cells outside the code's own scope are never touched. Two leaders with a fixed target state, rather than one leader that toggles, since a keyboard chord can't see the checkbox states it's about to flip the way a mouse click on the visible checkbox can — the same chord would show or hide depending on whatever was already checked. `v`/`x` borrow the copy-paste mnemonic (paste-in / cut-out) rather than spelling out "show"/"hide". No modifier key — Ctrl/Cmd-based leaders risk landing on `Cmd-Q` (quits the whole browser on macOS) if mistyped, so this uses a bare leader instead, the same pattern GitHub uses for its own `g` `i`-style navigation. It only fires when focus isn't in a text field.

Because every code is exactly 2 letters, the shortcut always resolves the instant the second letter is typed — no waiting, no ambiguity between e.g. `IE` and a longer code that starts the same way (there isn't one).

```
v I E    show the IE cell (qualified, imports, exports)
x I E    hide the IE cell
v Q B    show all qualified rows
x A B    hide everything
```

Chaining two chords reaches an exact target state regardless of what was checked before it — e.g. "only `FK`, whatever the starting state" is `x A B` (hide everything) then `v F K` (show just `FK`).

`Esc` at any point during a shortcut cancels it; an idle chord also resets itself automatically after ~1.5s.

## Examples

```
?show=QB                        Country List: all 48 qualified countries; non-qualified hidden.
?show=QB&sort=pop&dir=asc       Country List: qualified countries sorted by population ascending.
?show=IE                        Country List: only countries that both import and export players.
?sort=delta&dir=asc&show=QB     Country List: qualified countries with fewest plays-for vs. born-in first.
?show=AB                        Country List: all 8 cells including normally-hidden FK and NK.
?show=QB,FE                     Country List: qualified countries + non-qualified FIFA exporters.
?fifaconf=uefa                  Country List: UEFA members only (FIFA filter; non-FIFA unaffected).
?fifaconf=caf&show=AE           Country List: African exporters only.
?stage=r16                      Tournament tab: qualified countries that reached the Round of 16.
?stage=winner                   Tournament tab: only the eventual champion.
?select=ar&bottomtab=players    Player Table: Argentina's own roster (select from Country List, then open it).
?select=ar:tournament&bottomtab=players  Same, but selected under the Tournament tab's own rules.
?bottomtab=tournament&stage=sf  Land directly on the Tournament tab, carousel parked at Semi-finals.
?select=ar&bottomtab=players&pshow=export,native,import,coach  Argentina's coaches only (its own coach, plus anyone born in Argentina now coaching elsewhere).
```
<!-- /i18n:api_url_params -->
