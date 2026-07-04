import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { CONF_IDS } from './conf.js';
import { CAROUSEL_STAGES, ELIM_ROUNDS, reachesStage } from './qualified.js';

const _STORAGE_KEY = 'mundial-control-sidebar-state';

export function initSidebar({ T, QUALIFIED_NAMES, app, fifaMemberIds, eloMain, callbacks, alwaysOpen = false }) {
  let _sortOrder = ['elo', 'alpha', 'pop', 'delta'];
  let _sortDir = 'desc';
  // 'team' (default) — flat list, unchanged. 'match' — teams grouped fixture-by-fixture
  // (one row per couple, non-breakable — see .elo-pair in css/global.css), and the active
  // sort criteria compare couples by the SUM of both members' values instead of one team's
  // own. Not itself a sort criterion — a display-mode switch alongside the sort column,
  // gated the same way the old "match" sort-item was: no fixtures to group by at the
  // 'qualified' stage, so switching to 'match' there is a no-op (forced back to 'team').
  let _displayMode = 'team';
  // Set only when _updateCarouselTitle auto-forces 'match' back to 'team' because the carousel
  // dropped to stage 0 (see below) — remembers that this was NOT the user's own choice, so
  // 'match' comes back on its own once a valid stage is reached again, instead of staying stuck
  // on 'team' until the user re-picks it by hand. A user-driven switch to 'team' at a valid
  // stage never sets this (nothing to restore), and it's consumed (cleared) the moment it fires.
  let _autoSwitchedFromMatch = false;

  const _sidebarHost = document.getElementById('sidebar-host');
  render(html`<div id="control-sidebar" class="${alwaysOpen ? 'csb-always-open' : 'collapsed'} taxonomy">
  ${alwaysOpen ? nothing : html`<button class="csb-toggle" title="Toggle filter">‹</button>`}
  <div class="csb-body"><table class="csb-table table table-sm table-bordered"><tbody>
    <tr>
      <td class="csb-header csb-border-right text-center text-muted" style="position:relative">${T.sortLabels.action}${alwaysOpen ? nothing : html`<span class="csb-close btn-close btn-close-sm position-absolute top-0 start-0 m-1" aria-label="Close" style="font-size:0.5rem;"></span>`}</td>
      <td colspan="2" class="csb-header text-center text-muted" data-col="all" style="position:relative"><button id="csb-share" class="csb-share" title="Copy shareable link"><img src="images/solar_linear/share-svgrepo-com.svg" width="18" height="18" aria-hidden="true"></button><em class="elo-item"> ${T.filterLabels.action}</em><button id="params-badge" class="csb-params-badge" hidden title="URL params active"><img src="images/solar_linear/question-circle-svgrepo-com.svg" width="18" height="18" aria-hidden="true"></button></td>
      <td class="csb-col" data-col="exp"><span class="elo-item elo-item--exp"><span class="elo-name">${T.filterLabels.exporter}</span></span></td>
      <td class="csb-col" data-col="nexp"><span class="elo-item"><span class="elo-name">${T.filterLabels.nonExp}</span></span></td>
    </tr>
    <tr>
      <td rowspan="3" class="csb-sort-col csb-border-right text-muted">
        <div class="csb-sort-list d-flex flex-column h-100 position-relative">
          <button class="csb-sort-dir"></button>
          <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="elo">${T.sortLabels.elo}</div>
          <!-- <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="exp">${T.sortLabels.exp}</div> -->
          <!-- <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="imp">${T.sortLabels.imp}</div> -->
          <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="pop">${T.sortLabels.pop}</div>
          <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="delta">${T.sortLabels.delta}</div>
          <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="alpha">${T.sortLabels.alpha}</div>
        </div>
      </td>
      <td rowspan="2" class="csb-group" data-row="q"><div id="csb-stage-carousel" class="carousel slide csb-stage-carousel">
        <div class="carousel-inner">
          ${CAROUSEL_STAGES.map((key, i) => html`
          <div class="carousel-item ${i === 0 ? 'active' : ''}" data-stage="${i}">
            <span class="elo-item elo-item--qualified"><span class="elo-name">${T.stageLabels[i].toLowerCase()}</span></span>
          </div>`)}
        </div>
        <button class="carousel-control-prev" type="button" data-bs-target="#csb-stage-carousel" data-bs-slide="prev"><span class="carousel-control-prev-icon" aria-hidden="true"></span></button>
        <button class="carousel-control-next" type="button" data-bs-target="#csb-stage-carousel" data-bs-slide="next"><span class="carousel-control-next-icon" aria-hidden="true"></span></button>
        <div class="carousel-indicators">
          ${CAROUSEL_STAGES.map((key, i) => html`<button type="button" data-bs-target="#csb-stage-carousel" data-bs-slide-to="${i}" class="${i === 0 ? 'active' : ''}" aria-label="${T.stageLabels[i]}"></button>`)}
        </div>
      </div></td>
      <td class="csb-row" data-row="qi"><span class="elo-item elo-item--qualified elo-item--imp"><span class="elo-name">${T.filterLabels.importer}</span></span></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-qie" checked></label></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-qi"  checked></label></td>
    </tr>
    <tr>
      <td class="csb-row" data-row="qni"><span class="elo-item elo-item--qualified"><span class="elo-name">${T.filterLabels.nonImp}</span></span></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-qe"  checked></label></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-q"   checked></label></td>
    </tr>
    <tr>
      <td rowspan="2" class="csb-group" data-row="nq"><span class="elo-item"><span class="elo-name">${T.filterLabels.nonQual}</span></span></td>
      <td class="csb-row" data-row="nqf" style="white-space:nowrap;">
        <span class="elo-item"><span class="elo-name">FIFA</span></span>
        <div class="dropdown" id="zoom-conf-dropdown"  style="z-index:2000;">
          <button type="button" class="csb-conf-btn dropdown-toggle" data-bs-toggle="dropdown" data-bs-strategy="fixed" aria-label="View by confederation">
            <img src="images/solar_linear/widget-5-svgrepo-com.svg" width="16" height="16" aria-hidden="true">
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="" checked> All FIFA Confederations</label></li>
            <li><hr class="dropdown-divider"></li>
            <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="uefa"> UEFA — Europe</label></li>
            <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="afc"> AFC — Asia</label></li>
            <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="caf"> CAF — Africa</label></li>
            <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="conmebol"> CONMEBOL — South America</label></li>
            <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="concacaf"> CONCACAF — N. &amp; C. America</label></li>
            <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="ofc"> OFC — Oceania</label></li>
          </ul>
        </div>
      </td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-ef"  checked></label></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-of"></label></td>
    </tr>
    <tr>
      <td class="csb-sort-col csb-border-right text-muted">
        <div class="csb-display-toggle" title="${T.sortLabels.matchHint}">
          <input type="radio" class="btn-check" name="csb-display" id="csb-display-team" data-display="team" checked>
          <label class="btn" for="csb-display-team">${T.sortLabels.teamDisplay}</label>
          <input type="radio" class="btn-check" name="csb-display" id="csb-display-match" data-display="match">
          <label class="btn" for="csb-display-match">${T.sortLabels.match}</label>
        </div>
      </td>
      <td class="csb-row" data-row="nqn"><span class="elo-item elo-item--nonfifa"><span class="elo-name">non-FIFA</span></span></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-en"  checked></label></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-on"></label></td>
    </tr>
  </tbody></table></div>
</div>`, _sidebarHost);

  const _el = document.getElementById('control-sidebar');
  const _toggle = _el.querySelector('.csb-toggle');
  const _body = _el.querySelector('.csb-body');
  const _panel = _body;

  const _fltQIE = _panel.querySelector('#filter-qie');
  const _fltQI  = _panel.querySelector('#filter-qi');
  const _fltQE  = _panel.querySelector('#filter-qe');
  const _fltQ   = _panel.querySelector('#filter-q');
  const _fltEF  = _panel.querySelector('#filter-ef');
  const _fltOF  = _panel.querySelector('#filter-of');
  const _fltEN  = _panel.querySelector('#filter-en');
  const _fltON  = _panel.querySelector('#filter-on');
  // ── Stage carousel (Qualified → Round of 32 → … → Winner) ──────────────
  const _carouselEl = _panel.querySelector('#csb-stage-carousel');
  let _stage = 0; // index into CAROUSEL_STAGES — 0 ('qualified') shows every qualified team
  const _bsCarousel = (_carouselEl && typeof bootstrap !== 'undefined')
    ? new bootstrap.Carousel(_carouselEl, { interval: false, wrap: false })
    : null;
  _carouselEl?.addEventListener('click', e => {
    if (e.target.closest('.carousel-control-prev, .carousel-control-next, .carousel-indicators')) e.stopPropagation();
  });
  // Native title tooltip: team count at this stage, plus the eliminated/through/to-play
  // breakdown from app.bracketState when the stage falls on a real knockout round.
  const _updateCarouselTitle = () => {
    if (!_carouselEl) return;
    const qualifiedIds = Object.keys(QUALIFIED_NAMES).map(Number);
    const total = qualifiedIds.filter(id => reachesStage(app.stageIndexById?.get(id), _stage)).length;
    const bs = app.bracketState?.[ELIM_ROUNDS[_stage]];
    _carouselEl.title = bs
      ? `${total} · ${bs.eliminated} ${T.bracketEliminated} · ${bs.playing} ${T.bracketToPlay}`
      : `${total}`;
    _refreshCarouselBounds();
    // "match" display only means anything once the carousel has moved off 'qualified' (stage
    // 0) — there's no fixture to group by until a knockout round is being viewed. Disabled
    // (native `disabled` on the radio — Bootstrap's own .btn-check:disabled+.btn CSS dims the
    // label, and a disabled radio's label click is a no-op natively) rather than removed, so
    // the switch's layout stays stable; forced back to 'team' if the carousel is navigated
    // back down to stage 0 while it was active — but remembered (_autoSwitchedFromMatch) and
    // silently restored the next time a valid stage is reached, since that switch was never
    // the user's own choice.
    if (_matchDisplayRadio) _matchDisplayRadio.disabled = _stage === 0;
    if (_stage === 0) {
      if (_displayMode === 'match') _autoSwitchedFromMatch = true;
      _setDisplayMode('team'); // no-op if already 'team'
    } else if (_autoSwitchedFromMatch) {
      _autoSwitchedFromMatch = false;
      _setDisplayMode('match');
    }
  };

  // The tournament hasn't reached every stage yet — cap navigation at the furthest stage that
  // currently has at least one team in it (counts are monotonically non-increasing by stage,
  // so the first empty one marks the boundary; everything past it stays locked until it fills).
  let _maxStage = CAROUSEL_STAGES.length - 1;
  const _nextBtn = _carouselEl?.querySelector('.carousel-control-next') ?? null;
  const _indicatorBtns = _carouselEl ? [..._carouselEl.querySelectorAll('.carousel-indicators button')] : [];
  const _refreshCarouselBounds = () => {
    const qualifiedIds = Object.keys(QUALIFIED_NAMES).map(Number);
    let max = 0;
    for (let p = 0; p < CAROUSEL_STAGES.length; p++) {
      const count = qualifiedIds.filter(id => reachesStage(app.stageIndexById?.get(id), p)).length;
      if (count > 0) max = p; else break;
    }
    _maxStage = max;
    _nextBtn?.classList.toggle('csb-stage-disabled', _stage >= _maxStage);
    _indicatorBtns.forEach((btn, i) => btn.classList.toggle('csb-stage-locked', i > _maxStage));
  };

  _carouselEl?.addEventListener('slide.bs.carousel', e => {
    if (e.to > _maxStage) { e.preventDefault(); return; }
    _stage = e.to;
    _updateCarouselTitle();
    _refreshCarouselBounds();
    callbacks.renderElo?.();
    applyFlagFilter();
    _saveState();
  });
  const _setStage = idx => { if (idx !== _stage) _bsCarousel?.to(idx); };

  const flagCat = id => {
    const qual = !!QUALIFIED_NAMES[id];
    const imp  = (app.importByCountry[id]?.length ?? 0) > 0;
    const exp  = (app.byId[id]?.count ?? 0) > 0;
    if  (qual &&  imp &&  exp) return 'qie';
    if  (qual &&  imp && !exp) return 'qi';
    if  (qual && !imp &&  exp) return 'qe';
    if  (qual && !imp && !exp) return 'q';
    if (!qual &&               exp) return 'e';
    return 'o';
  };

  const _catChecked = cat => ({qie:_fltQIE,qi:_fltQI,qe:_fltQE,q:_fltQ})[cat]?.checked ?? true;

  let _confIds = null; // set by setConfFilter(); null = no confederation filter
  let _confKey = null; // confederation key ('uefa' etc.) matching _confIds, for persistence/explain

  const catEloChecked = (id, fifaMember) => {
    if (_confIds && fifaMember && !_confIds.has(id)) return false;
    const cat = flagCat(id);
    if (cat === 'e') {
      if (!reachesStage(app.exporterStageIndex?.get(id), _stage)) return false;
      return fifaMember ? _fltEF.checked : _fltEN.checked;
    }
    if (cat === 'o') return fifaMember ? _fltOF.checked : _fltON.checked;
    if (!reachesStage(app.stageIndexById?.get(id), _stage)) return false;
    return _catChecked(cat);
  };

  const isClickable = id => {
    const flag = document.querySelector(`.flag-qualified[data-id="${id}"]`);
    if (!flag || flag.getAttribute('visibility') === 'hidden') return false;
    return parseFloat(flag.getAttribute('opacity') ?? '1') >= 1;
  };

  const updateVisibleCountryCount = () => {
    const el = document.getElementById('visible-country-count');
    if (!el) return;
    const all = eloMain.querySelectorAll('.elo-item');
    const total = all.length;
    if (!total) return;
    const visible = [...all].filter(li => li.style.display !== 'none').length;
    el.textContent = `${visible}/${total}`;
  };

  const applyFlagFilter = () => {
    if (typeof d3 !== 'undefined') {
      d3.selectAll('.flag-qualified[data-elo-cat]')
        .attr('visibility', function() {
          const id = +this.getAttribute('data-id');
          return catEloChecked(id, fifaMemberIds.has(id)) ? null : 'hidden';
        })
        .attr('cursor', function() {
          return isClickable(+this.getAttribute('data-id')) ? 'pointer' : 'default';
        });
      d3.selectAll('.country[data-id]').style('cursor', function() {
        return isClickable(+this.getAttribute('data-id')) ? 'pointer' : 'default';
      });
    }
    updateVisibleCountryCount();
  };

  const _filterToggle = chks => {
    const on = chks.every(c => c.checked);
    chks.forEach(c => c.checked = !on);
    callbacks.renderElo?.();
    applyFlagFilter();
    _saveState();
  };

  _panel.querySelectorAll('[data-row="q"] .elo-item.elo-item--qualified').forEach(el => el.addEventListener('click', () => _filterToggle([_fltQIE, _fltQI, _fltQE, _fltQ])));
  _panel.querySelector('[data-row="qi"]'  ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQI]));
  _panel.querySelector('[data-row="qni"]' ).addEventListener('click', () => _filterToggle([_fltQE,  _fltQ]));
  _panel.querySelector('[data-row="nq"]'  ).addEventListener('click', () => _filterToggle([_fltEF, _fltOF, _fltEN, _fltON]));
  _panel.querySelector('[data-row="nqf"]' ).addEventListener('click', e => { if (e.target.closest('#zoom-conf-dropdown')) return; _filterToggle([_fltEF, _fltOF]); });
  const _confDropdown = _panel.querySelector('#zoom-conf-dropdown');
  const _confRadios = _confDropdown?.querySelectorAll('input[data-conf]');
  const _syncConfRadio = () => { _confRadios?.forEach(r => { r.checked = r.dataset.conf === (_confKey ?? ''); }); };
  _confDropdown?.addEventListener('show.bs.dropdown',   () => { _body.style.overflow = 'visible'; });
  _confDropdown?.addEventListener('hidden.bs.dropdown', () => { _body.style.overflow = ''; });
  _confDropdown?.addEventListener('click', e => {
    const item = e.target.closest('[data-conf]');
    if (!item) return;
    e.stopPropagation();
    const conf = item.dataset.conf;
    const ids = conf ? (CONF_IDS[conf] ?? null) : null;
    setConfFilter(ids, conf || null);
    document.dispatchEvent(new CustomEvent('mundial-conf-changed', { detail: { conf, ids } }));
  });
  _panel.querySelector('[data-row="nqn"]' ).addEventListener('click', () => _filterToggle([_fltEN, _fltON]));
  _panel.querySelector('[data-col="exp"]' ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQE, _fltEF, _fltEN]));
  _panel.querySelector('[data-col="nexp"]').addEventListener('click', () => _filterToggle([_fltQI,  _fltQ,  _fltOF, _fltON]));
  _panel.querySelector('[data-col="all"]' ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQI, _fltQE, _fltQ, _fltEF, _fltOF, _fltEN, _fltON]));
  _panel.addEventListener('change', () => { callbacks.renderElo?.(); applyFlagFilter(); _saveState(); });

  _panel.querySelector('.csb-close')?.addEventListener('click', e => {
    e.stopPropagation();
    _el.classList.add('collapsed');
    _toggle.textContent = '‹';
  });

  // ── Sort controls ──
  const _sortListEl = _panel.querySelector('.csb-sort-list');
  const _sortDirBtn = _sortListEl.querySelector('.csb-sort-dir');
  const _alphaEl = _sortListEl.querySelector('[data-sort="alpha"]');
  // Own table cell (freed up by the sort column's rowspan="3", one row short of the full
  // filter grid) — not inside .csb-sort-list, so it needs its own element lookup + listener
  // below rather than piggybacking on _sortListEl's. Bootstrap's btn-check pattern (radio +
  // label, see getbootstrap.com/docs/5.3/forms/checks-radios) — the checked/disabled visual
  // states are Bootstrap's own CSS (:checked+.btn, :disabled+.btn), nothing custom to maintain.
  const _displayToggleEl = _panel.querySelector('.csb-display-toggle');
  const _teamDisplayRadio = _displayToggleEl.querySelector('[data-display="team"]');
  const _matchDisplayRadio = _displayToggleEl.querySelector('[data-display="match"]');

  // team/match display switch — see _displayMode's own comment above for what it does.
  // Not part of _sortOrder/_updateSortCol's reordering: it's a mode switch, not a
  // reorderable priority. Self-guards against 'match' at stage 0 (no fixtures to group by
  // there) rather than relying on callers to check first or on a stage-change event firing —
  // _setStage(0) is a no-op when already at stage 0, so nothing would otherwise catch a
  // restored/URL-forced 'match' at the default stage.
  const _setDisplayMode = mode => {
    if (mode === 'match' && _stage === 0) mode = 'team';
    if (mode === _displayMode) return;
    _displayMode = mode;
    _teamDisplayRadio.checked = mode === 'team';
    _matchDisplayRadio.checked = mode === 'match';
  };

  const _updateAlphaLabel = () => {
    _alphaEl.textContent = _sortOrder[0] === 'alpha' && _sortDir === 'asc' ? 'Z–A' : 'A–Z';
  };
  const _updateSortCol = () => {
    const items = Array.from(_sortListEl.querySelectorAll('.csb-sort-item'));
    const before = new Map(items.map(el => [el, el.getBoundingClientRect().top]));
    _sortOrder.forEach(key => { const el = _sortListEl.querySelector(`[data-sort="${key}"]`); if (el) _sortListEl.appendChild(el); });
    _sortDirBtn.dataset.dir = _sortDir;
    _updateAlphaLabel();
    items.forEach(el => {
      const delta = before.get(el) - el.getBoundingClientRect().top;
      if (delta === 0) return;
      el.style.transition = 'none';
      el.style.transform = `translateY(${delta}px)`;
      el.getBoundingClientRect();
      el.style.transition = 'transform 0.25s ease';
      el.style.transform = '';
      el.addEventListener('transitionend', () => { el.style.transition = ''; }, { once: true });
    });
  };
  _updateSortCol();

  _sortListEl?.addEventListener('click', e => {
    const btn = e.target.closest('.csb-sort-dir');
    if (btn) {
      e.stopPropagation();
      _sortDir = _sortDir === 'desc' ? 'asc' : 'desc';
      _sortDirBtn.dataset.dir = _sortDir;
      _updateAlphaLabel();
      callbacks.renderElo?.(callbacks.scrollToActiveElo);
      _saveState();
      return;
    }
    const item = e.target.closest('.csb-sort-item');
    if (item) {
      const key = item.dataset.sort;
      _sortOrder = [key, ..._sortOrder.filter(k => k !== key)];
      _updateSortCol();
      callbacks.renderElo?.(callbacks.scrollToActiveElo);
      _saveState();
    }
  });

  // 'change' (not 'click') — btn-check is a real radio input; clicking its <label> is what
  // fires the native change event once the browser has already flipped `checked` for us.
  _displayToggleEl.addEventListener('change', e => {
    const radio = e.target.closest('input[name="csb-display"]');
    if (!radio) return;
    _setDisplayMode(radio.dataset.display);
    callbacks.renderElo?.(callbacks.scrollToActiveElo);
    _saveState();
  });

  if (!alwaysOpen) {
  _toggle.addEventListener('click', () => {
    const collapsed = _el.classList.toggle('collapsed');
    _toggle.textContent = collapsed ? '‹' : '›';
  });
  } // end !alwaysOpen

  // ── Swipe-to-reveal / swipe-to-hide drawer gesture (map page only) ──
  if (!alwaysOpen) {
  const _pageHeader = document.getElementById('page-header');
  let _swX0 = null, _swDragging = false, _swExpanding = false;
  const _maxW = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--csb-w')) || 300;

  const _swStart = e => {
    _swX0 = e.touches[0].clientX;
    _swDragging = false;
  };

  const _swMove = (e, expanding) => {
    if (_swX0 == null) return;
    const dx = e.touches[0].clientX - _swX0;
    const absDx = Math.abs(dx);
    if (!_swDragging && absDx < 10) return;
    if (!_swDragging) {
      if (expanding && dx > 0) { _swX0 = null; return; }
      if (!expanding && dx < 0) { _swX0 = null; return; }
      _swDragging = true;
      _swExpanding = expanding;
      _body.style.transition = 'none';
      if (expanding) _el.classList.remove('collapsed');
    }
    const mw = _maxW();
    let w;
    if (_swExpanding) {
      w = Math.min(mw, Math.max(0, -dx));
    } else {
      w = Math.min(mw, Math.max(0, mw - dx));
    }
    _body.style.maxWidth = w + 'px';
    _toggle.style.opacity = String(0.4 + 0.6 * (w / mw));
  };

  const _swEnd = e => {
    if (_swX0 == null && !_swDragging) return;
    const mw = _maxW();
    if (!_swDragging) {
      _swX0 = null;
      return;
    }
    _swDragging = false;
    _swX0 = null;
    const cur = parseFloat(_body.style.maxWidth) || 0;
    const threshold = mw * 0.3;
    const open = _swExpanding ? cur >= threshold : cur >= (mw - threshold);
    _body.style.transition = 'max-width 0.3s ease';
    _toggle.style.transition = 'opacity 0.3s ease';
    if (open) {
      _body.style.maxWidth = mw + 'px';
      _toggle.style.opacity = '';
      _el.classList.remove('collapsed');
      _toggle.textContent = '›';
    } else {
      _body.style.maxWidth = '0px';
      _toggle.style.opacity = '';
      _el.classList.add('collapsed');
      _toggle.textContent = '‹';
    }
    const _cleanup = () => {
      _body.style.transition = '';
      _body.style.maxWidth = '';
      _toggle.style.transition = '';
    };
    _body.addEventListener('transitionend', _cleanup, { once: true });
    setTimeout(_cleanup, 350);
  };

  if (_pageHeader) {
    _pageHeader.addEventListener('touchstart', _swStart, { passive: true });
    _pageHeader.addEventListener('touchmove', e => _swMove(e, true), { passive: true });
    _pageHeader.addEventListener('touchend', _swEnd);
    _pageHeader.addEventListener('touchcancel', _swEnd);
  }
  _el.addEventListener('touchstart', _swStart, { passive: true });
  _el.addEventListener('touchmove', e => _swMove(e, false), { passive: true });
  _el.addEventListener('touchend', _swEnd);
  _el.addEventListener('touchcancel', _swEnd);


  // ── Map swipe zone (top-right 1/3 × 1/3 of map, landscape mobile) ──
  // Listens on the SVG itself (capture phase) so taps and D3 zoom/pan pass
  // through normally. Only intercepts when the gesture is a clear leftward
  // horizontal swipe originating in the zone.
  const _mapSvg = document.getElementById('map');
  if (_mapSvg) {
    let _mzActive = false, _mzCaptured = false, _mzX0 = null, _mzY0 = null;

    const _landscapeMQ = window.matchMedia('(max-height: 500px) and (orientation: landscape)');
    const _inZone = (x, y) => {
      if (!_landscapeMQ.matches) return false;
      const r = _mapSvg.getBoundingClientRect();
      return x >= r.left + r.width * 2 / 3 && y <= r.top + r.height / 3;
    };

    _mapSvg.addEventListener('touchstart', e => {
      const t = e.touches[0];
      _mzActive = _inZone(t.clientX, t.clientY);
      _mzCaptured = false;
      if (_mzActive) {
        _mzX0 = t.clientX;
        _mzY0 = t.clientY;
        _swStart(e);
      }
    }, { capture: true, passive: true });

    _mapSvg.addEventListener('touchmove', e => {
      if (!_mzActive) return;
      if (_mzX0 == null) return;
      const t = e.touches[0];
      if (!_mzCaptured) {
        const dx = t.clientX - _mzX0;
        const dy = t.clientY - _mzY0;
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        if (dx >= 0 || Math.abs(dy) > Math.abs(dx)) {
          _mzActive = false;
          _mzX0 = null;
          _swX0 = null;
          return;
        }
        _mzCaptured = true;
      }
      e.stopPropagation();
      e.preventDefault();
      _swMove(e, true);
    }, { capture: true, passive: false });

    _mapSvg.addEventListener('touchend', e => {
      if (_mzCaptured) { e.stopPropagation(); e.preventDefault(); _swEnd(e); }
      _mzActive = false;
      _mzCaptured = false;
      _mzX0 = null;
      _mzY0 = null;
    }, { capture: true });

    _mapSvg.addEventListener('touchcancel', e => {
      if (_mzCaptured) { e.stopPropagation(); _swEnd(e); }
      _mzActive = false;
      _mzCaptured = false;
      _mzX0 = null;
      _mzY0 = null;
    }, { capture: true });
  }
  } // end !alwaysOpen (map swipe zone)

  // ── Measure sidebar dimensions ──
  const measureControlSidebar = () => {
    const wasCollapsed = _el.classList.contains('collapsed');
    _el.classList.remove('collapsed');
    _body.style.maxWidth = 'none';
    _body.style.width = 'max-content';
    document.documentElement.style.setProperty('--csb-w', _body.offsetWidth + 'px');
    document.documentElement.style.setProperty('--csb-h', _panel.querySelector('.csb-table').offsetHeight + 'px');
    _body.style.maxWidth = '';
    _body.style.width = '';
    if (wasCollapsed) _el.classList.add('collapsed');
  };
  measureControlSidebar();

  // Fixture pairing for match-display mode — only meaningful once the carousel is off
  // 'qualified' (stage 0), since there's no single fixture per team at the qualified stage.
  // Data comes from app.matchInfoByIso2 (qualified.js's buildMatchInfo), layering two sources:
  // status.json's lostTo (authoritative winner/loser, including penalty shootouts) for decided
  // fixtures, and data/fixtures.json (mundial-build) for real pairing — home/away, date,
  // `won: null` — on fixtures that haven't been played yet. A team can still end up with no
  // pairing at all (e.g. a bracket slot too far out to be scheduled yet) — see _buildGroups.
  const _matchInfo = item => _stage > 0 ? app.matchInfoByIso2?.[item.iso2]?.[_stage] : undefined;

  const _sortFns = {
    elo:   (a, b) => (a.rank ?? 99999) - (b.rank ?? 99999),
    exp:   (a, b) => b.expCount - a.expCount,
    imp:   (a, b) => b.impCount - a.impCount,
    delta: (a, b) => (b.expCount - b.impCount) - (a.expCount - a.impCount) || (b.expCount + b.impCount) - (a.expCount + a.impCount),
    pop:   (a, b) => (b.pop ?? 0) - (a.pop ?? 0),
    alpha: (a, b) => a.name.localeCompare(b.name),
  };

  const _ptsFor = (key, item, fmtPop) =>
      key === 'exp'   ? item.expCount
    : key === 'imp'   ? item.impCount
    : key === 'delta' ? (item.impCount && item.expCount ? `${item.impCount} · ${item.expCount}` : item.impCount || item.expCount || null)
    : key === 'elo'   ? item.pts
    : key === 'pop'   ? (item.pop ? fmtPop(item.pop) : null)
    : null;

  // Per-team numeric value used to SUM a fixture couple's combined standing in match-display
  // mode — deliberately different from _sortFns.elo's own comparator, which sorts single teams
  // by `rank` (an ordinal position, meaningless to add across two teams). `pts` is the actual
  // Elo rating (e.g. France 2134, Paraguay 1823) — a cardinal quantity that combines sensibly
  // into "this fixture's combined rating", matching pop/delta's already-additive nature. `alpha`
  // has no numeric aggregate at all — handled separately in _groupCompare via a representative
  // name instead of a sum.
  const _aggregateValue = (key, item) =>
      key === 'elo'   ? Number(item.pts) || 0
    : key === 'pop'   ? (item.pop ?? 0)
    : key === 'delta' ? (item.expCount - item.impCount)
    : 0;

  // Groups filtered items into fixture couples for match-display mode: each team pairs with
  // its app.matchInfoByIso2 opponent if that opponent is itself present (visible) in `items` —
  // an opponent hidden by the category filters means no couple, just a lone row. Teams with no
  // pairing data at all (see _matchInfo's comment) are also lone rows.
  const _buildGroups = items => {
    const byIso2 = new Map(items.map(i => [i.iso2, i]));
    const seen = new Set();
    const groups = [];
    for (const item of items) {
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      const partnerIso2 = _matchInfo(item)?.opponentIso2;
      const partner = partnerIso2 ? byIso2.get(partnerIso2) : null;
      if (partner && !seen.has(partner.id)) { seen.add(partner.id); groups.push([item, partner]); }
      else groups.push([item]);
    }
    return groups;
  };

  // Compares two groups (each 1 or 2 items) by a single sort key — sum of _aggregateValue for
  // numeric keys, or the alphabetically-first member's name for 'alpha'. Higher/earlier sorts
  // first, matching the existing pop/delta comparators' (b - a) convention; sign-flipped by the
  // caller for the primary key when _sortDir is 'asc', same as team-display mode.
  const _groupCompare = (key, ga, gb) => key === 'alpha'
    ? [...ga].map(m => m.name).sort()[0].localeCompare([...gb].map(m => m.name).sort()[0])
    : gb.reduce((s, m) => s + _aggregateValue(key, m), 0) - ga.reduce((s, m) => s + _aggregateValue(key, m), 0);

  const sortAndFilter = (allItems, fmtPop) => {
    const filtered = allItems.filter(item => catEloChecked(item.id, item.fifaMember));
    const primary   = _sortOrder[0];
    const secondary = _sortOrder[1];

    let ordered;
    if (_displayMode === 'match') {
      const groups = _buildGroups(filtered);
      groups.sort((ga, gb) => {
        for (let i = 0; i < Math.min(_sortOrder.length, 3); i++) {
          let d = _groupCompare(_sortOrder[i], ga, gb);
          if (i === 0 && _sortDir === 'asc') d = -d;
          if (d !== 0) return d;
        }
        return 0;
      });
      // Within a couple: stronger-by-primary-criterion member first (or alphabetical for
      // 'alpha') — an arbitrary but stable, deterministic choice; nothing downstream depends
      // on which member leads. _pairId ties both rows together for elo_ranking.js's row
      // grouping (see EloRanking.show()) — absent (undefined) for lone rows. _pairScore is the
      // "a – b" goal tally (from a's own matchInfo, so it already reads in [a, b] display
      // order), null for a fixture that hasn't been played yet — elo_ranking.js falls back to
      // a plain separator in that case.
      ordered = groups.flatMap(g => {
        if (g.length === 1) return g;
        const [a, b] = primary === 'alpha' ? [...g].sort((x, y) => x.name.localeCompare(y.name)) : [...g].sort((x, y) => _aggregateValue(primary, y) - _aggregateValue(primary, x));
        const pairId = [a.id, b.id].sort().join('-');
        const infoA = _matchInfo(a);
        const pairScore = infoA?.myGoals != null
          ? { home: infoA.myGoals, away: infoA.oppGoals, penalties: infoA.penalties, penaltyHome: infoA.myPenGoals, penaltyAway: infoA.oppPenGoals }
          : null;
        return [{ ...a, _pairId: pairId, _pairScore: pairScore }, { ...b, _pairId: pairId, _pairScore: pairScore }];
      });
    } else {
      ordered = [...filtered].sort((a, b) => {
        for (let i = 0; i < Math.min(_sortOrder.length, 3); i++) {
          let d = _sortFns[_sortOrder[i]](a, b);
          if (i === 0 && _sortDir === 'asc') d = -d;
          if (d !== 0) return d;
        }
        return 0;
      });
    }

    return ordered.map(item => ({
      ...item,
      pts:  primary === 'alpha' ? null : _ptsFor(primary, item, fmtPop),
      pts2: secondary ? _ptsFor(secondary, item, fmtPop) : null,
      // Undecided at the currently-viewed stage — fixture not yet played, could still go
      // either way. Recomputed on every call since it depends on the live carousel position.
      pending: item.pendingFrom != null && _stage >= item.pendingFrom,
    }));
  };

  const _SORT_KEYS  = new Set(['elo', 'alpha', 'pop', 'delta']);
  const _ALIASES    = {
    qual:  ['qie','qi','qe','q'],
    nq:    ['ef','en','of','on'],
    exp:   ['qie','qe','ef','en'],
    nexp:  ['qi','q','of','on'],
    imp:   ['qie','qi'],
    all:   ['qie','qi','qe','q','ef','en','of','on'],
  };
  const _CELL_MAP   = { qie:_fltQIE, qi:_fltQI, qe:_fltQE, q:_fltQ, ef:_fltEF, en:_fltEN, of:_fltOF, on:_fltON };

  // ── URL params debug (badge · panel · console) ─────────────────────────

  const _SORT_NAMES  = { elo: 'Elo ranking', alpha: 'A–Z', pop: 'population', delta: 'plays-for minus born-in' };
  const _STAGE_NAMES = ['Qualified', 'Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final', 'Winner'];
  const _KNOWN_PARAMS = new Set(['sort', 'dir', 'stage', 'show', 'fifa', 'display', 'explain']);
  const _DISPLAY_NAMES = { team: 'teams (flat list)', match: 'grouped by fixture — sort criteria sum both teams\' values' };
  const _CONF_NAMES = { uefa:'UEFA — Europe', afc:'AFC — Asia', caf:'CAF — Africa', conmebol:'CONMEBOL — South America', concacaf:'CONCACAF — N. & C. America', ofc:'OFC — Oceania' };
  const _badge = _el.querySelector('#params-badge');
  let _lastLines = [], _panelEl = null;

  const _countVisible = () =>
    [...eloMain.querySelectorAll('.elo-item')].filter(el => el.style.display !== 'none').length;

  const _buildLines = (sp) => {
    const lines = [];
    const stageParam = sp.get('stage');
    if (stageParam) {
      const idx = CAROUSEL_STAGES.indexOf(stageParam);
      lines.push(idx >= 0
        ? { param: `?stage=${stageParam}`, desc: `stage: ${_STAGE_NAMES[idx]} — qualified & exporters filtered to teams that reached it` }
        : { param: `?stage=${stageParam}`, desc: `unknown stage — ignored (valid: ${CAROUSEL_STAGES.join(' ')})` });
    }
    const sortRaw = sp.get('sort');
    if (sortRaw) {
      const keys = sortRaw.split(/[\s,+]+/).filter(k => _SORT_KEYS.has(k));
      lines.push(keys.length
        ? { param: `?sort=${sortRaw.trim()}`, desc: `sort: ${keys.map(k => _SORT_NAMES[k]).join(' → ')}` }
        : { param: `?sort=${sortRaw.trim()}`, desc: 'no valid sort keys — ignored' });
    }
    const dir = sp.get('dir');
    if      (dir === 'asc')  lines.push({ param: '?dir=asc',  desc: 'ascending ↑' });
    else if (dir === 'desc') lines.push({ param: '?dir=desc', desc: 'descending ↓' });
    else if (dir)            lines.push({ param: `?dir=${dir}`, desc: 'invalid direction — ignored (use asc or desc)' });
    const show = sp.get('show');
    if (show) {
      const cells = new Set(), unknown = [];
      show.split(',').forEach(t => {
        const k = t.trim();
        const expanded = (_ALIASES[k] ?? [k]).filter(c => _CELL_MAP[c]);
        expanded.length ? expanded.forEach(c => cells.add(c)) : unknown.push(k);
      });
      const valid = [...cells];
      const suffix = unknown.length ? ` — unknown: ${unknown.join(', ')}` : '';
      lines.push(valid.length
        ? { param: `?show=${show}`, desc: `cells: ${valid.join(' · ')}${suffix}` }
        : { param: `?show=${show}`, desc: `no valid codes${suffix} — ignored, defaults kept` });
    }
    const conf = sp.get('fifa');
    if (conf) {
      lines.push(_CONF_NAMES[conf]
        ? { param: `?fifa=${conf}`, desc: `confederation: ${_CONF_NAMES[conf]}` }
        : { param: `?fifa=${conf}`, desc: `unknown confederation — ignored (valid: ${Object.keys(_CONF_NAMES).join(' ')})` });
    }
    const display = sp.get('display');
    if (display) {
      lines.push(_DISPLAY_NAMES[display]
        ? { param: `?display=${display}`, desc: `display: ${_DISPLAY_NAMES[display]}` }
        : { param: `?display=${display}`, desc: `unknown display mode — ignored (valid: team, match)` });
    }
    for (const k of sp.keys()) {
      if (!_KNOWN_PARAMS.has(k)) lines.push({ param: `?${k}`, desc: 'unrecognized — ignored' });
    }
    return lines;
  };

  const _closeExplainPanel = () => { if (_panelEl) _panelEl.hidden = true; _badge?.classList.remove('active'); };
  const _openExplainPanel  = (lines, visible) => {
    if (!_panelEl) {
      _panelEl = document.createElement('div');
      _panelEl.id = 'params-panel';
      document.body.appendChild(_panelEl);
      document.addEventListener('keydown', e => { if (e.key === 'Escape') _closeExplainPanel(); });
    }
    render(html`
      <button class="pep-close" @click=${_closeExplainPanel}>×</button>
      <ul class="pep-list">
        ${lines.map(l => html`<li><code>${l.param}</code> — ${l.desc}</li>`)}
      </ul>
      <p class="pep-result">→ ${visible} ${visible === 1 ? 'country' : 'countries'} visible</p>`, _panelEl);
    _panelEl.hidden = false;
    _badge?.classList.add('active');
  };

  _badge?.addEventListener('click', e => {
    e.stopPropagation();
    (_panelEl && !_panelEl.hidden) ? _closeExplainPanel() : (_lastLines.length && _openExplainPanel(_lastLines, _countVisible()));
  });

  // ── Persistence (localStorage) ──────────────────────────────────────────

  const _CS_PARAM_KEYS = ['sort', 'dir', 'stage', 'show', 'fifa', 'display'];

  // Set only while _restoreState is applying a saved stage — _setStage below fires
  // 'slide.bs.carousel' synchronously, and that handler calls _saveState() itself (the normal
  // path for a user-driven carousel click). During restore that fires BEFORE _restoreState has
  // gone on to set _displayMode from the saved snapshot, so it would otherwise re-persist the
  // stale pre-restore display value and quietly undo what's about to be restored. Nothing needs
  // saving mid-restore anyway — everything being applied already came from localStorage.
  let _restoringState = false;

  const _saveState = () => {
    if (_restoringState) return;
    try {
      localStorage.setItem(_STORAGE_KEY, JSON.stringify({
        sortOrder: _sortOrder,
        sortDir: _sortDir,
        stage: CAROUSEL_STAGES[_stage],
        checks: Object.fromEntries(Object.entries(_CELL_MAP).map(([k, el]) => [k, !!el?.checked])),
        conf: _confKey,
        display: _displayMode,
      }));
    } catch { /* storage unavailable (private mode, quota, etc.) — ignore */ }
  };

  const _restoreState = () => {
    let saved;
    try { saved = JSON.parse(localStorage.getItem(_STORAGE_KEY)); } catch { saved = null; }
    if (!saved) return false;

    if (Array.isArray(saved.sortOrder) && saved.sortOrder.length === _sortOrder.length && saved.sortOrder.every(k => _SORT_KEYS.has(k))) {
      _sortOrder = [...new Set(saved.sortOrder)];
      _updateSortCol();
    }
    if (saved.sortDir === 'asc' || saved.sortDir === 'desc') {
      _sortDir = saved.sortDir;
      _sortDirBtn.dataset.dir = _sortDir;
      _updateAlphaLabel();
    }
    if (saved.checks) {
      Object.entries(_CELL_MAP).forEach(([k, el]) => { if (el && k in saved.checks) el.checked = !!saved.checks[k]; });
    }
    if (saved.conf && CONF_IDS[saved.conf]) {
      _confKey = saved.conf;
      _confIds = CONF_IDS[saved.conf];
    }
    _syncConfRadio();

    // Stage restore before display — _setDisplayMode('match') self-guards against _stage === 0,
    // and _stage is still its initial 0 until _setStage runs; a saved 'match' would otherwise
    // get silently downgraded to 'team', even when the saved stage itself is a valid one.
    // _restoringState suppresses _saveState() for the duration: _setStage fires
    // 'slide.bs.carousel' synchronously, whose handler calls _saveState() itself (the normal
    // user-driven-click path) — left unsuppressed, that would fire before _displayMode is set
    // below and re-persist the stale pre-restore value, undoing the very thing being restored.
    _restoringState = true;
    if (typeof saved.stage === 'string') {
      const idx = CAROUSEL_STAGES.indexOf(saved.stage);
      if (idx >= 0) _setStage(idx);
    }
    _restoringState = false;

    if (saved.display === 'team' || saved.display === 'match') _setDisplayMode(saved.display);

    callbacks.renderElo?.();
    applyFlagFilter();

    if (_confKey) {
      document.dispatchEvent(new CustomEvent('mundial-conf-changed', { detail: { conf: _confKey, ids: _confIds } }));
    }
    return true;
  };

  const _buildActiveStateLines = () => {
    const lines = [];
    if (_stage > 0) lines.push({ param: `stage=${CAROUSEL_STAGES[_stage]}`, desc: `stage: ${_STAGE_NAMES[_stage]} — qualified & exporters filtered to teams that reached it` });
    lines.push({ param: `sort=${_sortOrder.join(',')}`, desc: `sort: ${_sortOrder.map(k => _SORT_NAMES[k]).join(' → ')}` });
    lines.push({ param: `dir=${_sortDir}`, desc: _sortDir === 'asc' ? 'ascending ↑' : 'descending ↓' });
    const cells = Object.entries(_CELL_MAP).filter(([, el]) => el?.checked).map(([k]) => k);
    lines.push(cells.length
      ? { param: `show=${cells.join(',')}`, desc: `cells: ${cells.join(' · ')}` }
      : { param: 'show=', desc: 'no cells shown' });
    if (_confKey) lines.push({ param: `fifa=${_confKey}`, desc: `confederation: ${_CONF_NAMES[_confKey] ?? _confKey}` });
    if (_displayMode === 'match') lines.push({ param: 'display=match', desc: `display: ${_DISPLAY_NAMES.match}` });
    return lines;
  };

  // ── Share button (#csb-share) — builds a URL that reproduces this exact sidebar
  // configuration on another app instance, from the very same param lines
  // _buildActiveStateLines() above already feeds the explain panel/console with, so
  // "what's active" and "what a share link encodes" can never drift apart.
  const _shareBtn = _el.querySelector('#csb-share');
  let _shareToastEl = null;
  const _showShareToast = msg => {
    if (!_shareToastEl) {
      _shareToastEl = document.createElement('div');
      _shareToastEl.id = 'csb-share-toast';
      document.body.appendChild(_shareToastEl);
    }
    _shareToastEl.textContent = msg;
    clearTimeout(_shareToastEl._hideTimer);
    requestAnimationFrame(() => _shareToastEl.classList.add('visible'));
    _shareToastEl._hideTimer = setTimeout(() => _shareToastEl?.classList.remove('visible'), 2000);
  };
  _shareBtn?.addEventListener('click', async e => {
    e.stopPropagation(); // this button lives inside the [data-col="all"] cell — don't let the click bubble into its own filter-toggle handler
    const sp = new URLSearchParams();
    _buildActiveStateLines().forEach(({ param }) => {
      const eq = param.indexOf('=');
      sp.set(param.slice(0, eq), param.slice(eq + 1));
    });
    const url = `${location.origin}${location.pathname}?${sp.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      _showShareToast('URL copied to clipboard');
    } catch {
      _showShareToast('Could not copy URL to clipboard');
    }
  });

  const applyParams = (sp) => {
    if (!sp) return;

    if (!_CS_PARAM_KEYS.some(k => sp.has(k))) {
      // No control-sidebar params in the URL — restore the persisted state instead.
      const restored = _restoreState();
      if (sp.has('explain')) {
        const lines = _buildActiveStateLines();
        _lastLines = restored ? [{ param: '(restored)', desc: 'settings restored from your last visit' }, ...lines] : lines;
        const _visible = _countVisible();
        if (_badge) _badge.hidden = _lastLines.length === 0;
        if (_lastLines.length) {
          if (!alwaysOpen && _el.classList.contains('collapsed')) {
            _el.classList.remove('collapsed');
            if (_toggle) _toggle.textContent = '›';
          }
          _openExplainPanel(_lastLines, _visible);
        }
      }
      return;
    }

    let changed = false;

    const sort = sp.get('sort');
    if (sort) {
      const keys = sort.split(/[\s,+]+/).filter(k => _SORT_KEYS.has(k));
      if (keys.length) { _sortOrder = [...new Set([...keys, ..._sortOrder])].slice(0, _sortOrder.length); changed = true; }
    }

    const dir = sp.get('dir');
    if (dir === 'asc' || dir === 'desc') { _sortDir = dir; changed = true; }

    if (changed) _updateSortCol();

    // stage before display — _setDisplayMode('match') self-guards against _stage === 0, and
    // _stage is still its initial 0 until _setStage runs (see _restoreState's own note above).
    const stage = sp.get('stage');
    if (stage) {
      const idx = CAROUSEL_STAGES.indexOf(stage);
      if (idx >= 0) _setStage(idx);
    }

    const display = sp.get('display');
    if (display === 'team' || display === 'match') _setDisplayMode(display);

    const show = sp.get('show');
    if (show) {
      const cells = new Set();
      show.split(',').forEach(t => {
        const k = t.trim();
        (_ALIASES[k] ?? [k]).forEach(c => cells.add(c));
      });
      const _valid = [...cells].filter(c => _CELL_MAP[c]);
      if (_valid.length) Object.entries(_CELL_MAP).forEach(([k, el]) => { if (el) el.checked = cells.has(k); });
    }

    const conf = sp.get('fifa');
    if (conf !== null) { _confIds = CONF_IDS[conf] ?? null; _confKey = conf || null; _syncConfRadio(); }

    callbacks.renderElo?.();
    applyFlagFilter();

    if (conf && CONF_IDS[conf]) {
      document.dispatchEvent(new CustomEvent('mundial-conf-changed', { detail: { conf, ids: CONF_IDS[conf] } }));
    }

    _lastLines = _buildLines(sp);
    const _visible = _countVisible();
    if (_lastLines.length) {
      console.info('[params]\n' + _lastLines.map(l => `  ${l.param} → ${l.desc}`).join('\n') + `\n  → ${_visible} countries visible`);
      if (!alwaysOpen && _el.classList.contains('collapsed')) {
        _el.classList.remove('collapsed');
        if (_toggle) _toggle.textContent = '›';
      }
    }
    if (_badge) _badge.hidden = _lastLines.length === 0;
    if (sp.has('explain') && _lastLines.length) _openExplainPanel(_lastLines, _visible);

    _saveState();
  };

  const setConfFilter = (ids, key = null) => {
    _confIds = ids ?? null;
    _confKey = key;
    _syncConfRadio();
    callbacks.renderElo?.();
    applyFlagFilter();
    _saveState();
  };

  return {
    get sortOrder() { return _sortOrder; },
    get sortDir() { return _sortDir; },
    catEloChecked,
    flagCat,
    isClickable,
    applyFlagFilter,
    measureControlSidebar,
    updateVisibleCountryCount,
    sortAndFilter,
    applyParams,
    setConfFilter,
    updateStageTitle: _updateCarouselTitle,
  };
}
