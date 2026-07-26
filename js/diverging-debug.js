// js/diverging-debug.js
// Dev-only live-tuning panel for diverging-scale.js's color params (#diverging-debug,
// index.html) — hidden by default (the panel's own inline style="display:none"),
// shown only when the URL carries a ?debug param. Kept separate from
// diverging-scale.js itself (a pure, DOM-free math module) so neither
// map-container.js nor legend.js pays for this UI just by importing the color math.
// Live-tunes diverging-scale.js's _divergingParams via getDivergingParams()/
// setDivergingParams() — the latter already notifies onPaletteChange()'s listeners
// (map-container.js's repaint, legend.js's rebuild), so every input here just needs
// to call it; both repaints happen for free.

import { getDivergingParams, setDivergingParams } from './diverging-scale.js';

export const initDivergingDebug = () => {
  const panel = document.getElementById('diverging-debug');
  if (!panel) return;
  if (new URLSearchParams(location.search).has('debug')) panel.style.display = '';

  const _dbgDefaults = getDivergingParams();
  const _dbgEls = {
    neutral:      document.getElementById('dbg-neutral'),
    easyLeft:     document.getElementById('dbg-easy-left'),
    easyRight:    document.getElementById('dbg-easy-right'),
    outlierLeft:  document.getElementById('dbg-outlier-left'),
    outlierRight: document.getElementById('dbg-outlier-right'),
    algoLeft:     document.getElementById('dbg-algo-left'),
    algoRight:    document.getElementById('dbg-algo-right'),
    easeLeft:     document.getElementById('dbg-ease-left'),
    easeRight:    document.getElementById('dbg-ease-right'),
    floorLeft:    document.getElementById('dbg-floor-left'),
    floorRight:   document.getElementById('dbg-floor-right'),
  };
  const _dbgEaseLeftVal  = document.getElementById('dbg-ease-left-val');
  const _dbgEaseRightVal = document.getElementById('dbg-ease-right-val');
  const _dbgFloorLeftVal  = document.getElementById('dbg-floor-left-val');
  const _dbgFloorRightVal = document.getElementById('dbg-floor-right-val');
  const _dbgSync = params => {
    _dbgEls.neutral.value      = params.neutral;
    _dbgEls.easyLeft.value     = params.easyLeft;
    _dbgEls.easyRight.value    = params.easyRight;
    _dbgEls.outlierLeft.value  = params.outlierLeft;
    _dbgEls.outlierRight.value = params.outlierRight;
    _dbgEls.algoLeft.value     = params.algoLeft;
    _dbgEls.algoRight.value    = params.algoRight;
    _dbgEls.easeLeft.value     = params.easeLeft;
    _dbgEls.easeRight.value    = params.easeRight;
    _dbgEls.floorLeft.value    = params.floorLeft;
    _dbgEls.floorRight.value   = params.floorRight;
    _dbgEaseLeftVal.textContent  = params.easeLeft;
    _dbgEaseRightVal.textContent = params.easeRight;
    _dbgFloorLeftVal.textContent  = params.floorLeft;
    _dbgFloorRightVal.textContent = params.floorRight;
  };
  _dbgSync(_dbgDefaults);
  const _dbgApply = () => {
    const next = {
      neutral:      _dbgEls.neutral.value,
      easyLeft:     _dbgEls.easyLeft.value,
      easyRight:    _dbgEls.easyRight.value,
      outlierLeft:  _dbgEls.outlierLeft.value,
      outlierRight: _dbgEls.outlierRight.value,
      algoLeft:     _dbgEls.algoLeft.value,
      algoRight:    _dbgEls.algoRight.value,
      easeLeft:     +_dbgEls.easeLeft.value,
      easeRight:    +_dbgEls.easeRight.value,
      floorLeft:    +_dbgEls.floorLeft.value,
      floorRight:   +_dbgEls.floorRight.value,
    };
    setDivergingParams(next);
    _dbgEaseLeftVal.textContent  = _dbgEls.easeLeft.value;
    _dbgEaseRightVal.textContent = _dbgEls.easeRight.value;
    _dbgFloorLeftVal.textContent  = _dbgEls.floorLeft.value;
    _dbgFloorRightVal.textContent = _dbgEls.floorRight.value;
    // eslint-disable-next-line no-console
    console.log('[diverging-debug]', next);
  };
  Object.values(_dbgEls).forEach(el => el.addEventListener('input', _dbgApply));
  document.getElementById('dbg-reset').addEventListener('click', () => {
    setDivergingParams(_dbgDefaults);
    _dbgSync(_dbgDefaults);
    console.log('[diverging-debug] reset to', _dbgDefaults);
  });
};
