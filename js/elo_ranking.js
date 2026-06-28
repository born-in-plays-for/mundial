import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { buildEloItems } from './qualified.js';
import { LOCALE, T } from './i18n.js';

const _CDN = c => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${c}.svg`;

export const pillClasses = ({ qualified = false, fifaMember = true, noMap = false, exp = false, imp = false } = {}) =>
  'elo-item'
  + (qualified ? ' elo-item--qualified' : '')
  + (!fifaMember ? ' elo-item--nonfifa' : '')
  + (exp ? ' elo-item--exp' : '')
  + (imp ? ' elo-item--imp' : '')
  + (noMap ? ' elo-item--no-map' : '');

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
    for (const { id, pts } of visibleItems) {
      const li = this.#itemById.get(id);
      const data = this.#itemDataById.get(id);
      if (!li || !data) continue;
      li.style.display = '';
      li.classList.toggle('elo-item--clickable', this.#onCountryClick != null && (this.#isClickable == null || this.#isClickable(id)));
      li.classList.toggle('elo-item--zoomable', this.#onCountryClick != null && this.#isZoomable != null && this.#isZoomable(id) && !(this.#isClickable == null || this.#isClickable(id)));
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

export const initEloRanking = ({ el, sidebar, buildArgs, fmtPop, onRender, eloData }) => {
  const rawItems = buildEloItems(buildArgs);
  el.items = rawItems;

  // Build stable #elo-meta structure once: [count span] · [source span (toggled)]
  const metaEl = document.getElementById('elo-meta');
  let metaCountEl = null, metaSourceEl = null;
  if (metaEl) {
    const sourceParts = [];
    if (eloData?.source) sourceParts.push(`<a href="https://${eloData.source}/" target="_blank" rel="noopener" class="sub">${eloData.source}</a>`);
    if (eloData?.updated) {
      const d = new Date(eloData.updated + 'T00:00:00');
      const fmt = isNaN(d) ? eloData.updated : d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' });
      sourceParts.push(`${T.eloUpdated}${fmt}`);
    }
    metaEl.innerHTML = sourceParts.length
      ? `<span id="elo-meta-count"></span><span id="elo-meta-source"> · ${sourceParts.join(' · ')}</span>`
      : `<span id="elo-meta-count"></span>`;
    metaCountEl  = document.getElementById('elo-meta-count');
    metaSourceEl = document.getElementById('elo-meta-source');
  }

  const renderFn = (onAnimationDone) => {
    const visibleItems = sidebar.sortAndFilter(rawItems, fmtPop);
    el.show(visibleItems, onAnimationDone);
    if (metaCountEl) metaCountEl.textContent = `${visibleItems.length}/${rawItems.length} ${T.navCountries}`;
    if (metaSourceEl) metaSourceEl.hidden = sidebar.sortOrder[0] !== 'elo';
    onRender?.();
  };

  return { rawItems, render: renderFn };
};
