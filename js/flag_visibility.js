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

// hiddenFn(el) -> bool: should this flag be hidden? Only touches elements whose *intended*
// hidden state is actually changing — tracked via data-hidden-target, not read back off the
// live `visibility` attribute. That distinction matters: several callers (control_sidebar.js's
// category filter, _applyGroupFocus, _applyDimFocus) can all run on the same flag within one
// synchronous batch (control_sidebar.js's callbacks.afterFlagFilter chain), each with a
// different opinion. A hide fades opacity to 0 and only flips `visibility` at the very end, so
// mid-fade the DOM still reads "visible" — a later caller in the same batch wanting it shown
// would see no change needed and do nothing, leaving the hide to finish anyway; the *next*
// unrelated interaction then has to notice and re-show it, and the filter re-hides it right
// back — a tug-of-war that reads as constant flicker (this is exactly what made Curaçao/Cape
// Verde's blended inset flicker on nearly every unrelated flag-set change: they're common
// dim-mode import links, so _applyDimFocus's "keep shown" and the category filter's "hide" kept
// fighting over the same flag). Comparing against the last *requested* target instead of the
// DOM's current (possibly mid-transition) state means the later caller in the same batch always
// wins outright — d3 transitions on the same element/attribute naturally interrupt/replace an
// earlier one, so requesting "show" cancels an in-flight "hide" before it ever reaches its own
// `visibility:hidden` step.
export const animateFlagHidden = (selection, hiddenFn) => {
  const changed = selection.nodes().filter(el => {
    const target = hiddenFn(el);
    const known = el.hasAttribute('data-hidden-target');
    const current = known ? el.getAttribute('data-hidden-target') === '1' : el.getAttribute('visibility') === 'hidden';
    return current !== target;
  });
  _staggeredEach(changed, (sel, el, delay) => {
    const target = hiddenFn(el);
    el.setAttribute('data-hidden-target', target ? '1' : '0');
    if (target) {
      sel.transition().delay(delay).duration(DURATION_MS).attr('opacity', 0)
        .on('end', function() {
          // Only actually hide if still the intended target — a later call may already have
          // flipped it back before this transition got a chance to run (normally that call
          // would have interrupted this transition outright; this is just cheap insurance).
          if (this.getAttribute('data-hidden-target') === '1') d3.select(this).attr('visibility', 'hidden');
        });
    } else {
      const opacityTarget = parseFloat(el.getAttribute('data-flag-opacity') ?? '1');
      sel.attr('visibility', null).attr('opacity', 0)
         .transition().delay(delay).duration(DURATION_MS).attr('opacity', opacityTarget);
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
