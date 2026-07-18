# SVG Inventory

All SVG assets used across the UI. Source files live in `images/` and `images/solar_linear/`.

---

## 1. Inline SVG — `js/auth-bar.js`

SVG path data is inlined as JS string constants and rendered via `unsafeHTML`. Each maps to a source file in `images/solar_linear/`.

| Constant | Source file | Description | Used for |
|---|---|---|---|
| `ICON_HOME` | `solar_linear/earth-svgrepo-com.svg` | Earth | Map page nav link |
| `ICON_LIVE` | `solar_linear/tv-svgrepo-com.svg` | TV/gamepad | Live page nav link |
| `ICON_FRANCE` | `solar_linear/france-svgrepo-com.svg` | France outline | France page nav link |
| `ICON_RANKINGS` | `solar_linear/ranking-svgrepo-com.svg` | Ranking | Rankings nav link |
| `ICON_GUIDE` | `solar_linear/help-svgrepo-com.svg` | Crosshair/compass | Guide toggle button |
| `ICON_MENU_DOTS` | `solar_linear/menu-dots-svgrepo-com.svg` | Three horizontal dots | Dropdown menu toggle |
| `ICON_LOGIN` | `solar_linear/square-bottom-up-svgrepo-com.svg` | Square Bottom Up  | Sign-in button |
| `ICON_LOGOUT` | `solar_linear/square-bottom-down-svgrepo-com.svg` | Square Bottom Down  | Sign-out button |
| `WA_ICON` | *(custom — no source file)* | WhatsApp logo, `#25D366` fill | Offline contact link |
| `ICON_SERVER_OFF` | `images/settings-off-svgrepo-com.svg` *(custom — gear from `solar_linear/settings-svgrepo-com.svg` + crossing bar)* | Gear with diagonal slash, Bootstrap info `#0dcaf0` | Offline badge — `server` category (backend not configured) |
| `ICON_DB_ERROR` | `images/database-error-svgrepo-com.svg` | Database stack with `!`, Bootstrap info `#0dcaf0` stroke | Offline badge — `connection` category (internet OK, backend unreachable) |
| `ICON_WIFI_OFF` | `images/wifi-off-svgrepo-com.svg` | Wifi signal with diagonal slash, Bootstrap info `#0dcaf0` fill | Offline badge — `offline` category (no internet at all) |

---

## 2. Inline SVG — `js/guide-mode.js`

Custom geometric shapes, no source file.

| Constant | Description | Used for |
|---|---|---|
| `_ARROW_BLUE` | Horizontal arrow, `#3b82f6`, pointing right | Guide annotation arrows |
| `_ARROW_RED` | Horizontal arrow, `#ef4444`, pointing left | Guide annotation arrows |

---

## 3. Inline SVG — `wc2026_map.html`

| Location | Description | Source file |
|---|---|---|
| `#scroll-top-btn` (line 93) | Chevron-up `∧`, `stroke="currentColor"` | *(custom — no source file)* |

---

## 4. Inline SVG — `guide.html`

| Location | Description | Source file |
|---|---|---|
| Line 17 | GitHub Octocat logo, `fill="currentColor"` | *(custom — no source file)* |

---

## 5. `<img>` tags — `wc2026_map.html`

| Element | Source file | Description |
|---|---|---|
| `#zoom-reset` button | `solar_linear/global-svgrepo-com.svg` | Globe — reset zoom |
| `#zoom-span` button | `solar_linear/maximize-square-2-svgrepo-com.svg` | Expand — span linked flags |
| `#tab-elo-btn` tab icon | `solar_linear/elo_tab_cup.svg` | Trophy cup — Elo ranking tab |
| `#tab-chain-btn` tab icon | `wc2026.svg` | Chain graph — chains tab |

---

## 6. `<img>` tags — `js/control_sidebar.js` (lit-html template)

| Element | Source file | Description |
|---|---|---|
| `#zoom-conf-dropdown` button | `solar_linear/widget-5-svgrepo-com.svg` | Widget grid — confederation filter |

---

## 7. `<img>` tags — `wc2026_live.html`

| Element | Source file | Description |
|---|---|---|
| API-Football logo | `images/api_sports.svg` | API-Football service logo |

---

## 8. CSS background-image — `css/control-sidebar.css`

| Selector | Source file | Description |
|---|---|---|
| `.csb-sort-dir` (default) | `images/sort-vertical-svgrepo-com.svg` | Bidirectional sort arrows |
| `.csb-sort-dir` (asc state) | `images/sort-vertical-asc.svg` | Ascending sort arrow |

---

## 9. CSS mask — `css/taxonomy.css`

| Selector | Source file | Description |
|---|---|---|
| `.elo-flag-wrap::after` (fixture winner) | `images/green-check-mark-icon.svg` | Green check — masked, not background-image'd, so CSS controls the color |

---

## Source files not currently referenced in UI

`images/root-level` unused files were removed (2026-07-08) — `api_sports_svgo-ed.svg`, `chain_tab_icon.svg`,
`check-svgrepo-com.svg` (superseded by `green-check-mark-icon.svg`), `elo_tab_color_icon.svg`, `elo_tab_icon.svg`,
`empty_tab_icon.svg`, `france-vector-svgrepo-com.svg`, `home-4-svgrepo-com.svg`, `info-circle-svgrepo-com2.svg`,
`Schrödinger.avif`, `tombstone-svgrepo-com.svg`, `world-cup-svgrepo-com.svg`, `zoom-svgrepo-com.svg`. (This
inventory had incorrectly listed `shield-warning-svgrepo-com.svg`'s root copy as unused — it's actually
referenced directly by filename in `wc2026_live.html`'s `setBadge()` calls.)

`solar_linear/` unused files were intentionally left as-is (kept for the icon collection's own sake):

| File | Description |
|---|---|
| `solar_linear/settings-svgrepo-com.svg` | Settings gear |
| `solar_linear/login-2-svgrepo-com.svg` | Login (variant 2) |
| `solar_linear/power-svgrepo-com.svg` | Power button |
| `solar_linear/radio-minimalistic-svgrepo-com.svg` | Radio |
| `solar_linear/link-svgrepo-com.svg` | Link/chain |
| `solar_linear/gamepad-svgrepo-com.svg` | Gamepad |
| `solar_linear/plug-circle-svgrepo-com.svg` | Plug/connection |
| `solar_linear/logout-2-svgrepo-com.svg` | Logout (variant 2) |
| `solar_linear/graph-up-svgrepo-com.svg` | Graph up (was `ICON_COURSE_UP`'s attribution — insights/perf.html and its dropdown link were removed) |
