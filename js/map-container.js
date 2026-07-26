// js/map-container.js
// Shared map infrastructure: <world-map> web component + exported constants.
// Both index.js and insights pages import this to share the projection,
// zoom behaviour, and choropleth painting. The color scale itself (getDivergingParams/
// setDivergingParams/normalize/RATIO_MAX_*/OUTLIER_IDS_*) lives in diverging-scale.js,
// shared with legend.js — this module only applies it to real map data (choroFill).
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

import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { QUALIFIED_NAMES, QUALIFIED_BY_NAME, buildImportByCountry } from './qualified.js';
import { countryName } from './i18n.js';
import {
  color, divergingOutlierColor, METRIC, OUTLIER_IDS_POS, OUTLIER_IDS_NEG, NO_DATA_COLOR,
} from './diverging-scale.js';

// ── World choropleth fill — net talent balance ──────────────────────────────
// The color math itself (getDivergingParams/setDivergingParams, normalize(), the
// RATIO_MAX_*/OUTLIER_IDS_* constants, onPaletteChange) lives in diverging-scale.js —
// shared with legend.js, which merely visualizes this same scale. choroFill is the
// one piece that's genuinely this module's own: applying that scale to actual map
// data (byId) to paint `.country` fills below (paintChoropleth).
export const choroFill = (id, byId) => {
  if (OUTLIER_IDS_POS.has(id)) return divergingOutlierColor('pos');
  if (OUTLIER_IDS_NEG.has(id)) return divergingOutlierColor('neg');
  const r = byId[id];
  return r ? color(METRIC(r)) : NO_DATA_COLOR;
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
// Birth-city dots (js/index.js's _updatePlayerCityDots, marked with the .city-dot class
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
    // aspect ratio drifts from the viewBox's — e.g. the #map-footer drag-resize handle
    // below, which sets an explicit inline px height on #map. #map itself is
    // width:100%/height:auto in normal layout, so its box already matches the viewBox's own
    // aspect ratio there (nothing to crop or letterbox either way) — 'meet' only actually
    // does anything once something (the drag handle, or a restored localStorage height)
    // gives #map an explicit height. index.js's resize listener switches this back to
    // 'slice' for the landscape-mobile fullscreen map (css/map-container.css forces #map to
    // width:100%/height:100% of a box with its own, unrelated aspect ratio there — deliberate
    // full-bleed cover, not the "user shrank the map" case this default is about).
    this.svg.attr('preserveAspectRatio', 'xMidYMid meet');

    this.g      = this.svg.append('g');
    this.onZoom = null;
    // Fires before the generic per-flag resize below — lets page code recompute a
    // flag's data-cx/data-cy for the CURRENT tick's k (e.g. index.js's Cape
    // Verde inset, whose anchor point is itself a function of k) with no 1-frame lag.
    this.onZoomPre = null;

    // Upper bound raised (was 18) to let birth-city dot clusters (js/index.js's
    // _updatePlayerCityDots) be pulled apart further — dot/flag on-screen size stays
    // constant (counter-scaled each tick below), only their world-space spacing grows
    // with k, so deeper zoom is what actually separates two cities sitting close together.
    this.zoom = d3.zoom().scaleExtent([1, 200]).on('zoom', e => {
      if (this.onZoomPre) this.onZoomPre(e);
      this.g.attr('transform', e.transform);

      const s = FLAG / Math.pow(e.transform.k, 1 - FLAG_SIZE_ZOOM_EXP);
      // .flag-fixed opts out — it lives inside a fixed-zoom inset (see index.js's
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

// ── #map-container's inner DOM ───────────────────────────────────────────────
// index.html and chains/wc2026_chain_longest.html were hand-duplicating this whole
// block (map frame, zoom controls, grip, legend) — identical apart from the asset
// path prefix and whether the legend's drag-to-filter range device is present
// (index.html only; the chain page has no category-filter system for a range
// selection to plug into — see legend.js's wireLegend() header comment). Templated
// once here instead. Each page keeps its own real, empty `#map-container` div in
// its static HTML (not a generic placeholder) and renders this INTO it — see
// index.js's and the chain page's own module scripts, right after their imports.
// Deliberately *not* including the `#map-container` div itself: `<mundial-auth-bar>`'s
// own _offsetSibling() (js/auth-bar.js) reads its nextElementSibling's computed
// `position` to decide how to offset it below the fixed navbar (top vs marginTop),
// and on the chain page that sibling IS `#map-container` (`position:fixed`) —
// wrapping it in an extra JS-rendered placeholder div would make that check see a
// plain `position:static` wrapper instead and offset the wrong element.
export const mapContainerTemplate = ({ basePath = '', withRangeFilter = false } = {}) => html`
  <button id="map-toggle-bar" type="button" class="map-toggle-bar" data-bs-toggle="collapse" data-bs-target="#map-collapse" aria-expanded="true" aria-controls="map-collapse">⌄</button>
  <div id="map-collapse" class="collapse show w-100">
    <div id="map-frame">
      <world-map id="map" role="img" aria-label="Choropleth map of players born in one country, playing for another"></world-map>
      <span id="zoom-hint"></span>
    </div>
    <div id="map-footer" class="d-flex align-items-center justify-content-between w-100 pt-1">
      <div id="map-controls" class="d-flex align-items-center gap-1">
        <button id="zoom-reset" type="button" aria-label="Reset zoom">
          <img src="${basePath}images/solar_linear/global-svgrepo-com.svg" width="20" height="20" aria-hidden="true">
        </button>
        <button id="zoom-span" type="button" aria-label="Span all visible countries">
          <img src="${basePath}images/solar_linear/maximize-square-2-svgrepo-com.svg" width="20" height="20" aria-hidden="true">
        </button>
      </div>
      <!-- Centered over #map-footer via CSS (position:absolute, left/top:50%) — JS for mobile. -->
      <img id="map-grip" src="${basePath}images/grip-horizontal-svgrepo-com.svg" width="20" height="20" alt="" aria-hidden="true">
      <div id="legend" class="d-flex align-items-start">
        <!-- Hidden via legend.js's wireLegend()/updateOutlier() whenever OUTLIER_IDS_NEG is
             empty (no country carved out as its own standalone dot on the negative side — see
             that Set's own comment on why Curaçao no longer gets one). -->
        <div id="legend-outlier-neg-wrap" class="d-flex flex-column pe-2">
          <div class="d-flex align-items-center justify-content-center legend-outlier-wrap">
            <div id="legend-outlier-dot" class="legend-outlier-dot"></div>
          </div>
          <div id="legend-outlier-count" class="text-center"></div>
        </div>
        <div id="legend-bar-col">
          <div id="legend-bar" class="overflow-hidden rounded-2"></div>
          <div id="legend-ticks"></div>
        </div>
        <!-- The positive-side outlier (negative's is the block above, reused; see
             legend.js's wireLegend()/updateOutlier). -->
        <div id="legend-outlier-pos-wrap" class="d-flex flex-column ps-2">
          <div class="d-flex align-items-center justify-content-center legend-outlier-wrap">
            <div id="legend-outlier-dot-pos" class="legend-outlier-dot"></div>
          </div>
          <div id="legend-outlier-count-pos" class="text-center"></div>
        </div>
        ${withRangeFilter ? html`
          <!-- Range-filter device — see legend.js's wireLegend()/renderRange(). Covers the
               whole #legend (both outlier columns + the gradient bar + the text rows below),
               plus a bit of side margin for the grip handles to rest in — rendered into by JS
               only once wired with an onRangeChange callback (index.html only — see
               wireLegend's own header comment for why the chain page doesn't get this). -->
          <div id="legend-filter-device"></div>
        ` : nothing}
      </div>
    </div>
  </div>
`;

// ── #map-footer drag-resize ──────────────────────────────────────────────────
// index.html and the chain page each hand-maintained their own copy of this — the
// chain page's had drifted behind index.js's (missing the dblclick-to-reset gesture
// entirely, and missing the natural-height cap on the drag itself, so it could be
// dragged into pure letterboxed empty space with nothing left to reveal). One
// shared implementation now; the two pages differ only in their storage key and
// what "keep body padding in sync" means for them (index.html: the more elaborate
// _syncMapHeight/_syncPaddingTop, landscape-mobile-aware; the chain page: its own
// simpler _syncBodyPadding) — passed in rather than assumed, since neither belongs
// in this shared, page-agnostic module.
//
// Vertical only. #map is width:100%/height:auto by default (css/map-container.css);
// dragging sets an explicit inline px height on the SVG, which letterboxes (shrinks
// the whole map, empty space above/below) rather than cropping/zooming, since
// map-container.js's own preserveAspectRatio defaults to "xMidYMid meet" — see the
// WorldMap class's own comment. Width is never touched, and dragging taller than
// the full-width natural height (mapNaturalHeight below) is capped there, since
// past that point there's nothing left to reveal — only more letterbox.
//
// Returns { mapNaturalHeight, clampMapHeight } — both callers need these beyond
// this wiring too (index.js's own window resize handler re-clamps on viewport
// change; mapNaturalHeight is the same "full-width contain point" used elsewhere).
export const wireMapHeightDrag = ({ storageKey, onDrag, onSettle, skipRestore = false }) => {
  const mapFooter = document.getElementById('map-footer');
  const mapContainer = document.getElementById('map-container');
  const mapEl = () => document.getElementById('map');

  const mapNaturalHeight = () => mapEl().getBoundingClientRect().width * (H / W);
  // Shrinks a previously-set explicit height back down if it now overshoots the natural
  // full-width height (e.g. the window narrowed since it was set, or since it was restored
  // from localStorage on load) — a no-op once #map is back to its default height:auto.
  const clampMapHeight = () => {
    const el = mapEl();
    if (!el.style.height) return;
    const natural = mapNaturalHeight();
    if (parseFloat(el.style.height) > natural) {
      el.style.height = natural + 'px';
      localStorage.setItem(storageKey, natural);
    }
  };

  const storedHeight = parseFloat(localStorage.getItem(storageKey));
  if (storedHeight && !skipRestore) mapEl().style.height = storedHeight + 'px';
  clampMapHeight();

  if (mapFooter) {
    let dragStartY = 0, dragStartHeight = 0, dragOtherHeight = 0, dragging = false;
    mapFooter.addEventListener('pointerdown', e => {
      // #zoom-reset/#zoom-span keep their own click behavior; #legend keeps its own — the
      // range-filter grips' pointerdown/pointermove/pointerup drag (legend.js's wireLegend())
      // would otherwise also bubble up here and fight with the map-height drag-resize below,
      // both racing to handle the same gesture.
      if (e.target.closest('button') || e.target.closest('#legend')) return;
      dragging = true;
      dragStartY = e.clientY;
      dragStartHeight = mapEl().getBoundingClientRect().height;
      // Everything else stacked inside #map-container (toggle bar + map-footer itself) —
      // held constant for the drag so the map's max height never pushes the bar off-screen.
      dragOtherHeight = mapContainer.getBoundingClientRect().height - dragStartHeight;
      mapFooter.setPointerCapture(e.pointerId);
    });
    mapFooter.addEventListener('pointermove', e => {
      if (!dragging) return;
      const minH = 120;
      const maxH = Math.min(
        window.innerHeight - mapContainer.getBoundingClientRect().top - dragOtherHeight - 20,
        mapNaturalHeight(),
      );
      const h = Math.max(minH, Math.min(maxH, dragStartHeight + (e.clientY - dragStartY)));
      mapEl().style.height = h + 'px';
      onDrag?.();
    });
    const endDrag = () => {
      if (!dragging) return;
      dragging = false;
      localStorage.setItem(storageKey, parseFloat(mapEl().style.height));
    };
    mapFooter.addEventListener('pointerup', endDrag);
    mapFooter.addEventListener('pointercancel', endDrag);
    // Double-click to reset back to the natural (full-width, no explicit override) height —
    // same reset gesture legend.js's own #legend-filter-device grips use, and the same
    // button/#legend exclusion as the drag above (a double-click on the zoom buttons or inside
    // #legend has its own meaning, not this). Animated: jumping straight to height:'' (the
    // drag's own live-update path, no transition) reads as an abrupt snap for a gesture that
    // isn't itself a drag — a real `height` transition eases it back, polled every frame via
    // rAF so a caller's own padding-sync tracks the animating edge instead of jumping once at
    // the end. `#map` has no transition of its own (css/map-container.css: height:auto by
    // default), so one is added here only for the duration of this animation and removed once
    // it settles — nothing else on the page reads or relies on it.
    mapFooter.addEventListener('dblclick', e => {
      if (e.target.closest('button') || e.target.closest('#legend')) return;
      const el = mapEl();
      const from = el.getBoundingClientRect().height;
      const to = mapNaturalHeight();
      localStorage.removeItem(storageKey);
      if (Math.abs(from - to) < 0.5) { el.style.height = ''; onSettle?.(); return; }
      let raf = null;
      const poll = () => { onSettle?.(); raf = requestAnimationFrame(poll); };
      const onEnd = ev => {
        if (ev.propertyName !== 'height') return;
        el.removeEventListener('transitionend', onEnd);
        cancelAnimationFrame(raf);
        el.style.transition = '';
        el.style.height = ''; // back to responsive height:auto, not pinned at the natural px value
        onSettle?.();
      };
      el.style.height = from + 'px'; // pin the live px height so the transition has a real start point
      void el.offsetHeight; // force reflow — otherwise the two writes coalesce and nothing animates
      el.style.transition = 'height .3s ease';
      el.addEventListener('transitionend', onEnd);
      poll();
      el.style.height = to + 'px';
    });
  }

  return { mapNaturalHeight, clampMapHeight };
};

// ── Choropleth data index ───────────────────────────────────────────────────────
// Pure function: rawData (data/v2/map.json shape: {data, natives, pop, capital}) → the
// byId/nativeByCountry/importByCountry indices choroFill()/METRIC read (count/
// nativeCount/importCount). Extracted from index.js's buildIndices(), which layers
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
// caller (chain onto the returned selections; see index.js's renderWorld for
// the pattern) since that's all page-specific (tooltips, dim mode, sidebar filters)
// with nothing generic left to share. `topojson` is read as a global (script tag),
// same convention <world-map> itself uses for `d3`.
export const paintChoropleth = (g, path, world, ukNations, byId) => {
  // Neutral gray, not blue — the violet theme's diverging scale (diverging-scale.js)
  // uses blue for its positive/export side, and a blue ocean competed with
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

// ── Dim/arc mode — export/import connection arcs ────────────────────────────────
// Extracted from index.js's arc drawing (module-level arcOffset/arrowPoints/
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
// centroid an import arc should actually point at. Same table index.js's own
// tooltip birth-country resolution uses.
export const _NULL_CENTROID_ID = { 'Democratic Republic of the Congo': 180, 'U.S.': 840, 'Kingdom of the Netherlands': 528 };

// Builds sourceId's import-arc data: Map<birthCountryId, playerCount> from
// importByCountry[sourceId] (buildChoroplethIndex's own return, or index.js's
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
