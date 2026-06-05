"""
One-shot script: fetch Wikipedia squad page, extract player → wiki_title
mappings, enrich wc2026_map_data.json with a 'wiki' URL on each player.
"""
import json, re, requests
from urllib.parse import unquote
from bs4 import BeautifulSoup

WIKI_URL = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads"
HEADERS  = {"User-Agent": "mundial-enricher/1.0 (github.com/cthiebaud/mundial)"}

print("Fetching Wikipedia squad page…")
r = requests.get(WIKI_URL, headers=HEADERS, timeout=30)
r.raise_for_status()
soup = BeautifulSoup(r.text, "lxml")

# Build name → wiki URL map from every linked player name in wikitables
name_to_url = {}
for table in soup.find_all("table", class_=re.compile(r"wikitable")):
    for a in table.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/wiki/") and ":" not in href:
            title = unquote(href[6:]).replace("_", " ")
            name  = a.get_text(strip=True)
            if name and title:
                name_to_url[name] = f"https://en.wikipedia.org/wiki/{unquote(href[6:])}"

print(f"  {len(name_to_url)} linked names found on Wikipedia page")

# Enrich JSON
with open("wc2026_map_data.json", encoding="utf-8") as f:
    data = json.load(f)

matched = 0
unmatched = set()
for rec in data["data"]:
    for p in rec["players"]:
        url = name_to_url.get(p["name"])
        if url:
            p["wiki"] = url
            matched += 1
        else:
            unmatched.add(p["name"])

print(f"  Matched: {matched} / {sum(len(r['players']) for r in data['data'])}")
if unmatched:
    print(f"  Unmatched ({len(unmatched)}): {sorted(unmatched)[:10]}{'…' if len(unmatched) > 10 else ''}")

with open("wc2026_map_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

print("wc2026_map_data.json updated.")
