const _CDN = c => `https://cdn.jsdelivr.net/npm/circle-flags@2/flags/${c}.svg`;

// Nation IDs in FIFA ranking order (approximate June 2026 — update fifa_rank in wc2026_map_data.json)
const _FIFA_ORDER = [
  32,    //  1. Argentina
  250,   //  2. France
  724,   //  3. Spain
  8260,  //  4. England
  76,    //  5. Brazil
  620,   //  6. Portugal
  528,   //  7. Netherlands
  56,    //  8. Belgium
  276,   //  9. Germany
  170,   // 10. Colombia
  504,   // 11. Morocco
  392,   // 12. Japan
  840,   // 13. United States
  686,   // 14. Senegal
  858,   // 15. Uruguay
  410,   // 16. South Korea
  191,   // 17. Croatia
  218,   // 18. Ecuador
  756,   // 19. Switzerland
  484,   // 20. Mexico
  36,    // 21. Australia
  40,    // 22. Austria
  364,   // 23. Iran
  792,   // 24. Turkey
  578,   // 25. Norway
  384,   // 26. Ivory Coast
  124,   // 27. Canada
  818,   // 28. Egypt
  12,    // 29. Algeria
  752,   // 30. Sweden
  203,   // 31. Czech Republic
  8261,  // 32. Scotland
  288,   // 33. Ghana
  70,    // 34. Bosnia and Herzegovina
  682,   // 35. Saudi Arabia
  600,   // 36. Paraguay
  788,   // 37. Tunisia
  860,   // 38. Uzbekistan
  710,   // 39. South Africa
  180,   // 40. DR Congo
  554,   // 41. New Zealand
  400,   // 42. Jordan
  591,   // 43. Panama
  368,   // 44. Iraq
  634,   // 45. Qatar
  132,   // 46. Cape Verde
  332,   // 47. Haiti
  531,   // 48. Curaçao
];

const _NAMES = {
  12:'Algeria', 32:'Argentina', 36:'Australia', 40:'Austria',
  56:'Belgium', 70:'Bosnia and Herzegovina', 76:'Brazil', 124:'Canada',
  132:'Cape Verde', 170:'Colombia', 191:'Croatia', 203:'Czech Republic',
  180:'DR Congo', 818:'Egypt', 218:'Ecuador', 250:'France', 276:'Germany',
  288:'Ghana', 332:'Haiti', 364:'Iran', 368:'Iraq', 384:'Ivory Coast',
  392:'Japan', 400:'Jordan', 484:'Mexico', 504:'Morocco', 528:'Netherlands',
  554:'New Zealand', 578:'Norway', 591:'Panama', 600:'Paraguay',
  620:'Portugal', 634:'Qatar', 682:'Saudi Arabia', 686:'Senegal',
  710:'South Africa', 410:'South Korea', 724:'Spain', 752:'Sweden',
  756:'Switzerland', 788:'Tunisia', 792:'Turkey',
  8260:'England', 8261:'Scotland',
  840:'United States', 858:'Uruguay', 860:'Uzbekistan',
  531:'Curaçao',
};

const _ISO2 = {
  12:'dz', 32:'ar', 36:'au', 40:'at', 56:'be', 70:'ba', 76:'br',
  124:'ca', 132:'cv', 170:'co', 191:'hr', 203:'cz', 180:'cd',
  218:'ec', 250:'fr', 276:'de', 288:'gh', 332:'ht', 364:'ir',
  368:'iq', 384:'ci', 392:'jp', 400:'jo', 484:'mx', 504:'ma',
  528:'nl', 554:'nz', 578:'no', 591:'pa', 600:'py', 620:'pt',
  634:'qa', 682:'sa', 686:'sn', 710:'za', 410:'kr', 724:'es',
  752:'se', 756:'ch', 788:'tn', 792:'tr', 840:'us',
  858:'uy', 860:'uz',
  8260:'gb-eng', 8261:'gb-sct',
  531:'cw',
};

// opts: { getName(id, fallback), fifaRank: {name→rank}, onCountryClick(id), getSelectedId(), title, source, date }
// Returns update(id) — call with new selected id (or null) for surgical highlight update.
export function renderFifaRanking(container, opts = {}) {
  const {
    getName = (id, fb) => fb,
    fifaRank = {},
    onCountryClick = null,
    getSelectedId = null,
    title = 'FIFA World Rankings',
    source = 'FIFA.com',
    date = 'June 2026',
  } = opts;

  const ranked = Object.keys(fifaRank).length > 0
    ? Object.entries(_NAMES)
        .map(([id, name]) => ({ id: +id, name, rank: fifaRank[name] }))
        .filter(e => e.rank != null)
        .sort((a, b) => a.rank - b.rank)
    : _FIFA_ORDER.map((id, i) => ({ id, rank: i + 1, name: _NAMES[id] }));

  const wrap = document.createElement('div');

  // Header
  const hdr = document.createElement('div');
  hdr.className = 'fifa-header';
  hdr.innerHTML =
    `<span class="fifa-title">${title}</span>` +
    `<span class="fifa-meta">${ranked.length} nations · ${source} · ${date}</span>`;
  wrap.appendChild(hdr);

  // List
  const ul = document.createElement('ul');
  ul.className = 'fifa-list';
  const itemById = new Map();

  for (const { rank, id, name } of ranked) {
    const iso2 = _ISO2[id];
    const clickable = onCountryClick != null;
    const li = document.createElement('li');
    li.className = 'fifa-item' + (clickable ? ' fifa-item--clickable' : '');
    li.innerHTML =
      `<span class="fifa-rank">${rank}</span>` +
      (iso2 ? `<img class="fifa-flag" src="${_CDN(iso2)}" alt="">` : `<span class="fifa-flag"></span>`) +
      `<span class="fifa-name">${getName(id, name)}</span>`;
    if (clickable) li.addEventListener('click', () => onCountryClick(id));
    itemById.set(id, li);
    ul.appendChild(li);
  }

  wrap.appendChild(ul);
  container.innerHTML = '';
  container.appendChild(wrap);

  // Surgical highlight update — returns the update function
  let _activeId = null;
  const update = id => {
    itemById.get(_activeId)?.classList.remove('fifa-item--active');
    _activeId = id ?? null;
    itemById.get(_activeId)?.classList.add('fifa-item--active');
  };
  if (getSelectedId) update(getSelectedId());
  return update;
}
