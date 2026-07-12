import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { unsafeHTML } from 'https://cdn.jsdelivr.net/npm/lit-html@3/directives/unsafe-html.js';
import { renderChain } from '../chains/wc2026_chain_render.js';
import { pillClasses, pillContent, pillStyle, initEloRanking } from './elo_ranking.js';
import { QUALIFIED_NAMES, QUALIFIED_BY_NAME, buildEloItems, buildImportByCountry, buildBracketState, buildMatchInfo, buildNameByIso2, loadEloData, playerDisplayName } from './qualified.js';
import { LOCALE, _LANG, T, countryName, wikiUrl, wikiUrlEn, loadWikiData } from './i18n.js';
import { initSidebar } from './control_sidebar.js';
import { CONF_BOUNDS } from './conf.js';
import { ISO2_REVERSE, iso2ForId, _NULL_CODE } from './iso2.js';
import { color, choroFill, divergingOutlierColor, getDivergingParams, setDivergingParams,
         themeName, currentTheme, themeNames, setTheme, onThemeChange,
         FLAG, FLAG_SIZE_ZOOM_EXP, FLAG_OFFSET_ZOOM_EXP, FLAG_CDN, FLAG_CDN_RECT,
         W, H } from './map-container.js';

const FOOTER_PANELS = {
  eloMeta:   false, // #elo-meta-panel — elo source/date meta
  selection: true,  // #selection-panel — capital/pop for active dim country
  chain:     true,  // #chain-panel — chain visualization
};

const RATIO_MIN = 0; // used by legend only

// Map infrastructure from <world-map> web component (defined in map-container.js)
const _wm       = document.querySelector('world-map');
const svg       = _wm.svg;
const projection = _wm.projection;
const path      = _wm.path;

let _worldTopo = null; // set once world-atlas JSON loads

// Single source of truth for the export/import color pair is css/taxonomy.css's :root-level
// --exp-accent/--imp-accent — also used by the elo-ranking pills' own ▶/◀ indicators, so the
// map's arcs and the pills read as the same concept instead of two independently-tuned blues/
// reds (see conversation: they used to be two hardcoded, drifting-apart pairs). Read once here
// rather than in drawArc() itself, which runs per-arc.
const _rootStyle = getComputedStyle(document.documentElement);
const ARC_EXPORT_COLOR = _rootStyle.getPropertyValue('--exp-accent').trim(); // blue
const ARC_IMPORT_COLOR = _rootStyle.getPropertyValue('--imp-accent').trim(); // red
const ARC_OFFSET = 1.0; // lateral separation: visual offset = sw * ARC_OFFSET / k
const ARC_MID_T  = 0.65; // arrow at 65% toward destination — separates bidirectional pairs along the arc

const arcOffset = (sw, sx, sy, tx, ty, k) => {
  const ddx = tx-sx, ddy = ty-sy, dist = Math.sqrt(ddx*ddx+ddy*ddy);
  const pnx = -ddy/dist, pny = ddx/dist;
  const off = sw * ARC_OFFSET / k;
  return {
    ofx: sx + pnx*off, ofy: sy + pny*off,
    otx: tx + pnx*off, oty: ty + pny*off,
    oqx: (sx+tx)/2 + pnx*off, oqy: (sy+ty)/2 - dist*0.3 + pny*off,
  };
};

const arrowPoints = (sw, ofx, ofy, otx, oty, oqx, oqy, k) => {
  const mt = ARC_MID_T, ms = 1 - mt;
  const mx = ms*ms*ofx + 2*ms*mt*oqx + mt*mt*otx;
  const my = ms*ms*ofy + 2*ms*mt*oqy + mt*mt*oty;
  const tdx = 2*ms*(oqx-ofx) + 2*mt*(otx-oqx);
  const tdy = 2*ms*(oqy-ofy) + 2*mt*(oty-oqy);
  const tLen = Math.sqrt(tdx*tdx+tdy*tdy);
  const mux = tdx/tLen, muy = tdy/tLen, mnx = -muy, mny = mux;
  const mah = Math.sqrt(sw)*5/k, maw = Math.sqrt(sw)*2.5/k;
  const bx = mx-mux*mah/2, by = my-muy*mah/2;
  return `${mx+mux*mah/2},${my+muy*mah/2} ${bx+mnx*maw},${by+mny*maw} ${bx-mnx*maw},${by-mny*maw}`;
};

const g = _wm.g;
const tt = document.getElementById('tooltip');
let lastTipKey = null;
const hideTip = () => { tt.style.display = 'none'; tt.classList.remove('tt-non-qualified'); lastTipKey = null; };


// Fixes arc endpoint when path.centroid() lands outside the country polygon.
const CENTROID_OVERRIDE = {
  250:  [2.5,  46.5],   // France (without overseas territories)
  840:  [-98,  38],     // USA (without Alaska/Hawaii)
  8261: [-4.2, 56.8],  // Scotland (centroid pulled north by islands)
  191:  [16.8, 45.8],  // Croatia (coastal strip drags centroid south into Bosnia)
};

// Visual flag position — overrides where the flag icon is drawn (data-cx/data-cy + x/y).
// Arcs still connect to the geographic centroid (via CENTROID_OVERRIDE / dotCentroid).
const FLAG_POS_OVERRIDE = {
  191: [16.8, 45.8],    // Croatia — flag placed in Slavonia, away from the coastal strip
};

const dotCentroid = d => {
  const ov = CENTROID_OVERRIDE[+d.id];
  return ov ? projection(ov) : path.centroid(d);
};

svg.on('click', () => { clearDim(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') clearDim(); });

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
  g.selectAll('path.arc-line')
    .attr('stroke-width', function() { return +this.getAttribute('data-sw') / k; })
    .attr('d', function() {
      const sw = +this.getAttribute('data-sw');
      const sx = +this.getAttribute('data-sx'), sy = +this.getAttribute('data-sy');
      const tx = +this.getAttribute('data-tx'), ty = +this.getAttribute('data-ty');
      const {ofx,ofy,otx,oty,oqx,oqy} = arcOffset(sw, sx, sy, tx, ty, k);
      return `M${ofx},${ofy} Q${oqx},${oqy} ${otx},${oty}`;
    });
  g.selectAll('polygon.arc-mid').attr('points', function() {
    const sw = +this.getAttribute('data-sw');
    const sx = +this.getAttribute('data-sx'), sy = +this.getAttribute('data-sy');
    const tx = +this.getAttribute('data-tx'), ty = +this.getAttribute('data-ty');
    const {ofx,ofy,otx,oty,oqx,oqy} = arcOffset(sw, sx, sy, tx, ty, k);
    return arrowPoints(sw, ofx, ofy, otx, oty, oqx, oqy, k);
  });
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

// Null-ID birth countries → numeric topojson ID (for centroid lookup and flag dimming)
const _NULL_CENTROID_ID = { 'Democratic Republic of the Congo': 180, 'U.S.': 840, 'Kingdom of the Netherlands': 528 };



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
const _themeToggleBtn = document.getElementById('theme-toggle');
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
  _zoomToLinkedFlags();
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
render(html`<p class="py-4 text-center sub fst-italic">${T.tabPlayersHint}</p>`, document.getElementById('tab-players'));

// Chain tab: load data lazily, render when tab is shown, re-render on resize
// Both callbacks reference symbols defined later in the module — safe because they
// are only invoked on user interaction, after the module has fully loaded.
const _chainOnClick    = node => {
  const id = ISO2_REVERSE[node.code];
  if (dimState.sourceId === id) { clearDim(); return; }
  activateCountry(id); _zoomToActiveDimFlags(); requestAnimationFrame(() => _chainUpdate?.scrollActive());
};
const _chainGetIndex   = () => {
  if (!_chainData || dimState.sourceId == null) return -1;
  return _chainData.nodes.findIndex(n => ISO2_REVERSE[n.code] === dimState.sourceId);
};
let _chainData = null, _chainUpdate = null;
const _chainVariants = {}; // {both, fwd, bwd}
let _chainMode = 'both';

/* ── Accordion state persistence ─────────────────────────────────────────────
   Bootstrap's Collapse instances get confused across lit-html renders.
   We own the state: save before every render, restore after. */
const _accState = Object.assign({ exp: true, nat: true, imp: true },
  JSON.parse(localStorage.getItem('accState') ?? '{}'));
const _saveAccState = ptEl => {
  ['exp','nat','imp'].forEach(k => {
    const el = ptEl?.querySelector(`#acc-${k}`);
    if (el) _accState[k] = el.classList.contains('show');
  });
  localStorage.setItem('accState', JSON.stringify(_accState));
};
const _ACC_ID = { 'acc-exp': 'exp', 'acc-nat': 'nat', 'acc-imp': 'imp' };
document.addEventListener('shown.bs.collapse',  e => { const k = _ACC_ID[e.target.id]; if (k) { _accState[k] = true;  localStorage.setItem('accState', JSON.stringify(_accState)); } });
document.addEventListener('hidden.bs.collapse', e => { const k = _ACC_ID[e.target.id]; if (k) { _accState[k] = false; localStorage.setItem('accState', JSON.stringify(_accState)); } });

const _restoreAccState = ptEl => ['exp','nat','imp'].forEach(k => {
  const pane = ptEl?.querySelector(`#acc-${k}`);
  const btn  = ptEl?.querySelector(`[data-bs-target="#acc-${k}"]`);
  if (!pane || !btn) return;
  if (_accState[k]) {
    pane.classList.add('show');
    btn.classList.remove('collapsed');
    btn.setAttribute('aria-expanded', 'true');
  } else {
    pane.classList.remove('show');
    btn.classList.add('collapsed');
    btn.setAttribute('aria-expanded', 'false');
  }
});
// Lazy lookup: player name → {href, fallback} drawn from loaded app data.
// fallback=true means current-language URL absent, using English fallback (renders as "Name (en)").
const _chainWikiUrl = name => {
  for (const rec of Object.values(app.byId)) {
    const p = (rec.players ?? []).find(q => q.name === name);
    if (!p) continue;
    const url = wikiUrl(p.pid);
    if (url) return { href: url, fallback: false };
    const en = wikiUrlEn(p.pid);
    if (en) return { href: en, fallback: true };
  }
  return null;
};
const _renderChain = () => {
  if (!_chainData) return;
  let chainContent = document.getElementById('chain-content');
  if (!chainContent) {
    chainContent = document.createElement('div');
    chainContent.id = 'chain-content';
    document.getElementById('tab-chain').appendChild(chainContent);
  }
  _chainUpdate = renderChain(_chainData, chainContent, {
    onCountryClick:   _chainOnClick,
    getSelectedIndex: _chainGetIndex,
    getPlayerWikiUrl: _chainWikiUrl,
    labels:           { ...T.chainLegend, subtitle: T.chainSubtitle },
    headerContainer:  document.getElementById('chain-panel'),
  });
};
// On selection change: surgical update only — no SVG rebuild, no flicker.
const _updateChainSelection = () => {
  if (_chainUpdate && !document.getElementById('tab-chain')?.hidden)
    _chainUpdate(_chainGetIndex());
};
const _chainToggleHtml = `<div class="d-flex justify-content-center gap-1 py-2" id="chain-mode-toggle">
  <button class="chain-mode-btn" data-mode="bwd" title="Import direction">← import</button>
  <button class="chain-mode-btn active" data-mode="both" title="Both directions">both</button>
  <button class="chain-mode-btn" data-mode="fwd" title="Export direction">export →</button>
</div>`;
const _switchChainMode = (mode) => {
  if (!_chainVariants[mode]) return;
  _chainMode = mode;
  _chainData = _chainVariants[mode];
  document.querySelectorAll('#chain-mode-toggle .chain-mode-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.mode === mode);
  });
  _renderChain();
};
Promise.all([
  fetch('./chains/subgraphs/longest_both.json').then(r => r.json()),
  fetch('./chains/subgraphs/longest_fwd.json').then(r => r.json()),
  fetch('./chains/subgraphs/longest_bwd.json').then(r => r.json()),
]).then(([both, fwd, bwd]) => {
  _chainVariants.both = both;
  _chainVariants.fwd = fwd;
  _chainVariants.bwd = bwd;
  _chainData = both;
  const tab = document.getElementById('tab-chain');
  tab.insertAdjacentHTML('afterbegin', _chainToggleHtml);
  tab.querySelectorAll('.chain-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => _switchChainMode(btn.dataset.mode));
  });
  if (!tab.hidden) _renderChain();
});

// Elo ranking tab — two-column layout: ranking list (flex:1) + collapsible sidebar
let _eloData   = null;
const _fifaMemberIds = new Set();
render(html`<div class="elo-layout"><elo-ranking class="elo-main"></elo-ranking></div>`, document.getElementById('tab-elo'));
const _eloMain = document.querySelector('#tab-elo elo-ranking');
const _eloMetaPanel = FOOTER_PANELS.eloMeta ? document.getElementById('elo-meta-panel') : null;
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
  const el = document.querySelector('#tab-elo .elo-item--active');
  if (el && !_isFullyVisible(el)) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
};

// padding-top = bottom edge of fixed map container (exact, no formula needed)
const _mc = document.getElementById('map-container');
const _landscapeMQ = window.matchMedia('(max-height: 500px) and (orientation: landscape)');
const _isLandscapeMobile = () => _landscapeMQ.matches;
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
const _syncMapHeight = () => {
  const svgEl = document.getElementById('map');
  requestAnimationFrame(() => {
    _syncPaddingTop();
    const svgRect = svgEl.getBoundingClientRect();
    const mcRect  = _mc.getBoundingClientRect();
    const fromLeft   = svgRect.left  - mcRect.left;
    const fromBottom = mcRect.bottom - svgRect.bottom;
    const resetH = _zoomResetBtn?.offsetHeight ?? 26;
    const spanH  = _zoomSpanBtn?.offsetHeight  ?? 26;
    const themeH = _themeToggleBtn?.offsetHeight ?? 26;
    // Stacked bottom-up in the SVG's bottom-left corner (8px inset), so reading top-to-bottom
    // still goes reset → span → theme, same order the right-side vertically-centered stack
    // used before.
    if (_themeToggleBtn) {
      _themeToggleBtn.style.left   = (fromLeft + 8) + 'px';
      _themeToggleBtn.style.bottom = (fromBottom + 8) + 'px';
    }
    if (_zoomSpanBtn) {
      _zoomSpanBtn.style.left   = (fromLeft + 8) + 'px';
      _zoomSpanBtn.style.bottom = (fromBottom + 8 + themeH + 4) + 'px';
    }
    if (_zoomResetBtn) {
      _zoomResetBtn.style.left   = (fromLeft + 8) + 'px';
      _zoomResetBtn.style.bottom = (fromBottom + 8 + themeH + 4 + spanH + 4) + 'px';
    }
    if (_zoomHintEl) {
      _zoomHintEl.style.left      = (svgRect.right - mcRect.left) + 'px';
      _zoomHintEl.style.bottom    = fromBottom + 'px';
      _zoomHintEl.style.maxHeight = svgRect.height + 'px';
    }
  });
};
if (_bottomPanel) new ResizeObserver(() => {
  if (!_isLandscapeMobile()) document.body.style.paddingBottom = _bottomPanel.offsetHeight + 'px';
  _syncMapHeight();
}).observe(_bottomPanel);
_syncMapHeight();

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

// For MultiPolygon features (France, Russia, USA…), path.bounds() spans all territories
// including overseas ones. Use only the largest sub-polygon by projected bbox area.
const _mainlandBounds = feature => {
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

const _zoomToLinkedFlags = () => {
  let srcX, srcY;
  g.selectAll(`.flag-qualified[data-id="${dimState.sourceId}"]`).each(function() {
    const cx = +this.getAttribute('data-cx'), cy = +this.getAttribute('data-cy');
    if (isFinite(cx) && isFinite(cy)) { srcX = cx; srcY = cy; }
  });
  if (srcX == null) return;
  const xs = [srcX], ys = [srcY];
  g.selectAll('.flag-qualified[data-dim-visible]').each(function() {
    const cx = +this.getAttribute('data-cx'), cy = +this.getAttribute('data-cy');
    if (isFinite(cx) && isFinite(cy)) { xs.push(cx); ys.push(cy); }
  });
  const [vbX, vbY, vbW, vbH] = svg.attr('viewBox').split(' ').map(Number);
  if (xs.length > 1) {
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 20;
    const k = Math.max(1, Math.min(9, Math.min(vbW / (x1 - x0 + 2 * pad), vbH / (y1 - y0 + 2 * pad))));
    svg.transition().duration(1500).call(zoom.transform, d3.zoomIdentity.translate(vbX + vbW / 2 - k * (x0 + x1) / 2, vbY + vbH / 2 - k * (y0 + y1) / 2).scale(k));
  } else {
    const k2 = 9;
    svg.transition().duration(1500).call(zoom.transform, d3.zoomIdentity.translate(vbX + vbW / 2 - k2 * srcX, vbY + vbH / 2 - k2 * srcY).scale(k2));
  }
};

const zoomToCentroid = (id, duration = 2000) => {
  const c = centroids[id];
  if (!c) return;
  const [cx, cy] = c;
  const [vbX, vbY, vbW, vbH] = svg.attr('viewBox').split(' ').map(Number);
  const feature = _worldFeatures?.find(f => +f.id === id) ?? _ukFeatures?.find(f => +f._id === id);
  let k = 15, tx, ty;
  if (feature) {
    try {
      const [[bx0, by0], [bx1, by1]] = _mainlandBounds(feature);
      const bw = bx1 - bx0, bh = by1 - by0;
      if (bw > 0 && bh > 0) {
        const pad = 10;
        k = Math.max(1, Math.min(vbW / (bw + 2 * pad), vbH / (bh + 2 * pad)));
        tx = vbX + vbW / 2 - k * (bx0 + bx1) / 2;
        ty = vbY + vbH / 2 - k * (by0 + by1) / 2;
      }
    } catch(e) { /* fall through */ }
  }
  if (tx == null) { tx = vbX + vbW / 2 - k * cx; ty = vbY + vbH / 2 - k * cy; }
  svg.transition().duration(duration).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(k));
};

const _renderElo = (onAnimationDone) => {
  if (!_renderEloBase) return;
  _renderEloBase(onAnimationDone);
  if (dimState.sourceId) _eloMain.update(dimState.sourceId);
};
const _updateEloSelection = () => {
  if (_eloMain.hasItems && !document.getElementById('tab-elo')?.hidden)
    _eloMain.update(dimState.sourceId);
};

const _tabIndicator = document.getElementById('tab-indicator');
const _tabNav = document.getElementById('bottomTabList');
const _positionIndicator = (animate = true) => {
  const active = _tabNav.querySelector('.nav-link.active');
  if (!active || !_tabIndicator) return;
  if (!animate) _tabIndicator.style.transition = 'none';
  const pill = active.querySelector('.elo-item');
  const target = pill || active;
  const navRect = _tabNav.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  _tabIndicator.style.left = (targetRect.left - navRect.left) + 'px';
  _tabIndicator.style.width = targetRect.width + 'px';
  if (!animate) requestAnimationFrame(() => { _tabIndicator.style.transition = ''; });
};
_positionIndicator(false);

const _switchTab = name => {
  document.querySelectorAll('#bottomTabList button[data-tab]').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === name);
  });
  _positionIndicator();
  document.querySelectorAll('#bottomTabContent > [id]').forEach(pane => {
    pane.hidden = pane.id !== name;
  });
  if (name === 'tab-chain') {
    if (_chainData) {
      _renderChain();
      requestAnimationFrame(() => _chainUpdate?.scrollActive());
    }
    _expandPanel(_chainPanelEl);
  } else {
    _collapsePanel(_chainPanelEl);
  }
  if (name === 'tab-elo') {
    _expandPanel(_eloMetaPanel);
  } else {
    _collapsePanel(_eloMetaPanel);
  }
  if (name === 'tab-elo') {
    _renderElo();
    _eloMain.update(dimState.sourceId);
    _scrollToActiveElo();
  }
};
document.querySelectorAll('#bottomTabList button[data-tab]').forEach(btn => {
  if (btn.id === 'tab-players-btn') return;
  btn.addEventListener('click', () => _switchTab(btn.dataset.tab));
});

// ── Swipe between tabs on mobile ──
{
  const _tabContent = document.getElementById('bottomTabContent');
  const _TAB_IDS = ['tab-elo', 'tab-players', 'tab-chain'];
  const _availableTabs = () => _TAB_IDS.filter(id => {
    if (id === 'tab-players') return document.getElementById('tab-players-btn')?.classList.contains('dim-selected');
    return true;
  });
  const _btnRect = id => {
    const btn = document.getElementById(id + '-btn');
    if (!btn) return null;
    const pill = btn.querySelector('.elo-item');
    return (pill || btn).getBoundingClientRect();
  };
  let _swipeX0 = null, _swipeCurIdx = -1, _swipeAvail = [], _swipeOrigin = null;
  _tabContent.addEventListener('touchstart', e => {
    if (!_isLandscapeMobile()) return;
    _swipeX0 = e.touches[0].clientX;
    _swipeAvail = _availableTabs();
    const activeTab = _tabNav.querySelector('.nav-link.active')?.dataset.tab;
    _swipeCurIdx = _swipeAvail.indexOf(activeTab);
    _swipeOrigin = _swipeCurIdx >= 0 ? _btnRect(_swipeAvail[_swipeCurIdx]) : null;
  }, { passive: true });
  _tabContent.addEventListener('touchmove', e => {
    if (!_isLandscapeMobile()) return;
    if (_swipeX0 == null || _swipeCurIdx < 0 || !_swipeOrigin) return;
    const dx = e.touches[0].clientX - _swipeX0;
    const dir = dx < 0 ? 1 : -1;
    const targetIdx = _swipeCurIdx + dir;
    if (targetIdx < 0 || targetIdx >= _swipeAvail.length) return;
    const targetRect = _btnRect(_swipeAvail[targetIdx]);
    if (!targetRect) return;
    const navRect = _tabNav.getBoundingClientRect();
    const t = Math.min(1, Math.abs(dx) / 80);
    const fromL = _swipeOrigin.left - navRect.left, fromW = _swipeOrigin.width;
    const toL = targetRect.left - navRect.left, toW = targetRect.width;
    _tabIndicator.style.transition = 'none';
    _tabIndicator.style.left = (fromL + (toL - fromL) * t) + 'px';
    _tabIndicator.style.width = (fromW + (toW - fromW) * t) + 'px';
  }, { passive: true });
  _tabContent.addEventListener('touchend', e => {
    if (!_isLandscapeMobile()) return;
    if (_swipeX0 == null) return;
    const dx = e.changedTouches[0].clientX - _swipeX0;
    _swipeX0 = null;
    _tabIndicator.style.transition = '';
    if (Math.abs(dx) < 50 || _swipeCurIdx < 0) { _positionIndicator(); return; }
    const next = _swipeCurIdx + (dx < 0 ? 1 : -1);
    if (next >= 0 && next < _swipeAvail.length) _switchTab(_swipeAvail[next]);
    else _positionIndicator();
  }, { passive: true });
}

let _chainResizeTimer = null;
window.addEventListener('resize', () => {
  _syncMapHeight();
  sidebar.measureControlSidebar();
  _positionIndicator(false);
  clearTimeout(_chainResizeTimer);
  _chainResizeTimer = setTimeout(() => {
    if (_chainData && !document.getElementById('tab-chain')?.hidden) _renderChain();
  }, 150);
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
const app = {
  byId: {},
  importByCountry: {},
  nativeByCountry: {},
  pop: {},
  eloRank: {},
};
const centroids = {};
const _blendedInsets = []; // per-tick update fns for buildBlendedInset() countries (see below)

const _sidebarCallbacks = {};
const sidebar = initSidebar({ T, QUALIFIED_NAMES, app, fifaMemberIds: _fifaMemberIds, eloMain: _eloMain, callbacks: _sidebarCallbacks });
_sidebarCallbacks.renderElo = _renderElo;
_sidebarCallbacks.scrollToActiveElo = _scrollToActiveElo;
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
const countryPillTemplate = id => {
  const item = _eloItemsById.get(id);
  if (!item) return nothing;
  return html`<span class="${pillClasses(item)}" style="${pillStyle(item)}">${pillContent({ ...item, pts: null })}</span>`;
};

const fmtPop = pop => parseFloat(pop.toFixed(2))
  .toLocaleString(LOCALE, { maximumFractionDigits: 2, minimumFractionDigits: 2, useGrouping: false }) + 'M';
const popTag  = pop  => pop  ? html`<span class="tt-pop fw-normal text-nowrap">${fmtPop(pop)}</span>` : nothing;
const capTag  = cap  => { const c = cap?.[_LANG] ?? cap?.en ?? null; return c ? html`<span class="tt-pop fw-normal text-nowrap">${c}</span>` : nothing; };
const _expandPanel = panel => {
  if (!panel || !panel.classList.contains('collapsed')) return;
  panel.classList.remove('collapsed');
  panel.style.maxHeight = '0';
  panel.getBoundingClientRect();
  panel.style.maxHeight = panel.scrollHeight + 'px';
  panel.addEventListener('transitionend', () => { panel.style.maxHeight = ''; }, { once: true });
};
const _collapsePanel = (panel, onDone) => {
  if (!panel || panel.classList.contains('collapsed')) return;
  panel.style.maxHeight = panel.scrollHeight + 'px';
  panel.getBoundingClientRect();
  panel.style.maxHeight = '0';
  panel.addEventListener('transitionend', () => {
    panel.style.maxHeight = '';
    panel.classList.add('collapsed');
    if (onDone) onDone();
  }, { once: true });
};

const _selectionPanelEl = FOOTER_PANELS.selection ? document.getElementById('selection-panel') : null;
const _chainPanelEl     = FOOTER_PANELS.chain     ? document.getElementById('chain-panel')     : null;
const _updateSelectionPanel = (onCollapsed) => {
  if (!_selectionPanelEl) return;
  const id = dimState.sourceId;
  if (!id) {
    _collapsePanel(_selectionPanelEl, () => { render(nothing, _selectionPanelEl); if (onCollapsed) onCollapsed(); });
    return;
  }
  const fc = iso2ForId(id);
  const pop    = app.pop?.[fc];
  const capObj = app.capital?.[fc];
  const capText = capObj?.[_LANG] ?? capObj?.en ?? null;
  render(html`<div class="d-flex justify-content-center align-items-center gap-4 pt-1  sub">
    ${pop     ? html`<span>${fmtPop(pop)}</span>`  : nothing}
    ${capText ? html`<span>${capText}</span>`       : nothing}
  </div>`, _selectionPanelEl);
  _expandPanel(_selectionPanelEl);
};
const rankTag = name => { const r = app.eloRank[name]; return r ? html`<span class="tt-rank fw-normal text-nowrap">Elo #${r}</span>` : nothing; };
const flagImg = code => code ? html`<img class="tt-flag rounded-circle flex-shrink-0" src="${FLAG_CDN(code)}">` : nothing;
const coachBadge = p => p.role === 'coach' ? html`<span class="coach-badge">${T.coach}</span>` : nothing;
const ptWikiRow = p => {
  const url    = wikiUrl(p.pid);
  const wikiEn = wikiUrlEn(p.pid);
  const badge  = coachBadge(p);
  const dName  = playerDisplayName(p);
  return url    ? html`<a href="${url}" target="_blank" rel="noopener" class="pt-wiki text-decoration-none">${dName}</a>${badge}`
       : wikiEn ? html`${dName} (<a href="${wikiEn}" target="_blank" rel="noopener" class="pt-wiki text-decoration-none">en</a>)${badge}`
       : html`${dName}${badge}`;
};

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

const playerTableTemplate = sourceId => {
  const country       = app.byId[sourceId]?.country ?? QUALIFIED_NAMES[sourceId];
  const cnt           = app.byId[sourceId]?.count ?? 0;
  const exportPlayers = app.byId[sourceId]?.players ?? [];
  const nativePlayers = app.nativeByCountry[sourceId] ?? [];
  const importPlayers = (app.importByCountry[sourceId] ?? []).slice().sort((a, b) => b.caps - a.caps);
  const isQualified   = !!QUALIFIED_NAMES[sourceId];
  const name          = countryName(sourceId, country);

  const exportGroupMap = new Map();
  exportPlayers.forEach(p => {
    if (!exportGroupMap.has(p.nation))
      exportGroupMap.set(p.nation, { nation: p.nation, players: [] });
    exportGroupMap.get(p.nation).players.push(p);
  });
  const exportGroups = [...exportGroupMap.values()].sort((a, b) => b.players.length - a.players.length);

  const importGroupMap = new Map();
  importPlayers.forEach(p => {
    const label = countryName(p.birthCountryId, p.birthCountry);
    if (!importGroupMap.has(label))
      importGroupMap.set(label, { label, birthCountryId: p.birthCountryId, birthCountry: p.birthCountry, players: [] });
    importGroupMap.get(label).players.push(p);
  });
  const importGroups = [...importGroupMap.values()].sort((a, b) => b.players.length - a.players.length);

  const staticHdr = content => html`<div class="accordion-button pt-acc-btn pt-acc-static">${content}</div>`;
  const toggleHdr = (id, content) => html`
    <button class="accordion-button pt-acc-btn" type="button"
      data-bs-toggle="collapse" data-bs-target="#acc-${id}"
      aria-expanded="true" aria-controls="acc-${id}">${content}</button>`;

  let exportHeader;
  if (cnt > 0) {
    exportHeader = toggleHdr('exp', html`<span class="pt-title color-exp">${cnt} ${T.exported(cnt, name)} ${T.selectedBy(cnt)}</span>`);
  } else {
    exportHeader = staticHdr(html`<span class="pt-title color-exp">${T.noExport(name)}</span>`);
  }

  return html`
    <div class="accordion accordion-flush mt-2" id="pt-acc">

      <div class="accordion-item">
        <h2 class="accordion-header">
          ${exportHeader}
        </h2>
        ${cnt > 0 ? html`
        <div id="acc-exp" class="accordion-collapse collapse">
          <div class="accordion-body px-0 pt-1">
            ${exportGroups.map(({ nation, players: gp }) => {
              const destId = QUALIFIED_BY_NAME[nation];
              const nc = iso2ForId(destId);
              return html`
                <div class="pt-country-header d-flex align-items-center" @click=${() => { activateCountry(destId, true); _zoomToActiveDimFlags(); }}>
                  ${nc ? html`<img src="${FLAG_CDN_RECT(nc)}">` : nothing}
                  <span class="pt-country-name fw-medium">${countryName(destId, nation)}</span>
                  <span class="pt-country-count">${gp.length} ${T.players(gp.length)}</span>
                </div>
                ${gp.map(p => html`
                  <div class="pt-player-row d-flex justify-content-between align-items-center">
                    <span>${ptWikiRow(p)}</span>
                    <span class="pt-caps text-nowrap">${p.role === 'coach' ? T.coach : html`${p.caps} ${T.caps}`}</span>
                  </div>`)}`;
            })}
          </div>
        </div>` : nothing}
      </div>

      <div class="accordion-item">
        <h2 class="accordion-header">
          ${nativePlayers.length > 0
            ? toggleHdr('nat', html`<span class="pt-title">${nativePlayers.length} ${T.ptNative(nativePlayers.length, name)}</span>`)
            : staticHdr(html`<span class="pt-title">${'n/a'}</span>`)}
        </h2>
        ${nativePlayers.length > 0 ? html`
        <div id="acc-nat" class="accordion-collapse collapse">
          <div class="accordion-body px-0 pt-1">
            ${nativePlayers.map(p => html`
              <div class="pt-player-row d-flex justify-content-between align-items-center">
                <span>${ptWikiRow(p)}</span>
                <span class="pt-caps text-nowrap">${p.role === 'coach' ? T.coach : html`${p.caps} ${T.caps}`}</span>
              </div>`)}
          </div>
        </div>` : nothing}
      </div>

      <div class="accordion-item">
        <h2 class="accordion-header">
          ${importPlayers.length > 0
            ? toggleHdr('imp', html`<span class="pt-title color-imp">${importPlayers.length} ${T.ptImportTitle(importPlayers.length, name)}</span>`)
            : staticHdr(html`<span class="pt-title color-imp">${isQualified ? T.noImport(name) : 'n/a'}</span>`)}
        </h2>
        ${importPlayers.length > 0 ? html`
        <div id="acc-imp" class="accordion-collapse collapse">
          <div class="accordion-body px-0 pt-1">
            ${importGroups.map(({ label, birthCountryId, birthCountry, players: gp }) => {
              const bc = birthCountryId != null ? iso2ForId(birthCountryId) : (_NULL_CODE[birthCountry] ?? null);
              const clickId = birthCountryId ?? _NULL_CENTROID_ID[birthCountry] ?? null;
              return html`
                <div class="pt-country-header d-flex align-items-center${clickId != null ? ' pt-country-clickable' : ''}" @click=${clickId != null ? () => { activateCountry(clickId, true); _zoomToActiveDimFlags(); } : null}>
                  ${bc ? html`<img src="${FLAG_CDN_RECT(bc)}">` : nothing}
                  <span class="pt-country-name fw-medium">${label}</span>
                  <span class="pt-country-count">${gp.length} ${T.players(gp.length)}</span>
                </div>
                ${gp.map(p => html`
                  <div class="pt-player-row d-flex justify-content-between align-items-center">
                    <span>${ptWikiRow(p)}</span>
                    <span class="pt-caps text-nowrap">${p.role === 'coach' ? T.coach : html`${p.caps} ${T.caps}`}</span>
                  </div>`)}`;
            })}
          </div>
        </div>` : nothing}
      </div>

    </div>`;
};

const applyDim = (sourceId, destIds) => {
  dimState.destIds = destIds;

  // Build import ids: birth countries Y whose players represent country sourceId
  dimState.importIds = new Map();
  (app.importByCountry[sourceId] ?? []).forEach(p => {
    const cId = p.birthCountryId != null ? p.birthCountryId : (_NULL_CENTROID_ID[p.birthCountry] ?? null);
    if (cId == null) return;
    dimState.importIds.set(cId, (dimState.importIds.get(cId) ?? 0) + 1);
  });

  // Flag opacity + data-dim-visible for cursor/click control
  const dimVisibleIds = new Set([...destIds.keys(), ...dimState.importIds.keys()]);
  g.selectAll('.flag-qualified').each(function() {
    const id = +this.getAttribute('data-id');
    const isExport = destIds.has(id);
    const isImport = dimState.importIds.has(id);
    const visible = id === sourceId || isExport || isImport;
    d3.select(this)
      .attr('opacity', visible ? 1 : 0.35)
      .attr('data-dim-visible', (isExport || isImport) ? '' : null);
  });
  g.selectAll('.country').attr('data-dim-visible', function(d) {
    const id = d._id ?? +d.id;
    return dimVisibleIds.has(id) ? '' : null;
  });

  // Arc drawing helper — smooth quadratic Bézier, laterally offset by type, mid arrowhead
  const drawArc = (from, to, count, type) => {
    const color = type === 'export' ? ARC_EXPORT_COLOR : ARC_IMPORT_COLOR;
    const sw = Math.max(1, Math.sqrt(count));
    const {ofx, ofy, otx, oty, oqx, oqy} = arcOffset(sw, from[0], from[1], to[0], to[1], dimState.k);

    dimState.arcsGroup.append('path')
      .attr('class', 'arc-line')
      .attr('d', `M${ofx},${ofy} Q${oqx},${oqy} ${otx},${oty}`)
      .attr('fill', 'none').attr('stroke', color)
      .attr('stroke-width', sw/dimState.k).attr('opacity', 0.7)
      .attr('data-sw', sw)
      .attr('data-sx', from[0]).attr('data-sy', from[1])
      .attr('data-tx', to[0]).attr('data-ty', to[1]);

    dimState.arcsGroup.append('polygon')
      .attr('class', 'arc-line arc-mid')
      .attr('points', arrowPoints(sw, ofx, ofy, otx, oty, oqx, oqy, dimState.k))
      .attr('fill', color).attr('opacity', 0.8)
      .attr('data-sw', sw)
      .attr('data-sx', from[0]).attr('data-sy', from[1])
      .attr('data-tx', to[0]).attr('data-ty', to[1]);
  };

  if (dimState.arcsGroup) {
    dimState.arcsGroup.selectAll('.arc-line').remove();
    const src = centroids[sourceId];
    if (src) {
      destIds.forEach((count, destId) => {
        const dst = centroids[destId];
        if (dst) drawArc(src, dst, count, 'export');
      });
      dimState.importIds.forEach((count, birthId) => {
        if (birthId === sourceId) return;
        const ySrc = centroids[birthId];
        if (ySrc) drawArc(ySrc, src, count, 'import');
      });
    }
  }

  g.selectAll('.flag-qualified').raise();
  g.selectAll('.flag-qualified').filter(function() {
    return +this.getAttribute('data-id') === sourceId;
  }).raise();
};

const applyEmpty = id => {
  dimState.destIds  = new Map();
  dimState.importIds = new Map();
  g.selectAll('.flag-qualified').attr('opacity', null).attr('data-dim-visible', null);
  g.selectAll('.country').attr('data-dim-visible', null);
  if (dimState.arcsGroup) dimState.arcsGroup.selectAll('.arc-line,.arc-arrow').remove();
};

const applySelection = (id, destIds) => {
  dimState.active = true;
  dimState.sourceId = id;
  if (_zoomSpanBtn) _zoomSpanBtn.disabled = !centroids[id];

  if (centroids[id]) {
    applyDim(id, destIds);
  } else {
    applyEmpty(id);
  }

  // Player table
  const ptEl = document.getElementById('tab-players');
  if (ptEl) {
    _saveAccState(ptEl);
    render(playerTableTemplate(id), ptEl);
    _restoreAccState(ptEl);
    if (document.getElementById('tab-chain')?.hidden !== false)
      window.scrollTo({ top: 0 });
  }

  // Tab button pill + close
  const _playersBtn = document.getElementById('tab-players-btn');
  if (_playersBtn) {
    const wasActive = _playersBtn.classList.contains('active');
    _playersBtn.className = 'nav-link dim-selected taxonomy' + (wasActive ? ' active' : '');
    const _closeStyle = 'font-size:0.45rem;align-self:flex-start';
    render(html`
      <span class="btn-close" style="visibility:hidden;${_closeStyle}" aria-label=""></span>
      <span @click=${() => _switchTab('tab-players')}>${countryPillTemplate(id)}</span>
      <span class="btn-close" style="cursor:pointer;${_closeStyle}" aria-label="Close"
            @click=${() => clearDim()}></span>
    `, _playersBtn);
    requestAnimationFrame(() => _positionIndicator());
  }

  _updateChainSelection();
  _updateEloSelection();
  _updateSelectionPanel();
  document.body.classList.add('dim-active');
};

const clearDim = () => {
  dimState.active = false;
  if (_zoomSpanBtn) _zoomSpanBtn.disabled = true;
  dimState.sourceId = null;
  dimState.destIds = new Map();
  dimState.importIds = new Map();
  g.selectAll('.flag-qualified').attr('opacity', null).attr('data-dim-visible', null);
  g.selectAll('.country').attr('data-dim-visible', null);
  if (dimState.arcsGroup) dimState.arcsGroup.selectAll('.arc-line').remove();
  document.body.classList.remove('dim-active');
  const _ptEl = document.getElementById('tab-players');
  if (_ptEl) {
    _saveAccState(_ptEl);
    render(html`<p class="py-4 text-center sub fst-italic">${T.tabPlayersHint}</p>`, _ptEl);
  }
  _updateSelectionPanel(() => {
    const _pb = document.getElementById('tab-players-btn');
    if (_pb) { render(nothing, _pb); _pb.className = 'nav-link'; }
    requestAnimationFrame(() => _positionIndicator(false));
  });
  _updateChainSelection();
  _updateEloSelection();
  _updateSelectionPanel();
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

// ── Flag join helpers ─────────────────────────────────────────────────────────
const placeFlag = (sel) => {
  sel.attr('class','flag-qualified')
    .attr('width', FLAG).attr('height', FLAG)
    .on('mouseleave', () => { if (!dimState.active) { hideTip(); } });
};

// ── Main render ───────────────────────────────────────────────────────────────
// GU_A3 code (Natural Earth) → synthetic country ID
const UK_GU_TO_ID = {ENG: 8260, SCT: 8261, WLS: 8262, NIR: 8263};

// ── Data index builder ──────────────────────────────────────────────────────
const buildIndices = rawData => {
const DATA = rawData.data;
if (rawData.natives) {
  Object.entries(rawData.natives).forEach(([name, players]) => {
    const nId = QUALIFIED_BY_NAME[name];
    if (nId != null) app.nativeByCountry[nId] = players;
  });
}
// Built before the byId loops below — both need importCount per country, and
// this only needs rawData.data (already in hand), not anything byId sets up.
app.importByCountry = buildImportByCountry(rawData, countryName);
DATA.forEach(d => {
  d.pop        = rawData.pop[iso2ForId(d.id)] || null;
  d.nativeCount = (app.nativeByCountry[d.id] ?? []).length;
  d.importCount = (app.importByCountry[d.id] ?? []).length;
  d.totalCount  = d.count + d.nativeCount;
  app.byId[d.id] = d;
});
// Add coloring entries for qualified countries all of whose players play for their own country
Object.entries(app.nativeByCountry).forEach(([nId, players]) => {
  const id = +nId;
  if (app.byId[id]) return;
  const name = QUALIFIED_NAMES[id];
  const pop  = rawData.pop[iso2ForId(id)] || null;
  const importCount = (app.importByCountry[id] ?? []).length;
  app.byId[id] = { id, country: name, count: 0, nativeCount: players.length, importCount,
               totalCount: players.length, pop,
               players: [], top: [], nations: [] };
});
app.pop      = rawData.pop;
app.capital  = rawData.capital ?? {};
app.eloRank = {};  // populated by wc2026_elo_rank.json fetch below
_updateLegendOutlier();
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
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(rec.pop)}${rankTag(rec.country)}${capTag(app.capital[iso2ForId(rec.id)])}</span>
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

const onCountryMousemove = (event, id, topoName = '') => {
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

// Patch topojson geometries that have no numeric id but a known name.
// Kosovo appears in the 110m dataset with only {properties:{name:'Kosovo'}} — no id field.
const _topoNameToId = { Kosovo: 383 };
world.objects.countries.geometries.forEach(g => {
  if (!g.id) { const mapped = _topoNameToId[g.properties?.name]; if (mapped) g.id = mapped; }
});

// ── Ocean background — fills the full projection area before land paths ──────
// Neutral gray, not blue — the violet theme's diverging scale (map-container.js's
// _divergingParams) uses blue for its positive/export side, and a blue ocean competed with
// blue countries for attention instead of receding as backdrop. Deliberately theme-independent
// (see the "Satellite colors" note in CLAUDE.md) — real water stays the same regardless of
// which land palette is active.
g.append('path').datum({type:'Sphere'}).attr('d', path).attr('fill','#b0c4c4').attr('stroke','none');

// ── World choropleth (skip UK polygon — rendered separately below) ────────────
g.selectAll('.country')
  .data(topojson.feature(world, world.objects.countries).features
    .filter(d => +d.id !== 826))
  .join('path')
  .attr('class','country')
  .attr('data-id', d => +d.id)
  .attr('d', path)
  .attr('fill', d => choroFill(+d.id, app.byId))
  .attr('stroke','#ccc8c0').attr('stroke-width',.3)
  .attr('data-enables-dim', d => enablesDim(+d.id) ? '' : null)
  .style('cursor', d => sidebar.isClickable(+d.id) ? 'pointer' : 'default')
  .on('mousemove', (event, d) => onCountryMousemove(event, +d.id, d.properties?.name))
  .on('mouseleave', () => { if (!dimState.active) { hideTip(); } })
  .on('click',     (event, d) => onCountryClick(event, +d.id));

g.append('path')
  .attr('class', 'mesh-border')
  .datum(topojson.mesh(world, world.objects.countries, (a,b) => a!==b))
  .attr('fill','none').attr('stroke','#b8b0a8').attr('stroke-width',.3).attr('d', path);

// ── UK home nations (separate polygons from uk-nations.geojson) ───────────────
const ukFeatures = ukNations.features.map(f => ({...f, _id: UK_GU_TO_ID[f.properties.GU_A3]}));
_ukFeatures = ukFeatures;

g.selectAll('.country-uk')
  .data(ukFeatures)
  .join('path')
  .attr('class','country country-uk')
  .attr('data-id', d => d._id)
  .attr('d', path)
  .attr('fill', d => choroFill(d._id, app.byId))
  .attr('stroke','#ccc8c0').attr('stroke-width',.3)
  .attr('data-enables-dim', d => enablesDim(d._id) ? '' : null)
  .style('cursor', d => sidebar.isClickable(d._id) ? 'pointer' : 'default')
  .on('mousemove', (event, d) => onCountryMousemove(event, d._id))
  .on('mouseleave', () => { if (!dimState.active) hideTip(); })
  .on('click',     (event, d) => onCountryClick(event, d._id));

const worldFeatures = topojson.feature(world, world.objects.countries).features;
_worldFeatures = worldFeatures;

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
    // positions directly off the DOM (_zoomToLinkedFlags, the initial fit-all-flags
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

  const blend = g.append('g').attr('class', 'cv-blend');
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
  const syncVisibility = () => {
    const hidden = flagNode.getAttribute('visibility') === 'hidden';
    blend.attr('visibility', hidden ? 'hidden' : null);
  };
  new MutationObserver(syncVisibility).observe(flagNode, { attributes: true, attributeFilter: ['visibility'] });
  syncVisibility();

  const update = k => {
    const screenSide = k >= CV_BLEND_K_THRESHOLD
      ? restSide * k
      : restSide * Math.pow(CV_BLEND_K_THRESHOLD, 1 - CV_BLEND_ALPHA) * Math.pow(k, CV_BLEND_ALPHA);
    const factor = screenSide / (k * restSide); // extra world-space scale, pivoted on the anchor, on top of the map's own k
    blend.attr('transform', `translate(${ax},${ay}) scale(${factor}) translate(${-ax},${-ay})`);
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
  const [cx, cy] = dotCentroid(d);
  const [fx, fy] = projection(fp);
  appendLeaderLine(cx, cy, fx, fy);
});

// ── All flags from world topojson (qualified + non-qualified, filtered by elo membership) ──
worldFeatures
  .filter(d => { const id = +d.id; return id !== 826 && _eloItemsById.has(id); })
  .forEach(d => {
    const id = +d.id;
    const [cx, cy] = dotCentroid(d);
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
  .forEach(f => { centroids[+f.id] = dotCentroid(f); });
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
]).then(([rawData, world, ukNations, { eloData, statusByIso2 }, , fixturesData, capeVerdeGeo, curacaoGeo]) => {
  _worldTopo = world;
  _eloData = eloData;
  app.eloRank = Object.fromEntries(
    eloData.rankings.flatMap(({id, rank}) => { const n = QUALIFIED_NAMES[id]; return n ? [[n, rank]] : []; })
  );
  eloData.rankings.forEach(r => { if (r.fifaMember) _fifaMemberIds.add(r.id); });
  buildIndices(rawData);
  // Pre-populate _eloItemsById (without centroids) so renderWorld can filter flags by elo membership
  buildEloItems({
    rankings: eloData.rankings, byId: app.byId, importByCountry: app.importByCountry,
    nativeByCountry: app.nativeByCountry,
    fifaMemberIds: _fifaMemberIds, countryNameFn: countryName, pop: app.pop, statusByIso2,
  }).forEach(item => _eloItemsById.set(item.id, item));
  renderWorld(world, ukNations, capeVerdeGeo, curacaoGeo);
  // Init elo ranking component with centroids now populated
  _eloMain.onCountryClick = id => {
    if (dimState.sourceId === id) { clearDim(); return; }
    activateCountry(id);
    if (enablesDim(id) && centroids[id]) _zoomToActiveDimFlags();
    else if (centroids[id]) zoomToCentroid(id);
  };
  _eloMain.isClickable = () => true;
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
  sidebar.updateStageTitle();
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
    // The zoom-reset/zoom-span/theme-toggle stack floats over the map's bottom-left corner
    // (_syncMapHeight below) — without extra clearance there, "fit everything" can zoom in
    // just far enough to tuck a flag right behind those buttons. viewBox units aren't 1:1
    // with real screen pixels (the SVG scales responsively to its container's actual CSS
    // width, and that ratio swings a lot between a phone and a desktop), so 20 *viewBox*
    // units of extra padding would give a much smaller on-screen margin on a narrow phone
    // than on a wide desktop — the opposite of what's needed, since the button stack itself
    // is a fixed ~38px regardless of viewport. Converting through the SVG's current rendered
    // width keeps the clearance a consistent ~20 real screen px everywhere.
    const svgWidthPx = svg.node().getBoundingClientRect().width || vbW;
    const leftPad = pad + 20 * (vbW / svgWidthPx);
    const k = Math.max(1, Math.min(12, Math.min(vbW / (x1 - x0 + leftPad + pad), vbH / (y1 - y0 + 2 * pad))));
    const cx = (x0 + x1) / 2 + (pad - leftPad) / 2; // shifted left so centering pushes content right, clear of the buttons
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

// ── Legend gradient + ticks + outlier count ─────────────────────────────────────
// All three are keyed off the active theme's own ratioMax/outlierIds/metric (or,
// for diverging themes, ratioMaxPos/Neg + outlierIdsPos/Neg) — see
// map-container.js's THEMES for why that varies per theme (different metric,
// different country tops it, different ceiling — and for violet, two ceilings
// either side of a neutral 0).
// Diverging bar position (0-1) for a value v — proportional to the *combined* -ratioMaxNeg..
// ratioMaxPos domain, not "each side gets 50% of the width regardless of its own span". The
// two ceilings are wildly different (e.g. 21 vs 42): giving each half equal pixel width made
// 0 sit at the visual midpoint while the two sides silently ran at different units-per-pixel,
// which read as "blue starting before zero" even though the underlying color math was correct
// at the exact same v — the eye has no way to know the two halves don't share a scale. A single
// continuous position formula fixes that: 0 now sits at its true proportional spot (e.g. ~33%
// when ratioMaxNeg=21/ratioMaxPos=42), and ticks (below) use the same formula so they still
// line up with the color transitions they're labeling.
const _divergingPos = (v, theme) => (v + theme.ratioMaxNeg) / (theme.ratioMaxNeg + theme.ratioMaxPos);

const _legendBar = document.getElementById('legend-bar');
const _buildLegendGradient = () => {
  const theme = currentTheme();
  const stops = theme.diverging
    // Negative extreme (left) -> neutral 0 (middle) -> positive extreme (right) —
    // a number-line reading, not the sequential themes' "high/dark on the left"
    // convention (which has no single "high side" once values can go negative).
    // Each stop carries its own explicit position (v's real proportional spot in the combined
    // domain), not left as an unpositioned/evenly-distributed stop.
    ? [
        ...Array.from({length: 30}, (_, i) => {
            const v = -theme.ratioMaxNeg + (i / 29) * theme.ratioMaxNeg;
            return `${color(v, theme)} ${(_divergingPos(v, theme) * 100).toFixed(2)}%`;
          }),
        ...Array.from({length: 30}, (_, i) => {
            const v = (i / 29) * theme.ratioMaxPos;
            return `${color(v, theme)} ${(_divergingPos(v, theme) * 100).toFixed(2)}%`;
          }),
      ]
    : Array.from({length: 60}, (_, i) => color(RATIO_MIN + (i / 59) * (theme.ratioMax - RATIO_MIN), theme));
  _legendBar.style.background = `linear-gradient(to ${theme.diverging ? 'right' : 'left'}, ${stops.join(',')})`;
  _legendBar.style.borderRadius = '5px';
};
_buildLegendGradient();

// Ticks are absolutely positioned (percent, matching #legend-bar's own width — see
// css/map-container.css) rather than flexbox-evenly-spaced, specifically so a diverging theme's
// ticks land exactly on the color transitions _buildLegendGradient() now draws at those same
// proportional positions — flex space-between assumed all 5 ticks were equally far apart, which
// was only ever true for the sequential themes' single continuous 0..ratioMax scale.
const _legendTicksEl = document.getElementById('legend-ticks');
const _updateLegendTicks = () => {
  if (!_legendTicksEl) return;
  const theme = currentTheme();
  const ticks = theme.diverging
    ? [-theme.ratioMaxNeg, -theme.ratioMaxNeg / 2, 0, theme.ratioMaxPos / 2, theme.ratioMaxPos].map(Math.round)
    : [1, 0.75, 0.5, 0.25, 0].map(f => Math.round(theme.ratioMax * f));
  // Sequential bar direction is 'to left' (high/dark value on the left, 0 on the right — see
  // _buildLegendGradient) — the reverse of diverging's left-to-right number line, so position
  // is inverted (1 - t/ratioMax) to match.
  const pct = t => theme.diverging ? _divergingPos(t, theme) * 100 : (1 - t / theme.ratioMax) * 100;
  render(html`${ticks.map(t => html`<span style="position:absolute; left:${pct(t)}%; transform:translateX(-50%)">${t}</span>`)}`, _legendTicksEl);
};
_updateLegendTicks();

const _legendOutlierPosWrapEl = document.getElementById('legend-outlier-pos-wrap');
const _legendOutlierDotEl    = document.getElementById('legend-outlier-dot');
const _legendOutlierDotPosEl = document.getElementById('legend-outlier-dot-pos');
const _updateLegendOutlier = () => {
  const el = document.getElementById('legend-outlier-count');
  if (!el) return;
  const theme = currentTheme();
  if (theme.diverging) {
    // Negative outlier keeps the original (pre-diverging) slot before the bar;
    // positive outlier is the mirrored slot after it — see wc2026_map.html.
    // Each dot is tinted with its own arm's outlier color (map-container.js's
    // divergingOutlierColor()), not the shared flat black the sequential
    // themes' single dot uses.
    const [negId] = theme.outlierIdsNeg, [posId] = theme.outlierIdsPos;
    const negRec = app.byId[negId], posRec = app.byId[posId];
    el.textContent = negRec ? theme.metric(negRec) : '';
    if (_legendOutlierDotEl) _legendOutlierDotEl.style.background = divergingOutlierColor('neg');
    if (_legendOutlierPosWrapEl) {
      _legendOutlierPosWrapEl.classList.remove('d-none');
      document.getElementById('legend-outlier-count-pos').textContent = posRec ? theme.metric(posRec) : '';
      if (_legendOutlierDotPosEl) _legendOutlierDotPosEl.style.background = divergingOutlierColor('pos');
    }
  } else {
    const [outlierId] = theme.outlierIds;
    const rec = app.byId[outlierId];
    el.textContent = rec ? theme.metric(rec) : '';
    if (_legendOutlierDotEl) _legendOutlierDotEl.style.background = theme.outlier;
    if (_legendOutlierPosWrapEl) _legendOutlierPosWrapEl.classList.add('d-none');
  }
};

const _legendBornFullEl  = document.getElementById('legend-born-full');
const _legendBornBriefEl = document.getElementById('legend-born-brief');
const _updateLegendBorn = () => {
  const { full, brief } = T.legendMetric[currentTheme().legendKey];
  // full carries an inline <em> (i18n.js) around the operator word ("minus"/"moins"/etc.) for
  // emphasis without shouting in all-caps — rendered via unsafeHTML since it's a developer-
  // authored translation string, never user input. title (the ellipsis-truncation fallback,
  // native tooltips can't render HTML) strips the tag back out to plain text.
  if (_legendBornFullEl) {
    render(html`${unsafeHTML(full)}`, _legendBornFullEl);
    _legendBornFullEl.title = full.replace(/<[^>]+>/g, '');
  }
  if (_legendBornBriefEl) _legendBornBriefEl.textContent = brief;
};
_updateLegendBorn();

// ── Map colour theme (cycled via #theme-toggle, floating over the map) ─────────
const _paintThemeToggle = () => {
  if (!_themeToggleBtn) return;
  const theme = currentTheme();
  // Diverging: each arm's own outlier color (already the darkest point of that
  // arm — see map-container.js), so the swatch hints at the two-sided scale.
  // Sequential: two stops from the one ramp, as before.
  const at = f => theme.ramp[Math.round(f * (theme.ramp.length - 1))];
  const stops = theme.diverging ? [divergingOutlierColor('neg'), divergingOutlierColor('pos')] : [at(0.55), at(0.9)];
  _themeToggleBtn.style.setProperty('--theme-swatch', `linear-gradient(135deg, ${stops[0]}, ${stops[1]})`);
};
_paintThemeToggle();
_themeToggleBtn?.addEventListener('click', () => {
  const names = themeNames();
  const next  = names[(names.indexOf(themeName()) + 1) % names.length];
  setTheme(next);
});
onThemeChange(() => {
  g.selectAll('.country').attr('fill', function(d) { return choroFill(d._id ?? +d.id, app.byId); });
  g.selectAll('.standalone-dot').attr('fill', function() { return choroFill(+this.getAttribute('data-id'), app.byId); });
  _buildLegendGradient();
  _updateLegendTicks();
  _updateLegendOutlier();
  _updateLegendBorn();
  _paintThemeToggle();
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
