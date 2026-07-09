// js/map-container.js
// Shared map infrastructure: <world-map> web component + exported constants.
// Both wc2026_map.js and insights pages import this to share the projection,
// zoom behaviour, and choropleth colour scale.
//
// Usage in HTML:
//   <world-map id="map" role="img" aria-label="..."></world-map>
//   The id (and aria-* attrs) are forwarded to the inner <svg>.
//
// After customElements.define() the element exposes:
//   .svg        — D3 selection of the inner <svg>
//   .g          — D3 selection of the transform <g> group
//   .projection — d3.geoNaturalEarth1 instance
//   .path       — d3.geoPath instance
//   .zoom       — D3 zoom behaviour (already called on svg)
//   .onZoom     — optional callback(e) for extra page-level zoom work

// ── Colour themes ───────────────────────────────────────────────────────────
// Each theme is its own lens on the data, not just a different palette on the
// same number: `metric` picks which figure a country is colored by, `ratioMax`
// is that metric's own 2nd-highest value (after `outlierIds`, same convention
// CLAUDE.md documents for the original export+native scale — bump it whenever
// that 2nd place grows past the current ceiling, or a country silently clamps
// to the darkest color instead of reflecting its real position) and
// `outlierIds` is whichever country tops THAT metric (it isn't always France —
// e.g. Curaçao dominates raw import count). A theme also bundles the few
// satellite colors that need to stay visually coordinated with its ramp (the
// loading-placeholder sphere/graticule drawn before world data arrives, and
// the no-data/outlier fills) — swapping themes should never again require
// hand-matching those, the way the ocean/placeholder mismatch had to be fixed
// by hand when the ramp first moved from violet to earthy. The ocean itself
// (real water, drawn once world data loads) deliberately stays out of the
// theme — it doesn't vary with the land palette.
//
// `rec` (as seen by `metric`) is an app.byId[] entry — see buildIndices() in
// wc2026_map.js for exactly which fields it carries (count/nativeCount/
// importCount today). Metrics fall back to 0 for a missing field rather than
// throwing, since insights/perf.html builds its own byId records and doesn't
// compute every field the main map does.
// ── Diverging scale (violet) — EASY TWEAKS ──────────────────────────────────
// Live-tunable at runtime via setDivergingParams()/getDivergingParams() below
// (see the #diverging-debug panel in wc2026_map.html for a slider/color-picker
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
};
export const getDivergingParams = () => ({ ..._divergingParams });
export const setDivergingParams = patch => {
  Object.assign(_divergingParams, patch);
  _buildPalettes(THEMES[_themeName]);
  if (THEMES[_themeName].diverging) _themeListeners.forEach(fn => fn(_themeName));
};
const _ease = (x, algo, exponent) => algo === 'smoothstep' ? x * x * (3 - 2 * x) : x ** exponent;
export const divergingOutlierColor = side => side === 'pos' ? _divergingParams.outlierRight : _divergingParams.outlierLeft;

export const THEMES = {
  earthy: {
    label: 'Earthy',
    // Terracotta/rust sand, not a neutral tan — warmer and redder at the dark end.
    ramp: ['#f7e8d9','#eccbae','#dba77e','#c67f52','#a35a34','#7a3f22','#4a2414'],
    // Lower than the 2 (quadratic) default — the default leans hard on staying
    // pale for most of the ratio range and only darkens near ratioMax, which
    // made most countries (clustered low-to-mid) look near-uniformly pale.
    // 1.4 still favors light overall but reaches the darker/mid ramp stops
    // sooner, so the dark-to-light transition (as the metric drops from
    // ratioMax) reads slower/more gradual instead of snapping pale immediately.
    ease: 1.4,
    // Imports — players born elsewhere now playing for this country. Curaçao
    // (id 531) tops this one, not France: its whole squad is Dutch-born.
    metric: rec => rec.importCount ?? 0,
    ratioMax: 21, // 2nd after Curaçao (26) — DR Congo
    outlierIds: new Set([531]),
    legendKey: 'imports', // T.legendMetric[legendKey] — #legend-born's description

    outlier: '#000',
    noData: '#e8e4e0',
    placeholderFill: '#f2ded0',
    placeholderStroke: '#c99872',
    graticule: '#e6c7ab',
  },
  violet: {
    label: 'Violet',
    // A genuine diverging scale, not a clamped-at-0 sequential one — net talent
    // balance (exports minus imports; natives deliberately excluded — a
    // country's own homegrown-and-still-there players don't represent a
    // talent flow either way, so including them just diluted the signal) is
    // signed and means something different on each side of 0: positive is a
    // net exporter (dominated by "born in"), negative a net importer
    // (dominated by "plays for", e.g. Curaçao at -26). Colors/easing live in
    // _divergingParams above (getDivergingParams()/setDivergingParams()), not
    // here — see the #diverging-debug panel for a live slider/color-picker UI.
    diverging: true,
    metric: rec => (rec.count ?? 0) - (rec.importCount ?? 0),
    ratioMaxPos: 42, // 2nd after France (78) — Netherlands
    ratioMaxNeg: 21, // 2nd after Curaçao (-26) — DR Congo
    outlierIdsPos: new Set([250]), // France — biggest net exporter
    outlierIdsNeg: new Set([531]), // Curaçao — biggest net importer
    legendKey: 'balance',
    noData: '#e8e4e0',
    // Neutral, not tinted toward either arm — shown only briefly before world
    // data loads, so it has no "diverging" meaning of its own to represent.
    placeholderFill: '#e8e6e0',
    placeholderStroke: '#c2c0ba',
    graticule: '#d8d6d0',
  },
  forest: {
    label: 'Forest',
    // Mossy/olive, not a vivid leaf green — desaturated on purpose so it reads
    // as muted and earthy rather than flashy at the mid-range greens.
    ramp: ['#eef1e4','#d7ddc2','#b9c294','#98a468','#76824a','#565f34','#33391e'],
    // Same rationale as earthy's ease above.
    ease: 1.4,
    // Exports only — players born here, playing elsewhere. The site's original
    // metric, pre-theme-system (was the *only* map, and included natives).
    metric: rec => rec.count ?? 0,
    ratioMax: 43, // 2nd after France (81) — Netherlands
    outlierIds: new Set([250]),
    legendKey: 'exports',

    outlier: '#000',
    noData: '#e8e4e0',
    placeholderFill: '#e9ecdd',
    placeholderStroke: '#a3ad7c',
    graticule: '#c7cdab',
  },
};

const _THEME_KEY = 'mundial-map-theme';
const _storedTheme = localStorage.getItem(_THEME_KEY);
let _themeName = THEMES[_storedTheme] ? _storedTheme : 'violet';

// Sequential themes cache one interpolator (_palette), built from that theme's
// own hand-picked `ramp` array via a multi-stop spline (interpolateRgbBasis).
// Diverging themes cache two (_posPalette/_negPalette, picked by value sign in
// color() below) and leave _palette null — each is just a live 2-point
// straight line (interpolateRgb, no spline, no intermediate stops) between
// _divergingParams.neutral and .easyLeft/.easyRight, so editing those (via
// setDivergingParams()) is instantly the whole story. Rebuilt here, inside
// setTheme() on every switch, and inside setDivergingParams() on every tweak.
let _palette = null, _posPalette = null, _negPalette = null;
const _buildPalettes = theme => {
  if (theme.diverging) {
    _posPalette = d3.interpolateRgb(_divergingParams.neutral, _divergingParams.easyRight);
    _negPalette = d3.interpolateRgb(_divergingParams.neutral, _divergingParams.easyLeft);
    _palette = null;
  } else {
    _palette = d3.interpolateRgbBasis(theme.ramp);
    _posPalette = _negPalette = null;
  }
};
_buildPalettes(THEMES[_themeName]);

// ── Shared colour scale ───────────────────────────────────────────────────────
// Per-theme exponent (default 2, quadratic) for sequential themes — see each
// theme's `ease` above; diverging themes use _divergingParams's
// algoLeft/algoRight + easeLeft/easeRight instead (via _ease() above).
// Magnitude only (0..1) — color() below picks which side's max/palette to use.
export const normalize = (v, theme = THEMES[_themeName]) => {
  if (theme.diverging) {
    // Shared max across both sides, not each side's own ratioMaxPos/Neg — the two ceilings
    // are wildly different (e.g. 42 vs 21), and normalizing each side against its own ceiling
    // made a country sitting at its side's own 2nd place reach full color saturation regardless
    // of how that magnitude compared to the other side: DR Congo at -21 (maxed out on ratioMaxNeg)
    // read as visually "as extreme" as Netherlands at +42 (maxed out on ratioMaxPos), even though
    // 42 is double 21 in real terms. A shared max means equal color intensity = equal real
    // magnitude on either side. ratioMaxPos/ratioMaxNeg themselves are unchanged and still drive
    // the legend's own tick *labels* and gradient domain (wc2026_map.js) — only the color mapping
    // uses the shared value.
    const neg = v < 0;
    const max = Math.max(theme.ratioMaxPos, theme.ratioMaxNeg);
    const x = Math.min(Math.abs(v), max) / max;
    return neg ? _ease(x, _divergingParams.algoLeft, _divergingParams.easeLeft)
               : _ease(x, _divergingParams.algoRight, _divergingParams.easeRight);
  }
  return (Math.max(0, v) / theme.ratioMax) ** (theme.ease ?? 2);
};
export const color = (v, theme = THEMES[_themeName]) => {
  const t = Math.max(0, Math.min(1, normalize(v, theme)));
  return theme.diverging ? (v >= 0 ? _posPalette : _negPalette)(t) : _palette(t);
};
export const choroFill = (id, byId) => {
  const theme = THEMES[_themeName];
  if (theme.diverging) {
    if (theme.outlierIdsPos.has(id)) return divergingOutlierColor('pos');
    if (theme.outlierIdsNeg.has(id)) return divergingOutlierColor('neg');
  } else if (theme.outlierIds.has(id)) {
    return theme.outlier;
  }
  const r = byId[id];
  return r ? color(theme.metric(r), theme) : theme.noData;
};

// Read these instead of caching a THEMES[...] lookup yourself, so callers
// always see the live value after setTheme().
export const themeName    = () => _themeName;
export const currentTheme = () => THEMES[_themeName];
export const themeNames   = () => Object.keys(THEMES);

// Notified after a successful setTheme() — map repaint, legend rebuild, etc.
// live outside this module, which only owns the color state itself.
const _themeListeners = new Set();
export const onThemeChange = fn => { _themeListeners.add(fn); return () => _themeListeners.delete(fn); };
export const setTheme = name => {
  if (!THEMES[name] || name === _themeName) return false;
  _themeName = name;
  _buildPalettes(THEMES[name]);
  localStorage.setItem(_THEME_KEY, name);
  _themeListeners.forEach(fn => fn(name));
  return true;
};

// ── Flag CDN helpers ──────────────────────────────────────────────────────────
export const FLAG_CDN      = code => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${code}.svg`;
export const FLAG_CDN_RECT = code => `https://cdn.jsdelivr.net/npm/flag-icons@7/flags/4x3/${code}.svg`;

// ── Flag sizing constants ─────────────────────────────────────────────────────
export const FLAG = 14;
export const DOT_R = 2;
// How much flag icons grow with zoom: 0 = fixed size, 1 = fully proportional
export const FLAG_SIZE_ZOOM_EXP   = 1/3;
// How much leader-line offset grows with zoom
export const FLAG_OFFSET_ZOOM_EXP = 2/3;

// ── Map dimensions ────────────────────────────────────────────────────────────
export const W = 900, H = 480;

// ── <world-map> web component ─────────────────────────────────────────────────
class WorldMap extends HTMLElement {
  connectedCallback() {
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    // Forward id and aria-* attrs from the custom element to the inner svg,
    // so CSS rules like `#map { … }` and aria-label continue to work.
    const fwdAttrs = [...this.attributes].filter(a => a.name === 'id' || a.name.startsWith('aria-') || a.name === 'role');
    fwdAttrs.forEach(a => { svgEl.setAttribute(a.name, a.value); this.removeAttribute(a.name); });

    svgEl.style.touchAction = 'none';
    svgEl.style.userSelect = 'none';
    this.appendChild(svgEl);

    this.svg        = d3.select(svgEl);
    this.projection = d3.geoNaturalEarth1().scale(152).translate([W/2, H/2 + 10]);
    this.path       = d3.geoPath(this.projection);

    const [[bx0, by0], [bx1, by1]] = this.path.bounds({type: 'Sphere'});
    this.svg.attr('viewBox', `${Math.floor(bx0)} ${Math.floor(by0)} ${Math.ceil(bx1-bx0)} ${Math.ceil(by1-by0)}`);

    this.g      = this.svg.append('g');
    this.onZoom = null;
    // Fires before the generic per-flag resize below — lets page code recompute a
    // flag's data-cx/data-cy for the CURRENT tick's k (e.g. wc2026_map.js's Cape
    // Verde inset, whose anchor point is itself a function of k) with no 1-frame lag.
    this.onZoomPre = null;

    this.zoom = d3.zoom().scaleExtent([1, 18]).on('zoom', e => {
      if (this.onZoomPre) this.onZoomPre(e);
      this.g.attr('transform', e.transform);

      const s = FLAG / Math.pow(e.transform.k, 1 - FLAG_SIZE_ZOOM_EXP);
      // .flag-fixed opts out — it lives inside a fixed-zoom inset (see wc2026_map.js's
      // buildFixedInset) that already counter-scales itself; x/y/width there are
      // local badge coordinates, not data-cx/data-cy world coordinates.
      this.svg.selectAll('.flag-qualified:not(.flag-fixed)')
        .attr('width', s).attr('height', s)
        .attr('x', function() { return +this.getAttribute('data-cx') - s/2; })
        .attr('y', function() { return +this.getAttribute('data-cy') - s/2; });

      this.svg.selectAll('.standalone-dot')
        .attr('r', DOT_R / e.transform.k)
        .attr('stroke-width', 0.5 / e.transform.k);

      this.svg.selectAll('.offset-flag').each(function() {
        const cx = +this.getAttribute('data-centroid-cx');
        const cy = +this.getAttribute('data-centroid-cy');
        const dx = +this.getAttribute('data-flag-dx');
        const dy = +this.getAttribute('data-flag-dy');
        d3.select(this)
          .attr('x', cx + dx / Math.pow(e.transform.k, FLAG_OFFSET_ZOOM_EXP) - s/2)
          .attr('y', cy + dy / Math.pow(e.transform.k, FLAG_OFFSET_ZOOM_EXP) - s/2);
      });

      this.svg.selectAll('.leader-line').each(function() {
        const cx = +this.getAttribute('data-centroid-cx');
        const cy = +this.getAttribute('data-centroid-cy');
        const dx = +this.getAttribute('data-flag-dx');
        const dy = +this.getAttribute('data-flag-dy');
        const k  = e.transform.k;
        d3.select(this)
          .attr('x2', cx + dx / Math.pow(k, FLAG_OFFSET_ZOOM_EXP))
          .attr('y2', cy + dy / Math.pow(k, FLAG_OFFSET_ZOOM_EXP))
          .attr('stroke-width', 2 / k)
          .attr('stroke-dasharray', `0,${3/k}`);
      });

      if (this.onZoom) this.onZoom(e);
    });

    this.svg.call(this.zoom);
  }
}

customElements.define('world-map', WorldMap);
