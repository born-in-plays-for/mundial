// js/diverging-scale.js
// The map's own color model — net talent balance — shared by map-container.js's
// choropleth painting (choroFill) and legend.js's gradient/ticks/outlier rendering.
// Neither of those two owns this: the legend merely visualizes the same scale the
// map is colored by, so the math lives here, independent of both.
//
// ── Colour scale — net talent balance ───────────────────────────────────────
// A genuine diverging scale, not a clamped-at-0 sequential one — net talent
// balance (exports minus imports; natives deliberately excluded — a country's
// own homegrown-and-still-there players don't represent a talent flow either
// way, so including them just diluted the signal) is signed and means
// something different on each side of 0: positive is a net exporter
// (dominated by "born in"), negative a net importer (dominated by "plays
// for", e.g. Curaçao at -26). `METRIC` picks the figure a country is colored
// by; `RATIO_MAX_POS`/`RATIO_MAX_NEG` are that metric's own 2nd-highest value
// on each side (after `OUTLIER_IDS_POS`/`OUTLIER_IDS_NEG` — bump either
// whenever that 2nd place grows past the current ceiling, or a country
// silently clamps to the darkest color instead of reflecting its real
// position). `OUTLIER_IDS_POS`/`_NEG` is whichever country tops that side,
// carved out as its own standalone dot — only when its gap from 2nd place is
// large enough to justify it (France today; `OUTLIER_IDS_NEG` is currently
// empty — see its own comment on Curaçao, no longer big enough a gap from DR
// Congo to warrant one). A few satellite colors below need to stay visually
// coordinated with the ramp (the loading-placeholder sphere/graticule drawn
// before world data arrives, and the no-data fill) — the ocean itself (real
// water, drawn once world data loads) deliberately stays out of it, since it
// doesn't vary with the land palette.
//
// `rec` (as seen by `METRIC`) is an app.byId[] entry — see buildIndices() in
// index.js for exactly which fields it carries (count/nativeCount/
// importCount today). Falls back to 0 for a missing field rather than
// throwing, defensively — a byId built some other way than buildChoroplethIndex()
// (map-container.js) might not compute every field the main map does.
// ── Diverging scale — EASY TWEAKS ───────────────────────────────────────────
// Live-tunable at runtime via setDivergingParams()/getDivergingParams() below
// (see the #diverging-debug panel in index.html for a slider/color-picker
// UI over this exact API) — not baked-in constants, and no pre-baked gradient
// data (no array of hand-picked intermediate hex stops) backing this theme the
// way the sequential ramps below have either. The color for a given value v is
// computed live, right here, as a straight RGB line from `neutral` (at v = 0)
// to `easyLeft`/`easyRight` (whichever side v falls on, reached in full at
// that side's own ratioMaxNeg/ratioMaxPos — see the violet theme entry below),
// positioned along that line at t = ease(|v| / max). That's the entire
// algorithm — see _buildPalettes()/normalize()/_ease() further down, there's
// no other step.
//   - easyLeft / easyRight: the color at each side's extreme.
//   - algoLeft / algoRight: 'power' (t = x**exponent — exponent <1 reaches
//     that color quickly and stays there for most of the range, only fading
//     near 0 right at the end; >1 is the reverse, staying close to `neutral`
//     for most of the range; 1 = plain linear) or 'smoothstep' (a fixed S-curve
//     easing in and out, ignores the exponent).
//   - easeLeft / easeRight: the exponent power mode uses.
//   - outlierLeft / outlierRight: the outlier dot color for each side —
//     independent fields (not auto-derived from easyLeft/easyRight), so they
//     have their own controls in #diverging-debug and don't silently drift
//     if you change easyLeft/easyRight afterward.
// All 8 values below were tuned live via #diverging-debug and logged to the
// console from there — see that panel to keep iterating.
let _divergingParams = {
  neutral:      '#e0e0e0',
  easyLeft:     '#ff0000', // negative extreme — "plays for" (import), red
  easyRight:    '#0000ff', // positive extreme — "born in" (export), blue
  outlierLeft:  '#bf0000',
  outlierRight: '#0000bf',
  algoLeft:     'power',
  algoRight:    'power',
  easeLeft:     2.0,
  easeRight:    2.0,
  // Two genuinely separate gradients meeting at a hard jump on either side of v=0, not one
  // continuous function that merely approaches neutral as v→0. Without a floor, a power curve
  // is ~flat near x=0 (x=1/42 eased at exponent 2 is ~0.0006 of the way to full color) — v=1
  // and v=-1 were visually indistinguishable from true 0. floorLeft/floorRight is the minimum
  // fraction of the way to the full-strength color that ANY nonzero v on that side starts at,
  // however small — only the exact value 0 itself renders as pure `neutral`.
  floorLeft:    0.06,
  floorRight:   0.06,
};
export const getDivergingParams = () => ({ ..._divergingParams });
export const setDivergingParams = patch => {
  Object.assign(_divergingParams, patch);
  _buildPalettes();
  _paletteListeners.forEach(fn => fn());
};
const _ease = (x, algo, exponent) => algo === 'smoothstep' ? x * x * (3 - 2 * x) : x ** exponent;
export const divergingOutlierColor = side => side === 'pos' ? _divergingParams.outlierRight : _divergingParams.outlierLeft;

// Net talent balance (exports minus imports — see the header comment above): the one metric
// the choropleth/legend has colored by since the multi-theme system (earthy/forest exports-only
// and imports-only palettes, plus runtime theme-switching) was retired as unused scaffolding.
export const METRIC = rec => (rec.count ?? 0) - (rec.importCount ?? 0);
export const RATIO_MAX_POS = 42; // 2nd after France (78) — Netherlands
// Curaçao's own value (-26), not a "2nd place excluding the outlier" figure — unlike France
// (78 vs 42, a 36-point gap from 2nd place), Curaçao's own gap from DR Congo's 21 was only 5,
// not enough to justify carving it out as its own standalone dot the way France's real outlier
// status does. Folded into the ordinary gradient/rug-plot instead — see OUTLIER_IDS_NEG below.
export const RATIO_MAX_NEG = 26;
export const OUTLIER_IDS_POS = new Set([250]); // France — biggest net exporter
// Empty, not Curaçao — see RATIO_MAX_NEG's own comment above. The mechanism itself stays generic
// (choroFill/updateOutlier/_xToValue all still branch on OUTLIER_IDS_NEG.size, not hardcoded to
// "there is always a negative outlier"), so a future negative outlier can be designated here
// again the same way France already is, without touching any of that logic.
export const OUTLIER_IDS_NEG = new Set();
export const NO_DATA_COLOR = '#e8e4e0';
// Neutral, not tinted toward either arm — shown only briefly before world data loads, so it has
// no diverging meaning of its own to represent.
export const PLACEHOLDER_FILL = '#e8e6e0';
export const PLACEHOLDER_STROKE = '#c2c0ba';
export const GRATICULE_COLOR = '#d8d6d0';

// Two interpolators, picked by value sign in color() below — each just a live 2-point straight
// line (interpolateRgb, no spline, no intermediate stops) between _divergingParams.neutral and
// .easyLeft/.easyRight, so editing those (via setDivergingParams()) is instantly the whole
// story. Rebuilt here at module load, and inside setDivergingParams() on every live tweak.
let _posPalette, _negPalette;
const _buildPalettes = () => {
  _posPalette = d3.interpolateRgb(_divergingParams.neutral, _divergingParams.easyRight);
  _negPalette = d3.interpolateRgb(_divergingParams.neutral, _divergingParams.easyLeft);
};
_buildPalettes();

// ── Shared colour scale ───────────────────────────────────────────────────────
// _divergingParams's algoLeft/algoRight + easeLeft/easeRight drive the easing curve (via
// _ease() above). Magnitude only (0..1) — color() below picks which side's palette to use.
export const normalize = v => {
  // Shared max across both sides, not each side's own RATIO_MAX_POS/NEG — the two ceilings
  // are wildly different (42 vs 26), and normalizing each side against its own ceiling made a
  // country sitting at its side's own ceiling reach full color saturation regardless of how
  // that magnitude compared to the other side: Curaçao at -26 (maxed out on RATIO_MAX_NEG)
  // would read as visually "as extreme" as Netherlands at +42 (maxed out on RATIO_MAX_POS), even
  // though 42 is well past 26 in real terms. A shared max means equal color intensity = equal
  // real magnitude on either side. RATIO_MAX_POS/NEG themselves are unchanged and still drive
  // the legend's own tick *labels* and gradient domain (legend.js) — only the color mapping
  // uses the shared value.
  if (v === 0) return 0; // the only value that renders as pure `neutral` — see floorLeft/Right above
  const neg = v < 0;
  const max = Math.max(RATIO_MAX_POS, RATIO_MAX_NEG);
  const x = Math.min(Math.abs(v), max) / max;
  const floor = neg ? _divergingParams.floorLeft : _divergingParams.floorRight;
  const eased = neg ? _ease(x, _divergingParams.algoLeft, _divergingParams.easeLeft)
                     : _ease(x, _divergingParams.algoRight, _divergingParams.easeRight);
  // Two separate gradients meeting at a jump on v=0, not one continuous curve through it — any
  // nonzero v starts at `floor` (already visibly tinted) instead of asymptotically approaching
  // 0 the way a bare eased(x) does for small x.
  return floor + (1 - floor) * eased;
};
export const color = v => {
  const t = Math.max(0, Math.min(1, normalize(v)));
  return (v >= 0 ? _posPalette : _negPalette)(t);
};

// Notified after a live setDivergingParams() tweak — map repaint, legend rebuild, etc. live
// outside this module, which only owns the color state itself.
const _paletteListeners = new Set();
export const onPaletteChange = fn => { _paletteListeners.add(fn); return () => _paletteListeners.delete(fn); };
