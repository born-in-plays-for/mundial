import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { CONF_IDS } from './conf.js';
import { CAROUSEL_STAGES, QUALIFIED_NAMES, QUALIFIED_BY_NAME, reachesStage, teamComparators } from './qualified.js';
import { createStageCarousel, maxReachableStage } from './stage_carousel.js';
import { loadJSON, saveJSON } from './persist.js';

const _STORAGE_KEY = 'mundial-players-sidebar-state';
const _TEAM_SORT_KEYS = ['elo', 'pop', 'delta', 'alpha'];
const _PARAM_KEYS = ['psort', 'pdir', 'pstage', 'pshow', 'pfifaconf'];

// Control 2 (see js/control_sidebar.js's own header comment for the 3-layer split this and
// that module both sit under). Purpose-built for wc2026_players.html — a player is a different
// object than a country, so this owns its own state shape rather than coercing player concepts
// (native/moved, name-vs-team sort) into control 1's country-shaped matrix. Shares the data
// layer with control 1 (teamComparators/CAROUSEL_STAGES/reachesStage from qualified.js,
// createStageCarousel/maxReachableStage from stage_carousel.js, loadJSON/saveJSON from
// persist.js) so the two can't silently drift on logic they both need.
//
// rawById: Map<countryId, buildEloItems() item> — "team standing" lookups (sort-by-team,
// stage reachability) for whichever qualified country a player's own `.nation` resolves to via
// QUALIFIED_BY_NAME. confIds: same shape as js/conf.js's CONF_IDS, overridable for tests.
export function initPlayersSidebar({ T, rawById, callbacks = {}, confIds: confIdsOverride = CONF_IDS }) {
  // 'team' (sort by the player's team standing) | 'player' (sort by player name) | 'birth'
  // (sort by birth country name) — one per table column (name/born in/plays for,
  // wc2026_players.html), set exclusively via setSort (table header click) or ?psort=. No
  // separate mode-toggle UI in this panel — the table headers themselves are the mode picker.
  let _mode = 'team';
  let _teamOrder = ['elo', 'pop', 'delta', 'alpha'];
  let _dir = 'desc';
  let _stage = 0; // index into CAROUSEL_STAGES
  let _maxStage = CAROUSEL_STAGES.length - 1;
  let _confIds = null;
  let _confKey = null;

  const _qualifiedIds = Object.keys(QUALIFIED_NAMES).map(Number);
  const _stageIndexById = new Map(_qualifiedIds.map(id => [id, rawById.get(id)?.visibleThroughIndex]));

  const _sidebarHost = document.getElementById('sidebar-host');
  render(html`<div id="players-sidebar" class="taxonomy"><div class="csb-body"><div class="csb-inset"><div class="csb-content d-flex flex-column gap-2">
    <div class="csb-toolbar d-flex align-items-center gap-2">
      <div class="dropdown dropend" id="players-conf-dropdown">
        <button type="button" class="csb-conf-btn dropdown-toggle pe-2" data-bs-toggle="dropdown" data-bs-strategy="fixed" aria-label="${T.csbParams.confDropdown}" title="${T.csbParams.confDropdown}">
          <img src="images/solar_linear/widget-5-svgrepo-com.svg" width="18" height="18" aria-hidden="true">
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><label class="dropdown-item"><input type="radio" name="psb-conf" class="form-check-input" data-conf="" checked> ${T.csbParams.confAll}</label></li>
          <li><hr class="dropdown-divider"></li>
          ${Object.entries(T.csbParams.confNames).map(([key, label]) => html`
          <li><label class="dropdown-item"><input type="radio" name="psb-conf" class="form-check-input" data-conf="${key}"> ${label}</label></li>`)}
        </ul>
      </div>
    </div>
    <div class="psb-carousel-host"></div>
    <div class="csb-layout d-inline-flex align-items-stretch gap-1">
      <div class="csb-sort-stack">
        <table class="csb-table csb-sort-table table table-sm table-bordered mb-0"><tbody>
          <tr><td class="csb-header text-muted ps-1" style="vertical-align: middle;"><span class="cbs-header-label">${T.sortLabels.action}</span></td></tr>
          <tr><td class="csb-sort-col text-muted">
            <div class="csb-sort-list d-flex flex-column h-100 position-relative">
              <button class="csb-sort-dir" title="${T.csbTips.sortDir}"></button>
              <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="elo" title="${T.csbTips.sortElo}">${T.sortLabels.elo}</div>
              <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="pop" title="${T.csbTips.sortPop}">${T.sortLabels.pop}</div>
              <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="delta" title="${T.csbTips.sortDelta}">${T.sortLabels.delta}</div>
              <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="alpha" title="${T.csbTips.sortAlpha}">${T.sortLabels.alpha}</div>
            </div>
          </td></tr>
        </tbody></table>
      </div>
      <table class="csb-table csb-filter-table table table-sm table-bordered mb-0"><tbody>
        <tr><td class="csb-header text-muted ps-1" style="vertical-align: middle;"><span class="cbs-header-label">${T.filterLabels.action}</span></td></tr>
        <tr>
          <td class="csb-row" data-row="native" title="${T.psbLabels.nativeTip}">
            <span class="elo-item"><span class="elo-name">${T.psbLabels.native}</span></span>
            <input type="checkbox" class="form-check-input" id="psb-filter-native" checked>
          </td>
        </tr>
        <tr>
          <td class="csb-row" data-row="moved" title="${T.psbLabels.movedTip}">
            <span class="elo-item"><span class="elo-name">${T.psbLabels.moved}</span></span>
            <input type="checkbox" class="form-check-input" id="psb-filter-moved" checked>
          </td>
        </tr>
      </tbody></table>
    </div>
    <div class="csb-footer"><div id="psb-meta" class="elo-meta"><span id="psb-meta-count"></span></div></div>
  </div></div></div></div>`, _sidebarHost);

  const _el = document.getElementById('players-sidebar');
  const _body = _el.querySelector('.csb-body');
  const _panel = _body;
  const _metaCountEl = _panel.querySelector('#psb-meta-count');

  // ── Stage carousel — the real widget (js/stage_carousel.js), same factory <elo-ranking> uses.
  const _carousel = createStageCarousel(T);
  const _vizWrap = document.createElement('div');
  _vizWrap.className = 'elo-viz';
  _vizWrap.appendChild(_carousel.el);
  _panel.querySelector('.psb-carousel-host').appendChild(_vizWrap);

  const _refreshCarouselBounds = () => {
    _maxStage = maxReachableStage(_qualifiedIds, _stageIndexById);
    _carousel.maxStage = _maxStage;
  };

  const _setStage = idx => {
    if (idx === _stage) return;
    _stage = idx;
    _carousel.stage = idx;
    _refreshCarouselBounds();
    callbacks.onChange?.();
    _saveState();
  };
  _carousel.el.addEventListener('stage-change', e => {
    if (e.detail.stage === _stage) return;
    _stage = e.detail.stage;
    _refreshCarouselBounds();
    callbacks.onChange?.();
    _saveState();
  });
  _refreshCarouselBounds();

  // ── Filter checkboxes — the DOM inputs are the state (no shadow JS vars to drift). ──
  const _fltNative = _panel.querySelector('#psb-filter-native');
  const _fltMoved  = _panel.querySelector('#psb-filter-moved');
  const _onFilterChange = () => { callbacks.onChange?.(); _saveState(); };
  _panel.querySelector('[data-row="native"]').addEventListener('click', () => { _fltNative.checked = !_fltNative.checked; _onFilterChange(); });
  _panel.querySelector('[data-row="moved"]' ).addEventListener('click', () => { _fltMoved.checked  = !_fltMoved.checked;  _onFilterChange(); });

  // ── Confederation dropdown — same markup/behavior as control 1's, own id/instance. ──
  const _confDropdown = _panel.querySelector('#players-conf-dropdown');
  const _confRadios = _confDropdown?.querySelectorAll('input[data-conf]');
  const _syncConfRadio = () => { _confRadios?.forEach(r => { r.checked = r.dataset.conf === (_confKey ?? ''); }); };
  _confDropdown?.addEventListener('show.bs.dropdown',   () => { _body.style.overflow = 'visible'; });
  _confDropdown?.addEventListener('hidden.bs.dropdown', () => { _body.style.overflow = ''; });
  _confDropdown?.addEventListener('click', e => {
    const item = e.target.closest('[data-conf]');
    if (!item) return;
    e.stopPropagation();
    const conf = item.dataset.conf;
    setConfFilter(conf ? (confIdsOverride[conf] ?? null) : null, conf || null);
  });

  // ── Sort controls ──
  const _sortListEl = _panel.querySelector('.csb-sort-list');
  const _sortDirBtn = _sortListEl.querySelector('.csb-sort-dir');
  const _teamAlphaEl = _sortListEl.querySelector('[data-sort="alpha"]');

  const _updateAlphaLabel = () => {
    _teamAlphaEl.textContent = _teamOrder[0] === 'alpha' && _dir === 'asc' ? 'Z–A' : 'A–Z';
  };

  const _updateSortList = () => {
    const items = Array.from(_sortListEl.querySelectorAll('.csb-sort-item'));
    const before = new Map(items.map(el => [el, el.getBoundingClientRect().top]));
    _teamOrder.forEach(key => { const el = _sortListEl.querySelector(`[data-sort="${key}"]`); if (el) _sortListEl.appendChild(el); });
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

  // Every elo/pop/delta/alpha item is always clickable (see the sort-list click handler below,
  // which switches into 'team' mode itself rather than requiring it first) — --active marks
  // which one is currently driving the order, replacing the old "disabled unless already in
  // team mode" dimming from when a separate mode-toggle picked team vs. player.
  const _syncSortUI = () => {
    _sortListEl.querySelectorAll('.csb-sort-item').forEach(el => el.classList.toggle('csb-sort-item--active', _mode === 'team' && el.dataset.sort === _teamOrder[0]));
    _sortDirBtn.dataset.dir = _dir;
    _updateAlphaLabel();
  };
  _syncSortUI();

  // Table-column-header entry point (see wc2026_players.html) — same click-to-sort/click-again-
  // to-reverse convention as a plain HTML table. Switching into 'team' mode this way leads with
  // 'alpha' (the literal content of the "plays for" column is a country name), not whatever
  // criterion the sidebar's own reorderable list last had active — that list still lets the user
  // pick elo/pop/delta afterward, this is just this entry point's own sensible default.
  const setSort = mode => {
    if (mode === _mode) {
      _dir = _dir === 'desc' ? 'asc' : 'desc';
    } else {
      _mode = mode;
      if (mode === 'team') _teamOrder = ['alpha', ..._teamOrder.filter(k => k !== 'alpha')];
    }
    _syncSortUI();
    _updateSortList();
    callbacks.onChange?.();
    _saveState();
  };

  _sortListEl.addEventListener('click', e => {
    if (e.target.closest('.csb-sort-dir')) {
      e.stopPropagation();
      _dir = _dir === 'desc' ? 'asc' : 'desc';
      _syncSortUI();
      callbacks.onChange?.();
      _saveState();
      return;
    }
    const item = e.target.closest('.csb-sort-item');
    if (!item) return;
    const key = item.dataset.sort;
    _mode = 'team';
    _teamOrder = [key, ..._teamOrder.filter(k => k !== key)];
    _updateSortList();
    _syncSortUI();
    callbacks.onChange?.();
    _saveState();
  });

  // ── Sort + filter (one pass — see js/control_sidebar.js's sortAndFilter, same naming
  // convention of "sort" meaning "the whole filtered, ordered result"). Native/moved is a
  // player's own fact (born where they play, or not) — not the country-shaped 4-cell matrix
  // control 1 uses, since a lone player only ever has these 2 states.
  const sortPlayers = list => {
    const filtered = list.filter(p => {
      if (p.native ? !_fltNative.checked : !_fltMoved.checked) return false;
      const teamId = QUALIFIED_BY_NAME[p.nation];
      if (_confIds && (teamId == null || !_confIds.has(teamId))) return false;
      const team = teamId != null ? rawById.get(teamId) : null;
      if (team && !reachesStage(team.visibleThroughIndex, _stage)) return false;
      return true;
    });
    const sorted = [...filtered].sort((a, b) => {
      if (_mode === 'player') {
        const d = a.name.localeCompare(b.name);
        return _dir === 'asc' ? -d : d;
      }
      if (_mode === 'birth') {
        const d = (a.birthCountry ?? '').localeCompare(b.birthCountry ?? '') || a.name.localeCompare(b.name);
        return _dir === 'asc' ? -d : d;
      }
      const teamA = rawById.get(QUALIFIED_BY_NAME[a.nation]);
      const teamB = rawById.get(QUALIFIED_BY_NAME[b.nation]);
      for (let i = 0; i < Math.min(_teamOrder.length, 2); i++) {
        let d = (!teamA || !teamB) ? 0 : teamComparators[_teamOrder[i]](teamA, teamB);
        if (i === 0 && _dir === 'asc') d = -d;
        if (d !== 0) return d;
      }
      return a.nation.localeCompare(b.nation);
    });
    // Mirrors js/elo_ranking.js's own initEloRanking renderFn, which sets #elo-meta-count the
    // same way (authoritative count from the actual filtered/sorted result, not a re-derived
    // DOM scan — see feedback_check_for_duplicate_state.md).
    if (_metaCountEl) _metaCountEl.textContent = `${sorted.length}/${list.length} ${T.players(list.length)}`;
    return sorted;
  };

  // ── Persistence (localStorage) ──
  // Suppresses _saveState during _restoreState/applyParams' own _setStage call — same reason
  // as control_sidebar.js's _restoringState: _setStage's 'stage-change' handler would otherwise
  // fire (and persist) before the rest of the restored snapshot has been applied.
  let _restoringState = false;

  const _saveState = () => {
    if (_restoringState) return;
    saveJSON(_STORAGE_KEY, {
      mode: _mode,
      teamOrder: _teamOrder,
      dir: _dir,
      native: _fltNative.checked,
      moved: _fltMoved.checked,
      stage: CAROUSEL_STAGES[_stage],
      conf: _confKey,
    });
  };

  const _restoreState = () => {
    const saved = loadJSON(_STORAGE_KEY);
    if (!saved) return false;
    if (saved.mode === 'team' || saved.mode === 'player' || saved.mode === 'birth') _mode = saved.mode;
    if (Array.isArray(saved.teamOrder) && saved.teamOrder.length === _teamOrder.length && saved.teamOrder.every(k => _TEAM_SORT_KEYS.includes(k))) {
      _teamOrder = [...new Set(saved.teamOrder)];
    }
    if (saved.dir === 'asc' || saved.dir === 'desc') _dir = saved.dir;
    if (typeof saved.native === 'boolean') _fltNative.checked = saved.native;
    if (typeof saved.moved === 'boolean') _fltMoved.checked = saved.moved;
    _syncSortUI();
    _updateSortList();
    if (saved.conf && confIdsOverride[saved.conf]) { _confIds = confIdsOverride[saved.conf]; _confKey = saved.conf; _syncConfRadio(); }

    _restoringState = true;
    if (typeof saved.stage === 'string') {
      const idx = CAROUSEL_STAGES.indexOf(saved.stage);
      if (idx >= 0) _setStage(idx);
    }
    _restoringState = false;

    return true;
  };

  const applyParams = sp => {
    if (!sp) return;
    if (!_PARAM_KEYS.some(k => sp.has(k))) {
      _restoreState();
      callbacks.onChange?.();
      return;
    }

    const psort = sp.get('psort');
    if (psort === 'player' || psort === 'birth') {
      _mode = psort;
    } else if (psort?.startsWith('team:')) {
      const key = psort.slice(5);
      _mode = 'team';
      if (_TEAM_SORT_KEYS.includes(key)) _teamOrder = [key, ..._teamOrder.filter(k => k !== key)];
    }

    const pdir = sp.get('pdir');
    if (pdir === 'asc' || pdir === 'desc') _dir = pdir;

    if (psort || pdir) { _syncSortUI(); _updateSortList(); }

    const pshow = sp.get('pshow');
    if (pshow !== null) {
      const keys = new Set(pshow.split(',').map(s => s.trim()).filter(Boolean));
      _fltNative.checked = keys.has('native');
      _fltMoved.checked = keys.has('moved');
    }

    const pconf = sp.get('pfifaconf');
    if (pconf !== null) setConfFilter(confIdsOverride[pconf] ?? null, pconf || null);

    const pstage = sp.get('pstage');
    if (pstage) {
      const idx = CAROUSEL_STAGES.indexOf(pstage);
      if (idx >= 0) _setStage(idx);
    }

    callbacks.onChange?.();
    _saveState();
  };

  const setConfFilter = (ids, key = null) => {
    _confIds = ids ?? null;
    _confKey = key;
    _syncConfRadio();
    callbacks.onChange?.();
    _saveState();
  };

  return {
    get sortMode() { return _mode; },
    get sortKey()  { return _mode === 'team' ? _teamOrder[0] : _mode === 'birth' ? 'birth' : 'alpha'; },
    get sortDir()  { return _dir; },
    // Native-only view (moved unchecked) — every visible player's birth country and plays-for
    // country are the same string by construction (see wc2026_players.html's own .native
    // tagging), so the host page can collapse its "born in"/"plays for" columns into one.
    get onlyNative() { return _fltNative.checked && !_fltMoved.checked; },
    setSort,
    sortPlayers,
    applyParams,
    setConfFilter,
  };
}
