import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { CONF_IDS } from './conf.js';
import { CAROUSEL_STAGES, QUALIFIED_NAMES, QUALIFIED_BY_NAME, reachesStage, teamComparators } from './qualified.js';
import { createStageCarousel, maxReachableStage } from './stage_carousel.js';
import { loadSlice, saveSlice } from './persist.js';

const _TEAM_SORT_KEYS = ['elo', 'pop', 'delta', 'alpha'];
// 'dir'/'stage'/'fifaconf' are unprefixed — same name, same value domain, same 'shared'
// localStorage slice as control_sidebar.js's own ?dir=/?stage=/?fifaconf=, so a link built on
// one page still means the same thing pasted into the other. 'psort'/'pshow'/'pconfscope' stay
// prefixed because their *shape* is genuinely page-private (mode+criterion vs. a flat criteria
// list; native/moved vs. country-category cells; no countries-page equivalent at all).
const _PARAM_KEYS = ['psort', 'dir', 'stage', 'pshow', 'fifaconf', 'pconfscope'];

// Control 2 (see js/control_sidebar.js's own header comment for the 3-layer split this and
// that module both sit under). Purpose-built for wc2026_players.html — a player is a different
// object than a country, so this owns its own state shape rather than coercing player concepts
// (native/moved, name-vs-team sort) into control 1's country-shaped matrix. Shares the data
// layer with control 1 (teamComparators/CAROUSEL_STAGES/reachesStage from qualified.js,
// createStageCarousel/maxReachableStage from stage_carousel.js, loadSlice/saveSlice from
// persist.js — the two controls even share a chunk of *persisted state*, see persist.js's own
// comment) so the two can't silently drift on logic they both need.
//
// rawById: Map<countryId, buildEloItems() item> — "team standing" lookups (sort-by-team,
// stage reachability) for whichever qualified country a player's own `.nation` resolves to via
// QUALIFIED_BY_NAME. confIds: same shape as js/conf.js's CONF_IDS, overridable for tests.
export function initPlayersSidebar({ T, rawById, callbacks = {}, confIds: confIdsOverride = CONF_IDS }) {
  // 'playsFor' | 'bornIn' (sort by that column's own country's standing — elo/pop/delta/alpha,
  // whichever the sidebar's own reorderable list currently leads with; same criteria, resolved
  // against a different per-player country) | 'player' (sort by player name, the table's "name"
  // column only). Set exclusively via setSort (table header click) or ?psort= — no separate
  // mode-toggle UI in this panel, the table headers themselves are the mode picker. Whichever of
  // the three is active, the *criteria* (which metric, in what priority) are exclusively the
  // sidebar's own reorderable list's business — a table header only ever picks which country
  // (birth vs. plays-for) those same criteria get applied to, or reverses direction.
  let _mode = 'playsFor';
  let _teamOrder = ['elo', 'pop', 'delta', 'alpha'];
  let _dir = 'desc';
  let _stage = 0; // index into CAROUSEL_STAGES
  let _maxStage = CAROUSEL_STAGES.length - 1;
  let _confIds = null;
  let _confKey = null;
  // Which country the confederation filter checks — independent of sort mode (you might sort
  // by name but still want to filter confederation by birth country, or vice versa).
  let _confScope = 'playsFor';

  const _qualifiedIds = Object.keys(QUALIFIED_NAMES).map(Number);
  const _stageIndexById = new Map(_qualifiedIds.map(id => [id, rawById.get(id)?.visibleThroughIndex]));

  const _sidebarHost = document.getElementById('sidebar-host');
  render(html`<div id="players-sidebar" class="csb-panel csb-always-open taxonomy"><div class="csb-body"><div class="csb-inset"><div class="csb-content d-flex flex-column gap-2">
    <div class="csb-toolbar d-flex align-items-center gap-2">
      <div class="dropdown dropend csb-conf-dropdown" id="players-conf-dropdown">
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
      <span id="players-conf-label" class="cbs-header-label csb-conf-label"></span>
      <div class="psb-conf-scope ms-auto" title="${T.psbLabels.confScopeTip}">
        <input type="radio" class="btn-check" name="psb-conf-scope" id="psb-conf-scope-bornIn" autocomplete="off" data-scope="bornIn">
        <label class="btn" for="psb-conf-scope-bornIn">${T.psbLabels.confScopeBirth}</label>
        <input type="radio" class="btn-check" name="psb-conf-scope" id="psb-conf-scope-playsFor" autocomplete="off" data-scope="playsFor" checked>
        <label class="btn" for="psb-conf-scope-playsFor">${T.psbLabels.confScopeTeam}</label>
      </div>
      <button id="psb-share" class="csb-icon-btn csb-share" title="${T.csbParams.share}"><img src="images/solar_linear/share-svgrepo-com.svg" width="18" height="18" aria-hidden="true"></button>
    </div>
    <div class="psb-carousel-host"></div>
    <div class="csb-layout d-inline-flex align-items-stretch gap-1">
      <div class="csb-sort-stack">
        <table class="csb-table csb-sort-table table table-sm table-bordered mb-0"><tbody>
          <tr><td class="csb-header text-muted ps-1" style="vertical-align: middle;" title="${T.psbLabels.sortTeamsTip}"><span class="cbs-header-label">${T.psbLabels.sortTeams}</span></td></tr>
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
            <input type="checkbox" class="btn-check" id="psb-filter-native" autocomplete="off" checked>
            <label class="btn" for="psb-filter-native">${T.psbLabels.native}</label>
          </td>
        </tr>
        <tr>
          <td class="csb-row" data-row="moved" title="${T.psbLabels.movedTip}">
            <input type="checkbox" class="btn-check" id="psb-filter-moved" autocomplete="off" checked>
            <label class="btn" for="psb-filter-moved">${T.psbLabels.moved}</label>
          </td>
        </tr>
      </tbody></table>
    </div>
    <div class="csb-footer"><div id="elo-meta"><span id="elo-meta-count"></span></div></div>
  </div></div></div></div>`, _sidebarHost);

  const _el = document.getElementById('players-sidebar');
  const _body = _el.querySelector('.csb-body');
  const _panel = _body;
  const _metaCountEl = _panel.querySelector('#elo-meta-count');

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

  // ── Filter checkboxes — the DOM inputs are the state (no shadow JS vars to drift). Standard
  // Bootstrap btn-check pattern now (see .psb-conf-scope's own comment) — clicking the label
  // already toggles the input natively, so this listens for 'change' rather than manually
  // flipping .checked on a row click (which would double-toggle against the native behavior). ──
  const _fltNative = _panel.querySelector('#psb-filter-native');
  const _fltMoved  = _panel.querySelector('#psb-filter-moved');
  const _onFilterChange = () => { callbacks.onChange?.(); _saveState(); };
  _fltNative.addEventListener('change', _onFilterChange);
  _fltMoved.addEventListener('change', _onFilterChange);

  // ── Confederation dropdown — same markup/behavior as control 1's, own id/instance. ──
  const _confDropdown = _panel.querySelector('#players-conf-dropdown');
  const _confRadios = _confDropdown?.querySelectorAll('input[data-conf]');
  // Own toolbar has room the dropdown icon doesn't use on its own (unlike control 1's, which
  // is already crowded with collapse/share/params-badge) — shows the active filter at a
  // glance instead of only revealing it by opening the dropdown.
  const _confLabelEl = _panel.querySelector('#players-conf-label');
  // .psb-conf-scope (declared properly below, next to its own change listener) means nothing
  // without a confederation actually selected — disabled (native `disabled`, dims via
  // Bootstrap's own .btn-check:disabled+.btn CSS) rather than removed, so the toolbar's layout
  // stays stable regardless of whether a confederation is currently picked.
  const _confScopeEl = _panel.querySelector('.psb-conf-scope');
  const _syncConfRadio = () => {
    _confRadios?.forEach(r => { r.checked = r.dataset.conf === (_confKey ?? ''); });
    if (_confLabelEl) _confLabelEl.textContent = _confKey ? (T.csbParams.confNames[_confKey] ?? _confKey) : T.csbParams.confAll;
    _confScopeEl?.querySelectorAll('input[data-scope]').forEach(r => { r.disabled = !_confKey; });
  };
  _syncConfRadio();
  _confDropdown?.addEventListener('show.bs.dropdown',   () => { _body.style.overflow = 'visible'; });
  _confDropdown?.addEventListener('hidden.bs.dropdown', () => { _body.style.overflow = ''; });
  _confDropdown?.addEventListener('click', e => {
    const item = e.target.closest('[data-conf]');
    if (!item) return;
    e.stopPropagation();
    const conf = item.dataset.conf;
    setConfFilter(conf ? (confIdsOverride[conf] ?? null) : null, conf || null);
  });

  // Which country the confederation dropdown checks — CONF_IDS covers arbitrary countries, not
  // just the 48 qualified teams, so a birth country resolves the exact same way a plays-for
  // team does (js/conf.js's own id sets, no separate table needed). _confScopeEl itself is
  // declared above, next to _syncConfRadio (which also needs it — see that comment).
  const _syncConfScope = () => {
    _confScopeEl?.querySelectorAll('input[data-scope]').forEach(r => { r.checked = r.dataset.scope === _confScope; });
  };
  _syncConfScope();
  _confScopeEl?.addEventListener('change', e => {
    const radio = e.target.closest('input[name="psb-conf-scope"]');
    if (!radio) return;
    _confScope = radio.dataset.scope;
    callbacks.onChange?.();
    _saveState();
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
  // which switches into 'playsFor' mode itself rather than requiring it first) — --active marks
  // which one is currently driving the order, whenever either country-standing mode is active.
  const _isTeamMode = () => _mode === 'playsFor' || _mode === 'bornIn';
  const _syncSortUI = () => {
    _sortListEl.querySelectorAll('.csb-sort-item').forEach(el => el.classList.toggle('csb-sort-item--active', _isTeamMode() && el.dataset.sort === _teamOrder[0]));
    _sortDirBtn.dataset.dir = _dir;
    _updateAlphaLabel();
  };
  _syncSortUI();

  // Table-column-header entry point (see wc2026_players.html) — 'player' (the name column),
  // 'bornIn' (the "born in" column) or 'playsFor' (the "plays for" column). Never touches
  // _teamOrder itself: which criteria drive a country-standing sort, and in what priority, is
  // exclusively the sidebar's own reorderable list's business (see the sort-list click handler
  // below) — a table header only ever picks which of the three modes is active, or, if it's
  // already active, reverses direction. Same click-to-sort/click-again-to-reverse convention as
  // a plain table.
  const setSort = mode => {
    if (mode === _mode) {
      _dir = _dir === 'desc' ? 'asc' : 'desc';
    } else {
      _mode = mode;
    }
    _syncSortUI();
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
    // Reorders the shared criteria list without forcing a specific mode — stays on 'bornIn' if
    // that's what was active, defaults to 'playsFor' only when coming from 'player' (which has
    // no criteria of its own to speak of).
    if (!_isTeamMode()) _mode = 'playsFor';
    _teamOrder = [key, ..._teamOrder.filter(k => k !== key)];
    _updateSortList();
    _syncSortUI();
    callbacks.onChange?.();
    _saveState();
  });

  // ── Share button (#psb-share) — same idea as control_sidebar.js's own #csb-share (mirrors
  // its param names for the 3 keys that mean the same thing on both pages — dir/stage/fifaconf —
  // see _PARAM_KEYS' own comment above), just without that one's explain-panel description
  // lines: this page has no params-badge/modal to reuse for that, so it builds the query string
  // straight from live state instead of going through a shared _buildStateLines step.
  const _shareBtn = _panel.querySelector('#psb-share');
  let _shareToastEl = null;
  const _showShareToast = msg => {
    if (!_shareToastEl) {
      const container = document.createElement('div');
      container.className = 'toast-container position-fixed end-0 p-3';
      container.style.top = '32px'; // clears the fixed navbar (mundial-auth-bar)
      _shareToastEl = document.createElement('div');
      _shareToastEl.className = 'toast align-items-center';
      _shareToastEl.setAttribute('role', 'status');
      _shareToastEl.setAttribute('aria-live', 'polite');
      _shareToastEl.setAttribute('aria-atomic', 'true');
      container.appendChild(_shareToastEl);
      document.body.appendChild(container);
    }
    render(html`<div class="d-flex">
      <div class="toast-body">${msg}</div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="${T.csbParams.close}"></button>
    </div>`, _shareToastEl);
    bootstrap.Toast.getOrCreateInstance(_shareToastEl, { delay: 2000 }).show();
  };
  _shareBtn?.addEventListener('click', async e => {
    e.stopPropagation();
    const sp = new URLSearchParams();
    sp.set('psort', _mode === 'player' ? 'player' : `${_mode}:${_teamOrder[0]}`);
    sp.set('dir', _dir);
    sp.set('stage', CAROUSEL_STAGES[_stage]);
    const shown = [];
    if (_fltNative.checked) shown.push('native');
    if (_fltMoved.checked) shown.push('moved');
    sp.set('pshow', shown.join(','));
    sp.set('fifaconf', _confKey ?? '');
    sp.set('pconfscope', _confScope);
    const url = `${location.origin}${location.pathname}?${sp.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      _showShareToast(T.csbParams.shareCopied);
    } catch {
      _showShareToast(T.csbParams.shareFailed);
    }
  });

  // ── Sort + filter (one pass — see js/control_sidebar.js's sortAndFilter, same naming
  // convention of "sort" meaning "the whole filtered, ordered result"). Native/moved is a
  // player's own fact (born where they play, or not) — not the country-shaped 4-cell matrix
  // control 1 uses, since a lone player only ever has these 2 states.
  const sortPlayers = list => {
    const filtered = list.filter(p => {
      if (p.native ? !_fltNative.checked : !_fltMoved.checked) return false;
      if (_confIds) {
        const scopeId = _confScope === 'bornIn' ? p.birthCountryId : QUALIFIED_BY_NAME[p.nation];
        if (scopeId == null || !_confIds.has(scopeId)) return false;
      }
      // Stage reachability is always about the plays-for team's own tournament progress,
      // independent of _confScope — a player's birth country isn't "in" the tournament.
      const teamId = QUALIFIED_BY_NAME[p.nation];
      const team = teamId != null ? rawById.get(teamId) : null;
      if (team && !reachesStage(team.visibleThroughIndex, _stage)) return false;
      return true;
    });
    // 'bornIn' and 'playsFor' both apply the sidebar's own leading criterion (_teamOrder[0]) —
    // just to the two dimensions in opposite priority: whichever mode is active goes first, the
    // other dimension is the tie-break, and the player's own name is the final tie-break after
    // that. rawById.get(p.birthCountryId) covers any country in the world (not just a qualified
    // team — most still have an Elo entry too); QUALIFIED_BY_NAME[p.nation] resolves the team.
    const _resolveBornIn   = p => (p.birthCountryId != null ? rawById.get(p.birthCountryId) : null);
    const _resolvePlaysFor = p => rawById.get(QUALIFIED_BY_NAME[p.nation]);
    const _primary   = _mode === 'bornIn' ? _resolveBornIn   : _resolvePlaysFor;
    const _secondary = _mode === 'bornIn' ? _resolvePlaysFor : _resolveBornIn;
    // A birth country can be genuinely absent from the Elo rankings entirely (e.g. the Isle of
    // Man — not a FIFA member) — rawById.get(...) then returns undefined, not just a low rank.
    // Treating "unknown" as a tie against *everyone* (the old `!pA || !pB ? 0 : ...`) breaks
    // Array#sort's consistency contract: two players tied against every OTHER player aren't
    // necessarily tied against each other, so the actual sort position ends up arbitrary
    // (wherever the comparison happened to land during the algorithm's own pivoting) instead of
    // predictable. Unknown-vs-known is a real, orderable fact — unknown always sorts last,
    // regardless of _dir (flipping direction shouldn't make missing data jump to the top).
    const _cmpMaybe = (x, y, cmp) => {
      if (!x && !y) return 0;
      if (!x) return 1;
      if (!y) return -1;
      const d = cmp(x, y);
      return _dir === 'asc' ? -d : d;
    };
    const sorted = [...filtered].sort((a, b) => {
      if (_mode === 'player') {
        const d = a.name.localeCompare(b.name);
        return _dir === 'asc' ? -d : d;
      }
      const key = _teamOrder[0];
      let d = _cmpMaybe(_primary(a), _primary(b), teamComparators[key]);
      if (d !== 0) return d;
      d = _cmpMaybe(_secondary(a), _secondary(b), teamComparators[key]);
      if (d !== 0) return d;
      return a.name.localeCompare(b.name);
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

  // 'shared' (order/dir/stage/conf) round-trips with control_sidebar.js — same meaning, same
  // value domain on both pages (see js/persist.js's own comment), so e.g. picking a
  // confederation here is still selected next time the countries/map page loads, and vice
  // versa. 'players' (mode/native/moved) has no country-page equivalent — stays private here.
  const _saveState = () => {
    if (_restoringState) return;
    saveSlice('shared', {
      order: _teamOrder,
      dir: _dir,
      stage: CAROUSEL_STAGES[_stage],
      conf: _confKey,
    });
    saveSlice('players', {
      mode: _mode,
      native: _fltNative.checked,
      moved: _fltMoved.checked,
      confScope: _confScope,
    });
  };

  const _restoreState = () => {
    const shared = loadSlice('shared');
    const players = loadSlice('players');
    if (!shared && !players) return false;

    if (players?.mode === 'playsFor' || players?.mode === 'bornIn' || players?.mode === 'player') _mode = players.mode;
    if (Array.isArray(shared?.order)) {
      const keys = shared.order.filter(k => _TEAM_SORT_KEYS.includes(k));
      if (keys.length) _teamOrder = [...new Set([...keys, ..._teamOrder])].slice(0, _teamOrder.length);
    }
    if (shared?.dir === 'asc' || shared?.dir === 'desc') _dir = shared.dir;
    if (typeof players?.native === 'boolean') _fltNative.checked = players.native;
    if (typeof players?.moved === 'boolean') _fltMoved.checked = players.moved;
    if (players?.confScope === 'playsFor' || players?.confScope === 'bornIn') { _confScope = players.confScope; _syncConfScope(); }
    _syncSortUI();
    _updateSortList();
    if (shared?.conf && confIdsOverride[shared.conf]) { _confIds = confIdsOverride[shared.conf]; _confKey = shared.conf; _syncConfRadio(); }

    _restoringState = true;
    if (typeof shared?.stage === 'string') {
      const idx = CAROUSEL_STAGES.indexOf(shared.stage);
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
    if (psort === 'player' || psort === 'playsFor' || psort === 'bornIn') {
      _mode = psort;
    } else if (psort?.startsWith('playsFor:') || psort?.startsWith('bornIn:')) {
      // ?psort=playsFor:<key> / bornIn:<key> is the one URL-only exception to "only the sidebar
      // reorders criteria" (mirrors control 1's own ?sort= URL API) — a deep link, not a UI action.
      const [mode, key] = psort.split(':');
      _mode = mode;
      if (_TEAM_SORT_KEYS.includes(key)) _teamOrder = [key, ..._teamOrder.filter(k => k !== key)];
    }

    const dir = sp.get('dir');
    if (dir === 'asc' || dir === 'desc') _dir = dir;

    if (psort || dir) { _syncSortUI(); _updateSortList(); }

    const pshow = sp.get('pshow');
    if (pshow !== null) {
      const keys = new Set(pshow.split(',').map(s => s.trim()).filter(Boolean));
      _fltNative.checked = keys.has('native');
      _fltMoved.checked = keys.has('moved');
    }

    const conf = sp.get('fifaconf');
    if (conf !== null) setConfFilter(confIdsOverride[conf] ?? null, conf || null);

    const pconfscope = sp.get('pconfscope');
    if (pconfscope === 'playsFor' || pconfscope === 'bornIn') { _confScope = pconfscope; _syncConfScope(); }

    const stage = sp.get('stage');
    if (stage) {
      const idx = CAROUSEL_STAGES.indexOf(stage);
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
    get sortKey()  { return (_mode === 'playsFor' || _mode === 'bornIn') ? _teamOrder[0] : 'alpha'; },
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
