import { CAROUSEL_STAGES } from './qualified.js';

// A control's URL/localStorage-adjacent state (sort order, stage, filters...) needs two mirror-
// image operations: read live state into a shareable URL (Share button), and read a URL back
// into live state (applyParams on page load). Hand-writing both sides invites exactly the kind
// of drift this table is meant to prevent — a key present in one direction but forgotten in the
// other. One array of { key, get, apply } entries is the single source for both directions, plus
// the "does this URL even mention me?" check both control_sidebar.js and players_sidebar.js do
// before falling back to restoring from localStorage.
//
// get()      → current value as the string that belongs in the URL for this key.
// apply(raw) → parse/validate raw (the URL's string value) and, if valid, set the corresponding
//              state (whatever that takes — a plain assignment, a setter with side effects like
//              _setStage, etc.) and return true. Return false (or falsy) for an invalid/rejected
//              raw value so callers can tell a key was present but not actually applied.
export function createParamTable(entries) {
  const byKey = new Map(entries.map(e => [e.key, e]));
  const keys = entries.map(e => e.key);

  const hasAny = sp => keys.some(k => sp.has(k));

  const get = key => byKey.get(key)?.get();

  const buildQuery = () => {
    const sp = new URLSearchParams();
    for (const { key, get } of entries) sp.set(key, get());
    return sp;
  };

  const applyFrom = sp => {
    for (const { key, apply } of entries) {
      if (sp.has(key)) apply(sp.get(key));
    }
  };

  return { keys, hasAny, get, buildQuery, applyFrom };
}

// Moves the given key(s) to the front of a priority-ordered list, deduping and keeping the rest
// in their existing relative order, truncated back to the original length — the "click this
// criterion to make it lead" / "?sort=k1,k2 to set the lead" operation shared by both pages'
// sort-list click handler, param-table apply, and localStorage restore. Pass [key] for a
// single-key promote.
export function promoteKeys(order, keys) {
  return [...new Set([...keys, ...order])].slice(0, order.length);
}

// ── Entry factories — control_sidebar.js and players_sidebar.js each have a 'stage' and a 'dir'
// param whose shape is identical (same CAROUSEL_STAGES domain, same asc/desc domain); only what
// runs after the value is set differs (_setStage's own carousel/bounds logic is already
// page-specific and stays behind the caller's setStage; the sort-column UI resync is passed in
// as part of setDir since the two pages resync different DOM). ──

// getStageIndex() → current index into CAROUSEL_STAGES. setStage(idx) → apply it (whatever that
// takes on the calling page — control's own _setStage / players' own _setStage).
export function stageEntry(key, { getStageIndex, setStage }) {
  return {
    key,
    get: () => CAROUSEL_STAGES[getStageIndex()],
    apply: raw => {
      const idx = CAROUSEL_STAGES.indexOf(raw);
      if (idx < 0) return false;
      setStage(idx);
      return true;
    },
  };
}

// getDir() → 'asc' | 'desc'. setDir(dir) → assign it AND resync whatever sort-column UI depends
// on it (the caller's job — the two pages' sort lists are different DOM).
export function dirEntry(key, { getDir, setDir }) {
  return {
    key,
    get: getDir,
    apply: raw => {
      if (raw !== 'asc' && raw !== 'desc') return false;
      setDir(raw);
      return true;
    },
  };
}

// ── sortEntry — the general shape behind both pages' "sort" param: an ordered priority list of
// criteria (getOrder/setOrder), optionally applied to one of several named AXES rather than a
// single implicit target. control_sidebar.js's country rows only ever have one identity to sort
// by, so it's the degenerate case — axes: [] (no selector at all, just a flat criteria list in
// the URL, e.g. "elo,pop"). players_sidebar.js's player rows have two — born-in country,
// plays-for country — so axes: ['bornIn', 'playsFor'] selects which is primary via a compound
// URL value ("playsFor:elo"); extraModes covers escape hatches with no criteria of their own
// (players' 'player' mode — sort by name, axes irrelevant).
//
// getAxis/setAxis (only used when axes.length > 0) — current/target axis selection, e.g.
// players' own _mode. getOrder/setOrder — the criteria priority list itself (setOrder receives
// the already-promoted array, via promoteKeys). criteriaCount — how many leading criteria the
// no-axes flat form serializes (control compares 2 at once — primary + tie-break; irrelevant
// when axes.length > 0, since there the *other axis* is the tie-break, not a 2nd criterion).
// onApply — resync whatever UI depends on the change (the caller's job, different DOM per page).
export function sortEntry(key, {
  axes = [],
  extraModes = [],
  validKeys,
  getAxis, setAxis,
  getOrder, setOrder,
  criteriaCount = 2,
  onApply,
}) {
  const hasAxes = axes.length > 0;

  const get = () => {
    if (!hasAxes) return getOrder().slice(0, criteriaCount).join(',');
    const axis = getAxis();
    return extraModes.includes(axis) ? axis : `${axis}:${getOrder()[0]}`;
  };

  const apply = raw => {
    if (!hasAxes) {
      const keys = raw.split(/[\s,+]+/).filter(k => validKeys.has(k));
      if (!keys.length) return false;
      setOrder(promoteKeys(getOrder(), keys));
    } else if (extraModes.includes(raw) || axes.includes(raw)) {
      setAxis(raw);
    } else {
      const sep = raw.indexOf(':');
      const axis = sep < 0 ? null : raw.slice(0, sep);
      if (!axis || !axes.includes(axis)) return false;
      setAxis(axis);
      const wantKey = raw.slice(sep + 1);
      if (validKeys.has(wantKey)) setOrder(promoteKeys(getOrder(), [wantKey]));
    }
    onApply?.();
    return true;
  };

  return { key, get, apply };
}

// ── setConfFilter factory — control_sidebar.js and players_sidebar.js both had a hand-written
// setConfFilter that was byte-for-byte the same shape (assign ids/key, sync the radio UI, notify,
// persist, dispatch mundial-conf-changed for wc2026_map.js's own listener — see that event's own
// comment at each call site). setState/syncRadio/notify/saveState are the only page-specific
// parts left to the caller. ──
export function createConfFilterSetter({ setState, syncRadio, notify, saveState }) {
  return (ids, key = null) => {
    const normIds = ids ?? null;
    setState(normIds, key);
    syncRadio();
    notify();
    saveState();
    document.dispatchEvent(new CustomEvent('mundial-conf-changed', { detail: { conf: key, ids: normIds } }));
  };
}
