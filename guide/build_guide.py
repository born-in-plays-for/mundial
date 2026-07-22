#!/usr/bin/env python3
"""
Build the user guide.

Steps:
  1. Capture screenshots via Playwright (uses the dev server on port 4040)
  2. Build per-language, per-section Markdown files via i18n marker substitution

Usage:
  python3 guide/build_guide.py            # screenshots + all sections + all languages
  python3 guide/build_guide.py --no-screenshots  # languages only (faster)

Output: guide/built/{lang}-{section}.md  for each language × section combination.

Requirements:
  pip install playwright
  playwright install chromium
"""

import argparse
import json
import re
from pathlib import Path

GUIDE_DIR   = Path(__file__).resolve().parent
SCREENSHOTS = GUIDE_DIR / 'screenshots'
BUILT       = GUIDE_DIR / 'built'
I18N_DIR    = GUIDE_DIR / 'i18n'
LANGUAGES   = ['fr', 'de', 'it', 'es']
BASE_URL    = 'http://localhost:4040'

# Section name → source template. 'map' is the single real page-tied guide topic (see
# js/guide-mode.js's own _GUIDE_IDS comment) — 'players'/'france'/'live' were WIP placeholders
# with no real content and are gone for good. 'api' and 'data' are no longer independently
# openable panels; js/guide-mode.js fetches and renders them as two of 'map''s own tabs
# (API Guide, Data Sources), each still built as its own file here for i18n-marker clarity.
# 'auth' is real content again (offline/no-server-connection help, reachable via the profile
# icon). 'default' is the single shared fallback for any page with no guide topic of its own.
GUIDES = {
    'map':        GUIDE_DIR / 'guide-map.md',
    'api':        GUIDE_DIR / 'guide-api.md',
    'data':       GUIDE_DIR / 'guide-data-sources.md',
    'auth':       GUIDE_DIR / 'guide-auth.md',
    'default':    GUIDE_DIR / 'guide-default.md',
    # No i18n/*.json entries for this one, deliberately — English-only, every language build
    # just passes the source through unchanged (no <!-- i18n:... --> markers to substitute).
    'discipline': GUIDE_DIR / 'guide-discipline.md',
}

# Language → Playwright locale
LOCALES = [
    ('en', 'en-US'),
    ('fr', 'fr-FR'),
    ('de', 'de-DE'),
    ('it', 'it-IT'),
    ('es', 'es-ES'),
]

MARKER_RE = re.compile(
    r'(<!-- i18n:(\w+) -->)(.*?)(<!-- /i18n:\2 -->)',
    re.DOTALL,
)


# ── Screenshots ──────────────────────────────────────────────────────────────

def _screenshot_name(lang):
    """Return the filename for a language's control_sidebar screenshot."""
    return 'control_sidebar.png' if lang == 'en' else f'control_sidebar-{lang}.png'


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
        for lang, locale in LOCALES:
            context = browser.new_context(
                viewport={'width': 1280, 'height': 800},
                device_scale_factor=2,
                locale=locale,
            )
            page = context.new_page()
            page.goto(
                f'{BASE_URL}/wc2026_map.html',
                wait_until='networkidle',
                timeout=30_000,
            )
            page.wait_for_timeout(3_000)

            page.locator('.csb-toggle').click()
            page.wait_for_timeout(700)  # CSS transition
            # --csb-w/--csb-h (the panel's own rendered size) are measured once, early
            # (control_sidebar.js's measureControlSidebar, called during initSidebar's own
            # setup) and only re-measured on a real window resize — at that early point the
            # panel's content hasn't fully settled, so the stored size undersizes it and the
            # panel renders clipped (right/bottom edges cut off) until something actually
            # resizes the window. Dispatching one here forces a fresh, correct measurement
            # before capturing.
            page.evaluate("window.dispatchEvent(new Event('resize'))")
            page.wait_for_timeout(300)

            name = _screenshot_name(lang)
            page.locator('#control-sidebar').screenshot(path=str(SCREENSHOTS / name))
            print(f'  ✓ screenshots/{name}  [{locale}]')

            context.close()

        take_map_and_legend_screenshots(browser)
        take_bubbles_screenshot(browser)
        browser.close()


def take_map_and_legend_screenshots(browser):
    """Capture the default map (just the 48 qualified teams' flags) and the legend bar.

    English only, same rationale as take_bubbles_screenshot below — nothing here has
    per-locale text of its own.
    """
    # Taller than 800px — same reason as take_bubbles_screenshot below: the in-map legend sits
    # below the fold at 800px (off-screen, so its own screenshot comes out blank) since
    # #map-container's height is computed from the viewport.
    context = browser.new_context(viewport={'width': 1280, 'height': 1000}, device_scale_factor=2)
    page = context.new_page()
    # QB is the "all 48 qualified countries" group alias (see guide-api.md's own ?show=
    # reference) — narrows the filter to just the 48 qualified teams (the default load shows
    # every FIFA-member exporter too, ~67 countries per the infobar). No clicks needed, the
    # filter state is driven entirely by the URL param.
    page.goto(f'{BASE_URL}/wc2026_map.html?show=QB', wait_until='networkidle', timeout=30_000)
    page.wait_for_timeout(3_000)

    # The collapsed control-sidebar's own footer strip (country count) is fixed-position and
    # visually overlaps the map's screen region — locator.screenshot() captures actual rendered
    # pixels for that rectangle, not just #map's own DOM subtree, so whatever's on top bleeds in
    # regardless of ownership. Hidden here since it's irrelevant to this screenshot's purpose.
    page.evaluate("document.getElementById('control-sidebar').style.visibility = 'hidden'")

    # #map is the <world-map> element's own inner <svg> (see take_bubbles_screenshot's own
    # comment) — crops out the toggle bar, zoom controls, legend, and scroll hint.
    page.locator('#map').screenshot(path=str(SCREENSHOTS / 'qualified_flags.png'))
    print('  ✓ screenshots/qualified_flags.png')

    # The legend's own outliers (France/Curaçao) are computed from the full dataset, not the
    # ?show= filter above, so this is unaffected by it — captured in the same page for speed.
    page.locator('#legend').screenshot(path=str(SCREENSHOTS / 'legend.png'))
    print('  ✓ screenshots/legend.png')

    context.close()


def take_bubbles_screenshot(browser):
    """Capture the all-players table's birth-city bubbles map layer.

    English only — the "N players · M coaches" line has no localized text of its own,
    hardcoded English in the app itself unlike the rest of the UI — so there's nothing for
    per-locale variants to show that a single capture doesn't already cover.

    Used to also capture an "Intensity" toggle state (heatmap.png) here, back when
    #tab-players had a Bubbles/Intensity toggle — that raster layer moved permanently to its
    own standalone page (insights/heat-map.html) and #tab-players became "bubbles, always"
    with no toggle at all (see js/wc2026_map.js's own comment on _updateAllPlayersMapLayer),
    so there's no second mode left to capture here; guide-map.md's own "The Player Table"
    section only ever described/embedded the bubbles view anyway.
    """
    # Taller than the control_sidebar capture's 800px — #map-container's own height is computed
    # from the viewport (_syncMapHeight, reserving space for the fixed header/bottom tab bar); a
    # short viewport left the in-map legend rendered behind the fixed bottom bar in this element
    # screenshot.
    context = browser.new_context(viewport={'width': 1280, 'height': 1000}, device_scale_factor=2)
    page = context.new_page()
    page.goto(f'{BASE_URL}/wc2026_map.html', wait_until='networkidle', timeout=30_000)
    page.wait_for_timeout(3_000)

    page.locator('#tab-players-btn img').click()
    page.wait_for_timeout(500)
    # #map is the <world-map> element's own inner <svg> (its id is forwarded there directly —
    # see map-container.js's WorldMap.connectedCallback) — screenshotting it instead of
    # #map-container crops out the toggle bar, zoom controls, legend, and scroll-to-zoom hint
    # that sit alongside it, leaving just the map + bubbles themselves.
    page.locator('#map').screenshot(path=str(SCREENSHOTS / 'bubbles.png'))
    print('  ✓ screenshots/bubbles.png')

    context.close()


# ── Language builds ───────────────────────────────────────────────────────────

# Warn on structural/layout HTML in i18n values; allow inline formatting
_HTML_TAG_RE = re.compile(r'<(?!/?(?:em|strong|b|i|a|code|br)\b)[a-zA-Z/]')


def _resolve(value):
    """Accept a JSON string or array-of-lines; return a plain string."""
    if isinstance(value, list):
        return '\n'.join(value)
    return str(value)


def _localize_screenshots(text, lang):
    """Replace screenshot paths with language-specific versions where they exist."""
    localized = f'control_sidebar-{lang}.png'
    if (SCREENSHOTS / localized).exists():
        text = text.replace('screenshots/control_sidebar.png',
                            f'screenshots/{localized}')
    return text


def build_languages():
    BUILT.mkdir(exist_ok=True)

    # Load all translations once
    all_translations = {
        lang: json.loads((I18N_DIR / f'{lang}.json').read_text(encoding='utf-8'))
        if (I18N_DIR / f'{lang}.json').exists() else {}
        for lang in LANGUAGES
    }

    for section, template_path in GUIDES.items():
        template = template_path.read_text(encoding='utf-8')
        all_keys = MARKER_RE.findall(template)
        total    = len(all_keys)

        # English: symlink to source so edits are reflected instantly without a rebuild
        dest = BUILT / f'en-{section}.md'
        dest.unlink(missing_ok=True)
        dest.symlink_to(Path('..') / template_path.name)
        print(f'  ✓ built/en-{section}.md  ({total} marker blocks, symlink)')

        for lang in LANGUAGES:
            translations = all_translations[lang]
            warnings = []

            def replace(m, t=translations, w=warnings):
                open_tag, key, close_tag = m.group(1), m.group(2), m.group(4)
                if key in t:
                    translated = _resolve(t[key])
                    if _HTML_TAG_RE.search(translated):
                        w.append(f'    ⚠  {lang}.json [{key}] contains HTML tags — i18n values should be plain text/markdown only')
                    return f'{open_tag}\n{translated}\n{close_tag}'
                return m.group(0)

            result       = MARKER_RE.sub(replace, template)
            result       = _localize_screenshots(result, lang)
            n_translated = sum(1 for _, key, _, _ in all_keys if key in translations)
            (BUILT / f'{lang}-{section}.md').write_text(result, encoding='utf-8')
            status = f'  ✓ built/{lang}-{section}.md  ({n_translated}/{total} keys translated)'
            print(status)
            for w in warnings:
                print(w)


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
