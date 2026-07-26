// js/diverging-debug.js
// Dev-only live-tuning panel for diverging-scale.js's color params — markup and
// wiring both live here now (previously just the wiring, with the <details> block
// hand-written in index.html; moved in for consistency with map-container.js's own
// mapContainerTemplate()/legend.js split). Hidden by default (inline style="display:
// none" in the template below), shown only when the URL carries a ?debug param.
// Kept separate from diverging-scale.js itself (a pure, DOM-free math module) so
// neither map-container.js nor legend.js pays for this UI just by importing the
// color math. Live-tunes diverging-scale.js's _divergingParams via
// getDivergingParams()/setDivergingParams() — the latter already notifies
// onPaletteChange()'s listeners (map-container.js's repaint, legend.js's rebuild),
// so every input here just needs to call it; both repaints happen for free.

import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { getDivergingParams, setDivergingParams } from './diverging-scale.js';

const _divergingDebugTemplate = () => html`
  <details id="diverging-debug" class="container-xxl my-2 sub" open style="display:none">
    <summary style="cursor:pointer;">Diverging scale debug</summary>
    <div class="d-flex flex-wrap gap-3 align-items-end py-2">
      <label class="d-flex flex-column">Neutral (v = 0)
        <input type="color" id="dbg-neutral">
      </label>
      <label class="d-flex flex-column">Left color — negative / "plays for"
        <input type="color" id="dbg-easy-left">
      </label>
      <label class="d-flex flex-column">Right color — positive / "born in"
        <input type="color" id="dbg-easy-right">
      </label>
      <label class="d-flex flex-column">Left outlier dot
        <input type="color" id="dbg-outlier-left">
      </label>
      <label class="d-flex flex-column">Right outlier dot
        <input type="color" id="dbg-outlier-right">
      </label>
      <label class="d-flex flex-column">Left algo
        <select id="dbg-algo-left">
          <option value="power">power</option>
          <option value="smoothstep">smoothstep</option>
        </select>
      </label>
      <label class="d-flex flex-column">Left ease (power only) <span id="dbg-ease-left-val"></span>
        <input type="range" id="dbg-ease-left" min="0.2" max="3" step="0.1">
      </label>
      <label class="d-flex flex-column">Right algo
        <select id="dbg-algo-right">
          <option value="power">power</option>
          <option value="smoothstep">smoothstep</option>
        </select>
      </label>
      <label class="d-flex flex-column">Right ease (power only) <span id="dbg-ease-right-val"></span>
        <input type="range" id="dbg-ease-right" min="0.2" max="3" step="0.1">
      </label>
      <label class="d-flex flex-column">Left floor (v≠0 min) <span id="dbg-floor-left-val"></span>
        <input type="range" id="dbg-floor-left" min="0" max="0.5" step="0.01">
      </label>
      <label class="d-flex flex-column">Right floor (v≠0 min) <span id="dbg-floor-right-val"></span>
        <input type="range" id="dbg-floor-right" min="0" max="0.5" step="0.01">
      </label>
      <button id="dbg-reset" type="button" class="btn btn-sm btn-outline-secondary">Reset</button>
    </div>
  </details>
`;

export const initDivergingDebug = () => {
  const slot = document.getElementById('diverging-debug-slot');
  if (!slot) return;
  render(_divergingDebugTemplate(), slot);

  const panel = document.getElementById('diverging-debug');
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
