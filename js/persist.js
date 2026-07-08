// Generic localStorage get/set — the try/catch plumbing every control's own _saveState/
// _restoreState needs (storage can be unavailable: private browsing, quota, disabled). The
// *shape* being persisted stays bespoke per control (control_sidebar.js's own
// sortOrder/sortDir/stage/checks/conf/display vs. players_sidebar.js's own, different shape) —
// only this get/set-with-try/catch boilerplate is shared, so it can't drift between them.

export const saveJSON = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); }
  catch { /* storage unavailable (private mode, quota, etc.) — ignore */ }
};

export const loadJSON = key => {
  try { return JSON.parse(localStorage.getItem(key)); }
  catch { return null; }
};
