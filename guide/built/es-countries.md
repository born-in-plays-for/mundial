<!-- i18n:countries_page_title -->
# Countries
<!-- /i18n:countries_page_title -->

<!-- i18n:countries_intro -->
All countries in the World Cup 2026 ecosystem — qualified squads and the broader world of football nations — ranked by Elo rating and colour-coded by their born-in / plays-for connections.
<!-- /i18n:countries_intro -->

<!-- i18n:countries_url_params -->
## URL query parameters

Both the Countries page and the Map page support URL query parameters to pre-configure the filter and sort sidebar on load. All parameters are optional and independent; omitted parameters keep the sidebar defaults.

### `?explain` — debugging aid

Add `?explain` to any URL to open an explanation panel on load that translates every active parameter into plain English, alongside a count of visible countries. The same panel can be toggled at any time via the `?` badge that appears in the filter header corner whenever non-default parameters are active. Dismiss it by clicking `?` again, clicking `×`, or pressing Esc.

All active parameters are always logged to the browser console, regardless of `?explain`.

```
?in&show=qual&explain    → opens the panel on load, stays open for review
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

### `?in` / `?out` — alive & kicking filter

Boolean flags — presence alone is the signal; no `=value` needed. These mirror the **in · ● · out** toggle widget in the filter panel.

```
(neither)    default — all 48 qualified countries shown
?in          alive & kicking only — teams still in the tournament
?out         eliminated only — teams knocked out
?in&out      Schrödinger's team → empty set (no country is simultaneously in and out)
```

When `?in` or `?out` is set, non-qualified exporter countries are also filtered:

- `?in` hides exporters whose players all go to knocked-out teams
- `?out` hides exporters whose players all go to alive & kicking teams

### `?show` — filter whitelist

```
?show=<token>[,<token>...]
```

Comma-separated cell codes and/or group aliases. When `show` is present it **replaces** the defaults entirely — every cell not listed is unchecked. When absent, defaults apply.

### Cell codes

The filter matrix mirrors the sidebar layout — two columns (exporter / non-exporter) crossed with four row groups:

|  | **exporter** | **non-exporter** |
|---|:---:|:---:|
| **qualified · imports** | ✓ `qie` | ✓ `qi` |
| **qualified · no imports** | ✓ `qe` | ✓ `q` |
| **non-qual · FIFA** | ✓ `ef` | ○ `of` |
| **non-qual · non-FIFA** | ✓ `en` | ○ `on` |

✓ on by default · ○ off by default

Letter mnemonics:

- `q` — qualified
- `i` — imports
- `e` — exports
- `f` — FIFA member
- `n` — non-FIFA
- `o` — other (non-qualified, non-exporter)

**A note on terminology.** The official framing of this project is **Born In / Plays For**: a player is *born in* one country and *plays for* another. In the filter matrix the same relationship is expressed from the country's point of view as **imports / exports**: a country *exports* a player when someone born there plays for a different squad; it *imports* a player when someone born abroad plays for its squad. The two framings are interchangeable:

- "France exports 17 players" = "17 players born in France play for another country's squad."
- "Morocco imports 4 players" = "4 players born outside Morocco play for the Moroccan squad."
- "A `qie` country both imports and exports" = "a qualified squad that includes players born abroad *and* has players born there representing other nations."

### Group aliases

| Alias  | Expands to         | Meaning                              |
|--------|--------------------|--------------------------------------|
| `qual` | `qie,qi,qe,q`     | All qualified rows                   |
| `nq`   | `ef,en,of,on`     | All non-qualified rows               |
| `exp`  | `qie,qe,ef,en`    | Exporter column                      |
| `nexp` | `qi,q,of,on`      | Non-exporter column                  |
| `imp`  | `qie,qi`          | Importer rows (with or without exports) |
| `all`  | all 8 codes        | Every cell (including `of` and `on`) |

Aliases and individual codes may be freely mixed; the result is a union. Unknown tokens are silently ignored — if all tokens are unrecognized the parameter is ignored entirely and defaults are kept.

### Combining `?in`/`?out` with `?show`

- `?in&show=qual` → only alive & kicking qualified countries
- `?out&show=qual` → only eliminated qualified countries
- `?in&show=exp` → exporters (qualified or not) linked to alive & kicking teams
- `?in`/`?out` have no effect on `of`/`on` cells (they have no tournament connection)

### Examples

```
?in&show=qual                 Only alive & kicking qualified countries.
?out&show=qual                Only eliminated qualified countries.
?show=qual                    All 48 qualified countries; non-qualified hidden.
?show=qual&sort=pop&dir=asc   Qualified countries sorted by population ascending.
?show=qie                     Only countries that both import and export players.
?in&show=exp                  Exporter column, filtered to alive & kicking teams.
?sort=delta&dir=asc&show=qual Qualified countries with fewest plays-for vs. born-in first.
?show=all                     All 8 cells including normally-hidden of and on.
?show=qual,ef                 Qualified countries + non-qualified FIFA exporters.
```
<!-- /i18n:countries_url_params -->
