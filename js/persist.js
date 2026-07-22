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

// Several modules persist under this one shared key, each owning its own top-level slice —
// control_sidebar.js's 'shared' (order/dir/stage/conf) and 'countries' (checks/display),
// group_stage.js's 'groupStage' (selected), wc2026_map.js's 'bottomTab' (active) — see each
// file's own comments for what its own fields mean. A shallow merge on save means writing one
// slice never clobbers another.
const _SHARED_STATE_KEY = 'mundial-state';

export const loadSlice = slice => loadJSON(_SHARED_STATE_KEY)?.[slice] ?? null;

export const saveSlice = (slice, value) => {
  const current = loadJSON(_SHARED_STATE_KEY) ?? {};
  saveJSON(_SHARED_STATE_KEY, { ...current, [slice]: value });
};
