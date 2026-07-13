// KDE "talent production intensity" layer — a raster relative-risk surface (data/kde_risk.json),
// toggled against the existing birth-city bubble view (see wc2026_map.js's
// _updatePlayerCityDots). Kept in its own module, mirroring group_stage.js/flag_visibility.js's
// own small-focused-file convention.
//
// log2Risk = log2(relative risk) vs. the dataset's own global player-per-population rate:
// 0 = proportional, +1 = 2x, -1 = half. Independent of map-container.js's THEMES/diverging-scale
// system on purpose — that system is specifically the country-choropleth color ramp, a different
// metric on a different scale; coupling the two would entangle two unrelated concepts for no
// benefit.
//
// No hotspot dots/labels — an earlier pass snapped each local maximum to the nearest *scraped*
// birth city, which is only as precise as that lookup (e.g. a Paris-area maximum landing on
// Pontoise instead of Paris) and read as noise/inaccuracy rather than insight. The raster itself
// carries all the real signal; labels aren't pertinent enough to keep.

const NEUTRAL = '#f2f0ea';
const WARM    = '#5b1a8c'; // positive — overproduces relative to population
const COOL    = '#2f6f6f'; // negative — underproduces relative to population

export const loadKdeData = async () => {
  const kde = await fetch('data/kde_risk.json').then(r => r.json());
  let posMax = 0, negMin = 0;
  for (const v of kde.values) {
    if (v == null) continue;
    if (v > posMax) posMax = v;
    if (v < negMin) negMin = v;
  }
  return { kde, posMax, negMin };
};

// Two independent linear scales meeting at a shared neutral color, rather than one continuous
// diverging function — mirrors the shape of map-container.js's own diverging theme (separate
// pos/neg pieces), just with its own colors/domain, not sharing state with it.
export const makeKdeColorScale = (negMin, posMax) => {
  const pos = d3.scaleLinear().domain([0, posMax || 1]).range([NEUTRAL, WARM]).clamp(true);
  const neg = d3.scaleLinear().domain([negMin || -1, 0]).range([COOL, NEUTRAL]).clamp(true);
  return v => (v >= 0 ? pos(v) : neg(v));
};

// Nearest-cell lookup — resolutionDeg is coarse enough (0.25°) that bilinear interpolation
// wouldn't visibly smooth the result any further than the kernel itself already did upstream.
const _sampleKde = (kde, lon, lat) => {
  const { bbox, resolutionDeg, nx, ny, values } = kde;
  const j = Math.floor((lon - bbox[0]) / resolutionDeg);
  const i = Math.floor((lat - bbox[1]) / resolutionDeg);
  if (i < 0 || i >= ny || j < 0 || j >= nx) return null;
  return values[i * nx + j];
};

// Renders the grid once, offscreen, into a canvas sized to the SVG's own viewBox (so the
// resulting image can be embedded as a plain child of the same <g> the choropleth paths live in
// — it inherits pan/zoom for free via the group's own transform, no per-tick recomputation and no
// separate CSS-positioned overlay to keep pixel-synced against window resize).
export const buildKdeRaster = ({ projection, svg, kde, colorScale, supersample = 2 }) => {
  const [vbX, vbY, vbW, vbH] = svg.attr('viewBox').split(' ').map(Number);
  const cw = Math.round(vbW * supersample), ch = Math.round(vbH * supersample);
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d');
  const imgData = ctx.createImageData(cw, ch);
  const data = imgData.data; // alpha defaults to 0 — untouched pixels stay fully transparent,
                              // covering both masked grid cells and off-globe canvas corners.
  for (let py = 0; py < ch; py++) {
    const y = vbY + py / supersample;
    for (let px = 0; px < cw; px++) {
      const x = vbX + px / supersample;
      let inv;
      try { inv = projection.invert([x, y]); } catch { inv = null; }
      if (!inv) continue;
      const [lon, lat] = inv;
      if (!isFinite(lon) || !isFinite(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) continue;
      const v = _sampleKde(kde, lon, lat);
      if (v == null) continue;
      const c = d3.rgb(colorScale(v));
      const idx = (py * cw + px) * 4;
      data[idx] = c.r; data[idx + 1] = c.g; data[idx + 2] = c.b; data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve({ url: URL.createObjectURL(blob), x: vbX, y: vbY, width: vbW, height: vbH }));
  });
};

// Human-readable legend ticks — a handful of round log2 values spanning the actual domain,
// converted to plain x-factors (2**log2Risk) per the prompt ("x2 more players than population
// predicts", not raw log2 numbers).
export const kdeLegendTicks = (negMin, posMax) => {
  const candidates = [-4, -2, -1, 0, 1, 2, 4];
  const colorScale = makeKdeColorScale(negMin, posMax);
  return candidates
    .filter(v => v >= negMin && v <= posMax || v === 0)
    .map(log2 => ({ log2, factor: 2 ** log2, color: colorScale(log2) }));
};
