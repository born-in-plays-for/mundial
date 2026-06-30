const _CDN    = c => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${c}.svg`;
const _NS     = 'http://www.w3.org/2000/svg';
const _svgEl  = (tag, a={}) => { const e=document.createElementNS(_NS,tag); Object.entries(a).forEach(([k,v])=>e.setAttribute(k,String(v))); return e; };
const _svgTxt = (tag, a, s)  => { const e=_svgEl(tag,a); e.textContent=s; return e; };

import { regionName } from '../js/i18n.js';

function _orthoPath(px, py, cx, cy, FR, mode) {
  const OFF = 5;
  if (mode === 'below') {
    const off = px < cx ? -OFF : OFF;
    const ex = cx + off;
    return `M${px},${py} L${ex},${py} L${ex},${cy + FR}`;
  } else if (mode === 'right') {
    const off = py > cy ? OFF : -OFF;
    const ey = cy + off;
    return `M${px},${py} L${px},${ey} L${cx + FR},${ey}`;
  } else {
    const off = py > cy ? OFF : -OFF;
    const ey = cy + off;
    return `M${px},${py} L${px},${ey} L${cx - FR},${ey}`;
  }
}

const _spanHtml  = (t, col) => `<span style="color:${col};font-weight:600;white-space:nowrap">${t}</span>`;

const _defaultLabels = { pre: 'Le plus long', bornIn: 'né en', playsFor: 'joue pour', post: 'chemin' };

// Returns an updateSelection(newIdx) function for surgical selection updates.
export function renderChain(chain, container, opts = {}) {
  const { onCountryClick = null, getSelectedIndex = null, getPlayerWikiUrl = null, labels = null, headerContainer = null } = opts;
  const L = labels ?? _defaultLabels;
  const PAD  = 0;
  const SIDE = 90;
  const CW   = 120;
  const FR   = 22;

  const availW = container.clientWidth || container.parentElement?.clientWidth || 800;
  const n = chain.nodes.length;
  const N  = Math.max(2, Math.floor((Math.min(availW - 2*PAD, 1400) - 2*SIDE) / CW));
  const PW = 2*SIDE + N*CW;

  const FLAG_Y   = 26;
  const NAME_Y   = FLAG_Y + FR + 13;
  const PLR_Y    = NAME_Y + 20;
  const CITY_Y   = PLR_Y + 12;
  const ARROW_Y  = CITY_Y + 8;
  const ROW_H    = ARROW_Y + 14;

  const TH      = 4;
  const numRows = Math.ceil(n / N);
  const H       = TH + numRows * ROW_H + 20;

  const cPos = i => {
    const row = Math.floor(i / N);
    const col = (row%2===0) ? i%N : N-1-(i%N);
    return { x: SIDE + col*CW + CW/2, y: TH + row*ROW_H + FLAG_Y, row };
  };

  const pPos = (cp0, cp1) => {
    if (cp0.row === cp1.row) {
      return { x: (cp0.x + cp1.x) / 2, y: TH + cp0.row * ROW_H + ARROW_Y, mode: 'below' };
    }
    const right = cp0.row % 2 === 0;
    return { x: right ? PW - SIDE/2 : SIDE/2, y: (cp0.y + cp1.y) / 2, mode: right ? 'right' : 'left' };
  };

  // ── HTML header (legend + subtitle + nav buttons) ────────────────────────────
  const _navBtns = [];
  const { nodes, links } = chain;
  const nn = nodes.length;
  const selIdx = getSelectedIndex?.() ?? -1;

  container.innerHTML = '';
  const wrapper = document.createElement('div');
  container.appendChild(wrapper);

  const hdrParent = headerContainer ?? wrapper;
  const subtitleText = L.subtitle ? L.subtitle(links.length, nodes.length) : chain.subtitle;
  const _btnStyle = dis => `width:28px;height:24px;border-radius:5px;border:none;background:#e8e4de;color:#888;font-size:13px;display:flex;align-items:center;justify-content:center;cursor:${dis ? 'default' : 'pointer'};opacity:${dis ? '0.35' : '1'}`;
  hdrParent.innerHTML = `
    <div class="d-flex align-items-center gap-2 py-1 overflow-hidden">
      <div class="fw-semibold flex-shrink-1 text-truncate" style="font-size:12px;min-width:0">[${_spanHtml(`← ${L.bornIn}`, '#3b82f6')} | ${_spanHtml(`${L.playsFor} →`, '#ef4444')}]</div>
      <div class="text-truncate" style="flex:1 1 0%;min-width:0;font-size:10px;color:var(--color-dim)">${subtitleText ?? ''}</div>
      ${onCountryClick ? `<div class="ms-auto d-flex gap-1 flex-shrink-0">
        <button data-nav="-1" style="${_btnStyle(selIdx >= 0 && selIdx === 0)}">◀</button>
        <button data-nav="1"  style="${_btnStyle(selIdx >= 0 && selIdx === nn - 1)}">▶</button>
      </div>` : ''}
    </div>`;
  if (onCountryClick) {
    hdrParent.querySelectorAll('[data-nav]').forEach(btn => {
      const delta = +btn.dataset.nav;
      btn.addEventListener('click', () => {
        const c = getSelectedIndex?.() ?? -1;
        if (c >= 0 && (delta < 0 ? c === 0 : c === nn - 1)) return;
        const next = c < 0 ? (delta > 0 ? 0 : nn - 1) : c + delta;
        if (next >= 0 && next < nn) onCountryClick(nodes[next]);
      });
      _navBtns.push({ btn, delta });
    });
  }

  // ── SVG ──────────────────────────────────────────────────────────────────────
  const svg = _svgEl('svg', { width:PW, height:H, viewBox:`0 0 ${PW} ${H}`,
    style:`font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:block;overflow:visible;max-width:100%;height:auto` });

  const defs = _svgEl('defs');
  [['blu','#3b82f6'],['red','#ef4444']].forEach(([id,col]) => {
    const mk = _svgEl('marker',{id, viewBox:'0 -3 7 6', refX:7, refY:0, markerWidth:5, markerHeight:5, orient:'auto'});
    mk.appendChild(_svgEl('path',{d:'M0,-3L7,0L0,3Z', fill:col}));
    defs.appendChild(mk);
  });
  const styleEl = document.createElementNS(_NS, 'style');
  styleEl.textContent = '.cplr{fill:#444;font-style:normal;font-weight:400;text-decoration:none}.cplr-a{text-decoration:none}.cplr-a>.cplr{cursor:pointer}.cplr-a:hover>.cplr{fill:#7b2d8b}.cplr-a>tspan{cursor:pointer;fill:#888;text-decoration:none}.cplr-a:hover>tspan{fill:#7b2d8b}';
  defs.appendChild(styleEl);
  svg.appendChild(defs);

  const cp = nodes.map((_,i) => cPos(i));

  /* ── 0. Selection backgrounds — rendered first so arrows draw on top ────────── */
  const _selBgs = [];
  const P = FR + 7;
  nodes.forEach((node, i) => {
    const {x, y} = cp[i];
    const selBg = _svgEl('rect', {x:x-P, y:y-P, width:P*2, height:P*2, rx:10, fill:'#d8d4ce',
      visibility: i === selIdx ? 'visible' : 'hidden'});
    svg.appendChild(selBg);
    _selBgs.push(selBg);
  });

  /* ── 1. Arrows ─────────────────────────────────────────────────────────────── */
  links.forEach((lk, i) => {
    const p0 = cp[i], p1 = cp[i+1];
    const pp = pPos(p0, p1);
    const isFwd = lk.direction === 'fwd';
    const bornC  = isFwd ? p0 : p1;
    const playsC = isFwd ? p1 : p0;
    const drw = (tgt, color, mid) => svg.appendChild(_svgEl('path',{
      d: _orthoPath(pp.x, pp.y, tgt.x, tgt.y, FR, pp.mode),
      stroke:color, 'stroke-width':1.8, fill:'none', 'marker-end':`url(#${mid})`
    }));
    drw(bornC,  '#3b82f6', 'blu');
    drw(playsC, '#ef4444', 'red');
  });

  /* ── 2. Player text nodes ──────────────────────────────────────────────────── */
  const halo = { stroke:'#fff', 'stroke-width':3, 'paint-order':'stroke', 'dominant-baseline':'middle' };
  const appendPlayer = (attrs, name) => {
    const base = {...attrs, 'font-size':12, class:'cplr', 'dominant-baseline':'middle'};
    const wiki = getPlayerWikiUrl?.(name) ?? null;
    if (!wiki) {
      svg.appendChild(_svgTxt('text', base, name));
    } else if (!wiki.fallback) {
      const a = _svgEl('a', {href:wiki.href, target:'_blank', rel:'noopener', class:'cplr-a'});
      a.appendChild(_svgTxt('text', base, name));
      svg.appendChild(a);
    } else {
      const t = _svgEl('text', base);
      t.appendChild(document.createTextNode(`${name} (`));
      const a = _svgEl('a', {href:wiki.href, target:'_blank', rel:'noopener', class:'cplr-a'});
      const sp = _svgEl('tspan', {});
      sp.textContent = 'en';
      a.appendChild(sp);
      t.appendChild(a);
      t.appendChild(document.createTextNode(')'));
      svg.appendChild(t);
    }
  };
  links.forEach((lk, i) => {
    const p0 = cp[i], p1 = cp[i+1];
    const pp = pPos(p0, p1);
    const isFwd = lk.direction === 'fwd';
    const bornC = isFwd ? p0 : p1;

    if (pp.mode === 'below') {
      const nameY = pp.y - (ARROW_Y - PLR_Y);
      const cityY = pp.y - (ARROW_Y - CITY_Y);
      const blueLeft  = bornC.x < pp.x;
      const elbowOff  = blueLeft ? +5 : -5;
      const elbowX    = bornC.x + elbowOff;
      appendPlayer({x:pp.x, y:nameY, 'text-anchor':'middle'}, lk.player);
      svg.appendChild(_svgTxt('text',{
        x: elbowX + (blueLeft ? 3 : -3), y:cityY, 'text-anchor': blueLeft ? 'start' : 'end',
        'font-size':8, fill:'#aaa', ...halo
      }, lk.city));
    } else {
      const nameY    = pp.y - 6;
      const elbowOff = pp.y > bornC.y ? 5 : -5;
      const cityY    = bornC.y + elbowOff - 7;
      const cityX    = pp.mode === 'right' ? pp.x - 3 : pp.x + 3;
      const cityAnch = pp.mode === 'right' ? 'end' : 'start';
      appendPlayer({x:cityX, y:nameY, 'text-anchor':cityAnch}, lk.player);
      svg.appendChild(_svgTxt('text',{
        x:cityX, y:cityY, 'text-anchor':cityAnch,
        'font-size':8, fill:'#aaa', ...halo
      }, lk.city));
    }
  });

  /* ── 3. Country nodes ──────────────────────────────────────────────────────── */
  nodes.forEach((node, i) => {
    const {x,y} = cp[i];
    const nameTxt = regionName(node.code, node.country);
    const fsz = Math.max(9, Math.min(13, Math.floor(CW / (nameTxt.length * 0.65))));
    const ng = _svgEl('g');
    const txt = _svgTxt('text',{
      x, y: y + FR + 16,
      'text-anchor':'middle', 'dominant-baseline':'middle',
      'font-size':fsz, 'font-weight':700, fill:'#1a1a18'
    }, nameTxt);
    const lblW = Math.ceil(nameTxt.length * fsz * 0.62) + 8;
    const lblH = fsz + 4;
    const lblBg = _svgEl('rect', {
      x: x - lblW/2, y: y + FR + 16 - lblH/2,
      width: lblW, height: lblH, rx: 3,
      fill: 'rgba(255,255,255,0.65)'
    });
    ng.appendChild(_svgEl('circle',{cx:x, cy:y, r:FR+1, fill:'#fff9f5'}));
    ng.appendChild(_svgEl('image',{href:_CDN(node.code), x:x-FR, y:y-FR, width:FR*2, height:FR*2}));
    ng.appendChild(lblBg);
    ng.appendChild(txt);
    svg.appendChild(ng);
  });

  if (onCountryClick) {
    nodes.forEach((node, i) => {
      const {x, y} = cp[i];
      const hit = _svgEl('circle', {cx:x, cy:y, r:FR, fill:'transparent', cursor:'pointer', class:'chain-hit'});
      hit.addEventListener('click', () => onCountryClick(node));
      svg.appendChild(hit);
    });
  }

  wrapper.appendChild(svg);

  // Returned function updates only selection state — no SVG rebuild, no flicker.
  let _currentIdx = selIdx;
  const update = newIdx => {
    _currentIdx = newIdx;
    _selBgs.forEach((r, i) => r.setAttribute('visibility', i === newIdx ? 'visible' : 'hidden'));
    _navBtns.forEach(({ btn, delta }) => {
      const dis = newIdx >= 0 && (delta < 0 ? newIdx === 0 : newIdx === nn - 1);
      btn.style.opacity = dis ? '0.35' : '1';
      btn.style.cursor  = dis ? 'default' : 'pointer';
    });
  };
  update.scrollActive = () => {
    const el = _currentIdx >= 0 ? _selBgs[_currentIdx] : null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const padTop = parseFloat(document.documentElement.style.scrollPaddingTop)    || 0;
    const padBot = parseFloat(document.documentElement.style.scrollPaddingBottom) || 0;
    if (r.top < padTop || r.bottom > window.innerHeight - padBot)
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  return update;
}
