#!/usr/bin/env python3
"""
Build the user guide.

Steps:
  1. Capture screenshots via Playwright (uses the dev server on port 4040)
  2. Build per-language Markdown files via i18n marker substitution

Usage:
  python3 guide/build_guide.py            # screenshots + all languages
  python3 guide/build_guide.py --no-screenshots  # languages only (faster)

Requirements:
  pip install playwright
  playwright install chromium
"""

import argparse
import json
import re
import shutil
from pathlib import Path

GUIDE_DIR   = Path(__file__).resolve().parent
SCREENSHOTS = GUIDE_DIR / 'screenshots'
BUILT       = GUIDE_DIR / 'built'
I18N_DIR    = GUIDE_DIR / 'i18n'
TEMPLATE    = GUIDE_DIR / 'guide.md'
LANGUAGES   = ['fr', 'de', 'it', 'es']
BASE_URL    = 'http://localhost:4040'

MARKER_RE = re.compile(
    r'(<!-- i18n:(\w+) -->)(.*?)(<!-- /i18n:\2 -->)',
    re.DOTALL,
)


# ── Screenshots ──────────────────────────────────────────────────────────────

def take_screenshots():
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('  ! Playwright not installed — skipping screenshots.')
        print('    pip install playwright && playwright install chromium')
        return

    SCREENSHOTS.mkdir(exist_ok=True)
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=2)
        page.goto(
            f'{BASE_URL}/wc2026_map_exported.html',
            wait_until='networkidle',
            timeout=30_000,
        )
        page.wait_for_timeout(3_000)

        # ── control_sidebar ──
        page.locator('.csb-toggle').click()
        page.wait_for_timeout(700)  # CSS transition
        page.locator('#control-sidebar').screenshot(
            path=str(SCREENSHOTS / 'control_sidebar.png')
        )
        print('  ✓ screenshots/control_sidebar.png')

        browser.close()


# ── Language builds ───────────────────────────────────────────────────────────

def _resolve(value):
    """Accept a JSON string or array-of-lines; return a plain string."""
    if isinstance(value, list):
        return '\n'.join(value)
    return str(value)


def build_languages():
    BUILT.mkdir(exist_ok=True)
    template = TEMPLATE.read_text(encoding='utf-8')
    all_keys = MARKER_RE.findall(template)
    total    = len(all_keys)

    en_path = BUILT / 'en.md'
    shutil.copy(TEMPLATE, en_path)
    print(f'  ✓ built/en.md  (= guide.md, {total} marker blocks)')

    for lang in LANGUAGES:
        path         = I18N_DIR / f'{lang}.json'
        translations = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}

        def replace(m, t=translations):
            open_tag, key, _, close_tag = m.group(1), m.group(2), m.group(3), m.group(4)
            if key in t:
                return f'{open_tag}\n{_resolve(t[key])}\n{close_tag}'
            return m.group(0)  # untranslated → keep English

        result       = MARKER_RE.sub(replace, template)
        n_translated = sum(1 for _, key, _, _ in all_keys if key in translations)
        (BUILT / f'{lang}.md').write_text(result, encoding='utf-8')
        print(f'  ✓ built/{lang}.md  ({n_translated}/{total} keys translated)')


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument('--no-screenshots', action='store_true',
                        help='skip Playwright screenshot capture')
    args = parser.parse_args()

    if not args.no_screenshots:
        print('▶ Screenshots …')
        take_screenshots()

    print('▶ Building language files …')
    build_languages()
    print('Done.')
