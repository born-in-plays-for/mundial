#!/usr/bin/env python3
"""
Regenerate the Open Graph preview image (wc2026_og_v<N>.jpg).

Requires the local dev server on port 4040 (see CLAUDE.md — do not start a new one).

Usage:
  python3 tools/regenerate_og_image.py v7

After running, you still need to (not done by this script):
  1. Update og:image / og:image:url / og:image:secure_url in index.html and wc2026_map.html
  2. git rm the previous wc2026_og_v<N-1>.jpg
  3. Re-scrape the LinkedIn Post Inspector and Facebook Sharing Debugger after deploy

Resolution history: v5 shipped at device_scale_factor=1 (1440x810) and looked soft/blurred
on LinkedIn/Facebook previews — fixed by bumping to device_scale_factor=2 (2880x1620,
commit fbab53d). v7 bumped again to device_scale_factor=3 (4320x2430) + jpeg quality 95
after the same blurriness recurred on the Facebook Sharing Debugger at dpr=2. Do not
regress either value in a future edit of this script.
"""

import sys
from playwright.sync_api import sync_playwright

VIEWPORT = {"width": 1440, "height": 810}
DEVICE_SCALE_FACTOR = 3  # -> 4320x2430 output. Do not drop below 2 (see module docstring).
JPEG_QUALITY = 95


def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python3 tools/regenerate_og_image.py v<N>  (e.g. v7)")
    version = sys.argv[1]
    out_path = f"wc2026_og_{version}.jpg"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport=VIEWPORT, device_scale_factor=DEVICE_SCALE_FACTOR)
        page.goto("http://localhost:4040/wc2026_map.html", wait_until="load", timeout=30000)
        page.wait_for_timeout(4000)

        # Select quote index 1 ("Heureux qui, comme Olise, a fait un beau voyage.")
        page.evaluate('''() => {
            const dot = document.querySelector('.pq-dot[data-idx="1"]');
            if (dot) dot.click();
        }''')
        page.wait_for_timeout(500)

        # Click France flag to activate dim/arc mode
        page.evaluate('''() => {
            const flag = document.querySelector('image.flag-qualified[data-id="250"]');
            if (flag) flag.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        }''')
        page.wait_for_timeout(2000)

        # Hover France path center to show the combined tooltip
        page.evaluate('''() => {
            const path = document.querySelector('path[data-id="250"]');
            if (path) {
                const rect = path.getBoundingClientRect();
                const cx = rect.x + rect.width / 2;
                const cy = rect.y + rect.height / 2;
                path.dispatchEvent(new MouseEvent("mouseover", { bubbles: true, clientX: cx, clientY: cy }));
                path.dispatchEvent(new MouseEvent("mousemove", { bubbles: true, clientX: cx, clientY: cy }));
            }
        }''')
        page.wait_for_timeout(1500)

        page.screenshot(path=out_path, type="jpeg", quality=JPEG_QUALITY)
        browser.close()

    print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
