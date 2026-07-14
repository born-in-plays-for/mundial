Duplication report

Update: the "suggested future cleanup" from the original pass (buildChoroplethIndex,
paintChoropleth, wireLegend, plus the centroid/zoom-to-country and dim/arc helpers
needed by the click-to-zoom feature) has now been done — see "Reused as-is" below.
wc2026_map.js's own renderWorld/buildIndices/legend/dim-mode code was rewired to call
the same shared functions, so this is no longer chain-page-only reuse: a regression in
map-container.js now risks breaking both pages, not just this one. Verified by
static/manual review + `node --check` on every touched file (no browser testing this
pass, per instruction) — worth an actual visual smoke-test of wc2026_map.html (all 3
themes, zoom-reset/span, KDE toggle, dim mode click-through, arc rendering while
zooming) before treating this as fully verified.

Reused as-is (zero duplication):
- css/map-container.css, css/taxonomy.css (:root's --exp-accent/--imp-accent — arc colors), js/map-container.js (<world-map> element, choroFill, color, THEMES, FLAG_CDN, theme functions), js/qualified.js (QUALIFIED_NAMES, QUALIFIED_BY_NAME, buildImportByCountry), js/i18n.js (T, countryName), js/iso2.js (ISO2_REVERSE), js/flag_visibility.js (animateFlagOpacity) — all imported live, nothing copied.
- js/map-container.js's buildChoroplethIndex(rawData) — the byId/nativeByCountry/importByCountry core loop, extracted from wc2026_map.js's buildIndices() (which now calls it too, layering pop/totalCount/eloRank/capital on top — tooltip/player-table-only fields, still page-specific).
- js/map-container.js's paintChoropleth(g, path, world, ukNations, byId) — world choropleth + mesh borders + UK home nations + the Kosovo id patch (now genuinely shared, not just documented as "duplicated a second time" — insights/perf.html still has its own copy, untouched by this pass). Returns the D3 selections + worldFeatures/ukFeatures; wc2026_map.js chains its own mousemove/click/cursor/dim wiring onto the returned selections, this page chains nothing (no per-country interaction on the map paths themselves).
- js/map-container.js's wireLegend({ getById }) — gradient/ticks/outlier-count/born-text + theme-toggle swatch/click + its own onThemeChange registration, extracted from wc2026_map.js's _buildLegendGradient/_updateLegendTicks/_updateLegendOutlier/_updateLegendBorn/_paintThemeToggle. Both pages keep their own separate onThemeChange listener for the map's own fill repaint (wireLegend only owns the legend widget). wc2026_map.js's KDE-intensity-layer legend swap stays page-specific — it grabs #legend-bar/#legend-ticks/etc directly to repurpose them for a different display, bypassing wireLegend entirely; calls legend.refresh() to restore the normal view.
- js/map-container.js's CENTROID_OVERRIDE / dotCentroid(feature, projection, path) / mainlandBounds(feature, path) / zoomToCentroid(ctx, id, duration) — extracted from wc2026_map.js (the France/USA/Scotland/Croatia centroid fixups, and the pan/zoom-to-country-bounds logic). wc2026_map.js keeps a thin same-signature local wrapper (zoomToCentroid(id, duration)) bundling its own D3 handles into the ctx object zoomToCentroid expects, so its many existing call sites needed no changes.
- js/map-container.js's arcOffset/arrowPoints/appendArc/drawCountryArcs/rescaleArcs/_NULL_CENTROID_ID/computeImportIds — the full arc geometry + drawing + zoom-rescale + import-origin-resolution stack, extracted from wc2026_map.js's module-level arc constants, applyDim's drawArc closure, and the onZoom arc-rescale block. wc2026_map.js's applyDim() now just computes destIds/importIds and calls drawCountryArcs; the flag-opacity dim (data-dim-visible for the sidebar filter, tooltip raise() calls) stays there, page-specific.
- Zoom pan/scale itself: <world-map>'s built-in D3 zoom behavior (incl. flag rescaling on zoom) is generic and required no new code.
- Bootstrap's collapse component (already loaded).

New feature — click a flag to dim+arc and pan/zoom (ported from wc2026_map.html's
#chain-content, now including dim/arc mode — an earlier version of this feature/report
shipped pan/zoom only and was corrected):
Clicking a flag in the chain snake, or a qualified-country flag directly on this page's
own map, mirrors wc2026_map.js's own _chainOnClick/activateCountry/
_zoomToActiveDimFlags/clearDim: other flags fade to 35% opacity, curved √count-scaled
arcs are drawn to every export destination (byId[sourceId].nations) and import origin
(computeImportIds against importByCountry), and the map pans/zooms to the selected
country (zoomToCentroid). Clicking the already-selected flag again, clicking empty
ocean, or pressing Escape all clear the selection (dim, arcs, and zoom) the same way
wc2026_map.js's clearDim() does. What's deliberately NOT ported: tooltips on hover,
the player table below the map, and Elo-sidebar selection sync — none of those exist
on this page (the chain snake already shows player-level detail; there's no sidebar or
player table here to sync). The chain snake's own selection highlight/prev-next nav
buttons (already built into wc2026_chain_render.js, gated on the onCountryClick option)
come for free once onCountryClick/getSelectedIndex are wired up — no changes needed
there. The two previously-separate <script type="module"> blocks (chain loader, map
widget) are one module now: the click handler needs both the chain's render/selection
state and the map's byId/importByCountry/centroids/worldFeatures/ukFeatures/arcsGroup/
svg/zoom in the same scope.

#chain-panel — moved (cut, not duplicated) from wc2026_map.html, where it was one of
#bottom-panel's collapsible .tab-footer-panel children (expanding only while the chain
tab was active) — here it's this page's own always-visible position:fixed footer
(css/inline <style>, mirroring #bottom-panel's look without linking that stylesheet or
copying its tab-list/scroll-top-button content), holding wc2026_chain_render.js's
legend/subtitle/prev-next-nav header via renderChain's headerContainer option. This
also resolves the earlier showHeader:false gap noted in a prior revision of this
report: the nav buttons render into #chain-panel now, same as the legend text.
wc2026_map.html's own chain tab lost this fixed-footer treatment as a result (the
"move" was explicit, not a copy) — renderChain's own headerContainer ?? wrapper
fallback means its header still renders, just inline above the snake instead of
pinned to a footer; see wc2026_map.js's _renderChain() for the (now headerContainer-
less) call.

Deliberately duplicated (small, self-contained, documented inline in the file):
1. #zoom-reset/#zoom-span wiring — trimmed _zoomToVisibleFlags (no dimState branch, since nothing on this page ever hides a flag).
2. Map-toggle-bar collapse + body-padding sync — reimplemented more simply via ResizeObserver rather than copying wc2026_map.js's rAF-polling-during-Bootstrap-transition loop (this page has no bottom-tab/landscape-mobile cases to justify that complexity).
3. #legend-parent drag-resize + grip icon — same feature added to wc2026_map.js, not exported there either; same ~35-line block, own localStorage keys (mundial-chain-map-height/-collapsed, kept independent from the main page's mundial-map-* keys — the map theme preference is intentionally still shared, since that's baked into map-container.js itself).
4. Three tiny CSS rules (.legend-outlier-dot, .legend-outlier-wrap, #legend-outlier-count) copied from css/wc2026_map.css rather than linking that entire ~700-line stylesheet, which carries many global-selector (body, #page-header) rules irrelevant/risky here.
5. destIds construction (byId[sourceId].nations → Map<countryId, count> via QUALIFIED_BY_NAME) — a 3-line inline snippet, same shape as activateCountry's own, not worth a shared function for.

Explicitly out of scope (noted, not silently dropped): tooltips, player table, Elo sidebar, non-qualified-country flags, Cape Verde/Curaçao island insets, landscape-mobile fullscreen-map special case. None of this applies to a static snake-diagram page.

Remaining future cleanup (still not done, smaller/lower-value than what's now shared):
- Items 1-3 above are each small enough (~10-35 lines) that extracting them costs more in indirection than the duplication itself costs — worth revisiting only if a third page ever needs the same map widget.
