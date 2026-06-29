// js/map-container.js
// Shared map infrastructure: <world-map> web component + exported constants.
// Both wc2026_map.js and insights pages import this to share the projection,
// zoom behaviour, and choropleth colour scale.
//
// Usage in HTML:
//   <world-map id="map" role="img" aria-label="..."></world-map>
//   The id (and aria-* attrs) are forwarded to the inner <svg>.
//
// After customElements.define() the element exposes:
//   .svg        — D3 selection of the inner <svg>
//   .g          — D3 selection of the transform <g> group
//   .projection — d3.geoNaturalEarth1 instance
//   .path       — d3.geoPath instance
//   .zoom       — D3 zoom behaviour (already called on svg)
//   .onZoom     — optional callback(e) for extra page-level zoom work

// ── Shared colour scale ───────────────────────────────────────────────────────
export const RATIO_MAX     = 66;
export const PALETTE       = d3.interpolateRgbBasis(['#f3e8f7','#ddb8ea','#c285d8','#a354c2','#7b2d8b','#581f65','#361240']);
export const normalize     = r => (r / RATIO_MAX) ** 2;
export const color         = r => PALETTE(Math.max(0, Math.min(1, normalize(r))));
export const OUTLIER_COLOR = '#000';
export const OUTLIER_IDS   = new Set([250]);
export const choroFill     = (id, byId) => {
  if (OUTLIER_IDS.has(id)) return OUTLIER_COLOR;
  const r = byId[id];
  return r ? color(r.ratio) : '#e8e4e0';
};

// ── Flag CDN helpers ──────────────────────────────────────────────────────────
export const FLAG_CDN      = code => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${code}.svg`;
export const FLAG_CDN_RECT = code => `https://cdn.jsdelivr.net/npm/flag-icons@7/flags/4x3/${code}.svg`;

// ── Flag sizing constants ─────────────────────────────────────────────────────
export const FLAG = 14;
export const DOT_R = 2;
// How much flag icons grow with zoom: 0 = fixed size, 1 = fully proportional
export const FLAG_SIZE_ZOOM_EXP   = 1/3;
// How much leader-line offset grows with zoom
export const FLAG_OFFSET_ZOOM_EXP = 2/3;

// ── Map dimensions ────────────────────────────────────────────────────────────
export const W = 900, H = 480;

// ── <world-map> web component ─────────────────────────────────────────────────
class WorldMap extends HTMLElement {
  connectedCallback() {
    const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    // Forward id and aria-* attrs from the custom element to the inner svg,
    // so CSS rules like `#map { … }` and aria-label continue to work.
    const fwdAttrs = [...this.attributes].filter(a => a.name === 'id' || a.name.startsWith('aria-') || a.name === 'role');
    fwdAttrs.forEach(a => { svgEl.setAttribute(a.name, a.value); this.removeAttribute(a.name); });

    svgEl.style.touchAction = 'none';
    svgEl.style.userSelect = 'none';
    this.appendChild(svgEl);

    this.svg        = d3.select(svgEl);
    this.projection = d3.geoNaturalEarth1().scale(152).translate([W/2, H/2 + 10]);
    this.path       = d3.geoPath(this.projection);

    const [[bx0, by0], [bx1, by1]] = this.path.bounds({type: 'Sphere'});
    this.svg.attr('viewBox', `${Math.floor(bx0)} ${Math.floor(by0)} ${Math.ceil(bx1-bx0)} ${Math.ceil(by1-by0)}`);

    this.g      = this.svg.append('g');
    this.onZoom = null;

    this.zoom = d3.zoom().scaleExtent([1, 18]).on('zoom', e => {
      this.g.attr('transform', e.transform);

      const s = FLAG / Math.pow(e.transform.k, 1 - FLAG_SIZE_ZOOM_EXP);
      this.svg.selectAll('.flag-qualified')
        .attr('width', s).attr('height', s)
        .attr('x', function() { return +this.getAttribute('data-cx') - s/2; })
        .attr('y', function() { return +this.getAttribute('data-cy') - s/2; });

      this.svg.selectAll('.standalone-dot')
        .attr('r', DOT_R / e.transform.k)
        .attr('stroke-width', 0.5 / e.transform.k);

      this.svg.selectAll('.offset-flag').each(function() {
        const cx = +this.getAttribute('data-centroid-cx');
        const cy = +this.getAttribute('data-centroid-cy');
        const dx = +this.getAttribute('data-flag-dx');
        const dy = +this.getAttribute('data-flag-dy');
        d3.select(this)
          .attr('x', cx + dx / Math.pow(e.transform.k, FLAG_OFFSET_ZOOM_EXP) - s/2)
          .attr('y', cy + dy / Math.pow(e.transform.k, FLAG_OFFSET_ZOOM_EXP) - s/2);
      });

      this.svg.selectAll('.leader-line').each(function() {
        const cx = +this.getAttribute('data-centroid-cx');
        const cy = +this.getAttribute('data-centroid-cy');
        const dx = +this.getAttribute('data-flag-dx');
        const dy = +this.getAttribute('data-flag-dy');
        const k  = e.transform.k;
        d3.select(this)
          .attr('x2', cx + dx / Math.pow(k, FLAG_OFFSET_ZOOM_EXP))
          .attr('y2', cy + dy / Math.pow(k, FLAG_OFFSET_ZOOM_EXP))
          .attr('stroke-width', 2 / k)
          .attr('stroke-dasharray', `0,${3/k}`);
      });

      if (this.onZoom) this.onZoom(e);
    });

    this.svg.call(this.zoom);
  }
}

customElements.define('world-map', WorldMap);
