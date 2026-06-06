import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';

const RATIO_MIN = 0.03;
const RATIO_MAX = 1.20;

const PALETTE = d3.interpolateRgbBasis(['#f3e8f7','#ddb8ea','#c285d8','#a354c2','#7b2d8b','#581f65','#361240']);
const normalize = r => (r - RATIO_MIN) / (RATIO_MAX - RATIO_MIN);
const color = r => PALETTE(Math.max(0, Math.min(1, normalize(r))));

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

const g = svg.append('g');
const tt = document.getElementById('tooltip');

const FLAG = 14;

// ── Dim-state indicator (fixed in SVG space, unaffected by zoom) ──────────────
const dimBadge     = svg.append('g').attr('cursor','pointer').style('display','none');
const dimBadgeRect = dimBadge.append('rect')
  .attr('y', 7).attr('height', 20).attr('rx', 10)
  .attr('fill', '#bbb').attr('opacity', .82);
const dimBadgeFlag = dimBadge.append('image')
  .attr('y', 9).attr('width', 16).attr('height', 16);
const dimBadgeText = dimBadge.append('text')
  .attr('y', 21).attr('text-anchor', 'start')
  .attr('font-size', '10px')
  .attr('font-family', '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif')
  .attr('fill', '#fff');
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
    currentK = e.transform.k;
    const k = currentK;
    const ah = 6/k, aw = 3/k;
    const arcOffset = (sw, sx, sy, tx, ty) => {
      const ddx = tx-sx, ddy = ty-sy, dist = Math.sqrt(ddx*ddx+ddy*ddy);
      const pnx = -ddy/dist, pny = ddx/dist;
      const off = sw * ARC_OFFSET / k;
      return {
        ofx: sx + pnx*off, ofy: sy + pny*off,
        otx: tx + pnx*off, oty: ty + pny*off,
        oqx: (sx+tx)/2 + pnx*off, oqy: (sy+ty)/2 - dist*0.3 + pny*off,
      };
    };
    g.selectAll('path.arc-line')
      .attr('stroke-width', function() { return +this.getAttribute('data-sw') / k; })
      .attr('d', function() {
        const sw = +this.getAttribute('data-sw');
        const sx = +this.getAttribute('data-sx'), sy = +this.getAttribute('data-sy');
        const tx = +this.getAttribute('data-tx'), ty = +this.getAttribute('data-ty');
        const {ofx,ofy,otx,oty,oqx,oqy} = arcOffset(sw, sx, sy, tx, ty);
        return `M${ofx},${ofy} Q${oqx},${oqy} ${otx},${oty}`;
      });
    g.selectAll('polygon.arc-mid').attr('points', function() {
      const sw = +this.getAttribute('data-sw');
      const sx = +this.getAttribute('data-sx'), sy = +this.getAttribute('data-sy');
      const tx = +this.getAttribute('data-tx'), ty = +this.getAttribute('data-ty');
      const {ofx,ofy,otx,oty,oqx,oqy} = arcOffset(sw, sx, sy, tx, ty);
      const mt = ARC_MID_T, ms = 1 - mt;
      const mx = ms*ms*ofx + 2*ms*mt*oqx + mt*mt*otx, my = ms*ms*ofy + 2*ms*mt*oqy + mt*mt*oty;
      const tdx = 2*ms*(oqx-ofx) + 2*mt*(otx-oqx), tdy = 2*ms*(oqy-ofy) + 2*mt*(oty-oqy);
      const tLen = Math.sqrt(tdx*tdx+tdy*tdy);
      const mux = tdx/tLen, muy = tdy/tLen, mnx = -muy, mny = mux;
      const mah = Math.sqrt(sw)*5/k, maw = Math.sqrt(sw)*2.5/k;
      const bx = mx-mux*mah/2, by = my-muy*mah/2;
      return `${mx+mux*mah/2},${my+muy*mah/2} ${bx+mnx*maw},${by+mny*maw} ${bx-mnx*maw},${by-mny*maw}`;
    });
  }));

g.append('path').datum({type:'Sphere'})
  .attr('d', path).attr('fill','#d8d0e8').attr('stroke','#b4a8cc').attr('stroke-width',.5)
  .on('mousemove', () => hideTip());

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

// ── i18n ──────────────────────────────────────────────────────────────────────
const LOCALE = navigator.languages?.[0] ?? navigator.language ?? 'fr';
const LANG   = LOCALE.toLowerCase().startsWith('fr') ? 'fr'
             : LOCALE.toLowerCase().startsWith('de') ? 'de'
             : LOCALE.toLowerCase().startsWith('it') ? 'it'
             : 'en';

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

// UI label strings
const T = {
  fr: {
    noExport:      'aucun joueur exporté',
    perMillion:    "/ million d'hab.",
    selections:    'Sélections',
    bornIn:        'Joueurs nés en',
    imported:      'joueurs importés',
    ofSquad:       'de la sélection',
    noImport:      'aucun joueur importé',
    birthNations:  'Nés en',
    pop:           'pop.',
    caps:          'sél.',
    players:       n => `joueur${n > 1 ? 's' : ''}`,
    exported:      n => `joueur${n > 1 ? 's' : ''} exporté${n > 1 ? 's' : ''}`,
    pageTitle:     'Mondial 2026 — Joueurs "exportés" par pays de naissance',
    pageHeading:   'Mondial 2026 — joueurs "exportés" par pays de naissance',
    pageSub:       "281 joueurs au total · source : Wikipedia",
    mapAriaLabel:  'Carte choroplèthe des pays de naissance des joueurs exportés',
    zoomHint:      'scroll pour zoomer · glisser pour déplacer',
    legendCaption: "joueurs exportés / million d'hab. · gris = aucun joueur exporté · drapeau = nation qualifiée",
  },
  it: {
    noExport:      'nessun giocatore esportato',
    perMillion:    '/ milione di ab.',
    selections:    'Nazionali',
    bornIn:        'Giocatori nati in',
    imported:      'giocatori importati',
    ofSquad:       'della rosa',
    noImport:      'nessun giocatore importato',
    birthNations:  'Nati in',
    pop:           'ab.',
    caps:          'pres.',
    players:       n => `giocator${n === 1 ? 'e' : 'i'}`,
    exported:      n => `giocator${n === 1 ? 'e esportato' : 'i esportati'}`,
    pageTitle:     'Mondiali 2026 — giocatori "esportati" per paese di nascita',
    pageHeading:   'Mondiali 2026 — giocatori "esportati" per paese di nascita',
    pageSub:       '281 giocatori in totale · fonte: Wikipedia',
    mapAriaLabel:  'Mappa coropletica dei paesi di nascita dei giocatori esportati',
    zoomHint:      'scorri per zoomare · trascina per spostarti',
    legendCaption: 'giocatori esportati / milione di ab. · grigio = nessun giocatore esportato · bandiera = nazione qualificata',
  },
  de: {
    noExport:      'kein exportierter Spieler',
    perMillion:    '/ Mio. Einwohner',
    selections:    'Nationalteams',
    bornIn:        'Spieler geboren in',
    imported:      'importierte Spieler',
    ofSquad:       'im Kader',
    noImport:      'kein importierter Spieler',
    birthNations:  'Geb. in',
    pop:           'Einw.',
    caps:          'Sp.',
    players:       () => 'Spieler',
    exported:      n => n === 1 ? 'exportierter Spieler' : 'exportierte Spieler',
    pageTitle:     'WM 2026 — „exportierte“ Spieler nach Geburtsland',
    pageHeading:   'WM 2026 — „exportierte“ Spieler nach Geburtsland',
    pageSub:       '281 Spieler insgesamt · Quelle: Wikipedia',
    mapAriaLabel:  'Choroplethenkarte der Geburtsländer exportierter Spieler',
    zoomHint:      'Scrollen zum Zoomen · Ziehen zum Verschieben',
    legendCaption: 'exportierte Spieler / Mio. Einwohner · Grau = kein exportierter Spieler · Flagge = qualifizierte Nation',
  },
  en: {
    noExport:      'no players exported',
    perMillion:    '/ million inhab.',
    selections:    'Selections',
    bornIn:        'Players born in',
    imported:      'imported players',
    ofSquad:       'of the squad',
    noImport:      'no players imported',
    birthNations:  'Born in',
    pop:           'pop.',
    caps:          'caps',
    players:       n => `player${n > 1 ? 's' : ''}`,
    exported:      n => `player${n > 1 ? 's' : ''} exported`,
    pageTitle:     'World Cup 2026 — "exported" players by country of birth',
    pageHeading:   'World Cup 2026 — "exported" players by country of birth',
    pageSub:       '281 players total · source: Wikipedia',
    mapAriaLabel:  'Choropleth map of birth countries of players exported to World Cup 2026',
    zoomHint:      'scroll to zoom · drag to pan',
    legendCaption: 'exported players / million inhab. · grey = no exported player · flag = nation qualified',
  },
}[LANG];

// Apply locale to static page elements
document.documentElement.lang = LANG;
document.title = T.pageTitle;
document.getElementById('page-heading').textContent   = T.pageHeading;
document.getElementById('page-sub').textContent       = T.pageSub;
document.getElementById('page-heading-mob').textContent = T.pageHeading;
document.getElementById('page-sub-mob').textContent    = T.pageSub;
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
  let x = event.clientX + 16, y = event.clientY + 16;
  if (x + w > window.innerWidth)  x = event.clientX - (w + 4);
  if (y + height > window.innerHeight) y = event.clientY - (height + 4);
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
  tt.style.display = 'block';
};

let lastTipKey = null;

const hideTip = () => { tt.style.display = 'none'; lastTipKey = null; };

const showQualifiedTip = (event, name, code) => {
  const nId = QUALIFIED_BY_NAME[name];
  if (lastTipKey !== name) {
    lastTipKey = name;
    const hasImps = (IMPORT_BY_NATION[nId] ?? []).length > 0;

    render(html`
      <div class="tt-name">
        <span class="tt-name-inner">${flagImg(code)}${countryName(nId, name)}</span>
        ${popTag(POP_REF[name])}
      </div>
      <div class="tt-no-export">${T.noExport}</div>
      ${hasImps ? buildImportColHtml(nId) : html`<div class="tt-no-export">${T.noImport}</div>`}`, tt);
  }
  positionTip(event, 200, false);
};

// ── Dim helpers (click destination highlight) ─────────────────────────────────
let currentK = 1;
let dimActive = false;
let dimSourceId = null;
let dimDestIds   = new Map(); // destId → player count  (export: A→X)
let dimImportIds = new Map(); // centroid-id → count   (import: Y→A)
let arcsGroup  = null;
const centroids = {};
let DATA_REF = {};          // set once data loads, used by applyDim
let IMPORT_BY_NATION = {};  // nationId → [{name, birthCountry, birthCountryId, caps}]
let POP_REF  = {};          // country name → population in millions

const fmtPop = pop => (pop < 1 ? parseFloat(pop.toFixed(2)) : parseFloat(pop.toFixed(1)))
  .toLocaleString(LOCALE, { maximumFractionDigits: pop < 1 ? 2 : 1, minimumFractionDigits: 0, useGrouping: false }) + 'M';
const popTag  = pop  => pop  ? html`<span class="tt-pop">${T.pop} ${fmtPop(pop)}</span>` : nothing;
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
  const players   = (IMPORT_BY_NATION[nationId] ?? []).slice().sort((a, b) => b.caps - a.caps);
  if (players.length === 0) return html`<div class="tt-no-export">${T.noImport}</div>`;
  const byBirth   = {};
  players.forEach(p => { const l = countryName(p.birthCountryId, p.birthCountry); byBirth[l] = (byBirth[l] ?? 0) + 1; });
  const nations   = Object.entries(byBirth).sort((a, b) => b[1] - a[1]);
  const top       = players.slice(0, 5);
  const squadSize = SQUAD_SIZE[nationId] ?? 26;
  const ratio     = (players.length / squadSize * 100).toFixed(0) + '%';

  return html`
    <div class="tt-count tt-count-imp">${players.length}</div>
    <div class="tt-label">${T.imported}</div>
    <div class="tt-sub">${ratio} ${T.ofSquad} (${squadSize})</div>
    <div class="tt-nations">${nations.map(([n, c]) => `${n} (${c})`).join(', ')}</div>
    <div class="tt-players ${players.length > 5 ? 'tt-more' : ''}">
      ${top.map(p => html`
        <div class="tt-player">
          <span>${p.name}</span>
          <span class="tt-nation"><span class="tt-arc-import">←</span> ${countryName(p.birthCountryId, p.birthCountry)}</span>
        </div>`)}
    </div>`;
};

const playerTableTemplate = sourceId => {
  const fc            = ISO2[sourceId];
  const country       = DATA_REF[sourceId]?.country ?? QUALIFIED_NAMES[sourceId];
  const pop           = DATA_REF[sourceId]?.pop ?? POP_REF[QUALIFIED_NAMES[sourceId]] ?? null;
  const cnt           = DATA_REF[sourceId]?.count ?? 0;
  const exportPlayers = DATA_REF[sourceId]?.players ?? [];
  const importPlayers = (IMPORT_BY_NATION[sourceId] ?? []).slice().sort((a, b) => b.caps - a.caps);

  const exportGroups = [];
  exportPlayers.forEach(p => {
    if (!exportGroups.length || exportGroups[exportGroups.length - 1].nation !== p.nation)
      exportGroups.push({ nation: p.nation, players: [] });
    exportGroups[exportGroups.length - 1].players.push(p);
  });

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
        <h2 class="mb-0 pt-country-name">${countryName(sourceId, country)}</h2>
      </div>
      ${pop ? html`<span class="tt-pop">${T.pop} ${fmtPop(pop)}</span>` : nothing}
    </div>
    <h2 id="pt-export-count" class="mb-3">${cnt} ${T.exported(cnt)}</h2>
    <div id="pt-nations">
      ${exportGroups.map(({ nation, players: gp }) => {
        const nc = ISO2[QUALIFIED_BY_NAME[nation]];
        return html`
          <div class="pt-nation-header">
            ${nc ? html`<img src="${FLAG_CDN_RECT(nc)}">` : nothing}
            <span class="pt-nation-name">${countryName(QUALIFIED_BY_NAME[nation], nation)}</span>
            <span class="pt-nation-count">${gp.length} ${T.players(gp.length)}</span>
          </div>
          ${gp.map(p => html`
            <div class="pt-player-row">
              <span>${ptWikiRow(p)}</span>
              <span class="pt-caps">${p.caps} ${T.caps}</span>
            </div>`)}`;
      })}
    </div>
    ${importPlayers.length > 0 ? html`
      <div id="pt-import-section">
        <h2 id="pt-import-title" class="mb-3">${importPlayers.length} ${T.imported}</h2>
        <div id="pt-import-nations">
          ${importGroups.map(({ label, birthCountryId, birthCountry, players: gp }) => {
            const bc = birthCountryId != null ? ISO2[birthCountryId] : (_NULL_CODE[birthCountry] ?? null);
            return html`
              <div class="pt-nation-header">
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
      </div>` : nothing}`;
};

const applyDim = (sourceId, destIds, country) => {
  dimActive = true;
  dimSourceId = sourceId;
  dimDestIds = destIds;

  // Build import ids: birth countries Y whose players represent nation sourceId
  dimImportIds = new Map();
  (IMPORT_BY_NATION[sourceId] ?? []).forEach(p => {
    const cId = p.birthCountryId != null ? p.birthCountryId : (_NULL_CENTROID_ID[p.birthCountry] ?? null);
    if (cId == null) return;
    dimImportIds.set(cId, (dimImportIds.get(cId) ?? 0) + 1);
  });

  // Flag opacity + CSS classes for visual differentiation
  g.selectAll('.flag-qualified').each(function() {
    const id = +this.getAttribute('data-id');
    const isExport = destIds.has(id);
    const isImport = dimImportIds.has(id);
    const visible = id === sourceId || isExport || isImport;
    d3.select(this)
      .attr('opacity', visible ? 1 : 0.35)
  });

  // Arc drawing helper — smooth quadratic Bézier, laterally offset by type, mid arrowhead
  const drawArc = (from, to, count, type) => {
    const color = type === 'export' ? ARC_EXPORT_COLOR : ARC_IMPORT_COLOR;
    const ddx = to[0]-from[0], ddy = to[1]-from[1];
    const dist = Math.sqrt(ddx*ddx + ddy*ddy);
    const sw = Math.max(1, Math.sqrt(count));
    // Shift each arc left of its own from→to direction; reversed arcs naturally go the other way
    const pnx = -ddy/dist, pny = ddx/dist;
    const off = sw * ARC_OFFSET / currentK;
    const ofx = from[0] + pnx*off, ofy = from[1] + pny*off;
    const otx = to[0]   + pnx*off, oty = to[1]   + pny*off;
    const oqx = (from[0]+to[0])/2 + pnx*off;
    const oqy = (from[1]+to[1])/2 - dist*0.3 + pny*off;

    arcsGroup.append('path')
      .attr('class', 'arc-line')
      .attr('d', `M${ofx},${ofy} Q${oqx},${oqy} ${otx},${oty}`)
      .attr('fill', 'none').attr('stroke', color)
      .attr('stroke-width', sw/currentK).attr('opacity', 0.7)
      .attr('data-sw', sw)
      .attr('data-sx', from[0]).attr('data-sy', from[1])
      .attr('data-tx', to[0]).attr('data-ty', to[1]);

    // Mid arrowhead at ARC_MID_T toward destination — keeps bidirectional pairs separated along arc
    const mt = ARC_MID_T, ms = 1 - mt;
    const mx = ms*ms*ofx + 2*ms*mt*oqx + mt*mt*otx;
    const my = ms*ms*ofy + 2*ms*mt*oqy + mt*mt*oty;
    const tdx = 2*ms*(oqx-ofx) + 2*mt*(otx-oqx);
    const tdy = 2*ms*(oqy-ofy) + 2*mt*(oty-oqy);
    const tLen = Math.sqrt(tdx*tdx + tdy*tdy);
    const mux = tdx/tLen, muy = tdy/tLen;
    const mnx = -muy, mny = mux;
    const mah = Math.sqrt(sw)*5/currentK, maw = Math.sqrt(sw)*2.5/currentK;
    const mbx = mx - mux*mah/2, mby = my - muy*mah/2;
    arcsGroup.append('polygon')
      .attr('class', 'arc-line arc-mid')
      .attr('points', `${mx+mux*mah/2},${my+muy*mah/2} ${mbx+mnx*maw},${mby+mny*maw} ${mbx-mnx*maw},${mby-mny*maw}`)
      .attr('fill', color).attr('opacity', 0.8)
      .attr('data-sw', sw)
      .attr('data-sx', from[0]).attr('data-sy', from[1])
      .attr('data-tx', to[0]).attr('data-ty', to[1]);
  };

  if (arcsGroup) {
    arcsGroup.selectAll('.arc-line').remove();
    const src = centroids[sourceId];
    if (src) {
      // Export arcs: A → X (blue)
      destIds.forEach((count, destId) => {
        const dst = centroids[destId];
        if (dst) drawArc(src, dst, count, 'export');
      });
      // Import arcs: Y → A (red, arrow points inward)
      dimImportIds.forEach((count, birthId) => {
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
  dimBadgeRect.attr('x', bx).attr('width', badgeW);
  dimBadgeFlag.attr('href', fc ? FLAG_CDN(fc) : '').attr('x', bx + 8);
  dimBadgeText.attr('x', bx + 30).text(countryDisplay);
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
  dimActive = false;
  dimSourceId = null;
  dimDestIds = new Map();
  dimImportIds = new Map();
  g.selectAll('.flag-qualified')
    .attr('opacity', null)
  if (arcsGroup) arcsGroup.selectAll('.arc-line').remove();
  document.body.classList.remove('dim-active');
  dimBadge.style('display', 'none');
  document.getElementById('player-table').style.display = 'none';
};

// ── Flag join helpers ─────────────────────────────────────────────────────────
const placeFlag = (sel) => {
  sel.attr('class','flag-qualified')
    .attr('width', FLAG).attr('height', FLAG)
    .on('mouseleave', () => { if (!dimActive) hideTip(); });
};

// ── Main render ───────────────────────────────────────────────────────────────
// GU_A3 code (Natural Earth) → synthetic nation ID
const UK_GU_TO_ID = {ENG: 8260, SCT: 8261, WLS: 8262, NIR: 8263};

Promise.all([
  fetch('wc2026_map_data.json').then(r => r.json()),
  d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'),
  fetch('uk-nations.geojson').then(r => r.json())
]).then(([appData, world, ukNations]) => {
  const DATA = appData.data;
  const POP  = appData.pop;
  const byId = {};
  DATA.forEach(d => {
    d.pop   = POP[d.country] || null;
    d.ratio = d.pop ? d.count / d.pop : null;
    byId[d.id] = d;
  });
  DATA_REF = byId;
  POP_REF  = POP;

  DATA.forEach(rec => {
    rec.players.forEach(p => {
      const nId = QUALIFIED_BY_NAME[p.nation];
      if (nId == null) return;
      if (countryName(rec.id, rec.country) === countryName(nId, QUALIFIED_NAMES[nId])) return;
      if (!IMPORT_BY_NATION[nId]) IMPORT_BY_NATION[nId] = [];
      IMPORT_BY_NATION[nId].push({ name: p.name, birthCountry: rec.country, birthCountryId: rec.id, caps: p.caps, wiki_langs: p.wiki_langs });
    });
  });

  // ── Shared tooltip/click helpers (used by both world and UK nation paths) ──────

  const showExportTip = (event, id) => {
    const rec        = byId[id];
    if (!rec) { hideTip(); return; }
    const hasImports = !!QUALIFIED_NAMES[id] && (IMPORT_BY_NATION[id] ?? []).length > 0;
    if (lastTipKey !== id) {
      lastTipKey = id;
      const _r2   = rec.ratio !== null ? rec.ratio.toFixed(2) : '?';
      const ratio = _r2 === '0.00' ? rec.ratio.toPrecision(2) : _r2;
      const fc    = ISO2[rec.id];

      const leftCol = html`
        <div class="tt-count">${rec.count}</div>
        <div class="tt-label">${T.exported(rec.count)}</div>
        <div class="tt-sub">${ratio} ${T.perMillion}</div>
        <div class="tt-nations">${rec.nations.map(([n, c]) => `${countryName(QUALIFIED_BY_NAME[n], n)} (${c})`).join(', ')}</div>
        <div class="tt-players ${rec.count > rec.top.length ? 'tt-more' : ''}">
          ${rec.top.map(p => html`
            <div class="tt-player">
              <span>${p.name}</span>
              <span class="tt-nation"><span class="tt-arc-export">→</span> ${countryName(QUALIFIED_BY_NAME[p.nation], p.nation)}</span>
            </div>`)}
        </div>`;
      const body = hasImports
        ? html`<div class="tt-columns">
            <div class="tt-col">${leftCol}</div>
            <div class="tt-vdiv"></div>
            <div class="tt-col">${buildImportColHtml(id)}</div>
          </div>`
        : html`${leftCol}${QUALIFIED_NAMES[id] ? html`<div class="tt-no-export">${T.noImport}</div>` : nothing}`;

      render(html`
        <div class="tt-name">
          <span class="tt-name-inner">${flagImg(fc)}${countryName(rec.id, rec.country)}</span>
          ${popTag(rec.pop)}
        </div>
        ${body}`, tt);
    }
    positionTip(event, 240, hasImports);
  };

  const showImportTip = (event, destId) => {
    const key        = `import-${dimSourceId}-${destId}`;
    const srcRec     = byId[dimSourceId];
    if (!srcRec) { hideTip(); return; }
    const destName   = QUALIFIED_NAMES[destId];
    const allPlayers = (srcRec.players ?? []).filter(p => p.nation === destName);
    const players    = allPlayers.slice(0, 5);
    if (lastTipKey !== key) {
      lastTipKey = key;
      const destFc = ISO2[destId];

      render(html`
        <div class="tt-name">
          <span class="tt-name-inner">${flagImg(destFc)}${countryName(destId, destName)}</span>
          ${popTag(POP[destName])}
        </div>
        <div class="tt-nations"><span class="tt-arc-export">←</span> ${countryName(dimSourceId, srcRec.country)} (${allPlayers.length})</div>
        <div class="tt-players ${allPlayers.length > 5 ? 'tt-more' : ''}">
          ${players.map(p => html`<div class="tt-player"><span>${p.name}</span></div>`)}
        </div>`, tt);
    }
    positionTip(event, 48 + 20 + 24 * players.length + (allPlayers.length > 5 ? 18 : 0));
  };

  const showImportSourceTip = (event, centroidId) => {
    const key        = `impsrc-${dimSourceId}-${centroidId}`;
    const allPlayers = (IMPORT_BY_NATION[dimSourceId] ?? []).filter(p => {
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
        <div class="tt-name">
          <span class="tt-name-inner">${flagImg(bFc)}${countryName(p0.birthCountryId, p0.birthCountry)}</span>
          ${popTag(POP[p0.birthCountry])}
        </div>
        <div class="tt-nations"><span class="tt-arc-import">→</span> ${countryName(dimSourceId, QUALIFIED_NAMES[dimSourceId])} (${allPlayers.length})</div>
        <div class="tt-players ${allPlayers.length > 5 ? 'tt-more' : ''}">
          ${players.map(p => html`<div class="tt-player"><span>${p.name}</span></div>`)}
        </div>`, tt);
    }
    positionTip(event, 48 + 20 + 24 * players.length + (allPlayers.length > 5 ? 18 : 0));
  };

  const showCombinedTip = (event, id) => {
    const key           = `combined-${dimSourceId}-${id}`;
    const exportPlayers = (IMPORT_BY_NATION[dimSourceId] ?? []).filter(p => {
      const bid = p.birthCountryId != null ? p.birthCountryId : (_NULL_CENTROID_ID[p.birthCountry] ?? null);
      return bid === id;
    });
    const srcRec        = byId[dimSourceId];
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
        <div class="tt-name">
          <span class="tt-name-inner">${flagImg(fc)}${countryName(id, destName)}</span>
          ${popTag(POP[destName])}
        </div>
        ${exportPlayers.length > 0 ? html`
          <div class="tt-nations"><span class="tt-arc-import">→</span> ${countryName(dimSourceId, QUALIFIED_NAMES[dimSourceId])} (${exportPlayers.length})</div>
          <div class="tt-players ${exportPlayers.length > 5 ? 'tt-more' : ''}">
            ${topExp.map(p => html`<div class="tt-player"><span>${p.name}</span></div>`)}
          </div>` : nothing}
        ${hasBoth ? html`<div class="tt-divider"></div>` : nothing}
        ${importPlayers.length > 0 ? html`
          <div class="tt-nations"><span class="tt-arc-export">←</span> ${countryName(dimSourceId, srcRec.country)} (${importPlayers.length})</div>
          <div class="tt-players ${importPlayers.length > 5 ? 'tt-more' : ''}">
            ${topImp.map(p => html`<div class="tt-player"><span>${p.name}</span></div>`)}
          </div>` : nothing}`, tt);
    }
    const h = 48 + (exportPlayers.length > 0 ? 20 + 24 * topExp.length : 0)
                  + (importPlayers.length > 0 ? 20 + 24 * topImp.length : 0)
                  + (exportPlayers.length > 0 && importPlayers.length > 0 ? 20 : 0);
    positionTip(event, h);
  };

  const onCountryMousemove = (event, id) => {
    if (dimActive) {
      const inDest = dimDestIds.has(id), inImport = dimImportIds.has(id);
      if (inDest && inImport) { showCombinedTip(event, id); return; }
      if (inDest)   { showImportTip(event, id); return; }
      if (inImport) { showImportSourceTip(event, id); return; }
      if (id === dimSourceId) {
        if (byId[id]) showExportTip(event, id);
        else if (QUALIFIED_NAMES[id]) showQualifiedTip(event, QUALIFIED_NAMES[id], ISO2[id]);
        return;
      }
      hideTip(); return;
    }
    if (byId[id]) showExportTip(event, id);
    else if (QUALIFIED_NAMES[id]) showQualifiedTip(event, QUALIFIED_NAMES[id], ISO2[id]);
    else hideTip();
  };

  const onCountryClick = (event, id) => {
    event.stopPropagation();
    if (dimActive) { clearDim(); return; }
    const rec = byId[id];
    if (rec) {
      const destIds = new Map(rec.nations.flatMap(([n,c]) => {
        const did = QUALIFIED_BY_NAME[n];
        return did !== undefined ? [[did, c]] : [];
      }));
      applyDim(id, destIds, rec.country);
    } else if (QUALIFIED_NAMES[id] && (IMPORT_BY_NATION[id] ?? []).length > 0) {
      applyDim(id, new Map(), QUALIFIED_NAMES[id]);
    }
  };

  // ── World choropleth (skip UK polygon — rendered separately below) ────────────
  g.selectAll('.country')
    .data(topojson.feature(world, world.objects.countries).features
      .filter(d => +d.id !== 826))
    .join('path')
    .attr('class','country')
    .attr('d', path)
    .attr('fill', d => { const r = byId[+d.id]; return r && r.ratio !== null ? color(r.ratio) : '#e8e4e0'; })
    .attr('stroke','#ccc8c0').attr('stroke-width',.3)
    .on('mousemove', (event, d) => onCountryMousemove(event, +d.id))
    .on('mouseleave', () => { if (!dimActive) hideTip(); })
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
    .attr('fill', d => { const r = byId[d._id]; return r && r.ratio !== null ? color(r.ratio) : '#e8e4e0'; })
    .attr('stroke','#ccc8c0').attr('stroke-width',.3)
    .on('mousemove', (event, d) => onCountryMousemove(event, d._id))
    .on('mouseleave', () => { if (!dimActive) hideTip(); })
    .on('click',     (event, d) => onCountryClick(event, d._id));

  g.selectAll('.flag-qualified')
    .data(topojson.feature(world, world.objects.countries).features
      .filter(d => QUALIFIED_NAMES[+d.id] && !STANDALONE_IDS.has(+d.id)))
    .join('image')
    .call(placeFlag)
    .attr('href', d => FLAG_CDN(ISO2[+d.id]))
    .attr('data-cx', d => dotCentroid(d)[0])
    .attr('data-cy', d => dotCentroid(d)[1])
    .attr('x', d => dotCentroid(d)[0] - FLAG/2)
    .attr('y', d => dotCentroid(d)[1] - FLAG/2)
    .attr('data-id', d => +d.id)
    .attr('pointer-events', d => byId[+d.id] ? 'none' : 'all')
    .attr('cursor', d => (!byId[+d.id] && (IMPORT_BY_NATION[+d.id] ?? []).length > 0) ? 'pointer' : 'default')
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
      .attr('cursor', byId[id] ? 'pointer' : (IMPORT_BY_NATION[id] ?? []).length > 0 ? 'pointer' : 'default')
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
        .attr('pointer-events', byId[f._id] ? 'none' : 'all')
        .attr('cursor', (!byId[f._id] && (IMPORT_BY_NATION[f._id] ?? []).length > 0) ? 'pointer' : 'default')
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
  arcsGroup = g.append('g').attr('class', 'arcs-group');
});

// ── Legend gradient ───────────────────────────────────────────────────────────
const bar = document.getElementById('legend-bar');
const stops = Array.from({length: 60}, (_, i) => {
  const v = RATIO_MIN + (i / 59) * (RATIO_MAX - RATIO_MIN);
  return color(v);
});
bar.style.background = `linear-gradient(to right, ${stops.join(',')})`;
bar.style.borderRadius = '5px';
