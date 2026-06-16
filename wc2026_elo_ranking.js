const _CDN = c => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${c}.svg`;

// opts:
//   items        [{id, rank, pts, iso2, name, exp?, imp?}] — sorted by rank, built by caller
//                exp: true → blue ● superscript (born here, plays elsewhere)
//                imp: true → red  ● superscript (born elsewhere, plays here)
//   onCountryClick(id)   — called on click; if null, no items are clickable
//   isClickable(id)      — optional per-item predicate; defaults to all clickable
//   getSelectedId()      — optional; called once at render to set initial highlight
//   title, source, date  — header strings (currently unused — header commented out)
//
// Returns update(id) for surgical highlight changes after render.
export function renderEloRanking(container, opts = {}) {
  const {
    items        = [],
    onCountryClick = null,
    isClickable  = null,
    isZoomable   = null,
    getSelectedId = null,
    title  = 'World Football Elo Ratings',
    source = 'eloratings.net',
    date   = '',
  } = opts;

  const wrap = document.createElement('div');

  // const hdr = document.createElement('div');
  // hdr.className = 'elo-header';
  // if (controls) {
  //   hdr.style.cssText = 'flex-direction:row;align-items:flex-start;justify-content:space-between;gap:8px';
  //   const left = document.createElement('div');
  //   left.innerHTML =
  //     `<span class="elo-title">${title}</span><br>` +
  //     `<span class="elo-meta">${items.length} nations · ${source}${date ? ' · ' + date : ''}</span>`;
  //   hdr.appendChild(left);
  //   hdr.appendChild(controls);
  // } else {
  //   hdr.innerHTML =
  //     `<span class="elo-title">${title}</span>` +
  //     `<span class="elo-meta">${items.length} nations · ${source}${date ? ' · ' + date : ''}</span>`;
  // }
  // wrap.appendChild(hdr);

  const ul = document.createElement('ul');
  ul.className = 'elo-list';
  const itemById = new Map();

  for (const { id, rank, pts, pts2 = null, iso2, name, exp = false, imp = false, fifaMember = true, nameColor = null, noMap = false } of items) {
    const dots = (exp ? '<sup class="elo-dot" style="color:#3b82f6" title="exports players">●</sup>' : '') +
                 (imp ? '<sup class="elo-dot" style="color:#ef4444" title="imports players">●</sup>' : '') +
                 (!fifaMember ? `<sup class="elo-dot" style="color:var(--text-muted)" title="not a FIFA member">○</sup>` : '');
    const li = document.createElement('li');
    li.className = 'elo-item' + (noMap ? ' elo-item--no-map' : '');
    li.innerHTML =
      // `<span class="elo-rank">${rank}</span>` +
      (iso2 ? `<img class="elo-flag" src="${_CDN(iso2)}" alt="">` : `<span class="elo-flag"></span>`) +
      `<span class="elo-name"${nameColor ? ` style="color:${nameColor}"` : ''}>${name}${dots}</span>` +
      (pts != null ? `<span class="elo-pts"><span class="elo-pts-primary">${pts}</span></span>` : '');
      // (pts != null ? `<span class="elo-pts"><span class="elo-pts-primary">${pts}</span>${pts2 != null ? ` (${pts2})` : ''}</span>` : '');
    if (onCountryClick) li.addEventListener('click', () => {
      if (isClickable == null || isClickable(id) || (isZoomable != null && isZoomable(id))) onCountryClick(id);
    });
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
  const show = visibleItems => {
    // FLIP: record positions of currently visible items
    const before = new Map();
    for (const [id, li] of itemById)
      if (li.style.display !== 'none') before.set(id, li.getBoundingClientRect().top);
    // Apply new visibility + order + pts
    for (const li of itemById.values()) li.style.display = 'none';
    for (const { id, pts, pts2 } of visibleItems) {
      const li = itemById.get(id);
      if (!li) continue;
      li.style.display = '';
      li.classList.toggle('elo-item--clickable', onCountryClick != null && (isClickable == null || isClickable(id)));
      li.classList.toggle('elo-item--zoomable', onCountryClick != null && isZoomable != null && isZoomable(id) && !(isClickable == null || isClickable(id)));
      ul.appendChild(li);
      const ptsEl = li.querySelector('.elo-pts');
      if (pts != null) {
        const html = `<span class="elo-pts-primary">${pts}</span>`;
        // const html = `<span class="elo-pts-primary">${pts}</span>${pts2 != null ? ` (${pts2})` : ''}`;
        if (ptsEl) ptsEl.innerHTML = html;
        else { const s = document.createElement('span'); s.className = 'elo-pts'; s.innerHTML = html; li.appendChild(s); }
      } else if (ptsEl) ptsEl.remove();
    }
    // FLIP: animate items that were visible before and after
    for (const { id } of visibleItems) {
      const li = itemById.get(id);
      if (!li || !before.has(id)) continue;
      const delta = before.get(id) - li.getBoundingClientRect().top;
      if (delta === 0) continue;
      li.style.transition = 'none';
      li.style.transform = `translateY(${delta}px)`;
      li.getBoundingClientRect();
      li.style.transition = 'transform 0.2s ease';
      li.style.transform = '';
      li.addEventListener('transitionend', () => { li.style.transition = ''; }, { once: true });
    }
  };
  if (getSelectedId) update(getSelectedId());
  return { update, show };
}
