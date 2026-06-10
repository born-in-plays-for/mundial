import { whereNumeric } from 'https://cdn.jsdelivr.net/npm/iso-3166-1@2/+esm';

export const LOCALE = navigator.languages?.[0] ?? navigator.language ?? 'en';
const _LANG = LOCALE.toLowerCase().startsWith('fr') ? 'fr'
           : LOCALE.toLowerCase().startsWith('de') ? 'de'
           : LOCALE.toLowerCase().startsWith('it') ? 'it'
           : LOCALE.toLowerCase().startsWith('es') ? 'es'
           : 'en';

document.documentElement.lang = _LANG;

const _regionNames = (() => {
  try { return new Intl.DisplayNames([LOCALE], { type: 'region', fallback: 'none' }); } catch(e) { return null; }
})();

// Entries Intl.DisplayNames cannot handle (subdivision codes, historical states, edge cases)
const _OVERRIDE = {
  8260: { fr:'Angleterre',        de:'England',               it:'Inghilterra',      es:'Inglaterra',        en:'England' },
  8261: { fr:'Écosse',            de:'Schottland',            it:'Scozia',           es:'Escocia',           en:'Scotland' },
  8262: { fr:'Pays de Galles',    de:'Wales',                 it:'Galles',           es:'Gales',             en:'Wales' },
  8263: { fr:'Irlande du Nord',   de:'Nordirland',            it:'Irlanda del Nord', es:'Irlanda del Norte', en:'Northern Ireland' },
  'Soviet Union':               { fr:'Union soviétique', de:'Sowjetunion',  it:'Unione Sovietica', es:'Unión Soviética',  en:'Soviet Union' },
  'Kingdom of the Netherlands': { fr:'Pays-Bas',         de:'Niederlande',  it:'Paesi Bassi',      es:'Países Bajos',     en:'Netherlands' },
};

// For id=null entries that do have a standard alpha-2 code
const _NULL_CODE = { 'Democratic Republic of the Congo':'cd', 'U.S.':'us', 'Isle of Man':'im' };

// Languages for which the pipeline provides Wikipedia data. Others fall back to English
// as the primary URL (no "(en)" suffix — showing it on every player would be noisy).
const _WIKI_LANGS = new Set(['en', 'fr', 'de', 'it', 'es']);
export const wikiUrl = p => p.wiki_langs?.[_LANG] ?? (_WIKI_LANGS.has(_LANG) ? null : p.wiki_langs?.en ?? null);

export const countryName = (id, fallback = '') => {
  const key = id ?? fallback;
  if (_OVERRIDE[key]) return _OVERRIDE[key][_LANG];
  const code = (id != null ? whereNumeric(String(id).padStart(3, '0'))?.alpha2?.toLowerCase() : null)
               ?? _NULL_CODE[fallback] ?? null;
  if (code && _regionNames) {
    try { const n = _regionNames.of(code.toUpperCase()); if (n) return n; } catch(e) {}
  }
  return fallback || String(id);
};

// French preposition before country name (en / au / aux)
const _frPrep = name => {
  if (!name) return 'en';
  if (['États-Unis', 'Pays-Bas', 'Émirats arabes unis', 'Philippines', 'Bahamas'].some(c => name.startsWith(c))) return 'aux';
  if (['Mexique', 'Mozambique', 'Cambodge', 'Zimbabwe', 'Belize'].includes(name)) return 'au';
  if (['Haïti'].includes(name)) return 'en';
  if (/^[AEIOUYÀÂÉÈÊËÎÏÔÙÛaeiouyàâéèêëîïôùû]/.test(name) || /e$/.test(name)) return 'en';
  return 'au';
};

// French definite article before country name (le / la / l' / les)
const _frDefArt = name => {
  if (!name) return '';
  if (['États-Unis', 'Pays-Bas', 'Émirats arabes unis', 'Philippines', 'Bahamas'].some(c => name.startsWith(c))) return 'les ';
  if (['Haïti'].includes(name)) return '';
  if (/^[AEIOUYÀÂÉÈÊËÎÏÔÙÛaeiouyàâéèêëîïôùû]/.test(name)) return "l'";
  if (['Mexique', 'Mozambique', 'Cambodge', 'Zimbabwe', 'Belize'].includes(name)) return 'le ';
  if (/e$/.test(name)) return 'la ';
  return 'le ';
};

// Italian preposition "in" before country name — contracts with plural articles
const _itPrep   = name => name?.startsWith('Stati Uniti') ? 'negli' : name?.startsWith('Paesi Bassi') ? 'nei'  : 'in';
// Italian definite article for non-contracting prepositions (per gli / per i)
const _itDefArt = name => name?.startsWith('Stati Uniti') ? 'gli '  : name?.startsWith('Paesi Bassi') ? 'i '   : '';
// Italian "da" contracted with article (da dagli / dai)
const _itDa     = name => name?.startsWith('Stati Uniti') ? 'dagli' : name?.startsWith('Paesi Bassi') ? 'dai'  : 'da';

// Spanish preposition "en" before country name — adds article for plural countries
const _esPrep   = name => (name?.startsWith('Estados Unidos') || name?.startsWith('Países Bajos')) ? 'en los' : 'en';
// Spanish definite article for use after non-contracting prepositions (por los)
const _esDefArt = name => (name?.startsWith('Estados Unidos') || name?.startsWith('Países Bajos')) ? 'los '   : '';

const _CID_QUOTE  = 'Aux âmes bien nées, la sélection ne dépend point du lieu de naissance.';
const _CID_AUTHOR = 'Pierre Corneille';

// UI label strings
export const T = {
  fr: {
    noExport:      name => `Aucun joueur né ${name ? _frPrep(name) + ' ' + name : 'ici'} ne joue pour un autre pays`,
    perMillion:    "/ million d'hab.",
    ofSquad:       'de la sélection',
    noImport:      name => `Tous les joueurs de la sélection sont nés ${name ? _frPrep(name) + ' ' + name : 'ici'}`,
    selectedBy:    n => `et sélectionné${n > 1 ? 's' : ''} par un autre pays`,
    clickForAll:   'Cliquer sur le pays pour voir la liste complète',
    clickForAllPlural: 'Cliquer sur le pays pour voir les listes complètes',
    selectedByLabel: name => `Joueurs sélectionnés par ${_frDefArt(name)}${name} nés dans un autre pays`,
    ptNative:      (n, name) => name ? `joueur${n > 1 ? 's' : ''} né${n > 1 ? 's' : ''} ${_frPrep(name)} ${name} et sélectionné${n > 1 ? 's' : ''} par ${_frDefArt(name)}${name}` : `joueur${n > 1 ? 's' : ''} né${n > 1 ? 's' : ''} et sélectionné${n > 1 ? 's' : ''} ici`,
    ptImportTitle: (n, name) => `joueur${n > 1 ? 's' : ''} sélectionné${n > 1 ? 's' : ''} par ${_frDefArt(name)}${name} et né${n > 1 ? 's' : ''} dans un autre pays`,
    pop:           'pop.',
    caps:          'sél.',
    players:       n => `joueur${n > 1 ? 's' : ''}`,
    exported:      (n, name) => `joueur${n > 1 ? 's' : ''} né${n > 1 ? 's' : ''} ${name ? _frPrep(name) + ' ' + name : 'ici'}`,

    pageHeading:    'Lieu de naissance des joueurs du Mondial 2026',
    pageQuote: { text: `« ${_CID_QUOTE} »`, author: _CID_AUTHOR, work: 'Le Cid', ref: 'Acte II, sc. 2 (Don Rodrigue) · 1637', sep: ' — ' },
    pageSub:       n => `${n} joueurs au total · source : Wikipedia`,
    mapAriaLabel:  'Carte choroplèthe des pays de naissance des joueurs du Mondial 2026',
    notQualified: 'non qualifié',
    pageDescription: 'Carte choroplèthe du Mondial 2026 — pays de naissance des joueurs, dont certains jouent pour un autre pays.',
    zoomHint:      'scroll pour zoomer · glisser pour déplacer',
    zoomReset:      'réinitialiser',
    tabChain:      'Chemin le plus long',
    tabPlayersHint:'Cliquez sur un pays pour voir ses joueurs.',
    chainLegend:   { pre: 'Le plus long', bornIn: 'né en', playsFor: 'joue pour', post: 'chemin' },
    chainSubtitle: (p, c) => `Mondial 2026 · ${p} joueurs · ${c} pays`,
  },
  it: {
    noExport:      name => `Nessun giocatore nato${name ? ' ' + _itPrep(name) + ' ' + name : ' qui'} gioca per un altro paese`,
    perMillion:    '/ milione di ab.',
    ofSquad:       'della rosa',
    noImport:      name => `Tutti i giocatori della rosa sono nati${name ? ' ' + _itPrep(name) + ' ' + name : ' qui'}`,
    selectedBy:    n => `e selezionato${n === 1 ? '' : 'i'} da un altro paese`,
    clickForAll:   'Clicca sul paese per vedere la lista completa',
    clickForAllPlural: 'Clicca sul paese per vedere le liste complete',
    selectedByLabel: name => `Giocatori selezionati ${_itDa(name)} ${name} nati in un altro paese`,
    ptNative:      (n, name) => name ? `giocator${n === 1 ? 'e' : 'i'} nato${n === 1 ? '' : 'i'} ${_itPrep(name)} ${name} e selezionato${n === 1 ? '' : 'i'} per ${_itDefArt(name)}${name}` : `giocator${n === 1 ? 'e' : 'i'} nato${n === 1 ? '' : 'i'} e selezionato${n === 1 ? '' : 'i'} qui`,
    ptImportTitle: (n, name) => `giocator${n === 1 ? 'e' : 'i'} selezionato${n === 1 ? '' : 'i'} per ${_itDefArt(name)}${name} e nato${n === 1 ? '' : 'i'} in un altro paese`,
    pop:           'ab.',
    caps:          'pres.',
    players:       n => `giocator${n === 1 ? 'e' : 'i'}`,
    exported:      (n, name) => `giocator${n === 1 ? 'e nato' : 'i nati'}${name ? ' ' + _itPrep(name) + ' ' + name : ' qui'}`,
    pageHeading:    'Luogo di nascita dei giocatori dei Mondiali 2026',
    pageQuote: { text: `«${_CID_QUOTE}»`, author: _CID_AUTHOR, work: 'Le Cid', ref: 'Atto II, sc. 2 (Don Rodrigue) · 1637', sep: ' — ' },
    pageSub:       n => `${n} giocatori in totale · fonte: Wikipedia`,
    mapAriaLabel:  'Mappa coropletica dei paesi di nascita dei giocatori dei Mondiali 2026',
    notQualified: 'non qualificato',
    pageDescription: 'Mappa coropletica dei Mondiali 2026 — paesi di nascita dei giocatori, alcuni dei quali giocano per un altro paese.',
    zoomHint:      'scorri per zoomare · trascina per spostarti',
    zoomReset:      'reimposta',
    tabChain:      'Percorso più lungo',
    tabPlayersHint:'Clicca su un paese per vedere i suoi giocatori.',
    chainLegend:   { pre: 'Il più lungo', bornIn: 'nato in', playsFor: 'gioca per', post: 'cammino' },
    chainSubtitle: (p, c) => `Mondiale 2026 · ${p} giocatori · ${c} paesi`,
  },
  de: {
    noExport:      name => name ? `Kein in ${name} geborener Spieler spielt für ein anderes Land` : 'Kein hier geborener Spieler spielt für ein anderes Land',
    perMillion:    '/ Mio. Einwohner',
    ofSquad:       'im Kader',
    noImport:      name => name ? `Alle Kaderspieler wurden in ${name} geboren` : 'Alle Kaderspieler wurden hier geboren',
    selectedBy:    () => 'ausgewählt von einem anderen Land',
    clickForAll:   'Land anklicken für die vollständige Liste',
    clickForAllPlural: 'Land anklicken für die vollständigen Listen',
    selectedByLabel: name => `Von ${name} ausgewählte Spieler, geboren in einem anderen Land`,
    ptNative:      (_, name) => name ? `in ${name} geborene und für ${name} ausgewählte Spieler` : 'hier geborene und ausgewählte Spieler',
    ptImportTitle: (_, name) => name ? `für ${name} ausgewählte, woanders geborene Spieler` : 'anderswo geborene Spieler',
    pop:           'Einw.',
    caps:          'Sp.',
    players:       () => 'Spieler',
    exported:      (n, name) => name ? 'in ' + name + (n === 1 ? ' geborener Spieler' : ' geborene Spieler') : (n === 1 ? 'hier geborener Spieler' : 'hier geborene Spieler'),

    pageHeading:    'Geburtsort der Spieler der WM 2026',
    pageQuote: { text: `„${_CID_QUOTE}“`, author: _CID_AUTHOR, work: 'Le Cid', ref: 'Akt II, Sz. 2 (Don Rodrigue) · 1637', sep: ' – ' },
    pageSub:       n => `${n} Spieler insgesamt · Quelle: Wikipedia`,
    mapAriaLabel:  'Choroplethenkarte der Geburtsländer der Spieler der WM 2026',
    notQualified: 'nicht qualifiziert',
    pageDescription: 'Choroplethenkarte der WM 2026 — Geburtsländer der Spieler, darunter einige, die für ein anderes Land spielen.',
    zoomHint:      'Scrollen zum Zoomen · Ziehen zum Verschieben',
    zoomReset:      'zurücksetzen',
    tabChain:      'Längster Pfad',
    tabPlayersHint:'Klicke auf ein Land, um seine Spieler zu sehen.',
    chainLegend:   { pre: 'Der längste', bornIn: 'geboren in', playsFor: 'spielt für', post: 'Weg' },
    chainSubtitle: (p, c) => `WM 2026 · ${p} Spieler · ${c} Länder`,
  },
  es: {
    noExport:      name => `Ningún jugador nacido${name ? ' ' + _esPrep(name) + ' ' + name : ' aquí'} juega para otro país`,
    perMillion:    '/ millón de hab.',
    ofSquad:       'de la selección',
    noImport:      name => `Todos los jugadores de la selección nacieron${name ? ' ' + _esPrep(name) + ' ' + name : ' aquí'}`,
    selectedBy:    n => `y seleccionado${n === 1 ? '' : 's'} por otro país`,
    clickForAll:   'Haz clic en el país para ver la lista completa',
    clickForAllPlural: 'Haz clic en el país para ver las listas completas',
    selectedByLabel: name => `Jugadores seleccionados por ${_esDefArt(name)}${name} nacidos en otro país`,
    ptNative:      (n, name) => name ? `jugador${n === 1 ? '' : 'es'} nacido${n === 1 ? '' : 's'} ${_esPrep(name)} ${name} y seleccionado${n === 1 ? '' : 's'} por ${_esDefArt(name)}${name}` : `jugador${n === 1 ? '' : 'es'} nacido${n === 1 ? '' : 's'} y seleccionado${n === 1 ? '' : 's'} aquí`,
    ptImportTitle: (n, name) => `jugador${n === 1 ? '' : 'es'} seleccionado${n === 1 ? '' : 's'} por ${_esDefArt(name)}${name} nacido${n === 1 ? '' : 's'} en otro país`,
    pop:           'pob.',
    caps:          'int.',
    players:       n => `jugador${n === 1 ? '' : 'es'}`,
    exported:      (n, name) => `jugador${n === 1 ? '' : 'es'} nacido${n === 1 ? '' : 's'}${name ? ' ' + _esPrep(name) + ' ' + name : ' aquí'}`,

    pageHeading:    'Lugar de nacimiento de los jugadores del Mundial 2026',
    pageQuote: { text: `«${_CID_QUOTE}»`, author: _CID_AUTHOR, work: 'El Cid', ref: 'Acto II, esc. 2 (Don Rodrigo) · 1637', sep: ' — ' },
    pageSub:       n => `${n} jugadores en total · fuente: Wikipedia`,
    mapAriaLabel:  'Mapa coroplético de los países de nacimiento de los jugadores del Mundial 2026',
    notQualified: 'no clasificado',
    pageDescription: 'Mapa coroplético del Mundial 2026 — países de nacimiento de los jugadores, algunos de los cuales juegan para otro país.',
    zoomHint:      'rueda para zoom · arrastra para mover',
    zoomReset:      'restablecer',
    tabChain:      'Camino más largo',
    tabPlayersHint:'Haz clic en un país para ver sus jugadores.',
    chainLegend:   { pre: 'El más largo', bornIn: 'nacido en', playsFor: 'juega para', post: 'camino' },
    chainSubtitle: (p, c) => `Mundial 2026 · ${p} jugadores · ${c} países`,
  },
  en: {
    noExport:      name => `No player born${name ? ' in ' + name : ' here'} plays for another country`,
    perMillion:    '/ million inhab.',
    ofSquad:       'of the squad',
    noImport:      name => `All squad players were born${name ? ' in ' + name : ' here'}`,
    selectedBy:    () => 'selected by another country',
    clickForAll:   'Click the country to see the complete list',
    clickForAllPlural: 'Click the country to see the complete lists',
    selectedByLabel: name => `Players selected by ${name} born in another country`,
    ptNative:      (n, name) => name ? `player${n > 1 ? 's' : ''} born in ${name} and selected for ${name}` : `player${n > 1 ? 's' : ''} born and selected here`,
    ptImportTitle: (n, name) => `player${n > 1 ? 's' : ''} selected for ${name} born in another country`,
    pop:           'pop.',
    caps:          'caps',
    players:       n => `player${n > 1 ? 's' : ''}`,
    exported:      (n, name) => `player${n > 1 ? 's' : ''} born${name ? ' in ' + name : ' here'}`,

    pageHeading:    'Birthplace of 2026 World Cup Players',
    pageQuote: { text: `‘${_CID_QUOTE}’`, author: _CID_AUTHOR, work: 'Le Cid', ref: 'Act II, sc. 2 (Don Rodrigue) · 1637', sep: ' – ' },
    pageSub:       n => `${n} players total · source: Wikipedia`,
    mapAriaLabel:  'Choropleth map of birth countries of 2026 World Cup players',
    notQualified: 'not qualified',
    pageDescription: 'Choropleth map of the 2026 World Cup — birth countries of players, some of whom play for another country.',
    zoomHint:      'scroll to zoom · drag to pan',
    zoomReset:      'reset',
    tabChain:      'Longest path',
    tabPlayersHint:'Click a country on the map to see its players.',
    chainLegend:   { pre: 'Longest', bornIn: 'born in', playsFor: 'plays for', post: 'path' },
    chainSubtitle: (p, c) => `World Cup 2026 · ${p} players · ${c} countries`,
  },
}[_LANG];