import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { buildEloItems, ELIM_ROUNDS } from './qualified.js';
import { LOCALE, T } from './i18n.js';
import { createStageCarousel } from './stage_carousel.js';

const _CDN = c => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${c}.svg`;

// Compact "day/month hour" kickoff label for a fixture pair separator — e.g. "20/7 23h"
// (24h-clock locales) or "7/20 11PM" (12h-clock locales, e.g. en-US), no year (sits in a tiny
// pill-sized space). \xa0 (non-breaking space) between the two halves keeps them from wrapping
// onto separate lines within the already-narrow pill. Locale changes the day/month order
// (toLocaleDateString) and the 12h/24h clock convention for the hour; the leading zero some
// locales pad numeric dates with (e.g. fr-FR's "07") is stripped for compactness/consistency —
// it's not a meaningful i18n distinction the way day/month order is. `date` is a full ISO
// datetime string.
const _fixtureDateLabel = date => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d)) return null;
  const dayMonth = d.toLocaleDateString(LOCALE, { day: 'numeric', month: 'numeric' }).replace(/(^|\D)0(\d)/g, '$1$2');
  const hourCycle = new Intl.DateTimeFormat(LOCALE, { hour: 'numeric' }).resolvedOptions().hourCycle;
  const hour = (hourCycle === 'h12' || hourCycle === 'h11')
    ? d.toLocaleTimeString(LOCALE, { hour: 'numeric', hour12: true }).replace(/\s+/g, '')
    : `${d.getHours()}h`;
  return `${dayMonth}\xa0${hour}`;
};

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
  ${iso2 ? html`<span class="elo-flag-wrap"><img class="elo-flag" src="${_CDN(iso2)}" alt=""></span>` : nothing}
  <span class="elo-name">${name}</span>
  ${pts != null ? html`<span class="elo-pts"><span class="elo-pts-primary">${pts}</span></span>` : nothing}`;

class EloRanking extends HTMLElement {

  // #itemById holds the reusable pill <span> per country — stable identity across renders,
  // so FLIP position animation and click listeners survive re-sorting/re-grouping. The <ul>'s
  // direct children are instead per-render <li> "row" wrappers (.elo-solo, or .elo-pair nested
  // inside a shared .elo-pairs block — see show() below): cheap, rebuilt every call, never
  // reused — only the pills inside them persist.
  #ul; #itemById = new Map(); #itemDataById = new Map(); #activeId = null;
  #onCountryClick = null; #isClickable = null; #isZoomable = null;
  // Stage carousel — wraps the whole pill list (like insights/status.html's #statusViz: prev/
  // next controls sit absolutely over the list's left/right edges, indicators below — see
  // css/global.css's .elo-viz). Position/persistence stays owned by control_sidebar.js — this
  // component only mounts the widget (built by createStageCarousel, shared with
  // players_sidebar.js — see js/stage_carousel.js) and reports slides/toggles via events
  // ('stage-change', 'qualified-toggle') rather than holding any tournament state itself.
  #carousel = null;
  #viz = null; // the wrap div itself — see set displayMode below

  get hasItems() { return this.#itemById.size > 0; }

  connectedCallback() {
    if (this.#ul) return; // already built — customElements re-invokes this if reattached
    const wrap = document.createElement('div');
    wrap.className = 'elo-viz';

    // Built by the shared factory (js/stage_carousel.js) — 'stage-change'/'qualified-toggle'
    // dispatch on the carousel element itself and bubble up through wrap/this, so external
    // listeners attached to this <elo-ranking> instance (e.g. control_sidebar.js's
    // eloMain.addEventListener('stage-change', ...)) still receive them unchanged.
    this.#carousel = createStageCarousel(T);
    wrap.appendChild(this.#carousel.el);

    this.#ul = document.createElement('ul');
    this.#ul.className = 'elo-list';
    wrap.appendChild(this.#ul);
    this.appendChild(wrap);
    this.#viz = wrap;
  }

  // Drives .elo-viz--match (css/global.css) — caps .elo-viz to a stable width in match-display
  // mode instead of the full page-container width. Previously this was a `:has(.elo-list >
  // li.elo-pair)` CSS selector reacting to the currently-rendered stage's actual DOM content,
  // which flips per stage rather than per mode: a stage with no decided/paired fixtures yet
  // (e.g. the Final before it's been played) has no .elo-pair rows even while match-display is
  // active, so .elo-viz — and the carousel prev/next arrows anchored to its edges — would snap
  // back out to full width on exactly those stages and jump back narrow on the next. Driving it
  // from control_sidebar.js's own _displayMode instead keeps the width (and the arrows) stable
  // across every stage for the duration of match-display, regardless of that stage's content.
  set displayMode(mode) {
    this.#viz?.classList.toggle('elo-viz--match', mode === 'match');
  }

  // The tournament hasn't reached every stage yet — control_sidebar.js computes the furthest
  // stage that currently has at least one team in it and pushes it here; disables (visually +
  // via the slide guard above) the next-arrow and indicator dots beyond it.
  set maxStage(n) {
    if (this.#carousel) this.#carousel.maxStage = n;
  }

  // Programmatic navigation (URL ?stage=, restored localStorage state) — control_sidebar.js's
  // only way to move the carousel; user clicks go through Bootstrap directly instead.
  set stage(idx) {
    if (this.#carousel) this.#carousel.stage = idx;
  }

  set items(list) {
    if (!this.#ul) this.connectedCallback();
    this.#itemById.clear();
    this.#itemDataById.clear();
    this.#ul.innerHTML = '';
    for (const item of list) {
      const { id } = item;
      const pill = document.createElement('span');
      pill.className = pillClasses(item);
      pill.title = _eliminationTitle(item);
      pill.style.cssText = pillStyle(item);
      render(pillContent(item), pill);
      pill.addEventListener('click', () => this.#handleClick(id));
      this.#itemById.set(id, pill);
      this.#itemDataById.set(id, { ...item });
      // Not appended anywhere yet — show() below owns all DOM placement (rows are built fresh
      // per call), so a pill only ever enters the document once show() first runs.
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

  // visibleItems is a flat, already-ordered array (control_sidebar.js's sortAndFilter) — a
  // country not present here is simply not rendered at all (fully detached, not just hidden;
  // nothing in this app currently counts hidden-vs-visible pills in the DOM, so this is safe).
  // Adjacent items sharing the same `_pairId` (match-display mode's fixture couples — see
  // sortAndFilter) are placed into ONE <li class="elo-pair"> row instead of two separate rows,
  // so they can never be split across a flex-wrap line break — and every .elo-pair row lives
  // inside a single shared .elo-pairs wrapper (css/global.css), not as a direct <ul> child,
  // so match-display mode's fixture grid gets its own column-track sizing independent of
  // whatever .elo-solo rows follow it. sortAndFilter always sorts pairs ahead of lone teams, so
  // building .elo-pairs first (on the first paired row encountered) and appending solos
  // straight to the <ul> after it keeps that ordering automatic, no separate pass needed.
  show(visibleItems, onAnimationDone) {
    const before = new Map();
    for (const [id, pill] of this.#itemById)
      if (pill.isConnected) before.set(id, pill.getBoundingClientRect().top);

    this.#ul.innerHTML = ''; // clears old row wrappers only — pills persist via #itemById
    let pairsWrap = null;

    // .elo-item-wrap: a fresh (never reused, rebuilt every render like the row wrappers
    // themselves) span around each pill. Exists solely so a decoration anchored to it (see
    // taxonomy.css's fixture-winner check mark) can escape .elo-item's own overflow:hidden
    // (global.css's width-clamp on paired pills) — a sibling of the clipped element isn't
    // clipped by it, whereas a pseudo-element on .elo-item itself always would be. Several
    // selectors in global.css/taxonomy.css that used to read `li.elo-pair > .elo-item:first-
    // child` now go through an anonymous `li.elo-pair :first-child .elo-item` instead, since
    // .elo-item is no longer li.elo-pair's direct child — :first-child there matches whichever
    // element (the wrapper) actually sits first among the row's children.
    const place = (row, { id, pts, pending, _lost }) => {
      const pill = this.#itemById.get(id);
      const data = this.#itemDataById.get(id);
      if (!pill || !data) return;
      pill.classList.toggle('elo-item--clickable', this.#onCountryClick != null && (this.#isClickable == null || this.#isClickable(id)));
      pill.classList.toggle('elo-item--zoomable', this.#onCountryClick != null && this.#isZoomable != null && this.#isZoomable(id) && !(this.#isClickable == null || this.#isClickable(id)));
      pill.classList.toggle('elo-item--pending', !!pending);
      pill.classList.toggle('elo-item--lost', !!_lost);
      const wrap = document.createElement('span');
      wrap.className = 'elo-item-wrap';
      wrap.appendChild(pill);
      row.appendChild(wrap);
      data.pts = pts;
      render(pillContent(data), pill);
    };

    for (let i = 0; i < visibleItems.length; i++) {
      const cur = visibleItems[i], next = visibleItems[i + 1];
      const paired = cur._pairId != null && next?._pairId === cur._pairId;
      const row = document.createElement('li');
      row.className = paired ? 'elo-pair' : 'elo-solo';
      place(row, cur);
      if (paired) {
        const sep = document.createElement('span');
        const score = cur._pairScore; // { home, away, penalties, penaltyHome, penaltyAway } — see sortAndFilter's _pairScore
        const dateLabel = _fixtureDateLabel(cur._pairDate); // "day|hour" — see sortAndFilter's _pairDate
        // Not decided yet — blur the underline (css/global.css), the same "Schrödinger's team"
        // treatment .elo-item--pending gives a team pill's border (see taxonomy.css).
        if (!score) row.classList.add('elo-pair--pending');
        if (score) {
          sep.className = 'elo-pair-sep elo-pair-sep--score';
          // penaltyHome/Away (the actual shootout tally, e.g. "4-3") isn't published by
          // mundial-build yet — data/fixtures.json's `goals` is only the tied extra-time score
          // for a PEN decision. Falls back to a bare "pen." until that lands; see the prompt
          // in CLAUDE.md's buildMatchInfo section / the mundial-build ask for the follow-up.
          const pens = score.penalties
            ? (score.penaltyHome != null ? `${score.penaltyHome}-${score.penaltyAway} pen.` : 'pen.')
            : null;
          // Decided fixture — kickoff day|hour above the score, so the score still reads as
          // the primary, larger-emphasis line (see .elo-pair-sep--score); a penalty shootout
          // gets its own third row below rather than an inline suffix on the score line, since
          // it's the score that actually decided the tie, not a footnote on the drawn scoreline.
          render(html`${dateLabel ? html`<span class="elo-pair-sep-date">${dateLabel}</span>` : nothing}<span class="elo-pair-sep-score">${score.home}–${score.away}</span>${pens ? html`<span class="elo-pair-sep-pens">${pens}</span>` : nothing}`, sep);
        } else {
          sep.className = 'elo-pair-sep';
          // Not yet played — just the kickoff day|hour (single row); falls back to a plain
          // dash if a fixture couple has no date at all (shouldn't normally happen).
          render(dateLabel ? html`<span class="elo-pair-sep-date">${dateLabel}</span>` : html`–`, sep); // en dash — reads cleaner than "vs" at this pill size
        }
        row.appendChild(sep);
        place(row, next);
        i++;
        if (!pairsWrap) {
          pairsWrap = document.createElement('div');
          pairsWrap.className = 'elo-pairs';
          this.#ul.appendChild(pairsWrap);
        }
        pairsWrap.appendChild(row);
      } else {
        this.#ul.appendChild(row);
      }
    }

    let animating = 0;
    for (const { id } of visibleItems) {
      const pill = this.#itemById.get(id);
      if (!pill || !before.has(id)) continue;
      const delta = before.get(id) - pill.getBoundingClientRect().top;
      if (delta === 0) continue;
      animating++;
      pill.style.transition = 'none';
      pill.style.transform = `translateY(${delta}px)`;
      pill.getBoundingClientRect();
      pill.style.transition = 'transform 0.2s ease';
      pill.style.transform = '';
      pill.addEventListener('transitionend', () => {
        pill.style.transition = '';
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
  if (data.source) {
    // data.source is sometimes host+path (e.g. "data.worldbank.org/indicator/SP.POP.TOTL")
    // rather than a bare host (e.g. "eloratings.net") — link text shows the domain only.
    const host = new URL(`https://${data.source}`).hostname;
    parts.push(`<a href="https://${data.source}/" target="_blank" rel="noopener" class="sub">${host}</a>`);
  }
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

  // Build stable #elo-meta structure once: count span (left) + source span (right,
  // dynamic content, toggled) — see css/control-sidebar.css's #elo-meta flex rule.
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
      metaSourceEl.innerHTML = html;
      metaSourceEl.hidden = !html;
    }
    onRender?.();
  };

  return { rawItems, render: renderFn };
};
