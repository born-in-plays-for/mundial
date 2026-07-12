// Shared "show/hide and dim/undim a flag" animation, used everywhere a flag's visibility or
// brightness changes: control_sidebar.js's category filter, wc2026_map.js's group focus, dim
// focus, and dim-mode's own opacity fade. A set of flags sweeps in/out one after another rather
// than snapping instantly, via a small per-flag start delay — capped so a large batch (e.g.
// every flag on the map, ~230 of them, toggled by the sidebar's "show all" checkbox) never
// takes more than STAGGER_CAP_MS total, regardless of how many flags are actually changing.
// d3 is a page-level global (loaded via <script> before any module using this one), matching
// the same assumption control_sidebar.js's own `typeof d3 !== 'undefined'` guards already make.

const DURATION_MS = 180;
const STAGGER_CAP_MS = 500;
const MAX_STEP_MS = 20;

const _staggeredEach = (nodes, apply) => {
  const n = nodes.length;
  if (n === 0) return;
  const step = n > 1 ? Math.min(MAX_STEP_MS, STAGGER_CAP_MS / (n - 1)) : 0;
  nodes.forEach((node, i) => apply(d3.select(node), node, i * step));
};

// hiddenFn(el) -> bool: should this flag be hidden? Only touches elements whose hidden state
// is actually changing. Hiding fades opacity down to 0, then sets visibility:hidden (so it
// stops intercepting clicks/hover once gone, same as the old instant toggle did). Showing
// un-hides first and fades opacity up from 0 to whatever was last set via animateFlagOpacity
// (data-flag-opacity, defaulting to 1 if this flag has never been dimmed) — so a flag that was
// both dimmed and filtered out returns to its dimmed brightness on reveal, not a full-opacity
// flash.
export const animateFlagHidden = (selection, hiddenFn) => {
  const changed = selection.nodes().filter(el => (el.getAttribute('visibility') === 'hidden') !== hiddenFn(el));
  _staggeredEach(changed, (sel, el, delay) => {
    if (hiddenFn(el)) {
      sel.transition().delay(delay).duration(DURATION_MS).attr('opacity', 0)
        .on('end', function() { d3.select(this).attr('visibility', 'hidden'); });
    } else {
      const target = parseFloat(el.getAttribute('data-flag-opacity') ?? '1');
      sel.attr('visibility', null).attr('opacity', 0)
         .transition().delay(delay).duration(DURATION_MS).attr('opacity', target);
    }
  });
};

// opacityFn(el) -> number: this flag's target opacity (e.g. 1 for the dim-selected/linked
// countries, 0.35 for everyone else during dim mode). Remembers the target in data-flag-opacity
// so a later animateFlagHidden reveal fades up to the right brightness instead of always 1.
export const animateFlagOpacity = (selection, opacityFn) => {
  const changed = selection.nodes().filter(el => Math.abs(parseFloat(el.getAttribute('opacity') ?? '1') - opacityFn(el)) > 0.01);
  _staggeredEach(changed, (sel, el, delay) => {
    const target = opacityFn(el);
    sel.attr('data-flag-opacity', target);
    sel.transition().delay(delay).duration(DURATION_MS).attr('opacity', target);
  });
};
