"""
Enriches wc2026_map_data.json with per-language Wikipedia URLs.

Step 1 — fetch the WC2026 squads page, extract player name → EN wiki title.
Step 2 — batch-query the Wikipedia API (prop=langlinks) for FR/DE/IT titles.
Step 3 — write wiki_langs: {en, fr?, de?, it?} onto every player object.
"""
import json, re, time, requests
from urllib.parse import unquote, quote
from bs4 import BeautifulSoup

WIKI_URL  = "https://en.wikipedia.org/wiki/2026_FIFA_World_Cup_squads"
WIKI_API  = "https://en.wikipedia.org/w/api.php"
HEADERS   = {"User-Agent": "mundial-enricher/1.0 (github.com/cthiebaud/mundial)"}
LANGS     = ["fr", "de", "it"]
BATCH     = 50  # max titles per API call

def wiki_url(lang, title):
    return f"https://{lang}.wikipedia.org/wiki/{quote(title.replace(' ', '_'), safe=':@!$&\'()*+,;=/')}"

# ── Step 1: squad page → name → EN title ─────────────────────────────────────
print("Step 1 — fetching Wikipedia squad page…")
r = requests.get(WIKI_URL, headers=HEADERS, timeout=30)
r.raise_for_status()
soup = BeautifulSoup(r.text, "lxml")

name_to_title = {}
for table in soup.find_all("table", class_=re.compile(r"wikitable")):
    for a in table.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/wiki/") and ":" not in href:
            title = unquote(href[6:]).replace("_", " ")
            name  = a.get_text(strip=True)
            if name and title:
                name_to_title[name] = title

print(f"  {len(name_to_title)} linked names found")

# ── Step 2: load JSON, collect titles used by actual players ──────────────────
with open("wc2026_map_data.json", encoding="utf-8") as f:
    data = json.load(f)

all_players = [p for rec in data["data"] for p in rec["players"]]
needed_titles = list({name_to_title[p["name"]] for p in all_players if p["name"] in name_to_title})
print(f"  {len(needed_titles)} unique EN titles to query for langlinks")

# ── Step 3: batch-fetch langlinks ─────────────────────────────────────────────
print(f"Step 2 — querying Wikipedia API for {LANGS} langlinks…")
title_to_langs = {}   # en_title → {lang: localized_title}

for i in range(0, len(needed_titles), BATCH):
    batch = needed_titles[i:i + BATCH]
    params = {
        "action":  "query",
        "prop":    "langlinks",
        "lllimit": "max",
        "titles":  "|".join(batch),
        "format":  "json",
    }
    resp = requests.get(WIKI_API, params=params, headers=HEADERS, timeout=20)
    resp.raise_for_status()
    pages = resp.json()["query"]["pages"]
    for page in pages.values():
        en_title  = page["title"]
        lang_map  = {}
        for ll in page.get("langlinks", []):
            if ll["lang"] in LANGS:
                lang_map[ll["lang"]] = ll["*"]
        title_to_langs[en_title] = lang_map
    print(f"  batch {i//BATCH + 1}/{-(-len(needed_titles)//BATCH)} done")
    time.sleep(0.3)

# ── Step 4: enrich player objects ─────────────────────────────────────────────
print("Step 3 — enriching player objects…")
matched = unmatched = 0
lang_counts = {l: 0 for l in LANGS}

for p in all_players:
    en_title = name_to_title.get(p["name"])
    if not en_title:
        unmatched += 1
        p.pop("wiki", None)
        p.pop("wiki_langs", None)
        continue
    matched += 1
    langs = title_to_langs.get(en_title, {})
    wiki_langs = {"en": wiki_url("en", en_title)}
    for l in LANGS:
        if l in langs:
            wiki_langs[l] = wiki_url(l, langs[l])
            lang_counts[l] += 1
    p["wiki"]       = wiki_langs["en"]   # backward compat
    p["wiki_langs"] = wiki_langs

print(f"  Matched: {matched}/{len(all_players)}  |  unmatched: {unmatched}")
for l in LANGS:
    print(f"  {l}: {lang_counts[l]} players have a {l}.wikipedia.org page")

with open("wc2026_map_data.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, separators=(",", ":"))

print("wc2026_map_data.json updated.")
