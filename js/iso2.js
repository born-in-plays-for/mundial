import { whereNumeric } from 'https://cdn.jsdelivr.net/npm/iso-3166-1@2/+esm';

// Numeric country id -> iso2 (or gb-xxx subdivision code) — shared lookup for anything that
// needs a flag from a country id (map page, players page, ...), so home nations, Kosovo, and
// non-qualified birth countries with no standard ISO alpha-2 lookup path can't drift between
// two independent copies of the same table.
export const ISO2 = {
  12:'dz', 32:'ar', 36:'au', 40:'at', 56:'be', 70:'ba', 76:'br',
  124:'ca', 132:'cv', 170:'co', 191:'hr', 203:'cz', 180:'cd',
  218:'ec', 250:'fr', 276:'de', 288:'gh', 332:'ht', 364:'ir',
  368:'iq', 384:'ci', 392:'jp', 400:'jo', 484:'mx', 504:'ma',
  528:'nl', 554:'nz', 578:'no', 591:'pa', 600:'py', 620:'pt',
  634:'qa', 682:'sa', 686:'sn', 710:'za', 410:'kr', 724:'es',
  752:'se', 756:'ch', 788:'tn', 792:'tr', 840:'us',
  858:'uy', 860:'uz',
  // home nations (synthetic IDs, no ISO 3166-1 numeric)
  8260:'gb-eng', 8261:'gb-sct', 8262:'gb-wls', 8263:'gb-nir',
  // birth countries not in qualified list
  120:'cm', 178:'cg', 208:'dk', 324:'gn', 372:'ie',
  380:'it', 398:'kz', 404:'ke', 566:'ng', 688:'rs', 705:'si',
  729:'sd', 834:'tz', 854:'bf', 818:'eg', 894:'zm',
  531:'cw',
  // Kosovo: user-assigned XK / numeric 383 (not in ISO 3166-1 official table)
  383:'xk',
  // Northern Cyprus / Somaliland: project-assigned ids (no ISO 3166-1 code at all, official
  // or user-assigned) — 'northern_cyprus'/'somaliland' are the circle-flags CDN's own filenames
  // for each, reused as the pseudo-code the same way gb-eng/gb-sct/etc. already are longer than
  // 2 chars.
  8264:'northern_cyprus', 8265:'somaliland',
};

export const ISO2_REVERSE = Object.fromEntries(Object.entries(ISO2).map(([id, c]) => [c, +id]));
export const iso2ForId = id => ISO2[id] ?? whereNumeric(String(id).padStart(3,'0'))?.alpha2?.toLowerCase() ?? null;

// Birth country names not in ISO 3166-1 numeric that have a known alpha-2 code
export const _NULL_CODE = { 'Democratic Republic of the Congo': 'cd', 'U.S.': 'us', 'Isle of Man': 'im' };
