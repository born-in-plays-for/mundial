#!/usr/bin/env python3
"""
Capture the two confederation-wheel diagrams from insights/taxonomy.html as standalone
images — just the SVG itself, no page chrome/carousel controls/legend.

Requires the local dev server on port 4040 (see CLAUDE.md — do not start a new one).

Usage:
  python3 tools/capture_taxonomy_diagrams.py

Each <svg> is captured directly via Playwright's own element screenshot (clipped to that
element's rendered box), unlike regenerate_og_image.py's full-page-then-measure-then-crop
technique — that approach existed there to deal with a fixed footer and page chrome that
needed collapsing/measuring first; here both SVGs already render as clean standalone
elements, so no cropping step is needed.

Uses device_scale_factor=3 for crispness (same floor established in regenerate_og_image.py's
own blur-regression history — see that script's docstring) but skips its downsample-after-
capture step: that resize-before-serving was specifically to counter LinkedIn/Facebook's own
re-compression of the OG image on their end, which doesn't apply to a plain PNG saved locally.
PNG rather than JPEG, since this is flat-color/line/text diagram content, not a photo — JPEG's
compression artifacts show up worst exactly on sharp text edges and thin strokes like these.
"""

from playwright.sync_api import sync_playwright

URL = "http://localhost:4040/insights/taxonomy.html"
DEVICE_SCALE_FACTOR = 3
OUT_COUNT = "insights/taxonomy-by-country.png"
OUT_POP = "insights/taxonomy-by-population.png"


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": 1100, "height": 1100},
            device_scale_factor=DEVICE_SCALE_FACTOR,
        )
        page.goto(URL, wait_until="load", timeout=30000)

        # Both slides are rendered up front on load (taxonomy.html's own module script calls
        # renderDiagram() for both immediately after its two fetches resolve) — just needs
        # that to finish before the DOM has real content to screenshot. Every flag <image> in
        # both diagrams is a separate CDN fetch (circle-flags@2) kicked off at once; a fixed
        # short timeout caught most of them but not all (a first attempt at 300ms silently
        # dropped several flags in the exported image) — wait for the network to actually go
        # quiet instead of guessing a duration.
        page.wait_for_selector("#wheel-svg-count image")
        page.wait_for_load_state("networkidle")

        # Bootstrap's carousel-control-prev/-next are 15% of the carousel's own width by
        # default (132px here) — much wider than the 44px padding gutter taxonomy.html gives
        # them, so their clickable zone (and visible chevron) still reaches into the diagram's
        # own area. Hiding them for the capture only, rather than shrinking them on the live
        # page (where that 15% width is a real, intentional click target).
        page.add_style_tag(content=".carousel-control-prev, .carousel-control-next, .carousel-indicators { display: none !important; }")

        page.locator("#wheel-svg-count").screenshot(path=OUT_COUNT)
        print(f"wrote {OUT_COUNT}")

        # The population slide isn't the active .carousel-item yet — the indicator button
        # that would normally switch it is hidden now (see above), so drive Bootstrap's own
        # Carousel instance directly instead of clicking a DOM element.
        page.evaluate("bootstrap.Carousel.getOrCreateInstance(document.getElementById('wheel-carousel')).to(1)")
        page.wait_for_timeout(700)

        page.locator("#wheel-svg-pop").screenshot(path=OUT_POP)
        print(f"wrote {OUT_POP}")

        browser.close()


if __name__ == "__main__":
    main()
