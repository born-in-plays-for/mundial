"""
build_json.py — rebuild wc2026_map_data.json from wc2026_players.csv.

Reads:   pipeline/wc2026_players.csv
Writes:  wc2026_map_data.json  (project root)

Preserves wiki_langs / wiki from the existing JSON when player names match,
so this script is safe to re-run after the CSV is updated without losing the
Wikipedia enrichment produced by add_wiki_urls.py.

Population data (pop) is also read from the existing JSON (stable across runs).
Country → topojson numeric ID mapping is seeded from the existing JSON too;
new birth countries not yet in the JSON get id=null (rendered but not interactive
on the map — a subsequent data release can add the correct numeric ID).
"""
import json, csv
from pathlib import Path
from collections import defaultdict

ROOT      = Path(__file__).parent.parent
CSV_PATH  = Path(__file__).parent / "wc2026_players.csv"
JSON_PATH = ROOT / "wc2026_map_data.json"

# ── Load existing JSON (for pop, id mapping, wiki_langs) ─────────────────────
with open(JSON_PATH, encoding="utf-8") as f:
    existing = json.load(f)

pop_data   = existing.get("pop", {})
country_id = {r["country"]: r.get("id") for r in existing.get("data", [])}

# Build name → wiki_langs cache from existing players (exports + natives)
wiki_cache = {}
for rec in existing.get("data", []):
    for p in rec.get("players", []):
        if p.get("wiki_langs"):
            wiki_cache[p["name"]] = {"wiki_langs": p["wiki_langs"], "wiki": p.get("wiki")}
for players in existing.get("natives", {}).values():
    for p in players:
        if p.get("wiki_langs") and p["name"] not in wiki_cache:
            wiki_cache[p["name"]] = {"wiki_langs": p["wiki_langs"], "wiki": p.get("wiki")}

# ── Read CSV ──────────────────────────────────────────────────────────────────
players = []
with open(CSV_PATH, encoding="utf-8") as f:
    for row in csv.DictReader(f):
        players.append({
            "name":         row["player"],
            "nation":       row["nation"],
            "birth_country": row["birth_country"],
            "caps":         int(row["caps"]) if row["caps"] else 0,
        })

# ── Build data["data"] — exports (birth_country ≠ nation) ────────────────────
by_birth = defaultdict(list)
for p in players:
    bc = p["birth_country"]
    if bc and bc != p["nation"]:
        by_birth[bc].append(p)

data_records = []
for country, group in sorted(by_birth.items(), key=lambda x: -len(x[1])):
    nations_map = defaultdict(int)
    for p in group:
        nations_map[p["nation"]] += 1

    enriched_players = []
    for p in group:
        obj = {"name": p["name"], "nation": p["nation"], "caps": p["caps"]}
        if p["name"] in wiki_cache:
            obj.update(wiki_cache[p["name"]])
        enriched_players.append(obj)
    enriched_players.sort(key=lambda p: -p["caps"])

    top5 = enriched_players[:5]

    data_records.append({
        "country": country,
        "id":      country_id.get(country),
        "count":   len(group),
        "nations": sorted([[n, c] for n, c in nations_map.items()], key=lambda x: -x[1]),
        "top":     top5,
        "players": enriched_players,
    })

data_records.sort(key=lambda r: -r["count"])

# ── Build data["natives"] — born + plays for same country ────────────────────
natives = defaultdict(list)
for p in players:
    if p["birth_country"] == p["nation"]:
        obj = {"name": p["name"], "caps": p["caps"]}
        if p["name"] in wiki_cache:
            obj.update(wiki_cache[p["name"]])
        natives[p["nation"]].append(obj)

for nation in natives:
    natives[nation].sort(key=lambda p: -p["caps"])

# ── Assemble and write ────────────────────────────────────────────────────────
output = {
    "data":    data_records,
    "pop":     pop_data,
    "natives": dict(natives),
}

with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(output, f, ensure_ascii=False, separators=(",", ":"))

exports = sum(r["count"] for r in data_records)
native_total = sum(len(v) for v in natives.values())
print(f"Wrote {JSON_PATH}")
print(f"  {len(data_records)} birth countries, {exports} export players")
print(f"  {len(natives)} nations, {native_total} native players")
print(f"  {exports + native_total} players total")
