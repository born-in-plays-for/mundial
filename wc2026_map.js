import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { renderChain } from './chains/wc2026_chain_render.js';
import { renderEloRanking } from './wc2026_elo_ranking.js';
import { LOCALE, _LANG, T, countryName, wikiUrl } from './i18n.js';
import { whereNumeric } from 'https://cdn.jsdelivr.net/npm/iso-3166-1@2/+esm';

const RATIO_MIN = 0;
const RATIO_MAX = 66; // Netherlands (2nd highest) anchors the top of the scale

const PALETTE = d3.interpolateRgbBasis(['#f3e8f7','#ddb8ea','#c285d8','#a354c2','#7b2d8b','#581f65','#361240']);
const normalize = r => (r / RATIO_MAX) ** 2;
const color = r => PALETTE(Math.max(0, Math.min(1, normalize(r))));

const OUTLIER_COLOR = '#000'; // France (99) is off-scale — rendered black
const OUTLIER_IDS  = new Set([250]);
const choroFill = (id, byId) => {
  if (OUTLIER_IDS.has(id)) return OUTLIER_COLOR;
  const r = byId[id];
  return r ? color(r.ratio) : '#e8e4e0';
};

const W = 900, H = 480;
const projection = d3.geoNaturalEarth1().scale(152).translate([W/2, H/2 + 10]);
const path = d3.geoPath(projection);
const svg = d3.select('#map');

const [[_bx0, _by0], [_bx1, _by1]] = path.bounds({type: 'Sphere'});
svg.attr('viewBox', `${Math.floor(_bx0)} ${Math.floor(_by0)} ${Math.ceil(_bx1-_bx0)} ${Math.ceil(_by1-_by0)}`);

const ARC_EXPORT_COLOR = '#1d4ed8'; // blue
const ARC_IMPORT_COLOR = '#dc2626'; // red
document.documentElement.style.setProperty('--arc-export-color', ARC_EXPORT_COLOR);
document.documentElement.style.setProperty('--arc-import-color', ARC_IMPORT_COLOR);
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

const g = svg.append('g');
const tt = document.getElementById('tooltip');

const FLAG   = 14;
const DOT_R  = 2;  // visual radius (px) for standalone island dot markers
// How much flag icons grow with zoom: 0 = fixed size, 1 = fully proportional; visual size = FLAG * k^exp
const FLAG_SIZE_ZOOM_EXP   = 1/5;
// How much the leader-line offset grows with zoom: 0 = fixed, 0.5 = sqrt(k), 1 = fully proportional
const FLAG_OFFSET_ZOOM_EXP = 2/3;


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
  858: [-51.5, -37.5],  // Uruguay — flag placed SE in the Atlantic
};

const dotCentroid = d => {
  const ov = CENTROID_OVERRIDE[+d.id];
  return ov ? projection(ov) : path.centroid(d);
};

svg.on('click', () => { clearDim(); });

const zoom = d3.zoom()
svg.call(zoom
  .scaleExtent([1, 18])
  .on('zoom', e => {
    g.attr('transform', e.transform);
    const s = FLAG / Math.pow(e.transform.k, 1 - FLAG_SIZE_ZOOM_EXP);
    g.selectAll('.flag-qualified')
      .attr('width', s)
      .attr('height', s)
      .attr('x', function() { return +this.getAttribute('data-cx') - s/2; })
      .attr('y', function() { return +this.getAttribute('data-cy') - s/2; });
    g.selectAll('.standalone-dot')
      .attr('r', DOT_R / e.transform.k)
      .attr('stroke-width', 0.5 / e.transform.k);
    g.selectAll('.offset-flag').each(function() {
      const cx = +this.getAttribute('data-centroid-cx');
      const cy = +this.getAttribute('data-centroid-cy');
      const dx = +this.getAttribute('data-flag-dx');
      const dy = +this.getAttribute('data-flag-dy');
      d3.select(this)
        .attr('x', cx + dx / Math.pow(e.transform.k, FLAG_OFFSET_ZOOM_EXP) - s/2)
        .attr('y', cy + dy / Math.pow(e.transform.k, FLAG_OFFSET_ZOOM_EXP) - s/2);
    });
    g.selectAll('.leader-line').each(function() {
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
    dimState.k = e.transform.k;
    const k = dimState.k;
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
  }));

g.append('path').datum({type:'Sphere'})
  .attr('d', path).attr('fill','#d8d0e8').attr('stroke','#b4a8cc').attr('stroke-width',.5)
  .attr('cursor', 'default')
  .on('mousemove', () => { hideTip(); });
g.append('path').datum(d3.geoGraticule()())
  .attr('d', path).attr('fill','none').attr('stroke','#ccc4dc').attr('stroke-width',.25);

// ── Flag CDN helpers ──────────────────────────────────────────────────────────
const FLAG_CDN      = code => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${code}.svg`;
const FLAG_CDN_RECT = code => `https://cdn.jsdelivr.net/npm/flag-icons@7/flags/4x3/${code}.svg`;

// ── Qualified-nation lookups ──────────────────────────────────────────────────
const QUALIFIED_NAMES = {
  12:'Algeria', 32:'Argentina', 36:'Australia', 40:'Austria',
  56:'Belgium', 70:'Bosnia and Herzegovina', 76:'Brazil', 124:'Canada',
  132:'Cape Verde', 170:'Colombia', 191:'Croatia', 203:'Czech Republic',
  180:'DR Congo', 818:'Egypt', 218:'Ecuador', 250:'France', 276:'Germany',
  288:'Ghana', 332:'Haiti', 364:'Iran', 368:'Iraq', 384:'Ivory Coast',
  392:'Japan', 400:'Jordan', 484:'Mexico', 504:'Morocco', 528:'Netherlands',
  554:'New Zealand', 578:'Norway', 591:'Panama', 600:'Paraguay',
  620:'Portugal', 634:'Qatar', 682:'Saudi Arabia', 686:'Senegal',
  710:'South Africa', 410:'South Korea', 724:'Spain', 752:'Sweden',
  756:'Switzerland', 788:'Tunisia', 792:'Turkey',
  8260:'England', 8261:'Scotland',
  840:'United States', 858:'Uruguay', 860:'Uzbekistan',
  531:'Curaçao'
};

const QUALIFIED_BY_NAME = Object.fromEntries(
  Object.entries(QUALIFIED_NAMES).map(([id, name]) => [name, +id])
);



const DOCUMENT_TITLE = "Thiebaud's Mundial";

// Null-ID birth countries → numeric topojson ID (for centroid lookup and flag dimming)
const _NULL_CENTROID_ID = { 'Democratic Republic of the Congo': 180, 'U.S.': 840, 'Kingdom of the Netherlands': 528 };



// Apply locale to static page elements
document.title = DOCUMENT_TITLE;
document.querySelector('meta[name="description"]')?.setAttribute('content', T.pageDescription);
['page-heading-sub'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  const q = T.pageQuote;
  el.querySelector('.pq-text').innerHTML = q.text;
  el.querySelector('.pq-attr').innerHTML = `<span class="pq-author">${q.author}</span>${q.sep}<cite>${q.work}</cite>, ${q.ref} <time datetime="${q.date}">${q.date}</time>`;
});
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
  _zoomToLinkedFlags();
});
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
    const url = wikiUrl(p);
    if (url) return { href: url, fallback: false };
    const en = p.wiki_langs?.en ?? null;
    if (en) return { href: en, fallback: true };
  }
  return null;
};
const _renderChain = () => {
  if (!_chainData) return;
  _chainUpdate = renderChain(_chainData, document.getElementById('tab-chain'), {
    onCountryClick:   _chainOnClick,
    getSelectedIndex: _chainGetIndex,
    getPlayerWikiUrl: _chainWikiUrl,
    labels:           { ...T.chainLegend, subtitle: T.chainSubtitle },
    headerContainer:  document.getElementById('chain-panel-header'),
  });
};
// On selection change: surgical update only — no SVG rebuild, no flicker.
const _updateChainSelection = () => {
  if (_chainUpdate && !document.getElementById('tab-chain')?.hidden)
    _chainUpdate(_chainGetIndex());
};
fetch('./chains/wc2026_chain_longest.json').then(r => r.json()).then(d => {
  _chainData = d;
  if (!document.getElementById('tab-chain')?.hidden) _renderChain();
});

// Elo ranking tab — two-column layout: ranking list (flex:1) + collapsible sidebar
let _eloCtrl = null;
let _eloData   = null;
let _sortOrder  = ['elo', 'exp', 'imp', 'delta', 'alpha'];
let _sortDir    = 'desc';
const _fifaMemberIds = new Set();
const _eloMain    = document.createElement('div');
_eloMain.className = 'elo-main';
const _controlSidebar = document.createElement('div');
_controlSidebar.id = 'control-sidebar';
_controlSidebar.classList.add('collapsed');
document.getElementById('page-header')?.appendChild(_controlSidebar);
const _eloLayout  = document.createElement('div');
_eloLayout.className = 'elo-layout';
_eloLayout.appendChild(_eloMain);
document.getElementById('tab-elo')?.appendChild(_eloLayout);

// ── Persistent filter table — isQualified × isImporting × isExporting cube ──
// Row and column headers are clickable: toggles all checkboxes in that row/column.
// The same DOM node is re-appended on each render so checked state survives tab switches.
const _controlPanel = document.createElement('div');
_controlPanel.innerHTML = `<table class="csb-table table table-sm table-bordered">
  <tbody>
    <tr>
      <td class="csb-header text-center text-muted" style="position:relative">${T.sortLabels.action}<span class="csb-close btn-close btn-close-sm position-absolute top-0 start-0 m-1" aria-label="Close" style="font-size:0.5rem;"></span></td>
      <td colspan="2" class="csb-header text-center text-muted" data-col="all"><em>${T.filterLabels.action}</em>
      <td class="csb-col text-muted" data-col="exp"><span class="d-flex align-items-start justify-content-between"><span>${T.filterLabels.exporter}</span><span class="csb-badge" style="color:#3b82f6">●</span></span></td>
      <td class="csb-col text-muted" data-col="nexp">${T.filterLabels.nonExp}</td>
    </tr>
    <tr>
      <td rowspan="4" class="csb-sort-col p-0 text-muted">
        <div class="csb-sort-list d-flex flex-column h-100 position-relative">
          <button class="csb-sort-dir"></button>
          <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="elo">${T.sortLabels.elo}</div>
          <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="exp">${T.sortLabels.exp}</div>
          <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="imp">${T.sortLabels.imp}</div>
          <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="delta">${T.sortLabels.delta}</div>
          <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="alpha">${T.sortLabels.alpha}</div>
        </div>
      </td>
      <td rowspan="2" class="csb-group text-muted" data-row="q">${T.filterLabels.qualified}</td>
      <td class="csb-row text-muted" data-row="qi"><span class="d-flex align-items-start justify-content-between"><span>${T.filterLabels.importer}</span><span class="csb-badge" style="color:#ef4444">●</span></span></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-qie" checked></label></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-qi"  checked></label></td>
    </tr>
    <tr>
      <td class="csb-row text-muted" data-row="qni">${T.filterLabels.nonImp}</td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-qe"  checked></label></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-q"   checked></label></td>
    </tr>
    <tr>
      <td rowspan="2" class="csb-group text-muted" data-row="nq">${T.filterLabels.nonQual}</td>
      <td class="csb-row text-muted" data-row="nqf">FIFA</td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-ef"  checked></label></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-of"></label></td>
    </tr>
    <tr>
      <td class="csb-row text-muted" data-row="nqn"><span class="d-flex align-items-start justify-content-between"><span>non-FIFA</span><span class="csb-badge">○</span></span></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-en"  checked></label></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-on"></label></td>
    </tr>
  </tbody>
</table>`;

const _fltQIE = _controlPanel.querySelector('#filter-qie');
const _fltQI  = _controlPanel.querySelector('#filter-qi');
const _fltQE  = _controlPanel.querySelector('#filter-qe');
const _fltQ   = _controlPanel.querySelector('#filter-q');
const _fltEF  = _controlPanel.querySelector('#filter-ef');
const _fltOF  = _controlPanel.querySelector('#filter-of');
const _fltEN  = _controlPanel.querySelector('#filter-en');
const _fltON  = _controlPanel.querySelector('#filter-on');

const _flagCat = id => {
  const qual = !!QUALIFIED_NAMES[id];
  const imp  = (app.importByNation[id]?.length ?? 0) > 0;
  const exp  = (app.byId[id]?.count ?? 0) > 0;
  if  (qual &&  imp &&  exp) return 'qie';
  if  (qual &&  imp && !exp) return 'qi';
  if  (qual && !imp &&  exp) return 'qe';
  if  (qual && !imp && !exp) return 'q';
  if (!qual &&               exp) return 'e';
  return 'o';
};
const _catChecked = cat => ({qie:_fltQIE,qi:_fltQI,qe:_fltQE,q:_fltQ})[cat]?.checked ?? true;
const _applyFlagFilter = () => {
  d3.selectAll('.flag-qualified[data-elo-cat]')
    .attr('visibility', function() {
      const cat = this.getAttribute('data-elo-cat');
      if (cat === 'e' || cat === 'o') {
        const id = +this.getAttribute('data-id');
        const fifa = _fifaMemberIds.has(id);
        return (cat === 'e' ? (fifa ? _fltEF : _fltEN) : (fifa ? _fltOF : _fltON)).checked ? null : 'hidden';
      }
      return _catChecked(cat) ? null : 'hidden';
    });
  _updateVisibleCountryCount();
};
const _updateVisibleCountryCount = () => {
  const el = document.getElementById('visible-country-count');
  if (!el) return;
  const all = d3.selectAll('.flag-qualified[data-elo-cat]');
  const total = _eloData?.rankings?.filter(r => !r.weirdo).length ?? all.size();
  const visible = all.filter(function() { return this.getAttribute('visibility') !== 'hidden'; }).size();
  el.textContent = visible === total ? `${total}` : `${visible} / ${total}`;
};
const _catEloChecked = (id, fifaMember) => {
  const cat = _flagCat(id);
  if (cat === 'e') return fifaMember ? _fltEF.checked : _fltEN.checked;
  if (cat === 'o') return fifaMember ? _fltOF.checked : _fltON.checked;
  return _catChecked(cat);
};
const _filterToggle = chks => { const on = chks.every(c => c.checked); chks.forEach(c => c.checked = !on); _renderElo(); _applyFlagFilter(); };
_controlPanel.querySelector('[data-row="q"]'   ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQI, _fltQE, _fltQ]));
_controlPanel.querySelector('[data-row="qi"]'  ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQI]));
_controlPanel.querySelector('[data-row="qni"]' ).addEventListener('click', () => _filterToggle([_fltQE,  _fltQ]));
_controlPanel.querySelector('[data-row="nq"]'  ).addEventListener('click', () => _filterToggle([_fltEF, _fltOF, _fltEN, _fltON]));
_controlPanel.querySelector('[data-row="nqf"]' ).addEventListener('click', () => _filterToggle([_fltEF, _fltOF]));
_controlPanel.querySelector('[data-row="nqn"]' ).addEventListener('click', () => _filterToggle([_fltEN, _fltON]));
_controlPanel.querySelector('[data-col="exp"]' ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQE, _fltEF, _fltEN]));
_controlPanel.querySelector('[data-col="nexp"]').addEventListener('click', () => _filterToggle([_fltQI,  _fltQ,  _fltOF, _fltON]));
_controlPanel.querySelector('[data-col="all"]').addEventListener('click', () => _filterToggle([_fltQIE, _fltQI, _fltQE, _fltQ, _fltEF, _fltOF, _fltEN, _fltON]));
_controlPanel.addEventListener('change', () => { _renderElo(); _applyFlagFilter(); });
_controlPanel.querySelector('.csb-close')?.addEventListener('click', e => {
  e.stopPropagation();
  _controlSidebar.classList.add('collapsed');
  _controlSidebarToggle.textContent = '‹';
});
const _sortListEl = _controlPanel.querySelector('.csb-sort-list');
const _sortDirBtn = _sortListEl.querySelector('.csb-sort-dir');
const _updateSortCol = () => {
  const items = Array.from(_sortListEl.querySelectorAll('.csb-sort-item'));
  const before = new Map(items.map(el => [el, el.getBoundingClientRect().top]));
  _sortOrder.forEach(key => { const el = _sortListEl.querySelector(`[data-sort="${key}"]`); if (el) _sortListEl.appendChild(el); });
  _sortDirBtn.dataset.dir = _sortDir;
  items.forEach(el => {
    const delta = before.get(el) - el.getBoundingClientRect().top;
    if (delta === 0) return;
    el.style.transition = 'none';
    el.style.transform = `translateY(${delta}px)`;
    el.getBoundingClientRect(); // force reflow
    el.style.transition = 'transform 0.25s ease';
    el.style.transform = '';
    el.addEventListener('transitionend', () => { el.style.transition = ''; }, { once: true });
  });
};
_updateSortCol();
_sortListEl?.addEventListener('click', e => {
  const btn = e.target.closest('.csb-sort-dir');
  if (btn) {
    e.stopPropagation();
    _sortDir = _sortDir === 'desc' ? 'asc' : 'desc';
    _sortDirBtn.dataset.dir = _sortDir;
    _renderElo();
    return;
  }
  const item = e.target.closest('.csb-sort-item');
  if (item) {
    const key = item.dataset.sort;
    _sortOrder = [key, ..._sortOrder.filter(k => k !== key)];
    _updateSortCol();
    _renderElo();
  }
});
const _controlSidebarToggle = document.createElement('button');
_controlSidebarToggle.className = 'csb-toggle';
_controlSidebarToggle.title = 'Toggle filter';
_controlSidebarToggle.textContent = '‹';
_controlSidebarToggle.addEventListener('click', () => {
  const collapsed = _controlSidebar.classList.toggle('collapsed');
  _controlSidebarToggle.textContent = collapsed ? '‹' : '›';
});
const _controlSidebarBody = document.createElement('div');
_controlSidebarBody.className = 'csb-body overflow-hidden';
_controlSidebarBody.appendChild(_controlPanel);
_controlSidebar.appendChild(_controlSidebarToggle);
_controlSidebar.appendChild(_controlSidebarBody);
// Measure natural table dimensions before first collapse
_controlSidebar.classList.remove('collapsed');
_controlSidebarBody.style.maxWidth = 'none';
_controlSidebarBody.style.width = 'max-content';
// Fix sort column width: longest item text + symmetric room for the direction button
const _sortItemEls = Array.from(_sortListEl.querySelectorAll('.csb-sort-item'));
const _maxItemW = Math.max(..._sortItemEls.map(el => el.offsetWidth));
const _btnEffW  = _sortDirBtn.offsetWidth + 3; // 3px gap from edge
document.documentElement.style.setProperty('--sort-col-w', (_maxItemW + 2 * _btnEffW + 6) + 'px');
document.documentElement.style.setProperty('--csb-h', _controlPanel.scrollHeight + 'px');
document.documentElement.style.setProperty('--csb-w', _controlSidebarBody.offsetWidth + 'px');
_controlSidebarBody.style.maxWidth = '';
_controlSidebarBody.style.width = '';
_controlSidebarToggle.textContent = '›';
const _autoCollapseTimer = setTimeout(() => {
  _controlSidebarBody.style.transition = 'max-width 1s ease';
  _controlSidebar.classList.add('collapsed');
  _controlSidebarToggle.textContent = '‹';
  _controlSidebarBody.addEventListener('transitionend', () => {
    _controlSidebarBody.style.transition = '';
  }, { once: true });
}, 3000);
_controlSidebar.addEventListener('click', () => clearTimeout(_autoCollapseTimer), { once: true });
// Measure actual header height (offsetHeight forces reflow after CSS var is applied)
const _pageHeader = document.getElementById('page-header');
if (_pageHeader) document.documentElement.style.setProperty('--page-header-h', _pageHeader.offsetHeight + 'px');
const _isFullyVisible = el => {
  if (!el) return false;
  const r = el.getBoundingClientRect();
  const padTop = parseFloat(document.documentElement.style.scrollPaddingTop)    || 0;
  const padBot = parseFloat(document.documentElement.style.scrollPaddingBottom) || 0;
  return r.top >= padTop && r.bottom <= window.innerHeight - padBot;
};

// padding-top = bottom edge of fixed map container (exact, no formula needed)
const _mc = document.getElementById('map-container');
const _isLandscapeMobile = () => window.innerHeight <= 500 && window.innerWidth > window.innerHeight;
const _syncPaddingTop = () => {
  if (_isLandscapeMobile()) {
    document.body.style.paddingTop    = '0';
    document.body.style.paddingBottom = '0';
    document.documentElement.style.scrollPaddingTop    = '0';
    document.documentElement.style.scrollPaddingBottom = '0';
    return;
  }
  if (_mc) {
    const mapBottom = _mc.getBoundingClientRect().bottom;
    document.body.style.paddingTop = mapBottom + 'px';
    document.documentElement.style.scrollPaddingTop    = mapBottom + 'px';
    document.documentElement.style.scrollPaddingBottom = (_bottomPanel ? _bottomPanel.offsetHeight : 0) + 'px';
  }
};
requestAnimationFrame(_syncPaddingTop);
window.addEventListener('resize', _syncPaddingTop);
const _bottomPanel  = document.getElementById('bottom-panel');
const _bottomTabNav = document.getElementById('bottomTabList');
const _syncMapHeight = () => {
  const [, , vbW, vbH] = svg.attr('viewBox').split(' ').map(Number);
  const svgEl = document.getElementById('map');
  if (_isLandscapeMobile()) {
    svgEl.style.width  = '';
    svgEl.style.height = '';
  } else {
    const cs = getComputedStyle(_mc);
    const contentW = _mc.getBoundingClientRect().width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const naturalH = contentW * vbH / vbW;
    const maxH = Math.max(50, Math.floor(window.innerHeight * 2 / 3
      - (_pageHeader    ? _pageHeader.offsetHeight    : 0)
      - (_bottomTabNav  ? _bottomTabNav.offsetHeight  : 0)));
    if (naturalH > maxH) {
      svgEl.style.width  = Math.round(maxH * vbW / vbH) + 'px';
      svgEl.style.height = maxH + 'px';
    } else {
      svgEl.style.width  = '';
      svgEl.style.height = '';
    }
  }
  requestAnimationFrame(() => {
    _syncPaddingTop();
    const svgRect = svgEl.getBoundingClientRect();
    const mcRect  = _mc.getBoundingClientRect();
    const fromRight  = mcRect.right  - svgRect.right;
    const fromBottom = mcRect.bottom - svgRect.bottom;
    const totalH = (_zoomResetBtn?.offsetHeight ?? 26) + 4 + (_zoomSpanBtn?.offsetHeight ?? 26);
    const midTop = Math.round((svgRect.top - mcRect.top) + (svgRect.height - totalH) / 2);
    if (_zoomResetBtn) {
      _zoomResetBtn.style.right = (fromRight + 8) + 'px';
      _zoomResetBtn.style.top   = midTop + 'px';
    }
    if (_zoomSpanBtn) {
      _zoomSpanBtn.style.right = (fromRight + 8) + 'px';
      _zoomSpanBtn.style.top   = (midTop + (_zoomResetBtn?.offsetHeight ?? 26) + 4) + 'px';
    }
    if (_zoomHintEl) {
      _zoomHintEl.style.left      = (svgRect.right - mcRect.left + 2) + 'px';
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

const _buildEloItems = () => {
  const raw = (_eloData?.rankings ?? [])
    .filter(r => !r.weirdo)
    .map(({ id, rank, pts, iso2, name, fifaMember }) => ({
      id, rank, pts, iso2, name: countryName(id, name),
      fifaMember,
      exp: (app.byId[id]?.count ?? 0) > 0,
      imp: (app.importByNation[id]?.length ?? 0) > 0,
      expCount: app.byId[id]?.count ?? 0,
      impCount: app.importByNation[id]?.length ?? 0,
    }))
    ;
  const _sortFns = { elo: (a, b) => (a.rank ?? 99999) - (b.rank ?? 99999), exp: (a, b) => b.expCount - a.expCount, imp: (a, b) => b.impCount - a.impCount, delta: (a, b) => (b.expCount - b.impCount) - (a.expCount - a.impCount), alpha: (a, b) => a.name.localeCompare(b.name) };
  raw.sort((a, b) => { for (let i = 0; i < Math.min(_sortOrder.length, 3); i++) { let d = _sortFns[_sortOrder[i]](a, b); if (i === 0 && _sortDir === 'asc') d = -d; if (d !== 0) return d; } return 0; });
  const primary   = _sortOrder[0];
  const secondary = _sortOrder[1];
  const _ptsFor = (key, item) =>
      key === 'exp'   ? item.expCount
    : key === 'imp'   ? item.impCount
    : key === 'delta' ? item.expCount - item.impCount
    : key === 'elo'   ? item.pts
    : null;
  return raw.map(item => ({
    ...item,
    pts:  primary === 'alpha' ? null : primary === 'elo' ? item.pts : _ptsFor(primary, item),
    pts2: secondary ? _ptsFor(secondary, item) : null,
  }));
};

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

const _renderElo = () => {
  const allItems = _buildEloItems();
  const total = _eloData?.rankings?.filter(r => !r.weirdo).length ?? 0;
  const visibleItems = allItems.filter(item => _catEloChecked(item.id, item.fifaMember));
  if (_eloCtrl) { _eloCtrl.show(visibleItems); return; }
  _eloCtrl = renderEloRanking(_eloMain, {
    items: allItems,
    onCountryClick: id => {
      if (dimState.sourceId === id) { clearDim(); return; }
      if (enablesDim(id)) { activateCountry(id); _zoomToActiveDimFlags(); return; }
      if (dimState.active) clearDim();
      zoomToCentroid(id);
    },
    isClickable:  id => enablesDim(id),
    isZoomable:   id => !enablesDim(id) && !!centroids[id],
    isMuted:     id => !QUALIFIED_NAMES[id],
    getSelectedId: () => dimState.sourceId,
    source: _eloData?.source,
    date: _eloData?.updated,
  });
  _eloCtrl.show(visibleItems);
};
const _updateEloSelection = () => {
  if (_eloCtrl && !document.getElementById('tab-elo')?.hidden)
    _eloCtrl.update(dimState.sourceId);
};
const _eloSourceLabelEl  = document.getElementById('elo-source-label');
const _eloUpdatedLabelEl = document.getElementById('elo-updated-label');
if (_eloSourceLabelEl)  _eloSourceLabelEl.textContent  = T.eloSource;
if (_eloUpdatedLabelEl) _eloUpdatedLabelEl.textContent = T.eloUpdated;


fetch('./wc2026_elo_rank.json').then(r => r.json()).then(d => {
  _eloData = d;
  const _dateEl = document.getElementById('elo-date');
  if (_dateEl && d.updated) _dateEl.textContent = d.updated;
  app.eloRank = Object.fromEntries(
    d.rankings.flatMap(({id, rank}) => { const n = QUALIFIED_NAMES[id]; return n ? [[n, rank]] : []; })
  );
  d.rankings.forEach(r => { if (r.fifaMember) _fifaMemberIds.add(r.id); });
  _applyFlagFilter();
  if (!document.getElementById('tab-elo')?.hidden && Object.keys(app.byId).length > 0) _renderElo();
}).catch(() => {});

const showTab = name => {
  document.querySelectorAll('#bottomTabList button[data-tab]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === name);
  });
  document.querySelectorAll('#bottomTabContent > [id]').forEach(pane => {
    pane.hidden = pane.id !== name;
  });
  // const eloPanel   = document.getElementById('tab-elo-panel');
  const chainPanel = document.getElementById('tab-chain-panel');
  const toExpand   = name === 'tab-chain' ? chainPanel : null;
  const toCollapse = [chainPanel].find(p => p && !p.classList.contains('collapsed') && p !== toExpand);
  if (toCollapse) {
    toCollapse.classList.add('collapsed');
    if (toExpand) toCollapse.addEventListener('transitionend', () => toExpand.classList.remove('collapsed'), { once: true });
  } else {
    toExpand?.classList.remove('collapsed');
  }
  if (name === 'tab-chain' && _chainData) {
    _renderChain();
    requestAnimationFrame(() => _chainUpdate?.scrollActive());
  }
  if (name === 'tab-elo') {
    _renderElo();
    requestAnimationFrame(() => { const el = document.querySelector('#tab-elo .elo-item--active'); if (el && !_isFullyVisible(el)) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  }
};
document.querySelectorAll('#bottomTabList button[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => showTab(btn.dataset.tab));
});

let _chainResizeTimer = null;
window.addEventListener('resize', () => {
  _syncMapHeight();
  clearTimeout(_chainResizeTimer);
  _chainResizeTimer = setTimeout(() => {
    if (_chainData && !document.getElementById('tab-chain')?.hidden) _renderChain();
  }, 150);
});

const ISO2 = {
  12:'dz', 32:'ar', 36:'au', 40:'at', 56:'be', 70:'ba', 76:'br',
  124:'ca', 132:'cv', 170:'co', 191:'hr', 203:'cz', 180:'cd',
  218:'ec', 250:'fr', 276:'de', 288:'gh', 332:'ht', 364:'ir',
  368:'iq', 384:'ci', 392:'jp', 400:'jo', 484:'mx', 504:'ma',
  528:'nl', 554:'nz', 578:'no', 591:'pa', 600:'py', 620:'pt',
  634:'qa', 682:'sa', 686:'sn', 710:'za', 410:'kr', 724:'es',
  752:'se', 756:'ch', 788:'tn', 792:'tr', 840:'us',
  858:'uy', 860:'uz',
  // home nations (synthetic IDs, no ISO 3166-1 numeric)
  8260:'gb-eng', 8261:'gb-sct', 8262:'gb-wls', 8263:'gb-nir',
  // birth countries not in qualified list
  120:'cm', 178:'cg', 208:'dk', 324:'gn', 372:'ie',
  380:'it', 398:'kz', 404:'ke', 566:'ng', 688:'rs', 705:'si',
  729:'sd', 834:'tz', 854:'bf', 818:'eg', 894:'zm',
  531:'cw',
  // Kosovo: user-assigned XK / numeric 383 (not in ISO 3166-1 official table)
  383:'xk'
};

const ISO2_REVERSE = Object.fromEntries(Object.entries(ISO2).map(([id, c]) => [c, +id]));
const iso2ForId = id => ISO2[id] ?? whereNumeric(String(id).padStart(3,'0'))?.alpha2?.toLowerCase() ?? null;

// Birth country names not in ISO 3166-1 numeric that have a known alpha-2 code
const _NULL_CODE = { 'Democratic Republic of the Congo': 'cd', 'U.S.': 'us', 'Isle of Man': 'im' };

// Small island nations — absent from 110m topojson. A dot marker is drawn at lon/lat (choropleth color);
// the flag icon is offset by dLon/dLat (degrees) from the centroid so both are visible.
// dLon: + east, − west  |  dLat: + north, − south
const STANDALONE_FLAGS = [
  { id: 132, lon: -23.6, lat: 15.1, dLon:  -4.0, dLat: 4.0 },  // Cape Verde — flag south in Atlantic
  { id: 531, lon: -69.0, lat: 12.2, dLon:  4.0, dLat:  4.0 },  // Curaçao   — flag north in Caribbean
];
const STANDALONE_IDS = new Set(STANDALONE_FLAGS.map(f => f.id));

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

let lastTipKey = null;

const hideTip = () => { tt.style.display = 'none'; tt.classList.remove('tt-non-qualified'); lastTipKey = null; };

const showQualifiedTip = (event, name, code) => {
  const nId = QUALIFIED_BY_NAME[name];
  if (lastTipKey !== name) {
    lastTipKey = name;
    const hasImps = (app.importByNation[nId] ?? []).length > 0;

    render(html`
      <div class="tt-name tt-name-inner d-flex align-items-center gap-2">
        <span class="tt-name-inner d-flex align-items-center gap-2">${flagImg(code)}${countryName(nId, name)}${app.byId[nId]?.totalCount ? html`<span class="tt-count" style="color:#14532d;font-size:18px;margin:0;line-height:1">${app.byId[nId].totalCount}</span>` : nothing}</span>
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(app.pop[code])}${rankTag(name)}${capTag(app.capital[code])}</span>
      </div>
      <div class="tt-label">${T.noExport(countryName(nId, name))}</div>
      ${hasImps ? buildImportColHtml(nId) : html`<div class="tt-label">${T.noImport(countryName(nId, name))}</div>`}
      ${hasImps && (app.importByNation[nId] ?? []).length > 5 ? html`<div class="tt-more-label text-end">${T.clickForAll}</div>` : nothing}`, tt);
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
  importByNation: {},
  nativeByNation: {},
  pop: {},
  eloRank: {},
};
const centroids = {};

const enablesDim = id => !!(app.byId[id] || (QUALIFIED_NAMES[id] && ((app.importByNation[id] ?? []).length > 0 || (app.nativeByNation[id] ?? []).length > 0)));

const fmtPop = pop => parseFloat(pop.toFixed(2))
  .toLocaleString(LOCALE, { maximumFractionDigits: 2, minimumFractionDigits: 2, useGrouping: false }) + 'M';
const popTag  = pop  => pop  ? html`<span class="tt-pop fw-normal text-nowrap">${fmtPop(pop)}</span>` : nothing;
const capTag  = cap  => { const c = cap?.[_LANG] ?? cap?.en ?? null; return c ? html`<span class="tt-pop fw-normal text-nowrap">${c}</span>` : nothing; };
const rankTag = name => { const r = app.eloRank[name]; return r ? html`<span class="tt-rank fw-normal text-nowrap">Elo #${r}</span>` : nothing; };
const flagImg = code => code ? html`<img class="tt-flag rounded-circle flex-shrink-0" src="${FLAG_CDN(code)}">` : nothing;
const ptWikiRow = p => {
  const url    = wikiUrl(p);
  const wikiEn = p.wiki_langs?.en ?? null;
  return url    ? html`<a href="${url}" target="_blank" rel="noopener" class="pt-wiki text-decoration-none">${p.name}</a>`
       : wikiEn ? html`${p.name} (<a href="${wikiEn}" target="_blank" rel="noopener" class="pt-wiki text-decoration-none">en</a>)`
       : p.name;
};

const SQUAD_SIZE = { 40: 25, 124: 25 }; // Austria, Canada — injuries reduced squad to 25

const buildImportColHtml = nationId => {
  const players   = (app.importByNation[nationId] ?? []).slice().sort((a, b) => b.caps - a.caps);
  if (players.length === 0) return html`<div class="tt-label">${T.noImport(countryName(nationId, QUALIFIED_NAMES[nationId]))}</div>`;
  const byBirth   = {};
  players.forEach(p => { const l = countryName(p.birthCountryId, p.birthCountry); byBirth[l] = (byBirth[l] ?? 0) + 1; });
  const nations   = Object.entries(byBirth).sort((a, b) => b[1] - a[1]);
  const top       = players.slice(0, 5);
  const squadSize = SQUAD_SIZE[nationId] ?? 26;
  const ratio     = (players.length / squadSize * 100).toFixed(0) + '%';

  const nationName = countryName(nationId, QUALIFIED_NAMES[nationId]);
  return html`
    <div class="tt-count-row d-flex justify-content-between align-items-center">
      <div class="tt-count color-imp">${players.length}</div>
      <div class="tt-sub">${ratio} ${T.ofSquad} (${squadSize})</div>
    </div>
    <div class="tt-label">${T.selectedByLabel(nationName)}</div>
    <div class="tt-nations mb-0 fst-italic">${nations.map(([n, c]) => `${n} (${c})`).join(', ')}</div>
    <div class="tt-players ${players.length > 5 ? 'tt-more' : ''}">
      ${top.map(p => html`
        <div class="tt-player">
          <span>${p.name}</span>
          <span class="tt-nation text-nowrap"><span class="color-imp">←</span> ${countryName(p.birthCountryId, p.birthCountry)}</span>
        </div>`)}
    </div>`;
};

const playerTableTemplate = sourceId => {
  const country       = app.byId[sourceId]?.country ?? QUALIFIED_NAMES[sourceId];
  const cnt           = app.byId[sourceId]?.count ?? 0;
  const exportPlayers = app.byId[sourceId]?.players ?? [];
  const nativePlayers = app.nativeByNation[sourceId] ?? [];
  const importPlayers = (app.importByNation[sourceId] ?? []).slice().sort((a, b) => b.caps - a.caps);
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

  return html`
    <div class="accordion accordion-flush mt-2" id="pt-acc">

      <div class="accordion-item">
        <h2 class="accordion-header">
          ${cnt > 0
            ? toggleHdr('exp', html`<span class="pt-title color-exp">${cnt} ${T.exported(cnt, name)} ${T.selectedBy(cnt)}</span>`)
            : staticHdr(html`<span class="pt-title color-exp">${T.noExport(name)}</span>`)}
        </h2>
        ${cnt > 0 ? html`
        <div id="acc-exp" class="accordion-collapse collapse">
          <div class="accordion-body px-0 pt-1">
            ${exportGroups.map(({ nation, players: gp }) => {
              const nationId = QUALIFIED_BY_NAME[nation];
              const nc = ISO2[nationId];
              return html`
                <div class="pt-nation-header d-flex align-items-center" @click=${() => { activateCountry(nationId, true); _zoomToActiveDimFlags(); }}>
                  ${nc ? html`<img src="${FLAG_CDN_RECT(nc)}">` : nothing}
                  <span class="pt-nation-name fw-medium">${countryName(nationId, nation)}</span>
                  <span class="pt-nation-count">${gp.length} ${T.players(gp.length)}</span>
                </div>
                ${gp.map(p => html`
                  <div class="pt-player-row d-flex justify-content-between align-items-center">
                    <span>${ptWikiRow(p)}</span>
                    <span class="pt-caps text-nowrap">${p.caps} ${T.caps}</span>
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
                <span class="pt-caps text-nowrap">${p.caps} ${T.caps}</span>
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
              const bc = birthCountryId != null ? ISO2[birthCountryId] : (_NULL_CODE[birthCountry] ?? null);
              const clickId = birthCountryId ?? _NULL_CENTROID_ID[birthCountry] ?? null;
              return html`
                <div class="pt-nation-header d-flex align-items-center${clickId != null ? ' pt-nation-clickable' : ''}" @click=${clickId != null ? () => { activateCountry(clickId, true); _zoomToActiveDimFlags(); } : null}>
                  ${bc ? html`<img src="${FLAG_CDN_RECT(bc)}">` : nothing}
                  <span class="pt-nation-name fw-medium">${label}</span>
                  <span class="pt-nation-count">${gp.length} ${T.players(gp.length)}</span>
                </div>
                ${gp.map(p => html`
                  <div class="pt-player-row d-flex justify-content-between align-items-center">
                    <span>${ptWikiRow(p)}</span>
                    <span class="pt-caps text-nowrap">${p.caps} ${T.caps}</span>
                  </div>`)}`;
            })}
          </div>
        </div>` : nothing}
      </div>

    </div>`;
};

const applyDim = (sourceId, destIds, country) => {
  dimState.active = true;
  if (_zoomSpanBtn) _zoomSpanBtn.disabled = false;
  dimState.sourceId = sourceId;
  dimState.destIds = destIds;

  // Build import ids: birth countries Y whose players represent nation sourceId
  dimState.importIds = new Map();
  (app.importByNation[sourceId] ?? []).forEach(p => {
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
      // Export arcs: A → X (blue)
      destIds.forEach((count, destId) => {
        const dst = centroids[destId];
        if (dst) drawArc(src, dst, count, 'export');
      });
      // Import arcs: Y → A (red, arrow points inward)
      dimState.importIds.forEach((count, birthId) => {
        if (birthId === sourceId) return;
        const ySrc = centroids[birthId];
        if (ySrc) drawArc(ySrc, src, count, 'import');
      });
    }
  }

  const fc = ISO2[sourceId];
  const countryDisplay = countryName(sourceId, country);
  const badgeW = Math.round(countryDisplay.length * 5.8 + 46);
  const bx = 895 - badgeW;
  g.selectAll('.flag-qualified').raise(); // all flags above arcs
  g.selectAll('.flag-qualified').filter(function() {
    return +this.getAttribute('data-id') === sourceId;
  }).raise(); // source flag above other flags

  // ── Player table + tab label ──────────────────────────────────────────────────
  const ptEl = document.getElementById('tab-players');
  if (ptEl) {
    _saveAccState(ptEl);
    render(playerTableTemplate(sourceId), ptEl);
    _restoreAccState(ptEl);
  }
  _updateChainSelection();
  _updateEloSelection();
  const _playersBtn = document.getElementById('tab-players-btn');
  if (_playersBtn) {
    _playersBtn.innerHTML = '';
    const isQualifiedBtn = !!QUALIFIED_NAMES[sourceId];
    const row = document.createElement('span');
    row.className = 'd-flex align-items-center gap-2 text-start';
    if (fc) {
      const _img = document.createElement('img');
      _img.src = FLAG_CDN(fc);
      _img.className = 'rounded-circle flex-shrink-0';
      _img.style.cssText = 'width:16px;height:16px';
      row.appendChild(_img);
    }
    const col = document.createElement('span');
    col.className = 'd-inline-flex align-items-baseline gap-1';
    const nameSpan = document.createElement('span');
    nameSpan.textContent = countryDisplay;
    nameSpan.className = (isQualifiedBtn ? 'text-body' : 'text-muted') + ' btn-name';
    col.appendChild(nameSpan);
    if (!isQualifiedBtn) {
      const tag = document.createElement('small');
      tag.textContent = T.notQualified;
      tag.className = 'tt-pop fst-italic';
      col.appendChild(tag);
    }
    row.appendChild(col);
    _playersBtn.appendChild(row);
    const closeSpan = document.createElement('span');
    closeSpan.className = 'btn-close btn-close-sm position-absolute top-0 end-0 m-1';
    closeSpan.style.cssText = 'font-size:0.5rem';
    closeSpan.setAttribute('aria-label', 'Close');
    closeSpan.addEventListener('click', e => { e.stopPropagation(); clearDim(); });
    _playersBtn.appendChild(closeSpan);
    _playersBtn.classList.add('dim-selected');
  }

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
  const _pb = document.getElementById('tab-players-btn');
  if (_pb) { _pb.innerHTML = '<img class="tab-icon" src="images/empty_tab_icon.svg" aria-hidden="true">'; _pb.classList.remove('dim-selected'); }
  _updateChainSelection();
  _updateEloSelection();
};

// ── Activate dim from anywhere (e.g. player-table nation clicks) ──────────────
const activateCountry = (id, scroll = false) => {
  if (id == null) return;
  const rec = app.byId[id];
  if (rec) {
    const destIds = new Map(rec.nations.flatMap(([n, c]) => {
      const did = QUALIFIED_BY_NAME[n];
      return did !== undefined ? [[did, c]] : [];
    }));
    applyDim(id, destIds, rec.country);
  } else if (QUALIFIED_NAMES[id] && ((app.importByNation[id] ?? []).length > 0 || (app.nativeByNation[id] ?? []).length > 0)) {
    applyDim(id, new Map(), QUALIFIED_NAMES[id]);
  } else {
    return;
  }
  if (scroll) window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ── Flag join helpers ─────────────────────────────────────────────────────────
const placeFlag = (sel) => {
  sel.attr('class','flag-qualified')
    .attr('width', FLAG).attr('height', FLAG)
    .on('mouseleave', () => { if (!dimState.active) { hideTip(); } });
};

// ── Main render ───────────────────────────────────────────────────────────────
// GU_A3 code (Natural Earth) → synthetic nation ID
const UK_GU_TO_ID = {ENG: 8260, SCT: 8261, WLS: 8262, NIR: 8263};

// ── Data index builder ──────────────────────────────────────────────────────
const buildIndices = rawData => {
const DATA = rawData.data;
if (rawData.natives) {
  Object.entries(rawData.natives).forEach(([name, players]) => {
    const nId = QUALIFIED_BY_NAME[name];
    if (nId != null) app.nativeByNation[nId] = players;
  });
}
DATA.forEach(d => {
  d.pop        = rawData.pop[ISO2[d.id]] || null;
  d.nativeCount = (app.nativeByNation[d.id] ?? []).length;
  d.totalCount  = d.count + d.nativeCount;
  d.ratio       = d.totalCount;
  app.byId[d.id] = d;
});
// Add coloring entries for qualified nations all of whose players play for their own country
Object.entries(app.nativeByNation).forEach(([nId, players]) => {
  const id = +nId;
  if (app.byId[id]) return;
  const name = QUALIFIED_NAMES[id];
  const pop  = rawData.pop[ISO2[id]] || null;
  app.byId[id] = { id, country: name, count: 0, nativeCount: players.length,
               totalCount: players.length, pop, ratio: players.length,
               players: [], top: [], nations: [] };
});
app.pop      = rawData.pop;
app.capital  = rawData.capital ?? {};
app.eloRank = {};  // populated by wc2026_elo_rank.json fetch below
OUTLIER_IDS.forEach(id => {
  const el = document.getElementById('legend-outlier-count');
  if (el && app.byId[id]) el.textContent = app.byId[id].totalCount;
});

DATA.forEach(rec => {
  rec.players.forEach(p => {
    const nId = QUALIFIED_BY_NAME[p.nation];
    if (nId == null) return;
    if (countryName(rec.id, rec.country) === countryName(nId, QUALIFIED_NAMES[nId])) return;
    if (!app.importByNation[nId]) app.importByNation[nId] = [];
    app.importByNation[nId].push({ name: p.name, birthCountry: rec.country, birthCountryId: rec.id, caps: p.caps, wiki_langs: p.wiki_langs });
  });
});};


// ── Shared tooltip/click helpers (used by both world and UK nation paths) ──────

const showExportTip = (event, id) => {
  const rec        = app.byId[id];
  if (!rec) { hideTip(); return; }
  const hasImports   = !!QUALIFIED_NAMES[id] && (app.importByNation[id] ?? []).length > 0;
  const importCount  = hasImports ? (app.importByNation[id] ?? []).length : 0;
  if (lastTipKey !== id) {
    lastTipKey = id;
    const exportRatio = rec.pop && rec.count ? rec.count / rec.pop : null;
    const _r2   = exportRatio !== null ? exportRatio.toFixed(2) : '?';
    const ratio = _r2 === '0.00' ? exportRatio.toPrecision(2) : _r2;
    const fc    = ISO2[rec.id];

    const leftCol = html`
      <div class="tt-count-row d-flex justify-content-between align-items-center">
        <div class="tt-count color-exp">${rec.count}</div>
        <div class="tt-sub">${ratio} ${T.perMillion}</div>
      </div>
      <div class="tt-label">${T.exported(rec.count, countryName(rec.id, rec.country))} ${T.selectedBy(rec.count)}</div>
      <div class="tt-nations mb-0 fst-italic">${rec.nations.map(([n, c]) => `${countryName(QUALIFIED_BY_NAME[n], n)} (${c})`).join(', ')}</div>
      <div class="tt-players ${rec.count > rec.top.length ? 'tt-more' : ''}">
        ${rec.top.map(p => html`
          <div class="tt-player">
            <span>${p.name}</span>
            <span class="tt-nation text-nowrap"><span class="color-exp">→</span> ${countryName(QUALIFIED_BY_NAME[p.nation], p.nation)}</span>
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
        <span class="tt-name-inner d-flex align-items-center gap-2">${flagImg(fc)}${!QUALIFIED_NAMES[id] ? html`<span class="d-inline-flex flex-column lh-sm gap-1"><span class="text-muted">${countryName(rec.id, rec.country)}</span><small class="tt-pop fst-italic">${T.notQualified}</small></span>` : countryName(rec.id, rec.country)}</span>
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(rec.pop)}${rankTag(rec.country)}${capTag(app.capital[ISO2[rec.id]])}</span>
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
    const destFc = ISO2[destId];

    render(html`
      <div class="tt-name tt-name-inner d-flex align-items-center gap-2">
        <span class="tt-name-inner d-flex align-items-center gap-2">${flagImg(destFc)}${countryName(destId, destName)}</span>
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(app.pop[destFc])}${rankTag(destName)}${capTag(app.capital[destFc])}</span>
      </div>
      <div class="tt-nations mb-0 fst-italic"><span class="color-exp">←</span> ${countryName(dimState.sourceId, srcRec.country)} (${allPlayers.length})</div>
      <div class="tt-players ${allPlayers.length > 5 ? 'tt-more' : ''}">
        ${players.map(p => html`<div class="tt-player"><span>${p.name}</span></div>`)}
      </div>
      ${allPlayers.length > 5 ? html`<div class="tt-more-label text-end">${T.clickForAll}</div>` : nothing}`, tt);
  }
  positionTip(event, 48 + 20 + 24 * players.length + (allPlayers.length > 5 ? 18 : 0));
};

const showImportSourceTip = (event, centroidId) => {
  const key        = `impsrc-${dimState.sourceId}-${centroidId}`;
  const allPlayers = (app.importByNation[dimState.sourceId] ?? []).filter(p => {
    const bid = p.birthCountryId != null ? p.birthCountryId : (_NULL_CENTROID_ID[p.birthCountry] ?? null);
    return bid === centroidId;
  });
  if (allPlayers.length === 0) { hideTip(); return; }
  const players    = allPlayers.slice(0, 5);
  if (lastTipKey !== key) {
    lastTipKey = key;
    const p0  = allPlayers[0];
    const bFc = p0.birthCountryId != null ? ISO2[p0.birthCountryId] : (_NULL_CODE[p0.birthCountry] ?? null);

    render(html`
      <div class="tt-name tt-name-inner d-flex align-items-center gap-2">
        <span class="tt-name-inner d-flex align-items-center gap-2">${flagImg(bFc)}${countryName(p0.birthCountryId, p0.birthCountry)}</span>
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(app.pop[bFc])}${rankTag(p0.birthCountry)}${capTag(app.capital[bFc])}</span>
      </div>
      <div class="tt-nations mb-0 fst-italic"><span class="color-imp">→</span> ${countryName(dimState.sourceId, QUALIFIED_NAMES[dimState.sourceId])} (${allPlayers.length})</div>
      <div class="tt-players ${allPlayers.length > 5 ? 'tt-more' : ''}">
        ${players.map(p => html`<div class="tt-player"><span>${p.name}</span></div>`)}
      </div>
      ${allPlayers.length > 5 ? html`<div class="tt-more-label text-end">${T.clickForAll}</div>` : nothing}`, tt);
  }
  positionTip(event, 48 + 20 + 24 * players.length + (allPlayers.length > 5 ? 18 : 0));
};

const showCombinedTip = (event, id) => {
  const key           = `combined-${dimState.sourceId}-${id}`;
  const exportPlayers = (app.importByNation[dimState.sourceId] ?? []).filter(p => {
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
    const fc      = ISO2[id];
    const hasBoth = exportPlayers.length > 0 && importPlayers.length > 0;

    render(html`
      <div class="tt-name tt-name-inner d-flex align-items-center gap-2">
        <span class="tt-name-inner d-flex align-items-center gap-2">${flagImg(fc)}${countryName(id, destName)}</span>
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(app.pop[fc])}${rankTag(destName)}${capTag(app.capital[fc])}</span>
      </div>
      ${exportPlayers.length > 0 ? html`
        <div class="tt-nations mb-0 fst-italic"><span class="color-imp">→</span> ${countryName(dimState.sourceId, QUALIFIED_NAMES[dimState.sourceId])} (${exportPlayers.length})</div>
        <div class="tt-players ${exportPlayers.length > 5 ? 'tt-more' : ''}">
          ${topExp.map(p => html`<div class="tt-player"><span>${p.name}</span></div>`)}
        </div>` : nothing}
      ${hasBoth ? html`<div class="tt-divider"></div>` : nothing}
      ${importPlayers.length > 0 ? html`
        <div class="tt-nations mb-0 fst-italic"><span class="color-exp">←</span> ${countryName(dimState.sourceId, srcRec.country)} (${importPlayers.length})</div>
        <div class="tt-players ${importPlayers.length > 5 ? 'tt-more' : ''}">
          ${topImp.map(p => html`<div class="tt-player"><span>${p.name}</span></div>`)}
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
        <span class="tt-name-inner d-flex align-items-center gap-2">${flagImg(fc)}<span class="d-inline-flex flex-column lh-sm gap-1"><span class="text-muted">${name}</span><small class="tt-pop fst-italic">${T.notQualified}</small></span></span>
        <span class="tt-pop-rank d-flex flex-column align-items-end flex-shrink-0 ms-2">${popTag(app.pop[fc])}${capTag(app.capital[fc])}</span>
      </div>`, tt);
  }
  tt.classList.add('tt-non-qualified');
  positionTip(event, 60, false);
};

const onCountryMousemove = (event, id, topoName = '') => {
  const _flagEl = g.select(`.flag-qualified[data-id="${id}"]`).node();
  if (_flagEl?.getAttribute('visibility') === 'hidden') { hideTip(); return; }
  if (dimState.active && _flagEl && !_flagEl.hasAttribute('data-dim-visible') && id !== dimState.sourceId) { hideTip(); return; }
  if (!dimState.active) {
    const hlName = countryName(id, QUALIFIED_NAMES[id] ?? app.byId[id]?.country ?? topoName);
    const hlBadgeW = Math.round(hlName.length * 5.8 + 46);
    const hlBx = 895 - hlBadgeW;
    if (app.byId[id]?.count > 0) showExportTip(event, id);
    else if (QUALIFIED_NAMES[id]) showQualifiedTip(event, QUALIFIED_NAMES[id], ISO2[id]);
    else showSimpleTip(event, id, topoName);
  } else {
    const inDest = dimState.destIds.has(id), inImport = dimState.importIds.has(id);
    if      (inDest && inImport) showCombinedTip(event, id);
    else if (inDest)             showImportTip(event, id);
    else if (inImport)           showImportSourceTip(event, id);
    else if (id === dimState.sourceId) {
      if (app.byId[id]?.count > 0) showExportTip(event, id);
      else if (QUALIFIED_NAMES[id]) showQualifiedTip(event, QUALIFIED_NAMES[id], ISO2[id]);
    } else hideTip();
  }
};

const onCountryClick = (event, id) => {
  event.stopPropagation();
  if (dimState.active) {
    if (id === dimState.sourceId) { clearDim(); return; }
    if (dimState.destIds.has(id) || dimState.importIds.has(id)) { activateCountry(id); return; }
    if (enablesDim(id)) { activateCountry(id); return; }
    clearDim();
    return;
  }
  if (enablesDim(id)) { activateCountry(id); return; }
  zoomToCentroid(id);
};
// ── World render ────────────────────────────────────────────────────────────
const renderWorld = (world, ukNations) => {

// Patch topojson geometries that have no numeric id but a known name.
// Kosovo appears in the 110m dataset with only {properties:{name:'Kosovo'}} — no id field.
const _topoNameToId = { Kosovo: 383 };
world.objects.countries.geometries.forEach(g => {
  if (!g.id) { const mapped = _topoNameToId[g.properties?.name]; if (mapped) g.id = mapped; }
});

// ── World choropleth (skip UK polygon — rendered separately below) ────────────
g.selectAll('.country')
  .data(topojson.feature(world, world.objects.countries).features
    .filter(d => +d.id !== 826))
  .join('path')
  .attr('class','country')
  .attr('d', path)
  .attr('fill', d => choroFill(+d.id, app.byId))
  .attr('stroke','#ccc8c0').attr('stroke-width',.3)
  .attr('data-enables-dim', d => enablesDim(+d.id) ? '' : null)
  .style('cursor', 'pointer')
  .on('mousemove', (event, d) => onCountryMousemove(event, +d.id, d.properties?.name))
  .on('mouseleave', () => { if (!dimState.active) { hideTip(); } })
  .on('click',     (event, d) => onCountryClick(event, +d.id));

g.append('path')
  .datum(topojson.mesh(world, world.objects.countries, (a,b) => a!==b))
  .attr('fill','none').attr('stroke','#b8b0a8').attr('stroke-width',.3).attr('d', path);

// ── UK home nations (separate polygons from uk-nations.geojson) ───────────────
const ukFeatures = ukNations.features.map(f => ({...f, _id: UK_GU_TO_ID[f.properties.GU_A3]}));
_ukFeatures = ukFeatures;

g.selectAll('.country-uk')
  .data(ukFeatures)
  .join('path')
  .attr('class','country country-uk')
  .attr('d', path)
  .attr('fill', d => choroFill(d._id, app.byId))
  .attr('stroke','#ccc8c0').attr('stroke-width',.3)
  .attr('data-enables-dim', d => enablesDim(d._id) ? '' : null)
  .style('cursor', 'pointer')
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

worldFeatures.forEach(d => {
  const fp = FLAG_POS_OVERRIDE[+d.id];
  if (!fp) return;
  const [cx, cy] = dotCentroid(d);
  const [fx, fy] = projection(fp);
  appendLeaderLine(cx, cy, fx, fy);
});

STANDALONE_FLAGS.forEach(({ lon, lat, dLon = 0, dLat = 0 }) => {
  const [cx, cy] = projection([lon, lat]);
  const [fx, fy] = projection([lon + dLon, lat + dLat]);
  appendLeaderLine(cx, cy, fx, fy);
});

g.selectAll('.flag-qualified')
  .data(worldFeatures.filter(d => QUALIFIED_NAMES[+d.id] && !STANDALONE_IDS.has(+d.id)))
  .join('image')
  .call(placeFlag)
  .attr('href', d => FLAG_CDN(ISO2[+d.id]))
  .attr('data-id', d => +d.id)
  .each(function(d) {
    const [cx, cy] = dotCentroid(d);
    const fp = FLAG_POS_OVERRIDE[+d.id];
    const [fx, fy] = fp ? projection(fp) : [cx, cy];
    const sel = d3.select(this)
      .attr('data-cx', fx).attr('data-cy', fy)
      .attr('x', fx - FLAG/2).attr('y', fy - FLAG/2);
    if (fp) sel.classed('offset-flag', true)
      .attr('data-centroid-cx', cx).attr('data-centroid-cy', cy)
      .attr('data-flag-dx', fx - cx).attr('data-flag-dy', fy - cy);
  })
  .attr('pointer-events', 'all')
  .attr('data-enables-dim', d => enablesDim(+d.id) ? '' : null)
  .attr('cursor', 'pointer')
  .on('mousemove', (event, d) => onCountryMousemove(event, +d.id))
  .on('click',     (event, d) => onCountryClick(event, +d.id));

// Dot markers at true island centroid — choropleth color, zoom-stable, interactive
STANDALONE_FLAGS.forEach(({ id, lon, lat }) => {
  const [cx, cy] = projection([lon, lat]);
  g.append('circle')
    .attr('class', 'flag-qualified standalone-dot')
    .attr('data-id', id)
    .attr('data-cx', cx).attr('data-cy', cy)
    .attr('cx', cx).attr('cy', cy)
    .attr('r', DOT_R)
    .attr('fill', choroFill(id, app.byId))
    .attr('stroke', '#fff')
    .attr('stroke-width', 0.5)
    .attr('data-enables-dim', enablesDim(id) ? '' : null)
    .attr('cursor', 'pointer')
    .on('mousemove', (event) => onCountryMousemove(event, id))
    .on('click',     (event) => onCountryClick(event, id));
});

STANDALONE_FLAGS.forEach(({ id, lon, lat, dLon = 0, dLat = 0 }) => {
  const [cx, cy] = projection([lon, lat]);
  const [fx, fy] = projection([lon + dLon, lat + dLat]);
  g.append('image')
    .call(placeFlag)
    .classed('offset-flag', true)
    .attr('href', FLAG_CDN(ISO2[id]))
    .attr('data-id', id)
    .attr('data-cx', fx).attr('data-cy', fy)
    .attr('data-centroid-cx', cx).attr('data-centroid-cy', cy)
    .attr('data-flag-dx', fx - cx).attr('data-flag-dy', fy - cy)
    .attr('x', fx - FLAG/2).attr('y', fy - FLAG/2)
    .attr('pointer-events', 'all')
    .attr('data-enables-dim', enablesDim(id) ? '' : null)
    .attr('cursor', 'pointer')
    .on('mousemove', (event) => onCountryMousemove(event, id))
    .on('click',     (event) => onCountryClick(event, id));
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
      .attr('href', FLAG_CDN(ISO2[f._id]))
      .attr('data-id', f._id)
      .attr('data-cx', cx).attr('data-cy', cy)
      .attr('x', cx - FLAG/2).attr('y', cy - FLAG/2)
      .attr('pointer-events', 'all')
      .attr('data-enables-dim', enablesDim(f._id) ? '' : null)
      .attr('cursor', 'pointer')
      .on('mousemove', (event) => onCountryMousemove(event, f._id))
      .on('click',     (event) => onCountryClick(event, f._id));
  });

// ── Stamp existing qualified flags with elo-filter category ──────────────────
g.selectAll('.flag-qualified[data-id]').attr('data-elo-cat', function() {
  return _flagCat(+this.getAttribute('data-id'));
});

// ── Non-qualified flags (E = exporter, O = other) ────────────────────────────
worldFeatures
  .filter(d => { const id = +d.id; return id !== 826 && !QUALIFIED_NAMES[id] && !STANDALONE_IDS.has(id) && iso2ForId(id); })
  .forEach(d => {
    const id = +d.id;
    const [cx, cy] = dotCentroid(d);
    g.append('image')
      .call(placeFlag)
      .attr('href', FLAG_CDN(iso2ForId(id)))
      .attr('data-id', id)
      .attr('data-elo-cat', _flagCat(id))
      .attr('data-cx', cx).attr('data-cy', cy)
      .attr('x', cx - FLAG/2).attr('y', cy - FLAG/2)
      .attr('pointer-events', 'all')
      .attr('data-enables-dim', enablesDim(id) ? '' : null)
      .attr('cursor', 'pointer')
      .on('mousemove', (event) => onCountryMousemove(event, id))
      .on('click',     (event) => onCountryClick(event, id));
  });

_applyFlagFilter();

// ── Centroids map (for arc drawing) ──────────────────────────────────────────
topojson.feature(world, world.objects.countries).features
  .filter(f => +f.id !== 826)
  .forEach(f => { centroids[+f.id] = dotCentroid(f); });
// UK nation centroids set above when placing flags
STANDALONE_FLAGS.forEach(({ id, lon, lat }) => { centroids[id] = projection([lon, lat]); });


};

Promise.all([
  fetch('wc2026_map_data.json').then(r => r.json()),
  d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
  fetch('uk-nations.geojson').then(r => r.json())
]).then(([rawData, world, ukNations]) => {
  buildIndices(rawData);
  renderWorld(world, ukNations);
  _renderElo();
  _updateVisibleCountryCount();
  // Initial zoom: fit all qualified + exporting flags so Antarctica is off-screen
  const xs = [], ys = [];
  g.selectAll('.flag-qualified[data-elo-cat]:not([data-elo-cat="o"])').each(function() {
    const cx = +this.getAttribute('data-cx');
    const cy = +this.getAttribute('data-cy');
    if (isFinite(cx) && isFinite(cy)) { xs.push(cx); ys.push(cy); }
  });
  if (xs.length) {
    const [vbX, vbY, vbW, vbH] = svg.attr('viewBox').split(' ').map(Number);
    const x0 = Math.min(...xs), x1 = Math.max(...xs);
    const y0 = Math.min(...ys), y1 = Math.max(...ys);
    const pad = 20;
    const k = Math.max(1, Math.min(12, Math.min(vbW / (x1 - x0 + 2 * pad), vbH / (y1 - y0 + 2 * pad))));
    const tx = vbX + vbW / 2 - k * (x0 + x1) / 2;
    const ty = vbY + vbH / 2 - k * (y0 + y1) / 2;
    _initialTransform = d3.zoomIdentity.translate(tx, ty).scale(k);
    svg.call(zoom.transform, _initialTransform);
  }
  // Re-measure after reflow triggered by renderWorld + initial zoom
  requestAnimationFrame(() => {
    if (_pageHeader) document.documentElement.style.setProperty('--page-header-h', _pageHeader.getBoundingClientRect().bottom + 'px');
    _syncPaddingTop();
    _syncMapHeight();
  });
});

// ── Legend gradient ───────────────────────────────────────────────────────────
const bar = document.getElementById('legend-bar');
const stops = Array.from({length: 60}, (_, i) => {
  const v = RATIO_MIN + (i / 59) * (RATIO_MAX - RATIO_MIN);
  return color(v);
});
bar.style.background = `linear-gradient(to left, ${stops.join(',')})`;
bar.style.borderRadius = '5px';
