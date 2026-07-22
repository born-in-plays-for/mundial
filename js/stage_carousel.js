import { CAROUSEL_STAGES, reachesStage } from './qualified.js';

let _carouselCount = 0; // see createStageCarousel's carouselId

// Builds the tournament-stage carousel widget (prev/next controls, indicator dots, one
// captioned slide per CAROUSEL_STAGES entry) — shared by <elo-ranking> (js/elo_ranking.js),
// players_sidebar.js, and (with leadingLabel) insights/discipline.html, so callers never end up
// as independent implementations of the same widget that could drift apart. Reports navigation
// via a 'stage-change' event on the returned element (when the carousel actually moves) rather
// than owning any tournament state itself — callers own the current stage index and the
// furthest-reachable-stage computation (see maxReachableStage below).
//
// `leadingLabel`, when given, prepends one extra slide/indicator ahead of CAROUSEL_STAGES[0] —
// e.g. discipline.html's "whole competition" aggregate view, which isn't a real tournament
// stage. It's DOM position 0 (default-active) but reported as stage index -1 in 'stage-change'
// and the `stage` setter, so every existing caller (which never passes this option) sees
// identical DOM-index/stage-index numbering to before — only discipline.html's own
// _domToStage/_stageToDom offset ever kicks in.
export function createStageCarousel(T, { leadingLabel } = {}) {
  const hasLeading = leadingLabel != null;
  // DOM child index (0-based over .carousel-item, what Bootstrap's slide.bs.carousel e.to and
  // data-bs-slide-to both operate in) <-> stage index (CAROUSEL_STAGES index, or -1 for the
  // leading slide) — identity when there's no leading slide.
  const _domToStage = d => hasLeading ? d - 1 : d;
  const _stageToDom = s => hasLeading ? s + 1 : s;

  // Bootstrap's carousel data-api (prev/next/indicator clicks) resolves its target purely via
  // data-bs-target="#id" (Selector.getElementFromSelector) — no fallback to closest() — so an
  // id is required even though a caller only ever addresses this instance through the returned
  // handle, never externally. Suffixed with a counter in case more than one carousel ever exists
  // on the same page at once (e.g. the map's <elo-ranking> and a players-page instance).
  const carouselId = `elo-stage-carousel-${++_carouselCount}`;
  const carousel = document.createElement('div');
  carousel.id = carouselId;
  carousel.className = 'elo-stage-carousel carousel slide';
  const inner = document.createElement('div');
  inner.className = 'carousel-inner';
  const slideCount = CAROUSEL_STAGES.length + (hasLeading ? 1 : 0);
  for (let d = 0; d < slideCount; d++) {
    const stage = _domToStage(d);
    const item = document.createElement('div');
    item.className = 'carousel-item' + (d === 0 ? ' active' : '');
    item.dataset.stage = stage;
    const caption = document.createElement('div');
    caption.className = 'stage-caption';
    const title = document.createElement('span');
    title.className = 'stage-title fs-6';
    title.textContent = stage === -1 ? leadingLabel : T.stageLabels[stage];
    caption.append(title);
    item.appendChild(caption);
    inner.appendChild(item);
  }
  carousel.appendChild(inner);

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'carousel-control-prev';
  prevBtn.dataset.bsTarget = `#${carouselId}`;
  prevBtn.dataset.bsSlide = 'prev';
  prevBtn.title = T.csbTips.prevStage;
  prevBtn.innerHTML = '<span class="carousel-control-prev-icon" aria-hidden="true"></span>';
  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'carousel-control-next';
  nextBtn.dataset.bsTarget = `#${carouselId}`;
  nextBtn.dataset.bsSlide = 'next';
  nextBtn.title = T.csbTips.nextStage;
  nextBtn.innerHTML = '<span class="carousel-control-next-icon" aria-hidden="true"></span>';
  carousel.append(prevBtn, nextBtn);

  const indicators = document.createElement('div');
  indicators.className = 'carousel-indicators';
  const indicatorBtns = Array.from({ length: slideCount }, (_, d) => {
    const stage = _domToStage(d);
    const label = stage === -1 ? leadingLabel : T.stageLabels[stage];
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.bsTarget = `#${carouselId}`;
    btn.dataset.bsSlideTo = d;
    if (d === 0) btn.className = 'active';
    btn.setAttribute('aria-label', label);
    btn.title = label;
    indicators.appendChild(btn);
    return btn;
  });
  carousel.appendChild(indicators);

  // Paging clicks (prev/next/indicators) are carousel-internal — don't let them also trigger
  // whatever click handling a host page attaches around the widget.
  carousel.addEventListener('click', e => {
    if (e.target.closest('.carousel-control-prev, .carousel-control-next, .carousel-indicators')) e.stopPropagation();
  });

  let _stage = hasLeading ? -1 : 0, _maxStage = CAROUSEL_STAGES.length - 1;
  const _refreshBounds = () => {
    nextBtn.classList.toggle('csb-stage-disabled', _stage >= _maxStage);
    indicatorBtns.forEach((btn, d) => btn.classList.toggle('csb-stage-locked', _domToStage(d) > _maxStage));
  };

  const bsCarousel = (typeof bootstrap !== 'undefined')
    ? new bootstrap.Carousel(carousel, { interval: false, wrap: false })
    : null;
  carousel.addEventListener('slide.bs.carousel', e => {
    const stage = _domToStage(e.to);
    if (stage > _maxStage) { e.preventDefault(); return; }
    _stage = stage;
    _refreshBounds();
    carousel.dispatchEvent(new CustomEvent('stage-change', { detail: { stage }, bubbles: true }));
  });
  _refreshBounds();

  return {
    el: carousel,
    // The tournament hasn't reached every stage yet — a caller computes the furthest stage that
    // currently has at least one team in it (see maxReachableStage below) and pushes it here;
    // disables (visually + via the slide guard above) the next-arrow and indicator dots beyond it.
    // Always in stage-index space (never DOM space) — the leading slide (-1) is never lockable.
    set maxStage(n) { _maxStage = n; _refreshBounds(); },
    // Programmatic navigation (URL ?stage=, restored localStorage state) — a caller's only way
    // to move the carousel; user clicks go through Bootstrap directly instead. Stage-index space.
    set stage(idx) { if (idx !== _stage) bsCarousel?.to(_stageToDom(idx)); },
  };
}

// The tournament hasn't reached every stage yet — the furthest stage index that currently has
// at least one qualified team in it (counts are monotonically non-increasing by stage, so the
// first empty one marks the boundary; everything past it stays locked until it fills). Pure:
// takes whichever ids/lookup a caller already has (control_sidebar.js's QUALIFIED_NAMES keys +
// app.stageIndexById; players_sidebar.js has the same shape from buildEloItems) rather than
// computing either itself.
export const maxReachableStage = (qualifiedIds, stageIndexById) => {
  let max = 0;
  for (let p = 0; p < CAROUSEL_STAGES.length; p++) {
    const count = qualifiedIds.filter(id => reachesStage(stageIndexById?.get(id), p)).length;
    if (count > 0) max = p; else break;
  }
  return max;
};
