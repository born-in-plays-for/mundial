import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { pillClasses, pillContent, pillStyle, fixtureDateLabel } from './elo_ranking.js';
import { loadSlice, saveSlice } from './persist.js';

// Persistent Group Stage view for tab-tournament's stage 0 — all 12 groups' standings +
// played-fixture results, always browsable (not gated on a live match). Adapted from
// wc2026_live.html's transient computeLiveStandings/renderStandings/renderGroupResults widget,
// with three deliberate deviations: (1) reads the static, already-tiebreak-correct
// data/fixtures.json `standings`/per-fixture `group` fields directly — no client-side resort,
// no live backend fetch; (2) always renders all 12 groups, no live-match gating; (3) ported to
// lit-html (this project's mandatory templating convention) instead of raw innerHTML string
// concatenation.

const _CDN = c => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${c}.svg`;
const _GROUP_LETTERS = [...'ABCDEFGHIJKL'];
const _FINISHED = new Set(['FT', 'AET', 'PEN']);

export const initGroupStage = ({ container, fixturesData, T, regionName, eloItemsByIso2, onGroupSelect, onCountryClick, onFixtureClick, isFixtureActive }) => {
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

  // Reuses the EXACT pill markup (pillClasses/pillContent/pillStyle, imported from
  // js/elo_ranking.js) and .elo-pair/.elo-pairs/.elo-item-wrap/.elo-pair-sep CSS classes
  // (css/global.css, css/taxonomy.css) that a decided knockout fixture row already renders
  // with — so a finished group match looks pixel-identical to a Round of 32 pair, not a
  // bespoke lookalike. Team data comes from eloItemsByIso2 (the same buildEloItems() items the
  // rest of tab-tournament's pills already use), not fixturesData.standings, since that's what
  // carries the elo pts/qualified/exp/imp/color fields pillContent/pillClasses/pillStyle need.
  //
  // Draws (only possible in the group stage, never in a knockout) get neither side marked
  // .elo-item--lost — the shared checkmark CSS has no "nobody lost" state of its own, so an
  // undecided-by-elo-item-classing pair would show a check on BOTH sides by default; the
  // .elo-pair--draw class (css/group_stage.css) explicitly suppresses the checkmark for this
  // one case without touching the score/date, which still render normally (this is a real,
  // finished, decided-scoreline match — just not a decided-scoreline match).
  // Same onCountryClick this whole app's other pills use (passed in from wc2026_map.js —
  // literally the function object assigned to <elo-ranking>'s own .onCountryClick) — clicking
  // a pill here has to have the exact same effect (selection, dim/arc mode, map zoom, toggle-
  // off-if-already-active, ...) as clicking one in tab-tournament's own pill list, and calling
  // the identical function reference is what guarantees that, rather than re-implementing any
  // part of it here.
  const _pillClick = item => () => { if (item.id != null) onCountryClick?.(item.id); };

  // Mirrors js/elo_ranking.js's own #buildRows fixture-pair handling: the separator (score box),
  // not either team pill, is the fixture's own click target (the pills already resolve clicks to
  // their own single team via _pillClick above). 'grp-' prefix on the pairId keeps this fixture
  // source's ids out of the knockout-stage pairId namespace (control_sidebar.js's _buildGroups) —
  // never actually collides in practice (f.id is API-Football's own numeric fixture id, that
  // _pairId is a different, synthesized value) but there's no reason to rely on that.
  const _resultRow = f => {
    const home = eloItemsByIso2.get(f.home) ?? { iso2: f.home, name: regionName(f.home, f.home) };
    const away = eloItemsByIso2.get(f.away) ?? { iso2: f.away, name: regionName(f.away, f.away) };
    const draw = f.winner == null;
    const homeLost = f.winner === 'away';
    const awayLost = f.winner === 'home';
    const dateLabel = fixtureDateLabel(f.date);
    const clickableCls = item => (onCountryClick && item.id != null) ? ' elo-item--clickable' : '';
    const pairId = `grp-${f.id}`;
    const fixtureClickable = onFixtureClick && home.id != null && away.id != null;
    const onSepClick = () => { if (fixtureClickable) onFixtureClick(home.id, away.id, pairId); };
    // Mirrors elo_ranking.js's own .elo-pair--active — this component has no access to that one's
    // internal #activeFixtureId, so the active state is passed in as a live predicate (a function,
    // not a snapshot value) rather than duplicating that state here; see isFixtureActive's own
    // wiring in wc2026_map.js for how it stays in sync as selections change.
    const active = isFixtureActive?.(pairId);
    return html`
      <li class="elo-pair${draw ? ' elo-pair--draw' : ''}${active ? ' elo-pair--active' : ''}">
        <span class="elo-item-wrap"><span class="${pillClasses(home)}${homeLost ? ' elo-item--lost' : ''}${clickableCls(home)}" style="${pillStyle(home)}" @click=${_pillClick(home)}>${pillContent(home)}</span></span>
        <span class="elo-pair-sep elo-pair-sep--score${fixtureClickable ? ' elo-pair-sep--clickable' : ''}" @click=${onSepClick}>
          ${dateLabel ? html`<span class="elo-pair-sep-date">${dateLabel}</span>` : nothing}
          <span class="elo-pair-sep-score">${f.goals.home}–${f.goals.away}</span>
        </span>
        <span class="elo-item-wrap"><span class="${pillClasses(away)}${awayLost ? ' elo-item--lost' : ''}${clickableCls(away)}" style="${pillStyle(away)}" @click=${_pillClick(away)}>${pillContent(away)}</span></span>
      </li>`;
  };

  const _standingsRow = t => {
    const item = eloItemsByIso2.get(t.iso2);
    const clickable = onCountryClick && item?.id != null;
    return html`
    <tr class="${_qualifiesForR32(t.iso2) ? 'grp-qualify' : ''}">
      <td><img class="grp-flag" src="${_CDN(t.iso2)}" alt=""></td>
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

  // 'groupStage' — its own localStorage slice (js/persist.js), private to this module: the
  // selected-group choice has no equivalent on any other page, unlike control_sidebar.js's
  // 'shared'/'countries' slices which round-trip with players_sidebar.js.
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
