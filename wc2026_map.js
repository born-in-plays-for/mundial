import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { renderChain } from './chains/wc2026_chain_render.js';
import { renderEloRanking } from './wc2026_elo_ranking.js';
import { LOCALE, T, countryName, wikiUrl } from './i18n.js';
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
  .scaleExtent([1, 12])
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
  el.innerHTML = `<p class="pq-text fst-italic">${q.text}</p><p class="pq-attr"><span class="pq-author">${q.author}</span>${q.sep}<cite>${q.work}</cite>, ${q.ref}</p>`;
});
const _zoomHintEl = document.getElementById('zoom-hint');
_zoomHintEl.innerHTML = `${T.zoomHint} · <span id="zoom-reset">${T.zoomReset}</span>`;
document.getElementById('zoom-reset').addEventListener('click', e => {
  e.stopPropagation();
  svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity);
});
document.getElementById('map').setAttribute('aria-label', T.mapAriaLabel);
const _tabSvg = (w, inner) => `<svg viewBox="0 0 ${w} 24" width="${w}" height="24" fill="none" stroke="#777" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${inner}</svg>`;
const _EMPTY_TAB_SVG = _tabSvg(24, `<circle cx="12" cy="12" r="7"/><line x1="5" y1="19" x2="19" y2="5"/>`);
const _SNAKE_SVG     = _tabSvg(46, `<polyline points="2,2 36,2 36,10 2,10 2,18 28,18"/><polygon points="29,14 39,18 29,23" fill="#777" stroke="none"/>`);
const _ELO_SVG       = `<svg width="36" height="36" viewBox="0 0 476.473 476.474" fill="none" stroke="#777" stroke-width="20" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="10,370 10,200 152,200 152,112 316,112 316,238 465,238 465,370 10,370"/><path fill="#777" stroke="none" d="M243.48,134.334c-0.825,0.165-1.633,0.457-2.344,0.987c-7.81,5.819-15.861,11.314-23.244,17.685c-7.627,6.583,3.453,17.564,11.029,11.029c3.187-2.75,6.52-5.299,9.899-7.795c-0.229,18.382-0.63,36.762-0.681,55.145c-0.025,10.062,15.577,10.057,15.603,0c0.061-23.404,0.802-46.794,0.868-70.198C254.625,134.672,248.101,132.404,243.48,134.334z"/><path fill="#777" stroke="none" d="M112.476,285.919c-4.804,0-9.6,0.051-14.394,0.157c8.163-8.282,14.254-18.448,15.138-29.854c1.991-25.755-32.042-21.235-47.017-16.818c-9.625,2.834-5.527,17.891,4.148,15.041c5.33-1.574,29.597-9.343,27.025,3.413c-2.709,13.426-16.547,23.998-27.835,29.995c-2.471,1.311-3.61,3.296-3.829,5.383c-1.678,4.783,0.584,10.761,6.896,10.019c13.253-1.548,26.535-1.731,39.867-1.731C122.538,301.519,122.538,285.919,112.476,285.919z"/><path fill="#777" stroke="none" d="M373.319,288.661c5.397-1.138,10.785-2.097,16.274-2.574c2.691-0.239,5.81-0.29,8.293-0.076c-1.849,2.473-4.276,4.672-6.617,6.692c-1.533,0.178-3.017,0.873-4.296,2.234c-2.706,2.904-3.188,8.663,0,11.477c4.611,4.082,9.217,8.43,12.294,13.989c0.264,0.493,0.503,0.99,0.736,1.498c0.041,0.122,0.066,0.214,0.173,0.519c0.046,0.162,0.081,0.335,0.122,0.502c-0.082,0.021-0.117,0.031-0.152,0.041c-0.285,0.021-0.569,0.051-0.858,0.056c-2.311,0.112-3.428-0.203-5.946-0.889c-6.586-1.787-12.578-5.57-18.215-9.526c-8.19-5.753-15.768,8.303-7.638,14.016c11.004,7.733,31.316,19.565,43.646,8.201c10.456-9.644,1.818-23.704-6.683-33.139c8.079-8.161,16.188-20.125,4.769-28.854c-4.397-3.356-11.167-3.301-16.296-3.164c-7.916,0.214-15.873,1.722-23.627,3.357C359.725,275.032,363.788,290.672,373.319,288.661z"/></svg>`;
document.getElementById('tab-players-btn').innerHTML = _EMPTY_TAB_SVG;
document.getElementById('tab-elo-btn').innerHTML    = _ELO_SVG;
document.getElementById('tab-chain-btn').innerHTML   = _SNAKE_SVG;
render(html`<p class="py-4 text-center sub fst-italic">${T.tabPlayersHint}</p>`, document.getElementById('tab-players'));

// Chain tab: load data lazily, render when tab is shown, re-render on resize
// Both callbacks reference symbols defined later in the module — safe because they
// are only invoked on user interaction, after the module has fully loaded.
const _chainOnClick    = node => activateCountry(ISO2_REVERSE[node.code]);
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
  });
};
// On selection change: surgical update only — no SVG rebuild, no flicker.
const _updateChainSelection = () => {
  if (_chainUpdate && document.getElementById('tab-chain')?.classList.contains('active'))
    _chainUpdate(_chainGetIndex());
};
fetch('./chains/wc2026_chain_longest.json').then(r => r.json()).then(d => {
  _chainData = d;
  if (document.getElementById('tab-chain')?.classList.contains('active')) _renderChain();
});
document.getElementById('tab-chain-btn')?.addEventListener('shown.bs.tab', () => {
  if (_chainData) _renderChain();
});

// Elo ranking tab — two-column layout: ranking list (flex:1) + collapsible sidebar
let _eloUpdate = null;
let _eloData   = null;
const _eloMain    = document.createElement('div');
_eloMain.className = 'elo-main';
const _filterSidebar = document.createElement('div');
_filterSidebar.id = 'filter-sidebar';
_filterSidebar.classList.add('collapsed');
const _eloLayout  = document.createElement('div');
_eloLayout.className = 'elo-layout';
document.getElementById('page-header')?.appendChild(_filterSidebar);
_eloLayout.appendChild(_eloMain);
document.getElementById('tab-elo')?.appendChild(_eloLayout);

// ── Persistent filter table — isQualified × isImporting × isExporting cube ──
// Row and column headers are clickable: toggles all checkboxes in that row/column.
// The same DOM node is re-appended on each render so checked state survives tab switches.
const _filterGrp = document.createElement('div');
_filterGrp.innerHTML = `<table class="filter-table table table-sm table-bordered">
  <thead><tr>
    <th colspan="2" class="ftbl-col" data-col="all" style="text-align:left">Country<span class="filter-count" style="float:right;margin-left:8px"></span></th>
    <th class="ftbl-col" data-col="exp">Exporter<sup style="color:#3b82f6">●</sup></th>
    <th class="ftbl-col" data-col="nexp">Non-exp.</th>
  </tr></thead>
  <tbody>
    <tr>
      <td rowspan="2" class="ftbl-grp" data-row="q">Qualified</td>
      <td class="ftbl-sub" data-row="qi">Importer<sup style="color:#ef4444">●</sup></td>
      <td><input type="checkbox" class="form-check-input" id="filter-qie" checked></td>
      <td><input type="checkbox" class="form-check-input" id="filter-qi"  checked></td>
    </tr>
    <tr>
      <td class="ftbl-sub" data-row="qni">Non-imp.</td>
      <td><input type="checkbox" class="form-check-input" id="filter-qe"  checked></td>
      <td><input type="checkbox" class="form-check-input" id="filter-q"   checked></td>
    </tr>
    <tr>
      <td colspan="2" class="ftbl-grp ftbl-grp--nq" data-row="nq">Non-Qualified</td>
      <td><input type="checkbox" class="form-check-input" id="filter-e"   checked></td>
      <td><input type="checkbox" class="form-check-input" id="filter-o"></td>
    </tr>
  </tbody>
</table>`;

const _fltQIE = _filterGrp.querySelector('#filter-qie');
const _fltQI  = _filterGrp.querySelector('#filter-qi');
const _fltQE  = _filterGrp.querySelector('#filter-qe');
const _fltQ   = _filterGrp.querySelector('#filter-q');
const _fltE   = _filterGrp.querySelector('#filter-e');
const _fltO   = _filterGrp.querySelector('#filter-o');

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
const _catChecked = cat => ({qie:_fltQIE,qi:_fltQI,qe:_fltQE,q:_fltQ,e:_fltE,o:_fltO})[cat].checked;
const _applyFlagFilter = () => {
  d3.selectAll('.flag-qualified[data-elo-cat]')
    .attr('visibility', function() { return _catChecked(this.getAttribute('data-elo-cat')) ? null : 'hidden'; });
};
const _filterToggle = chks => { const on = chks.every(c => c.checked); chks.forEach(c => c.checked = !on); _renderElo(); _applyFlagFilter(); };
_filterGrp.querySelector('[data-row="q"]'   ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQI, _fltQE, _fltQ]));
_filterGrp.querySelector('[data-row="qi"]'  ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQI]));
_filterGrp.querySelector('[data-row="qni"]' ).addEventListener('click', () => _filterToggle([_fltQE,  _fltQ]));
_filterGrp.querySelector('[data-row="nq"]'  ).addEventListener('click', () => _filterToggle([_fltE,   _fltO]));
_filterGrp.querySelector('[data-col="exp"]' ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQE, _fltE]));
_filterGrp.querySelector('[data-col="nexp"]').addEventListener('click', () => _filterToggle([_fltQI,  _fltQ,  _fltO]));
const _filterCountEl = _filterGrp.querySelector('.filter-count');
_filterGrp.querySelector('[data-col="all"]').addEventListener('click', () => _filterToggle([_fltQIE, _fltQI, _fltQE, _fltQ, _fltE, _fltO]));
_filterGrp.addEventListener('change', () => { _renderElo(); _applyFlagFilter(); });
const _filterSidebarToggle = document.createElement('button');
_filterSidebarToggle.className = 'filter-sidebar-toggle';
_filterSidebarToggle.title = 'Toggle filter';
_filterSidebarToggle.textContent = '‹';
_filterSidebarToggle.addEventListener('click', () => {
  const collapsed = _filterSidebar.classList.toggle('collapsed');
  _filterSidebarToggle.textContent = collapsed ? '‹' : '›';
});
const _filterSidebarBody = document.createElement('div');
_filterSidebarBody.className = 'filter-sidebar-body';
_filterSidebarBody.appendChild(_filterGrp);
_filterSidebar.appendChild(_filterSidebarToggle);
_filterSidebar.appendChild(_filterSidebarBody);
// Measure natural height before first collapse (remove→measure→re-add, no paint between)
_filterSidebar.classList.remove('collapsed');
document.documentElement.style.setProperty('--filter-sidebar-h', _filterSidebarBody.scrollHeight + 'px');
_filterSidebar.classList.add('collapsed');

const _buildEloItems = () => (_eloData?.rankings ?? [])
  .map(({ id, rank, pts, iso2, name }) => ({
    id, rank, pts, iso2, name: countryName(id, name),
    exp: (app.byId[id]?.count ?? 0) > 0,
    imp: (app.importByNation[id]?.length ?? 0) > 0,
  }))
  .filter(({ id }) => _catChecked(_flagCat(id)));

const _renderElo = () => {
  const items = _buildEloItems();
  _filterCountEl.textContent = items.length;
  _eloUpdate = renderEloRanking(_eloMain, {
    items,
    onCountryClick: id => { activateCountry(id); window.scrollTo({ top: 0, behavior: 'smooth' }); },
    isClickable: id => enablesDim(id),
    isMuted:     id => !QUALIFIED_NAMES[id],
    getSelectedId: () => dimState.sourceId,
    source: _eloData?.source,
    date: _eloData?.updated,
  });
};
const _updateEloSelection = () => {
  if (_eloUpdate && document.getElementById('tab-elo')?.classList.contains('active'))
    _eloUpdate(dimState.sourceId);
};
fetch('./wc2026_elo_rank.json').then(r => r.json()).then(d => {
  _eloData = d;
  app.eloRank = Object.fromEntries(
    d.rankings.flatMap(({id, rank}) => { const n = QUALIFIED_NAMES[id]; return n ? [[n, rank]] : []; })
  );
  if (document.getElementById('tab-elo')?.classList.contains('active')) _renderElo();
}).catch(() => {});
document.getElementById('tab-elo-btn')?.addEventListener('shown.bs.tab', _renderElo);
let _chainResizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(_chainResizeTimer);
  _chainResizeTimer = setTimeout(() => {
    if (_chainData && document.getElementById('tab-chain')?.classList.contains('active')) _renderChain();
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
  531:'cw'
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
        <span class="tt-pop-rank d-flex align-items-center flex-shrink-0 ms-2">${popTag(app.pop[name])}${rankTag(name)}</span>
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

const fmtPop = pop => (pop < 1 ? parseFloat(pop.toFixed(2)) : parseFloat(pop.toFixed(1)))
  .toLocaleString(LOCALE, { maximumFractionDigits: pop < 1 ? 2 : 1, minimumFractionDigits: 0, useGrouping: false }) + 'M';
const popTag  = pop  => pop  ? html`<span class="tt-pop fw-normal text-nowrap">${T.pop} ${fmtPop(pop)}</span>` : nothing;
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
                <div class="pt-nation-header d-flex align-items-center" @click=${() => activateCountry(nationId, true)}>
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
                <div class="pt-nation-header d-flex align-items-center${clickId != null ? ' pt-nation-clickable' : ''}" @click=${clickId != null ? () => activateCountry(clickId, true) : null}>
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
    nameSpan.className = isQualifiedBtn ? 'text-body' : 'text-muted';
    col.appendChild(nameSpan);
    if (!isQualifiedBtn) {
      const tag = document.createElement('small');
      tag.textContent = T.notQualified;
      tag.className = 'tt-pop fst-italic';
      col.appendChild(tag);
    }
    row.appendChild(col);
    _playersBtn.appendChild(row);
  }

  document.body.classList.add('dim-active');
};
const clearDim = () => {
  dimState.active = false;
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
  if (_pb) _pb.innerHTML = _EMPTY_TAB_SVG;
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
  d.pop        = rawData.pop[d.country] || null;
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
  const pop  = rawData.pop[name] || null;
  app.byId[id] = { id, country: name, count: 0, nativeCount: players.length,
               totalCount: players.length, pop, ratio: players.length,
               players: [], top: [], nations: [] };
});
app.pop      = rawData.pop;
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
        <span class="tt-pop-rank d-flex align-items-center flex-shrink-0 ms-2">${popTag(rec.pop)}${rankTag(rec.country)}</span>
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
        <span class="tt-pop-rank d-flex align-items-center flex-shrink-0 ms-2">${popTag(app.pop[destName])}${rankTag(destName)}</span>
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
        <span class="tt-pop-rank d-flex align-items-center flex-shrink-0 ms-2">${popTag(app.pop[p0.birthCountry])}${rankTag(p0.birthCountry)}</span>
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
        <span class="tt-pop-rank d-flex align-items-center flex-shrink-0 ms-2">${popTag(app.pop[destName])}${rankTag(destName)}</span>
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

const onCountryMousemove = (event, id, topoName = '') => {
  if (!dimState.active) {
    const hlName = countryName(id, QUALIFIED_NAMES[id] ?? app.byId[id]?.country ?? topoName);
    const hlBadgeW = Math.round(hlName.length * 5.8 + 46);
    const hlBx = 895 - hlBadgeW;
    if (app.byId[id]?.count > 0) showExportTip(event, id);
    else if (QUALIFIED_NAMES[id]) showQualifiedTip(event, QUALIFIED_NAMES[id], ISO2[id]);
    else hideTip();
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
    if (dimState.destIds.has(id) || dimState.importIds.has(id)) { activateCountry(id); return; }
    clearDim();
    return;
  }
  activateCountry(id);
};
// ── World render ────────────────────────────────────────────────────────────
const renderWorld = (world, ukNations) => {

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
  .style('cursor', d => enablesDim(+d.id) ? 'pointer' : 'default')
  .on('mousemove', (event, d) => onCountryMousemove(event, +d.id, d.properties?.name))
  .on('mouseleave', () => { if (!dimState.active) { hideTip(); } })
  .on('click',     (event, d) => onCountryClick(event, +d.id));

g.append('path')
  .datum(topojson.mesh(world, world.objects.countries, (a,b) => a!==b))
  .attr('fill','none').attr('stroke','#b8b0a8').attr('stroke-width',.3).attr('d', path);

// ── UK home nations (separate polygons from uk-nations.geojson) ───────────────
const ukFeatures = ukNations.features.map(f => ({...f, _id: UK_GU_TO_ID[f.properties.GU_A3]}));

g.selectAll('.country-uk')
  .data(ukFeatures)
  .join('path')
  .attr('class','country country-uk')
  .attr('d', path)
  .attr('fill', d => choroFill(d._id, app.byId))
  .attr('stroke','#ccc8c0').attr('stroke-width',.3)
  .attr('data-enables-dim', d => enablesDim(d._id) ? '' : null)
  .style('cursor', d => enablesDim(d._id) ? 'pointer' : 'default')
  .on('mousemove', (event, d) => onCountryMousemove(event, d._id))
  .on('mouseleave', () => { if (!dimState.active) hideTip(); })
  .on('click',     (event, d) => onCountryClick(event, d._id));

const worldFeatures = topojson.feature(world, world.objects.countries).features;

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
  .attr('cursor', d => enablesDim(+d.id) ? 'pointer' : 'default')
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
    .attr('cursor', enablesDim(id) ? 'pointer' : 'default')
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
    .attr('cursor', enablesDim(id) ? 'pointer' : 'default')
    .on('mousemove', (event) => onCountryMousemove(event, id))
    .on('click',     (event) => onCountryClick(event, id));
});

// ── England & Scotland flags (after the .flag-qualified join so they aren't removed by its exit) ──
ukFeatures
  .filter(f => f._id === 8260 || f._id === 8261)
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
      .attr('cursor', enablesDim(f._id) ? 'pointer' : 'default')
      .on('mousemove', (event) => onCountryMousemove(event, f._id))
      .on('click',     (event) => onCountryClick(event, f._id));
  });

// ── Stamp existing qualified flags with elo-filter category ──────────────────
g.selectAll('.flag-qualified[data-id]').attr('data-elo-cat', function() {
  return _flagCat(+this.getAttribute('data-id'));
});

// ── Non-qualified flags (E = exporter, O = other) ────────────────────────────
worldFeatures
  .filter(d => { const id = +d.id; return !QUALIFIED_NAMES[id] && !STANDALONE_IDS.has(id) && iso2ForId(id); })
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
      .attr('cursor', enablesDim(id) ? 'pointer' : 'default')
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
});

// ── Legend gradient ───────────────────────────────────────────────────────────
const bar = document.getElementById('legend-bar');
const stops = Array.from({length: 60}, (_, i) => {
  const v = RATIO_MIN + (i / 59) * (RATIO_MAX - RATIO_MIN);
  return color(v);
});
bar.style.background = `linear-gradient(to right, ${stops.join(',')})`;
bar.style.borderRadius = '5px';
