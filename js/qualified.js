export const QUALIFIED_NAMES = {
  12:'Algeria', 32:'Argentina', 36:'Australia', 40:'Austria',
  56:'Belgium', 70:'Bosnia and Herzegovina', 76:'Brazil', 124:'Canada',
  132:'Cape Verde', 170:'Colombia', 191:'Croatia', 203:'Czech Republic',
  180:'DR Congo', 818:'Egypt', 218:'Ecuador', 250:'France', 276:'Germany',
  288:'Ghana', 332:'Haiti', 364:'Iran', 368:'Iraq', 384:'Ivory Coast',
  392:'Japan', 400:'Jordan', 484:'Mexico', 504:'Morocco', 528:'Netherlands',
  554:'New Zealand', 578:'Norway', 591:'Panama', 600:'Paraguay',
  620:'Portugal', 634:'Qatar', 682:'Saudi Arabia', 686:'Senegal',
  710:'South Africa', 410:'South Korea', 724:'Spain', 752:'Sweden',
  756:'Switzerland', 788:'Tunisia', 792:'Turkey',
  8260:'England', 8261:'Scotland',
  840:'United States', 858:'Uruguay', 860:'Uzbekistan',
  531:'Curaçao'
};

export const QUALIFIED_BY_NAME = Object.fromEntries(
  Object.entries(QUALIFIED_NAMES).map(([id, name]) => [name, +id])
);

export const buildImportByCountry = (mapData, countryNameFn) => {
  const out = {};
  for (const rec of (mapData.data ?? [])) {
    for (const p of (rec.players ?? [])) {
      const nId = QUALIFIED_BY_NAME[p.nation];
      if (nId == null) continue;
      if (countryNameFn(rec.id, rec.country) === countryNameFn(nId, QUALIFIED_NAMES[nId])) continue;
      if (!out[nId]) out[nId] = [];
      const imp = { name: p.name, birthCountry: rec.country, birthCountryId: rec.id, caps: p.caps, pid: p.pid };
      if (p.role) imp.role = p.role;
      out[nId].push(imp);
    }
  }
  return out;
};

// Knockout rounds in tournament order — matches data/v2/status.json's `round` strings
// verbatim. A country's index in this array is how far it got before going out.
// Absent from status.json = still alive (treated as reaching every stage, including
// ones that haven't been played yet — it just hasn't been eliminated *yet*).
export const ELIM_ROUNDS = ['Group Stage', 'Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'];

// The control-sidebar carousel's 7 stops. Position p's textual label differs from
// ELIM_ROUNDS at the two ends ('qualified' has no elimination round; 'winner' means
// never eliminated) but the numeric scale is the same: a country is shown at carousel
// position p iff its ELIM_ROUNDS index (or Infinity if alive) is >= p.
export const CAROUSEL_STAGES = ['qualified', 'r32', 'r16', 'qf', 'sf', 'final', 'winner'];

export const reachesStage = (eliminatedAtIndex, stagePos) => (eliminatedAtIndex ?? Infinity) >= stagePos;

// birthCountryId -> the furthest ELIM_ROUNDS index reached by any of its exported
// players' destination countries (Infinity if at least one destination is still alive).
// Lets exporter rows filter by the same carousel position as qualified countries: an
// exporter "reaches" stage S if any country it sends players to reached stage S.
export const buildExporterStageIndex = (importByCountry, stageIndexById) => {
  const out = new Map();
  for (const [nIdStr, players] of Object.entries(importByCountry)) {
    const destStage = stageIndexById.get(+nIdStr) ?? Infinity;
    for (const p of players) {
      const cur = out.get(p.birthCountryId);
      if (cur === undefined || destStage > cur) out.set(p.birthCountryId, destStage);
    }
  }
  return out;
};

export const loadEloData = async (basePath = '') => {
  const [eloData, statusByIso2] = await Promise.all([
    fetch(`${basePath}data/elo_rank.json`).then(r => r.json()),
    fetch(`${basePath}data/v2/status.json`).then(r => r.json()).catch(() => null),
  ]);
  return { eloData, statusByIso2: statusByIso2 ?? {} };
};

// Knockout rounds only (excludes 'Group Stage' — round-robin group play has no bracket slot).
const BRACKET_ROUNDS = ELIM_ROUNDS.slice(1);

// ── Export/import indicator intensity (▶ / ◀ color in the Elo list, see taxonomy.css) ──
// Colors scale with raw count relative to the tournament-wide max (France's export count,
// Curaçao's import count as of writing — recomputed live, never hardcoded). Squared curve with
// a floor: most low counts compress near the floor, the busiest exporter/importer stands out.
const _EXP_LIGHT = [0xbc, 0xd7, 0xfb], _EXP_DARK = [0x3b, 0x82, 0xf6];
const _IMP_LIGHT = [0xfb, 0xc9, 0xc9], _IMP_DARK = [0xef, 0x44, 0x44];
const _lerpRgb = ([lr, lg, lb], [dr, dg, db], t) =>
  `rgb(${Math.round(lr + (dr - lr) * t)},${Math.round(lg + (dg - lg) * t)},${Math.round(lb + (db - lb) * t)})`;
const _intensity = (count, max) =>
  max > 0 && count > 0 ? 0.2 + 0.8 * (Math.min(count, max) / max) ** 2 : 0;
const _expColor = (count, max) => count > 0 ? _lerpRgb(_EXP_LIGHT, _EXP_DARK, _intensity(count, max)) : null;
const _impColor = (count, max) => count > 0 ? _lerpRgb(_IMP_LIGHT, _IMP_DARK, _intensity(count, max)) : null;

// Three-band pill gradient (red import | white native | blue export), band widths proportional
// to each group's share of this country's total player pool: players it imports (born
// elsewhere, selected by it), players it "keeps" (born and selected by it), and players it
// exports (born there, selected elsewhere). impPivot/nativePivot are the two band-boundary
// percentages taxonomy.css reads to position the gradient's color stops.
//
// Each band's width is additionally capped by that count's own share of the tournament-wide
// max (same normalization driving color intensity above). Without this, a country with a
// single export and nothing else — common among non-qualified birth-only countries, which by
// definition can never have imports or natives — would have that one player's export claim
// 100% of the composition (1 of its own 1 total) and so paint the *entire* pill in blue, same
// as a country exporting dozens. Capping by magnitude keeps a lone player looking like what it
// is: a thin sliver, not a flood. Genuinely dominant countries (Curaçao's 26 imports, the
// tournament max) are unaffected since their magnitude share is already ~100% too.
const _gradientPivots = (expCount, nativeCount, impCount, maxExpCount, maxImpCount, boostExp = false) => {
  const total = expCount + nativeCount + impCount;
  if (total === 0) return { impPivot: '0%', nativePivot: '0%' };
  const impComposition = (impCount / total) * 100;
  const expComposition = (expCount / total) * 100;
  const impMagnitude = maxImpCount > 0 ? (impCount / maxImpCount) * 100 : 0;
  let expMagnitude = maxExpCount > 0 ? (expCount / maxExpCount) * 100 : 0;
  // Blunt legibility fix for non-qualified exporters: their magnitude-capped blue sliver (see
  // above) is honest but reads as near-invisible for a lone export like Italy's. Doubling it
  // is not principled, just an amount that makes the sliver noticeable again without it eating
  // the whole pill for the busier non-qualified exporters.
  if (boostExp) expMagnitude = Math.min(100, expMagnitude * 2);
  const impPivot = Math.min(impComposition, impMagnitude);
  const nativePivot = 100 - Math.min(expComposition, expMagnitude);
  return { impPivot: `${impPivot.toFixed(1)}%`, nativePivot: `${nativePivot.toFixed(1)}%` };
};

// iso2 -> furthest BRACKET_ROUNDS index it's known to have WON (proven by appearing as
// someone else's `lostTo` at that round). Absent = hasn't won a single knockout round yet.
// Shared by buildEloItems (per-team pending state) and buildBracketState (aggregate counts).
const computeWonUpTo = (statusByIso2) => {
  const wonUpTo = {};
  for (const info of Object.values(statusByIso2 ?? {})) {
    if (!info.lostTo) continue;
    const i = BRACKET_ROUNDS.indexOf(info.round);
    if (i < 0) continue;
    wonUpTo[info.lostTo] = Math.max(wonUpTo[info.lostTo] ?? -1, i);
  }
  return wonUpTo;
};

export const buildEloItems = ({ rankings, byId, importByCountry, nativeByCountry = {}, countryNameFn, centroids, pop, statusByIso2 }) => {
  const nameByIso2 = Object.fromEntries(rankings.filter(r => r.iso2).map(r => [r.iso2, countryNameFn(r.id, r.name)]));
  const wonUpTo = computeWonUpTo(statusByIso2);
  const maxExpCount = Math.max(0, ...rankings.map(r => byId[r.id]?.count ?? 0));
  const maxImpCount = Math.max(0, ...rankings.map(r => importByCountry[r.id]?.length ?? 0));
  return rankings
    .filter(r => !r.weirdo)
    .map(({ id, rank, pts, iso2, name, fifaMember }) => {
      const status = statusByIso2?.[iso2] ?? null;
      const eliminatedAtIndex = status ? ELIM_ROUNDS.indexOf(status.round) : null;
      // Carousel stage index from which this team's fate is undecided (still contesting a
      // fixture — could go either way) through 'winner'. null once eliminated (nothing left
      // to be uncertain about) or once it's actually won the Final (already the champion).
      const furthest = wonUpTo[iso2] ?? -1;
      const pendingFrom = QUALIFIED_NAMES[id] && !status && furthest < BRACKET_ROUNDS.length - 1 ? furthest + 2 : null;
      // Last carousel stage this team is shown at all: its elimination boundary, or its one
      // blurred "waiting for fixture" appearance, or Infinity once it has nothing left to prove
      // (won the Final). A team's blurred appearance is its last — it doesn't carry forward
      // into stages beyond it while still undecided.
      const visibleThroughIndex = eliminatedAtIndex ?? pendingFrom ?? Infinity;
      return {
        id, rank, pts: pts ?? '—', iso2, name: countryNameFn(id, name),
        fifaMember,
        qualified: !!QUALIFIED_NAMES[id],
        knockedOut: status != null,
        eliminatedAtIndex,
        eliminatedRound: status?.round ?? null,
        eliminatedDate: status?.date ?? null,
        eliminatedLostTo: status?.lostTo ? (nameByIso2[status.lostTo] ?? status.lostTo) : null,
        pendingFrom,
        visibleThroughIndex,
        exp: (byId[id]?.count ?? 0) > 0,
        imp: (importByCountry[id]?.length ?? 0) > 0,
        expCount: byId[id]?.count ?? 0,
        impCount: importByCountry[id]?.length ?? 0,
        expColor: _expColor(byId[id]?.count ?? 0, maxExpCount),
        impColor: _impColor(importByCountry[id]?.length ?? 0, maxImpCount),
        ..._gradientPivots(byId[id]?.count ?? 0, nativeByCountry[id]?.length ?? 0, importByCountry[id]?.length ?? 0, maxExpCount, maxImpCount, !QUALIFIED_NAMES[id]),
        noMap: centroids ? !centroids[id] : false,
        pop: pop?.[iso2] ?? null,
      };
    });
};

// Per knockout round: how many of the 48 qualifiers were eliminated in it, passed through it
// (won and moved on), or are still contesting it (fixture not yet played/decided). Derived
// purely from status.json's `lostTo` links — a team that appears as someone else's lostTo has
// thereby proven it won that round, so the furthest round any team is recorded winning tells
// us which round it's currently playing (one past that).
export const buildBracketState = (statusByIso2, all48Iso2) => {
  const rIdx = r => BRACKET_ROUNDS.indexOf(r);
  const wonUpTo = computeWonUpTo(statusByIso2);

  const counts = Object.fromEntries(BRACKET_ROUNDS.map(r => [r, { eliminated: 0, passed: 0, playing: 0 }]));
  for (const iso2 of all48Iso2) {
    const elim = statusByIso2[iso2];
    // Group Stage exits never reach any bracket round — track separately so they don't get
    // conflated with "still alive" (both would otherwise read as eliminatedAt === null).
    const outInGroupStage = elim?.round === 'Group Stage';
    const furthest = wonUpTo[iso2] ?? -1;
    const eliminatedAt = elim && !outInGroupStage ? rIdx(elim.round) : null;
    for (let i = 0; i < BRACKET_ROUNDS.length; i++) {
      if (eliminatedAt === i) counts[BRACKET_ROUNDS[i]].eliminated++;
      else if (i <= furthest) counts[BRACKET_ROUNDS[i]].passed++;
      else if (eliminatedAt === null && !outInGroupStage && i === furthest + 1) counts[BRACKET_ROUNDS[i]].playing++;
      // else: already out before reaching round i — not counted here
    }
  }
  return counts;
};
