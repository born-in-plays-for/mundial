export const QUALIFIED_NAMES = {
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
  531:'Curaçao'
};

export const QUALIFIED_BY_NAME = Object.fromEntries(
  Object.entries(QUALIFIED_NAMES).map(([id, name]) => [name, +id])
);

export const buildImportByCountry = (mapData, countryNameFn) => {
  const out = {};
  for (const rec of (mapData.data ?? [])) {
    for (const p of (rec.players ?? [])) {
      const nId = QUALIFIED_BY_NAME[p.nation];
      if (nId == null) continue;
      if (countryNameFn(rec.id, rec.country) === countryNameFn(nId, QUALIFIED_NAMES[nId])) continue;
      if (!out[nId]) out[nId] = [];
      const imp = { name: p.name, birthCountry: rec.country, birthCountryId: rec.id, caps: p.caps, wiki_langs: p.wiki_langs };
      if (p.role) imp.role = p.role;
      out[nId].push(imp);
    }
  }
  return out;
};

export const buildEloItems = ({ rankings, byId, importByCountry, fifaMemberIds, countryNameFn, centroids, pop }) =>
  rankings
    .filter(r => !r.weirdo)
    .map(({ id, rank, pts, iso2, name, fifaMember }) => ({
      id, rank, pts: pts ?? '—', iso2, name: countryNameFn(id, name),
      fifaMember,
      qualified: !!QUALIFIED_NAMES[id],
      exp: (byId[id]?.count ?? 0) > 0,
      imp: (importByCountry[id]?.length ?? 0) > 0,
      expCount: byId[id]?.count ?? 0,
      impCount: importByCountry[id]?.length ?? 0,
      noMap: centroids ? !centroids[id] : false,
      pop: pop?.[iso2] ?? null,
    }));
