"""
Compute the longest simple path for 3 directed-graph variants of the WC 2026 export graph.

Variants:
  fwd  — edges go birth_country → plays_for only
  bwd  — edges go plays_for → birth_country only
  both — undirected (either direction, same as existing wc2026_chain_longest.json)

Uses Google OR-Tools CP-SAT circuit constraint.

Usage:
    python3 chains/subgraphs/compute_longest_paths.py
"""

import json, time
from pathlib import Path
from ortools.sat.python import cp_model

ROOT = Path(__file__).resolve().parent.parent.parent
DATA_FILE = ROOT / "wc2026_map_data.json"
OUTPUT_DIR = Path(__file__).resolve().parent

ISO2_OVERRIDES = {
    "England": "gb-eng", "Scotland": "gb-sct", "Wales": "gb-wls",
    "Northern Ireland": "gb-nir", "Kosovo": "xk",
}

ISO2_MAP = {
    "France": "fr", "Germany": "de", "Brazil": "br", "Argentina": "ar",
    "Spain": "es", "Portugal": "pt", "Netherlands": "nl", "Belgium": "be",
    "Italy": "it", "Croatia": "hr", "Denmark": "dk", "Switzerland": "ch",
    "Uruguay": "uy", "Colombia": "co", "Mexico": "mx", "United States": "us",
    "Canada": "ca", "Japan": "jp", "South Korea": "kr", "Australia": "au",
    "Saudi Arabia": "sa", "Iran": "ir", "Qatar": "qa", "Morocco": "ma",
    "Senegal": "sn", "Ghana": "gh", "Cameroon": "cm", "Nigeria": "ng",
    "Tunisia": "tn", "Egypt": "eg", "Algeria": "dz", "Ecuador": "ec",
    "Paraguay": "py", "Chile": "cl", "Peru": "pe", "Bolivia": "bo",
    "Venezuela": "ve", "Costa Rica": "cr", "Honduras": "hn", "Panama": "pa",
    "Jamaica": "jm", "Haiti": "ht", "Trinidad And Tobago": "tt",
    "Serbia": "rs", "Poland": "pl", "Austria": "at", "Czech Republic": "cz",
    "Romania": "ro", "Ukraine": "ua", "Turkey": "tr", "Greece": "gr",
    "Hungary": "hu", "Norway": "no", "Sweden": "se", "Finland": "fi",
    "Iceland": "is", "Ireland": "ie", "Albania": "al",
    "Bosnia and Herzegovina": "ba", "Montenegro": "me",
    "North Macedonia": "mk", "Slovenia": "si", "Slovakia": "sk",
    "Georgia": "ge", "New Zealand": "nz", "Iraq": "iq", "Jordan": "jo",
    "Uzbekistan": "uz", "Palestine": "ps", "Syria": "sy", "Bahrain": "bh",
    "Oman": "om", "Kuwait": "kw", "Cape Verde": "cv", "DR Congo": "cd",
    "Mali": "ml", "Burkina Faso": "bf", "Guinea": "gn", "Mozambique": "mz",
    "Tanzania": "tz", "South Africa": "za", "Kenya": "ke", "Uganda": "ug",
    "Zimbabwe": "zw", "Zambia": "zm", "Angola": "ao", "Benin": "bj",
    "Togo": "tg", "Niger": "ne", "Republic of the Congo": "cg",
    "Gabon": "ga", "Comoros": "km", "Madagascar": "mg", "Mauritania": "mr",
    "Namibia": "na", "Rwanda": "rw", "Sierra Leone": "sl",
    "Ivory Coast": "ci", "Curaçao": "cw", "Sudan": "sd",
    "Kingdom of the Netherlands": "nl", "U.S.": "us", "Isle of Man": "im",
    "Kazakhstan": "kz",
}


def iso2(country):
    return ISO2_OVERRIDES.get(country, ISO2_MAP.get(country, country[:2].lower()))


def load_edges():
    with open(DATA_FILE) as f:
        d = json.load(f)

    edges = []
    for rec in d["data"]:
        if rec["count"] == 0:
            continue
        for player in rec["players"]:
            edges.append({
                "birth_country": rec["country"],
                "plays_for": player["nation"],
                "player": player["name"],
                "city": player.get("city", ""),
                "caps": player.get("caps", 0),
            })
    return edges


def find_longest_path(all_edges, mode):
    """
    mode: "fwd"  — directed edges birth→plays
          "bwd"  — directed edges plays→birth
          "both" — undirected
    """
    countries = set()
    directed_edges = set()

    for e in all_edges:
        b, p = e["birth_country"], e["plays_for"]
        if b == p:
            continue
        countries.add(b)
        countries.add(p)
        if mode == "fwd":
            directed_edges.add((b, p))
        elif mode == "bwd":
            directed_edges.add((p, b))
        else:
            directed_edges.add((b, p))
            directed_edges.add((p, b))

    countries = sorted(countries)
    if len(countries) < 2:
        return [], []

    n = len(countries)
    idx = {c: i for i, c in enumerate(countries)}
    depot = n

    model = cp_model.CpModel()
    arcs = []

    for src_c, dst_c in directed_edges:
        i, j = idx[src_c], idx[dst_c]
        x = model.new_bool_var(f"a_{i}_{j}")
        arcs.append((i, j, x))

    for i in range(n):
        arcs.append((depot, i, model.new_bool_var(f"d_to_{i}")))
        arcs.append((i, depot, model.new_bool_var(f"d_from_{i}")))

    arcs.append((depot, depot, model.new_bool_var("d_self")))

    for i in range(n):
        skip = model.new_bool_var(f"skip_{i}")
        arcs.append((i, i, skip))

    model.add_circuit(arcs)

    visited = []
    for i in range(n):
        skip_var = None
        for src, dst, var in arcs:
            if src == i and dst == i:
                skip_var = var
                break
        v = model.new_bool_var(f"v_{i}")
        model.add(v == skip_var.negated())
        visited.append(v)

    model.maximize(sum(visited))

    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 300
    status = solver.solve(model)

    if status not in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        return [], []

    succ = {}
    for src, dst, var in arcs:
        if solver.value(var) and src != dst:
            succ[src] = dst

    start = succ.get(depot)
    if start is None:
        return [], []

    path = []
    cur = start
    while cur != depot:
        path.append(cur)
        cur = succ[cur]

    path_countries = [countries[i] for i in path]

    links = []
    for i in range(len(path_countries) - 1):
        c1, c2 = path_countries[i], path_countries[i + 1]
        best = None
        for e in all_edges:
            b, p = e["birth_country"], e["plays_for"]
            if mode == "fwd" and b == c1 and p == c2:
                match = True
            elif mode == "bwd" and p == c1 and b == c2:
                match = True
            elif mode == "both" and ((b == c1 and p == c2) or (b == c2 and p == c1)):
                match = True
            else:
                match = False
            if match and (best is None or e["caps"] > best["caps"]):
                best = e
        if best:
            direction = "fwd" if best["birth_country"] == c1 else "bwd"
            links.append({
                "player": best["player"],
                "city": best.get("city", ""),
                "caps": best.get("caps", 0),
                "direction": direction,
                "birth_country": best["birth_country"],
                "plays_for": best["plays_for"],
                "birth_code": iso2(best["birth_country"]),
                "plays_code": iso2(best["plays_for"]),
            })

    nodes = [{"country": c, "code": iso2(c)} for c in path_countries]
    return nodes, links


def main():
    all_edges = load_edges()

    variants = [
        ("fwd",  "born in → plays for (export direction)"),
        ("bwd",  "plays for ← born in (import direction)"),
        ("both", "both directions (undirected)"),
    ]

    print(f"Computing 3 longest paths...\n")
    summary = []

    for mode, desc in variants:
        t0 = time.time()
        nodes, links = find_longest_path(all_edges, mode)
        elapsed = time.time() - t0

        result = {
            "title": f"Longest chain — {desc}",
            "subtitle": f"Mondial 2026 · {len(links)} players · {len(nodes)} countries",
            "source": "source : Wikipédia · effectifs Mondial 2026",
            "mode": mode,
            "mode_description": desc,
            "nodes": nodes,
            "links": links,
        }

        outfile = OUTPUT_DIR / f"longest_{mode}.json"
        with open(outfile, "w") as f:
            json.dump(result, f, indent=2, ensure_ascii=False)

        print(f"  {mode:5s}  {len(nodes):3d} countries, {len(links):3d} links  ({elapsed:.2f}s)  → {outfile.name}")
        summary.append({"mode": mode, "description": desc, "countries": len(nodes), "links": len(links)})

    with open(OUTPUT_DIR / "summary.json", "w") as f:
        json.dump(summary, f, indent=2)

    print(f"\nDone. Results in {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
