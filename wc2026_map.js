const RATIO_MIN = 0.03;
const RATIO_MAX = 1.20;

const PALETTE = d3.interpolateRgbBasis(['#f3e8f7','#ddb8ea','#c285d8','#a354c2','#7b2d8b','#581f65','#361240']);
const normalize = r => (r - RATIO_MIN) / (RATIO_MAX - RATIO_MIN);
const color = r => PALETTE(Math.max(0, Math.min(1, normalize(r))));

const W = 900, H = 480;
const projection = d3.geoNaturalEarth1().scale(152).translate([W/2, H/2 + 10]);
const path = d3.geoPath(projection);
const svg = d3.select('#map');
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
    const ah = 6 / k, aw = 3 / k;
    g.selectAll('path.arc-line')
      .attr('stroke-width', function() { return +this.getAttribute('data-sw') / k; })
      .attr('d', function() {
        const sx = +this.getAttribute('data-sx'), sy = +this.getAttribute('data-sy');
        const qx = +this.getAttribute('data-qx'), qy = +this.getAttribute('data-qy');
        const tx = +this.getAttribute('data-tx'), ty = +this.getAttribute('data-ty');
        const ux = +this.getAttribute('data-ux'), uy = +this.getAttribute('data-uy');
        return `M${sx},${sy} Q${qx},${qy} ${tx - ux*ah},${ty - uy*ah}`;
      });
    g.selectAll('polygon.arc-line').attr('points', function() {
      const tx = +this.getAttribute('data-tx'), ty = +this.getAttribute('data-ty');
      const ux = +this.getAttribute('data-ux'), uy = +this.getAttribute('data-uy');
      const nx = +this.getAttribute('data-nx'), ny = +this.getAttribute('data-ny');
      const bx = tx - ux*ah, by = ty - uy*ah;
      return `${tx},${ty} ${bx+nx*aw},${by+ny*aw} ${bx-nx*aw},${by-ny*aw}`;
    });
  }));

g.append('path').datum({type:'Sphere'})
  .attr('d', path).attr('fill','#d8d0e8').attr('stroke','#b4a8cc').attr('stroke-width',.5);

g.append('path').datum(d3.geoGraticule()())
  .attr('d', path).attr('fill','none').attr('stroke','#ccc4dc').attr('stroke-width',.25);

// ── Flag CDN helpers ──────────────────────────────────────────────────────────
const FLAG_CDN      = code => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${code}.svg`;
// Rectangular flags for lists; flag-icons supports subdivision codes (gb-eng etc.)
const FLAG_CDN_RECT = code => code.includes('-')
  ? `https://cdn.jsdelivr.net/npm/flag-icons@7/flags/4x3/${code}.svg`
  : `https://flagcdn.com/w20/${code}.png`;

// ── Qualified-nation lookups ──────────────────────────────────────────────────
const QUALIFIED_NAMES = {
  12:'Algeria', 32:'Argentina', 36:'Australia', 40:'Austria',
  56:'Belgium', 70:'Bosnia and Herzegovina', 76:'Brazil', 124:'Canada',
  132:'Cape Verde', 170:'Colombia', 191:'Croatia', 203:'Czech Republic',
  180:'DR Congo', 218:'Ecuador', 250:'France', 276:'Germany',
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
    noImport:      'aucun joueur importé',
    birthNations:  'Nés en',
    pop:           'pop.',
    caps:          'sél.',
    players:       n => `joueur${n > 1 ? 's' : ''}`,
    exported:      n => `joueur${n > 1 ? 's' : ''} exporté${n > 1 ? 's' : ''}`,
    pageTitle:     'Mondial 2026 — Joueurs "exportés" par pays de naissance',
    pageHeading:   'Mondial 2026 — joueurs "exportés" par pays de naissance',
    pageSub:       "Couleur : joueurs exportés / million d'hab. · 281 joueurs au total · source : Wikipedia",
    mapAriaLabel:  'Carte choroplèthe des pays de naissance des joueurs exportés au Mondial 2026',
    zoomHint:      'scroll pour zoomer · glisser pour déplacer',
    legendCaption: "joueurs exportés / million d'hab. · Gris : aucun joueur exporté · drapeau = nation qualifiée au Mondial 2026",
  },
  it: {
    noExport:      'nessun giocatore esportato',
    perMillion:    '/ milione di ab.',
    selections:    'Nazionali',
    bornIn:        'Giocatori nati in',
    imported:      'giocatori importati',
    noImport:      'nessun giocatore importato',
    birthNations:  'Nati in',
    pop:           'ab.',
    caps:          'pres.',
    players:       n => `giocator${n === 1 ? 'e' : 'i'}`,
    exported:      n => `giocator${n === 1 ? 'e esportato' : 'i esportati'}`,
    pageTitle:     'Mondiali 2026 — giocatori "esportati" per paese di nascita',
    pageHeading:   'Mondiali 2026 — giocatori "esportati" per paese di nascita',
    pageSub:       'Colore: giocatori esportati / milione di ab. · 281 giocatori in totale · fonte: Wikipedia',
    mapAriaLabel:  'Mappa coropletica dei paesi di nascita dei giocatori esportati ai Mondiali 2026',
    zoomHint:      'scorri per zoomare · trascina per spostarti',
    legendCaption: 'giocatori esportati / milione di ab. · Grigio: nessun giocatore esportato · bandiera = nazione qualificata ai Mondiali 2026',
  },
  de: {
    noExport:      'kein exportierter Spieler',
    perMillion:    '/ Mio. Einwohner',
    selections:    'Nationalteams',
    bornIn:        'Spieler geboren in',
    imported:      'importierte Spieler',
    noImport:      'kein importierter Spieler',
    birthNations:  'Geb. in',
    pop:           'Einw.',
    caps:          'Sp.',
    players:       () => 'Spieler',
    exported:      n => n === 1 ? 'exportierter Spieler' : 'exportierte Spieler',
    pageTitle:     'WM 2026 — „exportierte“ Spieler nach Geburtsland',
    pageHeading:   'WM 2026 — „exportierte“ Spieler nach Geburtsland',
    pageSub:       'Farbe: exportierte Spieler / Mio. Einwohner · 281 Spieler insgesamt · Quelle: Wikipedia',
    mapAriaLabel:  'Choroplethenkarte der Geburtsländer exportierter Spieler bei der WM 2026',
    zoomHint:      'Scrollen zum Zoomen · Ziehen zum Verschieben',
    legendCaption: 'exportierte Spieler / Mio. Einwohner · Grau: kein exportierter Spieler · Flagge = qualifizierte Nation bei der WM 2026',
  },
  en: {
    noExport:      'no players exported',
    perMillion:    '/ million inhab.',
    selections:    'Selections',
    bornIn:        'Players born in',
    imported:      'imported players',
    noImport:      'no players imported',
    birthNations:  'Born in',
    pop:           'pop.',
    caps:          'caps',
    players:       n => `player${n > 1 ? 's' : ''}`,
    exported:      n => `player${n > 1 ? 's' : ''} exported`,
    pageTitle:     'World Cup 2026 — "exported" players by country of birth',
    pageHeading:   'World Cup 2026 — "exported" players by country of birth',
    pageSub:       'Colour: exported players / million inhab. · 281 players total · source: Wikipedia',
    mapAriaLabel:  'Choropleth map of birth countries of players exported to World Cup 2026',
    zoomHint:      'scroll to zoom · drag to pan',
    legendCaption: 'exported players / million inhab. · Grey: no exported player · flag = nation qualified for World Cup 2026',
  },
}[LANG];

// Apply locale to static page elements
document.documentElement.lang = LANG;
document.title = T.pageTitle;
document.getElementById('page-heading').textContent   = T.pageHeading;
document.getElementById('page-sub').textContent       = T.pageSub;
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
const positionTip = (event, height, wide = false) => {
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
  if (dimActive && !dimDestIds.has(QUALIFIED_BY_NAME[name])) { hideTip(); return; }
  const nId = QUALIFIED_BY_NAME[name];
  if (lastTipKey !== name) {
    lastTipKey = name;
    const fi = code ? `<img class="tt-flag" src="${FLAG_CDN(code)}">` : '';
    let html = `<div class="tt-name">${fi}${countryName(nId, name)}</div>`;
    const hasImports = (IMPORT_BY_NATION[nId] ?? []).length > 0;
    html += `<div class="tt-no-export">${T.noExport}</div>`;
    html += hasImports ? buildImportColHtml(nId) : `<div class="tt-no-export">${T.noImport}</div>`;
    tt.innerHTML = html;
  }
  positionTip(event, 200, false);
};

// ── Dim helpers (click destination highlight) ─────────────────────────────────
let currentK = 1;
let dimActive = false;
let dimSourceId = null;
let dimDestIds = new Map(); // destId → player count
let arcsGroup  = null;
const centroids = {};
let DATA_REF = {};          // set once data loads, used by applyDim
let IMPORT_BY_NATION = {};  // nationId → [{name, birthCountry, birthCountryId, caps}]

const buildImportColHtml = nationId => {
  const players = (IMPORT_BY_NATION[nationId] ?? []).slice().sort((a, b) => b.caps - a.caps);
  if (players.length === 0) return `<div class="tt-no-export">${T.noImport}</div>`;
  const byBirth = {};
  players.forEach(p => {
    const label = countryName(p.birthCountryId, p.birthCountry);
    if (!byBirth[label]) byBirth[label] = 0;
    byBirth[label]++;
  });
  const nations = Object.entries(byBirth).sort((a, b) => b[1] - a[1]);
  const top = players.slice(0, 5);
  let html = `<div class="tt-count tt-count-imp">${players.length}</div>`;
  html += `<div class="tt-label">${T.imported} / 26</div>`;
  html += `<div class="tt-nations">${T.birthNations} : ${nations.map(([n, c]) => `${n} (${c})`).join(', ')}</div>`;
  top.forEach(p => {
    html += `<div class="tt-player"><span>${p.name}</span><span class="tt-nation">← ${countryName(p.birthCountryId, p.birthCountry)}</span></div>`;
  });
  if (players.length > 5) html += `<div class="tt-more">…</div>`;
  return html;
};

const applyDim = (sourceId, destIds, country) => {
  dimActive = true;
  dimSourceId = sourceId;
  dimDestIds = destIds;
  g.selectAll('.flag-qualified').attr('opacity', function() {
    const id = +this.getAttribute('data-id');
    return id === sourceId || destIds.has(id) ? 1 : 0.35;
  });
  // Arcs
  if (arcsGroup) {
    arcsGroup.selectAll('.arc-line').remove();
    const src = centroids[sourceId];
    if (src) {
      destIds.forEach((count, destId) => {
        const dst = centroids[destId];
        if (!dst) return;
        const ddx = dst[0] - src[0], ddy = dst[1] - src[1];
        const dist = Math.sqrt(ddx*ddx + ddy*ddy);
        const qx = (src[0] + dst[0]) / 2;
        const qy = (src[1] + dst[1]) / 2 - dist * 0.3;
        // End tangent: direction from control point to endpoint
        const etx = dst[0] - qx, ety = dst[1] - qy;
        const etLen = Math.sqrt(etx*etx + ety*ety);
        const ux = etx/etLen, uy = ety/etLen; // unit tangent
        const nx = -uy,  ny = ux;             // perpendicular
        const ah = 6 / currentK, aw = 3 / currentK;
        const sw = Math.max(1, Math.sqrt(count)) / currentK;
        const ex = dst[0] - ux*ah, ey = dst[1] - uy*ah;
        arcsGroup.append('path')
          .attr('class', 'arc-line')
          .attr('d', `M${src[0]},${src[1]} Q${qx},${qy} ${ex},${ey}`)
          .attr('fill', 'none').attr('stroke', '#bbb')
          .attr('stroke-width', sw).attr('data-sw', Math.max(1, Math.sqrt(count))).attr('opacity', 0.6)
          // bezier + tangent params for zoom rescaling
          .attr('data-sx', src[0]).attr('data-sy', src[1])
          .attr('data-qx', qx).attr('data-qy', qy)
          .attr('data-tx', dst[0]).attr('data-ty', dst[1])
          .attr('data-ux', ux).attr('data-uy', uy);
        const bx = dst[0] - ux*ah, by = dst[1] - uy*ah;
        arcsGroup.append('polygon')
          .attr('class', 'arc-line')
          .attr('points', `${dst[0]},${dst[1]} ${bx+nx*aw},${by+ny*aw} ${bx-nx*aw},${by-ny*aw}`)
          .attr('fill', '#bbb').attr('opacity', 0.8)
          // tangent + perpendicular params for zoom rescaling
          .attr('data-tx', dst[0]).attr('data-ty', dst[1])
          .attr('data-ux', ux).attr('data-uy', uy)
          .attr('data-nx', nx).attr('data-ny', ny);
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
  // Raise source flag above arc group
  g.selectAll('.flag-qualified').filter(function() {
    return +this.getAttribute('data-id') === sourceId;
  }).raise();

  // Player table
  document.getElementById('pt-flag').src = fc ? FLAG_CDN_RECT(fc) : '';
  const cnt = DATA_REF[sourceId]?.count ?? 0;
  document.getElementById('pt-title').textContent =
    `${countryName(sourceId, country)} — ${cnt} ${T.exported(cnt)}`;
  const nationsEl = document.getElementById('pt-nations');
  nationsEl.innerHTML = '';
  const players = DATA_REF[sourceId]?.players ?? [];
  // Group by nation (already sorted by nation order)
  const groups = [];
  players.forEach(p => {
    if (!groups.length || groups[groups.length-1].nation !== p.nation)
      groups.push({ nation: p.nation, players: [] });
    groups[groups.length-1].players.push(p);
  });
  groups.forEach(({ nation, players: gp }) => {
    const nc = ISO2[QUALIFIED_BY_NAME[nation]];
    const header = document.createElement('div');
    header.className = 'pt-nation-header';
    header.innerHTML = `${nc ? `<img src="${FLAG_CDN_RECT(nc)}">` : ''}<span class="pt-nation-name">${countryName(QUALIFIED_BY_NAME[nation], nation)}</span><span class="pt-nation-count">${gp.length} ${T.players(gp.length)}</span>`;
    nationsEl.appendChild(header);
    gp.forEach(p => {
      const row = document.createElement('div');
      row.className = 'pt-player-row';
      const wikiLang = p.wiki_langs?.[LANG];
      const wikiEn   = p.wiki_langs?.en ?? null;
      const nameHtml = wikiLang
        ? `<a href="${wikiLang}" target="_blank" rel="noopener" class="pt-wiki">${p.name}</a>`
        : wikiEn
          ? `${p.name} (<a href="${wikiEn}" target="_blank" rel="noopener" class="pt-wiki">en</a>)`
          : p.name;
      row.innerHTML = `<span>${nameHtml}</span><span class="pt-caps">${p.caps} ${T.caps}</span>`;
      nationsEl.appendChild(row);
    });
  });
  document.getElementById('player-table').style.display = '';

  document.body.classList.add('dim-active');
  dimBadge.style('display', null);
};
const clearDim = () => {
  dimActive = false;
  dimSourceId = null;
  dimDestIds = new Map();
  g.selectAll('.flag-qualified').attr('opacity', null);
  if (arcsGroup) arcsGroup.selectAll('.arc-line').remove();
  document.body.classList.remove('dim-active');
  dimBadge.style('display', 'none');
  document.getElementById('player-table').style.display = 'none';
};

// ── Flag join helpers ─────────────────────────────────────────────────────────
const placeFlag = (sel) => {
  sel.attr('class','flag-qualified')
    .attr('width', FLAG).attr('height', FLAG)
    .on('mouseleave', hideTip);
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

  DATA.forEach(rec => {
    rec.players.forEach(p => {
      const nId = QUALIFIED_BY_NAME[p.nation];
      if (nId == null) return;
      if (countryName(rec.id, rec.country) === countryName(nId, QUALIFIED_NAMES[nId])) return;
      if (!IMPORT_BY_NATION[nId]) IMPORT_BY_NATION[nId] = [];
      IMPORT_BY_NATION[nId].push({ name: p.name, birthCountry: rec.country, birthCountryId: rec.id, caps: p.caps });
    });
  });

  // ── Shared tooltip/click helpers (used by both world and UK nation paths) ──────

  const showExportTip = (event, id) => {
    const rec = byId[id];
    if (!rec) { hideTip(); return; }
    const hasImports = !!QUALIFIED_NAMES[id] && (IMPORT_BY_NATION[id] ?? []).length > 0;
    if (lastTipKey !== id) {
      lastTipKey = id;
      const _r2 = rec.ratio !== null ? rec.ratio.toFixed(2) : '?';
      const ratio = _r2 === '0.00' ? rec.ratio.toPrecision(2) : _r2;
      const popStr = rec.pop ? (rec.pop >= 10 ? Math.round(rec.pop) + 'M' : rec.pop.toFixed(1) + 'M') : '?';
      const fc = ISO2[rec.id];
      const fi = fc ? `<img class="tt-flag" src="${FLAG_CDN(fc)}">` : '';
      let html = `<div class="tt-name">${fi}${countryName(rec.id, rec.country)}</div>`;
      let leftCol = '';
      leftCol += `<div class="tt-count">${rec.count}</div>`;
      leftCol += `<div class="tt-label">${T.exported(rec.count)}</div>`;
      leftCol += `<div class="tt-sub">${ratio} ${T.perMillion} · ${T.pop} ${popStr}</div>`;
      leftCol += `<div class="tt-nations">${T.selections} : ${rec.nations.map(([n,c]) => `${countryName(QUALIFIED_BY_NAME[n], n)} (${c})`).join(', ')}</div>`;
      rec.top.forEach(p => {
        leftCol += `<div class="tt-player"><span>${p.name}</span><span class="tt-nation">→ ${countryName(QUALIFIED_BY_NAME[p.nation], p.nation)}</span></div>`;
      });
      if (rec.count > rec.top.length) leftCol += `<div class="tt-more">…</div>`;
      if (hasImports) {
        html += `<div class="tt-columns"><div class="tt-col">${leftCol}</div><div class="tt-vdiv"></div><div class="tt-col">${buildImportColHtml(id)}</div></div>`;
      } else {
        html += leftCol;
        if (QUALIFIED_NAMES[id]) html += `<div class="tt-no-export">${T.noImport}</div>`;
      }
      tt.innerHTML = html;
    }
    positionTip(event, 240, hasImports);
  };

  const showImportTip = (event, destId) => {
    const key = `import-${dimSourceId}-${destId}`;
    const srcRec = byId[dimSourceId];
    if (!srcRec) { hideTip(); return; }
    const destName = QUALIFIED_NAMES[destId];
    const allPlayers = (srcRec.players ?? []).filter(p => p.nation === destName);
    const players = allPlayers.slice(0, 5);
    if (lastTipKey !== key) {
      lastTipKey = key;
      const destFc = ISO2[destId];
      const destFi = destFc ? `<img class="tt-flag" src="${FLAG_CDN(destFc)}">` : '';
      let html = `<div class="tt-name">${destFi}${countryName(destId, destName)}</div>`;
      html += `<div class="tt-nations">${T.bornIn} ${countryName(dimSourceId, srcRec.country)} (${allPlayers.length})</div>`;
      players.forEach(p => {
        html += `<div class="tt-player"><span>${p.name}</span></div>`;
      });
      if (allPlayers.length > 5) html += `<div class="tt-more">…</div>`;
      tt.innerHTML = html;
    }
    positionTip(event, 48 + 20 + 24 * players.length + (allPlayers.length > 5 ? 18 : 0));
  };

  const onCountryMousemove = (event, id) => {
    if (dimActive) {
      if (!dimDestIds.has(id)) { hideTip(); return; }
      showImportTip(event, id); return;
    }
    if (byId[id]) showExportTip(event, id);
    else if (QUALIFIED_NAMES[id]) showQualifiedTip(event, QUALIFIED_NAMES[id], ISO2[id]);
    else hideTip();
  };

  const onCountryClick = (event, id) => {
    event.stopPropagation();
    if (dimActive) { clearDim(); return; }
    const rec = byId[id];
    if (!rec) return;
    hideTip();
    const destIds = new Map(rec.nations.flatMap(([n,c]) => {
      const did = QUALIFIED_BY_NAME[n];
      return did !== undefined ? [[did, c]] : [];
    }));
    applyDim(id, destIds, rec.country);
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
    .on('mouseleave', hideTip)
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
    .on('mouseleave', hideTip)
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
    .attr('cursor', d => byId[+d.id] ? null : 'default')
    .on('mousemove', (event, d) => onCountryMousemove(event, +d.id));

  STANDALONE_FLAGS.forEach(({ id, lon, lat }) => {
    const [cx, cy] = projection([lon, lat]);
    g.append('image')
      .call(placeFlag)
      .attr('href', FLAG_CDN(ISO2[id]))
      .attr('data-id', id)
      .attr('data-cx', cx).attr('data-cy', cy)
      .attr('x', cx - FLAG/2).attr('y', cy - FLAG/2)
      .attr('pointer-events', 'all')
      .attr('cursor', 'default')
      .on('mousemove', (event) => onCountryMousemove(event, id));
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
        .attr('cursor', byId[f._id] ? null : 'default')
        .on('mousemove', (event) => onCountryMousemove(event, f._id));
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
