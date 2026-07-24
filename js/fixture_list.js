import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { fixtureRow } from './elo_ranking.js';

// "Whole competition" view for tab-tournament's carousel (stage -1, its new leading slide ahead
// of Group Stage — see js/stage_carousel.js's leadingLabel/js/control_sidebar.js's MODE_BEHAVIOR.
// tournament.defaultStage) — every fixture in the tournament, Group Stage included, sorted
// chronologically, one flat list. Mirrors js/group_stage.js's own shape (an init function taking
// a container + the same eloItemsByIso2/onCountryClick/onFixtureClick/isFixtureActive wiring),
// but with no group selector, no standings table, no per-group split — just fixtureRow (js/
// elo_ranking.js, extracted from group_stage.js's own former _resultRow) applied to every fixture
// at once, since that's the whole ask ("a simple list of all fixtures, sorted in chronological
// order").
export const initFixtureList = ({ container, fixturesData, eloItemsByIso2, regionName, onCountryClick, onFixtureClick, isFixtureActive, isDimmed, orderPair, ptsFor, fmtPop }) => {
  // Sorted once per render rather than cached — fixturesData is static for the lifetime of the
  // page (no live-refetch path here, unlike wc2026_live.html), but re-sorting on every call keeps
  // this consistent with group_stage.js's own _groupResults (also resorted on every card render)
  // rather than assuming an ordering invariant that isn't actually enforced anywhere upstream.
  const _sortedFixtures = () => [...(fixturesData?.fixtures ?? [])].sort((a, b) => new Date(a.date) - new Date(b.date));

  const _render = () => {
    const fixtures = _sortedFixtures();
    render(html`
      <ul class="elo-list">
        <div class="elo-pairs">
          ${fixtures.map(f => fixtureRow(f, { eloItemsByIso2, regionName, onCountryClick, onFixtureClick, isFixtureActive, isDimmed, orderPair, ptsFor, fmtPop, pairIdPrefix: 'all-' }))}
        </div>
      </ul>`, container);
  };

  _render();
  return { render: _render };
};
