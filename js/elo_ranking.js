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
// Exported — js/group_stage.js reuses this for group-stage results so a finished group match
// gets the exact same kickoff-label formatting as a knockout fixture pair.
export const fixtureDateLabel = date => {
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

const _eliminationTitle = ({ knockedOut, eliminatedRound, eliminatedDate, eliminatedLostTo, playsThirdPlace, thirdPlace } = {}) => {
  if (!knockedOut) return '';
  // The two Semi-finals losers get a placement-aware label instead of the raw round name —
  // both read "Semi-finals" as their eliminatedRound (that consolation match never overwrites
  // it — see data/v2/status.json's additive thirdPlace field, this repo's CLAUDE.md), so
  // without this they'd otherwise show as two identical fates rather than 3rd vs. 4th place in
  // the same match against each other. eliminatedLostTo still applies below either way: for the
  // winner it's who beat them in the *real* Semi-final (a separate fact from the 3rd-place
  // win), for the loser it's who beat them in the 3rd-place match itself.
  const idx = ELIM_ROUNDS.indexOf(eliminatedRound);
  const roundLabel = playsThirdPlace
    ? (thirdPlace?.result === 'lost' ? T.thirdPlaceLostLabel : T.thirdPlaceWonLabel)
    : idx >= 0 ? T.eliminationRounds[idx] : eliminatedRound;
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

// Renders one fixture (js/qualified.js's data/fixtures.json shape: { id, date, home, away,
// goals, winner }) as a two-team .elo-pair row — same pill/separator markup a knockout-stage
// match-display pair renders with (see EloRanking's own #buildRows below), so any fixture from
// any source reads identically. Originally group_stage.js's own local _resultRow (group-stage
// results only) — extracted here once js/fixture_list.js needed the exact same row for every
// fixture in the tournament, not just one group's finished ones.
// `eloItemsByIso2`/`regionName` resolve each side's pill data, falling back to a bare
// iso2/regionName pair for a team not in eloItemsByIso2 (shouldn't happen for a real qualifier,
// but mirrors group_stage.js's own original defensiveness). `pairIdPrefix` keeps each fixture
// source's ids out of the others' pairId namespace (control_sidebar.js's own knockout
// match-display pairing uses `[idA,idB].sort().join('-')`, group_stage.js `grp-`, fixture_list.js
// `all-`) — never actually collides in practice, but no reason to rely on that.
// `orderPair(a, b)` (control_sidebar.js's own exported `orderPair`, the same logic a knockout
// match-display pair already orders its two teams by) decides which side displays left/right —
// omitted, display falls back to the fixture's own raw home/away order. Since display order can
// differ from data's home/away order, goals/lost-status are resolved by *display side*
// (left/right), not by home/away, below. `ptsFor(item, fmtPop)` (control_sidebar.js's own
// exported `ptsFor`) resolves the figure the pill itself shows — the value the active sort
// criterion is actually ranking by (null only for 'alpha', which has nothing numeric to rank
// by), so a user can see *why* orderPair put one side first; both omitted together (no ordering,
// no figure) falls back to the fixture's raw home/away order and a bare pill, matching the
// original pre-orderPair/ptsFor behavior.
// Handles both decided fixtures (real score) and undecided ones (bare date separator, no win/
// lose/draw classing) — mirrors #buildRows' own `!score` branch below; not currently reachable
// in production (every WC2026 fixture is finished already) but this shouldn't assume that.
export const fixtureRow = (f, { eloItemsByIso2, regionName, onCountryClick, onFixtureClick, isFixtureActive, pairIdPrefix = '', orderPair, ptsFor, fmtPop }) => {
  const homeRaw = eloItemsByIso2.get(f.home) ?? { iso2: f.home, name: regionName(f.home, f.home) };
  const awayRaw = eloItemsByIso2.get(f.away) ?? { iso2: f.away, name: regionName(f.away, f.away) };
  // Ordering reads each side's own real fields (pts/pop/expCount/impCount) — must happen against
  // the raw items, before the pts override below replaces that field with whatever's actually
  // shown in the pill.
  const [leftRaw, rightRaw] = orderPair ? orderPair(homeRaw, awayRaw) : [homeRaw, awayRaw];
  const swapped = leftRaw !== homeRaw;
  const left = { ...leftRaw, pts: ptsFor ? ptsFor(leftRaw, fmtPop) : null };
  const right = { ...rightRaw, pts: ptsFor ? ptsFor(rightRaw, fmtPop) : null };
  const decided = f.goals?.home != null && f.goals?.away != null;
  const draw = decided && f.winner == null;
  const leftLost = decided && (swapped ? f.winner === 'home' : f.winner === 'away');
  const rightLost = decided && (swapped ? f.winner === 'away' : f.winner === 'home');
  const leftGoals = swapped ? f.goals?.away : f.goals?.home;
  const rightGoals = swapped ? f.goals?.home : f.goals?.away;
  // f.score.penalty.{home,away} is data/fixtures.json's own shootout tally (present once a PEN
  // fixture's result lands there — same field control_sidebar.js's buildMatchInfo, qualified.js,
  // already reads for the knockout match-display pair's own "X-Y pen." line) — read directly here
  // rather than through app.matchInfoByIso2 (knockout-only, see this file's own header comment),
  // since fixtureRow's callers (group stage + whole-competition) cover fixtures buildMatchInfo
  // never indexes at all.
  const penalties = f.status === 'PEN';
  const leftPen = swapped ? f.score?.penalty?.away : f.score?.penalty?.home;
  const rightPen = swapped ? f.score?.penalty?.home : f.score?.penalty?.away;
  const pens = penalties ? (leftPen != null ? `${leftPen}-${rightPen} pen.` : 'pen.') : null;
  const dateLabel = fixtureDateLabel(f.date);
  const clickableCls = item => (onCountryClick && item.id != null) ? ' elo-item--clickable' : '';
  const pillClick = item => () => { if (item.id != null) onCountryClick?.(item.id); };
  const pairId = `${pairIdPrefix}${f.id}`;
  const fixtureClickable = onFixtureClick && left.id != null && right.id != null;
  const onSepClick = () => { if (fixtureClickable) onFixtureClick(left.id, right.id, pairId); };
  const active = isFixtureActive?.(pairId);
  return html`
    <li class="elo-pair${draw ? ' elo-pair--draw' : ''}${!decided ? ' elo-pair--pending' : ''}${active ? ' elo-pair--active' : ''}">
      <span class="elo-item-wrap"><span class="${pillClasses(left)}${leftLost ? ' elo-item--lost' : ''}${clickableCls(left)}" style="${pillStyle(left)}" @click=${pillClick(left)}>${pillContent(left)}</span></span>
      <span class="elo-pair-sep${decided ? ' elo-pair-sep--score' : ''}${fixtureClickable ? ' elo-pair-sep--clickable' : ''}" @click=${onSepClick}>
        ${decided
          ? html`${dateLabel ? html`<span class="elo-pair-sep-date">${dateLabel}</span>` : nothing}<span class="elo-pair-sep-score">${leftGoals}–${rightGoals}</span>${pens ? html`<span class="elo-pair-sep-pens">${pens}</span>` : nothing}`
          : (dateLabel ? html`<span class="elo-pair-sep-date">${dateLabel}</span>` : html`–`)}
      </span>
      <span class="elo-item-wrap"><span class="${pillClasses(right)}${rightLost ? ' elo-item--lost' : ''}${clickableCls(right)}" style="${pillStyle(right)}" @click=${pillClick(right)}>${pillContent(right)}</span></span>
    </li>`;
};

class EloRanking extends HTMLElement {

  // #itemById holds the reusable pill <span> per country — stable identity across renders,
  // so FLIP position animation and click listeners survive re-sorting/re-grouping. The <ul>'s
  // direct children are instead per-render <li> "row" wrappers (.elo-solo, or .elo-pair nested
  // inside a shared .elo-pairs block — see show() below): cheap, rebuilt every call, never
  // reused — only the pills inside them persist.
  #ul; #itemById = new Map(); #itemDataById = new Map(); #activeId = null; #activeFixtureId = null;
  #onCountryClick = null; #isClickable = null; #isZoomable = null; #onFixtureClick = null;
  // 3rd Place Final's own list + heading — see connectedCallback and show()'s _pairThirdPlace
  // partitioning below. Only ever populated on the 'final' carousel slide.
  #ulThirdPlace; #thirdPlaceHeading;
  // Stage carousel — wraps the whole pill list (prev/next controls sit absolutely over the
  // list's left/right edges, indicators below — see css/global.css's .elo-viz).
  // Position/persistence stays owned by control_sidebar.js — this component only mounts the
  // widget (built by createStageCarousel, js/stage_carousel.js) and reports slides via a
  // 'stage-change' event rather than holding any tournament state itself.
  #carousel = null;
  #viz = null; // the wrap div itself — see set displayMode below

  get hasItems() { return this.#itemById.size > 0; }

  connectedCallback() {
    if (this.#ul) return; // already built — customElements re-invokes this if reattached
    const wrap = document.createElement('div');
    wrap.className = 'elo-viz';

    // Built by the shared factory (js/stage_carousel.js) — 'stage-change' dispatches on the
    // carousel element itself and bubbles up through wrap/this, so external listeners attached
    // to this <elo-ranking> instance (e.g. control_sidebar.js's
    // eloMain.addEventListener('stage-change', ...)) still receive it unchanged.
    // `all-stages` (a plain boolean attribute set by wc2026_map.js — see that file's own comment)
    // opts into a leading "Whole competition" slide ahead of CAROUSEL_STAGES[0] (js/fixture_list.js's
    // whole-tournament view).
    this.#carousel = createStageCarousel(T, this.hasAttribute('all-stages') ? { leadingLabel: T.allStagesLabel } : undefined);
    wrap.appendChild(this.#carousel.el);

    this.#ul = document.createElement('ul');
    this.#ul.className = 'elo-list';
    wrap.appendChild(this.#ul);

    // 3rd Place Final (Semi-finals losers' own fixture) gets a second, separately headed list
    // below the main one instead of sharing .elo-pairs with the real Final pair — two different
    // matches on the same carousel slide read as two matches, not one mixed list. Hidden by
    // default; show() below is the only thing that ever reveals it.
    this.#thirdPlaceHeading = document.createElement('div');
    this.#thirdPlaceHeading.className = 'elo-list-heading';
    this.#thirdPlaceHeading.textContent = T.thirdPlaceHeading;
    this.#thirdPlaceHeading.hidden = true;
    wrap.appendChild(this.#thirdPlaceHeading);

    this.#ulThirdPlace = document.createElement('ul');
    this.#ulThirdPlace.className = 'elo-list';
    this.#ulThirdPlace.hidden = true;
    wrap.appendChild(this.#ulThirdPlace);

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

  // Hides the whole carousel widget — used by the flat "tab-teams" list, which has no
  // fixture/tournament concept at all (see control_sidebar.js's setMode). Defaults to shown;
  // safe to leave untouched on pages that only ever host one always-tournament-aware instance.
  set showCarousel(v) {
    this.#carousel?.el.classList.toggle('d-none', !v);
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
    this.#ulThirdPlace.innerHTML = '';
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
  set onFixtureClick(fn) { this.#onFixtureClick = fn; }

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

  // Fixture-level selection (a whole .elo-pair row, not a single team pill) — mirrors update()
  // above but rows aren't persisted across show() calls (they're rebuilt fresh every render, see
  // show()'s own comment), so instead of tracking one live element we just re-derive the match
  // from each mounted row's own data-pair-id (set in show()) and re-toggle on demand. #activeFixtureId
  // is also read directly inside show() so a fixture selection survives a full re-render (filter
  // change, stage move, resort) the same way #activeId does for a single team.
  updateFixture(pairId) {
    this.#activeFixtureId = pairId ?? null;
    // Covers both #ul and #ulThirdPlace — both are descendants of this element.
    this.querySelectorAll('li.elo-pair').forEach(row => {
      row.classList.toggle('elo-pair--active', row.dataset.pairId === this.#activeFixtureId);
    });
  }

  // .elo-item-wrap: a fresh (never reused, rebuilt every render like the row wrappers
  // themselves) span around each pill. Exists solely so a decoration anchored to it (see
  // taxonomy.css's fixture-winner check mark) can escape .elo-item's own overflow:hidden
  // (global.css's width-clamp on paired pills) — a sibling of the clipped element isn't
  // clipped by it, whereas a pseudo-element on .elo-item itself always would be. Several
  // selectors in global.css/taxonomy.css that used to read `li.elo-pair > .elo-item:first-
  // child` now go through an anonymous `li.elo-pair :first-child .elo-item` instead, since
  // .elo-item is no longer li.elo-pair's direct child — :first-child there matches whichever
  // element (the wrapper) actually sits first among the row's children.
  #place(row, { id, pts, pending, _lost }) {
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
  }

  // Builds <li> row wrappers for `items` into `ulEl` — shared by the main list and the 3rd
  // Place Final's own list (see show() below). Adjacent items sharing the same `_pairId`
  // (match-display mode's fixture couples — see sortAndFilter) are placed into ONE
  // <li class="elo-pair"> row instead of two separate rows, so they can never be split across a
  // flex-wrap line break — and every .elo-pair row lives inside a single shared .elo-pairs
  // wrapper (css/global.css) local to `ulEl`, not as a direct <ul> child, so match-display
  // mode's fixture grid gets its own column-track sizing independent of whatever .elo-solo rows
  // follow it. sortAndFilter always sorts pairs ahead of lone teams, so building .elo-pairs
  // first (on the first paired row encountered) and appending solos straight to `ulEl` after it
  // keeps that ordering automatic, no separate pass needed.
  #buildRows(items, ulEl) {
    let pairsWrap = null;
    for (let i = 0; i < items.length; i++) {
      const cur = items[i], next = items[i + 1];
      const paired = cur._pairId != null && next?._pairId === cur._pairId;
      const row = document.createElement('li');
      row.className = paired ? 'elo-pair' : 'elo-solo';
      this.#place(row, cur);
      if (paired) {
        row.dataset.pairId = cur._pairId;
        row.classList.toggle('elo-pair--active', cur._pairId === this.#activeFixtureId);
        const sep = document.createElement('span');
        const score = cur._pairScore; // { home, away, penalties, penaltyHome, penaltyAway } — see sortAndFilter's _pairScore
        const dateLabel = fixtureDateLabel(cur._pairDate); // "day|hour" — see sortAndFilter's _pairDate
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
        // The separator (score/date box), not either team pill, is the fixture's own click
        // target — the pills already have their own single-team click handler (#handleClick
        // above), so a click there must keep resolving to that team, never to the fixture as a
        // whole.
        if (this.#onFixtureClick) {
          sep.classList.add('elo-pair-sep--clickable');
          sep.addEventListener('click', () => this.#onFixtureClick(cur.id, next.id, cur._pairId));
        }
        row.appendChild(sep);
        this.#place(row, next);
        i++;
        if (!pairsWrap) {
          pairsWrap = document.createElement('div');
          pairsWrap.className = 'elo-pairs';
          ulEl.appendChild(pairsWrap);
        }
        pairsWrap.appendChild(row);
      } else {
        ulEl.appendChild(row);
      }
    }
  }

  // visibleItems is a flat, already-ordered array (control_sidebar.js's sortAndFilter) — a
  // country not present here is simply not rendered at all (fully detached, not just hidden;
  // nothing in this app currently counts hidden-vs-visible pills in the DOM, so this is safe).
  // Items belonging to the Semi-finals losers' own pair (`_pairThirdPlace`, set only in match-
  // display mode, only at the 'final' carousel stage — see control_sidebar.js's sortAndFilter)
  // are split out into #ulThirdPlace/#thirdPlaceHeading, its own list below the main one,
  // instead of sharing .elo-pairs with the real Final pair: two different fixtures on the same
  // carousel slide read as two matches, not one mixed list.
  show(visibleItems, onAnimationDone) {
    const before = new Map();
    for (const [id, pill] of this.#itemById)
      if (pill.isConnected) before.set(id, pill.getBoundingClientRect().top);

    const thirdPlaceItems = visibleItems.filter(item => item._pairThirdPlace);
    const mainItems = thirdPlaceItems.length ? visibleItems.filter(item => !item._pairThirdPlace) : visibleItems;

    this.#ul.innerHTML = ''; // clears old row wrappers only — pills persist via #itemById
    this.#buildRows(mainItems, this.#ul);

    this.#ulThirdPlace.innerHTML = '';
    this.#thirdPlaceHeading.hidden = this.#ulThirdPlace.hidden = thirdPlaceItems.length === 0;
    if (thirdPlaceItems.length) this.#buildRows(thirdPlaceItems, this.#ulThirdPlace);

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
