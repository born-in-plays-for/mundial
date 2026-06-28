import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';

export function initSidebar({ T, QUALIFIED_NAMES, app, fifaMemberIds, eloMain, callbacks, alwaysOpen = false }) {
  let _sortOrder = ['elo', 'alpha', 'pop', 'delta'];
  let _sortDir = 'desc';

  const _sidebarHost = document.getElementById('sidebar-host');
  render(html`<div id="control-sidebar" class="${alwaysOpen ? 'csb-always-open' : 'collapsed'} taxonomy">
  ${alwaysOpen ? nothing : html`<button class="csb-toggle" title="Toggle filter">‹</button>`}
  <div class="csb-body overflow-hidden"><table class="csb-table table table-sm table-bordered"><tbody>
    <tr>
      <td class="csb-header csb-border-right text-center text-muted" style="position:relative">${T.sortLabels.action}${alwaysOpen ? nothing : html`<span class="csb-close btn-close btn-close-sm position-absolute top-0 start-0 m-1" aria-label="Close" style="font-size:0.5rem;"></span>`}</td>
      <td colspan="2" class="csb-header text-center text-muted" data-col="all"><em class="elo-item"> ${T.filterLabels.action}</em></td>
      <td class="csb-col" data-col="exp"><span class="elo-item elo-item--exp"><span class="elo-name">${T.filterLabels.exporter}</span></span></td>
      <td class="csb-col" data-col="nexp"><span class="elo-item"><span class="elo-name">${T.filterLabels.nonExp}</span></span></td>
    </tr>
    <tr>
      <td rowspan="4" class="csb-sort-col csb-border-right text-muted">
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
      <td rowspan="2" class="csb-group" data-row="q"><span class="elo-item elo-item--qualified"><span class="elo-name">${T.filterLabels.qualified}</span></span><button class="csb-ak-btn" id="btn-ak">💪 survivors</button></td>
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
      <td class="csb-row" data-row="nqf"><span class="elo-item"><span class="elo-name">FIFA</span></span></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-ef"  checked></label></td>
      <td class="text-muted"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-of"></label></td>
    </tr>
    <tr>
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
  const _btnAK  = _panel.querySelector('#btn-ak');
  _btnAK?.addEventListener('click', e => {
    e.stopPropagation();
    _btnAK.classList.toggle('active');
    callbacks.renderElo?.();
    applyFlagFilter();
  });

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

  const catEloChecked = (id, fifaMember) => {
    const cat = flagCat(id);
    if (cat === 'e') return fifaMember ? _fltEF.checked : _fltEN.checked;
    if (cat === 'o') return fifaMember ? _fltOF.checked : _fltON.checked;
    if (_btnAK?.classList.contains('active') && app.knockedOutIds?.has(id)) return false;
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
  };

  _panel.querySelector('[data-row="q"]'   ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQI, _fltQE, _fltQ]));
  _panel.querySelector('[data-row="qi"]'  ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQI]));
  _panel.querySelector('[data-row="qni"]' ).addEventListener('click', () => _filterToggle([_fltQE,  _fltQ]));
  _panel.querySelector('[data-row="nq"]'  ).addEventListener('click', () => _filterToggle([_fltEF, _fltOF, _fltEN, _fltON]));
  _panel.querySelector('[data-row="nqf"]' ).addEventListener('click', () => _filterToggle([_fltEF, _fltOF]));
  _panel.querySelector('[data-row="nqn"]' ).addEventListener('click', () => _filterToggle([_fltEN, _fltON]));
  _panel.querySelector('[data-col="exp"]' ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQE, _fltEF, _fltEN]));
  _panel.querySelector('[data-col="nexp"]').addEventListener('click', () => _filterToggle([_fltQI,  _fltQ,  _fltOF, _fltON]));
  _panel.querySelector('[data-col="all"]' ).addEventListener('click', () => _filterToggle([_fltQIE, _fltQI, _fltQE, _fltQ, _fltEF, _fltOF, _fltEN, _fltON]));
  _panel.addEventListener('change', () => { callbacks.renderElo?.(); applyFlagFilter(); });

  _panel.querySelector('.csb-close')?.addEventListener('click', e => {
    e.stopPropagation();
    _el.classList.add('collapsed');
    _toggle.textContent = '‹';
  });

  // ── Sort controls ──
  const _sortListEl = _panel.querySelector('.csb-sort-list');
  const _sortDirBtn = _sortListEl.querySelector('.csb-sort-dir');
  const _alphaEl = _sortListEl.querySelector('[data-sort="alpha"]');

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
      return;
    }
    const item = e.target.closest('.csb-sort-item');
    if (item) {
      const key = item.dataset.sort;
      _sortOrder = [key, ..._sortOrder.filter(k => k !== key)];
      _updateSortCol();
      callbacks.renderElo?.(callbacks.scrollToActiveElo);
    }
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

    const _inZone = (x, y) => {
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

  const sortAndFilter = (allItems, fmtPop) => {
    const raw = [...allItems].sort((a, b) => {
      for (let i = 0; i < Math.min(_sortOrder.length, 3); i++) {
        let d = _sortFns[_sortOrder[i]](a, b);
        if (i === 0 && _sortDir === 'asc') d = -d;
        if (d !== 0) return d;
      }
      return 0;
    });
    const primary   = _sortOrder[0];
    const secondary = _sortOrder[1];
    return raw
      .filter(item => catEloChecked(item.id, item.fifaMember))
      .map(item => ({
        ...item,
        pts:  primary === 'alpha' ? null : _ptsFor(primary, item, fmtPop),
        pts2: secondary ? _ptsFor(secondary, item, fmtPop) : null,
      }));
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
  };
}
