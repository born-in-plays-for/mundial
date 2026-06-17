import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';

const _CDN = c => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${c}.svg`;

export const pillClasses = ({ category = 'fifa', noMap = false } = {}) =>
  'elo-item elo-item--' + category + (noMap ? ' elo-item--no-map' : '');

export const pillContent = ({ iso2, name, exp = false, imp = false, fifaMember = true, pts = null } = {}) => html`
  ${iso2 ? html`<img class="elo-flag" src="${_CDN(iso2)}" alt="">` : nothing}
  <span class="elo-name">${name}${exp ? html`<sup class="elo-dot" style="color:#3b82f6" title="exports players">●</sup>` : nothing}${imp ? html`<sup class="elo-dot" style="color:#ef4444" title="imports players">●</sup>` : nothing}${!fifaMember ? html`<sup class="elo-dot" style="color:var(--text-muted)" title="not a FIFA member">○</sup>` : nothing}</span>
  ${pts != null ? html`<span class="elo-pts"><span class="elo-pts-primary">${pts}</span></span>` : nothing}`;

// opts:
//   items        [{id, rank, pts, iso2, name, exp?, imp?}] — sorted by rank, built by caller
//                exp: true → blue ● superscript (born here, plays elsewhere)
//                imp: true → red  ● superscript (born elsewhere, plays here)
//   onCountryClick(id)   — called on click; if null, no items are clickable
//   isClickable(id)      — optional per-item predicate; defaults to all clickable
//   getSelectedId()      — optional; called once at render to set initial highlight
//
// Returns update(id) for surgical highlight changes after render.
export function renderEloRanking(container, opts = {}) {
  const {
    items        = [],
    onCountryClick = null,
    isClickable  = null,
    isZoomable   = null,
    getSelectedId = null,
  } = opts;

  const wrap = document.createElement('div');
  const ul = document.createElement('ul');
  ul.className = 'elo-list';
  const itemById = new Map();
  const itemDataById = new Map();

  for (const item of items) {
    const { id } = item;
    const li = document.createElement('li');
    li.className = pillClasses(item);
    render(pillContent(item), li);
    if (onCountryClick) li.addEventListener('click', () => {
      if (isClickable == null || isClickable(id) || (isZoomable != null && isZoomable(id))) onCountryClick(id);
    });
    itemById.set(id, li);
    itemDataById.set(id, { ...item });
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
      const data = itemDataById.get(id);
      if (!li || !data) continue;
      li.style.display = '';
      li.classList.toggle('elo-item--clickable', onCountryClick != null && (isClickable == null || isClickable(id)));
      li.classList.toggle('elo-item--zoomable', onCountryClick != null && isZoomable != null && isZoomable(id) && !(isClickable == null || isClickable(id)));
      ul.appendChild(li);
      data.pts = pts;
      render(pillContent(data), li);
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
