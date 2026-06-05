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

// ── Flag CDN helper ───────────────────────────────────────────────────────────
const FLAG_CDN = code => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${code}.svg`;

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
const positionTip = (event, height) => {
  let x = event.clientX + 16, y = event.clientY + 16;
  if (x + 270 > window.innerWidth)  x = event.clientX - 274;
  if (y + height > window.innerHeight) y = event.clientY - (height + 4);
  tt.style.left = x + 'px';
  tt.style.top  = y + 'px';
  tt.style.display = 'block';
};

let lastTipKey = null;

const hideTip = () => { tt.style.display = 'none'; lastTipKey = null; };

const showQualifiedTip = (event, name, code) => {
  const hasExports = !!DATA_REF[QUALIFIED_BY_NAME[name]];
  if (lastTipKey !== name) {
    lastTipKey = name;
    const fi = code ? `<img class="tt-flag" src="${FLAG_CDN(code)}">` : '';
    const note = hasExports ? '' : '<div class="tt-no-export">aucun joueur exporté</div>';
    tt.innerHTML = `<div class="tt-name">${fi}${name}</div>${note}`;
  }
  positionTip(event, hasExports ? 48 : 64);
};

// ── Dim helpers (click destination highlight) ─────────────────────────────────
let currentK = 1;
let dimActive = false;
let dimDestIds = new Map(); // destId → player count
let arcsGroup  = null;
const centroids = {};
let DATA_REF = {}; // set once data loads, used by applyDim

const applyDim = (sourceId, destIds, country) => {
  dimActive = true;
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
  const badgeW = Math.round(country.length * 5.8 + 46);
  const bx = 895 - badgeW;
  dimBadgeRect.attr('x', bx).attr('width', badgeW);
  dimBadgeFlag.attr('href', fc ? FLAG_CDN(fc) : '').attr('x', bx + 8);
  dimBadgeText.attr('x', bx + 30).text(country);
  // Raise source flag above arc group
  g.selectAll('.flag-qualified').filter(function() {
    return +this.getAttribute('data-id') === sourceId;
  }).raise();

  // Player table
  document.getElementById('pt-flag').src = fc ? FLAG_CDN(fc) : '';
  document.getElementById('pt-title').textContent =
    `${country} — ${DATA_REF[sourceId]?.count ?? ''} joueur${(DATA_REF[sourceId]?.count ?? 1) > 1 ? 's' : ''} exporté${(DATA_REF[sourceId]?.count ?? 1) > 1 ? 's' : ''}`;
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
    header.innerHTML = `${nc ? `<img src="${FLAG_CDN(nc)}">` : ''}<span class="pt-nation-name">${nation}</span><span class="pt-nation-count">${gp.length} joueur${gp.length > 1 ? 's' : ''}</span>`;
    nationsEl.appendChild(header);
    gp.forEach(p => {
      const row = document.createElement('div');
      row.className = 'pt-player-row';
      row.innerHTML = `<span>${p.name}</span><span class="pt-caps">${p.caps} sél.</span>`;
      nationsEl.appendChild(row);
    });
  });
  document.getElementById('player-table').style.display = '';

  document.body.classList.add('dim-active');
  dimBadge.style('display', null);
};
const clearDim = () => {
  dimActive = false;
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

  // ── Shared tooltip/click helpers (used by both world and UK nation paths) ──────
  const showExportTip = (event, id) => {
    const rec = byId[id];
    if (!rec) { hideTip(); return; }
    if (lastTipKey !== id) {
      lastTipKey = id;
      const _r2 = rec.ratio !== null ? rec.ratio.toFixed(2) : '?';
      const ratio = _r2 === '0.00' ? rec.ratio.toPrecision(2) : _r2;
      const popStr = rec.pop ? (rec.pop >= 10 ? Math.round(rec.pop) + 'M' : rec.pop.toFixed(1) + 'M') : '?';
      const fc = ISO2[rec.id];
      const dimmed = fc && !QUALIFIED_NAMES[rec.id] ? ' style="opacity:0.35;filter:grayscale(50%)"' : '';
      const fi = fc ? `<img class="tt-flag"${dimmed} src="${FLAG_CDN(fc)}">` : '';
      let html = `<div class="tt-name">${fi}${rec.country}</div>`;
      html += `<div class="tt-count">${ratio}</div>`;
      html += `<div class="tt-label">joueur${rec.count>1?'s':''} exporté${rec.count>1?'s':''} / million d'hab.</div>`;
      html += `<div class="tt-sub">${rec.count} joueur${rec.count>1?'s':''} · pop. ${popStr}</div>`;
      html += `<div class="tt-nations">Sélections : ${rec.nations.map(([n,c]) => `${n} (${c})`).join(', ')}</div>`;
      rec.top.forEach(p => {
        html += `<div class="tt-player"><span>${p.name}</span><span class="tt-nation">→ ${p.nation}</span></div>`;
      });
      tt.innerHTML = html;
    }
    positionTip(event, 240);
  };

  const onCountryMousemove = (event, id) => {
    if (dimActive) {
      if (!dimDestIds.has(id)) { hideTip(); return; }
      if (!byId[id]) { showQualifiedTip(event, QUALIFIED_NAMES[id], ISO2[id]); return; }
    }
    if (byId[id]) showExportTip(event, id); else hideTip();
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
    .on('mousemove', (event, d) => showQualifiedTip(event, QUALIFIED_NAMES[+d.id], ISO2[+d.id]));

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
      .on('mousemove', (event) => showQualifiedTip(event, QUALIFIED_NAMES[id], ISO2[id]));
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
        .on('mousemove', (event) => showQualifiedTip(event, QUALIFIED_NAMES[f._id], ISO2[f._id]));
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
