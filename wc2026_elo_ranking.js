const _CDN = c => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${c}.svg`;

// opts:
//   items        [{id, rank, pts, iso2, name}] — sorted by rank, built by caller
//   onCountryClick(id)   — called on click; if null, no items are clickable
//   isClickable(id)      — optional per-item predicate; defaults to all clickable
//   isMuted(id)          — optional per-item predicate; adds elo-item--muted class
//   getSelectedId()      — optional; called once at render to set initial highlight
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
    title  = 'World Football Elo Ratings',
    source = 'eloratings.net',
    date   = '',
  } = opts;

  const wrap = document.createElement('div');

  const hdr = document.createElement('div');
  hdr.className = 'elo-header';
  hdr.innerHTML =
    `<span class="elo-title">${title}</span>` +
    `<span class="elo-meta">${items.length} nations · ${source}${date ? ' · ' + date : ''}</span>`;
  wrap.appendChild(hdr);

  const ul = document.createElement('ul');
  ul.className = 'elo-list';
  const itemById = new Map();

  for (const { id, rank, pts, iso2, name } of items) {
    const clickable = onCountryClick != null && (isClickable == null || isClickable(id));
    const muted     = isMuted != null && isMuted(id);
    const li = document.createElement('li');
    li.className = 'elo-item' + (clickable ? ' elo-item--clickable' : '') + (muted ? ' elo-item--muted' : '');
    li.innerHTML =
      `<span class="elo-rank">${rank}</span>` +
      (iso2 ? `<img class="elo-flag" src="${_CDN(iso2)}" alt="">` : `<span class="elo-flag"></span>`) +
      `<span class="elo-name">${name}</span>` +
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
