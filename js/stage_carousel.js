import { CAROUSEL_STAGES, reachesStage } from './qualified.js';

let _carouselCount = 0; // see createStageCarousel's carouselId

// Builds the tournament-stage carousel widget (prev/next controls, indicator dots, one
// captioned slide per CAROUSEL_STAGES entry) — shared by <elo-ranking> (js/elo_ranking.js) and
// players_sidebar.js, so the two never end up as two independent implementations of the same
// widget that could drift apart. Reports navigation via a 'stage-change' event on the returned
// element (when the carousel actually moves) rather than owning any tournament state itself —
// callers own the current stage index and the furthest-reachable-stage computation (see
// maxReachableStage below).
export function createStageCarousel(T) {
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
  CAROUSEL_STAGES.forEach((_, i) => {
    const item = document.createElement('div');
    item.className = 'carousel-item' + (i === 0 ? ' active' : '');
    item.dataset.stage = i;
    const caption = document.createElement('div');
    caption.className = 'stage-caption';
    const title = document.createElement('span');
    title.className = 'stage-title fs-6';
    title.textContent = T.stageLabels[i];
    caption.append(title);
    item.appendChild(caption);
    inner.appendChild(item);
  });
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
  const indicatorBtns = CAROUSEL_STAGES.map((_, i) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.dataset.bsTarget = `#${carouselId}`;
    btn.dataset.bsSlideTo = i;
    if (i === 0) btn.className = 'active';
    btn.setAttribute('aria-label', T.stageLabels[i]);
    btn.title = T.stageLabels[i];
    indicators.appendChild(btn);
    return btn;
  });
  carousel.appendChild(indicators);

  // Paging clicks (prev/next/indicators) are carousel-internal — don't let them also trigger
  // whatever click handling a host page attaches around the widget.
  carousel.addEventListener('click', e => {
    if (e.target.closest('.carousel-control-prev, .carousel-control-next, .carousel-indicators')) e.stopPropagation();
  });

  let _stage = 0, _maxStage = CAROUSEL_STAGES.length - 1;
  const _refreshBounds = () => {
    nextBtn.classList.toggle('csb-stage-disabled', _stage >= _maxStage);
    indicatorBtns.forEach((btn, i) => btn.classList.toggle('csb-stage-locked', i > _maxStage));
  };

  const bsCarousel = (typeof bootstrap !== 'undefined')
    ? new bootstrap.Carousel(carousel, { interval: false, wrap: false })
    : null;
  carousel.addEventListener('slide.bs.carousel', e => {
    if (e.to > _maxStage) { e.preventDefault(); return; }
    _stage = e.to;
    _refreshBounds();
    carousel.dispatchEvent(new CustomEvent('stage-change', { detail: { stage: e.to }, bubbles: true }));
  });
  _refreshBounds();

  return {
    el: carousel,
    // The tournament hasn't reached every stage yet — a caller computes the furthest stage that
    // currently has at least one team in it (see maxReachableStage below) and pushes it here;
    // disables (visually + via the slide guard above) the next-arrow and indicator dots beyond it.
    set maxStage(n) { _maxStage = n; _refreshBounds(); },
    // Programmatic navigation (URL ?stage=, restored localStorage state) — a caller's only way
    // to move the carousel; user clicks go through Bootstrap directly instead.
    set stage(idx) { if (idx !== _stage) bsCarousel?.to(idx); },
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
