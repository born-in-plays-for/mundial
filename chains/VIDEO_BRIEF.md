# Video Brief — La Chaîne la Plus Longue
*Handoff note for next session*

---

## Concept (as described by user)

A LinkedIn video in **two acts**:

### Act 1 — The Puzzle (fast, teaser)
- On-screen question: **"Quel est le point commun entre tous ces participants au Mondial 2026 ?"**
- Flash through all **37 player photos** at very high speed with their names read/displayed rapidly (like a quiz intro)
- Then: the **answer** is revealed — they are all part of the longest possible path in the graph of [born-in | plays-for] relationships between countries and players.

### Act 2 — The Chain (slow, narrative)
The screen is divided into **three panels**:
1. **Left or top** — the world map (D3 choropleth)
2. **Center or bottom** — the chain snake visualization (similar to `wc2026_chain_render.js` but animated step by step)
3. **Right** — the current player's photo + name

**Per-step narration rhythm** (slow, one step at a time):

> **Tani Oluwaseyi** [photo appears] est né au **Nigeria** [map zooms to Nigeria]
> et joue pour le **Canada** [map dezomms to show Nigeria→Canada arc, zooms to Canada]

> **Ismaël Koné** [photo appears] joue lui aussi pour le **Canada** [map highlights Canada],
> mais est né en **Côte d'Ivoire** [map shows CI→Canada arc, zooms to Ivory Coast]

> **Nicolas Pépé** [photo appears] joue pour la **Côte d'Ivoire**,
> et est né en **France**, à Mantes-la-Jolie [map shows FR→CI arc]

> …and so on for all 37 players.

The **chain snake panel** updates at each step — highlighting the current link (country node glows, player label prominent, arrows show direction).

---

## Source data

**`chains/subgraphs/longest_both.json`** — 44 nodes + 43 links.

Key fields per link:
```json
{
  "player": "Tani Oluwaseyi",
  "city": "Abuja",
  "caps": 23,
  "direction": "fwd",
  "birth_country": "Nigeria",   "birth_code": "ng",
  "plays_for": "Canada",        "plays_code": "ca"
}
```

`direction: "fwd"` → born in node[i], plays for node[i+1]
`direction: "bwd"` → born in node[i+1], plays for node[i]

Full chain order: Nigeria → Canada → Ivory Coast → France → Ghana → England → Norway → Iraq → Sweden → Turkey → Netherlands → New Zealand → Scotland → Australia → Italy → Argentina → Mexico → Spain → Uruguay → Paraguay → Brazil → Portugal → Cape Verde → United States → Haiti → Switzerland → DR Congo → Belgium → Algeria → Qatar → Senegal → Germany → Croatia → Austria → Bosnia & Herzegovina → Denmark → Tunisia → Saudi Arabia

---

## Technical decisions (to be finalized)

### Format
- **1920×1080** landscape (LinkedIn desktop / YouTube)
- Recorded via Playwright → WebM → converted to MP4 with ffmpeg

### Three-panel layout (1920×1080)
```
+------------------+------------------+------------------+
|                  |                  |                  |
|   World Map      |  Chain Snake     |  Player Card     |
|   ~640px wide    |  ~640px wide     |  ~640px wide     |
|   (D3 zoom)      |  (svg anim)      |  photo + name    |
|                  |                  |                  |
+------------------+------------------+------------------+
```
OR a two-panel layout (map left 60%, player+chain right 40%) — TBD.

### Map behavior per step
- All 38 chain countries always colored (warm amber `#2a2010`)
- Visited countries: darker amber `#3d2a06`
- Current birth country: bright blue `#2563eb`
- Current plays-for country: bright amber `#d97706`
- **Zoom sequence**: zoom to birth country → brief hold → dezoom to show the arc → zoom to plays-for country (or fit both in view)
- Arc drawn between birth and plays-for (curved SVG path, animated stroke-dashoffset)

### Chain snake panel
- Reuse/adapt `chains/wc2026_chain_render.js`
- Current node highlighted (existing `elo-item--active` style equivalent)
- Previous links greyed out, current link brightly colored
- Auto-scrolls to keep current node visible

### Player card
- Player photo (top, circle-cropped or portrait-cropped)
- Player name (large, bold)
- "born in [flag] City, Country" 
- "plays for [flag] Country"
- "N caps"
- Falls back to two flags side-by-side if no photo

### Act 1 timing
- Question on screen: ~2s
- Photo flash: ~0.3s per player × 37 = ~11s
- Answer reveal: ~2s
- Total Act 1: ~15s

### Act 2 timing
- ~3s per step × 37 = ~111s (~1:50)
- Outro with full chain visible: ~4s
- Total Act 2: ~115s

### Grand total: ~130s (~2:10) — fits LinkedIn perfectly (max 10min)

---

## Player photos

**`pipeline/fetch_chain_photos.py`** needs to be written (was interrupted).

Strategy:
1. Query Wikidata SPARQL by English Wikipedia sitelink → get P18 (image) property
2. Download to `chains/player_photos/{slug}.jpg`
3. Write `chains/player_photos/manifest.json` → `{ "Erling Haaland": "player_photos/erling-haaland.jpg", ... }`
4. HTML loads manifest.json at runtime, falls back to flag display if null

Expected coverage:
- ~15 players: good photo on Wikidata (Haaland, Kovačić, Pépé, Ayew, Matheus Nunes, Giménez, Pašalić, Kökçü, Bongonda, Khoukhi, Dykes, Jakobs, Semenyo, Etienne Jr., Ismaël Koné)
- ~12 players: may have a photo but quality/angle uncertain
- ~10 players: likely no Wikidata photo (Marko Farji, Keeto Thermoncy, Issa Laye, Adem Arous, Gastón Olveira, Maurício, CJ dos Santos, Callan Elliot, Giuliano Simeone, Hélio Varela)

---

## Files to create

| File | Status | Notes |
|------|--------|-------|
| `chains/wc2026_chain_video.html` | ❌ To do | Main animated page |
| `pipeline/fetch_chain_photos.py` | ❌ To do | Wikidata photo downloader |
| `chains/record_chain_video.py` | ❌ To do | Playwright recorder |
| `chains/player_photos/` | ❌ To do | Downloaded photos dir |

## Files that exist and are needed

| File | Notes |
|------|-------|
| `chains/subgraphs/longest_both.json` | Chain data ✅ |
| `chains/wc2026_chain_render.js` | Chain SVG renderer ✅ — adapt for animation |
| `uk-nations.geojson` | UK home nation polygons ✅ |
| `wc2026_map.js` | Reference for D3 zoom patterns ✅ |

---

## Existing infographic design language (for consistency)

From `infographics/wc2026_top_exporters.html`:
- Dark background with photo + gradient overlay
- Amber accent: `#fbbf24` / `#d97706`
- Font: `'Helvetica Neue', Helvetica, Arial, sans-serif`
- Eyebrow: 14px, letter-spacing 5px, uppercase, amber
- Bold heavy numbers, weight 900

---

## Wikidata SPARQL query pattern (for photo fetcher)

```sparql
SELECT ?item ?image WHERE {
  ?article schema:about ?item;
           schema:isPartOf <https://en.wikipedia.org/>;
           schema:name "Erling Haaland".
  ?item wdt:P18 ?image.
}
LIMIT 1
```

Endpoint: `https://query.wikidata.org/sparql`
Rate limit: 1 req/sec to be safe.
Image URL: Commons URL — append `?width=400` for thumbnail.

---

## Key geographic centroids (lon, lat) for chain countries

```python
GEO = {
  'ng':  [8.0,  9.0],  'ca': [-96.0, 60.0], 'ci': [-5.6,  7.5],
  'fr':  [2.3, 46.5],  'gh': [-1.1,  7.9],  'gb-eng': [-1.5, 52.5],
  'no':  [10.0, 65.0], 'iq': [44.4, 33.3],  'se': [15.0, 62.0],
  'tr':  [35.0, 39.0], 'nl': [5.3,  52.1],  'nz': [172.5,-41.0],
  'gb-sct': [-4.2, 56.8], 'au': [133.0,-27.0], 'it': [12.6, 42.5],
  'ar':  [-64.0,-34.0], 'mx': [-102.0,23.0], 'es': [-3.7, 40.4],
  'uy':  [-56.0,-33.0], 'py': [-58.0,-23.0], 'br': [-53.0,-10.0],
  'pt':  [-8.0, 39.5], 'cv': [-23.5, 15.1], 'us': [-98.0, 38.0],
  'ht':  [-72.3, 18.9],'ch': [8.2,  46.8],  'cd': [24.0, -4.0],
  'be':  [4.5,  50.5], 'dz': [3.0,  28.0],  'qa': [51.2, 25.3],
  'sn':  [-14.5,14.5], 'de': [10.5, 51.2],  'hr': [15.5, 45.1],
  'at':  [14.5, 47.5], 'ba': [17.8, 44.2],  'dk': [10.0, 56.0],
  'tn':  [9.5,  34.0], 'sa': [45.0, 24.0],
}
```

---

## Alpha2 → ISO numeric (for world-atlas choropleth coloring)

```python
ALPHA2_ID = {
  'ng':566, 'ca':124, 'ci':384, 'fr':250, 'gh':288,
  'no':578, 'iq':368, 'se':752, 'tr':792, 'nl':528,
  'nz':554, 'au':36,  'it':380, 'ar':32,  'mx':484,
  'es':724, 'uy':858, 'py':600, 'br':76,  'pt':620,
  'cv':132, 'us':840, 'ht':332, 'ch':756, 'cd':180,
  'be':56,  'dz':12,  'qa':634, 'sn':686, 'de':276,
  'hr':191, 'at':40,  'ba':70,  'dk':208, 'tn':788, 'sa':682,
}
# UK home nations (gb-eng, gb-sct) use uk-nations.geojson, not world-atlas
```

---

*Written by Claude Sonnet 4.6 — session 2026-06-15 — pick up here tomorrow.*
