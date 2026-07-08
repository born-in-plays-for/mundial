// Generic localStorage get/set — the try/catch plumbing every control's own _saveState/
// _restoreState needs (storage can be unavailable: private browsing, quota, disabled).

export const saveJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* storage unavailable (private mode, quota, etc.) — ignore */ }
};

export const loadJSON = key => {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
};

// Both control_sidebar.js and players_sidebar.js persist under this one key now, each owning
// two top-level slices: 'shared' (order/dir/stage/conf — the 4 fields that mean the exact same
// thing on both pages: same reorderable elo/pop/delta/alpha keys via teamComparators, same
// asc/desc flip convention, same CAROUSEL_STAGES index, same CONF_IDS key — so picking a
// confederation or a tournament stage on one page carries over to the other), and their own
// page-private slice ('countries': checks/display: 'players': mode/native/moved — concepts
// that don't generalize across the two, see control_sidebar.js/players_sidebar.js's own
// comments). A shallow merge on save means either page can write its own two slices without
// touching the other page's private one.
const _SHARED_STATE_KEY = 'mundial-state';

export const loadSlice = slice => loadJSON(_SHARED_STATE_KEY)?.[slice] ?? null;

export const saveSlice = (slice, value) => {
  const current = loadJSON(_SHARED_STATE_KEY) ?? {};
  saveJSON(_SHARED_STATE_KEY, { ...current, [slice]: value });
};
