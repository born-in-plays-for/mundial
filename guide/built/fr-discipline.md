# Discipline by Coach Birth Country

One-off analysis: teams grouped by their head coach's own birth country, compared on fouls and
cards for the whole tournament. Source: `data/v2/discipline.json` (per-team fouls/cards,
whole-tournament totals) joined with coach birth country from `data/v2/map.json`'s export/native
records (`role: 'coach'`).

Tournament-wide average: **11.49 fouls/match** across all 48 teams.

## Groups of 2+ teams, sorted by pooled fouls/match

**Pooled fouls/match** = total fouls committed by every team in the group, divided by the total
matches those teams played — `sum(foulsCommitted) / sum(matchesPlayed)` across the whole group,
treated as one combined sample. Every *match* gets equal weight, so a team that went deep (more
matches) counts for more than one eliminated early — the more defensible number for "how
foul-prone was this cluster of teams overall."

| Coach born in | n | Pooled fouls/match | YC/match | RC (total) | Squads |
|---|---|---|---|---|---|
| Argentina | 6 | 12.41 | 1.59 | 4 | Argentina, Colombia, Ecuador, Paraguay, United States, Uruguay |
| Italy | 3 | 11.55 | 1.27 | 0 | Brazil, Turkey, Uzbekistan |
| France | 6 | 11.32 | 1.07 | 1 | Belgium, DR Congo, France, Haiti, Ivory Coast, Tunisia |
| Belgium | 2 | 11.20 | 1.20 | 2 | Morocco, South Africa |
| Bosnia and Herzegovina | 3 | 11.17 | 1.17 | 1 | Algeria, Bosnia and Herzegovina, Croatia |
| Germany | 4 | 10.95 | 1.16 | 1 | Austria, England, Germany, Saudi Arabia |
| Netherlands | 2 | 10.86 | 1.43 | 0 | Curaçao, Netherlands |
| England | 2 | 10.71 | 1.29 | 0 | New Zealand, Sweden |
| Spain | 3 | 10.67 | 1.13 | 2 | Portugal, Qatar, Spain |
| Australia | 2 | 10.43 | 1.29 | 1 | Australia, Iraq |

## Singletons (n=1 — no averaging possible, listed for completeness)

| Coach born in | Fouls/match | Squad |
|---|---|---|
| Denmark | 15.33 | Panama |
| Switzerland | 14.50 | Switzerland |
| United States | 14.40 | Canada |
| Mozambique | 14.00 | Ghana |
| Scotland | 14.00 | Scotland |
| Japan | 13.75 | Japan |
| Czech Republic | 12.33 | Czech Republic |
| Egypt | 11.80 | Egypt |
| Iran | 11.67 | Iran |
| Mexico | 11.60 | Mexico |
| Morocco | 10.33 | Jordan |
| Norway | 9.67 | Norway |
| Senegal | 9.00 | Senegal |
| South Korea | 8.33 | South Korea |
| Cape Verde | 6.75 | Cape Verde |

## Statistical notes

- **Fouls committed vs. how far a team went**: Pearson r = 0.03, Spearman ρ = 0.08 across all 48
  teams — no correlation (p ≈ 0.6–0.8). Group-stage exits averaged 11.69 fouls/match; teams that
  advanced averaged 11.38 — essentially the same.
- **Argentine-born coaches vs. the rest of the field**: comparing each team's own per-match
  average (not the pooled figure above, since a t-test needs one independent observation per
  team) — 12.26 vs. 11.37 fouls/match. Welch's t ≈ 1.35, df ≈ 11, two-tailed p ≈ 0.21 — a
  difference in the expected direction, but not statistically significant given n=6.
- All figures are each team's cumulative whole-tournament tally (`discipline.json`'s top-level
  fields), not a per-stage snapshot from `byStage`.
