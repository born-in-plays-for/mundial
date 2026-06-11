#!/usr/bin/env python3
"""
Fetches FIFA men's world ranking from the FIFA API and updates wc2026_fifa_rank.json.
All ~211 ranked nations are included; WC2026 qualification is handled client-side.

Usage:
    pip install requests pycountry
    python3 pipeline/update_fifa_rankings.py
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

ROOT = Path(__file__).parent.parent
OUT  = ROOT / 'wc2026_fifa_rank.json'

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (compatible; mundial-bot/1.0)',
    'Origin':     'https://www.fifa.com',
    'Referer':    'https://www.fifa.com/ranking/men/',
}

# FIFA 3-letter codes that differ from ISO 3166-1 alpha-3
FIFA_TO_ISO3 = {
    'ALG': 'DZA', 'ANG': 'AGO', 'BAH': 'BHS', 'BEN': 'BEN',
    'BOT': 'BWA', 'BUL': 'BGR', 'CHI': 'CHL', 'CRO': 'HRV',
    'EQG': 'GNQ', 'GAM': 'GMB', 'GER': 'DEU', 'GRE': 'GRC',
    'GRN': 'GRD', 'GUI': 'GIN', 'GBS': 'GNB', 'HAI': 'HTI',
    'IRI': 'IRN', 'IRN': 'IRN', 'KSA': 'SAU', 'LES': 'LSO',
    'LIB': 'LBN', 'MAS': 'MYS', 'MAD': 'MDG', 'MTN': 'MRT',
    'NEP': 'NPL', 'NED': 'NLD', 'OMA': 'OMN', 'PAR': 'PRY',
    'PHI': 'PHL', 'POR': 'PRT', 'RSA': 'ZAF', 'SKN': 'KNA',
    'SLO': 'SVN', 'SRI': 'LKA', 'SWZ': 'SWZ', 'SYR': 'SYR',
    'TAH': 'PYF', 'TOG': 'TGO', 'TRI': 'TTO', 'URU': 'URY',
    'VIE': 'VNM', 'VIN': 'VCT', 'ZAM': 'ZMB', 'ZIM': 'ZWE',
    'ANT': 'ATG', 'SUI': 'CHE', 'MAR': 'MAR', 'CIV': 'CIV',
    'COD': 'COD', 'CPV': 'CPV', 'CUW': 'CUW',
}

# UK home nations have no ISO 3166-1 numeric — mapped to our synthetic IDs
UK_NATIONS = {
    'ENG': (8260, 'gb-eng', 'England'),
    'SCO': (8261, 'gb-sct', 'Scotland'),
    'WAL': (8262, 'gb-wls', 'Wales'),
    'NIR': (8263, 'gb-nir', 'Northern Ireland'),
}


def resolve(fifa_code, name):
    """Return (numeric_id, iso2, canonical_name) or (None, None, None)."""
    if fifa_code in UK_NATIONS:
        num_id, iso2, canon = UK_NATIONS[fifa_code]
        return num_id, iso2, canon

    iso3 = FIFA_TO_ISO3.get(fifa_code, fifa_code)
    try:
        c = pycountry.countries.get(alpha_3=iso3)
        if c:
            return int(c.numeric), c.alpha_2.lower(), name
    except Exception:
        pass
    return None, None, None


def fetch_rankings():
    url = 'https://api.fifa.com/api/v3/rankings/FIFA'
    resp = requests.get(
        url, headers=HEADERS,
        params={'locale': 'en', 'count': '250'},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def parse(raw):
    rankings = []
    seen_ids = set()
    for item in raw.get('Results', []):
        rank = item.get('RankId')
        pts  = round(item.get('Points', 0))
        info = (item.get('TeamInfo') or [{}])[0]
        code = info.get('Abbreviation') or info.get('IdCountry', '')
        name = info.get('Name', code)

        num_id, iso2, canon = resolve(code, name)
        if num_id is None or num_id in seen_ids:
            continue
        seen_ids.add(num_id)
        rankings.append({'id': num_id, 'rank': rank, 'pts': pts, 'iso2': iso2, 'name': canon})

    return sorted(rankings, key=lambda x: x['rank'])


def main():
    print('Fetching FIFA rankings…')
    try:
        raw = fetch_rankings()
    except Exception as e:
        print(f'Fetch failed: {e}', file=sys.stderr)
        sys.exit(1)

    rankings = parse(raw)
    print(f'Parsed {len(rankings)} nations.')

    today    = date.today().isoformat()
    new_data = {'updated': today, 'source': 'FIFA.com', 'rankings': rankings}

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
