#!/usr/bin/env python3
"""
Parse the local FIFA rankings HTML and inject fifa_rank into wc2026_map_data.json.

Source: "FIFA_Coca-Cola Men's World Ranking.html" (saved from fifa.com)
The Rank cell encodes: rank * 10 + abs(movement), so real rank = int(cell) // 10.
"""
import json
from pathlib import Path
from bs4 import BeautifulSoup

ROOT = Path(__file__).parent.parent

# FIFA website name → our JSON name
FIFA_NAME_MAP = {
    'IR Iran':             'Iran',
    'Türkiye':             'Turkey',
    'Korea Republic':      'South Korea',
    'USA':                 'United States',
    "Côte d'Ivoire":      'Ivory Coast',
    'Congo DR':            'DR Congo',
    'Republic of Ireland': 'Ireland',
    'Czechia':             'Czech Republic',
    'Northern Ireland':    'Northern Ireland',
    'Wales':               'Wales',
    'Cabo Verde':          'Cape Verde',
    'Congo':               'Republic of the Congo',
}

# ── 1. Parse FIFA HTML ────────────────────────────────────────────────────────
html_path = Path(__file__).parent / "FIFA_Coca-Cola Men's World Ranking.html"
with open(html_path, encoding='utf-8', errors='ignore') as f:
    soup = BeautifulSoup(f.read(), 'html.parser')

fifa_rank = {}
for row in soup.find_all('tr'):
    cells = row.find_all('td')
    if len(cells) < 2:
        continue
    rank_text = cells[0].get_text(strip=True)
    if not rank_text.isdigit():
        continue
    rank = int(rank_text) // 10          # decode: rank*10 + movement
    name = cells[1].get_text(separator='\n', strip=True).split('\n')[0].strip()
    name = FIFA_NAME_MAP.get(name, name)
    fifa_rank[name] = rank

print(f"Parsed {len(fifa_rank)} teams")

# ── 2. Coverage report (against pop keys in wc2026_map_data.json) ────────────
data = json.load(open(ROOT / 'wc2026_map_data.json', encoding='utf-8'))
missing = [k for k in data['pop'] if k not in fifa_rank]
if missing:
    print(f"WARNING – {len(missing)} pop countries not in FIFA rankings:")
    for m in sorted(missing):
        print(f"  {m!r}")
else:
    print("All pop countries covered.")

# ── 3. Write standalone JSON ──────────────────────────────────────────────────
out_path = ROOT / 'wc2026_fifa_ranks.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(fifa_rank, f, ensure_ascii=False, separators=(',', ':'), sort_keys=True)
print(f"Done → {out_path.name}")
