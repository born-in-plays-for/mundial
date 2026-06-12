#!/usr/bin/env python3
"""
Fetches World Football Elo ratings from eloratings.net/World.tsv and
updates wc2026_elo_rank.json.

All ~230+ ranked nations are included; WC2026 qualification is handled client-side.

Usage:
    pip install requests pycountry
    python3 pipeline/update_elo_rankings.py
"""
import json
import sys
from datetime import date
from pathlib import Path

try:
    import requests
    import pycountry
except ImportError:
    print("Missing dependencies. Run: pip install requests pycountry", file=sys.stderr)
    sys.exit(1)

ROOT    = Path(__file__).parent.parent
OUT     = ROOT / 'wc2026_elo_rank.json'
OUT_TSV = Path(__file__).parent / 'wc2026_elo_rank.tsv'

SOURCE_URL = 'https://www.eloratings.net/World.tsv'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; mundial-bot/1.0)',
}

# eloratings.net uses custom 2-letter codes for UK home nations
ELO_UK = {
    'EN': (8260, 'gb-eng', 'England'),
    'SQ': (8261, 'gb-sct', 'Scotland'),
    'WA': (8262, 'gb-wls', 'Wales'),
    'EI': (8263, 'gb-nir', 'Northern Ireland'),
}

# eloratings codes that differ from ISO 3166-1 alpha-2
ELO_OVERRIDES = {
    'KO': 'KR',   # South Korea
    'NM': 'MK',   # North Macedonia
}

# Known non-ISO codes to silently skip (not ISO-recognised states)
ELO_SKIP = {'NS', 'KD', 'ZN', 'TI', 'SW', 'JS', 'HG', 'EU', 'AB', 'TE'}


def resolve(code):
    """Return (numeric_id, iso2, name) or None if unresolvable."""
    code = code.upper()

    if code in ELO_UK:
        num_id, iso2, name = ELO_UK[code]
        return num_id, iso2, name

    if code in ELO_SKIP:
        return None

    iso2_lookup = ELO_OVERRIDES.get(code, code)
    try:
        c = pycountry.countries.get(alpha_2=iso2_lookup)
        if c:
            return int(c.numeric), c.alpha_2.lower(), c.name
    except Exception:
        pass
    return None


def fetch_tsv():
    resp = requests.get(SOURCE_URL, headers=HEADERS, timeout=30)
    resp.raise_for_status()
    tsv_text = resp.text
    OUT_TSV.write_text(tsv_text, encoding='utf-8')
    return tsv_text


def parse(tsv_text):
    rankings = []
    seen_ids = set()
    unknown  = []

    for line in tsv_text.splitlines():
        parts = line.strip().split('\t')
        if len(parts) < 4:
            continue
        try:
            rank = int(parts[0])
            code = parts[2].upper()
            pts  = int(parts[3])
        except ValueError:
            continue

        result = resolve(code)
        if result is None:
            if code not in ELO_SKIP:
                unknown.append(code)
            continue

        num_id, iso2, name = result
        if num_id in seen_ids:
            continue
        seen_ids.add(num_id)
        rankings.append({'id': num_id, 'rank': rank, 'pts': pts, 'iso2': iso2, 'name': name})

    if unknown:
        print(f'Unknown codes (skipped): {unknown}', file=sys.stderr)

    return sorted(rankings, key=lambda x: x['rank'])


def main():
    print('Fetching Elo ratings from eloratings.net…')
    try:
        tsv_text = fetch_tsv()
    except Exception as e:
        print(f'Fetch failed: {e}', file=sys.stderr)
        sys.exit(1)

    rankings = parse(tsv_text)
    print(f'Parsed {len(rankings)} nations.')

    today    = date.today().isoformat()
    new_data = {'updated': today, 'source': 'eloratings.net', 'rankings': rankings}

    if OUT.exists():
        old = json.loads(OUT.read_text(encoding='utf-8'))
        if old.get('rankings') == rankings:
            print('Rankings unchanged — no update needed.')
            return

    OUT.write_text(
        json.dumps(new_data, indent=2, ensure_ascii=False) + '\n',
        encoding='utf-8',
    )
    print(f'Written {OUT.name} ({len(rankings)} nations).')


if __name__ == '__main__':
    main()
