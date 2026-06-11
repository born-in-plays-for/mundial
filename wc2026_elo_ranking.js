const _CDN = c => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${c}.svg`;

// opts:
//   items        [{id, rank, pts, iso2, name, exp?, imp?}] — sorted by rank, built by caller
//                exp: true → blue ● superscript (born here, plays elsewhere)
//                imp: true → red  ● superscript (born elsewhere, plays here)
//   onCountryClick(id)   — called on click; if null, no items are clickable
//   isClickable(id)      — optional per-item predicate; defaults to all clickable
//   isMuted(id)          — optional per-item predicate; adds elo-item--muted class
//   getSelectedId()      — optional; called once at render to set initial highlight
//   controls             — optional DOM element placed right-aligned in the header row
//   title, source, date  — header strings
//
// Returns update(id) for surgical highlight changes after render.
export function renderEloRanking(container, opts = {}) {
  const {
    items        = [],
    onCountryClick = null,
    isClickable  = null,
    isMuted      = null,
    getSelectedId = null,
    controls     = null,
    title  = 'World Football Elo Ratings',
    source = 'eloratings.net',
    date   = '',
  } = opts;

  const wrap = document.createElement('div');

  const hdr = document.createElement('div');
  hdr.className = 'elo-header';
  if (controls) {
    hdr.style.cssText = 'flex-direction:row;align-items:flex-start;justify-content:space-between;gap:8px';
    const left = document.createElement('div');
    left.innerHTML =
      `<span class="elo-title">${title}</span><br>` +
      `<span class="elo-meta">${items.length} nations · ${source}${date ? ' · ' + date : ''}</span>`;
    hdr.appendChild(left);
    hdr.appendChild(controls);
  } else {
    hdr.innerHTML =
      `<span class="elo-title">${title}</span>` +
      `<span class="elo-meta">${items.length} nations · ${source}${date ? ' · ' + date : ''}</span>`;
  }
  wrap.appendChild(hdr);

  const ul = document.createElement('ul');
  ul.className = 'elo-list';
  const itemById = new Map();

  for (const { id, rank, pts, iso2, name, exp = false, imp = false } of items) {
    const clickable = onCountryClick != null && (isClickable == null || isClickable(id));
    const muted     = isMuted != null && isMuted(id);
    const dots = (exp ? '<sup class="elo-dot" style="color:#3b82f6" title="exports players">●</sup>' : '') +
                 (imp ? '<sup class="elo-dot" style="color:#ef4444" title="imports players">●</sup>' : '');
    const li = document.createElement('li');
    li.className = 'elo-item' + (clickable ? ' elo-item--clickable' : '') + (muted ? ' elo-item--muted' : '');
    li.innerHTML =
      `<span class="elo-rank">${rank}</span>` +
      (iso2 ? `<img class="elo-flag" src="${_CDN(iso2)}" alt="">` : `<span class="elo-flag"></span>`) +
      `<span class="elo-name">${name}${dots}</span>` +
      (pts != null ? `<span class="elo-pts">${pts}</span>` : '');
    if (clickable) li.addEventListener('click', () => onCountryClick(id));
    itemById.set(id, li);
    ul.appendChild(li);
  }

  wrap.appendChild(ul);
  container.innerHTML = '';
  container.appendChild(wrap);

  let _activeId = null;
  const update = id => {
    itemById.get(_activeId)?.classList.remove('elo-item--active');
    _activeId = id ?? null;
    itemById.get(_activeId)?.classList.add('elo-item--active');
  };
  if (getSelectedId) update(getSelectedId());
  return update;
}
