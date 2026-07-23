# Discipline by Coach Birth Country

One-off analysis: teams grouped by their head coach's own birth country, compared on fouls and
cards for the whole tournament. Source: `data/v2/discipline.json` (per-team fouls/cards,
whole-tournament totals) joined with coach birth country from `data/v2/map.json`'s export/native
records (`role: 'coach'`).

Tournament-wide average: **11.60 fouls/match** across all 48 teams.

## Groups of 2+ teams, sorted by pooled fouls/match

**Pooled fouls/match** = total fouls committed by every team in the group, divided by the total
matches those teams played — `sum(foulsCommitted) / sum(matchesPlayed)` across the whole group,
treated as one combined sample. Every *match* gets equal weight, so a team that went deep (more
matches) counts for more than one eliminated early — the more defensible number for "how
foul-prone was this cluster of teams overall."

| Coach born in | n | Pooled fouls/match | YC/match | RC (total) | Squads |
|---|---|---|---|---|---|
| Argentina | 6 | 12.83 | 1.73 | 5 | Argentina, Colombia, Ecuador, Paraguay, United States, Uruguay |
| Italy | 3 | 11.55 | 1.27 | 0 | Brazil, Turkey, Uzbekistan |
| France\* | 6 | 11.32 | 1.07 | 1 | Belgium, DR Congo, France, Haiti, Ivory Coast, Tunisia |
| Spain | 3 | 11.31 | 1.06 | 2 | Portugal, Qatar, Spain |
| Belgium | 2 | 11.20 | 1.20 | 2 | Morocco, South Africa |
| Bosnia and Herzegovina | 3 | 11.17 | 1.17 | 1 | Algeria, Bosnia and Herzegovina, Croatia |
| Germany | 4 | 10.95 | 1.16 | 1 | Austria, England, Germany, Saudi Arabia |
| Netherlands | 2 | 10.86 | 1.43 | 0 | Curaçao, Netherlands |
| England | 2 | 10.71 | 1.29 | 0 | New Zealand, Sweden |
| Australia | 2 | 10.43 | 1.29 | 1 | Australia, Iraq |

\* Haiti is this group's biggest outlier — the tournament's single highest-fouling team overall,
at 18.33 fouls/match. Remove it and the France group falls from 3rd place (pooled 11.32) to 9th
(pooled 10.48, n=5) — second-to-last instead of near the top. Every other group is unaffected;
Argentina still leads by a clear margin either way.

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

- **Fouls committed vs. how far a team went**: Pearson r = 0.08, Spearman ρ = 0.12 across all 48
  teams — no correlation (p ≈ 0.43–0.61). Group-stage exits averaged 11.69 fouls/match; teams that
  advanced averaged 11.46 — essentially the same.
- **Argentine-born coaches vs. the rest of the field**: comparing each team's own per-match
  average (not the pooled figure above, since a t-test needs one independent observation per
  team) — 12.52 vs. 11.40 fouls/match. Welch's t ≈ 1.53, df ≈ 9.1, two-tailed p ≈ 0.16 — a
  difference in the expected direction, but not statistically significant given n=6.
