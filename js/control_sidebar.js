import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { CONF_IDS } from './conf.js';
import { CAROUSEL_STAGES, ELIM_ROUNDS, reachesStage, teamComparators } from './qualified.js';
import { maxReachableStage } from './stage_carousel.js';
import { loadSlice, saveSlice } from './persist.js';
import { animateFlagHidden } from './flag_visibility.js';
import { createParamTable, stageEntry, dirEntry, sortEntry, createConfFilterSetter, promoteKeys } from './param_table.js';
import { wireShareButton } from './share_button.js';

// Everything that actually differs between the three sidebar modes, in one place, instead of
// scattered `_mode === '...'` checks at each call site (catEloChecked, _setDisplayMode, setMode,
// the template, _saveState). 'combined' (default) is every page except the map's split tabs
// (wc2026_countries.html, control-sidebar-test.html) — today's original, full-featured behavior,
// unchanged by any of this. 'teams'/'tournament' are the map's own two tabs (see setMode below).
//
//  showNonQualified — are the FE/FK/NE/NK (non-qualified) categories real, checkbox-driven
//    filters (true), or force-excluded regardless of checkbox state (false)? Purely a filtering-
//    logic concept now — every checkbox in the filter table is always clickable everywhere (the
//    UI-level disabling this used to also drive was removed as more protection than the current,
//    still-in-flux UI complexity warrants; let people click anything, fix what breaks).
//  gateByStage      — does reachesStage() gate the 4 qualified categories (IE/IK/HE/HK) by the
//    carousel's current stage, or ignore the carousel entirely (a flat, always-everyone list)?
//  ignoreTeamFilters — bypass the category checkboxes (IE/IK/HE/HK) and the confederation
//    dropdown entirely for qualified teams, so anything filtered while browsing tab-teams has
//    zero effect on tab-tournament's own set — "the tournament is what it is": only
//    reachesStage() (driven purely by the carousel's stage) decides who's visible there. The
//    two DOM controls stay shared (same checkboxes/dropdown, same _mode-independent state — see
//    setMode's own comment on why nothing is reset on tab switch) so a filter set in tab-teams
//    is still there when the user switches back, it just never leaks into tab-tournament while
//    that tab is active.
//  showCarousel     — is <elo-ranking>'s stage-carousel widget shown at all?
//  showDisplayToggle — is the team/match toggle table shown at all? (Split tabs remove it
//    entirely rather than disabling it — see forcedDisplay below, which already makes the
//    choice for the user; a visible-but-inert toggle would just be a redundant control.)
//  forcedDisplay    — null: the toggle/persisted/URL value governs (subject only to
//    _setDisplayMode's own stage-0 self-guard). A function: called with the current stage,
//    its return value always wins over whatever was requested.
//  persistDisplay   — should _saveState() persist _displayMode at all? Split tabs' value is
//    forced (see forcedDisplay), not a real user choice, so persisting it would just leak a
//    meaningless value into the 'countries' localStorage slice shared with 'combined' pages.
//  defaultStage     — null: this mode never forces a starting stage. A number: the *first* time
//    setMode ever switches into this mode with nothing else having already decided _stage
//    (no restored/URL stage, no prior user click — see _stageEverSet below), _stage jumps here
//    once. Only 'tournament' uses this today (-1, "Whole competition" — its carousel is the only
//    one built with a leading slide, js/elo_ranking.js's all-stages/js/stage_carousel.js's
//    leadingLabel) — a real, later user choice is never overridden by this, only the untouched
//    starting state is.
const MODE_BEHAVIOR = {
  combined:   { showNonQualified: true,  gateByStage: true,  ignoreTeamFilters: false, showCarousel: true,  showDisplayToggle: true,  forcedDisplay: null,                                    persistDisplay: true,  defaultStage: null },
  teams:      { showNonQualified: true,  gateByStage: false, ignoreTeamFilters: false, showCarousel: false, showDisplayToggle: false, forcedDisplay: () => 'team',                            persistDisplay: false, defaultStage: null },
  tournament: { showNonQualified: false, gateByStage: true,  ignoreTeamFilters: true,  showCarousel: true,  showDisplayToggle: false, forcedDisplay: stage => stage <= 0 ? 'team' : 'match',  persistDisplay: false, defaultStage: -1 },
};

export function initSidebar({ T, QUALIFIED_NAMES, app, fifaMemberIds, eloMain, callbacks, alwaysOpen = false, mode = 'combined' }) {
  let _mode = mode;
  let _sortOrder = ['elo', 'alpha', 'pop', 'delta'];
  let _sortDir = 'desc';
  // 'team' (default) — flat list, unchanged. 'match' — teams grouped fixture-by-fixture
  // (one row per couple, non-breakable — see .elo-pair in css/global.css), sorted purely
  // chronologically by kickoff time (see sortAndFilter below) — the active sort criteria
  // don't apply to fixture couples at all, only to any lone/unpaired row. Not itself a sort
  // criterion — a display-mode switch alongside the sort column, gated the same way the old
  // "match" sort-item was: no fixtures to group by at the 'group' stage, so switching to
  // 'match' there is a no-op (forced back to 'team').
  let _displayMode = 'team';
  // Set only when _updateCarouselTitle auto-forces 'match' back to 'team' because the carousel
  // dropped to stage 0 (see below) — remembers that this was NOT the user's own choice, so
  // 'match' comes back on its own once a valid stage is reached again, instead of staying stuck
  // on 'team' until the user re-picks it by hand. A user-driven switch to 'team' at a valid
  // stage never sets this (nothing to restore), and it's consumed (cleared) the moment it fires.
  let _autoSwitchedFromMatch = false;

  const _sidebarHost = document.getElementById('sidebar-host');
  const _sortLabel = html`<span class="cbs-header-label">${T.sortLabels.action}</span>`;
  // Template-time only — setMode (below) re-derives from MODE_BEHAVIOR[_mode] on every
  // later transition; this just seeds the initial render to match the constructor's own mode.
  const _initBehavior = MODE_BEHAVIOR[mode];
  render(html`<div id="control-sidebar" class="csb-panel ${alwaysOpen ? 'csb-always-open' : 'collapsed'} taxonomy">
  ${alwaysOpen ? nothing : html`<button class="csb-toggle" title="${T.csbParams.toggle}">‹</button>`}
  <div class="csb-body"><div class="csb-inset"><div class="csb-content d-flex flex-column gap-1">
    <div class="csb-toolbar d-flex justify-content-between align-items-center gap-2">
      ${alwaysOpen ? nothing : html`<button id="csb-close" class="csb-icon-btn csb-collapse" title="${T.csbParams.collapse}" aria-label="${T.csbParams.collapse}"><kbd class="csb-esc-kbd">ESC</kbd></button>`}
      <div class="dropdown dropend csb-conf-dropdown me-auto" id="zoom-conf-dropdown">
        <button type="button" class="csb-conf-btn dropdown-toggle pe-2" data-bs-toggle="dropdown" data-bs-strategy="fixed" aria-label="${T.csbParams.confDropdown}" title="${T.csbParams.confDropdown}">
          <img src="images/solar_linear/widget-5-svgrepo-com.svg" width="18" height="18" aria-hidden="true">
        </button>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="" checked> ${T.csbParams.confAll}</label></li>
          <li><hr class="dropdown-divider"></li>
          <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="uefa"> ${T.csbParams.confNames.uefa}</label></li>
          <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="afc"> ${T.csbParams.confNames.afc}</label></li>
          <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="caf"> ${T.csbParams.confNames.caf}</label></li>
          <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="conmebol"> ${T.csbParams.confNames.conmebol}</label></li>
          <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="concacaf"> ${T.csbParams.confNames.concacaf}</label></li>
          <li><label class="dropdown-item"><input type="radio" name="csb-conf" class="form-check-input" data-conf="ofc"> ${T.csbParams.confNames.ofc}</label></li>
        </ul>
      </div>
      <span id="zoom-conf-label" class="cbs-header-label csb-conf-label"></span>
      <button id="csb-share" class="csb-icon-btn csb-share ms-auto" title="${T.csbParams.share}"><img src="images/solar_linear/share-svgrepo-com.svg" width="18" height="18" aria-hidden="true"></button>
      <button id="params-badge" class="csb-icon-btn csb-params-badge" title="${T.csbParams.badge}"><img src="images/solar_linear/question-circle-svgrepo-com.svg" width="18" height="18" aria-hidden="true"></button>
    </div>
    <div class="csb-layout d-inline-flex align-items-stretch gap-1">
    <div class="csb-sort-stack d-flex flex-column gap-1">
      <table class="flex-grow-1 csb-table csb-sort-table table table-sm table-bordered mb-0"><tbody>
        <tr>
          <td class="csb-header text-muted ps-1" title="${T.csbTips.action}">
            <div class="d-flex align-items-center justify-content-start gap-1">
              <img class="csb-header-icon" src="images/solar_linear/flag-svgrepo-com.svg" width="14" height="14" alt="" aria-hidden="true">
              ${_sortLabel}
            </div>
          </td>
        </tr>
        <tr>
          <td class="csb-sort-col text-muted">
            <div class="csb-sort-list d-flex flex-column h-100 position-relative">
              <button class="csb-sort-dir" title="${T.csbTips.sortDir}"></button>
              <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="elo" title="${T.csbTips.sortElo}">${T.sortLabels.elo}</div>
              <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="pop" title="${T.csbTips.sortPop}">${T.sortLabels.pop}</div>
              <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="delta" title="${T.csbTips.sortDelta}">${T.sortLabels.delta}</div>
              <div class="csb-sort-item flex-grow-1 d-flex align-items-center justify-content-center text-nowrap" data-sort="alpha" title="${T.csbTips.sortAlpha}">${T.sortLabels.alpha}</div>
            </div>
          </td>
        </tr>
      </tbody></table>
      <table class="csb-table csb-display-table table table-sm table-bordered mb-0" ?hidden=${!_initBehavior.showDisplayToggle}><tbody>
        <tr>
          <td class="csb-header text-muted ps-1" title="${T.csbTips.view}">
            <span class="cbs-header-label">${T.sortLabels.view}</span>
          </td>
        </tr>
        <tr>
          <td class="csb-toggle-col text-muted">
            <div class="csb-display-toggle">
              <span class="csb-display-radios">
                <input type="radio" class="btn-check" name="csb-display" id="csb-display-team" data-display="team" checked>
                <label class="btn" for="csb-display-team" title="${T.sortLabels.teamHint}">${T.sortLabels.teamDisplay}</label>
                <input type="radio" class="btn-check" name="csb-display" id="csb-display-match" data-display="match">
                <label class="btn" for="csb-display-match" title="${T.sortLabels.matchHint}">${T.sortLabels.match}</label>
              </span>
            </div>
          </td>
        </tr>
      </tbody></table>
      <table class="csb-table csb-native-table table table-sm table-bordered mb-0" hidden><tbody>
        <tr>
          <td colspan="2" class="csb-header text-muted ps-1" title="${T.csbTips.playersFilter}">
            <div class="d-flex align-items-center justify-content-start gap-1">
              <img class="csb-header-icon" src="images/solar_linear/user-circle-svgrepo-com.svg" width="14" height="14" alt="" aria-hidden="true">
              <span class="cbs-header-label">${T.sortLabels.view}</span>
            </div>
          </td>
        </tr>
        <tr>
          <td class="csb-toggle-col text-muted p-1">
            <div class="csb-native-toggle d-flex align-items-center justify-content-center">
              <input type="checkbox" class="btn-check" id="csb-pf-native" autocomplete="off" checked>
              <label class="btn csb-pf-native" for="csb-pf-native" title="${T.psbLabels.nativeTip}"></label>
              <input type="checkbox" class="btn-check" id="csb-pf-import" autocomplete="off" checked>
              <label class="btn csb-pf-import" for="csb-pf-import" title="${T.psbLabels.importTip}"></label>
              <input type="checkbox" class="btn-check" id="csb-pf-export" autocomplete="off" checked>
              <label class="btn csb-pf-export" for="csb-pf-export" title="${T.psbLabels.exportTip}"></label>
            </div>
          </td>
          <td class="csb-toggle-col text-muted p-1">
            <div class="csb-native-toggle csb-kind-toggle d-flex align-items-center justify-content-center">
              <input type="checkbox" class="btn-check" id="csb-pf-player" autocomplete="off" checked>
              <label class="btn csb-pf-player" for="csb-pf-player" title="${T.psbLabels.playerTip}"></label>
              <input type="checkbox" class="btn-check" id="csb-pf-coach" autocomplete="off" checked>
              <label class="btn csb-pf-coach" for="csb-pf-coach" title="${T.psbLabels.coachTip}"></label>
            </div>
          </td>
        </tr>
      </tbody></table>
    </div>
    <table class="csb-table csb-filter-table table table-sm table-bordered mb-0"><tbody>
    <tr>
      <td colspan="2" class="csb-header text-muted ps-1" title="${T.csbTips.filterCountries}">
        <div class="d-flex align-items-center justify-content-between">
          <span class="d-flex align-items-center gap-1">
            <img class="csb-header-icon" src="images/solar_linear/flag-svgrepo-com.svg" width="14" height="14" alt="" aria-hidden="true">
            <span class="cbs-header-label">${T.filterLabels.action}</span>
          </span>
          <span class="elo-item" data-col="AB" title="${T.csbTips.filterAll}">${T.filterLabels.all}</span>
        </div>
      </td>
      <td class="csb-col" data-col="AE" title="${T.filterLabels.exporter}"><span class="elo-item elo-item--exp"><span class="elo-name"></span></span></td>
      <td class="csb-col" data-col="AK" title="${T.filterLabels.nonExp}"><span class="elo-item elo-item--nexp"><span class="elo-name"></span></span></td>
    </tr>
    <tr>
      <td rowspan="2" class="csb-group" data-row="QB"><span class="elo-item"><span class="elo-name">${T.filterLabels.qualified}</span></span></td>
      <td class="csb-row" data-row="IB" title="${T.filterLabels.importer}"><span class="elo-item elo-item--imp"><span class="elo-name"></span></span></td>
      <td class="text-muted" title="${T.csbTips.qie}"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-IE" checked></label></td>
      <td class="text-muted" title="${T.csbTips.qi}"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-IK" checked></label></td>
    </tr>
    <tr>
      <td class="csb-row" data-row="HB" title="${T.filterLabels.nonImp}"><span class="elo-item elo-item--nimp"><span class="elo-name"></span></span></td>
      <td class="text-muted" title="${T.csbTips.qe}"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-HE" checked></label></td>
      <td class="text-muted" title="${T.csbTips.q}"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-HK" checked></label></td>
    </tr>
    <!-- Non-qualified categories (FE/FK/NE/NK) are out of scope for tab-tournament (see
         showNonQualified above) but their checkboxes are never disabled — every checkbox in this
         table is always clickable everywhere now; catEloChecked below still force-excludes these
         two rows' effect on tab-tournament regardless of checkbox state. -->
    <tr class="csb-nonqual-row">
      <td rowspan="2" class="csb-group" data-row="UB" title="${T.csbTips.nonQual}"><span class="elo-item"><span class="elo-name">${T.filterLabels.nonQual}</span></span></td>
      <td class="csb-row" data-row="FB" title="${T.csbTips.fifa}"><span class="elo-item"><span class="elo-name">FIFA</span></span></td>
      <td class="text-muted" title="${T.csbTips.ef}"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-FE" checked></label></td>
      <td class="text-muted" title="${T.csbTips.of}"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-FK"></label></td>
    </tr>
    <tr class="csb-nonqual-row">
      <td class="csb-row" data-row="NB" title="${T.csbTips.nonFifa}"><span class="elo-item elo-item--nonfifa"><span class="elo-name">non-FIFA</span></span></td>
      <td class="text-muted" title="${T.csbTips.en}"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-NE" checked></label></td>
      <td class="text-muted" title="${T.csbTips.on}"><label class="csb-check d-block text-center lh-1"><input type="checkbox" class="form-check-input" id="filter-NK"></label></td>
    </tr>
  </tbody></table>
  </div>
    <div class="csb-footer"><div id="elo-meta" class="elo-meta"></div></div>
  </div></div></div>
</div>`, _sidebarHost);

  const _el = document.getElementById('control-sidebar');
  const _toggle = _el.querySelector('.csb-toggle');
  const _body = _el.querySelector('.csb-body');
  const _panel = _body;

  const _fltIE = _panel.querySelector('#filter-IE');
  const _fltIK = _panel.querySelector('#filter-IK');
  const _fltHE = _panel.querySelector('#filter-HE');
  const _fltHK = _panel.querySelector('#filter-HK');
  const _fltFE = _panel.querySelector('#filter-FE');
  const _fltFK = _panel.querySelector('#filter-FK');
  const _fltNE = _panel.querySelector('#filter-NE');
  const _fltNK = _panel.querySelector('#filter-NK');
  const _displayTableEl = _panel.querySelector('.csb-display-table');
  // ── Players-tab export/native/import filter — only ever meaningful while #tab-players is
  // the active bottom tab (see setPlayersTabActive below); the checkboxes themselves are always
  // present, just disabled otherwise (same dimming convention as _matchDisplayRadio.disabled).
  // Starts `hidden` in the template (unlike the checkboxes' own `disabled`) — this control_sidebar
  // module is shared with pages that have no #tab-players concept at all (wc2026_countries.html,
  // control-sidebar-test.html, both 'combined' mode) and never call setPlayersTabActive; a
  // visible-but-permanently-inert row there would just be confusing clutter, same reasoning as
  // the display toggle being fully removed (not just disabled) on the map's own split tabs. ──
  const _pfTableEl = _panel.querySelector('.csb-native-table');
  const _pfExport = _panel.querySelector('#csb-pf-export');
  const _pfNative = _panel.querySelector('#csb-pf-native');
  const _pfImport = _panel.querySelector('#csb-pf-import');
  // Player/coach — a second, orthogonal axis on the same row (which *person type* shows, not
  // which role earned them a place in the union). Kept separate from _pfEls/_roles below rather
  // than folded into the same OR-filter: a coach still carries its own export/native/import role
  // (see _focusedPlayers in wc2026_map.js), so this has to AND against that result, not join it.
  const _pfPlayer = _panel.querySelector('#csb-pf-player');
  const _pfCoach = _panel.querySelector('#csb-pf-coach');
  // ── Stage carousel (Qualified → Round of 32 → … → Winner) ──────────────
  // The carousel's DOM/Bootstrap wiring lives in <elo-ranking> (js/elo_ranking.js) now — it
  // wraps the whole pill list there. This sidebar still owns the stage index itself, its
  // persistence, and the filtering it drives; it just pushes state to eloMain (.maxStage,
  // .stage) and reacts to its 'stage-change' event instead of a local Bootstrap listener.
  let _stage = 0; // index into CAROUSEL_STAGES — 0 ('group') shows every qualified team; -1
                   // ("Whole competition", 'tournament' mode's own leading carousel slide only —
                   // see MODE_BEHAVIOR.tournament.defaultStage below) also shows everyone, same
                   // as 0, via reachesStage()'s own `>= stagePos` comparison.
  // Set once _stage has been decided by something real — a restore (_restoreState, explicitly,
  // since _setStage's own idx===_stage guard would otherwise silently no-op and never flip this
  // when a restored value happens to match _stage's untouched default) or a live carousel click
  // (_setStage itself, since the very first such call is always the mode's own forced
  // defaultStage, which is guaranteed to differ from _stage's untouched default — see setMode).
  // Consulted by setMode: only the untouched, never-decided starting state should ever be
  // overridden by a mode's own defaultStage.
  let _stageEverSet = false;

  const _updateCarouselTitle = () => {
    _refreshCarouselBounds();
    // "match" display only means anything once the carousel has moved off 'group' (stage 0) or
    // "whole competition" (-1) — there's no single fixture to group by until a knockout round is
    // being viewed. Disabled (native `disabled` on the radio — Bootstrap's own
    // .btn-check:disabled+.btn CSS dims the label, and a disabled radio's label click is a no-op
    // natively) rather than removed, so the switch's layout stays stable; forced back to 'team'
    // if the carousel is navigated back down to stage <= 0 while it was active — but remembered
    // (_autoSwitchedFromMatch) and silently restored the next time a valid stage is reached,
    // since that switch was never the user's own choice.
    if (_matchDisplayRadio) _matchDisplayRadio.disabled = _stage <= 0;
    // _setDisplayMode must run on EVERY stage change, unconditionally — MODE_BEHAVIOR[_mode]
    // .forcedDisplay (inside it) overrides whatever candidate is computed below for tab-teams/
    // tab-tournament, so a stage move that isn't one of the two cases the old code recognized
    // (landing exactly on stage <= 0, or leaving it with a remembered match preference) used to
    // skip calling _setDisplayMode entirely — silently stranding tab-tournament in whatever
    // display it already had (bug: Round of 32 showed the flat team list, not fixtures, because
    // going straight from stage 0 to stage 2 hit neither branch below). The candidate itself
    // still only matters for 'combined' mode's own remembered-toggle dance across stage <= 0 (a
    // real user choice there, not forced) — this computes the exact same value as before.
    let candidate = _displayMode;
    if (_stage <= 0) {
      if (_displayMode === 'match') _autoSwitchedFromMatch = true;
      candidate = 'team';
    } else if (_autoSwitchedFromMatch) {
      _autoSwitchedFromMatch = false;
      candidate = 'match';
    }
    _setDisplayMode(candidate);
  };

  // The tournament hasn't reached every stage yet — cap navigation at the furthest stage that
  // currently has at least one team in it (counts are monotonically non-increasing by stage,
  // so the first empty one marks the boundary; everything past it stays locked until it fills).
  // eloMain applies this both visually (disabled/locked classes) and as its own slide guard.
  let _maxStage = CAROUSEL_STAGES.length - 1;
  const _refreshCarouselBounds = () => {
    _maxStage = maxReachableStage(Object.keys(QUALIFIED_NAMES).map(Number), app.stageIndexById);
    eloMain.maxStage = _maxStage;
  };

  // _stage is owned here, unconditionally — _setStage below is the sole authority that
  // mutates it and runs the resulting filter/render cascade, whether or not eloMain is a real,
  // connected <elo-ranking> (a page with no pill-list UI at all, e.g. wc2026_players.html,
  // still needs stage filtering to work — see initSidebar's own doc comment). eloMain.stage=
  // is a fire-and-forget "reflect this visually" command, not a round-trip dependency: a bare
  // stand-in element silently no-ops it. This listener only matters when a user drags/clicks a
  // *real* carousel directly — the guard below skips it when the event is just Bootstrap's own
  // slide.bs.carousel echo of a programmatic _setStage call (already applied by the time it
  // fires), so a real widget never runs the cascade twice for the same change.
  eloMain.addEventListener('stage-change', e => {
    if (e.detail.stage === _stage) return;
    _stage = e.detail.stage;
    _updateCarouselTitle();
    callbacks.renderElo?.();
    applyFlagFilter();
    _saveState();
  });
  const _setStage = idx => {
    if (idx === _stage) return;
    _stage = idx;
    eloMain.stage = idx;
    _updateCarouselTitle();
    callbacks.renderElo?.();
    applyFlagFilter();
    _saveState();
  };

  const flagCat = id => {
    const qual = !!QUALIFIED_NAMES[id];
    const imp  = (app.importByCountry[id]?.length ?? 0) > 0;
    const exp  = (app.byId[id]?.count ?? 0) > 0;
    if  (qual &&  imp &&  exp) return 'IE';
    if  (qual &&  imp && !exp) return 'IK';
    if  (qual && !imp &&  exp) return 'HE';
    if  (qual && !imp && !exp) return 'HK';
    if (!qual &&               exp) return 'e';
    return 'o';
  };

  const _catChecked = cat => ({IE:_fltIE,IK:_fltIK,HE:_fltHE,HK:_fltHK})[cat]?.checked ?? true;

  let _confIds = null; // set by setConfFilter(); null = no confederation filter
  let _confKey = null; // confederation key ('uefa' etc.) matching _confIds, for persistence/explain

  // 'e' (non-qualified exporter) and 'o' (non-qualified, no tournament connection) are both
  // unaffected by the stage carousel — only the qualified categories (IE/IK/HE/HK) below get
  // the reachesStage check, since only they have a tournament position to "reach". A
  // non-qualified exporter's players' destination countries can be filtered by stage on their
  // own (qualified) side already; the exporter itself always shows/hides purely by its own
  // FE/NE checkbox, same as FK/NK — except when MODE_BEHAVIOR[_mode].showNonQualified is false
  // (tab-tournament), which excludes them outright regardless of checkbox state, and
  // .gateByStage being false (tab-teams) skips the reachesStage check entirely — a flat team
  // list has no fixture/elimination concept at all.
  const catEloChecked = (id, fifaMember) => {
    const behavior = MODE_BEHAVIOR[_mode];
    const cat = flagCat(id);
    if (behavior.ignoreTeamFilters) {
      // tab-tournament: fully orthogonal to whatever tab-teams' checkboxes/confederation
      // dropdown currently say. Non-qualified categories ('e'/'o') are out of scope for this
      // mode regardless (mirrors showNonQualified: false below); qualified categories' sole
      // gate is the carousel's own stage.
      if (cat === 'e' || cat === 'o') return false;
      return reachesStage(app.stageIndexById?.get(id), _stage);
    }
    if (_confIds && fifaMember && !_confIds.has(id)) return false;
    if (cat === 'e' || cat === 'o') {
      if (!behavior.showNonQualified) return false;
      return cat === 'e' ? (fifaMember ? _fltFE.checked : _fltNE.checked) : (fifaMember ? _fltFK.checked : _fltNK.checked);
    }
    if (behavior.gateByStage && !reachesStage(app.stageIndexById?.get(id), _stage)) return false;
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
      animateFlagHidden(d3.selectAll('.flag-qualified[data-elo-cat]'), el =>
        !catEloChecked(+el.getAttribute('data-id'), fifaMemberIds.has(+el.getAttribute('data-id')))
      );
      d3.selectAll('.flag-qualified[data-elo-cat]')
        .attr('cursor', function() {
          return isClickable(+this.getAttribute('data-id')) ? 'pointer' : 'default';
        });
      d3.selectAll('.country[data-id]').style('cursor', function() {
        return isClickable(+this.getAttribute('data-id')) ? 'pointer' : 'default';
      });
    }
    updateVisibleCountryCount();
    // Lets a caller layer an additional visibility rule on top of this one — e.g.
    // wc2026_map.js's group-stage "focus on these 4 flags only" override — without this module
    // needing to know that concern exists. Fires every time this function runs, from whatever
    // triggered it (checkbox, sort, stage change, ...), so the override can never go stale.
    callbacks.afterFlagFilter?.();
  };

  const _filterToggle = chks => {
    const on = chks.every(c => c.checked);
    chks.forEach(c => c.checked = !on);
    callbacks.renderElo?.();
    applyFlagFilter();
    _saveState();
  };

  // Deterministic counterpart to _filterToggle, used by the `v`/`x` keyboard leaders below —
  // toggle is fine for a mouse click (the checkbox states are right there on screen), but from
  // the keyboard the same chord would show or hide depending on state you can't see without
  // looking away from the keys. Setting an explicit target state makes every chord idempotent:
  // typing it twice in a row is a no-op the second time, never a flip-back.
  const _filterSet = (chks, checked) => {
    chks.forEach(c => c.checked = checked);
    callbacks.renderElo?.();
    applyFlagFilter();
    _saveState();
  };

  _panel.querySelector('[data-row="QB"]'  ).addEventListener('click', () => _filterToggle([_fltIE, _fltIK, _fltHE, _fltHK]));
  _panel.querySelector('[data-row="IB"]'  ).addEventListener('click', () => _filterToggle([_fltIE, _fltIK]));
  _panel.querySelector('[data-row="HB"]'  ).addEventListener('click', () => _filterToggle([_fltHE, _fltHK]));
  _panel.querySelector('[data-row="UB"]'  ).addEventListener('click', () => _filterToggle([_fltFE, _fltFK, _fltNE, _fltNK]));
  _panel.querySelector('[data-row="FB"]'  ).addEventListener('click', () => _filterToggle([_fltFE, _fltFK]));
  const _confDropdown = _panel.querySelector('#zoom-conf-dropdown');
  const _confRadios = _confDropdown?.querySelectorAll('input[data-conf]');
  // Fills the toolbar's own slack space (between the dropdown and .ms-auto's share/params-badge
  // pair) with the active filter's name, instead of only revealing it by opening the dropdown.
  const _confLabelEl = _panel.querySelector('#zoom-conf-label');
  const _syncConfRadio = () => {
    _confRadios?.forEach(r => { r.checked = r.dataset.conf === (_confKey ?? ''); });
    if (_confLabelEl) _confLabelEl.textContent = _confKey ? (T.csbParams.confNames[_confKey] ?? _confKey) : T.csbParams.confAll;
  };
  _syncConfRadio();
  _confDropdown?.addEventListener('show.bs.dropdown',   () => { _body.style.overflow = 'visible'; });
  _confDropdown?.addEventListener('hidden.bs.dropdown', () => { _body.style.overflow = ''; });
  _confDropdown?.addEventListener('click', e => {
    const item = e.target.closest('[data-conf]');
    if (!item) return;
    e.stopPropagation();
    const conf = item.dataset.conf;
    setConfFilter(conf ? (CONF_IDS[conf] ?? null) : null, conf || null);
  });
  // The label itself carries no data-bs-toggle of its own (only .csb-conf-btn does) — forward
  // its click to the real toggle button so the whole "current confederation" text is clickable,
  // not just the small icon next to it. Mirrors players_sidebar.js's own #players-conf-label
  // (.csb-conf-label is a shared class/style between the two sidebars — see control-sidebar.css)
  // — see that file's own comment for why stopPropagation is required: the nested btn.click()
  // opens the dropdown and re-arms Bootstrap's document-level "click outside" listener as part
  // of that; without stopping it here, the *original* click event then keeps bubbling past the
  // label to document, where that listener sees a target outside .csb-conf-dropdown and
  // immediately closes what was just opened (open+closed within the one click, a visible no-op).
  const _confToggleBtn = _confDropdown?.querySelector('.csb-conf-btn');
  _confLabelEl?.addEventListener('click', e => { e.stopPropagation(); _confToggleBtn?.click(); });
  _panel.querySelector('[data-row="NB"]'  ).addEventListener('click', () => _filterToggle([_fltNE, _fltNK]));
  _panel.querySelector('[data-col="AE"]'  ).addEventListener('click', () => _filterToggle([_fltIE, _fltHE, _fltFE, _fltNE]));
  _panel.querySelector('[data-col="AK"]'  ).addEventListener('click', () => _filterToggle([_fltIK, _fltHK, _fltFK, _fltNK]));
  _panel.querySelector('[data-col="AB"]'  ).addEventListener('click', () => _filterToggle([_fltIE, _fltIK, _fltHE, _fltHK, _fltFE, _fltFK, _fltNE, _fltNK]));
  _panel.addEventListener('change', () => { callbacks.renderElo?.(); applyFlagFilter(); _saveState(); });

  _panel.querySelector('.csb-collapse')?.addEventListener('click', e => {
    e.stopPropagation();
    _el.classList.add('collapsed');
    _toggle.textContent = '‹';
    callbacks.onSidebarToggle?.();
    _saveState();
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
  //
  // The tab-teams/tab-tournament invariant is enforced HERE, in the primitive setter, rather
  // than at each call site — this module has several (restored localStorage state, a URL
  // param, the toggle's own change listener, _updateCarouselTitle) and any one of them calling
  // this directly with a raw 'match'/'team' used to be able to desync the display from the
  // active tab (e.g. a 'match' value persisted from a prior tab-tournament visit leaking into
  // tab-teams on the next page load, since only _updateCarouselTitle used to guard against it).
  // Overriding the requested mode here instead means no caller needs to know the invariant
  // exists at all.
  const _setDisplayMode = mode => {
    const forced = MODE_BEHAVIOR[_mode].forcedDisplay;
    if (forced) mode = forced(_stage);
    else if (mode === 'match' && _stage <= 0) mode = 'team';
    if (mode === _displayMode) return;
    _displayMode = mode;
    _teamDisplayRadio.checked = mode === 'team';
    _matchDisplayRadio.checked = mode === 'match';
    eloMain.displayMode = mode;
  };

  // Reconfigures this same shared sidebar + eloMain for one of the map's two split tabs
  // (tab-teams / tab-tournament — see wc2026_map.js's _switchTab). Never called on pages using
  // the default 'combined' mode, which stays exactly as it always has been.
  const setMode = newMode => {
    if (newMode === _mode) return;
    _mode = newMode;
    const behavior = MODE_BEHAVIOR[_mode];
    // Every filter-table checkbox is always clickable, everywhere — no UI-level disabling based
    // on mode (removed; more protection than the current, still-in-flux UI complexity warrants).
    // showNonQualified still governs the actual filtering logic below (catEloChecked), just not
    // whether the checkbox itself can be clicked.
    // The team/match toggle IS fully removed (not just disabled) on both split tabs — unlike
    // the filter rows above, it has nothing left to communicate once the tab-panel swap already
    // forces the one display that makes sense (see _setDisplayMode's forcedDisplay); keeping it
    // visible-but-inert would just be a redundant, silent control. Only 'combined' pages (which
    // never call setMode) still show and use it.
    _displayTableEl.hidden = !behavior.showDisplayToggle;
    eloMain.showCarousel = behavior.showCarousel;
    // First-ever entry into a mode with its own defaultStage (today: only 'tournament', -1 —
    // see MODE_BEHAVIOR's own comment), with nothing else having already decided _stage (no
    // restore, no prior user click — _stageEverSet, set by _restoreState/_setStage). A later
    // re-entry into this same mode never re-applies it, so a real user choice always sticks.
    // This can fire BEFORE _restoreState ever runs — wc2026_map.js restores the last-active
    // #bottomTabList tab synchronously, at module top level, while sidebar.applyParams (→
    // _restoreState) only runs later, once the async data Promise.all resolves — so a returning
    // visitor whose last tab was tab-tournament hits this branch first. _restoringState (below)
    // is reused here purely to suppress _setStage's own _saveState() call for the duration: this
    // is a placeholder default, not a real choice, and without the guard it would persist
    // "group" over whatever real stage was actually saved — corrupting it before _restoreState
    // gets a chance to read the original value back. _restoreState's own later, real _setStage
    // call is NOT itself guarded by _stageEverSet, so it always still wins once it runs.
    if (behavior.defaultStage != null && !_stageEverSet) {
      _stageEverSet = true;
      _restoringState = true;
      _setStage(behavior.defaultStage);
      _restoringState = false;
    }
    _updateCarouselTitle();
    callbacks.renderElo?.();
    applyFlagFilter();
    // showDisplayToggle/showCarousel above change the sidebar's own natural content height —
    // --csb-h (read by .csb-toggle's min-height and .csb-body's height, see
    // measureControlSidebar's own comment) is otherwise only ever refreshed on init and on
    // window resize, so without this it goes stale the moment a mode switch shows/hides either
    // row, leaving .csb-toggle taller or shorter than the sidebar's actual current content.
    // rAF-deferred since renderElo/applyFlagFilter's own DOM writes need a frame to land before
    // measuring.
    requestAnimationFrame(measureControlSidebar);
  };

  // True while #tab-players is the active bottom tab — set by setPlayersTabActive below (called
  // unconditionally on every tab switch, see its own comment). Governs what .csb-sort-dir's
  // click actually controls, and what its own glyph reflects — see both below.
  let _playersTabActive = false;
  // The glyph and the alpha item's own "A–Z"/"Z–A" label are two independent renderings of the
  // exact same "which direction is currently in effect" fact — merged into one function (rather
  // than two calls every call site has to remember to keep paired) after they drifted apart in
  // practice: a player-table column-header click updated the glyph (via syncSortDirIcon below)
  // but not this label, since that path only ever called the icon half.
  const _updateSortDirUI = () => {
    const dir = _playersTabActive ? (callbacks.getPlayersSortDir?.() ?? 'asc') : _sortDir;
    _sortDirBtn.dataset.dir = dir;
    // Same "dir" value, opposite meaning depending on context: the country list's own comparators
    // (teamComparators) are naturally ascending for alpha, and _sortDir === 'asc' *flips* that to
    // Z–A (see sortAndFilter's `if (i === 0 && _sortDir === 'asc') d = -d`). The player table's
    // _ptSortDir is the other way around — 'asc' is itself the unflipped/natural A–Z state (see
    // _playersTableTemplate's `dir = _ptSortDir === 'desc' ? -1 : 1`) — so "reversed from A–Z"
    // flips on the opposite value of dir in that context.
    const reversed = _playersTabActive ? dir === 'desc' : dir === 'asc';
    _alphaEl.textContent = _sortOrder[0] === 'alpha' && reversed ? 'Z–A' : 'A–Z';
  };
  const _updateSortCol = () => {
    const items = Array.from(_sortListEl.querySelectorAll('.csb-sort-item'));
    const before = new Map(items.map(el => [el, el.getBoundingClientRect().top]));
    _sortOrder.forEach(key => { const el = _sortListEl.querySelector(`[data-sort="${key}"]`); if (el) _sortListEl.appendChild(el); });
    _updateSortDirUI();
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
      // While #tab-players is showing, this button controls that table's own per-column
      // direction (whichever of name/bornIn/playsFor/caps is its currently active column) —
      // not the country-list's own _sortDir, which has no visible effect there. See
      // setPlayersTabActive below for _playersTabActive and _updateSortDirUI for how the
      // glyph/label are kept in sync either way.
      if (_playersTabActive) {
        callbacks.togglePlayersSortDir?.();
        _updateSortDirUI();
        return;
      }
      _sortDir = _sortDir === 'desc' ? 'asc' : 'desc';
      _updateSortDirUI();
      callbacks.renderElo?.(callbacks.scrollToActiveElo);
      _saveState();
      return;
    }
    const item = e.target.closest('.csb-sort-item');
    if (item) {
      const key = item.dataset.sort;
      _sortOrder = promoteKeys(_sortOrder, [key]);
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

  // ── Players-tab export/native/import filter ──────────────────────────────────────────────
  // Only ever enabled while #tab-players is the active bottom tab (wc2026_map.js's own
  // show.bs.tab listener calls this unconditionally on every tab switch, independent of
  // setMode above — tab-players never touches _mode at all). A disabled btn-check dims its
  // label via Bootstrap's own .btn-check:disabled+.btn CSS, same mechanism
  // _matchDisplayRadio.disabled already uses for the stage-0 case.
  const _pfEls = { export: _pfExport, native: _pfNative, import: _pfImport };
  const _pkEls = { player: _pfPlayer, coach: _pfCoach };
  const setPlayersTabActive = active => {
    // Merely being called at all (with either true or false) is the signal that the host page
    // actually has a #tab-players concept — see _pfTableEl's own declaration comment above for
    // why the row starts hidden in the template. Queried fresh off the table (rather than
    // iterating _pfEls/_pkEls) so any future button added to this row is disabled for free.
    _pfTableEl.hidden = false;
    _pfTableEl.querySelectorAll('.btn-check').forEach(el => { el.disabled = !active; });
    _playersTabActive = active;
    _updateSortDirUI();
  };
  const playersFilterChecked = role => !!_pfEls[role]?.checked;
  const playerKindChecked = kind => !!_pkEls[kind]?.checked;

  // Re-renders #tab-players' actual content (unlike the category checkboxes above, which only
  // apply cross-tab and don't live-refresh the table while it's already open — see
  // wc2026_map.js's _visiblePlayerEntries comment): these 3 checkboxes are only ever
  // interactive while that table is already on screen, so toggling one should be felt
  // immediately, not wait for the next tab switch.
  _panel.querySelector('.csb-native-table').addEventListener('change', e => {
    if (!e.target.closest('.btn-check')) return;
    callbacks.onPlayersFilterChange?.();
    _saveState();
  });

  if (!alwaysOpen) {
  _toggle.addEventListener('click', () => {
    const collapsed = _el.classList.toggle('collapsed');
    _toggle.textContent = collapsed ? '‹' : '›';
    callbacks.onSidebarToggle?.();
    _saveState();
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const collapsed = _el.classList.toggle('collapsed');
    _toggle.textContent = collapsed ? '‹' : '›';
    callbacks.onSidebarToggle?.();
    _saveState();
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
      if (expanding) { _el.classList.remove('collapsed'); callbacks.onSidebarToggle?.(); }
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
    callbacks.onSidebarToggle?.();
    _saveState();
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
    // .csb-inset (not .csb-content) is what actually determines the panel's rendered
    // extent — measuring .csb-content's own offsetHeight ignored any border/padding
    // added on the wrapper between it and .csb-body, undersizing --csb-h. getBoundingClientRect
    // already includes border+padding (it's always the border box); margin is added by
    // hand since neither getBoundingClientRect nor offsetHeight account for it.
    const _inset = _panel.querySelector('.csb-inset');
    const _insetCs = getComputedStyle(_inset);
    const _insetH = _inset.getBoundingClientRect().height
      + parseFloat(_insetCs.marginTop) + parseFloat(_insetCs.marginBottom);
    document.documentElement.style.setProperty('--csb-w', _body.offsetWidth + 'px');
    document.documentElement.style.setProperty('--csb-h', _insetH + 'px');
    _body.style.maxWidth = '';
    _body.style.width = '';
    if (wasCollapsed) _el.classList.add('collapsed');
  };
  measureControlSidebar();

  // Fixture pairing for match-display mode — only meaningful once the carousel is off
  // 'group' (stage 0), since there's no single fixture per team at the group stage.
  // Data comes from app.matchInfoByIso2 (qualified.js's buildMatchInfo), layering two sources:
  // status.json's lostTo (authoritative winner/loser, including penalty shootouts) for decided
  // fixtures, and data/fixtures.json (mundial-build) for real pairing — home/away, date,
  // `won: null` — on fixtures that haven't been played yet. A team can still end up with no
  // pairing at all (e.g. a bracket slot too far out to be scheduled yet) — see _buildGroups.
  const _matchInfo = item => _stage > 0 ? app.matchInfoByIso2?.[item.iso2]?.[_stage] : undefined;

  // Shared with players_sidebar.js's "sort by team" mode — see qualified.js's own comment.
  const _sortFns = teamComparators;

  const _ptsFor = (key, item, fmtPop) =>
      key === 'delta' ? (item.impCount && item.expCount ? `${item.impCount} · ${item.expCount}` : item.impCount || item.expCount || null)
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

  // Orders a single fixture's own two teams by the sort table's current leading criterion —
  // stronger-by-_aggregateValue (or alphabetically-first) member returned first when _sortDir is
  // 'desc' (the app's own default), flipped when 'asc' — same rule sortAndFilter's own
  // match-display branch below uses for a real knockout pair, extracted here so
  // js/group_stage.js's and js/fixture_list.js's own fixture rows (rendered outside sortAndFilter
  // entirely — see js/elo_ranking.js's fixtureRow) can match it exactly rather than inventing a
  // second copy. Exposed on the returned sidebar object as `orderPair`.
  const _orderPair = (a, b) => {
    const primary = _sortOrder[0];
    const [x, y] = primary === 'alpha'
      ? [a, b].sort((p, q) => p.name.localeCompare(q.name))
      : [a, b].sort((p, q) => _aggregateValue(primary, q) - _aggregateValue(primary, p));
    return _sortDir === 'asc' ? [y, x] : [x, y];
  };

  const sortAndFilter = (allItems, fmtPop) => {
    const filtered = allItems.filter(item => catEloChecked(item.id, item.fifaMember));
    const primary   = _sortOrder[0];
    const secondary = _sortOrder[1];

    let ordered;
    if (_displayMode === 'match') {
      const groups = _buildGroups(filtered);
      groups.sort((ga, gb) => {
        // Fixture couples always come first, ahead of any lone (unpaired) team, regardless of
        // the active sort criteria or direction — a real fixture is more actionable information
        // than "no opponent to show". Among fixtures, always ascending kickoff date/time (not
        // affected by _sortDir either); lone rows fall back to the usual sort criteria below.
        const gaFixture = ga.length === 2, gbFixture = gb.length === 2;
        if (gaFixture !== gbFixture) return gaFixture ? -1 : 1;
        if (gaFixture) {
          const da = _matchInfo(ga[0])?.date, db = _matchInfo(gb[0])?.date;
          const ta = da ? new Date(da).getTime() : Infinity, tb = db ? new Date(db).getTime() : Infinity;
          return ta - tb;
        }
        // Only the first 2 of _sortOrder's 4 entries ever drive the actual comparison —
        // positions 3/4 exist purely so the reorderable sort-list UI has a full permutation
        // to display/persist; a restore can land on a different 3rd/4th than what was saved
        // without changing anything observable, so there's nothing to reconcile there.
        for (let i = 0; i < Math.min(_sortOrder.length, 2); i++) {
          let d = _groupCompare(_sortOrder[i], ga, gb);
          if (i === 0 && _sortDir === 'asc') d = -d;
          if (d !== 0) return d;
        }
        return 0;
      });
      // Within a couple: _orderPair (above) decides which member leads — stronger-by-primary-
      // criterion (or alphabetically-first) team first when _sortDir is 'desc', flipped when
      // 'asc', so the toggle the user already has for the flat list also reorders every fixture
      // pair. _pairId ties both rows together for elo_ranking.js's row
      // grouping (see EloRanking.show()) — absent (undefined) for lone rows. _pairScore is the
      // "a – b" goal tally (from a's own matchInfo, so it already reads in [a, b] display
      // order), null for a fixture that hasn't been played yet — elo_ranking.js falls back to
      // a plain separator in that case. _pairDate is the fixture's kickoff datetime (also from
      // matchInfo), rendered as a compact "day|hour" label alongside the score/separator. _lost
      // is each side's own matchInfo.won === false (a decided fixture this team lost) — read
      // per-side since a/b's matchInfo entries are each other's mirror, not shared — so
      // elo_ranking.js can grey out the losing side's flag.
      ordered = groups.flatMap(g => {
        if (g.length === 1) return g;
        const [a, b] = _orderPair(g[0], g[1]);
        const pairId = [a.id, b.id].sort().join('-');
        const infoA = _matchInfo(a);
        const infoB = _matchInfo(b);
        const pairScore = infoA?.myGoals != null
          ? { home: infoA.myGoals, away: infoA.oppGoals, penalties: infoA.penalties, penaltyHome: infoA.myPenGoals, penaltyAway: infoA.oppPenGoals }
          : null;
        const pairDate = infoA?.date ?? null;
        // True only for the Semi-finals losers' own pair (see qualified.js's playsThirdPlace) —
        // distinguishes their row from the real Final pair, which lands on the same carousel
        // slide. elo_ranking.js resolves the actual label text (it already imports T).
        const pairThirdPlace = !!(a.playsThirdPlace && b.playsThirdPlace);
        return [
          { ...a, _pairId: pairId, _pairScore: pairScore, _pairDate: pairDate, _lost: infoA?.won === false, _pairThirdPlace: pairThirdPlace },
          { ...b, _pairId: pairId, _pairScore: pairScore, _pairDate: pairDate, _lost: infoB?.won === false, _pairThirdPlace: pairThirdPlace },
        ];
      });
    } else {
      ordered = [...filtered].sort((a, b) => {
        // Same 2-key cap as the match-display branch above.
        for (let i = 0; i < Math.min(_sortOrder.length, 2); i++) {
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
  // Cell/alias vocabulary — every code is exactly 2 letters: position 1 selects the row
  // scope (I=qualified importers, H=qualified homegrown/no imports, Q=all qualified,
  // F=FIFA non-qualified, N=non-FIFA, U=all unqualified, A=absolutely everything), position
  // 2 selects the column (E=exporters, K=keeps its players/non-exporters, B=both columns).
  // Fixed length means no code is ever a prefix of another — _ACTIONS_SHOW/_ACTIONS_HIDE below
  // rely on that property so the `v`/`x`-leader keyboard chord (see its own comment) always
  // commits after exactly 2 more keystrokes, no ambiguity, no wait.
  const _ALIASES    = {
    QB:  ['IE','IK','HE','HK'],
    UB:  ['FE','NE','FK','NK'],
    AE:  ['IE','HE','FE','NE'],
    AK:  ['IK','HK','FK','NK'],
    IB:  ['IE','IK'],
    HB:  ['HE','HK'],
    FB:  ['FE','FK'],
    NB:  ['NE','NK'],
    AB:  ['IE','IK','HE','HK','FE','NE','FK','NK'],
  };
  const _CELL_MAP   = { IE:_fltIE, IK:_fltIK, HE:_fltHE, HK:_fltHK, FE:_fltFE, NE:_fltNE, FK:_fltFK, NK:_fltNK };
  // Collapses a raw cell-key list back down to _ALIASES names for succinct display —
  // e.g. ['IE','IK','HE','HK'] -> 'QB' instead of 'IE,IK,HE,HK'. Used by _buildStateLines
  // below for the explain panel / share link. Largest alias first so 'AB' wins outright
  // over reconstructing it from 'AE'+'AK'; leftover cells with no matching alias are
  // appended as-is. Round-trips fine either way — _ALIASES expansion happens on read for
  // both the raw and the aliased form.
  const _describeCells = cells => {
    const remaining = new Set(cells);
    const parts = [];
    for (const [alias, expansion] of Object.entries(_ALIASES).sort((a, b) => b[1].length - a[1].length)) {
      if (expansion.every(c => remaining.has(c))) {
        parts.push(alias);
        expansion.forEach(c => remaining.delete(c));
      }
    }
    parts.push(...remaining);
    return parts.join(',');
  };

  // ── `v`/`x`-leader keyboard shortcut — v or x, then any 2-letter code from
  // _CELL_MAP/_ALIASES ── v shows (checks) the named cells, x hides (unchecks) them; cells
  // outside the 2-letter code's own scope are never touched. Two leaders with a fixed target
  // state, rather than one leader that toggles (`f`, an earlier version of this shortcut), since
  // a keyboard chord can't see the checkbox states it's about to flip — the same `f IE` could
  // show or hide IE depending on what was already checked, unlike a mouse click on the visible
  // checkbox. v/x borrow the copy-paste mnemonic (paste-in / cut-out) rather than spelling out
  // "show"/"hide", and neither letter collides with the row/column vocabulary itself
  // (I/H/Q/F/N/U/A/E/K/B) the way an `s` or `h` leader would have.
  // No modifier: Ctrl/Cmd+<letter> risks a mistyped Cmd-Q on macOS, which quits the whole
  // browser at the OS level before any page JS ever sees the keystroke — unrecoverable and
  // unrelated to this feature, but a real risk for any modifier-based leader. A bare leader
  // (same pattern as GitHub's `g` `i`, `g` `p` navigation) sidesteps that class of mistake
  // entirely. Guarded to only fire when focus isn't in a text field, same guard any such
  // global shortcut needs. _ACTIONS_SHOW/_ACTIONS_HIDE are derived from _CELL_MAP/_ALIASES
  // rather than hand-listed, so the shortcut layer can never drift from the filter vocabulary
  // those two already define.
  const _ACTIONS_SHOW = {};
  const _ACTIONS_HIDE = {};
  Object.entries(_CELL_MAP).forEach(([code, el]) => {
    _ACTIONS_SHOW[code] = () => _filterSet([el], true);
    _ACTIONS_HIDE[code] = () => _filterSet([el], false);
  });
  Object.entries(_ALIASES).forEach(([code, cells]) => {
    const els = cells.map(c => _CELL_MAP[c]);
    _ACTIONS_SHOW[code] = () => _filterSet(els, true);
    _ACTIONS_HIDE[code] = () => _filterSet(els, false);
  });

  // PX/PN/PI (Players tab: eXport/Native/Import) — added directly to _ACTIONS_SHOW/_ACTIONS_HIDE
  // rather than to _CELL_MAP/_ALIASES above: those two also back the ?show= URL param and the
  // explain panel's country-category description, and these 3 checkboxes are a wholly separate
  // concept (see ?pshow= below) that must never leak into that vocabulary. Disabled-aware (unlike
  // _filterSet) since — unlike every other chord target — these are only ever meaningful while
  // #tab-players is active; a chord typed while it isn't should no-op, same as a real click on a
  // disabled button would.
  const _filterSetPlayers = (el, checked) => {
    if (el.disabled) return;
    el.checked = checked;
    callbacks.onPlayersFilterChange?.();
    _saveState();
  };
  _ACTIONS_SHOW.PX = () => _filterSetPlayers(_pfExport, true);
  _ACTIONS_HIDE.PX = () => _filterSetPlayers(_pfExport, false);
  _ACTIONS_SHOW.PN = () => _filterSetPlayers(_pfNative, true);
  _ACTIONS_HIDE.PN = () => _filterSetPlayers(_pfNative, false);
  _ACTIONS_SHOW.PI = () => _filterSetPlayers(_pfImport, true);
  _ACTIONS_HIDE.PI = () => _filterSetPlayers(_pfImport, false);
  // PP/PC (Players tab: Player/Coach) — same disabled-aware helper, same reasoning.
  _ACTIONS_SHOW.PP = () => _filterSetPlayers(_pfPlayer, true);
  _ACTIONS_HIDE.PP = () => _filterSetPlayers(_pfPlayer, false);
  _ACTIONS_SHOW.PC = () => _filterSetPlayers(_pfCoach, true);
  _ACTIONS_HIDE.PC = () => _filterSetPlayers(_pfCoach, false);

  const _isEditableTarget = el => !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  let _chordArmed = false;
  let _chordShow = false; // which leader armed the chord — true: v (show), false: x (hide)
  let _chordBuf = '';
  let _chordTimer = null;
  const _resetChord = () => { _chordArmed = false; _chordBuf = ''; clearTimeout(_chordTimer); };
  const _armChordTimer = () => { clearTimeout(_chordTimer); _chordTimer = setTimeout(_resetChord, 1500); };
  document.addEventListener('keydown', e => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (_isEditableTarget(document.activeElement)) return;
    if (!_chordArmed) {
      const leader = e.key.toLowerCase();
      if (leader !== 'v' && leader !== 'x') return;
      _chordArmed = true;
      _chordShow = leader === 'v';
      _chordBuf = '';
      _armChordTimer();
      return;
    }
    if (e.key === 'Escape') { _resetChord(); return; }
    if (!/^[a-zA-Z]$/.test(e.key)) { _resetChord(); return; }
    _chordBuf += e.key.toUpperCase();
    if (_chordBuf.length < 2) { _armChordTimer(); return; }
    const action = (_chordShow ? _ACTIONS_SHOW : _ACTIONS_HIDE)[_chordBuf];
    _resetChord();
    action?.();
  });

  // ── Explain panel (badge · panel · console) ─────────────────────────────

  // Fuller descriptive names for the explain panel — T.csbParams.{sortNames,confNames} —
  // distinct from T.sortLabels/T.stageLabels' terse column/pill labels.
  // Stage names reuse T.stageLabels directly (same wording the carousel pill itself shows).
  const _badge = _el.querySelector('#params-badge');
  let _panelEl = null;

  // Reuses the infobar's own count (elo_ranking.js's initEloRanking sets #elo-meta-count's
  // text from sortAndFilter(...).length, the actual authoritative computation) rather than
  // re-deriving it here — a prior version re-scanned .elo-item for style.display, which
  // doesn't match how filtered-out items actually get hidden and under/over-counted.
  const _countVisible = () => {
    const n = parseInt(document.getElementById('elo-meta-count')?.textContent ?? '', 10);
    return Number.isNaN(n) ? 0 : n;
  };

  // ── Param table — single source for both directions of the URL <-> state bridge (see
  // js/param_table.js's own header comment). Each entry's get() is also what _buildStateLines
  // below reads its raw values from, so "what Share puts in the URL" and "what the explain
  // panel/console describe" can't drift apart from each other or from applyParams' own reading.
  const _paramTable = createParamTable([
    // Country rows only have one identity to sort by — the degenerate, no-axes case of
    // sortEntry (see its own header comment). players_sidebar.js's psort is the N-axes case.
    sortEntry('sort', {
      validKeys: _SORT_KEYS,
      getOrder: () => _sortOrder,
      setOrder: v => { _sortOrder = v; },
      onApply: _updateSortCol,
    }),
    dirEntry('dir', { getDir: () => _sortDir, setDir: v => { _sortDir = v; _updateSortCol(); } }),
    // -1 ("Whole competition", 'tournament' mode's own leading carousel slide — see
    // MODE_BEHAVIOR.tournament.defaultStage) is deliberately never represented in the URL/share
    // link: CAROUSEL_STAGES[-1] doesn't exist (js/param_table.js's stageEntry would serialize
    // "undefined"), and a real sentinel would leak into players_sidebar.js's own 'shared'-slice-
    // reading carousel, which never gets a leading slide and could crash forwarding it to
    // Bootstrap's own .to(-1). Aliased to 0 here instead — sharing a link while on this slide
    // just shares "Group stage", one carousel click away either direction.
    stageEntry('stage', {
      getStageIndex: () => _stage === -1 ? 0 : _stage,
      // _stageEverSet marked explicitly (not left to _setStage's own idx===_stage guard) for the
      // same reason _restoreState does — see its own comment.
      setStage: idx => { _stageEverSet = true; _setStage(idx); },
    }),
    {
      key: 'show',
      get: () => _describeCells(Object.entries(_CELL_MAP).filter(([, el]) => el?.checked).map(([k]) => k)),
      apply: raw => {
        const cells = new Set();
        // Case-insensitive: browser address-bar autocomplete can silently swap in a
        // previously-visited lowercase URL even when the user typed the correct casing.
        raw.split(',').forEach(t => {
          const k = t.trim().toUpperCase();
          (_ALIASES[k] ?? [k]).forEach(c => cells.add(c));
        });
        const valid = [...cells].filter(c => _CELL_MAP[c]);
        if (!valid.length) return false;
        Object.entries(_CELL_MAP).forEach(([k, el]) => { if (el) el.checked = cells.has(k); });
        return true;
      },
    },
    {
      // Routed through setConfFilter (declared below) rather than inlined here — same setter
      // the confederation dropdown itself calls, so there's exactly one place that mutates
      // _confIds/_confKey, not two copies drifting apart.
      key: 'fifaconf',
      get: () => _confKey ?? '',
      apply: raw => {
        if (raw === '') { setConfFilter(null, null); return true; }
        if (!CONF_IDS[raw]) return false;
        setConfFilter(CONF_IDS[raw], raw);
        return true;
      },
    },
    // Same key name/shape as players_sidebar.js's own 'pshow' (native,moved) — genuinely
    // page-private (this page's 3-way export/native/import split has no equivalent on that
    // page), never mixed into the 'show' entry above, which is a different concept (country
    // category visibility, not player-role visibility).
    {
      key: 'pshow',
      get: () => [...Object.keys(_pfEls), ...Object.keys(_pkEls)].filter(k => (_pfEls[k] ?? _pkEls[k]).checked).join(','),
      apply: raw => {
        const keys = new Set(raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean));
        _pfExport.checked = keys.has('export');
        _pfNative.checked = keys.has('native');
        _pfImport.checked = keys.has('import');
        _pfPlayer.checked = keys.has('player');
        _pfCoach.checked = keys.has('coach');
        return true; // '' is valid too (everything hidden)
      },
    },
  ]);

  // The explain panel describes the live control-sidebar state only — it doesn't care
  // whether a given setting arrived via a URL param, a restored localStorage snapshot, or
  // a plain click. One line per key, always sourced from the same live state (via _paramTable's
  // own get()) the rest of this module reads/writes — so it can never drift from what's actually
  // on screen. The Share button reuses the same table to build its URL, so the two can never
  // drift from each other either.
  const _buildStateLines = () => {
    const P = T.csbParams;
    return [
      _stage > 0
        ? { param: `stage=${_paramTable.get('stage')}`, desc: P.stageDesc(T.stageLabels[_stage]) }
        // -1 ("Whole competition") gets its own label here even though _paramTable.get('stage')
        // itself aliases to 0/'group' (see the stageEntry construction above) — this line is
        // describing the live sidebar state, not the URL param's own necessarily-lossy encoding.
        : { param: `stage=${_paramTable.get('stage')}`, desc: P.stageDefault(_stage === -1 ? T.allStagesLabel : T.stageLabels[0]) },
      { param: `sort=${_paramTable.get('sort')}`, desc: P.sortDesc(_sortOrder.slice(0, 2).map(k => P.sortNames[k]).join(' → ')) },
      { param: `dir=${_paramTable.get('dir')}`, desc: _sortDir === 'asc' ? P.dirAsc : P.dirDesc },
      (() => {
        const cells = Object.entries(_CELL_MAP).filter(([, el]) => el?.checked).map(([k]) => k);
        return cells.length
          ? { param: `show=${_paramTable.get('show')}`, desc: P.cellsDesc(cells.join(' · ')) }
          : { param: 'show=', desc: P.cellsNone };
      })(),
      _confKey
        ? { param: `fifaconf=${_paramTable.get('fifaconf')}`, desc: P.confDesc(P.confNames[_confKey] ?? _confKey) }
        : { param: 'fifaconf=', desc: P.confDefault },
    ];
  };

  // Classic Bootstrap modal (bootstrap.bundle.js is already loaded on every page that
  // uses this sidebar) — backdrop, Escape-to-close, and focus handling all come for
  // free from bootstrap.Modal instead of bespoke CSS/JS; .csb-params-badge's 'active'
  // state just mirrors the modal's own shown/hidden events, however it gets closed.
  let _panelShown = false;
  const _closeExplainPanel = () => bootstrap.Modal.getInstance(_panelEl)?.hide();
  const _openExplainPanel  = (lines, visible) => {
    if (!_panelEl) {
      _panelEl = document.createElement('div');
      _panelEl.id = 'params-panel';
      _panelEl.className = 'modal fade';
      _panelEl.tabIndex = -1;
      document.body.appendChild(_panelEl);
      _panelEl.addEventListener('shown.bs.modal',  () => { _panelShown = true;  _badge?.classList.add('active'); });
      _panelEl.addEventListener('hidden.bs.modal', () => { _panelShown = false; _badge?.classList.remove('active'); });
    }
    render(html`
      <div class="modal-dialog modal-dialog-scrollable modal-sm">
        <div class="modal-content">
          <div class="modal-header py-2">
            <h6 class="modal-title mb-0">${T.csbParams.modalTitle}</h6>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="${T.csbParams.close}"></button>
          </div>
          <div class="modal-body small">
            <ul class="list-unstyled mb-2">
              ${lines.map(l => html`<li class="mb-1"><code class="bg-body-secondary rounded px-1">${l.param}</code> — ${l.desc}</li>`)}
            </ul>
            <p class="text-muted border-top pt-2 mb-0">${T.csbParams.visible(visible)}</p>
          </div>
        </div>
      </div>`, _panelEl);
    bootstrap.Modal.getOrCreateInstance(_panelEl).show();
  };

  _badge?.addEventListener('click', e => {
    e.stopPropagation();
    if (_panelShown) { _closeExplainPanel(); return; }
    // Always recomputed fresh from live state — a cached snapshot from page-load would go
    // stale the moment the user touches anything (checkboxes, sort clicks, carousel...).
    _openExplainPanel(_buildStateLines(), _countVisible());
  });

  // ── Persistence (localStorage) ──────────────────────────────────────────

  // Set only while _restoreState is applying a saved stage — _setStage below fires
  // 'slide.bs.carousel' synchronously, and that handler calls _saveState() itself (the normal
  // path for a user-driven carousel click). During restore that fires BEFORE _restoreState has
  // gone on to set _displayMode from the saved snapshot, so it would otherwise re-persist the
  // stale pre-restore display value and quietly undo what's about to be restored. Nothing needs
  // saving mid-restore anyway — everything being applied already came from localStorage.
  let _restoringState = false;

  // 'shared' (order/dir/stage/conf) round-trips with players_sidebar.js — same meaning, same
  // value domain on both pages (see js/persist.js's own comment), so e.g. picking a
  // confederation here is still selected next time the players page loads, and vice versa.
  // 'countries' (checks/display) has no players-page equivalent — stays private to this page.
  const _saveState = () => {
    if (_restoringState) return;
    saveSlice('shared', {
      order: _sortOrder,
      dir: _sortDir,
      // -1 ("Whole competition") has no CAROUSEL_STAGES entry of its own — saved as the literal
      // string 'all' instead (not a real CAROUSEL_STAGES member, so it can never collide with
      // one). This slice round-trips with players_sidebar.js, whose own carousel never gets a
      // leading slide — but its own restore (same idx = CAROUSEL_STAGES.indexOf(shared.stage);
      // if (idx >= 0) ... pattern as _restoreState below) already silently ignores any string it
      // doesn't recognize, so 'all' just leaves that page's own stage untouched rather than
      // crashing or forwarding -1 into its carousel. Deliberately NOT the same aliasing
      // stageEntry (the Share button/?stage= URL, above) uses — a URL is a different sharing
      // surface, still intentionally simplified to 'group' (see that comment).
      stage: _stage === -1 ? 'all' : CAROUSEL_STAGES[_stage],
      conf: _confKey,
    });
    saveSlice('countries', {
      checks: Object.fromEntries(Object.entries(_CELL_MAP).map(([k, el]) => [k, !!el?.checked])),
      // Only a real user choice in 'combined' mode — tab-teams/tab-tournament force this value
      // themselves (see _setDisplayMode), so persisting it here would leak a forced, meaningless
      // value into the slice this page shares with 'combined'-mode pages (wc2026_countries.html
      // etc.) via the same localStorage key. Omitting the field (rather than writing it and
      // relying on _setDisplayMode's restore-time override to catch it every time) also self-
      // heals any stale value saved before this comment existed — saveSlice replaces the whole
      // 'countries' object wholesale, so the very next save from a split tab clears it out.
      ...(MODE_BEHAVIOR[_mode].persistDisplay ? { display: _displayMode } : {}),
      // Always false on alwaysOpen pages (no .csb-toggle/collapse there to ever add the
      // class) — harmless to save regardless, just never restored for them (see _restoreState).
      collapsed: _el.classList.contains('collapsed'),
      playersFilter: { export: _pfExport.checked, native: _pfNative.checked, import: _pfImport.checked, player: _pfPlayer.checked, coach: _pfCoach.checked },
    });
  };

  const _restoreState = () => {
    const shared = loadSlice('shared');
    const countries = loadSlice('countries');
    if (!shared && !countries) return false;

    if (Array.isArray(shared?.order)) {
      const keys = shared.order.filter(k => _SORT_KEYS.has(k));
      if (keys.length) { _sortOrder = promoteKeys(_sortOrder, keys); _updateSortCol(); }
    }
    if (shared?.dir === 'asc' || shared?.dir === 'desc') {
      _sortDir = shared.dir;
      _updateSortDirUI();
    }
    if (countries?.checks) {
      Object.entries(_CELL_MAP).forEach(([k, el]) => { if (el && k in countries.checks) el.checked = !!countries.checks[k]; });
    }
    if (countries?.playersFilter) {
      const pf = countries.playersFilter;
      if (typeof pf.export === 'boolean') _pfExport.checked = pf.export;
      if (typeof pf.native === 'boolean') _pfNative.checked = pf.native;
      if (typeof pf.import === 'boolean') _pfImport.checked = pf.import;
      if (typeof pf.player === 'boolean') _pfPlayer.checked = pf.player;
      if (typeof pf.coach === 'boolean') _pfCoach.checked = pf.coach;
    }
    if (shared?.conf && CONF_IDS[shared.conf]) {
      _confKey = shared.conf;
      _confIds = CONF_IDS[shared.conf];
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
    if (shared?.stage === 'all') {
      // -1 ("Whole competition") — see _saveState's own comment on why this is a distinct
      // literal string rather than a CAROUSEL_STAGES member.
      _stageEverSet = true;
      _setStage(-1);
    } else if (typeof shared?.stage === 'string') {
      const idx = CAROUSEL_STAGES.indexOf(shared.stage);
      // Set explicitly here rather than left to _setStage's own idx===_stage guard: a restored
      // stage of 'group' (index 0) collides with _stage's own untouched top-level default (also
      // 0), which would otherwise no-op and silently leave _stageEverSet false — later making
      // setMode('tournament') wrongly re-force its own defaultStage over this real (if
      // coincidentally default-valued) restored preference. See _stageEverSet's own comment.
      if (idx >= 0) { _stageEverSet = true; _setStage(idx); }
    }
    _restoringState = false;

    if (countries?.display === 'team' || countries?.display === 'match') _setDisplayMode(countries.display);

    // alwaysOpen pages never render .csb-toggle/.collapsed at all (see the template above),
    // so there's nothing to restore there — collapsed is only ever meaningful (and only ever
    // saved as true) on the map's own collapsible/swipe-drawer sidebar.
    if (!alwaysOpen && typeof countries?.collapsed === 'boolean' && countries.collapsed !== _el.classList.contains('collapsed')) {
      _el.classList.toggle('collapsed', countries.collapsed);
      if (_toggle) _toggle.textContent = countries.collapsed ? '‹' : '›';
      callbacks.onSidebarToggle?.();
    }

    callbacks.renderElo?.();
    applyFlagFilter();

    if (_confKey) {
      document.dispatchEvent(new CustomEvent('mundial-conf-changed', { detail: { conf: _confKey, ids: _confIds } }));
    }
    return true;
  };

  // ── Share button (#csb-share) — builds a URL that reproduces this exact sidebar
  // configuration on another app instance, straight from _paramTable (see its own comment).
  wireShareButton(_el.querySelector('#csb-share'), {
    T,
    buildUrl: () => `${location.origin}${location.pathname}?${_paramTable.buildQuery().toString()}`,
  });

  const applyParams = (sp) => {
    if (!sp) return;

    if (!_paramTable.hasAny(sp)) {
      // No control-sidebar params in the URL — restore the persisted state instead.
      const restored = _restoreState();
      if (sp.has('explain')) {
        const lines = _buildStateLines();
        if (restored) lines.unshift({ param: '(restored)', desc: 'settings restored from your last visit' });
        if (!alwaysOpen && _el.classList.contains('collapsed')) {
          _el.classList.remove('collapsed');
          if (_toggle) _toggle.textContent = '›';
          callbacks.onSidebarToggle?.();
        }
        _openExplainPanel(lines, _countVisible());
      }
      return;
    }

    _paramTable.applyFrom(sp);

    callbacks.renderElo?.();
    applyFlagFilter();

    const lines = _buildStateLines();
    const _visible = _countVisible();
    console.info('[params]\n' + lines.map(l => `  ${l.param} → ${l.desc}`).join('\n') + `\n  ${T.csbParams.visible(_visible)}`);
    if (!alwaysOpen && _el.classList.contains('collapsed')) {
      _el.classList.remove('collapsed');
      if (_toggle) _toggle.textContent = '›';
      callbacks.onSidebarToggle?.();
    }
    if (sp.has('explain')) _openExplainPanel(lines, _visible);

    _saveState();
  };

  // mundial-conf-changed: only wc2026_map.js listens today (highlights the confederation's
  // boundary and zooms to fit) — harmless no-op on countries/players pages.
  const setConfFilter = createConfFilterSetter({
    setState: (ids, key) => { _confIds = ids; _confKey = key; },
    syncRadio: _syncConfRadio,
    notify: () => { callbacks.renderElo?.(); applyFlagFilter(); },
    saveState: _saveState,
  });

  return {
    get sortOrder() { return _sortOrder; },
    get sortDir() { return _sortDir; },
    // Per-country comparators (elo/exp/imp/delta/pop/alpha), keyed the same as _sortOrder —
    // exposed so other item kinds sharing the same country-level fields (rank/pop/expCount/
    // impCount) can sort by "their country's standing" using identical semantics, instead of
    // a second copy of this logic drifting out of sync over time. Each already reads in the
    // app's own default/desc direction — callers still need to flip on sortDir === 'asc'
    // themselves, same as sortAndFilter below does.
    sortFns: _sortFns,
    // Orders any fixture's own two teams by the sort table's current leading criterion — see
    // _orderPair's own comment. js/group_stage.js and js/fixture_list.js both read this (via
    // wc2026_map.js) so their own fixture rows stay consistent with the knockout match-display
    // pairs' ordering above, live (re-derived on every render, not cached), so a sort-column
    // change reorders every fixture's two teams everywhere at once.
    orderPair: _orderPair,
    // The pill figure a fixture row's own pillContent shows — same rule sortAndFilter applies to
    // every pill below (null only for 'alpha', which has nothing numeric to show; otherwise
    // whichever value the active sort criterion is actually ranking by), exposed so a user can
    // see *why* orderPair put one side first. fmtPop is passed in per-call (page-level formatter,
    // not something this module owns) rather than closed over, same as sortAndFilter's own param.
    ptsFor: (item, fmtPop) => _sortOrder[0] === 'alpha' ? null : _ptsFor(_sortOrder[0], item, fmtPop),
    catEloChecked,
    flagCat,
    isClickable,
    applyFlagFilter,
    measureControlSidebar,
    updateVisibleCountryCount,
    sortAndFilter,
    applyParams,
    setConfFilter,
    setMode,
    setPlayersTabActive,
    playersFilterChecked,
    playerKindChecked,
    // Called by wc2026_map.js's own _ptSetSort after a direct player-table column-header click
    // (which flips _ptSortDir without going through .csb-sort-dir) — keeps that shared button's
    // glyph and the alpha item's own "A–Z"/"Z–A" label honest either way, since
    // callbacks.getPlayersSortDir now backs both while this tab is active (see _updateSortDirUI).
    syncSortDirIcon: _updateSortDirUI,
    updateStageTitle: _updateCarouselTitle,
  };
}
