import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { unsafeHTML } from 'https://cdn.jsdelivr.net/npm/lit-html@3/directives/unsafe-html.js';
import { join } from 'https://cdn.jsdelivr.net/npm/lit-html@3/directives/join.js';
import { initEloRanking } from './elo_ranking.js';
import { QUALIFIED_NAMES, QUALIFIED_BY_NAME, buildEloItems, buildBracketState, buildMatchInfo, buildNameByIso2, loadEloData, playerDisplayName, playerSortKey } from './qualified.js';
import { LOCALE, _LANG, T, countryName, regionName, wikiUrl, wikiUrlEn, loadWikiData } from './i18n.js';
import { initGroupStage } from './group_stage.js';
import { initFixtureList } from './fixture_list.js';
import { initSidebar } from './control_sidebar.js';
import { loadSlice, saveSlice } from './persist.js';
import { animateFlagHidden, animateFlagOpacity } from './flag_visibility.js';
import { CONF_BOUNDS } from './conf.js';
import { iso2ForId, _NULL_CODE } from './iso2.js';
import { choroFill, getDivergingParams, setDivergingParams, currentTheme, onThemeChange,
         FLAG, FLAG_SIZE_ZOOM_EXP, FLAG_OFFSET_ZOOM_EXP, FLAG_CDN, FLAG_CDN_RECT, W, H,
         buildChoroplethIndex, paintChoropleth, wireLegend,
         CENTROID_OVERRIDE, dotCentroid, zoomToCentroid as _sharedZoomToCentroid,
         drawCountryArcs, rescaleArcs, computeImportIds, _NULL_CENTROID_ID, cityDotRadius } from './map-container.js';

const FOOTER_PANELS = {
  eloMeta:   false, // #elo-meta-panel — elo source/date meta
  selection: true,  // #selection-panel — capital/pop for active dim country
};

// Map infrastructure from <world-map> web component (defined in map-container.js)
const _wm       = document.querySelector('world-map');
const svg       = _wm.svg;
const projection = _wm.projection;
const path      = _wm.path;

let _worldTopo = null; // set once world-atlas JSON loads

// Arc geometry/colors (arcOffset/arrowPoints/appendArc/drawCountryArcs/rescaleArcs) now
// live in map-container.js, shared with the chain page's own dim/arc click handling.

const g = _wm.g;
const tt = document.getElementById('tooltip');
let lastTipKey = null;
const hideTip = () => { tt.style.display = 'none'; tt.classList.remove('tt-non-qualified'); lastTipKey = null; };


// CENTROID_OVERRIDE / dotCentroid now live in map-container.js (shared with the chain
// page's own zoomToCentroid) — fixes arc/zoom endpoints when path.centroid() lands
// outside the country polygon (or somewhere unrepresentative, e.g. dragged by overseas
// territories/outlying islands).

// Visual flag position — overrides where the flag icon is drawn (data-cx/data-cy + x/y).
// Arcs still connect to the geographic centroid (via CENTROID_OVERRIDE / dotCentroid).
const FLAG_POS_OVERRIDE = {
  191: [16.8, 45.8],    // Croatia — flag placed in Slavonia, away from the coastal strip
};

// While tab-players is active there's nothing on the map to click (flags are hidden, no
// click-to-select/deselect affordance) — _playersMapActive() defined further down, safe to
// reference here since this callback only ever runs later, on an actual click. The
// #tab-players-btn close (✕) is the only way to clear a selection while that tab is showing.
svg.on('click', () => { if (_playersMapActive()) return; clearDim(); clearFixtureSelection(); });
// The mouse leaving the map entirely (not just moving to open ocean, still inside the SVG —
// see the ocean's own mousemove above) is the other spot nothing was hiding the tooltip from
// during dim mode, for the same reason: every country/flag's mouseleave skips hideTip() while
// dim mode is active, assuming a subsequent hover elsewhere will replace it.
svg.on('mouseleave', () => { hideTip(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { clearDim(); clearFixtureSelection(); } });

// Zoom behaviour lives in <world-map>; register page-specific extra work here.
const zoom = _wm.zoom;
// Runs before the generic per-flag resize (map-container.js) so a blended-inset
// country's flag anchor (data-cx/data-cy) is up to date for THIS tick's k before
// that generic step reads it — no 1-frame lag.
_wm.onZoomPre = e => { _blendedInsets.forEach(fn => fn(e.transform.k)); };

const COUNTRY_STROKE_W = 0.3; // world-space base for .country/.mesh-border — see onZoom's 1/k compensation
_wm.onZoom = e => {
  dimState.k = e.transform.k;
  const k = dimState.k;
  // Country borders (and the mesh lines between them) would otherwise get
  // linearly thicker while zooming in, same as everything else in `g` — keep
  // them a near-constant screen weight instead, like arc-lines/leader-lines
  // already do below. (.country-extra — the blended-zoom island insets — is
  // excluded here since it lives inside its own extra-scaled group and
  // compensates for that separately, in buildBlendedInset's own update().)
  g.selectAll('.country:not(.country-extra), .mesh-border').attr('stroke-width', COUNTRY_STROKE_W / k);
  // Fixed-zoom insets (Cape Verde, Curaçao…) — counter-scale by 1/k so their
  // content stays a constant on-screen size regardless of the main map's zoom.
  g.selectAll('.inset-fixed-scale').attr('transform', function() {
    const cx = +this.getAttribute('data-cx'), cy = +this.getAttribute('data-cy');
    return `translate(${cx},${cy}) scale(${1 / k})`;
  });
  rescaleArcs(g, k);
  _syncResetBtn(e.transform);
  const zoomEl = document.getElementById('zoom-level');
  if (zoomEl) zoomEl.textContent = `k=${e.transform.k.toFixed(2)}`;
};

// Loading placeholder — shown before world.json arrives, then fully covered by
// renderWorld()'s own ocean fill. Not repainted on setTheme() (the loading window
// is brief and renderWorld() always reads the theme live once data does arrive).
g.append('path').datum({type:'Sphere'})
  .attr('d', path).attr('fill', currentTheme().placeholderFill).attr('stroke', currentTheme().placeholderStroke).attr('stroke-width',.5)
  .attr('cursor', 'default')
  .on('mousemove', () => { hideTip(); });
g.append('path').datum(d3.geoGraticule()())
  .attr('d', path).attr('fill','none').attr('stroke', currentTheme().graticule).attr('stroke-width',.25);

// QUALIFIED_NAMES, QUALIFIED_BY_NAME imported from qualified.js



const DOCUMENT_TITLE = "Thiebaud's Mundial";

// _NULL_CENTROID_ID (null-ID birth countries → numeric topojson ID) now lives in
// map-container.js, shared with the chain page's own computeImportIds().

// Apply locale to static page elements
document.title = DOCUMENT_TITLE;
document.querySelector('meta[name="description"]')?.setAttribute('content', T.pageDescription);
const _quotes = T.pageQuotes;
let _quoteIdx = Math.floor(Math.random() * _quotes.length);
const _pqWrap = document.querySelector('#page-heading-sub .pq-wrap');
const _pqPrev = _pqWrap.querySelector('.pq-prev');
const _pqCur  = _pqWrap.querySelector('.pq-cur');
const _pqDotsEl = document.querySelector('#page-heading-sub .pq-dots');
_pqDotsEl.innerHTML = _quotes.map((_, i) => `<span class="pq-dot${i === _quoteIdx ? ' active' : ''}" data-idx="${i}">‹</span>`).join('');
const _pqDots = _pqDotsEl.querySelectorAll('.pq-dot');
_pqDotsEl.addEventListener('click', e => {
  const dot = e.target.closest('.pq-dot');
  if (!dot) return;
  const idx = Number(dot.dataset.idx);
  if (idx === _quoteIdx) return;
  _quoteIdx = idx;
  _fillPanel(_pqCur, _quoteIdx);
  _fillPanel(_pqPrev, _prevIdx());
  _pqDots.forEach((d, i) => d.classList.toggle('active', i === _quoteIdx));
  if (_pageHeader) {
    requestAnimationFrame(() => {
      document.documentElement.style.setProperty('--page-header-h', _computeHeaderHeight() + 'px');
      _syncPaddingTop();
    });
  }
});
const _fmtAttr = q => `<span class="pq-author">${q.author}</span>${q.sep}<cite>${q.work}</cite>${q.ref ? ', ' + q.ref : ''} <time datetime="${q.date}">${q.date}</time>`;
const _fillPanel = (panel, idx) => {
  const q = _quotes[idx];
  panel.querySelector('.pq-text').innerHTML = q.text;
  panel.querySelector('.pq-attr').innerHTML = _fmtAttr(q);
};
const _prevIdx = () => (_quoteIdx + _quotes.length - 1) % _quotes.length;
_fillPanel(_pqCur, _quoteIdx);
_fillPanel(_pqPrev, _prevIdx());
{
  let x0 = null, sidebarWasOpen = false, dragging = false;
  const hdr = document.getElementById('page-header');
  const setDrag = dx => {
    _pqPrev.style.transform = `translateX(calc(-100% + ${dx}px))`;
    _pqCur.style.transform  = `translateX(${dx}px)`;
  };
  const clearDrag = () => {
    _pqPrev.style.transform = '';
    _pqCur.style.transform  = '';
    _pqPrev.style.transition = '';
    _pqCur.style.transition  = '';
  };
  const setTransition = val => {
    _pqPrev.style.transition = val;
    _pqCur.style.transition  = val;
  };
  hdr.addEventListener('touchstart', e => {
    x0 = e.touches[0].clientX;
    dragging = false;
    const csb = document.getElementById('control-sidebar');
    sidebarWasOpen = csb && !csb.classList.contains('collapsed');
    setTransition('none');
  }, { passive: true });
  hdr.addEventListener('touchmove', e => {
    if (x0 == null || sidebarWasOpen) return;
    const dx = e.touches[0].clientX - x0;
    if (!dragging && dx > 10) dragging = true;
    if (dragging) setDrag(Math.max(0, dx));
  }, { passive: true });
  hdr.addEventListener('touchend', e => {
    if (x0 == null) { clearDrag(); return; }
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (!dragging || sidebarWasOpen) { clearDrag(); return; }
    dragging = false;
    const w = _pqWrap.offsetWidth;
    if (dx < 50) {
      setTransition('transform .2s ease-out');
      setDrag(0);
      setTimeout(clearDrag, 220);
      return;
    }
    setTransition('transform .2s ease-out');
    setDrag(w);
    setTimeout(() => {
      _quoteIdx = _prevIdx();
      _fillPanel(_pqCur, _quoteIdx);
      _fillPanel(_pqPrev, _prevIdx());
      _pqDots.forEach((d, i) => d.classList.toggle('active', i === _quoteIdx));
      clearDrag();
      if (_pageHeader) {
        requestAnimationFrame(() => {
          document.documentElement.style.setProperty('--page-header-h', _computeHeaderHeight() + 'px');
          _syncPaddingTop();
        });
      }
    }, 220);
  });
  hdr.addEventListener('touchcancel', () => { x0 = null; dragging = false; clearDrag(); });
}
{
  let _lpTimer = null, _lpActive = false;
  const _lpShow = () => {
    const q = _quotes[_quoteIdx];
    if (!q.original) return;
    _lpActive = true;
    _pqCur.querySelector('.pq-text').innerHTML = q.original;
  };
  const _lpHide = () => {
    if (!_lpActive) return;
    _lpActive = false;
    _pqCur.querySelector('.pq-text').innerHTML = _quotes[_quoteIdx].text;
  };
  const _lpCancel = () => { clearTimeout(_lpTimer); _lpTimer = null; };
  const phs = document.getElementById('page-heading-sub');
  phs.addEventListener('touchstart', () => {
    _lpCancel();
    _lpTimer = setTimeout(_lpShow, 500);
  }, { passive: true });
  phs.addEventListener('contextmenu', e => e.preventDefault());
  document.addEventListener('touchend', () => { _lpCancel(); _lpHide(); });
  document.addEventListener('touchcancel', () => { _lpCancel(); _lpHide(); });
  phs.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    _lpCancel();
    _lpTimer = setTimeout(_lpShow, 500);
  });
  document.addEventListener('mouseup', () => { _lpCancel(); _lpHide(); });
}
const _zoomHintEl = document.getElementById('zoom-hint');
_zoomHintEl.textContent = T.zoomHint;
let _initialTransform = d3.zoomIdentity;
const _zoomResetBtn = document.getElementById('zoom-reset');
const _zoomSpanBtn  = document.getElementById('zoom-span');
const _syncResetBtn = t => {
  if (!_zoomResetBtn) return;
  _zoomResetBtn.disabled = Math.abs(t.k - _initialTransform.k) < 0.001
    && Math.abs(t.x - _initialTransform.x) < 0.5
    && Math.abs(t.y - _initialTransform.y) < 0.5;
};
_syncResetBtn(_initialTransform);
document.getElementById('zoom-reset').addEventListener('click', e => {
  e.stopPropagation();
  svg.transition().duration(400).call(zoom.transform, _initialTransform);
});
_zoomSpanBtn?.addEventListener('click', e => {
  e.stopPropagation();
  _zoomToVisibleFlags();
});


function _highlightConf(ids) {
  g.selectAll('.conf-boundary').remove();
  if (!ids || !_worldTopo) return;
  // Draw only the external boundary: arcs where exactly one side is in the confederation
  // (a === b) catches coastlines of confederation countries (exterior arcs)
  g.append('path')
    .classed('conf-boundary', true)
    .datum(topojson.mesh(_worldTopo, _worldTopo.objects.countries, (a, b) =>
      (a === b && ids.has(+a.id)) || (a !== b && ids.has(+a.id) !== ids.has(+b.id))
    ))
    .attr('d', path)
    .attr('fill', 'none')
    .attr('stroke', '#1C274C')
    .attr('stroke-width', 1.2)
    .attr('stroke-opacity', 0.7)
    .attr('pointer-events', 'none');
}

document.getElementById('map').setAttribute('aria-label', T.mapAriaLabel);
// #tab-players' actual first paint happens once app.byId/nativeByCountry/importByCountry load
// (see the data-load callback below, right after buildIndices(rawData) runs) — nothing to render
// synchronously here, _playersTableTemplate isn't defined yet at this point in module evaluation.

// Elo ranking tab — two-column layout: ranking list (flex:1) + collapsible sidebar
let _eloData   = null;
const _fifaMemberIds = new Set();
// Every id present in data/elo_rank.json's rankings at all — used solely by
// _isCountryCategoryVisible's own guard (a country with no Elo entry whatsoever is never
// "visible", regardless of any checkbox — see that function's own comment). Populated later,
// same by-reference pattern as _fifaMemberIds (same line) — empty at construction time,
// correctly filled in by the time it's actually queried.
const _eloRankedIds = new Set();
// Shared between tab-teams (default) and tab-tournament — see _switchTab below, which
// reparents this same .elo-layout wrapper between the two panes instead of duplicating it.
// `all-stages` opts this instance into the carousel's leading "Whole competition" slide
// (js/elo_ranking.js's connectedCallback).
render(html`<div class="elo-layout"><elo-ranking class="elo-main" all-stages></elo-ranking></div>`, document.getElementById('tab-teams'));
const _eloLayoutEl = document.querySelector('.elo-layout');
const _eloMain = document.querySelector('.elo-main');
const _eloMetaPanel = FOOTER_PANELS.eloMeta ? document.getElementById('elo-meta-panel') : null;

// Group Stage view (js/group_stage.js) and the "Whole competition" fixture list (js/
// fixture_list.js, carousel stage -1) — both siblings of <elo-ranking>'s own .elo-list *inside*
// .elo-viz (not siblings of .elo-layout at the #tab-tournament level) — this matters
// structurally, not just cosmetically: the carousel is always .elo-viz's first child, so putting
// both views inside .elo-viz too keeps the carousel above them exactly like every other stage,
// regardless of which tab currently hosts the reparented .elo-layout. Exactly one of the three
// (.elo-list, _groupStageEl, _fixtureListEl) is ever visible at once — see
// _updateGroupStageVisibility below, which despite its name now owns all three, not just the
// group view (kept its original name — renaming would touch every call site for no behavioral
// gain).
const _groupStageEl = document.createElement('div');
_groupStageEl.id = 'group-stage-view';
_groupStageEl.className = 'taxonomy';
_groupStageEl.hidden = true;
const _fixtureListEl = document.createElement('div');
_fixtureListEl.id = 'fixture-list-view';
_fixtureListEl.className = 'taxonomy'; // .elo-pair/.elo-item pill styling (css/taxonomy.css) is scoped under this — matches _groupStageEl's own pattern (both also inherit it from #tab-teams/#tab-tournament's own .taxonomy class, but not relying on that here keeps this element correct on its own)
_fixtureListEl.hidden = true;
const _eloListEl = _eloMain.querySelector('.elo-list');
_eloMain.querySelector('.elo-viz').append(_groupStageEl, _fixtureListEl);
// -1 ("Whole competition") is the carousel's own real default once it has a leading slide (see
// js/elo_ranking.js's all-stages) — matching that here means this page-local mirror of the
// carousel's stage is already correct before any real stage-change event has fired (the widget
// never announces its own construction-time default via an event — see control_sidebar.js's
// MODE_BEHAVIOR.tournament.defaultStage for the fuller version of this same reasoning).
let _currentCarouselStage = -1;
let _activeTab = 'tab-teams'; // updated by _switchTab below
let _groupStage = null; // initGroupStage(...) handle, set once fixturesData loads
let _fixtureList = null; // initFixtureList(...) handle, set once fixturesData loads
// Set of numeric team ids — driven by group_stage.js's group selector ("show only this
// group's 4 teams' flags on the map"); a full override of the sidebar's own category filter
// (see control_sidebar.js's applyFlagFilter/callbacks.afterFlagFilter) for exactly these 4
// flags, run on top of it rather than folded into it, since this is a map-level concern the
// sidebar itself has no reason to know about — every flag not in the focused group is hidden,
// and every flag in it is forced visible regardless of what the checkboxes currently say.
let _groupFocusIds = null;
const _applyGroupFocus = () => {
  if (!_groupFocusIds || typeof d3 === 'undefined') return;
  animateFlagHidden(d3.selectAll('.flag-qualified[data-elo-cat]'), el => !_groupFocusIds.has(+el.getAttribute('data-id')));
};
const _updateGroupStageVisibility = () => {
  const onTournament = _activeTab === 'tab-tournament';
  const showGroup = onTournament && _currentCarouselStage === 0;
  const showFixtures = onTournament && _currentCarouselStage === -1;
  _groupStageEl.hidden = !showGroup;
  _fixtureListEl.hidden = !showFixtures;
  _eloListEl.hidden = showGroup || showFixtures;
  // Re-syncs the map's own group-focus filter to match whatever group_stage.js's own
  // (persisted, tab-switch-proof) selection currently is — entering re-applies it, leaving
  // clears it so the map doesn't stay silently stuck showing only 4 flags while the user
  // browses an unrelated tab. Deliberately bypasses onGroupSelect/_select here: this isn't the
  // user picking a new group, just the same selection becoming visible or not, so it shouldn't
  // reset group_stage.js's own state, re-persist anything, or clear an active dim selection.
  _groupFocusIds = (showGroup && _groupStage?.selected) ? new Set(_groupStage.selectedTeamIds) : null;
  sidebar.applyFlagFilter();
};
// Bubbles from stage_carousel.js through <elo-ranking> — same event control_sidebar.js already
// listens to (js/control_sidebar.js's eloMain.addEventListener('stage-change', ...)); this is
// an independent second listener, not a replacement for that one.
_eloMain.addEventListener('stage-change', e => {
  _currentCarouselStage = e.detail.stage;
  _updateGroupStageVisibility();
});
// Measure actual header height (offsetHeight forces reflow after CSS var is applied)
const _pageHeader = document.getElementById('page-header');
const _pageHeadingSub = document.getElementById('page-heading-sub');
// #sidebar-host is position:absolute (see wc2026_map.html) so it never affects #page-header's
// own (quote-only) box — when collapsed it just overlaps the map below, as intended. When
// expanded, the map still needs to make room for it, so the target height is computed here
// as max(quote bottom, sidebar bottom) rather than left to grid auto-sizing.
const _computeHeaderHeight = () => {
  if (!_pageHeader) return 0;
  // Natural (unpushed) total header height, reconstructed from .pq-wrap's own bottom — an
  // anchor .pq-dots' margin push (below) never touches — rather than measured off #page-header
  // itself. An earlier version reset .pq-dots' margin to '' to get this same "natural" read off
  // #page-header, then immediately overwrote it with the real value; that reset-then-set pair,
  // separated by a forced-layout read, retargets/kills the CSS transition on .pq-dots (it only
  // ever sees a single write per call now, so the transition runs cleanly).
  const dotsHeight = _pqDotsEl.offsetHeight;
  const paddingBottom = parseFloat(getComputedStyle(_pageHeadingSub).paddingBottom) || 0;
  const quoteBottom = _pqWrap.getBoundingClientRect().bottom + dotsHeight + paddingBottom;
  const csb = document.getElementById('control-sidebar');
  let target = quoteBottom;
  if (csb && !csb.classList.contains('collapsed')) {
    const csbH = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--csb-h')) || 0;
    target = Math.max(quoteBottom, _pageHeader.getBoundingClientRect().top + csbH);
  }
  // Push .pq-dots down to sit flush against the (possibly lower, sidebar-expanded) map instead
  // of leaving a gap. Tried stretching #page-heading-sub itself first (via height/min-height,
  // relying on .pq-dots' CSS margin-top:auto to consume the free space) — grid's "automatic
  // minimum size" for a stretched item with visible overflow made the box render *taller* than
  // the value actually set (~32px overshoot, reproduced with min-height and with height alike).
  // Overriding the margin directly sidesteps grid item sizing entirely. Always a definite px
  // value (never '' / the CSS auto default) — transitioning to/from auto doesn't animate (see
  // .pq-dots' own transition in wc2026_map.css), so this needs a real number even at 0.
  const extra = Math.max(0, target - quoteBottom);
  _pqDotsEl.style.marginTop = extra + 'px';
  return target;
};
if (_pageHeader) document.documentElement.style.setProperty('--page-header-h', _computeHeaderHeight() + 'px');
const _isFullyVisible = el => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const padTop = parseFloat(document.documentElement.style.scrollPaddingTop)    || 0;
  const padBot = parseFloat(document.documentElement.style.scrollPaddingBottom) || 0;
  return r.top >= padTop && r.bottom <= window.innerHeight - padBot;
};
const _scrollToActiveElo = () => {
  const el = _eloMain.querySelector('.elo-item--active');
  if (el && !_isFullyVisible(el)) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// padding-top = bottom edge of fixed map container (exact, no formula needed)
const _mc = document.getElementById('map-container');
const _landscapeMQ = window.matchMedia('(max-height: 500px) and (orientation: landscape)');
const _isLandscapeMobile = () => _landscapeMQ.matches;
// map-container.js defaults #map's SVG to preserveAspectRatio="meet" (letterbox on shrink,
// see its own comment) — landscape-mobile is the one deliberate exception (full-bleed cover,
// css/map-container.css forces #map to width:100%/height:100% there), so this flips it to
// 'slice' only in that mode and back to 'meet' everywhere else. Called on load and on every
// resize/orientation change (below) since _isLandscapeMobile() can flip either way.
const _syncMapFit = () => {
  document.getElementById('map')?.setAttribute('preserveAspectRatio', `xMidYMid ${_isLandscapeMobile() ? 'slice' : 'meet'}`);
};
_syncMapFit();
_landscapeMQ.addEventListener('change', _syncMapFit);
// The height at which #map's box aspect ratio matches the viewBox's (W/H, see map-container.js)
// at its current rendered width — i.e. the full-width "contain" point. Past this, taller is
// just empty letterbox space (once preserveAspectRatio is 'meet'); the drag handle and the
// localStorage-restored height (below) both cap themselves here so dragging can't overshoot
// into that dead zone.
const _mapNaturalHeight = () => document.getElementById('map').getBoundingClientRect().width * (H / W);
const _MAP_HEIGHT_KEY = 'mundial-map-height';
// Shrinks a previously-set explicit height back down if it now overshoots the natural
// full-width height (e.g. the window narrowed since it was set, or since it was restored
// from localStorage on load) — a no-op once #map is back to its default height:auto.
const _clampMapHeight = () => {
  const mapEl = document.getElementById('map');
  if (!mapEl.style.height) return;
  const natural = _mapNaturalHeight();
  if (parseFloat(mapEl.style.height) > natural) {
    mapEl.style.height = natural + 'px';
    localStorage.setItem(_MAP_HEIGHT_KEY, natural);
  }
};
const _syncPaddingTop = () => {
  if (_isLandscapeMobile()) {
    document.body.style.paddingTop    = '0';
    document.body.style.paddingBottom = '0';
    document.documentElement.style.scrollPaddingTop    = '0';
    document.documentElement.style.scrollPaddingBottom = '0';
    return;
  }
  if (_mc) {
    // Uses the *target* header height, not a live read of #map-container's own rect — its
    // `top` now transitions (see map-container.css), so a live read right after changing
    // --page-header-h would catch it mid-animation and go stale. #map-container's own height
    // is intrinsic (content-driven), unaffected by `top`, so it's safe to read live here —
    // including while #map-collapse (its child) is mid-collapse/expand, since that's a normal
    // height change like any other resize (see the Bootstrap Collapse wiring below, which polls
    // this function every frame during that transition so #bottomTabContent tracks it live).
    const mapBottom = _computeHeaderHeight() + _mc.getBoundingClientRect().height + (parseFloat(getComputedStyle(_mc).marginBottom) || 0);
    document.body.style.paddingTop = mapBottom + 'px';
    document.documentElement.style.scrollPaddingTop    = mapBottom + 'px';
    document.documentElement.style.scrollPaddingBottom = (_bottomPanel ? _bottomPanel.offsetHeight : 0) + 'px';
  }
};
requestAnimationFrame(_syncPaddingTop);

// Map show/hide — a real Bootstrap Collapse (#map-collapse, see wc2026_map.html).
// #map-container itself stays position:fixed and is never touched here; only its
// inner wrapper collapses, so #map-container's own rect shrinks like any other
// resize and _syncPaddingTop's normal read of it (above) already tracks the result.
// The rAF loop below just keeps that same function polling every frame *during*
// Bootstrap's own ~350ms height transition, since a single call per show/hide event
// wouldn't catch the in-between frames.
const _mapCollapseEl = document.getElementById('map-collapse');
const _mapToggleBar = document.getElementById('map-toggle-bar');
const _mapCollapse = _mapCollapseEl ? bootstrap.Collapse.getOrCreateInstance(_mapCollapseEl, { toggle: false }) : null;
const _MAP_COLLAPSED_KEY = 'mundial-map-collapsed';
// The user's real preference, independent of the collapse's live DOM state — landscape
// mode force-expands the map without touching this (see the resize listener below).
let _userWantsMapOpen = localStorage.getItem(_MAP_COLLAPSED_KEY) !== '1';
let _mapToggleRaf = null;
const _pollPaddingDuringMapToggle = () => { _syncPaddingTop(); _mapToggleRaf = requestAnimationFrame(_pollPaddingDuringMapToggle); };
if (_mapCollapseEl) {
  const _paintMapToggleChevron = expanded => { if (_mapToggleBar) _mapToggleBar.textContent = expanded ? '⌄' : '⌃'; };
  _paintMapToggleChevron(_mapCollapseEl.classList.contains('show'));
  // body's own `transition: padding-top 0.4s ease` (css/wc2026_map.css) exists for the
  // single-shot onSidebarToggle path — driving padding-top every rAF frame here too would
  // double-animate it (body keeps easing toward each frame's already-eased target),
  // visibly lagging #bottomTabContent behind the map. Suspend it for the transition only.
  _mapCollapseEl.addEventListener('show.bs.collapse', () => {
    document.body.style.transition = 'none';
    _paintMapToggleChevron(true);
    if (_mapToggleRaf) cancelAnimationFrame(_mapToggleRaf);
    _pollPaddingDuringMapToggle();
  });
  _mapCollapseEl.addEventListener('hide.bs.collapse', () => {
    document.body.style.transition = 'none';
    _paintMapToggleChevron(false);
    if (_mapToggleRaf) cancelAnimationFrame(_mapToggleRaf);
    _pollPaddingDuringMapToggle();
  });
  const _settleMapToggle = expanded => {
    if (_mapToggleRaf) cancelAnimationFrame(_mapToggleRaf);
    _mapToggleRaf = null;
    _syncPaddingTop();
    document.body.style.transition = '';
    // Landscape force-expand (see resize listener below) must not overwrite the user's
    // real saved preference.
    if (_isLandscapeMobile()) return;
    _userWantsMapOpen = expanded;
    localStorage.setItem(_MAP_COLLAPSED_KEY, expanded ? '0' : '1');
  };
  _mapCollapseEl.addEventListener('shown.bs.collapse', () => _settleMapToggle(true));
  _mapCollapseEl.addEventListener('hidden.bs.collapse', () => _settleMapToggle(false));
  if (_mapToggleBar) {
    _mapToggleBar.title = T.sortLabels.mapHint;
    _mapToggleBar.setAttribute('aria-label', T.sortLabels.map);
  }
  // Apply the saved preference before first paint, no animation (mirrors the old
  // checkbox-restore behavior — same one-frame-late timing as the rest of this module).
  if (!_userWantsMapOpen && !_isLandscapeMobile()) {
    _mapCollapseEl.classList.remove('show');
    _paintMapToggleChevron(false);
    _mapToggleBar?.setAttribute('aria-expanded', 'false');
  }
}
document.addEventListener('keydown', e => {
  if (!_mapCollapse || e.key.toLowerCase() !== 'm' || !e.ctrlKey || e.metaKey || e.altKey) return;
  e.preventDefault();
  _mapCollapse.toggle();
});

window.addEventListener('resize', () => {
  if (_pageHeader) document.documentElement.style.setProperty('--page-header-h', _computeHeaderHeight() + 'px');
  _syncMapFit();
  _clampMapHeight();
  _syncMapHeight();
  // Landscape mobile is always immersive-map (see map-container.css) — force it open if it
  // was left collapsed from portrait, since the toggle bar itself is hidden there and the
  // user would otherwise have no way to reopen it. Restore their real preference on the way
  // back out, once the landscape constraint no longer applies.
  if (_mapCollapse) {
    if (_isLandscapeMobile()) {
      if (!_mapCollapseEl.classList.contains('show')) _mapCollapse.show();
    } else if (_userWantsMapOpen !== _mapCollapseEl.classList.contains('show')) {
      _userWantsMapOpen ? _mapCollapse.show() : _mapCollapse.hide();
    }
  }
});
// Tracks #page-header's own live height (the quote block — #sidebar-host is position:absolute
// and never affects it, see wc2026_map.html), e.g. when a longer/shorter quote is paged in.
if (_pageHeader) new ResizeObserver(() => {
  document.documentElement.style.setProperty('--page-header-h', _computeHeaderHeight() + 'px');
  _syncPaddingTop();
}).observe(_pageHeader);
const _bottomPanel  = document.getElementById('bottom-panel');
const _bottomTabNav = document.getElementById('bottomTabList');
// #zoom-hint and #zoom-reset/#zoom-span/#theme-toggle used to be positioned here on every
// call (getBoundingClientRect() math against #map/#map-container) — both are plain CSS now
// (css/map-container.css's #map-frame/#zoom-hint, and #map-controls' normal flex flow), so
// this is just a one-frame-deferred _syncPaddingTop, kept as its own function since callers
// throughout this file already call it by this name after anything that can change #map's
// rendered box (resize, collapse toggle, drag-resize, dim-mode zoom).
const _syncMapHeight = () => requestAnimationFrame(_syncPaddingTop);
if (_bottomPanel) new ResizeObserver(() => {
  if (!_isLandscapeMobile()) document.body.style.paddingBottom = _bottomPanel.offsetHeight + 'px';
  _syncMapHeight();
}).observe(_bottomPanel);
_syncMapHeight();

// #legend-parent drag-resize — vertical only. #map is width:100%/height:auto by default
// (css/map-container.css); dragging sets an explicit inline px height on the SVG, which
// letterboxes (shrinks the whole map, empty space above/below) rather than cropping/zooming,
// since map-container.js's preserveAspectRatio defaults to "xMidYMid meet" — see its own
// comment. Width is never touched, and dragging taller than the full-width natural height
// (_mapNaturalHeight above) is capped there, since past that point there's nothing left to
// reveal — only more letterbox. Reuses _syncMapHeight/_syncPaddingTop (above) to keep body
// padding in sync during the drag, same as the map-collapse toggle does — #zoom-hint's own
// position is plain CSS now (#map-frame/#zoom-hint, css/map-container.css) and needs no JS
// at all.
const _legendParent = document.getElementById('legend-parent');
const _storedMapHeight = parseFloat(localStorage.getItem(_MAP_HEIGHT_KEY));
if (_storedMapHeight && !_isLandscapeMobile()) document.getElementById('map').style.height = _storedMapHeight + 'px';
_clampMapHeight();
if (_legendParent) {
  let _dragStartY = 0, _dragStartHeight = 0, _dragOtherHeight = 0, _dragging = false;
  _legendParent.addEventListener('pointerdown', e => {
    if (e.target.closest('button')) return; // #zoom-reset/#zoom-span/#theme-toggle keep their own click behavior
    const mapEl = document.getElementById('map');
    _dragging = true;
    _dragStartY = e.clientY;
    _dragStartHeight = mapEl.getBoundingClientRect().height;
    // Everything else stacked inside #map-container (toggle bar + legend-parent itself) —
    // held constant for the drag so the map's max height never pushes the bar off-screen.
    _dragOtherHeight = _mc.getBoundingClientRect().height - _dragStartHeight;
    _legendParent.setPointerCapture(e.pointerId);
  });
  _legendParent.addEventListener('pointermove', e => {
    if (!_dragging) return;
    const minH = 120;
    const maxH = Math.min(
      window.innerHeight - _mc.getBoundingClientRect().top - _dragOtherHeight - 20,
      _mapNaturalHeight(),
    );
    const h = Math.max(minH, Math.min(maxH, _dragStartHeight + (e.clientY - _dragStartY)));
    document.getElementById('map').style.height = h + 'px';
    _syncMapHeight();
  });
  const _endMapDrag = () => {
    if (!_dragging) return;
    _dragging = false;
    localStorage.setItem(_MAP_HEIGHT_KEY, parseFloat(document.getElementById('map').style.height));
  };
  _legendParent.addEventListener('pointerup', _endMapDrag);
  _legendParent.addEventListener('pointercancel', _endMapDrag);
}

const _scrollTopBtn = document.getElementById('scroll-top-btn');
if (_scrollTopBtn) {
  window.addEventListener('scroll', () => {
    _scrollTopBtn.classList.toggle('visible', window.scrollY > 0);
  }, { passive: true });
  _scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

const _eloItemsById = new Map();
let _renderEloBase = null;

let _worldFeatures, _ukFeatures;

const _zoomToActiveDimFlags = () => {
  // Stage 1: zoom to source country boundaries
  zoomToCentroid(dimState.sourceId, 1200);
  // Stage 2: span all linked countries — commented out, preserved for future use
  // const [vbX, vbY, vbW, vbH] = svg.attr('viewBox').split(' ').map(Number);
  // svg.transition().duration(1200).call(zoom.transform, ...).on('end', () => {
  //   const xs = [], ys = [];
  //   g.selectAll('.flag-qualified[data-dim-visible]').each(function() {
  //     xs.push(+this.getAttribute('data-cx')); ys.push(+this.getAttribute('data-cy'));
  //   });
  //   const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  //   const pad = 20;
  //   const k = Math.max(1, Math.min(9, Math.min(vbW/(x1-x0+2*pad), vbH/(y1-y0+2*pad))));
  //   svg.transition().duration(1500).call(zoom.transform,
  //     d3.zoomIdentity.translate(vbX+vbW/2-k*(x0+x1)/2, vbY+vbH/2-k*(y0+y1)/2).scale(k));
  // });
};

// Fits the view to whatever flags are actually "in view" right now, however that's currently
// decided — the sidebar/group-focus filter (visibility:hidden) always applies, and dim mode
// (dimState.active) additionally narrows it down to just the source country plus its linked
// destinations/origins (data-dim-visible; a non-linked flag stays technically visible during
// dim mode, just faded via opacity, which is why that's checked separately from visibility
// here). Generalizes what used to be dim-mode-only ("linked countries" — see #zoom-span's own
// old aria-label) to every state this button can be clicked in, including no selection at all
// (fits every currently-shown flag) and the group-stage view's "focus on these 4" (js/
// group_stage.js) — in all three cases "in view" reduces to the same two checks below, so one
// function covers them without needing to know which state is actually active.
const _zoomToVisibleFlags = () => {
  const xs = [], ys = [];
  g.selectAll('.flag-qualified[data-elo-cat]').each(function() {
    if (this.getAttribute('visibility') === 'hidden') return;
    if (dimState.active) {
      const id = +this.getAttribute('data-id');
      if (id !== dimState.sourceId && !this.hasAttribute('data-dim-visible')) return;
    }
    const cx = +this.getAttribute('data-cx'), cy = +this.getAttribute('data-cy');
    if (isFinite(cx) && isFinite(cy)) { xs.push(cx); ys.push(cy); }
  });
  if (xs.length === 0) return;
  const [vbX, vbY, vbW, vbH] = svg.attr('viewBox').split(' ').map(Number);
  if (xs.length > 1) {
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 20;
    const k = Math.max(1, Math.min(9, Math.min(vbW / (x1 - x0 + 2 * pad), vbH / (y1 - y0 + 2 * pad))));
    svg.transition().duration(1500).call(zoom.transform, d3.zoomIdentity.translate(vbX + vbW / 2 - k * (x0 + x1) / 2, vbY + vbH / 2 - k * (y0 + y1) / 2).scale(k));
  } else {
    const k2 = 9;
    svg.transition().duration(1500).call(zoom.transform, d3.zoomIdentity.translate(vbX + vbW / 2 - k2 * xs[0], vbY + vbH / 2 - k2 * ys[0]).scale(k2));
  }
};


// Thin adapter over map-container.js's shared zoomToCentroid (also used, unadapted, by
// the chain page) — bundles this page's own D3 handles/feature arrays into the context
// object it expects, so every existing call site here (zoomToCentroid(id[, duration]))
// keeps working unchanged.
const zoomToCentroid = (id, duration = 2000) =>
  _sharedZoomToCentroid({ svg, zoom, path, centroids, worldFeatures: _worldFeatures, ukFeatures: _ukFeatures }, id, duration);

// Pans/zooms to a birth city — a single point, not a country with mainland bounds to fit, so
// "close" rather than "fit bounds" is the only sensible target. k=120 rather than the zoom
// behavior's own scaleExtent ceiling (map-container.js's d3.zoom().scaleExtent([1, 200])) — 200
// read as over-zoomed in practice (per the "born in" cell click this was built for — see
// _allPlayersRow). Shows that city's own tooltip once the transition settles, anchored to the
// dot's real on-screen position (getBoundingClientRect() on the actual circle, found via its
// data-key — see _updatePlayerCityDots) rather than re-deriving screen coordinates from the
// projection + zoom transform by hand.
const _zoomToCity = rec => {
  const key = `${rec.lat.toFixed(3)},${rec.lon.toFixed(3)}`;
  const [cx, cy] = projection([rec.lon, rec.lat]);
  const [vbX, vbY, vbW, vbH] = svg.attr('viewBox').split(' ').map(Number);
  const k = 30;
  const tx = vbX + vbW / 2 - k * cx;
  const ty = vbY + vbH / 2 - k * cy;
  svg.transition().duration(1200).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k))
    .on('end', () => {
      const dotEl = g.select(`.city-dots circle[data-key="${key}"]`).node();
      if (!dotEl) return;
      const r = dotEl.getBoundingClientRect();
      showCityTip({ pageX: r.left + r.width / 2 + window.scrollX, pageY: r.top + r.height / 2 + window.scrollY }, rec);
    });
};

// Persistent "selected" row(s) in #tab-players' table, by pid — driven declaratively (see
// _allPlayersRow's own class binding) rather than imperative classList toggling, so a re-render
// for any unrelated reason (sort click, focus change) can never silently drop the selection's
// styling the way a manually-added class would. Either _selectRows (a city dot click, below) or
// a "born in" cell click (see _allPlayersRow) replaces this outright — there's only ever one
// selection, from whichever source set it last.
let _selectedPids = new Set();
const _selectRows = pids => {
  _selectedPids = new Set(pids.filter(pid => pid != null).map(String));
  const ptEl = document.getElementById('tab-players');
  if (ptEl) render(_playersTableTemplate(_ptFocusIds), ptEl);
};

// The reverse direction of _zoomToCity — clicking a city dot on the map selects every player
// born there and scrolls the first match, in the table's own current order, into view. A city
// can hold several players who may not be adjacent in whatever order the table's currently
// sorted by (only sorting by "born in" guarantees that — see _PT_SORT_FNS), so rather than guess
// which one to scroll to, this selects (and so visually flags) every match and scrolls to
// whichever happens to land first — deliberately not switching the sort itself, which would
// silently override whatever the user picked it for.
const _scrollToCityRow = rec => {
  _selectRows(rec.players.map(p => p.pid));
  const ptEl = document.getElementById('tab-players');
  if (!ptEl) return;
  const row = [...ptEl.querySelectorAll('tr[data-pid]')].find(tr => _selectedPids.has(tr.dataset.pid));
  row?.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

const _renderElo = (onAnimationDone) => {
  if (!_renderEloBase) return;
  _renderEloBase(onAnimationDone);
  if (dimState.sourceId) _eloMain.update(dimState.sourceId);
  // Group Stage / "Whole competition" fixture rows order their own two teams by the sidebar's
  // current sort criterion too (sidebar.orderPair/ptsFor, passed to both at construction) — a
  // sort-column click or direction toggle already re-renders the main pill list via
  // _renderEloBase above; re-rendering these two here as well (whenever they exist — both are
  // null until fixturesData loads) keeps every fixture's own left/right order and pill figure
  // in lockstep with it, not just the knockout match-display pairs.
  _groupStage?.render();
  _fixtureList?.render();
  // bornIn/playsFor columns sort by the *team's* standing under whichever criterion the sort
  // table's own leading position now holds (see _PT_SORT_FNS/_ptTeamCmp) — refresh #tab-players
  // too so a sort-table change (reorder or direction toggle) is reflected there immediately,
  // instead of waiting for an unrelated event to trigger the next render.
  if (_ptSortKey === 'bornIn' || _ptSortKey === 'playsFor') _refreshPlayersView();
};
const _updateEloSelection = () => {
  if (_eloMain.hasItems && !_playersTabActive) _eloMain.update(dimState.sourceId);
};

// Which #bottomTabList tab is actually showing right now — the single explicit source of truth
// for that fact, set only by the 'show.bs.tab' listener just below (see its own comment on why
// that has to be an explicit assignment from `name` rather than a #tab-players.classList read).
// False until the very first 'show.bs.tab' fires (the initial restore-or-default _switchTab
// call further down), which is always tab-teams/tab-tournament, never tab-players — see that
// call's own comment.
let _playersTabActive = false;

// Dotted line from whichever of #tab-teams-btn/#tab-tournament-btn is _activeTab to
// #tab-players-btn (see the HTML comment on #tab-connector) — a visual reminder of which tab's
// filters/selection produced #tab-players-btn's own "N countries" count, since that count
// genuinely differs between the two (tab-teams' checkbox filters vs. tab-tournament's carousel
// stage). Reads _activeTab, not the DOM's current .active tab — that's the whole point: this
// must NOT move when the user switches to #tab-players itself (_activeTab is deliberately left
// untouched by that switch — see its own declaration above), so the line survives pointing at
// its real source. Geometry-only (getBoundingClientRect), so it needs no data to have loaded —
// safe to call as soon as the buttons exist in the static HTML.
const _tabConnector = document.getElementById('tab-connector');
// Gap (px) between the line's own endpoint and the nearest edge of either button — otherwise
// the dotted line runs flush into the icon itself, reading as touching/underlining it rather
// than as a connector floating between the two.
const TAB_CONNECTOR_GAP = 6;
// Stays visible even while a country/fixture is dim-selected — _activeTab still governs real
// behavior then too (e.g. tab-tournament's own native+import-only roster rule, see
// _currentPlayerSet), it's not just an ambient-count source, so the line stays meaningful rather
// than being hidden as if it had nothing left to point at.
const _updateTabConnector = () => {
  if (!_tabConnector) return;
  const sourceBtn = document.getElementById(_activeTab === 'tab-tournament' ? 'tab-tournament-btn' : 'tab-teams-btn');
  const targetBtn = document.getElementById('tab-players-btn');
  if (!sourceBtn || !targetBtn) return;
  const navRect = _bottomTabNav.getBoundingClientRect();
  const sRect = sourceBtn.getBoundingClientRect();
  const tRect = targetBtn.getBoundingClientRect();
  // Whichever button sits further left contributes its RIGHT edge; the other, its LEFT edge —
  // the line only ever spans the real gap between the two, never passing under either button.
  const [leftRect, rightRect] = sRect.left < tRect.left ? [sRect, tRect] : [tRect, sRect];
  const left = leftRect.right - navRect.left + TAB_CONNECTOR_GAP;
  const right = rightRect.left - navRect.left - TAB_CONNECTOR_GAP;
  _tabConnector.style.left = `${left}px`;
  _tabConnector.style.width = `${Math.max(0, right - left)}px`;
};
// #tab-players-btn is empty in the static HTML — it gets its real "N countries" label only once
// _renderPlayersTabIdle() first runs, well after this module's own synchronous setup (it depends
// on app.byId/etc., populated by the async data-load Promise.all). The very first
// _updateTabConnector() call (from the initial _switchTab() below) fires before that, so it
// measures the button at its tiny pre-content width — visible on a slow load as the line briefly
// overshooting past #tab-players-btn's eventual right edge. A ResizeObserver re-runs the
// calculation the moment the button's box actually changes size, however/whenever that happens
// (first content, a later label-length change, font loading, ...), rather than hoping every call
// site that could affect it remembers to call this explicitly.
if (typeof ResizeObserver !== 'undefined') {
  const _playersBtnEl = document.getElementById('tab-players-btn');
  if (_playersBtnEl) new ResizeObserver(_updateTabConnector).observe(_playersBtnEl);
}

// Bootstrap's own Tab component (data-bs-toggle="tab" on each button, see wc2026_map.html) now
// owns activating/deactivating both the trigger buttons' .active class and their data-bs-target
// pane's .active class (css/wc2026_map.css shows/hides #bottomTabContent panes off that same
// class) — no more manual class-toggling, pane.hidden flips, or a custom sliding indicator/swipe
// gesture to keep in sync with them. All the side effects that used to live inline in a single
// _switchTab function now hang off the 'show.bs.tab' event instead, so they fire uniformly
// whether the tab was activated by a direct click (Bootstrap's own delegated listener),
// restoring the last-active tab on load, or one of this file's own programmatic switches
// (applySelection, activateFixture, _showAllPlayers, clearFixtureSelection) — see _switchTab
// just below, now just a thin `.show()` trigger.
//
// _playersTabActive (see _playersMapActive further down) is set explicitly right here from
// `name`, the one unambiguous fact this listener already has — deliberately NOT derived by
// reading #tab-players' own .active class back off the DOM. Bootstrap's Tab.show() fires
// 'show.bs.tab' *before* it calls _activate/_deactivate (the class flip happens after), so a
// classList read at this point in the listener would still reflect the *previous* tab, one step
// behind — exactly the inverted-toggle bug this replaced (dim mode's map layer visibly lagged
// a full click behind whichever tab was actually active). No DOM read, no ordering to get
// wrong, ever — a plain boolean this listener itself sets is the single source of truth.
_bottomTabNav.addEventListener('show.bs.tab', e => {
  const name = e.target.dataset.tab;
  _playersTabActive = name === 'tab-players';
  // Independent of the isEloTab branch below (which only ever runs for tab-teams/tab-tournament)
  // — the export/native/import filter (control_sidebar.js's csb-native-table) is only ever
  // meaningful while #tab-players itself is on screen, unlike sidebar.setMode's own two modes.
  sidebar.setPlayersTabActive(_playersTabActive);
  // tab-players isn't a real, standalone user choice (its own button never drives this listener
  // for a *user*-picked reason the way tab-teams/tab-tournament do — it only ever becomes active
  // via activateCountry's dim-mode selection, which itself isn't persisted), so restoring it on a
  // fresh page load with no selected country would just show the empty "click a country" hint.
  // Persist only the tabs a user can actually pick directly.
  if (name !== 'tab-players') saveSlice('bottomTab', { active: name });
  const isEloTab = name === 'tab-teams' || name === 'tab-tournament';
  // A country/fixture selection is *never* cleared just by switching tabs, in either direction —
  // only an explicit user action does that (clicking the same pill/flag again, the map
  // background while tab-teams/tab-tournament is active, or #tab-players-btn's own close ✕).
  // dimState/_activeFixture simply keep existing underneath whichever tab is currently showing;
  // _playersMapActive() (see _updatePlayerCityDots) is what decides whether the map actually
  // renders that state (flags+arcs) or hides it (birth-city dots instead) — switching tabs only
  // ever changes which of those two renderings is visible, never the selection itself.
  if (isEloTab) {
    // Same shared <elo-ranking> + sidebar for both — moved into whichever pane is now active
    // rather than duplicated (see its own declaration comment above).
    document.getElementById(name).appendChild(_eloLayoutEl);
    sidebar.setMode(name === 'tab-teams' ? 'teams' : 'tournament');
    _activeTab = name;
    _updateGroupStageVisibility();
  }
  if (isEloTab) {
    _expandPanel(_eloMetaPanel);
  } else {
    _collapsePanel(_eloMetaPanel);
  }
  if (isEloTab) {
    _renderElo();
    _eloMain.update(dimState.sourceId);
    _scrollToActiveElo();
  }
  _updateAllPlayersMapLayer();
});
// Geometry only — read after Bootstrap's own class flip has actually landed ('show.bs.tab'
// fires BEFORE that, see the listener above), even though none of the 3 buttons' sizes
// currently depend on their .active class here; separate listener rather than folding into the
// one above so that ordering guarantee doesn't rely on this call happening to sit last in a
// growing function.
_bottomTabNav.addEventListener('shown.bs.tab', _updateTabConnector);
const _switchTab = name => bootstrap.Tab.getOrCreateInstance(document.getElementById(`${name}-btn`)).show();

window.addEventListener('resize', () => {
  _syncMapHeight();
  sidebar.measureControlSidebar();
  _updateTabConnector();
});

// ── Tooltip helpers ───────────────────────────────────────────────────────────
const DISABLE_TOOLTIP = /Mobi/i.test(navigator.userAgent);

const positionTip = (event, height, wide = false) => {
  if (DISABLE_TOOLTIP) return;
  const w = wide ? 544 : 274;
  let x = event.pageX + 16, y = event.pageY + 16;
  if (x + w > window.scrollX + window.innerWidth)  x = event.pageX - (w + 4);
  if (y + height > window.scrollY + window.innerHeight) y = event.pageY - (height + 4);
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
  tt.style.display = 'block';
};

const showQualifiedTip = (event, name, code) => {
  const nId = QUALIFIED_BY_NAME[name];
  if (lastTipKey !== name) {
    lastTipKey = name;
    const hasImps = (app.importByCountry[nId] ?? []).length > 0;

    render(html`
      <div class="tt-name tt-name-inner d-flex align-items-center gap-2">
        <span class="tt-name-inner d-flex align-items-center gap-2">${flagImg(code)}${countryName(nId, name)}${app.byId[nId]?.totalCount ? html`<span class="tt-count" style="color:#14532d;font-size:18px;margin:0;line-height:1">${app.byId[nId].totalCount}</span>` : nothing}</span>
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(app.pop[code])}${rankTag(name)}${capTag(app.capital[code])}</span>
      </div>
      <div class="tt-label">${T.noExport(countryName(nId, name))}</div>
      ${hasImps ? buildImportColHtml(nId) : html`<div class="tt-label">${T.noImport(countryName(nId, name))}</div>`}
      ${hasImps && (app.importByCountry[nId] ?? []).length > 5 ? html`<div class="tt-more-label text-end">${T.clickForAll}</div>` : nothing}`, tt);
  }
  positionTip(event, 200, false);
};

// ── Dim helpers (click destination highlight) ─────────────────────────────────
const dimState = {
  k: 1,
  active: false,
  sourceId: null,
  destIds: new Map(),
  importIds: new Map(),
  arcsGroup: null,
};

// The source country and every import/export partner applyDim (defined further down) marks via
// data-dim-visible stay visible regardless of the sidebar's own category filter
// (visibility:hidden) — an arc pointing at a flag the filter just hid would be visually broken,
// and it would silently drop out of #zoom-span's own fit-to-view (_zoomToVisibleFlags checks
// the exact same visibility attribute). Same override pattern as _applyGroupFocus above, run
// both directly from applySelection (so a fresh selection is un-hidden immediately) and via
// callbacks.afterFlagFilter just below (so it's reapplied if the user toggles a checkbox while
// a selection is still active — applyFlagFilter's own d3 selection would otherwise re-hide a
// linked flag the checkbox itself excludes). Defined here, right after dimState, rather than
// near applySelection further down — callbacks.afterFlagFilter can fire as early as the
// restore-tab _switchTab call a few lines below, well before applySelection's own section runs.
const _applyDimFocus = () => {
  if (!dimState.active || typeof d3 === 'undefined') return;
  // Pre-filtered to just the source + linked subset — animateFlagHidden's hiddenFn is
  // unconditionally false here since this function only ever un-hides, never hides.
  const linked = g.selectAll('.flag-qualified[data-elo-cat]').filter(function() {
    return +this.getAttribute('data-id') === dimState.sourceId || this.hasAttribute('data-dim-visible');
  });
  animateFlagHidden(linked, () => false);
};

// Birth-city dots (see _updatePlayerCityDots below) — declared here, not near the all-players
// table further down, for the same reason as _applyDimFocus just above: _switchTab's restore-tab
// call a few lines below invokes _updatePlayerCityDots too, well before that table's own section
// of the file runs.
// pid (string) -> { city, lat, lon } — data/v2/birthplace.json, best-effort (not every pid has
// an entry). Populated once in the main data-load callback further down.
let _birthplaceByPid = {};
// Whether #tab-players' current content is the ambient (unfocused) players table — every player
// on a currently-visible team — rather than a dim-selected team's own subset. Drives whether
// birth-city dots should be showing on the map at all (only meaningful over the full set). True
// by default (nothing focused yet); applySelection flips it off, clearDim flips it back on.
let _showingAllPlayers = true;
// Fixture (both teams of a match-display pair) currently selected via activateFixture, further
// down — declared here (not next to activateFixture/clearFixtureSelection themselves) because
// _renderPlayersTabIdle, which reads it, runs synchronously at module init time, before that
// point in the file; see _showingAllPlayers just above for the same reason.
let _activeFixture = null; // { pairId, idA, idB } or null
// True exactly while #tab-players is the visible bottom-tab pane — ambient roster or a focused
// team/fixture's roster alike. The map has exactly two mutually exclusive modes, switched purely
// by which bottom tab is active, never by what's selected within it: tab-teams/tab-tournament
// get the full flags+dim+arcs treatment (unchanged); tab-players gets birth-city dots only, no
// flags, no arcs, no click-to-select/deselect on the map itself. dimState/_ptFocusIds are left
// untouched by this rule itself, so moving between the ambient and a focused view without
// leaving tab-players never has to rebuild anything (_switchTab separately clears any active
// selection on the way *out* to tab-teams/tab-tournament — see its own comment; unrelated to
// this guard, which only ever hides/shows, never clears, a selection).
// Shared by _updatePlayerCityDots (build/teardown the dots, toggle g.city-mode), onCountryMousemove
// (suppress every ordinary country/flag tooltip), onCountryClick (block entering/leaving a
// selection from the map — the #tab-players-btn close (✕) is the only way out while here), and
// the background svg click handler (same reason).
const _playersMapActive = () => _playersTabActive;
// A separate marker layer alongside the country flags, shown only while the all-players table is
// the active content of #tab-players. Reuses .standalone-dot (map-container.js's existing,
// previously-unused zoom-tick mechanism: cx/cy ride along with the map's own pan/zoom transform
// for free, only r/stroke-width get counter-scaled each tick to stay a constant size) —
// data-r-base lets each dot request its own radius instead of that mechanism's single global default.
// While tab-players is active, every country flag AND the dim-mode arcs group are hidden via the
// g.city-mode CSS class (see css/wc2026_map.css) — a plain display:none, deliberately NOT
// animateFlagHidden's own visibility/data-hidden-target mechanism: that pair of attributes is
// also _visibleQualifiedIds()'s source of truth for "which teams currently pass the sidebar
// filter" (read by the ambient player table too) — routing this hide through it would zero out
// that filter-visible set for every later caller, not just this one paint.
const CITY_DOT_COLOR = '#7c3aed';
// Groups the currently-shown player set (ambient or focused — same source _playersTableTemplate
// itself uses) by birth-city coordinate. Shared by _updatePlayerCityDots (draws the dots) and
// _cityRecForPid (looks up one city's record when a "born in" table cell is clicked — see
// _allPlayersRow) — a fresh rebuild each call rather than a cached map, but the underlying
// player counts here are small enough (hundreds, not thousands) that this is never worth caching.
// The player set #tab-players is currently showing (ambient or focused) with BOTH of the
// sidebar's own filters applied. Shared by _playersTableTemplate (the table itself) and
// _buildCityRecords (the map's birth-city dots) so the two — and any future consumer — can
// never silently disagree on which players are currently "shown".
//
// Which countries anchor the set at all (_visiblePlayerEntries' _visibleQualifiedIds, or the
// caller's own focusIds for a dim-selected team/fixture) is the ONLY country-level filter here —
// once a player is pulled in via _focusedPlayers, nothing re-checks their birth/plays-for
// country's own category or carousel-stage visibility a second time. There is exactly one
// remaining difference between tab-teams and tab-tournament's player table, both applied below:
// 1. tab-tournament cares about fixtures, not full rosters — a player whose only role is 'export'
//    (born in a set country, but playing for some OTHER, non-set country) is out of scope there;
//    tab-teams keeps them (every kind of player: native, import, export). This is intentionally
//    NOT the same thing as re-filtering by category/stage (removed — see history if curious):
//    it only ever hides the export role, and only in tab-tournament.
//    "Import wins over export exclusion": if that other country happens to ALSO be in the focus
//    set, _focusedPlayers already tags the same player 'import' too (relative to their actual
//    team), so this filter still lets the row through — just as that team's own import, not as
//    the birth country's export.
// 2. The export/native/import filter (`control_sidebar.js`'s `csb-native-table`) — inclusive-OR
//    over a player's own _roles, so a player holding more than one role stays visible as long as
//    any one of them is checked.
// 3. The player/coach filter (same table's 2nd column) — a separate AND, not folded into the
//    _roles OR-filter above: a coach still carries its own export/native/import role, so this
//    has to further narrow that result by the person's own type, not join it.
const _currentPlayerSet = focusIds =>
  (focusIds ? _focusedPlayers(focusIds) : _visiblePlayerEntries())
    .filter(p => _activeTab !== 'tab-tournament' || p._roles.some(r => r !== 'export'))
    .filter(p => p._roles.some(r => sidebar.playersFilterChecked(r)))
    .filter(p => sidebar.playerKindChecked(p.role === 'coach' ? 'coach' : 'player'));

const _buildCityRecords = () => {
  const players = _currentPlayerSet(_ptFocusIds);
  const byCoord = new Map();
  for (const p of players) {
    const bp = _birthplaceByPid[p.pid];
    if (!bp) continue;
    const key = `${bp.lat.toFixed(3)},${bp.lon.toFixed(3)}`;
    let rec = byCoord.get(key);
    if (!rec) {
      rec = {
        // actualCityName, present only for the minority of entries whose own `city` is really a
        // sub-city administrative unit ("12th arrondissement of Paris", "Bodø Municipality"),
        // is the name people actually recognize — prefer it wherever a birthplace's city is
        // displayed. lat/lon stay `city`'s own regardless; only the label changes.
        lat: bp.lat, lon: bp.lon, city: bp.actualCityName ?? bp.city, population: bp.population,
        countryId: p.birthCountryId, countryLabel: p.birthCountry,
        players: [],
      };
      byCoord.set(key, rec);
    }
    rec.players.push(p);
  }
  return byCoord;
};
// pid -> its birth city's record (same shape _buildCityRecords produces), or null if that
// player's birthplace never geocoded, or isn't part of the currently-shown player set at all
// (e.g. a stale click after the focus changed). Used by _allPlayersRow's "born in" cell click.
const _cityRecForPid = pid => {
  const bp = _birthplaceByPid[pid];
  if (!bp) return null;
  const key = `${bp.lat.toFixed(3)},${bp.lon.toFixed(3)}`;
  return _buildCityRecords().get(key) ?? null;
};
const _updatePlayerCityDots = () => {
  if (typeof d3 === 'undefined') return;
  const show = _playersMapActive();
  g.classed('city-mode', show);
  if (!show) {
    g.select('.city-dots').remove();
    return;
  }
  const byCoord = _buildCityRecords();
  g.select('.city-dots').remove();
  const dotsGroup = g.append('g').attr('class', 'city-dots');
  for (const [key, rec] of byCoord) {
    const [rawCx, rawCy] = projection([rec.lon, rec.lat]);
    // data-raw-cx/cy keep the true projected point around so buildBlendedInset's own per-tick
    // update() (see _islandWarp) can re-warp it on every zoom change, not just once here — a
    // city on Cape Verde/Curaçao otherwise renders at its true (currently imperceptible, below
    // CV_BLEND_K_THRESHOLD) position instead of inside that island's zoomed-in inset circle.
    // No-op ([cx,cy] === [rawCx,rawCy]) for every other city.
    const [cx, cy] = _warpIslandPoint(rec.countryId, rawCx, rawCy);
    dotsGroup.append('circle')
      .attr('class', 'standalone-dot city-dot')
      .attr('data-key', key)
      .attr('data-country-id', rec.countryId)
      .attr('data-raw-cx', rawCx).attr('data-raw-cy', rawCy)
      .attr('cx', cx).attr('cy', cy)
      .attr('data-r-base', Math.max(1.5, 1.5 * Math.sqrt(rec.players.length)))
      .attr('fill', CITY_DOT_COLOR).attr('fill-opacity', 0.7)
      .attr('stroke', '#fff')
      .on('mousemove', event => showCityTip(event, rec))
      .on('mouseleave', () => hideTip())
      .on('click', event => { event.stopPropagation(); _scrollToCityRow(rec); });
  }
  // Initial paint only — map-container.js's own zoom-tick handler (.standalone-dot.city-dot
  // branch) takes over from here on every subsequent pan/zoom, using this same cityDotRadius
  // helper so the two never drift apart.
  const k = d3.zoomTransform(svg.node()).k;
  dotsGroup.selectAll('circle')
    .attr('r', function() { return cityDotRadius(+this.getAttribute('data-r-base'), k); })
    .attr('stroke-width', 0.5 / k);
};

// The "production intensity" KDE raster that used to live here (the Intensity half of a
// Bubbles/Intensity toggle) moved to its own standalone page (insights/heat-map.html, since
// removed along with its js/kde_layer.js engine) once tab-players stopped being a togglable pair
// of alternate views and became just "birth-city dots, always".
const _updateAllPlayersMapLayer = () => {
  _updatePlayerCityDots();
};

const app = {
  byId: {},
  importByCountry: {},
  nativeByCountry: {},
  pop: {},
  eloRank: {},
};
const centroids = {};
const _blendedInsets = []; // per-tick update fns for buildBlendedInset() countries (see below)
// id -> {ax, ay, factor} — the CURRENT (this tick's) pivot/scale of that island's own
// buildBlendedInset warp (translate(ax,ay) scale(factor) translate(-ax,-ay)), kept live by
// buildBlendedInset's own update(k). _updatePlayerCityDots reads this to warp a birth-city dot's
// raw projected position the exact same way the island's own shape/flag already are, so a city
// on Cape Verde/Curaçao lands inside the inset circle instead of at its true (currently
// imperceptible, below CV_BLEND_K_THRESHOLD) position. Empty for every id that isn't a blended
// inset — _warpIslandPoint below no-ops in that case.
const _islandWarp = new Map();
const _warpIslandPoint = (countryId, cx, cy) => {
  const w = _islandWarp.get(countryId);
  return w ? [w.ax + w.factor * (cx - w.ax), w.ay + w.factor * (cy - w.ay)] : [cx, cy];
};

const _sidebarCallbacks = {};
const sidebar = initSidebar({ T, QUALIFIED_NAMES, app, fifaMemberIds: _fifaMemberIds, eloMain: _eloMain, callbacks: _sidebarCallbacks });
_sidebarCallbacks.renderElo = _renderElo;
_sidebarCallbacks.scrollToActiveElo = _scrollToActiveElo;
// _applyDimFocus is defined further down (near applySelection/clearDim) — safe to reference
// here since this arrow function is only ever called later, well after that const exists.
// (_refreshPlayersView is layered on top of this same callback further down, right after its
// own const is defined — it can't be referenced this early: the very first applyFlagFilter() run
// happens synchronously during initial setup, well before that point in module evaluation, unlike
// every later run which is safely post-load.)
_sidebarCallbacks.afterFlagFilter = () => { _applyGroupFocus(); _applyDimFocus(); };
// Sidebar collapse/expand no longer affects #page-header's own box (it's position:absolute —
// see wc2026_map.html), so the map's push-down amount must be recomputed explicitly here.
_sidebarCallbacks.onSidebarToggle = () => {
  if (_pageHeader) document.documentElement.style.setProperty('--page-header-h', _computeHeaderHeight() + 'px');
  _syncPaddingTop();
};

document.addEventListener('mundial-conf-changed', ({ detail: { conf, ids } }) => {
  _highlightConf(ids);
  if (!conf || !CONF_BOUNDS[conf]) return;
  const [[lonW, latN], [lonE, latS]] = CONF_BOUNDS[conf];
  const nw = projection([lonW, latN]);
  const se = projection([lonE, latS]);
  if (!nw || !se) return;
  const pad = 20;
  const bw = (se[0] + pad) - (nw[0] - pad);
  const bh = (se[1] + pad) - (nw[1] - pad);
  const k  = Math.max(1, Math.min(8, Math.min(W / bw, H / bh) * 0.9));
  const tx = W / 2 - k * ((nw[0] - pad) + bw / 2);
  const ty = H / 2 - k * ((nw[1] - pad) + bh / 2);
  svg.transition().duration(800).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
});

const enablesDim = id => !!(app.byId[id] || QUALIFIED_NAMES[id]);

const fmtPop = pop => parseFloat(pop.toFixed(2))
  .toLocaleString(LOCALE, { maximumFractionDigits: 2, minimumFractionDigits: 2, useGrouping: false }) + 'M';
const popTag  = pop  => pop  ? html`<span class="tt-pop fw-normal text-nowrap">${fmtPop(pop)}</span>` : nothing;
const capTag  = cap  => { const c = cap?.[_LANG] ?? cap?.en ?? null; return c ? html`<span class="tt-pop fw-normal text-nowrap">${c}</span>` : nothing; };
// Each panel's *intended* expanded/collapsed state is tracked directly on the element
// (panel._panelExpanded), not read back off the 'collapsed' CSS class — that class is only
// added/removed once a transition actually FINISHES (the transitionend handler below), so two
// calls in the same tick used to race: e.g. clearFixtureSelection's own _updateSelectionPanel()
// call collapses the panel (starts a transition, class not yet updated), and moments later, still
// synchronously within the same click, applySelection's own _updateSelectionPanel() call tries to
// expand it again — the old code's guard (`!classList.contains('collapsed')`) read "not collapsed
// yet" (still mid-transition) and wrongly no-op'd, leaving the pending collapse to finish
// unopposed. Concrete symptom: click a fixture (panel shows), then immediately click a single
// team — the panel should still show, now for that team, but instead went blank. Tracking intent
// directly (and cancelling whichever opposite-direction transitionend handler is still pending)
// makes the LAST call in a tick always win, regardless of what's mid-animation.
const _expandPanel = panel => {
  if (!panel) return;
  if (panel._collapseHandler) { panel.removeEventListener('transitionend', panel._collapseHandler); panel._collapseHandler = null; }
  if (panel._panelExpanded) return;
  panel._panelExpanded = true;
  panel.classList.remove('collapsed');
  panel.style.maxHeight = panel.style.maxHeight || '0';
  panel.getBoundingClientRect();
  panel.style.maxHeight = panel.scrollHeight + 'px';
  const handler = () => { panel.style.maxHeight = ''; panel._expandHandler = null; };
  panel._expandHandler = handler;
  panel.addEventListener('transitionend', handler, { once: true });
};
const _collapsePanel = (panel, onDone) => {
  if (!panel) return;
  if (panel._expandHandler) { panel.removeEventListener('transitionend', panel._expandHandler); panel._expandHandler = null; }
  if (panel._panelExpanded === false) return;
  panel._panelExpanded = false;
  panel.style.maxHeight = panel.style.maxHeight || panel.scrollHeight + 'px';
  panel.getBoundingClientRect();
  panel.style.maxHeight = '0';
  const handler = () => {
    panel.style.maxHeight = '';
    panel.classList.add('collapsed');
    panel._collapseHandler = null;
    if (onDone) onDone();
  };
  panel._collapseHandler = handler;
  panel.addEventListener('transitionend', handler, { once: true });
};

const _selectionPanelEl = FOOTER_PANELS.selection ? document.getElementById('selection-panel') : null;

// Restore whichever #bottomTabList tab was last active (see _switchTab's own saveSlice call) —
// tab-teams (the HTML's own static default) is used whenever nothing's saved yet, or the saved
// value isn't one of the tabs a user can actually pick directly (see _switchTab's own comment
// on why tab-players is excluded from persistence). Runs _switchTab unconditionally, even when
// it resolves to the same default already shown, so the sidebar mode/carousel/group-stage-view
// wiring _switchTab performs is applied exactly once, from exactly one code path, regardless of
// whether this is a fresh visit or a restored one. Placed here, not right after sidebar is
// built above — _switchTab's body also touches _expandPanel/_collapsePanel, which aren't
// defined until this point in the script.
const _RESTORABLE_TABS = new Set(['tab-teams', 'tab-tournament']);
const _savedActiveTab = loadSlice('bottomTab')?.active;
_switchTab(_RESTORABLE_TABS.has(_savedActiveTab) ? _savedActiveTab : 'tab-teams');

// dimState.sourceId (one team) or _activeFixture's idA/idB (two teams, mutually exclusive with
// the former — see activateFixture/applySelection's own clearFixtureSelection()/clearDim()
// calls) — same [name, capital, population] triple per country either way, all flattened into
// one '·'-joined row rather than visually grouping each country's own triple separately; with
// two countries that reads as "France · Paris · 68M · Spain · Madrid · 47M", consistent with
// the single-country row this already was.
const _updateSelectionPanel = (onCollapsed) => {
  if (!_selectionPanelEl) return;
  const ids = _activeFixture ? [_activeFixture.idA, _activeFixture.idB] : dimState.sourceId ? [dimState.sourceId] : [];
  if (ids.length === 0) {
    _collapsePanel(_selectionPanelEl, () => { render(nothing, _selectionPanelEl); if (onCollapsed) onCollapsed(); });
    return;
  }
  // Per-country [name, capital, population] triple, '·'-joined within a country. A single-team
  // selection (ids.length === 1) reads name · capital · population, same as always. A fixture
  // (2 countries) instead joins the two groups with '⇄', and mirrors the LEFT group's own triple
  // (population · capital · name) so the whole row reads symmetrically around the '⇄' —
  // population next to population, name next to name on either side of it — rather than the same
  // left-to-right order repeated twice. includePop lets the overflow check below re-render
  // without it — population is the least essential field, so it's the first thing dropped once
  // the row doesn't fit on its one allowed line, rather than jumping straight to an ellipsis that
  // might cut off a country's own name instead.
  const buildRow = includePop => {
    const groups = ids.map((id, i) => {
      const fc = iso2ForId(id);
      const cname  = countryName(id);
      const pop    = includePop ? app.pop?.[fc] : null;
      const capObj = app.capital?.[fc];
      const capText = capObj?.[_LANG] ?? capObj?.en ?? null;
      const items = [
        cname && html`<span>${cname}</span>`,
        capText && html`<span>${capText}</span>`,
        pop && html`<span>${fmtPop(pop)}</span>`,
      ].filter(Boolean);
      if (i === 0 && ids.length > 1) items.reverse(); // mirrored left group — fixtures (2 countries) only, not a single-team selection
      return join(items, () => html`<span class="sp-sep">·</span>`);
    });
    return html`<div class="selection-panel-row py-1 sub" style="background-color: var(--page-bg);">
      ${join(groups, () => html`<span class="sp-sep">⇄</span>`)}
    </div>`;
  };

  render(buildRow(true), _selectionPanelEl);
  _expandPanel(_selectionPanelEl);
  // Reading scrollWidth/clientWidth forces a synchronous layout — fine for a one-off check like
  // this, and avoids a visible flash of the (possibly-truncated) population-included version.
  const rowEl = _selectionPanelEl.querySelector('.selection-panel-row');
  if (rowEl && rowEl.scrollWidth > rowEl.clientWidth) render(buildRow(false), _selectionPanelEl);
};
const rankTag = name => { const r = app.eloRank[name]; return r ? html`<span class="tt-rank fw-normal text-nowrap">Elo #${r}</span>` : nothing; };
const flagImg = code => code ? html`<img class="tt-flag rounded-circle flex-shrink-0" src="${FLAG_CDN(code)}">` : nothing;
const coachBadge = p => p.role === 'coach' ? html`<span class="coach-badge">${T.coach}</span>` : nothing;

const SQUAD_SIZE = { 40: 25, 124: 25 }; // Austria, Canada — injuries reduced squad to 25

const buildImportColHtml = countryId => {
  const players   = (app.importByCountry[countryId] ?? []).slice().sort((a, b) => b.caps - a.caps);
  if (players.length === 0) return html`<div class="tt-label">${T.noImport(countryName(countryId, QUALIFIED_NAMES[countryId]))}</div>`;
  const byBirth   = {};
  players.forEach(p => { const l = countryName(p.birthCountryId, p.birthCountry); byBirth[l] = (byBirth[l] ?? 0) + 1; });
  const countries = Object.entries(byBirth).sort((a, b) => b[1] - a[1]);
  const top       = players.slice(0, 5);
  const squadSize = SQUAD_SIZE[countryId] ?? 26;
  const ratio     = (players.length / squadSize * 100).toFixed(0) + '%';

  const displayName = countryName(countryId, QUALIFIED_NAMES[countryId]);
  return html`
    <div class="tt-count-row d-flex justify-content-between align-items-center">
      <div class="tt-count color-imp">${players.length}</div>
      <div class="tt-sub">${ratio} ${T.ofSquad} (${squadSize})</div>
    </div>
    <div class="tt-label">${T.selectedByLabel(displayName)}</div>
    <div class="tt-countries mb-0 fst-italic">${countries.map(([n, c]) => `${n} (${c})`).join(', ')}</div>
    <div class="tt-players ${players.length > 5 ? 'tt-more' : ''}">
      ${top.map(p => html`
        <div class="tt-player">
          <span>${playerDisplayName(p)}${coachBadge(p)}</span>
          <span class="tt-country text-nowrap"><span class="color-imp">←</span> ${countryName(p.birthCountryId, p.birthCountry)}</span>
        </div>`)}
    </div>`;
};

const applyDim = (sourceId, destIds) => {
  dimState.destIds = destIds;

  // Build import ids: birth countries Y whose players represent country sourceId
  dimState.importIds = computeImportIds(sourceId, app.importByCountry);

  // Flag opacity + data-dim-visible for cursor/click control. data-dim-visible is just a
  // marker other code reads (e.g. _applyDimFocus, _zoomToVisibleFlags) — set instantly, not
  // animated; the actual visual brightness change is animateFlagOpacity's job.
  const dimVisibleIds = new Set([...destIds.keys(), ...dimState.importIds.keys()]);
  g.selectAll('.flag-qualified').attr('data-dim-visible', function() {
    const id = +this.getAttribute('data-id');
    return (destIds.has(id) || dimState.importIds.has(id)) ? '' : null;
  });
  animateFlagOpacity(g.selectAll('.flag-qualified'), el => {
    const id = +el.getAttribute('data-id');
    return (id === sourceId || destIds.has(id) || dimState.importIds.has(id)) ? 1 : 0.35;
  });
  g.selectAll('.country').attr('data-dim-visible', function(d) {
    const id = d._id ?? +d.id;
    return dimVisibleIds.has(id) ? '' : null;
  });

  if (dimState.arcsGroup) drawCountryArcs(dimState.arcsGroup, sourceId, destIds, dimState.importIds, centroids, dimState.k);

  g.selectAll('.flag-qualified').raise();
  g.selectAll('.flag-qualified').filter(function() {
    return +this.getAttribute('data-id') === sourceId;
  }).raise();
};

const applyEmpty = id => {
  dimState.destIds  = new Map();
  dimState.importIds = new Map();
  animateFlagOpacity(g.selectAll('.flag-qualified'), () => 1);
  g.selectAll('.flag-qualified').attr('data-dim-visible', null);
  g.selectAll('.country').attr('data-dim-visible', null);
  if (dimState.arcsGroup) dimState.arcsGroup.selectAll('.arc-line,.arc-arrow').remove();
};

const applySelection = (id, destIds) => {
  clearFixtureSelection(); // mutually exclusive with a fixture selection — see below
  dimState.active = true;
  dimState.sourceId = id;
  _showingAllPlayers = false;

  if (centroids[id]) {
    applyDim(id, destIds);
    _applyDimFocus();
  } else {
    applyEmpty(id);
  }

  // Player table — same flat table the ambient (unfocused) view uses, just narrowed to this
  // one team (see _playersTableTemplate's own comment on the focusIds set it takes). This render
  // happens regardless of which #bottomTabList tab is active (the table is kept live in the
  // background even while hidden — see _refreshPlayersView's own comment), so the scroll-to-top
  // below must NOT run unconditionally alongside it: a country/fixture click from tab-teams or
  // tab-tournament never means "look at #tab-players", it means "dim-select this team", and
  // jumping the whole page to top on every such click was the actual bug being fixed here — only
  // scroll when #tab-players is the tab the user is actually looking at.
  const ptEl = document.getElementById('tab-players');
  if (ptEl) {
    render(_playersTableTemplate(new Set([id])), ptEl);
    if (_playersTabActive) window.scrollTo({ top: 0 });
  }

  // Tab button label + close — a generic "1 team" count via _tabPlayersLabel, same icon and
  // same wording pattern the ambient state's "N teams" uses (T.countries), not the team's own
  // name/flag: every #tab-players-btn mode reads as the same kind of thing (a count), the
  // identity of what's focused lives in the table itself, not the nav pill.
  const _playersBtn = document.getElementById('tab-players-btn');
  if (_playersBtn) {
    const wasActive = _playersBtn.classList.contains('active');
    _playersBtn.className = 'nav-link dim-selected' + (wasActive ? ' active' : '');
    render(_tabPlayersLabel(_PLAYERS_TAB_ICON, `1 ${T.countries(1)}`, () => _switchTab('tab-players'), () => clearDim()), _playersBtn);
  }

  _updateEloSelection();
  _updateSelectionPanel();
  document.body.classList.add('dim-active');
  _updateAllPlayersMapLayer();
  _updateTabConnector();
};

// ── Players table (#tab-players' one and only content — see _playersTableTemplate) ────────────

// Whether qualified team `id` currently passes the sidebar's own country filter (category
// matrix + confederation + stage — all folded into sidebar.catEloChecked, the exact same
// predicate sortAndFilter uses to build the Elo pill list #elo-meta-count counts). Only ever
// asked of a qualified id — _isTeamVisible (below) is the sole caller, deciding which teams
// anchor the ambient player-table roster; it is NOT reused to re-filter individual player rows
// once pulled in (see _currentPlayerSet's own comment — a player's birth/plays-for country is
// never re-checked against this a second time).
//
// _eloRankedIds.has(id) guards a case catEloChecked itself was never designed to answer: a
// player's birth country doesn't have to be rated by eloratings.net at all (the Isle of Man is
// the concrete case that surfaced this — mundial-build's own pipeline now proactively patches
// every such gap into data/elo_rank.json with a null-rank entry the moment it appears in the
// player data, via pipeline/patch_unrated_birth_countries.py, so this only ever fires for a
// transient window — e.g. map.json regenerated with a new birth country before elo_rank.json
// has been re-patched to match). Deliberately a quiet guard, not a user-facing filter category —
// an earlier version of this added a whole 3rd matrix row (WE/WK, "unrated") for it, but once
// the pipeline fix above shipped, that row could (almost) never have anything left to show or
// hide: no separate checkbox state is worth persisting for a gap the pipeline itself closes
// before the frontend ever sees it.
const _isCountryCategoryVisible = id => _eloRankedIds.has(id) && sidebar.catEloChecked(id, _fifaMemberIds.has(id));

// Whether qualified team `id` is currently selected as an ambient-view anchor — the ONE place
// this narrower question is answered, shared by everything that needs it (the ambient player
// table below, the map's own flag painting via applyFlagFilter/_applyGroupFocus). Two layers,
// same ones _applyGroupFocus itself implements: the group-stage carousel's own single-group
// focus (_groupFocusIds, above) is a full override when active ("regardless of what the
// checkboxes currently say" — see its own comment) — ignore the sidebar filter entirely and
// test group membership instead; otherwise fall through to _isCountryCategoryVisible. Previously,
// the ambient table asked this question a second, independent way — inspecting the map's own
// painted flag DOM (data-hidden-target) after the fact, rather than the filter state directly —
// which happened to agree in the common case but was never guaranteed to (animation timing, or
// any future divergence between the two code paths). Querying the same canonical predicate
// everywhere removes that risk instead of hoping the two independent derivations never drift.
const _isTeamVisible = id => _groupFocusIds ? _groupFocusIds.has(id) : _isCountryCategoryVisible(id);

// Numeric ids of every currently-selected qualified team (see _isTeamVisible) — the ambient
// table only ever shows players/coaches of a team currently selected this way, kept in sync
// live via _refreshPlayersView (hooked into callbacks.afterFlagFilter below), not just read
// fresh the next time the tab happens to be (re)opened.
const _visibleQualifiedIds = () => {
  const ids = new Set();
  Object.keys(QUALIFIED_NAMES).forEach(idStr => {
    const id = +idStr;
    if (_isTeamVisible(id)) ids.add(id);
  });
  return ids;
};

// Every currently-visible team's own export+native+import union (Teams' checkboxes or
// Tournament's stage — whichever tab last drove the map) — the ambient, unfocused view. Reuses
// _focusedPlayers (below) with the whole visible set as its focus, rather than a separately
// filtered flat array: a plain "does this player's nation belong to a visible team" filter (the
// old approach) only ever surfaces natives+imports relative to the visible set, never a visible
// team's own players who've since moved away to represent someone else — _focusedPlayers already
// pulls that third bucket in via app.byId[id].players, so reusing it here for free adds it to
// the ambient view too, tagging each player with which role(s) earned them a place in the union
// (see #tab-players' own export/native/import filter, control_sidebar.js's csb-native-table).
// Shared by the table itself and the nav pill's live count (see _renderPlayersTabIdle).
const _visiblePlayerEntries = () => _focusedPlayers(_visibleQualifiedIds());

const _allPlayersFlag = code => code ? html`<img class="pt-flag" src="${FLAG_CDN_RECT(code)}" alt="" width="18">` : nothing;

const _allPlayersRow = p => {
  const url = wikiUrl(p.pid);
  const en = wikiUrlEn(p.pid);
  const dName = playerDisplayName(p);
  const nameCell = url
    ? html`<a href="${url}" target="_blank" rel="noopener" class="pt-wiki text-decoration-none">${dName}</a>`
    : en ? html`${dName} (<a href="${en}" target="_blank" rel="noopener" class="pt-wiki text-decoration-none">en</a>)`
    : dName;
  const birthIso2 = p.birthCountryId != null ? iso2ForId(p.birthCountryId) : (_NULL_CODE[p.birthCountry] ?? null);
  const _bp = p.pid != null ? _birthplaceByPid[p.pid] : null;
  // actualCityName ?? city — see _buildCityRecords' own comment; same rule applies here.
  const birthCity = _bp ? (_bp.actualCityName ?? _bp.city) : null;
  const bornInLabel = birthCity ? `${birthCity}, ${p.birthCountry}` : p.birthCountry;
  // Only clickable when the birthplace actually geocoded — nothing to pan/zoom to otherwise.
  // Selects just this one row (see _selectRows) — the map-side equivalent, _scrollToCityRow,
  // selects every player sharing that birth city instead; the two triggers deliberately differ
  // in scope (one specific player here vs. "everyone at this dot" there).
  const onBornInClick = () => {
    const rec = birthCity ? _cityRecForPid(p.pid) : null;
    if (!rec) return;
    _selectRows([p.pid]);
    _zoomToCity(rec);
  };
  const teamId = QUALIFIED_BY_NAME[p.nation];
  const teamIso2 = teamId != null ? _eloItemsById.get(teamId)?.iso2 : null;
  // Only clickable for a qualified country — same "nothing to do otherwise" rule as
  // onBornInClick above. Selects that country (map flags/arcs + selection panel) and pans/zooms
  // to it, same as clicking its flag on the map or its Elo pill (see _onCountryClick) — even
  // though flags/arcs themselves stay hidden while #tab-players is the active tab
  // (_playersMapActive), the camera move itself is still meaningful (it's what you'll see on
  // switching back to tab-teams/tab-tournament, and the birth-city dots pan/zoom along with it).
  const onPlaysForClick = () => {
    if (teamId == null) return;
    activateCountry(teamId);
    if (enablesDim(teamId) && centroids[teamId]) _zoomToActiveDimFlags();
    else if (centroids[teamId]) zoomToCentroid(teamId);
  };
  const isSelected = p.pid != null && _selectedPids.has(String(p.pid));
  return html`
    <tr data-pid=${p.pid ?? nothing} class=${isSelected ? 'pt-row-selected' : nothing}>
      <td>${nameCell}${p.role === 'coach' ? html` <span class="coach-badge">${T.coach}</span>` : nothing}</td>
      <td class="pt-born${birthCity ? ' pt-born--clickable' : ''}" title=${bornInLabel} @click=${onBornInClick}>${_allPlayersFlag(birthIso2)}${bornInLabel}</td>
      <td class="pt-caps${teamId != null ? ' pt-caps--clickable' : ''}" title=${p.nation} @click=${onPlaysForClick}>${_allPlayersFlag(teamIso2)}${p.nation}</td>
      <td class="pt-num text-end">${p.role === 'coach' ? nothing : p.caps}</td>
    </tr>`;
};

// Every player/coach tied to one of `focusIds` as either birth country or squad country —
// export+native+import combined, exactly what the old per-country accordion used to split into
// three sections, just as flat rows instead. Reads the same already-deduped app.byId/
// nativeByCountry/importByCountry indices the map/tooltips use (not a flat player array — that
// kind of split wouldn't carry app.importByCountry's self-import name-mismatch fix, e.g. DR
// Congo; see CLAUDE.md's app.importByCountry section).
//
// _roles (used by #tab-players' own export/native/import filter — see control_sidebar.js's
// csb-native-table, and by tab-tournament's own export-hiding rule — see _currentPlayerSet)
// tags which bucket a player came from, relative to the WHOLE focus set, not just one id at a
// time: export (born in a focus-set country, plays for any other country), native (born in and
// plays for the same focus-set country), import (born outside the focus-set country they play
// for, even if their birth country is ALSO in the focus set — a player born in visible team A
// now playing for visible team B is tagged BOTH A's export and B's import; the dedupe below
// merges these into that one player's single row with both roles, rather than picking a side).
// Deliberate: this is what lets tab-tournament's "hide pure exports" rule (_currentPlayerSet)
// keep such a player visible under B once B is in view, instead of the row just vanishing
// because its export role alone is suppressed — "import wins" over "export hidden".
const _focusedPlayers = focusIds => {
  const byKey = new Map();
  focusIds.forEach(id => {
    const country = app.byId[id]?.country ?? QUALIFIED_NAMES[id];
    const tagged = [
      ...(app.byId[id]?.players ?? []).map(p => ({ ...p, birthCountryId: id, birthCountry: country, _roles: ['export'] })),
      ...(app.nativeByCountry[id] ?? []).map(p => ({ ...p, nation: country, birthCountryId: id, birthCountry: country, _roles: ['native'] })),
      ...(app.importByCountry[id] ?? []).map(p => ({ ...p, nation: country, _roles: ['import'] })),
    ];
    tagged.forEach(p => {
      const key = p.pid ?? `${p.name}-${p.nation}-${p.birthCountryId}`;
      const existing = byKey.get(key);
      byKey.set(key, existing ? { ...p, _roles: [...new Set([...existing._roles, ...p._roles])] } : p);
    });
  });
  return [...byKey.values()];
};

// #tab-players' own column-header sort state. name/caps sort on simple direct fields; bornIn/
// playsFor sort by the *team's* current standing — the same teamComparators control_sidebar.js's
// sidebar.sortFns exposes (keyed by sidebar.sortOrder[0], the sort table's own active leading
// criterion), reused here rather than a second, alpha-only copy of that logic. _ptFocusIds
// mirrors whatever `focusIds` produced the table
// currently on screen (set as a side effect every time _playersTableTemplate runs) so a header
// click re-renders the same view — ambient, one dim-selected team, or a fixture's two teams —
// instead of always falling back to the ambient one.
let _ptSortKey = 'name'; // 'name' | 'bornIn' | 'playsFor' | 'caps'
let _ptSortDir = 'asc';  // 'asc' | 'desc'
let _ptFocusIds = null;

// pid != null guard, never truthiness — pid 0 (Jordan Ayew) is valid. Matches _allPlayersRow's
// own lookup for the same "born-in" cell content.
// actualCityName ?? city — sorts by the same label the cell displays, not the raw (sometimes
// bureaucratic, e.g. "12th arrondissement of Paris") city field; see _buildCityRecords' comment.
const _ptBirthCity = p => {
  const bp = p.pid != null ? _birthplaceByPid[p.pid] : null;
  return bp ? (bp.actualCityName ?? bp.city) : '';
};

// A birth country can be genuinely absent from the Elo rankings entirely (e.g. the Isle of Man —
// not a FIFA member); _eloItemsById.get(id) then returns undefined. Unknown-vs-known is a real,
// orderable fact — unknown always sorts last, regardless of column direction, for
// Array#sort-consistency (a comparator must be a total order — flipping direction can't be
// allowed to also flip where missing data lands).
const _ptTeamCmp = (idA, idB) => {
  const x = idA != null ? _eloItemsById.get(idA) : null;
  const y = idB != null ? _eloItemsById.get(idB) : null;
  if (!x && !y) return 0;
  if (!x) return 1;
  if (!y) return -1;
  return sidebar.sortFns[sidebar.sortOrder[0]](x, y);
};

const _PT_SORT_FNS = {
  name:     (a, b) => playerSortKey(a).localeCompare(playerSortKey(b)),
  // Team first (whichever criterion the sort table's own leading position is currently set to),
  // city as the tie-break within it — matches the cell's own "flag / city, country" display
  // order conceptually (country is the primary grouping), even though the country name reads
  // second in the cell itself.
  bornIn:   (a, b) => _ptTeamCmp(a.birthCountryId, b.birthCountryId) || _ptBirthCity(a).localeCompare(_ptBirthCity(b)),
  playsFor: (a, b) => _ptTeamCmp(QUALIFIED_BY_NAME[a.nation], QUALIFIED_BY_NAME[b.nation]),
  // Coaches don't display a caps count (see _allPlayersRow) — treated as -1 (lowest) so they
  // consistently trail the capped-players list regardless of sort direction.
  caps:     (a, b) => (a.role === 'coach' ? -1 : a.caps ?? -1) - (b.role === 'coach' ? -1 : b.caps ?? -1),
};

const _ptSetSort = key => {
  // Clicking the active column reverses it; switching columns starts fresh — caps defaults to
  // highest-first (the common "leaderboard" reading of a numeric column), the others to A→Z.
  _ptSortDir = _ptSortKey === key ? (_ptSortDir === 'asc' ? 'desc' : 'asc') : (key === 'caps' ? 'desc' : 'asc');
  _ptSortKey = key;
  const ptEl = document.getElementById('tab-players');
  if (ptEl) render(_playersTableTemplate(_ptFocusIds), ptEl);
  // Keep control_sidebar.js's shared .csb-sort-dir glyph honest — while #tab-players is active
  // it reflects/drives *this* direction (see callbacks.getPlayersSortDir/togglePlayersSortDir
  // below), so a direct column-header click has to resync it too, not just a click on the button.
  sidebar.syncSortDirIcon?.();
};

_sidebarCallbacks.getPlayersSortDir = () => _ptSortDir;
_sidebarCallbacks.togglePlayersSortDir = () => _ptSetSort(_ptSortKey);

const _ptSortArrow = () => _ptSortDir === 'asc' ? ' ▾' : ' ▴';
const _ptTh = (key, label, extraClass = '') => html`<th
    class="pt-th${extraClass ? ' ' + extraClass : ''}${_ptSortKey === key ? ' pt-th-active' : ''}"
    @click=${() => _ptSetSort(key)}>${label}${_ptSortKey === key ? _ptSortArrow() : ''}</th>`;

// The one template #tab-players ever renders — `focusIds` narrows it to one or more teams (a
// single dim-selected team today; a future fixture's two teams reuses the same path unchanged).
// null/omitted means the ambient view: every player on a currently-visible team.
const _playersTableTemplate = (focusIds = null) => {
  _ptFocusIds = focusIds;
  const dir = _ptSortDir === 'desc' ? -1 : 1;
  const filtered = _currentPlayerSet(focusIds)
    .sort((a, b) => dir * _PT_SORT_FNS[_ptSortKey](a, b));
  const coachCount = filtered.filter(p => p.role === 'coach').length;
  return html`
    <p class="sub mb-2">${filtered.length - coachCount} players · ${coachCount} coaches</p>
    <table class="table table-sm table-striped table-hover pt-table" style="font-size:12px">
      <thead><tr>
        ${_ptTh('name', T.psbLabels.byPlayer)}${_ptTh('bornIn', T.chainLegend.bornIn, 'pt-born')}${_ptTh('playsFor', T.chainLegend.playsFor, 'pt-caps')}${_ptTh('caps', T.caps, 'pt-num text-end')}
      </tr></thead>
      <tbody>${filtered.map(_allPlayersRow)}</tbody>
    </table>`;
};

const _showAllPlayers = () => {
  const ptEl = document.getElementById('tab-players');
  if (ptEl) render(_playersTableTemplate(), ptEl);
  _showingAllPlayers = true;
  _switchTab('tab-players');
  _updateAllPlayersMapLayer();
};

// One shared layout for every #tab-players-btn mode (idle count, one-team focus, and eventually
// a fixture's two teams) — label + icon packed together as a unit inside .tab-players-label,
// with the close button (dim-selected/fixture modes only) as its last child rather than a
// sibling spacer pair, so there's exactly one close button in the DOM, ever. onClose's click
// stops propagation since it's now nested inside .tab-players-label's own onClick handler.
const _tabPlayersLabel = (iconSrc, label, onClick, onClose) => html`
  <span class="tab-players-label d-flex align-items-center gap-1 text-nowrap mx-1" @click=${onClick}>
    <span style="color: var(--text-muted); font-size: 11px;">${label}</span>
    <img class="tab-icon" src="${iconSrc}" aria-hidden="true">
    ${onClose ? html`
      <span class="btn-close" style="cursor:pointer; font-size: 8pt;" aria-label="Close"
            @click=${e => { e.stopPropagation(); onClose(); }}></span>` : nothing}
  </span>`;

// Same icon regardless of mode — the label text (a plain "N team(s)" count, see _tabPlayersLabel
// call sites below) is what tells the two apart, not the icon.
const _PLAYERS_TAB_ICON = 'images/solar_linear/user-circle-svgrepo-com.svg';

// Idle state (no country selected) — a live count of every DISTINCT country appearing in the
// ambient table, born-in or plays-for column alike, not just how many qualified teams are
// currently visible: a player's birth country can be any country in the world (Cameroon,
// unqualified, in the born-in column of a Canada export — see _focusedPlayers' own export/
// import sourcing), so counting only _visibleQualifiedIds() undercounts exactly like
// #elo-meta-count would if it only counted one side of an export/import pair. Mirrors
// #elo-meta-count's own philosophy: an authoritative count derived from the actual currently-
// shown rows (_currentPlayerSet, the same source the table itself renders from), not a
// separately-derived approximation. Previews what tab-players will show even before it's
// opened — the same preview role the dim-selected "1 team" pill (applySelection, above) already
// plays for a one-team focus, rendered through the same _tabPlayersLabel so both modes look and
// behave alike (a generic count, never the focused team's own name/flag; see applySelection's
// own comment). No-ops while dim is active: that pill belongs to applySelection instead (see
// _sidebarCallbacks.afterFlagFilter's own comment on why this is safe to call unconditionally on
// every filter/stage change). Called once at initial setup and every time clearDim runs.
const _renderPlayersTabIdle = () => {
  if (dimState.active || _activeFixture) return;
  const _pb = document.getElementById('tab-players-btn');
  if (!_pb) return;
  const wasActive = _pb.classList.contains('active');
  _pb.className = 'nav-link flex-grow-1' + (wasActive ? ' active' : '');
  // Plain country-name strings (not ids) — every entry already carries both (birthCountry from
  // its own birth-country record, nation from whichever qualified team produced it), and a name
  // is the one identity that's always populated on both sides, including a non-qualified birth
  // country an id lookup wouldn't resolve (e.g. Cameroon) or, in principle, a non-qualified
  // plays-for destination (an id-based QUALIFIED_BY_NAME lookup would silently drop either).
  const countryNames = new Set();
  for (const p of _currentPlayerSet(null)) {
    if (p.birthCountry) countryNames.add(p.birthCountry);
    if (p.nation) countryNames.add(p.nation);
  }
  const count = countryNames.size;
  render(_tabPlayersLabel(_PLAYERS_TAB_ICON, `${count} ${T.countries(count)}`, () => _showAllPlayers()), _pb);
};
_renderPlayersTabIdle();

// Every #tab-players-facing surface — the table itself (ambient or focused), the nav pill's
// live count/preview, and the map's birth-city dots — kept in lockstep, regardless of which of
// the (now several) things that can narrow the shown player set just changed: the country
// category matrix, the confederation dropdown, the stage carousel (all three routed through
// applyFlagFilter -> callbacks.afterFlagFilter), or the export/native/import filter
// (callbacks.onPlayersFilterChange). One shared refresh so all three call sites can never drift
// out of sync with each other the way the table/dots used to before this filter existed.
const _refreshPlayersView = () => {
  const ptEl = document.getElementById('tab-players');
  if (ptEl) render(_playersTableTemplate(_ptFocusIds), ptEl);
  _renderPlayersTabIdle();
  _updateAllPlayersMapLayer();
};

// Layers the players-view refresh onto the same callback assigned near initSidebar() (that first
// assignment already runs _applyGroupFocus/_applyDimFocus; see its own comment on why this
// couldn't be included there directly). Every applyFlagFilter() call from here on — category
// checkbox toggles, stage carousel moves, confederation filter — keeps the table, nav pill, and
// city dots all in sync; only the one synchronous call during initial setup (before this line
// runs) misses it, which is harmless since app.byId/nativeByCountry/importByCountry are still
// empty at that point anyway (buildIndices(rawData) hasn't run yet).
{
  const _afterFlagFilterBase = _sidebarCallbacks.afterFlagFilter;
  _sidebarCallbacks.afterFlagFilter = () => { _afterFlagFilterBase(); _refreshPlayersView(); };
}

_sidebarCallbacks.onPlayersFilterChange = _refreshPlayersView;

const clearDim = () => {
  dimState.active = false;
  dimState.sourceId = null;
  dimState.destIds = new Map();
  dimState.importIds = new Map();
  _showingAllPlayers = true;
  animateFlagOpacity(g.selectAll('.flag-qualified'), () => 1);
  g.selectAll('.flag-qualified').attr('data-dim-visible', null);
  g.selectAll('.country').attr('data-dim-visible', null);
  if (dimState.arcsGroup) dimState.arcsGroup.selectAll('.arc-line').remove();
  document.body.classList.remove('dim-active');
  // Re-assert the sidebar's own category filter — _applyDimFocus force-showed the source/
  // linked flags regardless of it while the selection was active (now a no-op, since it
  // checks dimState.active itself), so anything that override was hiding needs its
  // visibility:hidden restored, not left stuck visible.
  sidebar.applyFlagFilter();
  const _ptEl = document.getElementById('tab-players');
  if (_ptEl) render(_playersTableTemplate(), _ptEl);
  // Must run after the render above, not before — _updatePlayerCityDots reads _ptFocusIds,
  // which that render is what just reset to null; calling this any earlier would rebuild the
  // city-dot layer from the selection that's being cleared, not the ambient view it's clearing to.
  _updateAllPlayersMapLayer();
  _updateSelectionPanel(_renderPlayersTabIdle);
  _updateEloSelection();
  _updateSelectionPanel();
  _updateTabConnector();
};

// ── Activate from anywhere (map click, Elo badge, player-table country link) ──
const activateCountry = (id, scroll = false) => {
  if (id == null) return;
  const rec = app.byId[id];
  const destIds = rec
    ? new Map(rec.nations.flatMap(([n, c]) => { const did = QUALIFIED_BY_NAME[n]; return did !== undefined ? [[did, c]] : []; }))
    : new Map();
  applySelection(id, destIds);
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Fixture selection (tab-tournament's match-display mode) ───────────────────────────────────
// A whole fixture (both teams of a paired .elo-pair row, click on its separator — see
// js/elo_ranking.js's onFixtureClick) — a second, mutually-exclusive alternative to the single-
// team dim selection above. Deliberately doesn't touch the map's own dim/arc visualization
// (dimState.destIds/importIds, flag opacity, arcs) — unlike applySelection, this only drives the
// #tab-players-btn label + #tab-players content and the .elo-pair--active row highlight; map-side
// wiring is left for a later pass (see the task this was built for).
const clearFixtureSelection = () => {
  if (!_activeFixture) return;
  _activeFixture = null;
  _eloMain.updateFixture(null);
  _groupStage?.render(); // re-checks isFixtureActive for every group-stage result row — see its own comment
  _fixtureList?.render(); // same, for every "whole competition" fixture row
  _showingAllPlayers = true;
  const _ptEl = document.getElementById('tab-players');
  if (_ptEl) render(_playersTableTemplate(), _ptEl);
  _renderPlayersTabIdle();
  _updateAllPlayersMapLayer();
  _updateTabConnector();
  _updateSelectionPanel();
};

const activateFixture = (idA, idB, pairId) => {
  if (_activeFixture?.pairId === pairId) { clearFixtureSelection(); return; }
  if (dimState.active) clearDim(); // mutually exclusive with a single-team selection
  _activeFixture = { pairId, idA, idB };
  _showingAllPlayers = false;
  _eloMain.updateFixture(pairId);
  _groupStage?.render(); // re-checks isFixtureActive for every group-stage result row — see its own comment
  _fixtureList?.render(); // same, for every "whole competition" fixture row

  // See applySelection's own comment on why this scroll is gated on _playersTabActive — a
  // fixture click from tab-tournament's own pill list or the group-stage results doesn't mean
  // "look at #tab-players", only an actual click while already on that tab does.
  const ptEl = document.getElementById('tab-players');
  if (ptEl) {
    render(_playersTableTemplate(new Set([idA, idB])), ptEl);
    if (_playersTabActive) window.scrollTo({ top: 0 });
  }

  // Same generic count pattern as applySelection's own "1 team" pill (see its comment) — "2
  // teams" here, never the two teams' own names/flags.
  const _playersBtn = document.getElementById('tab-players-btn');
  if (_playersBtn) {
    const wasActive = _playersBtn.classList.contains('active');
    _playersBtn.className = 'nav-link dim-selected flex-grow-1' + (wasActive ? ' active' : '');
    render(_tabPlayersLabel(_PLAYERS_TAB_ICON, `2 ${T.countries(2)}`, () => _switchTab('tab-players'), () => clearFixtureSelection()), _playersBtn);
  }

  _updateAllPlayersMapLayer();
  _updateTabConnector();
  _updateSelectionPanel();
};

// ── Flag join helpers ─────────────────────────────────────────────────────────
const placeFlag = (sel) => {
  sel.attr('class','flag-qualified')
    .attr('width', FLAG).attr('height', FLAG)
    .on('mouseleave', () => { if (!dimState.active) { hideTip(); } });
};

// ── Main render ───────────────────────────────────────────────────────────────

// ── Data index builder ──────────────────────────────────────────────────────
// Core loop (count/nativeCount/importCount per country) shared with the chain page via
// map-container.js's buildChoroplethIndex() — pop/totalCount/eloRank/capital are
// tooltip/player-table-only fields that stay page-specific, layered on afterward.
const buildIndices = rawData => {
  const { byId, nativeByCountry, importByCountry } = buildChoroplethIndex(rawData);
  app.nativeByCountry = nativeByCountry;
  app.importByCountry = importByCountry;
  Object.values(byId).forEach(d => {
    d.pop        = rawData.pop[iso2ForId(d.id)] || null;
    d.totalCount = d.count + d.nativeCount;
    app.byId[d.id] = d;
  });
  app.pop      = rawData.pop;
  app.capital  = rawData.capital ?? {};
  app.eloRank = {};  // populated by wc2026_elo_rank.json fetch below
  legend.refresh();
};


// ── Shared tooltip/click helpers (used by both world and UK nation paths) ──────

const showExportTip = (event, id) => {
  const rec        = app.byId[id];
  if (!rec) { hideTip(); return; }
  const hasImports   = !!QUALIFIED_NAMES[id] && (app.importByCountry[id] ?? []).length > 0;
  const importCount  = hasImports ? (app.importByCountry[id] ?? []).length : 0;
  if (lastTipKey !== id) {
    lastTipKey = id;
    const exportRatio = rec.pop && rec.count ? rec.count / rec.pop : null;
    const _r2   = exportRatio !== null ? exportRatio.toFixed(2) : '?';
    const ratio = _r2 === '0.00' ? exportRatio.toPrecision(2) : _r2;
    const fc    = iso2ForId(rec.id);

    const leftCol = html`
      <div class="tt-count-row d-flex justify-content-between align-items-center">
        <div class="tt-count color-exp">${rec.count}</div>
        <div class="tt-sub">${ratio} ${T.perMillion}</div>
      </div>
      <div class="tt-label">${T.exported(rec.count, countryName(rec.id, rec.country))} ${T.selectedBy(rec.count)}</div>
      <div class="tt-countries mb-0 fst-italic">${rec.nations.map(([n, c]) => `${countryName(QUALIFIED_BY_NAME[n], n)} (${c})`).join(', ')}</div>
      <div class="tt-players ${rec.count > rec.top.length ? 'tt-more' : ''}">
        ${rec.top.map(p => html`
          <div class="tt-player">
            <span>${playerDisplayName(p)}${coachBadge(p)}</span>
            <span class="tt-country text-nowrap"><span class="color-exp">→</span> ${countryName(QUALIFIED_BY_NAME[p.nation], p.nation)}</span>
          </div>`)}
      </div>`;
    const body = hasImports
      ? html`<div class="tt-columns d-flex gap-0">
          <div class="flex-col">${leftCol}</div>
          <div class="tt-vdiv"></div>
          <div class="flex-col">${buildImportColHtml(id)}</div>
        </div>`
      : html`${QUALIFIED_NAMES[id] ? html`<div class="tt-label">${T.noImport(countryName(id, QUALIFIED_NAMES[id]))}</div>` : nothing}${leftCol}`;

    const leftTruncated  = rec.count > rec.top.length;
    const rightTruncated = importCount > 5;
    const hasMore        = leftTruncated || rightTruncated;
    render(html`
      <div class="tt-name tt-name-inner d-flex align-items-center gap-2">
        <span class="tt-name-inner d-flex align-items-center gap-2">${flagImg(fc)}${!QUALIFIED_NAMES[id] ? html`<span class="d-inline-flex flex-column lh-sm gap-1"><span class="text-muted">${countryName(rec.id, rec.country)}</span><small class="tt-pop fst-italic">${_fifaMemberIds.has(id) ? T.notQualified : T.notFifaMember}</small></span>` : countryName(rec.id, rec.country)}</span>
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(rec.pop)}${(rec.country)}${capTag(app.capital[iso2ForId(rec.id)])}</span>
      </div>
      ${body}
      ${hasMore ? html`<div class="tt-more-label text-end">${leftTruncated && rightTruncated ? T.clickForAllPlural : T.clickForAll}</div>` : nothing}`, tt);
  }
  tt.classList.toggle('tt-non-qualified', !QUALIFIED_NAMES[id]);
  positionTip(event, 240, hasImports);
};

const showImportTip = (event, destId) => {
  const key        = `import-${dimState.sourceId}-${destId}`;
  const srcRec     = app.byId[dimState.sourceId];
  if (!srcRec) { hideTip(); return; }
  const destName   = QUALIFIED_NAMES[destId];
  const allPlayers = (srcRec.players ?? []).filter(p => p.nation === destName);
  const players    = allPlayers.slice(0, 5);
  if (lastTipKey !== key) {
    lastTipKey = key;
    const destFc = iso2ForId(destId);

    render(html`
      <div class="tt-name tt-name-inner d-flex align-items-center gap-2">
        <span class="tt-name-inner d-flex align-items-center gap-2">${flagImg(destFc)}${countryName(destId, destName)}</span>
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(app.pop[destFc])}${rankTag(destName)}${capTag(app.capital[destFc])}</span>
      </div>
      <div class="tt-countries mb-0 fst-italic"><span class="color-exp">←</span> ${countryName(dimState.sourceId, srcRec.country)} (${allPlayers.length})</div>
      <div class="tt-players ${allPlayers.length > 5 ? 'tt-more' : ''}">
        ${players.map(p => html`<div class="tt-player"><span>${playerDisplayName(p)}${coachBadge(p)}</span></div>`)}
      </div>
      ${allPlayers.length > 5 ? html`<div class="tt-more-label text-end">${T.clickForAll}</div>` : nothing}`, tt);
  }
  positionTip(event, 48 + 20 + 24 * players.length + (allPlayers.length > 5 ? 18 : 0));
};

const showImportSourceTip = (event, centroidId) => {
  const key        = `impsrc-${dimState.sourceId}-${centroidId}`;
  const allPlayers = (app.importByCountry[dimState.sourceId] ?? []).filter(p => {
    const bid = p.birthCountryId != null ? p.birthCountryId : (_NULL_CENTROID_ID[p.birthCountry] ?? null);
    return bid === centroidId;
  });
  if (allPlayers.length === 0) { hideTip(); return; }
  const players    = allPlayers.slice(0, 5);
  if (lastTipKey !== key) {
    lastTipKey = key;
    const p0  = allPlayers[0];
    const bFc = p0.birthCountryId != null ? iso2ForId(p0.birthCountryId) : (_NULL_CODE[p0.birthCountry] ?? null);

    render(html`
      <div class="tt-name tt-name-inner d-flex align-items-center gap-2">
        <span class="tt-name-inner d-flex align-items-center gap-2">${flagImg(bFc)}${countryName(p0.birthCountryId, p0.birthCountry)}</span>
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(app.pop[bFc])}${rankTag(p0.birthCountry)}${capTag(app.capital[bFc])}</span>
      </div>
      <div class="tt-countries mb-0 fst-italic"><span class="color-imp">→</span> ${countryName(dimState.sourceId, QUALIFIED_NAMES[dimState.sourceId])} (${allPlayers.length})</div>
      <div class="tt-players ${allPlayers.length > 5 ? 'tt-more' : ''}">
        ${players.map(p => html`<div class="tt-player"><span>${playerDisplayName(p)}${coachBadge(p)}</span></div>`)}
      </div>
      ${allPlayers.length > 5 ? html`<div class="tt-more-label text-end">${T.clickForAll}</div>` : nothing}`, tt);
  }
  positionTip(event, 48 + 20 + 24 * players.length + (allPlayers.length > 5 ? 18 : 0));
};

const showCombinedTip = (event, id) => {
  const key           = `combined-${dimState.sourceId}-${id}`;
  const exportPlayers = (app.importByCountry[dimState.sourceId] ?? []).filter(p => {
    const bid = p.birthCountryId != null ? p.birthCountryId : (_NULL_CENTROID_ID[p.birthCountry] ?? null);
    return bid === id;
  });
  const srcRec        = app.byId[dimState.sourceId];
  const destName      = QUALIFIED_NAMES[id];
  const importPlayers = srcRec ? (srcRec.players ?? []).filter(p => p.nation === destName) : [];
  if (exportPlayers.length === 0 && importPlayers.length === 0) { hideTip(); return; }
  const topExp        = exportPlayers.slice(0, 5);
  const topImp        = importPlayers.slice(0, 5);
  if (lastTipKey !== key) {
    lastTipKey = key;
    const fc      = iso2ForId(id);
    const hasBoth = exportPlayers.length > 0 && importPlayers.length > 0;

    render(html`
      <div class="tt-name tt-name-inner d-flex align-items-center gap-2">
        <span class="tt-name-inner d-flex align-items-center gap-2">${flagImg(fc)}${countryName(id, destName)}</span>
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(app.pop[fc])}${rankTag(destName)}${capTag(app.capital[fc])}</span>
      </div>
      ${exportPlayers.length > 0 ? html`
        <div class="tt-countries mb-0 fst-italic"><span class="color-imp">→</span> ${countryName(dimState.sourceId, QUALIFIED_NAMES[dimState.sourceId])} (${exportPlayers.length})</div>
        <div class="tt-players ${exportPlayers.length > 5 ? 'tt-more' : ''}">
          ${topExp.map(p => html`<div class="tt-player"><span>${playerDisplayName(p)}${coachBadge(p)}</span></div>`)}
        </div>` : nothing}
      ${hasBoth ? html`<div class="tt-divider"></div>` : nothing}
      ${importPlayers.length > 0 ? html`
        <div class="tt-countries mb-0 fst-italic"><span class="color-exp">←</span> ${countryName(dimState.sourceId, srcRec.country)} (${importPlayers.length})</div>
        <div class="tt-players ${importPlayers.length > 5 ? 'tt-more' : ''}">
          ${topImp.map(p => html`<div class="tt-player"><span>${playerDisplayName(p)}${coachBadge(p)}</span></div>`)}
        </div>` : nothing}
      ${exportPlayers.length > 5 || importPlayers.length > 5 ? html`<div class="tt-more-label text-end">${exportPlayers.length > 5 && importPlayers.length > 5 ? T.clickForAllPlural : T.clickForAll}</div>` : nothing}`, tt);
  }
  const h = 48 + (exportPlayers.length > 0 ? 20 + 24 * topExp.length : 0)
                + (importPlayers.length > 0 ? 20 + 24 * topImp.length : 0)
                + (exportPlayers.length > 0 && importPlayers.length > 0 ? 20 : 0);
  positionTip(event, h);
};

const showSimpleTip = (event, id, topoName) => {
  if (lastTipKey !== id) {
    lastTipKey = id;
    const fc   = iso2ForId(id);
    const name = countryName(id, topoName);
    render(html`
      <div class="tt-name tt-name-inner d-flex align-items-center gap-2">
        <span class="tt-name-inner d-flex align-items-center gap-2">${flagImg(fc)}<span class="d-inline-flex flex-column lh-sm gap-1"><span class="text-muted">${name}</span><small class="tt-pop fst-italic">${_fifaMemberIds.has(id) ? T.notQualified : T.notFifaMember}</small></span></span>
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(app.pop[fc])}${capTag(app.capital[fc])}</span>
      </div>`, tt);
  }
  tt.classList.add('tt-non-qualified');
  positionTip(event, 60, false);
};

// The birth-city bubble layer's own tooltip (see _updatePlayerCityDots) — same #tooltip element
// and positionTip()/hideTip() mechanics as every country tooltip, mirrored header layout: city
// name + its (opaque, possibly malformed — see data/v2/birthplace.json's own doc comment) raw
// population string on the left, the birth country's flag + name on the right (every player in
// `rec` shares one birth coordinate, hence one country — never mixed). Every player born there
// is listed, not just a top-N slice — this is a single city, not a whole country's export list,
// so it never grows large enough to need the top-5-plus-"more" treatment those use.
const showCityTip = (event, rec) => {
  const key = `${rec.lat},${rec.lon}`;
  if (lastTipKey !== key) {
    lastTipKey = key;
    const iso2 = rec.countryId != null ? iso2ForId(rec.countryId) : (_NULL_CODE[rec.countryLabel] ?? null);
    const sorted = rec.players.slice().sort((a, b) => playerSortKey(a).localeCompare(playerSortKey(b)));
    render(html`
      <div class="tt-name tt-name-inner d-flex align-items-center justify-content-between gap-2">
        <span class="d-inline-flex flex-column lh-sm gap-1">
          <span class="tt-name-inner">${rec.city}</span>
          ${rec.population ? html`<small class="tt-pop fst-italic">${T.pop} ${rec.population}</small>` : nothing}
        </span>
        <span class="tt-name-inner d-flex align-items-center gap-2 flex-shrink-0 ms-2">${flagImg(iso2)}${countryName(rec.countryId, rec.countryLabel)}</span>
      </div>
      <div class="tt-players">
        ${sorted.map(p => html`
          <div class="tt-player">
            <span>${playerDisplayName(p)}${coachBadge(p)}</span>
            <span class="tt-country text-nowrap"><span class="color-exp">→</span> ${countryName(QUALIFIED_BY_NAME[p.nation], p.nation)}</span>
          </div>`)}
      </div>`, tt);
  }
  positionTip(event, Math.min(480, 90 + rec.players.length * 22), false);
};

const onCountryMousemove = (event, id, topoName = '') => {
  if (_playersMapActive()) { hideTip(); return; }
  if (!_eloItemsById.has(id) && !QUALIFIED_NAMES[id]) { hideTip(); return; }
  const _flagEl = g.select(`.flag-qualified[data-id="${id}"]`).node();
  if (_flagEl?.getAttribute('visibility') === 'hidden') { hideTip(); return; }
  if (dimState.active && _flagEl && !_flagEl.hasAttribute('data-dim-visible') && id !== dimState.sourceId) { hideTip(); return; }
  if (!dimState.active) {
    const hlName = countryName(id, QUALIFIED_NAMES[id] ?? app.byId[id]?.country ?? topoName);
    const hlBadgeW = Math.round(hlName.length * 5.8 + 46);
    const hlBx = 895 - hlBadgeW;
    if (app.byId[id]?.count > 0) showExportTip(event, id);
    else if (QUALIFIED_NAMES[id]) showQualifiedTip(event, QUALIFIED_NAMES[id], iso2ForId(id));
    else showSimpleTip(event, id, topoName);
  } else {
    const inDest = dimState.destIds.has(id), inImport = dimState.importIds.has(id);
    if      (inDest && inImport) showCombinedTip(event, id);
    else if (inDest)             showImportTip(event, id);
    else if (inImport)           showImportSourceTip(event, id);
    else if (id === dimState.sourceId) {
      if (app.byId[id]?.count > 0) showExportTip(event, id);
      else if (QUALIFIED_NAMES[id]) showQualifiedTip(event, QUALIFIED_NAMES[id], iso2ForId(id));
    } else hideTip();
  }
};

const onCountryClick = (event, id) => {
  event.stopPropagation();
  // No entering, switching, or clearing a selection from the map itself while tab-players is
  // active — flags are hidden there, and the #tab-players-btn close (✕) is the only way out.
  if (_playersMapActive()) return;
  if (!sidebar.isClickable(id)) {
    if (dimState.active) clearDim();
    return;
  }
  if (dimState.sourceId === id) { 
    clearDim(); 
    return; 
  }
  activateCountry(id);
};
// ── World render ────────────────────────────────────────────────────────────
const renderWorld = (world, ukNations, capeVerdeGeo, curacaoGeo) => {

// Ocean background + world choropleth + mesh borders + UK home nations — shared with
// the chain page via map-container.js's paintChoropleth() (Kosovo id patch included).
// Only the drawing itself is shared; mousemove/click/cursor/dim wiring (all
// page-specific — tooltips, dim mode, sidebar filters) is chained onto the returned
// selections below.
const { worldFeatures, ukFeatures, oceanPath, countryPaths, ukPaths } = paintChoropleth(g, path, world, ukNations, app.byId);
_worldFeatures = worldFeatures;
_ukFeatures = ukFeatures;

// Real ocean gets the same tooltip-hiding mousemove the temporary loading placeholder above
// has — without it, moving from a country straight to open water left the tooltip stuck
// showing the last-hovered country: every country/flag's own mouseleave skips hideTip()
// while dim mode is active (assuming a subsequent hover elsewhere will replace it), and
// nothing else was wired to catch "moved to a spot with no country at all" during dim mode.
oceanPath.on('mousemove', () => { hideTip(); });

countryPaths
  .attr('data-enables-dim', d => enablesDim(+d.id) ? '' : null)
  .style('cursor', d => sidebar.isClickable(+d.id) ? 'pointer' : 'default')
  .on('mousemove', (event, d) => onCountryMousemove(event, +d.id, d.properties?.name))
  .on('mouseleave', () => { if (!dimState.active) { hideTip(); } })
  .on('click',     (event, d) => onCountryClick(event, +d.id));

ukPaths
  .attr('data-enables-dim', d => enablesDim(d._id) ? '' : null)
  .style('cursor', d => sidebar.isClickable(d._id) ? 'pointer' : 'default')
  .on('mousemove', (event, d) => onCountryMousemove(event, d._id))
  .on('mouseleave', () => { if (!dimState.active) hideTip(); })
  .on('click',     (event, d) => onCountryClick(event, d._id));

// Ocean-only clip path: sphere − land (even-odd rule punches out land areas)
svg.append('defs').append('clipPath').attr('id', 'ocean-clip')
  .append('path')
  .attr('clip-rule', 'evenodd')
  .attr('d', path({type:'Sphere'}) + ' ' + path(topojson.merge(world, world.objects.countries.geometries)));

// Arc group — below flags so arcs never cover flag icons
dimState.arcsGroup = g.append('g').attr('class', 'arcs-group');

// Leader lines for offset flags — drawn first, clipped to ocean so they vanish over land
const leaderGroup = g.append('g').attr('clip-path', 'url(#ocean-clip)');
const appendLeaderLine = (cx, cy, fx, fy) =>
  leaderGroup.append('line')
    .attr('class', 'leader-line')
    .attr('data-centroid-cx', cx).attr('data-centroid-cy', cy)
    .attr('data-flag-dx', fx - cx).attr('data-flag-dy', fy - cy)
    .attr('x1', cx).attr('y1', cy)
    .attr('x2', fx).attr('y2', fy)
    .attr('stroke', '#555').attr('stroke-width', 2)
    .attr('stroke-dasharray', '0,3').attr('stroke-linecap', 'round').attr('opacity', 0.5)
    .attr('pointer-events', 'none');

// ── Fixed-zoom country insets (Cape Verde, Curaçao — islands invisible in the
// 110m world-atlas topojson at any sane scale). Each renders the real archipelago
// shape (from a standalone geoBoundaries GeoJSON) inside a small circle held at a
// CONSTANT on-screen size via a nested `.inset-fixed-scale` group whose transform
// is recomputed every zoom tick as `translate(anchor) scale(1/k)` — since it sits
// inside `g` (already scaled by k from the main zoom), the net scale on its content
// is always 1, however far the user zooms the main map in or out. Anchored to an
// open-ocean lon/lat near the real islands; a leader line (existing mechanism)
// connects the true (essentially invisible) centroid to the inset.
const buildFixedInset = ({ id, geo, anchor, r }) => {
  if (!geo || !_eloItemsById.has(id)) return;
  const [cx, cy] = projection(d3.geoCentroid(geo));
  const [fx, fy] = projection(anchor);
  const line = appendLeaderLine(cx, cy, fx, fy);

  const localProjection = d3.geoMercator().fitExtent([[-r + 5, -r + 5], [r - 5, r - 5]], geo);
  const localPath = d3.geoPath(localProjection);

  const fix = g.append('g').attr('class', 'inset-fixed-scale')
    .attr('data-cx', fx).attr('data-cy', fy)
    .attr('transform', 'scale(1)')
    .style('pointer-events', 'none');
  fix.append('circle').attr('r', r).attr('fill', '#dbeeff').attr('stroke', '#556677').attr('stroke-width', 1);
  fix.selectAll('path').data(geo.features).join('path')
    .attr('d', localPath).attr('fill', '#cabf9e').attr('stroke', '#8a7f63').attr('stroke-width', 0.6);
  fix.append('circle').attr('r', r).attr('fill', 'none').attr('stroke', '#333').attr('stroke-width', 1.2);

  const flagS = FLAG * 1.3;
  const flag = fix.append('image')
    .attr('class', 'flag-qualified flag-fixed')
    .attr('href', FLAG_CDN(iso2ForId(id)))
    .attr('data-id', id)
    // data-cx/cy here are NOT used to position this element (.flag-fixed opts out
    // of that in map-container.js's zoom handler — x/y above are local badge
    // coordinates instead) — they exist only so code that scans .flag-qualified
    // positions directly off the DOM (_zoomToVisibleFlags, the initial fit-all-flags
    // bounds) sees the same anchor point already stored in the `centroids` map.
    .attr('data-cx', fx).attr('data-cy', fy)
    .attr('width', flagS).attr('height', flagS)
    .attr('x', r * 0.5 - flagS / 2).attr('y', r * 0.5 - flagS / 2)
    .style('pointer-events', 'all')
    .attr('data-enables-dim', enablesDim(id) ? '' : null)
    .attr('cursor', sidebar.isClickable(id) ? 'pointer' : 'default')
    .on('mousemove', event => onCountryMousemove(event, id))
    .on('mouseleave', () => { if (!dimState.active) hideTip(); })
    .on('click', event => onCountryClick(event, id));

  const flagNode = flag.node();
  const syncVisibility = () => {
    const hidden = flagNode.getAttribute('visibility') === 'hidden';
    fix.attr('visibility', hidden ? 'hidden' : null);
    line.attr('visibility', hidden ? 'hidden' : null);
  };
  new MutationObserver(syncVisibility).observe(flagNode, { attributes: true, attributeFilter: ['visibility'] });
  syncVisibility();

  centroids[id] = [fx, fy];
};

// Simpler stand-in for buildFixedInset: the real archipelago shape drawn at true
// scale (like the UK home nations' own uk-nations.geojson paths) plus a flag at
// its centroid, both scaling normally with zoom like every other country. At low
// zoom the shape is a few px and the flag effectively stands in for it; at high
// enough zoom the real islands become distinguishable on their own, making the
// fixed-zoom inset above unnecessary — parked here rather than deleted, in case
// we want it back once the tradeoff is settled.
const buildPlainCountry = ({ id, geo }) => {
  if (!geo || !_eloItemsById.has(id)) return;
  g.selectAll(`.country-extra[data-id="${id}"]`)
    .data(geo.features.map(f => ({ ...f, id })))
    .join('path')
    .attr('class', 'country country-extra')
    .attr('data-id', id)
    .attr('d', path)
    .attr('fill', choroFill(id, app.byId))
    .attr('stroke', '#ccc8c0').attr('stroke-width', .3)
    .attr('data-enables-dim', enablesDim(id) ? '' : null)
    .style('cursor', sidebar.isClickable(id) ? 'pointer' : 'default')
    .on('mousemove', (event) => onCountryMousemove(event, id))
    .on('mouseleave', () => { if (!dimState.active) hideTip(); })
    .on('click',     (event) => onCountryClick(event, id));

  const [cx, cy] = projection(d3.geoCentroid(geo));
  g.append('image')
    .call(placeFlag)
    .attr('href', FLAG_CDN(iso2ForId(id)))
    .attr('data-id', id)
    .attr('data-cx', cx).attr('data-cy', cy)
    .attr('x', cx - FLAG/2).attr('y', cy - FLAG/2)
    .attr('pointer-events', 'all')
    .attr('data-enables-dim', enablesDim(id) ? '' : null)
    .attr('cursor', sidebar.isClickable(id) ? 'pointer' : 'default')
    .on('mousemove', (event) => onCountryMousemove(event, id))
    .on('click',     (event) => onCountryClick(event, id));
  centroids[id] = [cx, cy];
};

// ── Third kind of zoom (alongside the main map's own, and each flag icon's own
// sub-linear FLAG_SIZE_ZOOM_EXP growth — see map-container.js): the real
// island shape is drawn as a normal `.country` path — at k ≥ CV_BLEND_K_THRESHOLD
// this is pixel-identical to plain rendering (the wrapping transform below is
// the identity there, and the flag sits at a small, constant, Croatia-like
// offset from the shape). Below that threshold, an ocean-tinted circle appears.
// Two earlier iterations of this got the circle's placement wrong: anchoring
// the square AT the island's own bbox corner let the (always-outside-the-
// -inscribed-circle) corner region eat into real island territory once
// CV_REST_MIN inflated the square past a tiny island's true size (Curaçao);
// centering the circle exactly on the island's centroid fixed containment but
// dragged the fixed anchor corner uncomfortably far from the real shore. The
// current compromise (CV_ISLAND_RATIO) places the island's true centroid a
// fraction of the way from the anchor corner toward the flag corner — close
// enough to the anchor to keep drift small, far enough from the true bbox's
// own corner to stay inside the circle (CV_REST_MULT is sized accordingly).
// The square that circle is inscribed in has the shape's real `corner` as its
// fixed corner (bottom-right or bottom-left) — that corner never moves beyond
// normal map pan/zoom — and the flag sits at the diagonally-opposite (square)
// corner. CRITICAL: below threshold the circle must never get BIGGER on
// screen than it was AT the threshold — it only shrinks, just more slowly than
// the main map does (CV_BLEND_ALPHA controls how much more slowly) — an
// earlier version interpolated toward a bigger fixed end-size at k=1, which
// made Cape Verde visibly zoom IN on itself while unzooming — wrong. The power
// curve below is continuous and monotonically non-increasing as k drops, by
// construction (screenSide(k_th) is the curve's maximum). The flag itself uses
// the exact same generic sizing as every other flag — only its anchor
// (data-cx/data-cy) is recomputed each tick (via onZoomPre) to track the
// receding corner.
const CV_BLEND_K_THRESHOLD = 3;   // main-map k below which the inset appears — higher = starts sooner
                                   // (while still more zoomed-in), also raising the size ceiling below
const CV_REST_MULT         = 1.6; // resting (k ≥ threshold) circle radius = true bbox's own half-diagonal × this
                                   // (bumped up from 1.2 to keep the island safely inside the circle now that
                                   // CV_ISLAND_RATIO no longer centers it — see containment note below)
const CV_REST_MIN          = 3.75; // …but never smaller than this radius (world units) — Curaçao's true bbox
                                    // is much smaller than Cape Verde's archipelago, so pure padding alone
                                    // made its circle/gap imperceptibly tiny (~5px vs Cape Verde's ~26px)
const CV_BLEND_ALPHA       = 0.35; // below threshold: screenSide ∝ k^ALPHA — 0 = fixed size, 1 = no decoupling
const CV_ISLAND_RATIO      = 1/3;  // where the island's true centroid sits between the anchor corner (0) and
                                    // the flag corner (1), as a fraction of the square's side. 0.5 = dead
                                    // center (what centroid-centering gave us — correct but dragged the fixed
                                    // anchor corner uncomfortably far from the real shore). A smaller value
                                    // keeps the anchor close to the real island (less visible drift), at the
                                    // cost of the square/circle extending further past the flag corner —
                                    // fine, that's just open sea either way.

// corner = the square's fixed corner (opposite the flag) as 'bottom-right' or
// 'bottom-left' — always on the island side; the flag sits diagonally opposite.
const buildBlendedInset = ({ id, geo, corner = 'bottom-right' }) => {
  if (!geo || !_eloItemsById.has(id)) return;
  const [[bx0, by0], [bx1, by1]] = path.bounds({ type: 'FeatureCollection', features: geo.features });
  const midX = (bx0 + bx1) / 2, midY = (by0 + by1) / 2; // true island's own centroid
  const trueRadius = Math.hypot(bx1 - bx0, by1 - by0) / 2; // reaches the true bbox's own corners exactly
  const restRadius = Math.max(trueRadius * CV_REST_MULT, CV_REST_MIN);
  const restSide = restRadius * 2; // side of the square this circle is inscribed in
  const [cornerY, cornerX] = corner.split('-'); // 'bottom','right'
  const signX = cornerX === 'right' ? -1 : 1; // direction from the square's fixed corner toward the flag's corner
  const signY = cornerY === 'bottom' ? -1 : 1;
  // Anchor placed so the island's true centroid sits CV_ISLAND_RATIO of the way from it toward the flag corner
  // (not at the square's own center — see CV_ISLAND_RATIO above).
  const ax = midX - signX * restSide * CV_ISLAND_RATIO; // fixed corner point — never moves beyond normal map pan/zoom
  const ay = midY - signY * restSide * CV_ISLAND_RATIO;
  const ccx = ax + signX * restSide / 2; // circle center — standard inscribed-circle placement within the square
  const ccy = ay + signY * restSide / 2;

  // data-id lets other layers (birth-city dots — see _updatePlayerCityDots) find this island's
  // own warp group and park themselves inside it, so a city dot sitting on Cape Verde/Curaçao
  // rides the SAME nested transform (below) the island's own shape/flag already use — no
  // separate per-tick math needed, it's just another child of an already-animated group.
  const blend = g.append('g').attr('class', 'cv-blend').attr('data-id', id);
  const circle = blend.append('circle')
    .attr('cx', ccx).attr('cy', ccy).attr('r', restRadius)
    .attr('fill', '#dbeeff').attr('stroke', '#ccc8c0') // same stroke color as .country borders
    .attr('pointer-events', 'none');

  blend.selectAll('path')
    .data(geo.features.map(f => ({ ...f, id })))
    .join('path')
    .attr('class', 'country country-extra')
    .attr('data-id', id)
    .attr('d', path)
    .attr('fill', choroFill(id, app.byId))
    .attr('stroke', '#ccc8c0').attr('stroke-width', .3)
    .attr('data-enables-dim', enablesDim(id) ? '' : null)
    .style('cursor', sidebar.isClickable(id) ? 'pointer' : 'default')
    .on('mousemove', (event) => onCountryMousemove(event, id))
    .on('mouseleave', () => { if (!dimState.active) hideTip(); })
    .on('click',     (event) => onCountryClick(event, id));

  const flag = g.append('image')
    .call(placeFlag)
    .attr('href', FLAG_CDN(iso2ForId(id)))
    .attr('data-id', id)
    .attr('pointer-events', 'all')
    .attr('data-enables-dim', enablesDim(id) ? '' : null)
    .attr('cursor', sidebar.isClickable(id) ? 'pointer' : 'default')
    .on('mousemove', (event) => onCountryMousemove(event, id))
    .on('click',     (event) => onCountryClick(event, id));

  const flagNode = flag.node();
  // Mirrors opacity too, not just visibility — js/flag_visibility.js's animateFlagHidden fades
  // the flag's opacity over ~180ms+ and only flips `visibility` at the very end of a hide (or
  // immediately, ahead of its own fade-in, for a show). Tracking visibility alone made this
  // circle either pop in instantly before the flag had faded in at all, or stay fully solid for
  // the flag's entire fade-out before snapping away at the last instant — never actually in
  // sync with what the flag was doing. Mirroring opacity too (updated every animation frame,
  // since the MutationObserver fires per DOM mutation) keeps the circle's own fade tied to the
  // flag's, so it only ever appears/disappears together with its own flag, not ahead of or
  // behind it.
  const syncBlend = () => {
    const hidden = flagNode.getAttribute('visibility') === 'hidden';
    blend.attr('visibility', hidden ? 'hidden' : null)
      .attr('opacity', flagNode.getAttribute('opacity') ?? 1);
  };
  new MutationObserver(syncBlend).observe(flagNode, { attributes: true, attributeFilter: ['visibility', 'opacity'] });
  syncBlend();

  const update = k => {
    const screenSide = k >= CV_BLEND_K_THRESHOLD
      ? restSide * k
      : restSide * Math.pow(CV_BLEND_K_THRESHOLD, 1 - CV_BLEND_ALPHA) * Math.pow(k, CV_BLEND_ALPHA);
    const factor = screenSide / (k * restSide); // extra world-space scale, pivoted on the anchor, on top of the map's own k
    blend.attr('transform', `translate(${ax},${ay}) scale(${factor}) translate(${-ax},${-ay})`);
    _islandWarp.set(id, { ax, ay, factor });
    // Birth-city dots on this island (see _updatePlayerCityDots/_warpIslandPoint) aren't
    // children of `blend` — unlike the country path, a dot's own SIZE must stay governed by the
    // ordinary cityDotRadius(k) curve, not get multiplied by `factor` too, so it can't just ride
    // the group transform the way the path does (same reason the flag above is a sibling, not a
    // child, of `blend`). Reposition them here instead, each tick, from their own stored raw
    // (pre-warp) projected coordinates.
    g.selectAll(`.city-dot[data-country-id="${id}"]`).each(function() {
      const raw = d3.select(this);
      const [wx, wy] = _warpIslandPoint(id, +raw.attr('data-raw-cx'), +raw.attr('data-raw-cy'));
      raw.attr('cx', wx).attr('cy', wy);
    });
    circle.attr('opacity', k >= CV_BLEND_K_THRESHOLD ? 0 : 1)
      .attr('stroke-width', 0.3 / (k * factor)); // same weight as .country borders (stroke-width: .3), counteracting blend's own scaling
    blend.selectAll('path.country-extra').attr('stroke-width', 0.3 / (k * factor)); // same treatment for the island outline itself
    const flagX = ax + signX * screenSide / k;
    const flagY = ay + signY * screenSide / k;
    flag.attr('data-cx', flagX).attr('data-cy', flagY)
      .attr('x', flagX - FLAG/2).attr('y', flagY - FLAG/2); // seed value; generic resize overwrites width/height/x/y right after
    // Arcs' stored endpoints (data-sx/sy) are frozen at draw time (see applyDim) —
    // known limitation: if dim mode is active on this country while the user keeps
    // zooming, its arc endpoint won't visually track the receding anchor.
    centroids[id] = [flagX, flagY];
  };

  _blendedInsets.push(update);
  update(dimState.k || 1);
};

worldFeatures.forEach(d => {
  const fp = FLAG_POS_OVERRIDE[+d.id];
  if (!fp) return;
  const [cx, cy] = dotCentroid(d, projection, path);
  const [fx, fy] = projection(fp);
  appendLeaderLine(cx, cy, fx, fy);
});

// ── All flags from world topojson (qualified + non-qualified, filtered by elo membership) ──
worldFeatures
  .filter(d => { const id = +d.id; return id !== 826 && _eloItemsById.has(id); })
  .forEach(d => {
    const id = +d.id;
    const [cx, cy] = dotCentroid(d, projection, path);
    const fp = FLAG_POS_OVERRIDE[id];
    const [fx, fy] = fp ? projection(fp) : [cx, cy];
    const sel = g.append('image')
      .call(placeFlag)
      .attr('href', FLAG_CDN(iso2ForId(id)))
      .attr('data-id', id)
      .attr('data-cx', fx).attr('data-cy', fy)
      .attr('x', fx - FLAG/2).attr('y', fy - FLAG/2)
      .attr('pointer-events', 'all')
      .attr('data-enables-dim', enablesDim(id) ? '' : null)
      .attr('cursor', sidebar.isClickable(id) ? 'pointer' : 'default')
      .on('mousemove', (event) => onCountryMousemove(event, id))
      .on('click',     (event) => onCountryClick(event, id));
    if (fp) sel.classed('offset-flag', true)
      .attr('data-centroid-cx', cx).attr('data-centroid-cy', cy)
      .attr('data-flag-dx', fx - cx).attr('data-flag-dy', fy - cy);
  });

// ── UK home nations flags (after the .flag-qualified join so England/Scotland aren't removed by its exit) ──
ukFeatures
  .filter(f => f._id === 8260 || f._id === 8261 || f._id === 8262 || f._id === 8263)
  .forEach(f => {
    const ov = CENTROID_OVERRIDE[f._id];
    const [cx, cy] = ov ? projection(ov) : path.centroid(f);
    centroids[f._id] = [cx, cy];
    g.append('image')
      .call(placeFlag)
      .attr('href', FLAG_CDN(iso2ForId(f._id)))
      .attr('data-id', f._id)
      .attr('data-cx', cx).attr('data-cy', cy)
      .attr('x', cx - FLAG/2).attr('y', cy - FLAG/2)
      .attr('pointer-events', 'all')
      .attr('data-enables-dim', enablesDim(f._id) ? '' : null)
      .attr('cursor', sidebar.isClickable(f._id) ? 'pointer' : 'default')
      .on('mousemove', (event) => onCountryMousemove(event, f._id))
      .on('click',     (event) => onCountryClick(event, f._id));
  });

// ── Fixed-zoom insets — islands absent from the 110m world-atlas topojson ──────
// buildFixedInset({ id: 132, geo: capeVerdeGeo, anchor: [-36, 10], r: 22 }); // Cape Verde — parked (full decoupling, offset anchor + leader line)
// buildPlainCountry({ id: 132, geo: capeVerdeGeo }); // Cape Verde — parked (zero decoupling, no circle)
buildBlendedInset({ id: 132, geo: capeVerdeGeo, corner: 'bottom-right' }); // Cape Verde — flag top-left
buildBlendedInset({ id: 531, geo: curacaoGeo, corner: 'bottom-left' });    // Curaçao — flag top-right

// ── Stamp all flags with elo-filter category ────────────────────────────────
g.selectAll('.flag-qualified[data-id]').attr('data-elo-cat', function() {
  return sidebar.flagCat(+this.getAttribute('data-id'));
});


sidebar.applyFlagFilter();

// ── Centroids map (for arc drawing) ──────────────────────────────────────────
topojson.feature(world, world.objects.countries).features
  .filter(f => +f.id !== 826)
  .forEach(f => { centroids[+f.id] = dotCentroid(f, projection, path); });
// UK nation centroids set above when placing flags


};

Promise.all([
  fetch('data/v2/map.json').then(r => r.json()),
  d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
  fetch('data/uk-nations.geojson').then(r => r.json()),
  loadEloData(),
  loadWikiData(),
  fetch('data/fixtures.json').then(r => r.json()).catch(() => null),
  fetch('geo/cape-verde.geojson').then(r => r.json()).catch(() => null),
  fetch('geo/curacao.geojson').then(r => r.json()).catch(() => null),
  fetch('data/v2/birthplace.json').then(r => r.json()).catch(() => ({})),
]).then(([rawData, world, ukNations, { eloData, statusByIso2 }, , fixturesData, capeVerdeGeo, curacaoGeo, birthplaceByPid]) => {
  _birthplaceByPid = birthplaceByPid;
  _worldTopo = world;
  _eloData = eloData;
  app.eloRank = Object.fromEntries(
    eloData.rankings.flatMap(({id, rank}) => { const n = QUALIFIED_NAMES[id]; return n ? [[n, rank]] : []; })
  );
  eloData.rankings.forEach(r => { if (r.fifaMember) _fifaMemberIds.add(r.id); if (r.id != null) _eloRankedIds.add(r.id); });
  buildIndices(rawData);
  // Pre-populate _eloItemsById (without centroids) so renderWorld can filter flags by elo membership
  buildEloItems({
    rankings: eloData.rankings, byId: app.byId, importByCountry: app.importByCountry,
    nativeByCountry: app.nativeByCountry,
    fifaMemberIds: _fifaMemberIds, countryNameFn: countryName, pop: app.pop, statusByIso2,
  }).forEach(item => _eloItemsById.set(item.id, item));
  renderWorld(world, ukNations, capeVerdeGeo, curacaoGeo);
  // First real paint of #tab-players — until now it's been empty (no synchronous render at
  // module load; see the comment near the top of the file). Needs to run after renderWorld
  // (_visibleQualifiedIds reads flags it creates), but doesn't depend on anything else below.
  { const _ptElInit = document.getElementById('tab-players'); if (_ptElInit) render(_playersTableTemplate(), _ptElInit); }
  // Init elo ranking component with centroids now populated
  // Kept as its own named reference (not just assigned inline to _eloMain.onCountryClick) so
  // js/group_stage.js's pills can be wired to the exact same function below — <elo-ranking>'s
  // own .onCountryClick is a setter-only accessor (js/elo_ranking.js's `set onCountryClick`,
  // no getter), so reading _eloMain.onCountryClick back here would silently be undefined.
  const _onCountryClick = id => {
    if (dimState.sourceId === id) { clearDim(); return; }
    activateCountry(id);
    if (enablesDim(id) && centroids[id]) _zoomToActiveDimFlags();
    else if (centroids[id]) zoomToCentroid(id);
  };
  _eloMain.onCountryClick = _onCountryClick;
  _eloMain.isClickable = () => true;
  // Fixture pairs (.elo-pair rows) only ever render in tab-tournament's match-display mode
  // (see control_sidebar.js's _buildGroups/_pairId) — tab-teams has no fixture concept, so this
  // wiring is a no-op there without needing its own tab check.
  _eloMain.onFixtureClick = activateFixture;
  const { rawItems: _eloRawItems, render: _eloRender } = initEloRanking({
    el: _eloMain, sidebar,
    buildArgs: { rankings: eloData.rankings, byId: app.byId, importByCountry: app.importByCountry, nativeByCountry: app.nativeByCountry, countryNameFn: countryName, centroids, pop: app.pop, statusByIso2 },
    fmtPop, eloData,
    popData: { source: rawData.popSource, updated: rawData.popUpdated },
  });
  _renderEloBase = _eloRender;
  _eloItemsById.clear();
  _eloRawItems.forEach(item => _eloItemsById.set(item.id, item));
  app.stageIndexById = new Map(_eloRawItems.map(item => [item.id, item.visibleThroughIndex]));
  app.bracketState = buildBracketState(statusByIso2, eloData.rankings.filter(r => QUALIFIED_NAMES[r.id] && r.iso2).map(r => r.iso2));
  // Powers the control-sidebar's "match" sort criterion — pairs each team with its
  // known opponent for the round matching whichever carousel stage is active.
  app.matchInfoByIso2 = buildMatchInfo(statusByIso2, fixturesData, buildNameByIso2(eloData.rankings, countryName));
  // Same buildEloItems() items the rest of tab-tournament's pills already render from — see
  // js/group_stage.js's own comment on why it needs these (elo pts/qualified/exp/imp/color),
  // not fixturesData.standings, for its results-section pills to match other stages exactly.
  const _eloItemsByIso2 = new Map(_eloRawItems.map(item => [item.iso2, item]));
  _groupStage = initGroupStage({
    container: _groupStageEl, fixturesData, T, regionName, eloItemsByIso2: _eloItemsByIso2,
    // Same sort-criterion ordering/pill-figure logic a knockout match-display pair already uses
    // (js/control_sidebar.js's own orderPair/ptsFor) — passed straight through to fixtureRow (js/
    // elo_ranking.js) via group_stage.js, so a group-stage result orders/labels its own two teams
    // identically to a knockout pair, live (re-derived on every sidebar.orderPair/ptsFor call, not
    // cached — see _renderElo's own _groupStage?.render()).
    orderPair: sidebar.orderPair, ptsFor: sidebar.ptsFor, fmtPop,
    // Literally the same function assigned to _eloMain.onCountryClick just above — clicking a
    // pill or team name here has to behave identically (selection, dim/arc mode, map zoom,
    // toggle-off-if-already-active) to clicking one in tab-tournament's own pill list, and
    // reusing the exact reference is what guarantees that.
    onCountryClick: _onCountryClick,
    // Same reference tab-tournament's own match-display fixture pairs use (see _eloMain.onFixtureClick
    // just above) — a played group-stage result is just as real a fixture as a knockout pairing,
    // it was only ever missing this wiring (group_stage.js's _resultRow reused the same pill/
    // separator markup from the start, but had no click handler on the separator until now).
    onFixtureClick: activateFixture,
    // Live predicate, not a snapshot — _activeFixture can change (or clear) without
    // initGroupStage's own render() being the thing that ran, so this always reads the current
    // value at render time rather than whatever it was when initGroupStage was first called.
    isFixtureActive: pairId => _activeFixture?.pairId === pairId,
    // "Show only this group's 4 teams" on the map — layered on top of the sidebar's own
    // category filter via callbacks.afterFlagFilter (see control_sidebar.js/applyFlagFilter),
    // not folded into it, since the sidebar has no reason to know this concern exists.
    onGroupSelect: (letter, teamIds) => {
      // Switching the group focus (including back to "All") makes any currently dim-selected
      // country's arcs/flags stale — it may not even be part of the newly focused group — so
      // clear it the same way clicking its own active pill again would.
      if (dimState.sourceId) clearDim();
      _groupFocusIds = letter ? new Set(teamIds) : null;
      sidebar.applyFlagFilter();
      // No automatic pan/zoom here — browsing quickly through group letters shouldn't yank the
      // map around on every click. #zoom-span (_zoomToVisibleFlags) is still right there for
      // the user to trigger the same "fit to what's currently visible" manually whenever they
      // actually want it.
    },
  });
  // "Whole competition" (carousel stage -1) — every fixture, chronologically, via the same
  // fixtureRow markup/click wiring group_stage.js's own results already use (see js/fixture_list.js's
  // own comment). Reuses the exact same onCountryClick/onFixtureClick/isFixtureActive references
  // passed to initGroupStage just above, so click behavior is identical everywhere in the app.
  _fixtureList = initFixtureList({
    container: _fixtureListEl, fixturesData, eloItemsByIso2: _eloItemsByIso2, regionName,
    orderPair: sidebar.orderPair, ptsFor: sidebar.ptsFor, fmtPop,
    onCountryClick: _onCountryClick,
    onFixtureClick: activateFixture,
    isFixtureActive: pairId => _activeFixture?.pairId === pairId,
  });
  _updateGroupStageVisibility(); // -1/stage 0 are both defaults that may never fire 'stage-change' on their own
  sidebar.updateStageTitle();
  // Re-affirms whatever _activeTab the earlier restore-or-default _switchTab call (see above)
  // already put the sidebar/eloMain into — not hardcoded to 'teams', since that call may have
  // restored 'tab-tournament' instead. setMode no-ops if already correct, so this is safe
  // either way, and still needed here: _renderEloBase (below) didn't exist yet when that
  // earlier call ran, so its own callbacks.renderElo?.() was a no-op at the time.
  sidebar.setMode(_activeTab === 'tab-tournament' ? 'tournament' : 'teams');
  _renderElo();
  sidebar.applyParams(new URLSearchParams(location.search));
  _expandPanel(_eloMetaPanel);
  sidebar.applyFlagFilter();
  sidebar.updateVisibleCountryCount();
  // Initial zoom: fit ALL flags so every country is visible (including Falklands etc.)
  const xs = [], ys = [];
  g.selectAll('.flag-qualified[data-elo-cat]').each(function() {
    const cx = +this.getAttribute('data-cx');
    const cy = +this.getAttribute('data-cy');
    if (isFinite(cx) && isFinite(cy)) { xs.push(cx); ys.push(cy); }
  });
  if (xs.length) {
    const [vbX, vbY, vbW, vbH] = svg.attr('viewBox').split(' ').map(Number);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 20;
    // Used to need extra left clearance here: the zoom-reset/zoom-span/theme-toggle stack
    // used to float directly over the map's bottom-left corner, and without it "fit
    // everything" could zoom in just far enough to tuck a flag right behind those buttons.
    // They're normal flex children of #map-controls now (wc2026_map.html, inside
    // #legend-parent, above the map rather than overlapping it), so a plain symmetric fit
    // has nothing left to avoid.
    const k = Math.max(1, Math.min(12, Math.min(vbW / (x1 - x0 + 2 * pad), vbH / (y1 - y0 + 2 * pad))));
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const tx = vbX + vbW / 2 - k * cx;
    const ty = vbY + vbH / 2 - k * cy;
    _initialTransform = d3.zoomIdentity.translate(tx, ty).scale(k);
    svg.call(zoom.transform, _initialTransform);
  }
  // Re-measure after reflow triggered by renderWorld + initial zoom
  requestAnimationFrame(() => {
    if (_pageHeader) document.documentElement.style.setProperty('--page-header-h', _computeHeaderHeight() + 'px');
    _syncPaddingTop();
    _syncMapHeight();
  });
});

// ── Legend + theme toggle ─────────────────────────────────────────────────────
// Gradient/ticks/outlier-count/born-text + theme-toggle swatch/click, and the
// onThemeChange registration for repainting all of that, now live in
// map-container.js's wireLegend() (shared with the chain page). legend.refresh() is
// called at the end of buildIndices() (below, once app.byId is populated). The
// map's own theme repaint (not the legend widget) stays a separate onThemeChange
// listener here. (The KDE-intensity legend swap that used to live here moved out along with the
// rest of that layer — see _updateAllPlayersMapLayer's own comment.)
const legend = wireLegend({ getById: () => app.byId });
onThemeChange(() => {
  g.selectAll('.country').attr('fill', function(d) { return choroFill(d._id ?? +d.id, app.byId); });
  g.selectAll('.standalone-dot').attr('fill', function() { return choroFill(+this.getAttribute('data-id'), app.byId); });
});

// ── Diverging scale debug panel (#diverging-debug, wc2026_map.html) ─────────
// Live-tunes map-container.js's _divergingParams via getDivergingParams()/
// setDivergingParams() — the latter already notifies onThemeChange()'s
// listener above (only when Violet is the active theme), so every input here
// just needs to call it; the repaint above happens for free.
{
  const _dbgDefaults = getDivergingParams();
  const _dbgEls = {
    neutral:      document.getElementById('dbg-neutral'),
    easyLeft:     document.getElementById('dbg-easy-left'),
    easyRight:    document.getElementById('dbg-easy-right'),
    outlierLeft:  document.getElementById('dbg-outlier-left'),
    outlierRight: document.getElementById('dbg-outlier-right'),
    algoLeft:     document.getElementById('dbg-algo-left'),
    algoRight:    document.getElementById('dbg-algo-right'),
    easeLeft:     document.getElementById('dbg-ease-left'),
    easeRight:    document.getElementById('dbg-ease-right'),
    floorLeft:    document.getElementById('dbg-floor-left'),
    floorRight:   document.getElementById('dbg-floor-right'),
  };
  const _dbgEaseLeftVal  = document.getElementById('dbg-ease-left-val');
  const _dbgEaseRightVal = document.getElementById('dbg-ease-right-val');
  const _dbgFloorLeftVal  = document.getElementById('dbg-floor-left-val');
  const _dbgFloorRightVal = document.getElementById('dbg-floor-right-val');
  const _dbgSync = params => {
    _dbgEls.neutral.value      = params.neutral;
    _dbgEls.easyLeft.value     = params.easyLeft;
    _dbgEls.easyRight.value    = params.easyRight;
    _dbgEls.outlierLeft.value  = params.outlierLeft;
    _dbgEls.outlierRight.value = params.outlierRight;
    _dbgEls.algoLeft.value     = params.algoLeft;
    _dbgEls.algoRight.value    = params.algoRight;
    _dbgEls.easeLeft.value     = params.easeLeft;
    _dbgEls.easeRight.value    = params.easeRight;
    _dbgEls.floorLeft.value    = params.floorLeft;
    _dbgEls.floorRight.value   = params.floorRight;
    _dbgEaseLeftVal.textContent  = params.easeLeft;
    _dbgEaseRightVal.textContent = params.easeRight;
    _dbgFloorLeftVal.textContent  = params.floorLeft;
    _dbgFloorRightVal.textContent = params.floorRight;
  };
  _dbgSync(_dbgDefaults);
  const _dbgApply = () => {
    const next = {
      neutral:      _dbgEls.neutral.value,
      easyLeft:     _dbgEls.easyLeft.value,
      easyRight:    _dbgEls.easyRight.value,
      outlierLeft:  _dbgEls.outlierLeft.value,
      outlierRight: _dbgEls.outlierRight.value,
      algoLeft:     _dbgEls.algoLeft.value,
      algoRight:    _dbgEls.algoRight.value,
      easeLeft:     +_dbgEls.easeLeft.value,
      easeRight:    +_dbgEls.easeRight.value,
      floorLeft:    +_dbgEls.floorLeft.value,
      floorRight:   +_dbgEls.floorRight.value,
    };
    setDivergingParams(next);
    _dbgEaseLeftVal.textContent  = _dbgEls.easeLeft.value;
    _dbgEaseRightVal.textContent = _dbgEls.easeRight.value;
    _dbgFloorLeftVal.textContent  = _dbgEls.floorLeft.value;
    _dbgFloorRightVal.textContent = _dbgEls.floorRight.value;
    // eslint-disable-next-line no-console
    console.log('[diverging-debug]', next);
  };
  Object.values(_dbgEls).forEach(el => el.addEventListener('input', _dbgApply));
  document.getElementById('dbg-reset').addEventListener('click', () => {
    setDivergingParams(_dbgDefaults);
    _dbgSync(_dbgDefaults);
    console.log('[diverging-debug] reset to', _dbgDefaults);
  });
}
