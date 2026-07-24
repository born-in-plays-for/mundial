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
// wc2026_map.js for exactly which fields it carries (count/nativeCount/
// importCount today). Falls back to 0 for a missing field rather than
// throwing, defensively — a byId built some other way than buildChoroplethIndex()
// (below) might not compute every field the main map does.
// ── Diverging scale — EASY TWEAKS ───────────────────────────────────────────
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
  // the legend's own tick *labels* and gradient domain (wc2026_map.js) — only the color mapping
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
export const choroFill = (id, byId) => {
  if (OUTLIER_IDS_POS.has(id)) return divergingOutlierColor('pos');
  if (OUTLIER_IDS_NEG.has(id)) return divergingOutlierColor('neg');
  const r = byId[id];
  return r ? color(METRIC(r)) : NO_DATA_COLOR;
};

// Notified after a live setDivergingParams() tweak — map repaint, legend rebuild, etc. live
// outside this module, which only owns the color state itself.
const _paletteListeners = new Set();
export const onPaletteChange = fn => { _paletteListeners.add(fn); return () => _paletteListeners.delete(fn); };

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
// byId/nativeByCountry/importByCountry indices choroFill()/METRIC read (count/
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

// ── Legend gradient + ticks + outlier count + range filter ─────────────────────
// Wires up #legend-bar/#legend-ticks/#legend-outlier-*/#legend-born-*/#legend-filter-device
// (the markup block in wc2026_map.html and chains/wc2026_chain_longest.html — same ids on
// both pages, though only wc2026_map.html carries #legend-filter-device and passes
// onRangeChange; the chain page has no category-filter system for a range selection to plug
// into, so its legend stays read-only, same as before this feature existed), self-registering
// an onPaletteChange listener so every piece repaints after a live #diverging-debug tweak.
// `getById()` is called lazily on every repaint (not read once) so callers can
// populate/replace their byId index after wireLegend() runs (map data loads
// asynchronously) — see refresh() below. Extracted from wc2026_map.js's
// _buildLegendGradient/_updateLegendTicks/_updateLegendOutlier/_updateLegendBorn.
export const wireLegend = ({ getById, onRangeChange }) => {
  const els = {
    bar:             document.getElementById('legend-bar'),
    ticks:           document.getElementById('legend-ticks'),
    outlierCount:    document.getElementById('legend-outlier-count'),
    outlierDot:      document.getElementById('legend-outlier-dot'),
    outlierNegWrap:  document.getElementById('legend-outlier-neg-wrap'),
    outlierPosWrap:  document.getElementById('legend-outlier-pos-wrap'),
    outlierDotPos:   document.getElementById('legend-outlier-dot-pos'),
    outlierCountPos: document.getElementById('legend-outlier-count-pos'),
    bornFull:        document.getElementById('legend-born-full'),
    bornBrief:       document.getElementById('legend-born-brief'),
    filterDevice:    document.getElementById('legend-filter-device'),
  };

  // Bar position (0-1) for a value v — proportional to the *combined*
  // -RATIO_MAX_NEG..RATIO_MAX_POS domain (see the original comment history in wc2026_map.js
  // for why: giving each side equal pixel width regardless of its own span made 0 sit at
  // the visual midpoint while the two sides silently ran at different units-per-pixel).
  const _divergingPos = v => (v + RATIO_MAX_NEG) / (RATIO_MAX_NEG + RATIO_MAX_POS);

  const buildGradient = () => {
    if (!els.bar) return;
    const stops = [
      ...Array.from({ length: 30 }, (_, i) => {
          const v = -RATIO_MAX_NEG + (i / 29) * RATIO_MAX_NEG;
          return `${color(v)} ${(_divergingPos(v) * 100).toFixed(2)}%`;
        }),
      ...Array.from({ length: 30 }, (_, i) => {
          const v = (i / 29) * RATIO_MAX_POS;
          return `${color(v)} ${(_divergingPos(v) * 100).toFixed(2)}%`;
        }),
    ];
    els.bar.style.background = `linear-gradient(to right, ${stops.join(',')})`;
    els.bar.style.borderRadius = '5px';
  };

  // Rug plot — one thin tick per real country at its own METRIC position, overlaid directly on
  // the gradient. The bar itself is drawn as a smooth continuous gradient (buildGradient above),
  // which reads as if every value in [-RATIO_MAX_NEG, RATIO_MAX_POS] were equally "populated" —
  // it isn't: countries cluster tightly in some spots and leave real gaps in others (e.g. nothing
  // between Germany and Netherlands even though the gradient there looks the same as anywhere
  // else). This doesn't touch the gradient/color mapping at all, just overlays where the real
  // data actually sits on top of it, same set of countries and same METRIC the map's own choropleth
  // colors by. The two outliers are excluded — they already get their own dedicated dot markers
  // (updateOutlier below) well outside this bar's own domain.
  // A more saturated shade of the gradient's own color at v — pushed further toward that side's
  // own extreme (easyLeft/red for a negative v, easyRight/blue for a positive one), not just
  // darkened — so a tick reads as "this spot on the gradient, but redder/bluer" rather than a
  // generic dark hash mark sitting on top of an unrelated color underneath it.
  // The boost itself scales with distance from center: _TICK_BOOST_MIN right at v=0, ramping up
  // toward _TICK_BOOST_MAX right at each extreme (where the gradient is already most saturated
  // too). Reuses normalize(v) — the exact same 0..1 magnitude the color ramp itself is built
  // from — rather than a second, independently-tuned falloff, so the boost curve always tracks
  // whatever easing/floor #diverging-debug currently has dialed in instead of drifting from it.
  // _TICK_BOOST_MIN can't be 0: right at v=0 the gradient itself is already near-neutral gray, so
  // a tick with no boost at all ends up almost exactly the same color as the background it sits
  // on — invisible, not just subtle (this is what a country like Czechia/Egypt/Colombia/Norway,
  // clustered near 0, looked like before this floor existed). A small nonzero floor keeps every
  // tick visibly tinted, even the ones sitting right on top of the gradient's own neutral point.
  const _TICK_BOOST_MIN = 0.0667;
  const _TICK_BOOST_MAX = 1.2;
  const _tickColor = v => {
    const base = color(v);
    const target = v >= 0 ? _divergingParams.easyRight : _divergingParams.easyLeft;
    const boost = _TICK_BOOST_MIN + (_TICK_BOOST_MAX - _TICK_BOOST_MIN) * normalize(v);
    const c = d3.color(d3.interpolateRgb(base, target)(boost));
    if (!c) return base;
    c.opacity = 1;
    return c.toString();
  };
  const updateRug = () => {
    if (!els.bar) return;
    const byId = getById();
    const marks = Object.keys(byId)
      .map(Number)
      .filter(id => !OUTLIER_IDS_NEG.has(id) && !OUTLIER_IDS_POS.has(id))
      .map(id => METRIC(byId[id]))
      .filter(v => v >= -RATIO_MAX_NEG && v <= RATIO_MAX_POS);
    render(html`${marks.map(v => html`<span class="legend-rug-tick" style="left:${(_divergingPos(v) * 100).toFixed(2)}%; background:${_tickColor(v)}"></span>`)}`, els.bar);
  };

  const updateTicks = () => {
    if (!els.ticks) return;
    const ticks = [-RATIO_MAX_NEG, -RATIO_MAX_NEG / 2, 0, RATIO_MAX_POS / 2, RATIO_MAX_POS].map(Math.round);
    const pct = t => _divergingPos(t) * 100;
    // The two extreme ticks sit exactly at the bar's own edges (0%/100%) — right next to that
    // side's own outlier count label (#legend-outlier-count / -count-pos, just outside the bar)
    // — so nudge them inward a few px, otherwise the two numbers visually merge (e.g. "-26-21").
    const nudge = i => i === 0 ? 6 : i === ticks.length - 1 ? -6 : 0;
    render(html`${ticks.map((t, i) => html`<span style="position:absolute; left:${pct(t)}%; transform:translateX(calc(-50% + ${nudge(i)}px))">${t}</span>`)}`, els.ticks);
  };

  const updateOutlier = () => {
    if (!els.outlierCount) return;
    const byId = getById();
    const [negId] = OUTLIER_IDS_NEG, [posId] = OUTLIER_IDS_POS;
    const negRec = byId[negId], posRec = byId[posId];
    // Whole column hidden, not just left blank, whenever there's no negative outlier to show
    // (OUTLIER_IDS_NEG currently empty — see its own comment) — a colored-but-blank dot read as
    // an orphaned UI element, not a clean "nothing here". setProperty(...,'important'), not a
    // plain style.display assignment — #legend-outlier-neg-wrap carries Bootstrap's own d-flex
    // class (display:flex !important), which would otherwise win over a non-important inline
    // style and leave the "hidden" column visually unchanged. (An earlier version of this used
    // visibility:hidden instead, to keep the grip's own resting margin unchanged — reverted: the
    // negative column's own content (blank text) and the positive column's own (a real "78")
    // aren't the same natural width, so reserving-but-hiding it didn't actually produce a
    // symmetric gap either. #legend-filter-device's own asymmetric inset below is the real fix.)
    if (els.outlierNegWrap) {
      if (OUTLIER_IDS_NEG.size) els.outlierNegWrap.style.removeProperty('display');
      else els.outlierNegWrap.style.setProperty('display', 'none', 'important');
    }
    els.outlierCount.textContent = negRec ? METRIC(negRec) : '';
    if (els.outlierDot) els.outlierDot.style.background = divergingOutlierColor('neg');
    if (els.outlierCountPos) els.outlierCountPos.textContent = posRec ? METRIC(posRec) : '';
    if (els.outlierDotPos) els.outlierDotPos.style.background = divergingOutlierColor('pos');
  };

  const updateBorn = () => {
    const { full, brief } = T.legendMetric.balance;
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

  // ── Range filter — drag either grip to select a sub-range of the legend's own value domain
  // (Curaçao's real value through France's — the true domain extremes, not necessarily the two
  // countries the outlier dot(s) single out; see RATIO_MAX_NEG's own comment on why Curaçao no
  // longer gets one), filtering the country list/map down to that range. Opt-in: only built when
  // both the DOM host (#legend-filter-device) and a callback to report the selected range
  // exist — see the header comment above. #legend-filter-device is a 5-child flex row —
  // #left-excluded/#left-grip/#center-included/#right-grip/#right-excluded — covering #legend
  // itself plus a margin on each side (css/map-container.css), wide enough that a grip parked
  // at rest sits fully in that margin instead of overlapping the outlier dot beside it. Margin
  // and grip width are read live off the actual rendered boxes below, not assumed equal to
  // each other or to any particular CSS value — both are still being visually tuned.
  // Domain endpoints are each outlier's own *real* METRIC value, not RATIO_MAX_POS/NEG (the
  // 2nd-place ceiling the color scale saturates at) — a real range filter needs the actual
  // extremes, not the color-mapping ceiling short of them.
  const _rangeDomain = () => {
    const byId = getById();
    const [negId] = OUTLIER_IDS_NEG, [posId] = OUTLIER_IDS_POS;
    const negRec = byId[negId], posRec = byId[posId];
    return [negRec ? METRIC(negRec) : -RATIO_MAX_NEG, posRec ? METRIC(posRec) : RATIO_MAX_POS];
  };
  // How far each grip has been dragged in from its at-rest position, in real CSS px against
  // #legend-filter-device's own width (the actual flex container these become #left-excluded/
  // #right-excluded's widths in) — not #legend's own, narrower width; the device is wider by
  // its own side margins (see the header comment above), so a grip parked at rest (0/0) sits
  // fully in that margin instead of overlapping #legend's own content. 0/0 always means "no
  // filtering," regardless of the domain, so unlike a value-domain percentage there's nothing
  // here that needs re-syncing once getById() starts returning real data instead of the {}
  // it's called with before the map finishes loading (the value each px maps to is only ever
  // resolved at conversion time, in _xToValue()/_currentRange() below).
  let _leftPx = 0, _rightPx = 0;
  // A device-relative x (the same coordinate frame _leftPx/_rightPx live in) → a real METRIC
  // value. The contract this must satisfy: a country is excluded iff its own boundary-facing
  // grip border has moved past that country's own position — nothing softer than that. The
  // cleanest way to guarantee that is to make _xToValue the exact mathematical inverse of each
  // country's own "natural x position" (call it countryX(v)): every ordinary country's countryX
  // is its proportional spot on #legend-bar (linear across [-RATIO_MAX_NEG, RATIO_MAX_POS] — see
  // buildGradient() above); each outlier's countryX is its own dot's center (#legend has 3
  // visually different columns — negative-outlier dot, gradient bar, positive-outlier dot — see
  // wc2026_map.html — and a dot is a single discrete marker, not a proportional slice of the
  // domain the way its pixel width might suggest). With _xToValue as that exact inverse,
  // "v is within [_xToValue(leftBoundaryX), _xToValue(rightBoundaryX)]" and "countryX(v) is
  // within [leftBoundaryX, rightBoundaryX]" are the same statement, which is exactly the
  // three-part rule this whole device promises: everything left of the left grip's own right
  // border excluded, everything right of the right grip's own left border excluded, everything
  // between included.
  // Two earlier versions failed this: treating the dot columns as more of the same linear bar
  // scale (using #legend's raw width) made the boundary reach the true min/max value well before
  // a grip visually reached the dot that represents it, or vice versa. The fix after that closed
  // the gap but overcorrected into a hard jump AT the dot's center (flat at the true extreme
  // right up to the center, then an instant snap to RATIO_MAX_NEG/POS) — continuous only from
  // the center to the bar, not from the dot to the bar as a whole, so nothing dragged through the
  // first half of the dot ever counted as "past" it. Ramping continuously across the *entire*
  // span from each dot's own center to the bar's own edge — matching countryX exactly instead of
  // discontinuously — is what finally satisfies the contract above with no dead zone at all: a
  // country right at the boundary is included (inclusive comparison), a hair past it is excluded.
  const _xToValue = xFromDeviceLeft => {
    const [lo, hi] = _rangeDomain();
    const barRect = document.getElementById('legend-bar')?.getBoundingClientRect();
    const deviceRect = els.filterDevice?.getBoundingClientRect();
    if (!barRect || !deviceRect || !barRect.width) return lo;
    const barLeft = barRect.left - deviceRect.left, barRight = barRect.right - deviceRect.left;
    if (xFromDeviceLeft <= barLeft) {
      const dotRect = document.getElementById('legend-outlier-dot')?.getBoundingClientRect();
      const dotCenter = dotRect ? (dotRect.left + dotRect.right) / 2 - deviceRect.left : barLeft;
      if (xFromDeviceLeft <= dotCenter) return lo; // at or short of the outlier's own position — nothing to exclude yet
      const span = barLeft - dotCenter;
      const frac = span > 0 ? (xFromDeviceLeft - dotCenter) / span : 1;
      return lo + frac * (-RATIO_MAX_NEG - lo);
    }
    if (xFromDeviceLeft >= barRight) {
      const dotRect = document.getElementById('legend-outlier-dot-pos')?.getBoundingClientRect();
      const dotCenter = dotRect ? (dotRect.left + dotRect.right) / 2 - deviceRect.left : barRight;
      if (xFromDeviceLeft >= dotCenter) return hi; // at or past the outlier's own position — fully inclusive (resting state)
      const span = dotCenter - barRight;
      const frac = span > 0 ? (xFromDeviceLeft - barRight) / span : 0;
      return RATIO_MAX_POS + frac * (hi - RATIO_MAX_POS);
    }
    const frac = (xFromDeviceLeft - barLeft) / barRect.width; // 0..1 across the bar itself
    return -RATIO_MAX_NEG + frac * (RATIO_MAX_NEG + RATIO_MAX_POS);
  };
  const _currentRange = () => {
    const deviceRect = els.filterDevice?.getBoundingClientRect();
    if (!deviceRect) return _rangeDomain();
    // The excluded/included boundary is each grip's INNER edge (left-grip's right edge,
    // right-grip's left edge) — where #center-included actually starts/ends — not the grip's
    // outer edge (where #left-excluded/#right-excluded end). The grip's own width sits on the
    // excluded side of that boundary (a country whose value falls directly under a grip reads
    // as excluded, same as the dimmed span next to it), so it has to be added in here too, not
    // just the bare _leftPx/_rightPx (the dimmed span's own width) — leaving it out let a
    // sliver of otherwise-excluded countries stay visible even with a grip dragged as far as
    // it goes.
    const gripW = document.getElementById('left-grip')?.getBoundingClientRect().width ?? 0;
    const leftBoundaryX = _leftPx + gripW, rightBoundaryX = deviceRect.width - _rightPx - gripW;
    // Debug aid — the geometry half of the range-filter pipeline (see control_sidebar.js's own
    // setLegendRange() for the per-country half: what each resulting range value actually
    // includes/excludes). Logs every input this function's own math runs on, so a confusing
    // result can be traced back to a specific px→value step instead of guessed at from the
    // legend's own rendered pixels. barLeft/barRight are re-read here (not reused from
    // _xToValue, called below) purely for this log — harmless, this whole function only runs
    // once per drag end / dblclick, never per frame.
    const barRect = document.getElementById('legend-bar')?.getBoundingClientRect();
    console.log('[legend-filter] _currentRange', {
      leftPx: _leftPx, rightPx: _rightPx, gripW,
      deviceWidth: deviceRect.width,
      barLeft: barRect ? barRect.left - deviceRect.left : null,
      barRight: barRect ? barRect.right - deviceRect.left : null,
      leftBoundaryX, rightBoundaryX,
      domain: _rangeDomain(),
    });
    // The two grips have met (a fully squeezed, zero-width #center-included — the drag-clamp
    // in _onGripDown lets them touch but never cross) — every country should read as excluded.
    // Can't just let this fall through to the interpolation below: leftBoundaryX and
    // rightBoundaryX are then the exact same x, so _xToValue resolves them to the exact same
    // value — and since the filter is inclusive (v >= x && v <= x), whichever real country
    // happens to sit exactly at that one value would still pass, isolating the one country most
    // in need of excluding instead of excluding everyone. [hi, lo] (deliberately inverted) can
    // never be satisfied by any real v, unlike [x, x].
    if (rightBoundaryX <= leftBoundaryX) {
      const [lo, hi] = _rangeDomain();
      console.log('[legend-filter] grips met — excluding everyone', [hi, lo]);
      return [hi, lo];
    }
    const range = [_xToValue(leftBoundaryX), _xToValue(rightBoundaryX)];
    console.log('[legend-filter] resolved range', range);
    return range;
  };
  const _emitRange = () => {
    onRangeChange(_leftPx === 0 && _rightPx === 0 ? null : _currentRange());
  };
  const _onGripDown = e => {
    e.preventDefault();
    const side = e.currentTarget.dataset.side; // 'left' | 'right'
    const gripEl = e.currentTarget;
    // Track the drag as a delta from the pointerdown position, not an absolute recompute off
    // ev.clientX — the grip is wherever it currently sits, not flush against the device edge,
    // so an absolute recompute would snap it (by however far into the grip the user happened
    // to grab it) the instant the first pointermove fires.
    const startClientX = e.clientX;
    const startLeftPx = _leftPx, startRightPx = _rightPx;
    // Only the grip/mask redraw (cheap: a handful of style writes) happens on every
    // pointermove — actually applying the filter (_emitRange(), which cascades into
    // re-filtering the Elo pill list and re-animating every flag on the map) is expensive
    // enough to visibly freeze the drag if it ran on every tick, so it's deferred to
    // pointerup instead: one recompute per drag, not one per pixel moved.
    const move = ev => {
      const rect = els.filterDevice.getBoundingClientRect();
      // Both grips' own live width — read fresh (not assumed equal to the .5rem/1rem margin
      // constant currently in CSS, which is itself still being tuned) so the two grips can
      // never overlap: the dragged grip's own far edge is capped at the other grip's own near
      // edge, exactly, however wide either currently renders.
      const gripW = gripEl.getBoundingClientRect().width;
      const dx = ev.clientX - startClientX;
      if (side === 'left') {
        const max = Math.max(0, rect.width - _rightPx - 2 * gripW);
        _leftPx = Math.max(0, Math.min(startLeftPx + dx, max));
      } else {
        const max = Math.max(0, rect.width - _leftPx - 2 * gripW);
        _rightPx = Math.max(0, Math.min(startRightPx - dx, max));
      }
      renderRange();
    };
    const up = () => {
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', up);
      _emitRange();
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', up);
  };
  const renderRange = () => {
    if (!els.filterDevice || !onRangeChange) return;
    const gripTip = 'Drag to filter countries by net export/import balance — double-click to reset';
    render(html`
      <span id="left-excluded" style="width:${_leftPx}px"></span>
      <span id="left-grip" data-side="left" title=${gripTip} @pointerdown=${_onGripDown}><img src="images/grip-vertical-svgrepo-com.svg" alt=""></span>
      <span id="center-included"></span>
      <span id="right-grip" data-side="right" title=${gripTip} @pointerdown=${_onGripDown}><img src="images/grip-vertical-svgrepo-com.svg" alt=""></span>
      <span id="right-excluded" style="width:${_rightPx}px"></span>
    `, els.filterDevice);
  };
  if (els.filterDevice && onRangeChange) {
    els.filterDevice.addEventListener('dblclick', () => {
      // Same "eases back to rest" treatment as js/wc2026_map.js's own map-height resize bar
      // dblclick reset — snapping straight to 0/0 (the old behavior) reads as abrupt for a
      // gesture that isn't itself a drag. Eases _leftPx/_rightPx down to 0 over a fixed
      // duration, re-rendering every frame (cheap: a handful of style writes, same as every
      // drag frame already does above) — _emitRange() (expensive: cascades into re-filtering
      // + re-animating every flag) still only runs once, at the end, same as the drag's own
      // pointerup-only recompute.
      const startLeft = _leftPx, startRight = _rightPx;
      if (startLeft === 0 && startRight === 0) return;
      const duration = 250, t0 = performance.now();
      const step = now => {
        const ease = 1 - (1 - Math.min(1, (now - t0) / duration)) ** 2; // ease-out
        _leftPx = startLeft * (1 - ease);
        _rightPx = startRight * (1 - ease);
        renderRange();
        if (ease < 1) requestAnimationFrame(step);
        else _emitRange();
      };
      requestAnimationFrame(step);
    });
  }

  const refresh = () => { buildGradient(); updateRug(); updateTicks(); updateOutlier(); updateBorn(); renderRange(); };

  onPaletteChange(refresh);
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
