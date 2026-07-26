// js/legend.js
// The map's color-scale legend: gradient bar, rug plot, ticks, outlier dots, and the
// drag-to-filter range device. Pure visualization of js/diverging-scale.js's own color
// model — owns none of that math itself, just renders it.

import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import {
  color, normalize, divergingOutlierColor, getDivergingParams, onPaletteChange,
  METRIC, RATIO_MAX_POS, RATIO_MAX_NEG, OUTLIER_IDS_POS, OUTLIER_IDS_NEG,
} from './diverging-scale.js';

// ── Legend gradient + ticks + outlier count + range filter ─────────────────────
// Wires up #legend-bar/#legend-ticks/#legend-outlier-*/#legend-filter-device
// (the markup block in index.html and chains/wc2026_chain_longest.html — same ids on
// both pages, though only index.html carries #legend-filter-device and passes
// onRangeChange; the chain page has no category-filter system for a range selection to plug
// into, so its legend stays read-only, same as before this feature existed), self-registering
// an onPaletteChange listener so every piece repaints after a live #diverging-debug tweak.
// `getById()` is called lazily on every repaint (not read once) so callers can
// populate/replace their byId index after wireLegend() runs (map data loads
// asynchronously) — see refresh() below. Extracted from index.js's
// _buildLegendGradient/_updateLegendTicks/_updateLegendOutlier.
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
    filterDevice:    document.getElementById('legend-filter-device'),
  };

  // Bar position (0-1) for a value v — proportional to the *combined*
  // -RATIO_MAX_NEG..RATIO_MAX_POS domain (see the original comment history in index.js
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
    const target = v >= 0 ? getDivergingParams().easyRight : getDivergingParams().easyLeft;
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

  // A fixed step (not "half of that side's own domain max", the old formula) — the two domain
  // ceilings are wildly different sizes (42 vs 26 today), so "half of each" produced a different
  // step on every side (21 vs 13), which read as arbitrary rather than a real scale. Multiples of
  // TICK_STEP between 0 and each side's own edge, plus that edge itself whenever it isn't
  // already a clean multiple (26 isn't; 42 happens to be, so nothing gets duplicated there) —
  // works unchanged if RATIO_MAX_POS/NEG themselves change later, not hardcoded to today's exact
  // values.
  const TICK_STEP = 14;
  const updateTicks = () => {
    if (!els.ticks) return;
    const posTicks = [];
    for (let v = TICK_STEP; v < RATIO_MAX_POS; v += TICK_STEP) posTicks.push(v);
    posTicks.push(RATIO_MAX_POS);
    const negTicks = [];
    for (let v = -TICK_STEP; v > -RATIO_MAX_NEG; v -= TICK_STEP) negTicks.push(v);
    negTicks.push(-RATIO_MAX_NEG);
    const ticks = [...negTicks.reverse(), 0, ...posTicks].map(Math.round);
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
  // index.html — and a dot is a single discrete marker, not a proportional slice of the
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
      // Same "eases back to rest" treatment as js/index.js's own map-height resize bar
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

  const refresh = () => { buildGradient(); updateRug(); updateTicks(); updateOutlier(); renderRange(); };

  onPaletteChange(refresh);
  refresh();

  return { refresh };
};
