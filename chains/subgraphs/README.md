# chains/subgraphs/

Longest simple paths through the World Cup 2026 player export graph, computed for three directed-graph variants.

## Concept

A **chain** connects countries through players who were born in one country and play for another. Each link in the chain is one player bridging two countries. The **longest chain** is the longest simple path (no country repeated) through this graph.

The direction of each link matters:
- **Forward (fwd)**: the player was **born in** the previous country and **plays for** the next → follows the export direction
- **Backward (bwd)**: the player **plays for** the previous country and was **born in** the next → follows the import direction

## Three variants

| Mode | Edge direction | Result |
|---|---|---|
| `fwd` | born in → plays for only | 15 countries |
| `bwd` | plays for ← born in only | 15 countries |
| `both` | either direction (undirected) | 44 countries |

The undirected version (`both`) produces a much longer chain because it can zigzag between export and import directions, connecting far more countries. It matches the existing `chains/wc2026_chain_longest.json`.

## Files

| File | Purpose |
|---|---|
| `compute_longest_paths.py` | Script — builds the graph from `wc2026_map_data.json`, solves with OR-Tools CP-SAT |
| `longest_fwd.json` | Longest chain using forward edges only |
| `longest_bwd.json` | Longest chain using backward edges only |
| `longest_both.json` | Longest chain using both directions (undirected) |
| `summary.json` | Compact summary of all three results |

## How it works

1. Reads `wc2026_map_data.json` — each `data[i]` entry lists players born in country `data[i].country` who play for other countries (`data[i].players[j].nation`).

2. Builds a graph:
   - **fwd**: directed edge from `birth_country` to `plays_for`
   - **bwd**: directed edge from `plays_for` to `birth_country`
   - **both**: undirected (both directions added)

3. Finds the longest simple path using the **Google OR-Tools CP-SAT solver** with a circuit constraint and a depot node. Optional self-loop arcs allow skipping countries. The solver maximizes the number of visited countries.

4. For each consecutive pair of countries in the path, selects the player with the most caps as the representative link.

## Running

```bash
pip install ortools
python3 chains/subgraphs/compute_longest_paths.py
```

Takes < 0.2s for all three variants.

## JSON format

Same shape as `chains/wc2026_chain_longest.json`:

```json
{
  "title": "Longest chain — ...",
  "subtitle": "Mondial 2026 · 14 players · 15 countries",
  "mode": "fwd",
  "mode_description": "born in → plays for (export direction)",
  "nodes": [
    {"country": "Kazakhstan", "code": "kz"},
    {"country": "Uzbekistan", "code": "uz"}
  ],
  "links": [
    {
      "player": "...",
      "city": "...",
      "caps": 42,
      "direction": "fwd",
      "birth_country": "Kazakhstan",
      "plays_for": "Uzbekistan",
      "birth_code": "kz",
      "plays_code": "uz"
    }
  ]
}
```

The `direction` field on each link is always `"fwd"` in `longest_fwd.json` and always `"bwd"` in `longest_bwd.json`. In `longest_both.json` it varies per link.
