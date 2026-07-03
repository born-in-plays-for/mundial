import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { buildEloItems, ELIM_ROUNDS } from './qualified.js';
import { LOCALE, T } from './i18n.js';

const _CDN = c => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${c}.svg`;

const _eliminationTitle = ({ knockedOut, eliminatedRound, eliminatedDate, eliminatedLostTo } = {}) => {
  if (!knockedOut) return '';
  const idx = ELIM_ROUNDS.indexOf(eliminatedRound);
  const roundLabel = idx >= 0 ? T.eliminationRounds[idx] : eliminatedRound;
  const dateSuffix = eliminatedDate
    ? ` (${new Date(`${eliminatedDate}T00:00:00`).toLocaleDateString(LOCALE, { day: 'numeric', month: 'short' })})`
    : '';
  const lostToSuffix = eliminatedLostTo ? ` · ${T.lostToLabel(eliminatedLostTo)}` : '';
  return `${T.eliminatedLabel} — ${roundLabel}${dateSuffix}${lostToSuffix}`;
};

export const pillClasses = ({ qualified = false, fifaMember = true, noMap = false, exp = false, imp = false, knockedOut = false } = {}) =>
  'elo-item'
  + (qualified ? ' elo-item--qualified' : '')
  + (qualified && knockedOut ? ' elo-item--knocked-out' : '')
  + (!fifaMember ? ' elo-item--nonfifa' : '')
  + (exp ? ' elo-item--exp' : '')
  + (imp ? ' elo-item--imp' : '')
  + (noMap ? ' elo-item--no-map' : '');

// Set on the pill container itself (li / span) — inherits down into .elo-name and its ::after
// (triangle color) and is also read directly by taxonomy.css for the pill's gradient background.
export const pillStyle = ({ expColor = null, impColor = null, impPivot = null, nativePivot = null } = {}) =>
  [
    expColor && `--exp-color:${expColor}`,
    impColor && `--imp-color:${impColor}`,
    impPivot && `--imp-pivot:${impPivot}`,
    nativePivot && `--native-pivot:${nativePivot}`,
  ].filter(Boolean).join(';');

export const pillContent = ({ iso2, name, pts = null } = {}) => html`
  ${iso2 ? html`<img class="elo-flag" src="${_CDN(iso2)}" alt="">` : nothing}
  <span class="elo-name">${name}</span>
  ${pts != null ? html`<span class="elo-pts"><span class="elo-pts-primary">${pts}</span></span>` : nothing}`;

class EloRanking extends HTMLElement {
  #ul; #itemById = new Map(); #itemDataById = new Map(); #activeId = null;
  #onCountryClick = null; #isClickable = null; #isZoomable = null;

  get hasItems() { return this.#itemById.size > 0; }

  connectedCallback() {
    this.#ul = document.createElement('ul');
    this.#ul.className = 'elo-list';
    this.appendChild(this.#ul);
  }

  set items(list) {
    if (!this.#ul) this.connectedCallback();
    this.#itemById.clear();
    this.#itemDataById.clear();
    this.#ul.innerHTML = '';
    for (const item of list) {
      const { id } = item;
      const li = document.createElement('li');
      li.className = pillClasses(item);
      li.title = _eliminationTitle(item);
      li.style.cssText = pillStyle(item);
      render(pillContent(item), li);
      li.addEventListener('click', () => this.#handleClick(id));
      this.#itemById.set(id, li);
      this.#itemDataById.set(id, { ...item });
      this.#ul.appendChild(li);
    }
  }

  set onCountryClick(fn) { this.#onCountryClick = fn; }
  set isClickable(fn) { this.#isClickable = fn; }
  set isZoomable(fn) { this.#isZoomable = fn; }

  #handleClick(id) {
    if (!this.#onCountryClick) return;
    if (this.#isClickable == null || this.#isClickable(id) || (this.#isZoomable != null && this.#isZoomable(id))) {
      this.#onCountryClick(id);
    }
  }

  update(id) {
    this.#itemById.get(this.#activeId)?.classList.remove('elo-item--active');
    this.#activeId = id ?? null;
    this.#itemById.get(this.#activeId)?.classList.add('elo-item--active');
  }

  show(visibleItems, onAnimationDone) {
    const before = new Map();
    for (const [id, li] of this.#itemById)
      if (li.style.display !== 'none') before.set(id, li.getBoundingClientRect().top);
    for (const li of this.#itemById.values()) li.style.display = 'none';
    for (const { id, pts, pending } of visibleItems) {
      const li = this.#itemById.get(id);
      const data = this.#itemDataById.get(id);
      if (!li || !data) continue;
      li.style.display = '';
      li.classList.toggle('elo-item--clickable', this.#onCountryClick != null && (this.#isClickable == null || this.#isClickable(id)));
      li.classList.toggle('elo-item--zoomable', this.#onCountryClick != null && this.#isZoomable != null && this.#isZoomable(id) && !(this.#isClickable == null || this.#isClickable(id)));
      li.classList.toggle('elo-item--pending', !!pending);
      this.#ul.appendChild(li);
      data.pts = pts;
      render(pillContent(data), li);
    }
    let animating = 0;
    for (const { id } of visibleItems) {
      const li = this.#itemById.get(id);
      if (!li || !before.has(id)) continue;
      const delta = before.get(id) - li.getBoundingClientRect().top;
      if (delta === 0) continue;
      animating++;
      li.style.transition = 'none';
      li.style.transform = `translateY(${delta}px)`;
      li.getBoundingClientRect();
      li.style.transition = 'transform 0.2s ease';
      li.style.transform = '';
      li.addEventListener('transitionend', () => {
        li.style.transition = '';
        if (--animating === 0 && onAnimationDone) onAnimationDone();
      }, { once: true });
    }
    if (animating === 0 && onAnimationDone) onAnimationDone();
  }
}

customElements.define('elo-ranking', EloRanking);

const _sourceHtml = (data) => {
  if (!data) return '';
  const parts = [];
  if (data.source) parts.push(`<a href="https://${data.source}/" target="_blank" rel="noopener" class="sub">${data.source}</a>`);
  if (data.updated) {
    const d = new Date(data.updated + 'T00:00:00');
    const fmt = isNaN(d) ? data.updated : d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
    parts.push(`${T.eloUpdated}${fmt}`);
  }
  return parts.join(' · ');
};

export const initEloRanking = ({ el, sidebar, buildArgs, fmtPop, onRender, eloData, popData }) => {
  const rawItems = buildEloItems(buildArgs);
  el.items = rawItems;

  // Build stable #elo-meta structure once: [count span] · [source span (dynamic content, toggled)]
  const metaEl = document.getElementById('elo-meta');
  let metaCountEl = null, metaSourceEl = null;
  if (metaEl) {
    const hasSource = !!(eloData || popData);
    metaEl.innerHTML = hasSource
      ? `<span id="elo-meta-count"></span><span id="elo-meta-source"></span>`
      : `<span id="elo-meta-count"></span>`;
    metaCountEl  = document.getElementById('elo-meta-count');
    metaSourceEl = document.getElementById('elo-meta-source');
  }

  const renderFn = (onAnimationDone) => {
    const visibleItems = sidebar.sortAndFilter(rawItems, fmtPop);
    el.show(visibleItems, onAnimationDone);
    if (metaCountEl) metaCountEl.textContent = `${visibleItems.length}/${rawItems.length} ${T.navCountries}`;
    if (metaSourceEl) {
      const sort = sidebar.sortOrder[0];
      const html = sort === 'elo' ? _sourceHtml(eloData)
                 : sort === 'pop' ? _sourceHtml(popData)
                 : '';
      metaSourceEl.innerHTML = html ? ` · ${html}` : '';
      metaSourceEl.hidden = !html;
    }
    onRender?.();
  };

  return { rawItems, render: renderFn };
};
