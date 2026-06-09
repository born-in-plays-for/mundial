import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';

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

const FLAG = 14;

// ── Dim-state indicator (fixed in SVG space, unaffected by zoom) ──────────────
const dimBadge     = svg.append('g').attr('cursor','pointer').style('display','none');
const dimBadgeRect = dimBadge.append('rect')
  .attr('y', 7).attr('height', 20).attr('rx', 10)
  .attr('fill', '#bbb').attr('opacity', .82)
  .style('visibility', 'hidden');
const dimBadgeFlag = dimBadge.append('image')
  .attr('y', 9).attr('width', 16).attr('height', 16)
  .style('visibility', 'hidden');
const dimBadgeText = dimBadge.append('text')
  .attr('x', 893).attr('y', 21).attr('text-anchor', 'end')
  .attr('font-size', '10px')
  .attr('font-family', '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif')
  .attr('fill', '#555');
dimBadge.on('click', () => clearDim());

const CENTROID_OVERRIDE = {
  250:  [2.5,  46.5],   // France (without overseas territories)
  840:  [-98,  38],     // USA (without Alaska/Hawaii)
  8261: [-4.2, 56.8],  // Scotland (centroid pulled north by islands)
  191:  [16.8, 45.8],  // Croatia (coastal strip drags centroid south into Bosnia)
};

const dotCentroid = d => {
  const ov = CENTROID_OVERRIDE[+d.id];
  return ov ? projection(ov) : path.centroid(d);
};

svg.on('click', () => { clearDim(); });

svg.call(d3.zoom()
  .scaleExtent([1, 12])
  .on('zoom', e => {
    g.attr('transform', e.transform);
    const s = FLAG / e.transform.k;
    g.selectAll('.flag-qualified')
      .attr('width', s)
      .attr('height', s)
      .attr('x', function() { return +this.getAttribute('data-cx') - s/2; })
      .attr('y', function() { return +this.getAttribute('data-cy') - s/2; });
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
  .on('mousemove', () => { hideTip(); if (!dimState.active) dimBadge.style('display', 'none'); });

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


import { LOCALE, LANG, T, frPrep, frDefArt } from './i18n.js';

const _regionNames = (() => {
  try { return new Intl.DisplayNames([LOCALE], { type: 'region' }); } catch(e) { return null; }
})();

// Entries Intl.DisplayNames cannot handle (subdivision codes, historical states, edge cases)
const _OVERRIDE = {
  8260: { fr:'Angleterre',      de:'England',      it:'Inghilterra',    en:'England' },
  8261: { fr:'Écosse',          de:'Schottland',   it:'Scozia',         en:'Scotland' },
  8262: { fr:'Pays de Galles',  de:'Wales',        it:'Galles',         en:'Wales' },
  8263: { fr:'Irlande du Nord', de:'Nordirland',   it:'Irlanda del Nord', en:'Northern Ireland' },
  'Soviet Union':               { fr:'Union soviétique', de:'Sowjetunion',  it:'Unione Sovietica', en:'Soviet Union' },
  'Kingdom of the Netherlands': { fr:'Pays-Bas',         de:'Niederlande',  it:'Paesi Bassi',      en:'Netherlands' },
};

// For id=null entries that do have a standard alpha-2 code
const _NULL_CODE = { 'Democratic Republic of the Congo':'cd', 'U.S.':'us', 'Isle of Man':'im' };

// Null-ID birth countries → numeric topojson ID (for centroid lookup and flag dimming)
const _NULL_CENTROID_ID = { 'Democratic Republic of the Congo': 180, 'U.S.': 840, 'Kingdom of the Netherlands': 528 };

const countryName = (id, fallback = '') => {
  const key = id ?? fallback;
  if (_OVERRIDE[key]) return _OVERRIDE[key][LANG];
  const code = (id != null ? ISO2[id] : null) ?? _NULL_CODE[fallback] ?? null;
  if (code && _regionNames) {
    try { const n = _regionNames.of(code.toUpperCase()); if (n) return n; } catch(e) {}
  }
  return fallback || String(id);
};



// Apply locale to static page elements
document.documentElement.lang = LANG;
document.title = T.pageTitle;
document.querySelector('meta[name="description"]')?.setAttribute('content', T.pageDescription);
document.getElementById('page-heading').textContent     = T.pageHeading;
document.getElementById('page-heading-mob').textContent  = T.pageHeading;
['page-heading-sub', 'page-heading-sub-mob'].forEach(id => {
  const el = document.getElementById(id);
  if (!el) return;
  const q = T.pageQuote;
  el.innerHTML = `<p class="pq-text">${q.text}</p><p class="pq-attr"><span class="pq-author">${q.author}</span>${q.sep}<cite>${q.work}</cite>, ${q.ref}</p>`;
});
document.getElementById('zoom-hint').textContent      = T.zoomHint;
document.getElementById('legend-caption').textContent = T.legendCaption;
document.getElementById('map').setAttribute('aria-label', T.mapAriaLabel);

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

// Small island nations — placed manually (unreliable centroid in 110m topojson)
const STANDALONE_FLAGS = [
  { id: 132, lon: -23.6, lat: 15.1 },  // Cape Verde
  { id: 531, lon: -69.0, lat: 12.2 },  // Curaçao
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
      <div class="tt-name tt-name-inner">
        <span class="tt-name-inner">${flagImg(code)}${countryName(nId, name)}${app.byId[nId]?.totalCount ? html`<span class="tt-count" style="color:#14532d;font-size:18px;margin:0;line-height:1">${app.byId[nId].totalCount}</span>` : nothing}</span>
        <span class="tt-pop-rank">${popTag(app.pop[name])}${rankTag(name)}</span>
      </div>
      <div class="tt-label">${T.noExport(countryName(nId, name))}</div>
      ${hasImps ? buildImportColHtml(nId) : html`<div class="tt-label">${T.noImport(countryName(nId, name))}</div>`}
      ${hasImps && (app.importByNation[nId] ?? []).length > 5 ? html`<div class="tt-more-label">${T.clickForAll}</div>` : nothing}`, tt);
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
  fifaRank: {},
};
const centroids = {};

const enablesDim = id => !!(app.byId[id] || (QUALIFIED_NAMES[id] && ((app.importByNation[id] ?? []).length > 0 || (app.nativeByNation[id] ?? []).length > 0)));

const fmtPop = pop => (pop < 1 ? parseFloat(pop.toFixed(2)) : parseFloat(pop.toFixed(1)))
  .toLocaleString(LOCALE, { maximumFractionDigits: pop < 1 ? 2 : 1, minimumFractionDigits: 0, useGrouping: false }) + 'M';
const popTag  = pop  => pop  ? html`<span class="tt-pop">${T.pop} ${fmtPop(pop)}</span>` : nothing;
const rankTag = name => { const r = app.fifaRank[name]; return r ? html`<span class="tt-rank">FIFA #${r}</span>` : nothing; };
const flagImg = code => code ? html`<img class="tt-flag" src="${FLAG_CDN(code)}">` : nothing;
const ptWikiRow = p => {
  const wikiLang = p.wiki_langs?.[LANG];
  const wikiEn   = p.wiki_langs?.en ?? null;
  return wikiLang ? html`<a href="${wikiLang}" target="_blank" rel="noopener" class="pt-wiki">${p.name}</a>`
       : wikiEn   ? html`${p.name} (<a href="${wikiEn}" target="_blank" rel="noopener" class="pt-wiki">en</a>)`
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
    <div class="tt-count-row">
      <div class="tt-count color-imp">${players.length}</div>
      <div class="tt-sub">${ratio} ${T.ofSquad} (${squadSize})</div>
    </div>
    <div class="tt-label">${T.selectedByLabel(nationName)}</div>
    <div class="tt-nations">${nations.map(([n, c]) => `${n} (${c})`).join(', ')}</div>
    <div class="tt-players ${players.length > 5 ? 'tt-more' : ''}">
      ${top.map(p => html`
        <div class="tt-player">
          <span>${p.name}</span>
          <span class="tt-nation"><span class="color-imp">←</span> ${countryName(p.birthCountryId, p.birthCountry)}</span>
        </div>`)}
    </div>`;
};

const playerTableTemplate = sourceId => {
  const fc            = ISO2[sourceId];
  const country       = app.byId[sourceId]?.country ?? QUALIFIED_NAMES[sourceId];
  const pop           = app.byId[sourceId]?.pop ?? app.pop[QUALIFIED_NAMES[sourceId]] ?? null;
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

  return html`
    <div class="d-flex align-items-center gap-2 mb-1 justify-content-between">
      <div class="d-flex align-items-center gap-2">
        ${fc ? html`<img class="pt-country-flag" src="${FLAG_CDN_RECT(fc)}">` : nothing}
        <h2 class="mb-0 pt-title">${name}</h2>
      </div>
      ${pop ? html`<span class="tt-pop">${T.pop} ${fmtPop(pop)}</span>` : nothing}
    </div>
    ${!isQualified ? html`<div class="tt-not-qualified">${T.notQualified}</div>` : nothing}
    ${cnt > 0 ? html`
      <h2 id="pt-export-count" class="mb-3 pt-title color-exp">${cnt} ${T.exported(cnt, name)} ${T.selectedBy(cnt)}</h2>
      <div id="pt-nations">
        ${exportGroups.map(({ nation, players: gp }) => {
          const nationId = QUALIFIED_BY_NAME[nation];
          const nc = ISO2[nationId];
          return html`
            <div class="pt-nation-header" @click=${() => activateCountry(nationId, true)}>
              ${nc ? html`<img src="${FLAG_CDN_RECT(nc)}">` : nothing}
              <span class="pt-nation-name">${countryName(nationId, nation)}</span>
              <span class="pt-nation-count">${gp.length} ${T.players(gp.length)}</span>
            </div>
            ${gp.map(p => html`
              <div class="pt-player-row">
                <span>${ptWikiRow(p)}</span>
                <span class="pt-caps">${p.caps} ${T.caps}</span>
              </div>`)}`;
        })}
      </div>` : isQualified ? html`<div id="pt-export-count" class="tt-label">${T.noExport(name)}</div>` : nothing}
    ${nativePlayers.length > 0 ? html`
      <div id="pt-native-section">
        <h2 id="pt-native-title" class="mb-3 pt-title">${importPlayers.length === 0 ? T.noImport(name) : `${nativePlayers.length} ${T.ptNative(nativePlayers.length, name)}`}</h2>
        <div id="pt-native-players">
          ${nativePlayers.map(p => html`
            <div class="pt-player-row">
              <span>${ptWikiRow(p)}</span>
              <span class="pt-caps">${p.caps} ${T.caps}</span>
            </div>`)}
        </div>
      </div>` : nothing}
    ${importPlayers.length > 0 ? html`
      <div id="pt-import-section">
        <h2 id="pt-import-title" class="mb-3 pt-title color-imp">${importPlayers.length} ${T.ptImportTitle(importPlayers.length, name)}</h2>
        <div id="pt-import-nations">
          ${importGroups.map(({ label, birthCountryId, birthCountry, players: gp }) => {
            const bc = birthCountryId != null ? ISO2[birthCountryId] : (_NULL_CODE[birthCountry] ?? null);
            const clickId = birthCountryId ?? _NULL_CENTROID_ID[birthCountry] ?? null;
            return html`
              <div class="pt-nation-header${clickId != null ? ' pt-nation-clickable' : ''}" @click=${clickId != null ? () => activateCountry(clickId, true) : null}>
                ${bc ? html`<img src="${FLAG_CDN_RECT(bc)}">` : nothing}
                <span class="pt-nation-name">${label}</span>
                <span class="pt-nation-count">${gp.length} ${T.players(gp.length)}</span>
              </div>
              ${gp.map(p => html`
                <div class="pt-player-row">
                  <span>${ptWikiRow(p)}</span>
                  <span class="pt-caps">${p.caps} ${T.caps}</span>
                </div>`)}`;
          })}
        </div>
      </div>` : isQualified && nativePlayers.length === 0 ? html`<div class="tt-label">${T.noImport(name)}</div>` : nothing}`;
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
  dimBadgeRect.style('visibility', 'visible').attr('x', bx).attr('width', badgeW);
  dimBadgeFlag.style('visibility', 'visible').attr('href', fc ? FLAG_CDN(fc) : '').attr('x', bx + 8);
  dimBadgeText.attr('x', Math.round(bx + (badgeW + 22) / 2)).attr('text-anchor', 'middle').attr('fill', '#fff').text(countryDisplay);
  g.selectAll('.flag-qualified').filter(function() {
    return +this.getAttribute('data-id') === sourceId;
  }).raise();

  // ── Player table ──────────────────────────────────────────────────────────────
  const ptEl = document.getElementById('player-table');
  ptEl.style.display = '';
  render(playerTableTemplate(sourceId), ptEl);

  document.body.classList.add('dim-active');
  dimBadge.style('display', null);
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
  dimBadge.style('display', 'none');
  document.getElementById('player-table').style.display = 'none';
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
    .on('mouseleave', () => { if (!dimState.active) { hideTip(); dimBadge.style('display', 'none'); } });
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
app.pop   = rawData.pop;
app.fifaRank = rawData.fifa_rank || {};
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
      <div class="tt-count-row">
        <div class="tt-count color-exp">${rec.count}</div>
        <div class="tt-sub">${ratio} ${T.perMillion}</div>
      </div>
      <div class="tt-label">${T.exported(rec.count, countryName(rec.id, rec.country))} ${T.selectedBy(rec.count)}</div>
      <div class="tt-nations">${rec.nations.map(([n, c]) => `${countryName(QUALIFIED_BY_NAME[n], n)} (${c})`).join(', ')}</div>
      <div class="tt-players ${rec.count > rec.top.length ? 'tt-more' : ''}">
        ${rec.top.map(p => html`
          <div class="tt-player">
            <span>${p.name}</span>
            <span class="tt-nation"><span class="color-exp">→</span> ${countryName(QUALIFIED_BY_NAME[p.nation], p.nation)}</span>
          </div>`)}
      </div>`;
    const body = hasImports
      ? html`<div class="tt-columns">
          <div class="flex-col">${leftCol}</div>
          <div class="tt-vdiv"></div>
          <div class="flex-col">${buildImportColHtml(id)}</div>
        </div>`
      : html`${QUALIFIED_NAMES[id] ? html`<div class="tt-label">${T.noImport(countryName(id, QUALIFIED_NAMES[id]))}</div>` : nothing}${leftCol}`;

    const leftTruncated  = rec.count > rec.top.length;
    const rightTruncated = importCount > 5;
    const hasMore        = leftTruncated || rightTruncated;
    render(html`
      <div class="tt-name tt-name-inner">
        <span class="tt-name-inner">${flagImg(fc)}${countryName(rec.id, rec.country)}<span class="tt-count" style="color:#14532d;font-size:18px;margin:0;line-height:1">${rec.totalCount}</span></span>
        <span class="tt-pop-rank">${popTag(rec.pop)}${rankTag(rec.country)}</span>
      </div>
      ${!QUALIFIED_NAMES[id] ? html`<div class="tt-not-qualified">${T.notQualified}</div>` : nothing}
      ${body}
      ${hasMore ? html`<div class="tt-more-label">${leftTruncated && rightTruncated ? T.clickForAllPlural : T.clickForAll}</div>` : nothing}`, tt);
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
      <div class="tt-name tt-name-inner">
        <span class="tt-name-inner">${flagImg(destFc)}${countryName(destId, destName)}</span>
        <span class="tt-pop-rank">${popTag(app.pop[destName])}${rankTag(destName)}</span>
      </div>
      <div class="tt-nations"><span class="color-exp">←</span> ${countryName(dimState.sourceId, srcRec.country)} (${allPlayers.length})</div>
      <div class="tt-players ${allPlayers.length > 5 ? 'tt-more' : ''}">
        ${players.map(p => html`<div class="tt-player"><span>${p.name}</span></div>`)}
      </div>
      ${allPlayers.length > 5 ? html`<div class="tt-more-label">${T.clickForAll}</div>` : nothing}`, tt);
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
      <div class="tt-name tt-name-inner">
        <span class="tt-name-inner">${flagImg(bFc)}${countryName(p0.birthCountryId, p0.birthCountry)}</span>
        <span class="tt-pop-rank">${popTag(app.pop[p0.birthCountry])}${rankTag(p0.birthCountry)}</span>
      </div>
      <div class="tt-nations"><span class="color-imp">→</span> ${countryName(dimState.sourceId, QUALIFIED_NAMES[dimState.sourceId])} (${allPlayers.length})</div>
      <div class="tt-players ${allPlayers.length > 5 ? 'tt-more' : ''}">
        ${players.map(p => html`<div class="tt-player"><span>${p.name}</span></div>`)}
      </div>
      ${allPlayers.length > 5 ? html`<div class="tt-more-label">${T.clickForAll}</div>` : nothing}`, tt);
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
      <div class="tt-name tt-name-inner">
        <span class="tt-name-inner">${flagImg(fc)}${countryName(id, destName)}</span>
        <span class="tt-pop-rank">${popTag(app.pop[destName])}${rankTag(destName)}</span>
      </div>
      ${exportPlayers.length > 0 ? html`
        <div class="tt-nations"><span class="color-imp">→</span> ${countryName(dimState.sourceId, QUALIFIED_NAMES[dimState.sourceId])} (${exportPlayers.length})</div>
        <div class="tt-players ${exportPlayers.length > 5 ? 'tt-more' : ''}">
          ${topExp.map(p => html`<div class="tt-player"><span>${p.name}</span></div>`)}
        </div>` : nothing}
      ${hasBoth ? html`<div class="tt-divider"></div>` : nothing}
      ${importPlayers.length > 0 ? html`
        <div class="tt-nations"><span class="color-exp">←</span> ${countryName(dimState.sourceId, srcRec.country)} (${importPlayers.length})</div>
        <div class="tt-players ${importPlayers.length > 5 ? 'tt-more' : ''}">
          ${topImp.map(p => html`<div class="tt-player"><span>${p.name}</span></div>`)}
        </div>` : nothing}
      ${exportPlayers.length > 5 || importPlayers.length > 5 ? html`<div class="tt-more-label">${exportPlayers.length > 5 && importPlayers.length > 5 ? T.clickForAllPlural : T.clickForAll}</div>` : nothing}`, tt);
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
    dimBadgeRect.attr('x', hlBx).attr('width', hlBadgeW).style('visibility', 'hidden');
    dimBadgeFlag.attr('href', ISO2[id] ? FLAG_CDN(ISO2[id]) : '').attr('x', hlBx + 8).style('visibility', 'hidden');
    dimBadgeText.attr('x', Math.round(hlBx + (hlBadgeW + 22) / 2)).attr('text-anchor', 'middle').attr('fill', '#555').text(hlName);
    dimBadge.style('display', null);
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
  .on('mouseleave', () => { if (!dimState.active) { hideTip(); dimBadge.style('display', 'none'); } })
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

g.selectAll('.flag-qualified')
  .data(topojson.feature(world, world.objects.countries).features
    .filter(d => QUALIFIED_NAMES[+d.id] && !STANDALONE_IDS.has(+d.id)))
  .join('image')
  .call(placeFlag)
  .attr('href', d => FLAG_CDN(ISO2[+d.id]))
  .attr('data-id', d => +d.id)
  .each(function(d) {
    const [cx, cy] = dotCentroid(d);
    d3.select(this)
      .attr('data-cx', cx).attr('data-cy', cy)
      .attr('x', cx - FLAG/2).attr('y', cy - FLAG/2);
  })
  .attr('pointer-events', 'all')
  .attr('data-enables-dim', d => enablesDim(+d.id) ? '' : null)
  .attr('cursor', d => enablesDim(+d.id) ? 'pointer' : 'default')
  .on('mousemove', (event, d) => onCountryMousemove(event, +d.id))
  .on('click',     (event, d) => onCountryClick(event, +d.id));

STANDALONE_FLAGS.forEach(({ id, lon, lat }) => {
  const [cx, cy] = projection([lon, lat]);
  g.append('image')
    .call(placeFlag)
    .attr('href', FLAG_CDN(ISO2[id]))
    .attr('data-id', id)
    .attr('data-cx', cx).attr('data-cy', cy)
    .attr('x', cx - FLAG/2).attr('y', cy - FLAG/2)
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

// ── Centroids map (for arc drawing) ──────────────────────────────────────────
topojson.feature(world, world.objects.countries).features
  .filter(f => +f.id !== 826)
  .forEach(f => { centroids[+f.id] = dotCentroid(f); });
// UK nation centroids set above when placing flags
STANDALONE_FLAGS.forEach(({ id, lon, lat }) => { centroids[id] = projection([lon, lat]); });


// ── Arc group (above flags; source flag raised above arcs in applyDim) ────────
dimState.arcsGroup = g.append('g').attr('class', 'arcs-group');};

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
