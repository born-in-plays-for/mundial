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

import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { unsafeHTML } from 'https://cdn.jsdelivr.net/npm/lit-html@3/directives/unsafe-html.js';
import { QUALIFIED_NAMES, QUALIFIED_BY_NAME, buildImportByCountry } from './qualified.js';
import { T, countryName } from './i18n.js';

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
// throwing, defensively — a byId built some other way than buildChoroplethIndex()
// (below) might not compute every field the main map does.
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
    // Only qualified countries have a squad to import players into — a
    // non-qualified country's importCount is always a trivial 0 (nothing to do
    // with actually having zero imports), so it must render as noData like any
    // other country with nothing to say, not share the ramp's own "0" color.
    qualifiedOnly: true,
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
    // Unlike earthy, no qualifiedOnly gate: a non-qualified country's
    // importCount of 0 is genuinely true (no squad to import into), not a
    // meaningless placeholder — so its net balance correctly reduces to its
    // own export count, same as forest.
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
let _themeName = /* THEMES[_storedTheme] ? _storedTheme : */ 'violet';

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
    if (v === 0) return 0; // the only value that renders as pure `neutral` — see floorLeft/Right above
    const neg = v < 0;
    const max = Math.max(theme.ratioMaxPos, theme.ratioMaxNeg);
    const x = Math.min(Math.abs(v), max) / max;
    const floor = neg ? _divergingParams.floorLeft : _divergingParams.floorRight;
    const eased = neg ? _ease(x, _divergingParams.algoLeft, _divergingParams.easeLeft)
                       : _ease(x, _divergingParams.algoRight, _divergingParams.easeRight);
    // Two separate gradients meeting at a jump on v=0, not one continuous curve through it —
    // any nonzero v starts at `floor` (already visibly tinted) instead of asymptotically
    // approaching 0 the way a bare eased(x) does for small x.
    return floor + (1 - floor) * eased;
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
  if (theme.qualifiedOnly && !QUALIFIED_NAMES[id]) return theme.noData;
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
  /*
  if (!THEMES[name] || name === _themeName) return false;
  _themeName = name;
  _buildPalettes(THEMES[name]);
  localStorage.setItem(_THEME_KEY, name);
  _themeListeners.forEach(fn => fn(name));
  */
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
// Birth-city dots (js/wc2026_map.js's _updatePlayerCityDots, marked with the .city-dot class
// alongside .standalone-dot): same 0=fixed/1=fully-proportional scale as FLAG_SIZE_ZOOM_EXP
// above, and same direction (grows with zoom) — start small at rest (whole-map view, many dots
// close together) and grow as you zoom into one city, rather than staying a constant pixel size.
// Every OTHER .standalone-dot (Cape Verde/Curaçao's own standalone flags) is untouched by this
// and keeps the plain 1/k counter-scale (constant on-screen size) it always had.
export const CITY_DOT_SIZE_ZOOM_EXP = 0.3;
export const cityDotRadius = (base, k) => base / Math.pow(k, 1 - CITY_DOT_SIZE_ZOOM_EXP);

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
    // 'meet' (the SVG default) letterboxes — shrinks the whole map to fit the box, adding
    // empty #map background bars, rather than 'slice' (object-fit:cover-equivalent, crops
    // overflow to fill the box) which reads as an unwanted auto-zoom whenever the box's own
    // aspect ratio drifts from the viewBox's — e.g. the #legend-parent drag-resize handle
    // below, which sets an explicit inline px height on #map. #map itself is
    // width:100%/height:auto in normal layout, so its box already matches the viewBox's own
    // aspect ratio there (nothing to crop or letterbox either way) — 'meet' only actually
    // does anything once something (the drag handle, or a restored localStorage height)
    // gives #map an explicit height. wc2026_map.js's resize listener switches this back to
    // 'slice' for the landscape-mobile fullscreen map (css/map-container.css forces #map to
    // width:100%/height:100% of a box with its own, unrelated aspect ratio there — deliberate
    // full-bleed cover, not the "user shrank the map" case this default is about).
    this.svg.attr('preserveAspectRatio', 'xMidYMid meet');

    this.g      = this.svg.append('g');
    this.onZoom = null;
    // Fires before the generic per-flag resize below — lets page code recompute a
    // flag's data-cx/data-cy for the CURRENT tick's k (e.g. wc2026_map.js's Cape
    // Verde inset, whose anchor point is itself a function of k) with no 1-frame lag.
    this.onZoomPre = null;

    // Upper bound raised (was 18) to let birth-city dot clusters (js/wc2026_map.js's
    // _updatePlayerCityDots) be pulled apart further — dot/flag on-screen size stays
    // constant (counter-scaled each tick below), only their world-space spacing grows
    // with k, so deeper zoom is what actually separates two cities sitting close together.
    this.zoom = d3.zoom().scaleExtent([1, 200]).on('zoom', e => {
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

      this.svg.selectAll('.standalone-dot:not(.city-dot)')
        .attr('r', function() { return (+this.getAttribute('data-r-base') || DOT_R) / e.transform.k; })
        .attr('stroke-width', 0.5 / e.transform.k);
      this.svg.selectAll('.standalone-dot.city-dot')
        .attr('r', function() { return cityDotRadius(+this.getAttribute('data-r-base') || DOT_R, e.transform.k); })
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

// ── Choropleth data index ───────────────────────────────────────────────────────
// Pure function: rawData (data/v2/map.json shape: {data, natives, pop, capital}) → the
// byId/nativeByCountry/importByCountry indices choroFill()/THEMES.*.metric read (count/
// nativeCount/importCount). Extracted from wc2026_map.js's buildIndices(), which layers
// more on top afterward (pop, totalCount, and the eloRank/capital fields the tooltip/
// player-table UI needs — none of that is choropleth-coloring-relevant, so it stays
// there rather than growing this function's contract). `rawData.data[]` entries are
// mutated in place (nativeCount/importCount attached directly), same as the original.
export const buildChoroplethIndex = rawData => {
  const nativeByCountry = {};
  Object.entries(rawData.natives ?? {}).forEach(([name, players]) => {
    const nId = QUALIFIED_BY_NAME[name];
    if (nId != null) nativeByCountry[nId] = players;
  });
  // Built before the byId loop below — it needs importCount per country, and this only
  // needs rawData.data (already in hand), not anything byId sets up.
  const importByCountry = buildImportByCountry(rawData, countryName);
  const byId = {};
  (rawData.data ?? []).forEach(d => {
    d.nativeCount = (nativeByCountry[d.id] ?? []).length;
    d.importCount = (importByCountry[d.id] ?? []).length;
    byId[d.id] = d;
  });
  // Coloring entries for qualified countries all of whose players play for their own
  // country (no export/import record at all otherwise).
  Object.entries(nativeByCountry).forEach(([nId, players]) => {
    const id = +nId;
    if (byId[id]) return;
    const importCount = (importByCountry[id] ?? []).length;
    byId[id] = { id, country: QUALIFIED_NAMES[id], count: 0, nativeCount: players.length,
                  importCount, totalCount: players.length, players: [], top: [], nations: [] };
  });
  return { byId, nativeByCountry, importByCountry };
};

// ── World choropleth painting ───────────────────────────────────────────────────
// GU_A3 code (Natural Earth) → synthetic country ID (UK home nations — see CLAUDE.md).
export const UK_GU_TO_ID = { ENG: 8260, SCT: 8261, WLS: 8262, NIR: 8263 };

// Paints the ocean background + world choropleth + mesh borders + UK home nations
// into `g` (a D3 selection, typically <world-map>.g) and returns the D3 selections
// plus the two feature arrays (worldFeatures/ukFeatures) callers need for
// centroid/bounds lookups (zoomToCentroid below, flag placement). Deliberately just
// the drawing calls — no mousemove/click/cursor/dim wiring, which stays with the
// caller (chain onto the returned selections; see wc2026_map.js's renderWorld for
// the pattern) since that's all page-specific (tooltips, dim mode, sidebar filters)
// with nothing generic left to share. `topojson` is read as a global (script tag),
// same convention <world-map> itself uses for `d3`.
export const paintChoropleth = (g, path, world, ukNations, byId) => {
  // Neutral gray, not blue — the violet theme's diverging scale (_divergingParams
  // above) uses blue for its positive/export side, and a blue ocean competed with
  // blue countries for attention instead of receding as backdrop. Deliberately
  // theme-independent (see CLAUDE.md's "Satellite colors" note) — real water stays
  // the same regardless of which land palette is active. This one line was missing
  // on the chain page for a while (paintChoropleth's own extraction never included
  // it, and nothing else painted it there either) — folded in here now so both pages
  // reading the same ocean color can't drift apart again the same way.
  const oceanPath = g.append('path').datum({ type: 'Sphere' })
    .attr('d', path).attr('fill', '#b0c4c4').attr('stroke', 'none');

  // Kosovo has no numeric id in the 110m topojson — only {properties:{name:'Kosovo'}} —
  // patched here, before the topojson.feature() call below needs it (see CLAUDE.md's
  // "Kosovo" section).
  const _topoNameToId = { Kosovo: 383, 'N. Cyprus': 8264, Somaliland: 8265 };
  world.objects.countries.geometries.forEach(geo => {
    if (!geo.id) { const mapped = _topoNameToId[geo.properties?.name]; if (mapped) geo.id = mapped; }
  });

  const worldFeatures = topojson.feature(world, world.objects.countries).features;
  const countryPaths = g.selectAll('.country')
    .data(worldFeatures.filter(d => +d.id !== 826)) // skip UK polygon, rendered separately below
    .join('path')
    .attr('class', 'country')
    .attr('data-id', d => +d.id)
    .attr('d', path)
    .attr('fill', d => choroFill(+d.id, byId))
    .attr('stroke', '#ccc8c0').attr('stroke-width', .3);

  const meshPath = g.append('path')
    .attr('class', 'mesh-border')
    .datum(topojson.mesh(world, world.objects.countries, (a, b) => a !== b))
    .attr('fill', 'none').attr('stroke', '#b8b0a8').attr('stroke-width', .3).attr('d', path);

  const ukFeatures = ukNations.features.map(f => ({ ...f, _id: UK_GU_TO_ID[f.properties.GU_A3] }));
  const ukPaths = g.selectAll('.country-uk')
    .data(ukFeatures)
    .join('path')
    .attr('class', 'country country-uk')
    .attr('data-id', d => d._id)
    .attr('d', path)
    .attr('fill', d => choroFill(d._id, byId))
    .attr('stroke', '#ccc8c0').attr('stroke-width', .3);

  return { worldFeatures, ukFeatures, oceanPath, countryPaths, meshPath, ukPaths };
};

// ── Centroid overrides + zoom-to-country ────────────────────────────────────────
// Fixes arc/zoom endpoints when path.centroid() lands outside the country polygon
// (or somewhere unrepresentative), e.g. dragged by overseas territories/outlying islands.
export const CENTROID_OVERRIDE = {
  250:  [2.5,  46.5],  // France (without overseas territories)
  840:  [-98,  38],    // USA (without Alaska/Hawaii)
  8261: [-4.2, 56.8],  // Scotland (centroid pulled north by islands)
  191:  [16.8, 45.8],  // Croatia (coastal strip drags centroid south into Bosnia)
};

export const dotCentroid = (feature, projection, path) => {
  const ov = CENTROID_OVERRIDE[+feature.id];
  return ov ? projection(ov) : path.centroid(feature);
};

// For MultiPolygon features (France, Russia, USA…), path.bounds() spans all territories
// including overseas ones. Use only the largest sub-polygon by projected bbox area.
export const mainlandBounds = (feature, path) => {
  const geom = feature.geometry;
  if (geom.type !== 'MultiPolygon') return path.bounds(feature);
  let best = null, bestArea = 0;
  for (const coords of geom.coordinates) {
    const sub = { type: 'Feature', geometry: { type: 'Polygon', coordinates: coords } };
    const [[x0, y0], [x1, y1]] = path.bounds(sub);
    const area = (x1 - x0) * (y1 - y0);
    if (area > bestArea) { bestArea = area; best = [[x0, y0], [x1, y1]]; }
  }
  return best ?? path.bounds(feature);
};

// Pans/zooms `svg`'s zoom transform to frame country `id`'s mainland bounds (tight fit
// via mainlandBounds), falling back to a fixed k=15 zoom centered on its centroid if no
// matching feature/usable bounds are found (e.g. Cape Verde/Curaçao — absent from the
// 110m topojson, see CLAUDE.md). `ctx` bundles the D3 handles this needs: { svg, zoom,
// path, centroids, worldFeatures, ukFeatures } — worldFeatures/ukFeatures typically the
// same ones paintChoropleth() returned, centroids the caller's own id→[x,y] map (flag
// placement owns that; see CLAUDE.md's "Zoom-stable flags and arcs").
export const zoomToCentroid = (ctx, id, duration = 2000) => {
  const { svg, zoom, path, centroids, worldFeatures, ukFeatures } = ctx;
  const c = centroids[id];
  if (!c) return;
  const [cx, cy] = c;
  const [vbX, vbY, vbW, vbH] = svg.attr('viewBox').split(' ').map(Number);
  const feature = worldFeatures?.find(f => +f.id === id) ?? ukFeatures?.find(f => +f._id === id);
  let k = 15, tx, ty;
  if (feature) {
    try {
      const [[bx0, by0], [bx1, by1]] = mainlandBounds(feature, path);
      const bw = bx1 - bx0, bh = by1 - by0;
      if (bw > 0 && bh > 0) {
        const pad = 10;
        k = Math.max(1, Math.min(vbW / (bw + 2 * pad), vbH / (bh + 2 * pad)));
        tx = vbX + vbW / 2 - k * (bx0 + bx1) / 2;
        ty = vbY + vbH / 2 - k * (by0 + by1) / 2;
      }
    } catch (e) { /* fall through */ }
  }
  if (tx == null) { tx = vbX + vbW / 2 - k * cx; ty = vbY + vbH / 2 - k * cy; }
  svg.transition().duration(duration).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
};

// ── Legend gradient + ticks + outlier count + theme-toggle swatch ──────────────
// Wires up #legend-bar/#legend-ticks/#legend-outlier-*/#legend-born-*/#theme-toggle (the
// markup block in wc2026_map.html and chains/wc2026_chain_longest.html — same ids on
// both pages) and the theme-cycling click handler, self-registering an onThemeChange
// listener so every piece repaints on theme switch. `getById()` is called lazily on
// every repaint (not read once) so callers can populate/replace their byId index after
// wireLegend() runs (map data loads asynchronously) — see refresh() below. Extracted
// from wc2026_map.js's _buildLegendGradient/_updateLegendTicks/_updateLegendOutlier/
// _updateLegendBorn/_paintThemeToggle. insights/heat-map.html's own KDE-intensity legend
// (a repurposed #legend-bar/#legend-ticks pair, its own display entirely — see that
// page's own script) bypasses this module rather than going through it, since it has
// nothing in common with the choropleth gradient/outlier/theme-toggle machinery here.
export const wireLegend = ({ getById }) => {
  const els = {
    bar:             document.getElementById('legend-bar'),
    ticks:           document.getElementById('legend-ticks'),
    outlierCount:    document.getElementById('legend-outlier-count'),
    outlierDot:      document.getElementById('legend-outlier-dot'),
    outlierPosWrap:  document.getElementById('legend-outlier-pos-wrap'),
    outlierDotPos:   document.getElementById('legend-outlier-dot-pos'),
    outlierCountPos: document.getElementById('legend-outlier-count-pos'),
    bornFull:        document.getElementById('legend-born-full'),
    bornBrief:       document.getElementById('legend-born-brief'),
    themeToggle:     document.getElementById('theme-toggle'),
  };

  // Diverging bar position (0-1) for a value v — proportional to the *combined*
  // -ratioMaxNeg..ratioMaxPos domain (see the original comment history in wc2026_map.js
  // for why: giving each side equal pixel width regardless of its own span made 0 sit at
  // the visual midpoint while the two sides silently ran at different units-per-pixel).
  const _divergingPos = (v, theme) => (v + theme.ratioMaxNeg) / (theme.ratioMaxNeg + theme.ratioMaxPos);

  const buildGradient = () => {
    if (!els.bar) return;
    const theme = currentTheme();
    const stops = theme.diverging
      ? [
          ...Array.from({ length: 30 }, (_, i) => {
              const v = -theme.ratioMaxNeg + (i / 29) * theme.ratioMaxNeg;
              return `${color(v, theme)} ${(_divergingPos(v, theme) * 100).toFixed(2)}%`;
            }),
          ...Array.from({ length: 30 }, (_, i) => {
              const v = (i / 29) * theme.ratioMaxPos;
              return `${color(v, theme)} ${(_divergingPos(v, theme) * 100).toFixed(2)}%`;
            }),
        ]
      : Array.from({ length: 60 }, (_, i) => color((i / 59) * theme.ratioMax, theme));
    els.bar.style.background = `linear-gradient(to ${theme.diverging ? 'right' : 'left'}, ${stops.join(',')})`;
    els.bar.style.borderRadius = '5px';
  };

  const updateTicks = () => {
    if (!els.ticks) return;
    const theme = currentTheme();
    const ticks = theme.diverging
      ? [-theme.ratioMaxNeg, -theme.ratioMaxNeg / 2, 0, theme.ratioMaxPos / 2, theme.ratioMaxPos].map(Math.round)
      : [1, 0.75, 0.5, 0.25, 0].map(f => Math.round(theme.ratioMax * f));
    const pct = t => theme.diverging ? _divergingPos(t, theme) * 100 : (1 - t / theme.ratioMax) * 100;
    render(html`${ticks.map(t => html`<span style="position:absolute; left:${pct(t)}%; transform:translateX(-50%)">${t}</span>`)}`, els.ticks);
  };

  const updateOutlier = () => {
    if (!els.outlierCount) return;
    const theme = currentTheme();
    const byId = getById();
    if (theme.diverging) {
      const [negId] = theme.outlierIdsNeg, [posId] = theme.outlierIdsPos;
      const negRec = byId[negId], posRec = byId[posId];
      els.outlierCount.textContent = negRec ? theme.metric(negRec) : '';
      if (els.outlierDot) els.outlierDot.style.background = divergingOutlierColor('neg');
      if (els.outlierPosWrap) {
        els.outlierPosWrap.classList.remove('d-none');
        if (els.outlierCountPos) els.outlierCountPos.textContent = posRec ? theme.metric(posRec) : '';
        if (els.outlierDotPos) els.outlierDotPos.style.background = divergingOutlierColor('pos');
      }
    } else {
      const [outlierId] = theme.outlierIds;
      const rec = byId[outlierId];
      els.outlierCount.textContent = rec ? theme.metric(rec) : '';
      if (els.outlierDot) els.outlierDot.style.background = theme.outlier;
      if (els.outlierPosWrap) els.outlierPosWrap.classList.add('d-none');
    }
  };

  const updateBorn = () => {
    const { full, brief } = T.legendMetric[currentTheme().legendKey];
    // full carries an inline <em> (i18n.js) around the operator word for emphasis
    // without shouting in all-caps — rendered via unsafeHTML since it's a developer-
    // authored translation string, never user input. title (the ellipsis-truncation
    // fallback, native tooltips can't render HTML) strips the tag back out to plain text.
    if (els.bornFull) {
      render(html`${unsafeHTML(full)}`, els.bornFull);
      els.bornFull.title = full.replace(/<[^>]+>/g, '');
    }
    if (els.bornBrief) els.bornBrief.textContent = brief;
  };

  const paintThemeToggle = () => {
    if (!els.themeToggle) return;
    const theme = currentTheme();
    // Diverging: each arm's own outlier color (already the darkest point of that arm),
    // so the swatch hints at the two-sided scale. Sequential: two stops from the ramp.
    const at = f => theme.ramp[Math.round(f * (theme.ramp.length - 1))];
    const stops = theme.diverging ? [divergingOutlierColor('neg'), divergingOutlierColor('pos')] : [at(0.55), at(0.9)];
    els.themeToggle.style.setProperty('--theme-swatch', `linear-gradient(135deg, ${stops[0]}, ${stops[1]})`);
  };

  const refresh = () => { buildGradient(); updateTicks(); updateOutlier(); updateBorn(); paintThemeToggle(); };

  els.themeToggle?.addEventListener('click', () => {
    const names = themeNames();
    setTheme(names[(names.indexOf(themeName()) + 1) % names.length]);
  });
  onThemeChange(refresh);
  refresh();

  return { refresh };
};

// ── Dim/arc mode — export/import connection arcs ────────────────────────────────
// Extracted from wc2026_map.js's arc drawing (module-level arcOffset/arrowPoints/
// ARC_EXPORT_COLOR/ARC_IMPORT_COLOR + applyDim's drawArc/onZoom's arc-rescale block)
// — now shared with the chain page's own dim/arc click handling. Only the arc
// geometry/painting is here: the "which flags dim to 35% opacity" decision and the
// tooltip/sidebar/player-table integration around it stay page-specific (both pages
// already have animateFlagOpacity from js/flag_visibility.js for the opacity side,
// no extraction needed there — it's already shared).
//
// Colors read once from CSS custom properties (css/taxonomy.css's :root block — any
// page using these must link that stylesheet), matching the elo-ranking pills' own
// --exp-accent/--imp-accent tokens so arcs, pills, and tooltip counts all agree.
const _rootStyle = getComputedStyle(document.documentElement);
export const ARC_EXPORT_COLOR = _rootStyle.getPropertyValue('--exp-accent').trim(); // blue
export const ARC_IMPORT_COLOR = _rootStyle.getPropertyValue('--imp-accent').trim(); // red
const ARC_OFFSET = 1.0; // lateral separation: visual offset = sw * ARC_OFFSET / k
const ARC_MID_T  = 0.65; // arrow at 65% toward destination — separates bidirectional pairs along the arc

export const arcOffset = (sw, sx, sy, tx, ty, k) => {
  const ddx = tx - sx, ddy = ty - sy, dist = Math.sqrt(ddx * ddx + ddy * ddy);
  const pnx = -ddy / dist, pny = ddx / dist;
  const off = sw * ARC_OFFSET / k;
  return {
    ofx: sx + pnx * off, ofy: sy + pny * off,
    otx: tx + pnx * off, oty: ty + pny * off,
    oqx: (sx + tx) / 2 + pnx * off, oqy: (sy + ty) / 2 - dist * 0.3 + pny * off,
  };
};

export const arrowPoints = (sw, ofx, ofy, otx, oty, oqx, oqy, k) => {
  const mt = ARC_MID_T, ms = 1 - mt;
  const mx = ms * ms * ofx + 2 * ms * mt * oqx + mt * mt * otx;
  const my = ms * ms * ofy + 2 * ms * mt * oqy + mt * mt * oty;
  const tdx = 2 * ms * (oqx - ofx) + 2 * mt * (otx - oqx);
  const tdy = 2 * ms * (oqy - ofy) + 2 * mt * (oty - oqy);
  const tLen = Math.sqrt(tdx * tdx + tdy * tdy);
  const mux = tdx / tLen, muy = tdy / tLen, mnx = -muy, mny = mux;
  const mah = Math.sqrt(sw) * 5 / k, maw = Math.sqrt(sw) * 2.5 / k;
  const bx = mx - mux * mah / 2, by = my - muy * mah / 2;
  return `${mx + mux * mah / 2},${my + muy * mah / 2} ${bx + mnx * maw},${by + mny * maw} ${bx - mnx * maw},${by - mny * maw}`;
};

// Appends one arc (a smooth quadratic-Bézier path + a mid-arrow polygon), laterally
// offset by type so a bidirectional pair (country A exports to B, B also exports to
// A) never fully overlaps. `type` picks the color: 'export' (blue) or 'import' (red).
export const appendArc = (arcsGroup, from, to, count, type, k) => {
  const color = type === 'export' ? ARC_EXPORT_COLOR : ARC_IMPORT_COLOR;
  const sw = Math.max(1, Math.sqrt(count));
  const { ofx, ofy, otx, oty, oqx, oqy } = arcOffset(sw, from[0], from[1], to[0], to[1], k);

  arcsGroup.append('path')
    .attr('class', 'arc-line')
    .attr('d', `M${ofx},${ofy} Q${oqx},${oqy} ${otx},${oty}`)
    .attr('fill', 'none').attr('stroke', color)
    .attr('stroke-width', sw / k).attr('opacity', 0.7)
    .attr('data-sw', sw)
    .attr('data-sx', from[0]).attr('data-sy', from[1])
    .attr('data-tx', to[0]).attr('data-ty', to[1]);

  arcsGroup.append('polygon')
    .attr('class', 'arc-line arc-mid')
    .attr('points', arrowPoints(sw, ofx, ofy, otx, oty, oqx, oqy, k))
    .attr('fill', color).attr('opacity', 0.8)
    .attr('data-sw', sw)
    .attr('data-sx', from[0]).attr('data-sy', from[1])
    .attr('data-tx', to[0]).attr('data-ty', to[1]);
};

// Clears and redraws every arc for `sourceId`: one per export destination (destIds,
// a Map<countryId, playerCount>) and one per import origin (importIds, same shape —
// see computeImportIds below). No-op (leaves arcsGroup empty) if sourceId has no
// centroid at all.
export const drawCountryArcs = (arcsGroup, sourceId, destIds, importIds, centroids, k) => {
  arcsGroup.selectAll('.arc-line').remove();
  const src = centroids[sourceId];
  if (!src) return;
  destIds.forEach((count, destId) => {
    const dst = centroids[destId];
    if (dst) appendArc(arcsGroup, src, dst, count, 'export', k);
  });
  importIds.forEach((count, birthId) => {
    if (birthId === sourceId) return;
    const ySrc = centroids[birthId];
    if (ySrc) appendArc(arcsGroup, ySrc, src, count, 'import', k);
  });
};

// Rescales every existing arc's width/geometry for the current zoom k (call from the
// page's own onZoom handler) — arcs use data-sw/data-sx/data-sy/data-tx/data-ty
// (set by appendArc above) as their zoom-stable source of truth, same convention
// flags/leader-lines use (see CLAUDE.md's "Zoom-stable flags and arcs").
export const rescaleArcs = (g, k) => {
  g.selectAll('path.arc-line')
    .attr('stroke-width', function() { return +this.getAttribute('data-sw') / k; })
    .attr('d', function() {
      const sw = +this.getAttribute('data-sw');
      const sx = +this.getAttribute('data-sx'), sy = +this.getAttribute('data-sy');
      const tx = +this.getAttribute('data-tx'), ty = +this.getAttribute('data-ty');
      const { ofx, ofy, otx, oty, oqx, oqy } = arcOffset(sw, sx, sy, tx, ty, k);
      return `M${ofx},${ofy} Q${oqx},${oqy} ${otx},${oty}`;
    });
  g.selectAll('polygon.arc-mid').attr('points', function() {
    const sw = +this.getAttribute('data-sw');
    const sx = +this.getAttribute('data-sx'), sy = +this.getAttribute('data-sy');
    const tx = +this.getAttribute('data-tx'), ty = +this.getAttribute('data-ty');
    const { ofx, ofy, otx, oty, oqx, oqy } = arcOffset(sw, sx, sy, tx, ty, k);
    return arrowPoints(sw, ofx, ofy, otx, oty, oqx, oqy, k);
  });
};

// A handful of export-record country names have no numeric id of their own (id=null
// in the raw data — ambiguous/historical names) but DO correspond to a real qualified
// country for arc-drawing purposes; maps those specific names to the id whose
// centroid an import arc should actually point at. Same table wc2026_map.js's own
// tooltip birth-country resolution uses.
export const _NULL_CENTROID_ID = { 'Democratic Republic of the Congo': 180, 'U.S.': 840, 'Kingdom of the Netherlands': 528 };

// Builds sourceId's import-arc data: Map<birthCountryId, playerCount> from
// importByCountry[sourceId] (buildChoroplethIndex's own return, or wc2026_map.js's
// app.importByCountry — same shape either way).
export const computeImportIds = (sourceId, importByCountry) => {
  const importIds = new Map();
  (importByCountry[sourceId] ?? []).forEach(p => {
    const cId = p.birthCountryId != null ? p.birthCountryId : (_NULL_CENTROID_ID[p.birthCountry] ?? null);
    if (cId == null) return;
    importIds.set(cId, (importIds.get(cId) ?? 0) + 1);
  });
  return importIds;
};
