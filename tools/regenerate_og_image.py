#!/usr/bin/env python3
"""
Regenerate the Open Graph preview image (wc2026_og_v<N>.jpg).

Requires the local dev server on port 4040 (see CLAUDE.md — do not start a new one).

Usage:
  python3 tools/regenerate_og_image.py v8

After running, you still need to (not done by this script):
  1. Update og:image / og:image:url / og:image:secure_url / og:image:width / og:image:height
     in index.html
  2. git rm the previous wc2026_og_v<N-1>.jpg
  3. Update the wc2026_og_v<N>.jpg row in CLAUDE.md's file-structure table (dimensions +
     composition description)
  4. Re-scrape the LinkedIn Post Inspector and Facebook Sharing Debugger after deploy

Resolution history: v5 shipped at device_scale_factor=1 (1440x810) and looked soft/blurred
on LinkedIn/Facebook previews — fixed by bumping to device_scale_factor=2 (2880x1620,
commit fbab53d). v7 bumped again to device_scale_factor=3 (4320x2430) + jpeg quality 95
after the same blurriness recurred on the Facebook Sharing Debugger at dpr=2.

v8 changes the composition (Spain instead of France). Two knobs control the empty margins:

- CAPTURE_WIDTH: #map-container/#page-header's Bootstrap `container-xxl` has a fixed
  max-width (1320px past the 1400px breakpoint) — a wider viewport leaves proportionally
  bigger left/right margins around it. 1700 leaves ~11% each side (a first attempt at 2560,
  matching a reference screenshot from a wide desktop window, left ~24% margins each side —
  too much once compared side by side; 1700 is the trimmed-down version of that idea).
- CAPTURE_HEIGHT is *measured*, not guessed: #bottom-panel (the flag/input/account footer)
  is `position:fixed; bottom:0`, so it always sits at the viewport's own bottom regardless of
  how tall the real content above it is — a guessed viewport height (e.g. a round 16:9 number)
  just leaves dead space between the team-pill list and the footer. This script does a first
  pass at a generously tall viewport, measures where the content actually ends
  (#bottomTabContent's bottom + #bottom-panel's own height), then resizes the viewport to
  exactly that before the real screenshot. Shrinking viewport height doesn't affect the map's
  own size — #map is width:100%;height:auto (aspect-ratio-driven from its SVG viewBox, not
  stretched to fill the viewport) on desktop, so this only trims the dead space below it.

Capturing wider/taller than the final output grows the final file, so v8 still captures at
DEVICE_SCALE_FACTOR=3 for the same proven crispness (do not drop below 2 — see history above)
and then downsamples with Pillow (LANCZOS) to OUTPUT_WIDTH, preserving whatever aspect ratio
the measured content produced — supersample-then-shrink stays sharp, unlike capturing natively
at a smaller size/dpr, which is what caused the v5/v6 blurring in the first place. Do not skip
the downsample step by lowering DEVICE_SCALE_FACTOR or CAPTURE_WIDTH directly.
"""

import sys
from io import BytesIO

from PIL import Image
from playwright.sync_api import sync_playwright

CAPTURE_WIDTH = 1700
PROBE_HEIGHT = 1600  # generously tall first pass, just to measure real content height — never shipped.
BOTTOM_PAD = 10  # small breathing room between the pill list and the fixed footer.
DEVICE_SCALE_FACTOR = 3  # Do not drop below 2 (see module docstring's blur-regression history).
OUTPUT_WIDTH = 1600  # final, downsampled from the raw capture — do not capture at this size directly.
JPEG_QUALITY = 95

SPAIN_ID = 724

# Reproduces a full click path from a URL alone (see CLAUDE.md's "?select=" section):
# sort by Elo delta then population, group-stage carousel position, non-qualified FIFA
# members shown, no confederation filter, all four player-role columns, Spain dim-selected.
START_URL = (
    "http://localhost:4040/index.html"
    "?sort=delta,pop&dir=desc&stage=group&show=QB&fifaconf="
    "&pshow=export,native,import,player,coach&select=es"
)


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python3 tools/regenerate_og_image.py v<N>  (e.g. v8)")
    version = sys.argv[1]
    out_path = f"wc2026_og_{version}.jpg"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(
            viewport={"width": CAPTURE_WIDTH, "height": PROBE_HEIGHT},
            device_scale_factor=DEVICE_SCALE_FACTOR,
        )
        page.goto(START_URL, wait_until="load", timeout=30000)
        page.wait_for_timeout(4000)

        # Any control-sidebar URL param (sort/dir/stage/show/fifaconf/pshow, all present here)
        # force-expands #control-sidebar (js/control_sidebar.js's applyParams) — appropriate for
        # a real visitor following a shared link, but not for a clean composition shot. Collapse
        # it back before screenshotting.
        page.click(".csb-toggle")
        page.wait_for_timeout(500)

        # ?select=es already dim-selected Spain and ran its own auto-zoom — replace that with
        # #zoom-span's "fit every currently visible flag" framing (wider, arcs-and-all view).
        page.click("#zoom-span")
        page.wait_for_timeout(1800)

        # Hover the Spain flag itself (not its country path) to show its own two-column
        # export+import tooltip (js/index.js's showExportTip — Spain is the dim source, so
        # this already covers both sides, same as the reference screenshot).
        page.evaluate(f'''() => {{
            const flag = document.querySelector('image.flag-qualified[data-id="{SPAIN_ID}"]');
            if (flag) {{
                const rect = flag.getBoundingClientRect();
                const cx = rect.x + rect.width / 2;
                const cy = rect.y + rect.height / 2;
                flag.dispatchEvent(new MouseEvent("mousemove", {{ bubbles: true, clientX: cx, clientY: cy }}));
            }}
        }}''')
        page.wait_for_timeout(1000)

        # Measure real content height (see module docstring) and shrink the viewport to match —
        # #bottom-panel is fixed to the viewport bottom, so trimming height here is what actually
        # closes the gap, rather than cropping pixels after the fact.
        content_bottom = page.evaluate('''() => {
            const content = document.querySelector('#bottomTabContent');
            const footer = document.querySelector('#bottom-panel');
            return content.getBoundingClientRect().bottom + footer.getBoundingClientRect().height;
        }''')
        final_height = min(PROBE_HEIGHT, round(content_bottom + BOTTOM_PAD))
        page.set_viewport_size({"width": CAPTURE_WIDTH, "height": final_height})
        page.wait_for_timeout(300)

        raw = page.screenshot(type="png")
        browser.close()

    im = Image.open(BytesIO(raw)).convert("RGB")
    output_height = round(im.height * OUTPUT_WIDTH / im.width)
    im.resize((OUTPUT_WIDTH, output_height), Image.LANCZOS).save(out_path, "JPEG", quality=JPEG_QUALITY)

    print(f"wrote {out_path} ({OUTPUT_WIDTH}x{output_height})")


if __name__ == "__main__":
    main()
