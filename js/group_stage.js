import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { fixtureRow } from './elo_ranking.js';
import { loadSlice, saveSlice } from './persist.js';
import { FLAG_CDN } from './map-container.js';

// Persistent Group Stage view for tab-tournament's stage 0 — all 12 groups' standings +
// played-fixture results, always browsable (not gated on a live match). Adapted from
// wc2026_live.html's transient computeLiveStandings/renderStandings/renderGroupResults widget,
// with three deliberate deviations: (1) reads the static, already-tiebreak-correct
// data/fixtures.json `standings`/per-fixture `group` fields directly — no client-side resort,
// no live backend fetch; (2) always renders all 12 groups, no live-match gating; (3) ported to
// lit-html (this project's mandatory templating convention) instead of raw innerHTML string
// concatenation.

const _GROUP_LETTERS = [...'ABCDEFGHIJKL'];
const _FINISHED = new Set(['FT', 'AET', 'PEN']);

export const initGroupStage = ({ container, fixturesData, T, regionName, eloItemsByIso2, onGroupSelect, onCountryClick, onFixtureClick, isFixtureActive, isDimmed, orderPair, ptsFor, fmtPop }) => {
  let _selected = null; // null = "All"; otherwise a group letter

  // Whether a team actually advanced to the Round of 32 — read from the real-world elimination
  // status (statusByIso2 → buildEloItems's eliminatedAtIndex, already computed and shared by
  // every other qualified-team pill in this app), not recomputed here. This sidesteps the
  // "best 8 of 12 third-placed teams" tie-break entirely: rather than re-deriving who made the
  // cut ourselves (a materially bigger, error-prone feature — see this app's own naive-sort
  // warnings elsewhere), we just ask "did this team get eliminated exactly at Group Stage
  // (index 0)?" — eliminatedAtIndex is null while a team is still undecided, so a team whose
  // own group-stage fixtures aren't finished yet would read as "qualified" prematurely; in
  // practice this view is only meaningful once the group stage has actually concluded (the
  // same point at which data/fixtures.json's Round of 32 pairings themselves first exist).
  const _qualifiesForR32 = iso2 => {
    const item = eloItemsByIso2.get(iso2);
    return !!item && (item.eliminatedAtIndex == null || item.eliminatedAtIndex >= 1);
  };

  const _groupResults = letter => (fixturesData?.fixtures ?? [])
    .filter(f => f.group === letter && _FINISHED.has(f.status))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // fixtureRow (js/elo_ranking.js) renders the exact same .elo-pair/.elo-item-wrap/.elo-pair-sep
  // markup a knockout-stage match-display pair already renders with — extracted from this
  // module's own original _resultRow so it can also power js/fixture_list.js's whole-tournament
  // view. Team data comes from eloItemsByIso2 (the same buildEloItems() items the rest of
  // tab-tournament's pills already use), not fixturesData.standings — see fixtureRow's own
  // comment for why. 'grp-' keeps this fixture source's pairIds out of the other two sources'
  // namespaces (control_sidebar.js's knockout pairing, fixture_list.js's 'all-').
  const _resultRow = f => fixtureRow(f, { eloItemsByIso2, regionName, onCountryClick, onFixtureClick, isFixtureActive, isDimmed, orderPair, ptsFor, fmtPop, pairIdPrefix: 'grp-' });

  const _standingsRow = t => {
    const item = eloItemsByIso2.get(t.iso2);
    const clickable = onCountryClick && item?.id != null;
    return html`
    <tr class="${_qualifiesForR32(t.iso2) ? 'grp-qualify' : ''}">
      <td><img class="grp-flag" src="${FLAG_CDN(t.iso2)}" alt=""></td>
      <td class="grp-team${clickable ? ' grp-team--clickable' : ''}" @click=${() => { if (clickable) onCountryClick(item.id); }}>${regionName(t.iso2, t.iso2)}</td>
      <td class="grp-num">${t.played}</td><td class="grp-num">${t.win}</td>
      <td class="grp-num">${t.draw}</td><td class="grp-num">${t.lose}</td>
      <td class="grp-num grp-gfga">${t.goalsFor}</td><td class="grp-num grp-gfga">${t.goalsAgainst}</td>
      <td class="grp-num">${t.goalsDiff > 0 ? '+' + t.goalsDiff : t.goalsDiff}</td>
      <td class="grp-num grp-pts">${t.points}</td>
    </tr>`;
  };

  // Numeric ids (not iso2) — what the map's own flag/country elements are keyed by
  // (data-id — see wc2026_map.js's applyFlagFilter/renderWorld). eloItemsByIso2's items carry
  // buildEloItems's own `id` field, so no separate iso2→id table is needed here.
  const _teamIdsForGroup = letter => (fixturesData?.standings?.[letter] ?? [])
    .map(t => eloItemsByIso2.get(t.iso2)?.id)
    .filter(id => id != null);

  // 'groupStage' — its own localStorage slice (js/persist.js), private to this module.
  const _select = letter => {
    _selected = letter;
    _render();
    saveSlice('groupStage', { selected: letter });
    onGroupSelect?.(letter, letter ? _teamIdsForGroup(letter) : []);
  };

  const _groupCard = letter => {
    // fixturesData.standings[letter] is already correctly rank-ordered (FIFA tiebreak order,
    // computed upstream) — never re-sort it here, see this module's own header comment.
    const teams = fixturesData?.standings?.[letter] ?? [];
    const results = _groupResults(letter);
    return html`
    <div class="card mb-2 grp-card">
      <div class="card-body py-2 px-3">
        <div class="grp-title">${T.liveGroup(letter)}</div>
        <table class="table grp-table mb-0">
          <thead><tr>
            <th></th><th class="grp-team"></th>
            <th class="grp-num">${T.liveP}</th><th class="grp-num">${T.liveW}</th>
            <th class="grp-num">${T.liveD}</th><th class="grp-num">${T.liveL}</th>
            <th class="grp-num grp-gfga">${T.liveGF}</th><th class="grp-num grp-gfga">${T.liveGA}</th>
            <th class="grp-num">${T.liveGD}</th><th class="grp-num grp-pts">${T.livePts}</th>
          </tr></thead>
          <tbody>${teams.map(_standingsRow)}</tbody>
        </table>
        ${results.length > 0 ? html`
          <div class="grp-results-title">${T.liveResults}</div>
          <ul class="elo-list grp-results-list"><div class="elo-pairs">${results.map(_resultRow)}</div></ul>` : nothing}
      </div>
    </div>`;
  };

  const _selector = () => html`
    <div class="grp-selector d-flex flex-wrap justify-content-center gap-1 mb-2">
      <button type="button" class="group-select-btn ${_selected === null ? 'active' : ''}" @click=${() => _select(null)}>${T.filterLabels.all}</button>
      ${_GROUP_LETTERS.map(l => html`<button type="button" class="group-select-btn ${_selected === l ? 'active' : ''}" @click=${() => _select(l)}>${l}</button>`)}
    </div>`;

  const _render = () => {
    const visible = _selected ? [_selected] : _GROUP_LETTERS.filter(l => fixturesData?.standings?.[l]);
    render(html`
      ${_selector()}
      <div class="grp-grid">
        ${visible.map(_groupCard)}
      </div>`, container);
  };

  // Restore the last selected group (or "All") across reloads — routed through _select itself,
  // not a separate restore path, so the render + saveSlice + onGroupSelect (map filter/zoom)
  // side effects can't drift out of sync with what a real click does.
  const _saved = loadSlice('groupStage')?.selected;
  _select(_GROUP_LETTERS.includes(_saved) ? _saved : null);
  // Exposed so wc2026_map.js can re-sync the map's own group-focus filter whenever this view
  // becomes visible/hidden again (switching #bottomTabList tabs) — WITHOUT going through
  // _select/onGroupSelect (which also clears an active dim selection and re-persists): tab
  // navigation isn't the user picking a new group, it's the same selection becoming visible or
  // not, so it should neither reset _selected nor touch dim mode.
  return {
    render: _render,
    get selected() { return _selected; },
    get selectedTeamIds() { return _selected ? _teamIdsForGroup(_selected) : []; },
  };
};
