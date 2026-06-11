const _CDN = c => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${c}.svg`;

// opts:
//   items        [{id, rank, pts, iso2, name}] — sorted by rank, built by caller
//   onCountryClick(id)   — called on click; if null, no items are clickable
//   isClickable(id)      — optional per-item predicate; defaults to all clickable
//   getSelectedId()      — optional; called once at render to set initial highlight
//   title, source, date  — header strings
//
// Returns update(id) for surgical highlight changes after render.
export function renderFifaRanking(container, opts = {}) {
  const {
    items        = [],
    onCountryClick = null,
    isClickable  = null,
    getSelectedId = null,
    title  = 'FIFA World Rankings',
    source = 'FIFA.com',
    date   = '',
  } = opts;

  const wrap = document.createElement('div');

  const hdr = document.createElement('div');
  hdr.className = 'fifa-header';
  hdr.innerHTML =
    `<span class="fifa-title">${title}</span>` +
    `<span class="fifa-meta">${items.length} nations · ${source}${date ? ' · ' + date : ''}</span>`;
  wrap.appendChild(hdr);

  const ul = document.createElement('ul');
  ul.className = 'fifa-list';
  const itemById = new Map();

  for (const { id, rank, pts, iso2, name } of items) {
    const clickable = onCountryClick != null && (isClickable == null || isClickable(id));
    const li = document.createElement('li');
    li.className = 'fifa-item' + (clickable ? ' fifa-item--clickable' : '');
    li.innerHTML =
      `<span class="fifa-rank">${rank}</span>` +
      (iso2 ? `<img class="fifa-flag" src="${_CDN(iso2)}" alt="">` : `<span class="fifa-flag"></span>`) +
      `<span class="fifa-name">${name}</span>` +
      (pts != null ? `<span class="fifa-pts">${pts}</span>` : '');
    if (clickable) li.addEventListener('click', () => onCountryClick(id));
    itemById.set(id, li);
    ul.appendChild(li);
  }

  wrap.appendChild(ul);
  container.innerHTML = '';
  container.appendChild(wrap);

  let _activeId = null;
  const update = id => {
    itemById.get(_activeId)?.classList.remove('fifa-item--active');
    _activeId = id ?? null;
    itemById.get(_activeId)?.classList.add('fifa-item--active');
  };
  if (getSelectedId) update(getSelectedId());
  return update;
}
