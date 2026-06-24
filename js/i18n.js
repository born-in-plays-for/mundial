import { whereNumeric } from 'https://cdn.jsdelivr.net/npm/iso-3166-1@2/+esm';

export const LOCALE = navigator.languages?.[0] ?? navigator.language ?? 'en';
export const _LANG = LOCALE.toLowerCase().startsWith('fr') ? 'fr'
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
  383:  { fr:'Kosovo',           de:'Kosovo',                it:'Kosovo',           es:'Kosovo',            en:'Kosovo' },
  'Soviet Union':               { fr:'Union soviétique', de:'Sowjetunion',  it:'Unione Sovietica', es:'Unión Soviética',  en:'Soviet Union' },
  'Kingdom of the Netherlands': { fr:'Pays-Bas',         de:'Niederlande',  it:'Paesi Bassi',      es:'Países Bajos',     en:'Netherlands' },
};

// For id=null entries that do have a standard alpha-2 code
const _NULL_CODE = { 'Democratic Republic of the Congo':'cd', 'U.S.':'us', 'Isle of Man':'im' };

// Languages for which the pipeline provides Wikipedia data. Others fall back to English
// as the primary URL (no "(en)" suffix — showing it on every player would be noisy).
const _WIKI_LANGS = new Set(['en', 'fr', 'de', 'it', 'es']);
export const wikiUrl = p => p.wiki_langs?.[_LANG] ?? (_WIKI_LANGS.has(_LANG) ? null : p.wiki_langs?.en ?? null);

// Resolve a name from an ISO alpha-2 (or subdivision) code, e.g. 'fr', 'gb-eng'.
// Used by pages that have a code but no numeric id (chain render, standalone FIFA page).
export const regionName = (alpha2, fallback = '') => {
  const subId = {'gb-eng':8260,'gb-sct':8261,'gb-wls':8262,'gb-nir':8263}[alpha2];
  if (subId != null) return _OVERRIDE[subId][_LANG];
  if (_regionNames) try { const n = _regionNames.of(alpha2.toUpperCase()); if (n) return n; } catch(e) {}
  return fallback;
};

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

const _actRef = (act, sc, char) => ({
  fr: `Acte ${act}, sc. ${sc}${char ? ` (${char})` : ''}`,
  it: `Atto ${act}, sc. ${sc}${char ? ` (${char})` : ''}`,
  de: `Akt ${act}, Sz. ${sc}${char ? ` (${char})` : ''}`,
  es: `Acto ${act}, esc. ${sc}${char ? ` (${char === 'Don Rodrigue' ? 'Don Rodrigo' : char})` : ''}`,
  en: `Act ${act}, sc. ${sc}${char ? ` (${char})` : ''}`,
});
const _QUOTES = [
  { text: "Mais où sont les sélections d'antan ?",
    original: "Mais où sont les neiges d'antan ?",
    author: 'François Villon', work: { fr: 'Ballade des dames du temps jadis', en: 'Ballad of the Ladies of Times Past', de: 'Ballade der Damen vergangener Zeiten', it: 'Ballata delle dame del tempo passato', es: 'Balada de las damas de antaño' }, ref: '', date: '1461' },
  { text: "Heureux qui, comme Olise, a fait un beau voyage.",
    original: "Heureux qui, comme Ulysse, a fait un beau voyage.",
    author: 'Joachim du Bellay', work: { fr: 'Les Regrets', en: 'The Regrets', de: 'Les Regrets', it: 'I Rimpianti', es: 'Los Pesares' }, ref: '', date: '1558' },
  { text: "Il faut voyager pour frotter et limer ses crampons contre les mollets d'autrui.",
    original: "Il faut voyager pour frotter et limer sa cervelle contre celle d'autrui.",
    author: 'Michel de Montaigne', work: { fr: 'Essais', en: 'Essays', de: 'Essais', it: 'Saggi', es: 'Ensayos' }, ref: '', date: '1580' },
  { text: 'Aux âmes bien nées, la sélection ne dépend point du lieu de naissance.',
    original: "Aux âmes bien nées, la valeur n'attend point le nombre des années.",
    author: 'Pierre Corneille', work: { fr: 'Le Cid', en: 'The Cid', de: 'Der Cid', it: 'Il Cid', es: 'El Cid' }, ref: _actRef('II', '2', 'Don Rodrigue'), date: '1637' },
  { text: "Je pense, donc je suis sélectionné.",
    original: "Je pense, donc je suis.",
    author: 'René Descartes', work: { fr: 'Discours de la méthode', en: 'Discourse on the Method', de: 'Abhandlung über die Methode', it: 'Discorso sul metodo', es: 'Discurso del método' }, ref: '', date: '1637' },
  { text: 'Rien ne sert de naître, il faut partir en sélection à point.',
    original: 'Rien ne sert de courir, il faut partir à point.',
    author: 'Jean de La Fontaine', work: { fr: 'Fables', en: 'Fables', de: 'Fabeln', it: 'Favole', es: 'Fábulas' }, ref: { fr: 'Le Lièvre et la Tortue (VI, 10)', en: 'The Hare and the Tortoise (VI, 10)', de: 'Der Hase und die Schildkröte (VI, 10)', it: 'La lepre e la tartaruga (VI, 10)', es: 'La liebre y la tortuga (VI, 10)' }, date: '1668' },
  { text: 'La sélection du plus fort est toujours la meilleure.',
    original: 'La raison du plus fort est toujours la meilleure.',
    author: 'Jean de La Fontaine', work: { fr: 'Fables', en: 'Fables', de: 'Fabeln', it: 'Favole', es: 'Fábulas' }, ref: { fr: "Le Loup et l'Agneau (I, 10)", en: 'The Wolf and the Lamb (I, 10)', de: 'Der Wolf und das Lamm (I, 10)', it: "Il lupo e l'agnello (I, 10)", es: 'El lobo y el cordero (I, 10)' }, date: '1668' },
  { text: "Un seul sélectionné vous manque et tout est dépeuplé.",
    original: "Un seul être vous manque et tout est dépeuplé.",
    author: 'Alphonse de Lamartine', work: { fr: "L'Isolement", en: 'Isolation', de: 'Die Einsamkeit', it: "L'Isolamento", es: 'El Aislamiento' }, ref: '', date: '1820' },
  { text: "La sélection, c'est le vol.",
    original: "La propriété, c'est le vol.",
    author: 'Pierre-Joseph Proudhon', work: { fr: "Qu'est-ce que la propriété ?", en: 'What Is Property?', de: 'Was ist Eigentum?', it: "Che cos'è la proprietà?", es: '¿Qué es la propiedad?' }, ref: '', date: '1840' },
  { text: "Je suis le ténébreux, le veuf, le sélectionné.",
    original: "Je suis le ténébreux, le veuf, l'inconsolé.",
    author: 'Gérard de Nerval', work: 'El Desdichado', ref: '', date: '1854' },
  { text: "Je est un autre sélectionné.",
    original: "Je est un autre.",
    author: 'Arthur Rimbaud', work: { fr: 'Lettre du voyant', en: 'Letter of the Seer', de: 'Brief des Sehers', it: 'Lettera del veggente', es: 'Carta del vidente' }, ref: '', date: '1871' },
  { text: "Longtemps, j'ai été sélectionné de bonne heure.",
    original: "Longtemps, je me suis couché de bonne heure.",
    author: 'Marcel Proust', work: { fr: 'Du côté de chez Swann', en: "Swann's Way", de: 'In Swanns Welt', it: 'La strada di Swann', es: 'Por el camino de Swann' }, ref: '', date: '1913' },
  { text: "La coupe du monde voit s'opposer des pays qui sélectionnent des joueurs qui n'y sont pas nés, aux pays qui les ont vus naître mais ne les sélectionnent pas.",
    original: "La guerre est un massacre de gens qui ne se connaissent pas au profit de gens qui se connaissent mais ne se massacrent pas.",
    author: 'Paul Valéry', work: { fr: 'Cahiers', en: 'Notebooks', de: 'Hefte', it: 'Quaderni', es: 'Cuadernos' }, ref: '', date: '1941' },
  { text: 'Il faut imaginer le sélectionné heureux.',
    original: 'Il faut imaginer Sisyphe heureux.',
    author: 'Albert Camus', work: { fr: 'Le Mythe de Sisyphe', en: 'The Myth of Sisyphus', de: 'Der Mythos des Sisyphos', it: 'Il mito di Sisifo', es: 'El mito de Sísifo' }, ref: '', date: '1942' },
  { text: 'On ne naît pas sélectionné, on le devient.',
    original: 'On ne naît pas femme, on le devient.',
    author: 'Simone de Beauvoir', work: { fr: 'Le Deuxième Sexe', en: 'The Second Sex', de: 'Das andere Geschlecht', it: 'Il secondo sesso', es: 'El segundo sexo' }, ref: { fr: 't. II', en: 'vol. II', de: 'Bd. II', it: 'vol. II', es: 'vol. II' }, date: '1949' },
]; 
const _QUOTES_ASIDE = [  { text: "Il calcio è l'ultima rappresentazione sacra del nostro tempo.",
    author: 'Pier Paolo Pasolini',
    work: { fr: 'article paru dans Il Giorno', it: 'articolo pubblicato su Il Giorno', de: 'Artikel erschienen in Il Giorno', es: 'artículo publicado en Il Giorno', en: 'article published in Il Giorno' },
    ref: { fr: '3 janvier', it: '3 gennaio', de: '3. Januar', es: '3 de enero', en: 'January 3' }, date: '1971' },
  { text: "Après avoir vu ça, on peut mourir tranquille… mais le plus tard possible.",
    author: 'Thierry Roland', work: { fr: 'Finale de la Coupe du monde', en: 'World Cup Final', de: 'WM-Finale', it: 'Finale della Coppa del Mondo', es: 'Final de la Copa del Mundo' }, ref: { fr: 'commentaire TF1', en: 'TF1 commentary', de: 'TF1-Kommentar', it: 'commento TF1', es: 'comentario TF1' }, date: '1998' },
];
const _Q = { fr: t => `« ${t} »`, it: t => `«${t}»`, de: t => `„${t}“`, es: t => `«${t}»`, en: t => `‘${t}’` };
const _SEP = { fr: ' — ', it: ' — ', de: ' – ', es: ' — ', en: ' – ' };
const _fmtQuotes = lang => _QUOTES.map(q => ({
  text: _Q[lang](q.text), author: q.author,
  original: q.original ? _Q[lang](q.original) : undefined,
  work: typeof q.work === 'object' ? (q.work[lang] ?? q.work.fr) : q.work,
  ref: typeof q.ref === 'object' ? (q.ref[lang] ?? q.ref.fr) : q.ref,
  sep: _SEP[lang], date: q.date,
}));
// UI label strings
export const T = {
  fr: {
    pageHeading:    'Lieu de naissance des joueurs du Mondial 2026',
    pageDescription: 'Carte choroplèthe du Mondial 2026 — pays de naissance des joueurs, dont certains jouent pour un autre pays.',
    pageQuotes: _fmtQuotes('fr'),
    pageSub:       n => `${n} joueurs au total · source : Wikipedia`,
    mapAriaLabel:  'Carte choroplèthe des pays de naissance des joueurs du Mondial 2026',

    zoomHint:      'scroll pour zoomer · glisser pour déplacer',
    notQualified: 'non qualifié',

    tabPlayersHint:'Cliquez sur un pays pour voir ses joueurs.',

    noExport:      name => `Aucun joueur né ${name ? _frPrep(name) + ' ' + name : 'ici'} n'est sélectionné par un autre pays qualifié.`,
    noImport:      name => `Tous les joueurs de la sélection sont nés ${name ? _frPrep(name) + ' ' + name : 'ici'}`,
    selectedBy:    n => `et sélectionné${n > 1 ? 's' : ''} par un autre pays`,
    selectedByLabel: name => `Joueurs sélectionnés par ${_frDefArt(name)}${name} nés dans un autre pays`,
    clickForAll:   'Cliquer sur le pays pour voir la liste complète',
    clickForAllPlural: 'Cliquer sur le pays pour voir les listes complètes',
    perMillion:    "/ million d'hab.",
    ofSquad:       'de la sélection',
    pop:           'pop.',
    cap:           'cap.',
    caps:          'sél.',
    coach:         'sélectionneur',
    players:       n => `joueur${n > 1 ? 's' : ''}`,
    exported:      (n, name) => `joueur${n > 1 ? 's' : ''} né${n > 1 ? 's' : ''} ${name ? _frPrep(name) + ' ' + name : 'ici'}`,

    ptNative:      (n, name) => name ? `joueur${n > 1 ? 's' : ''} né${n > 1 ? 's' : ''} ${_frPrep(name)} ${name} et sélectionné${n > 1 ? 's' : ''} par ${_frDefArt(name)}${name}` : `joueur${n > 1 ? 's' : ''} né${n > 1 ? 's' : ''} et sélectionné${n > 1 ? 's' : ''} ici`,
    ptImportTitle: (n, name) => `joueur${n > 1 ? 's' : ''} sélectionné${n > 1 ? 's' : ''} par ${_frDefArt(name)}${name} et né${n > 1 ? 's' : ''} dans un autre pays`,

    chainLegend:   { pre: 'Le plus long', bornIn: 'né en', playsFor: 'joue pour', post: 'chemin' },
    chainSubtitle: (p, c) => `${p} joueurs · ${c} pays`,
    eloSource:   'source : ',
    eloUpdated:  'mis à jour le ',
    eloFilter:   'filtre',
    legendCountries: 'pays', legendBorn: 'nés',
    sortLabels: { action: 'tri', elo: 'classement', exp: 'exports', imp: 'imports', pop: 'population', delta: 'Δ', alpha: 'A–Z' },
    filterLabels: { action: 'filtre', exporter: 'export.', nonExp: 'non-exp.', qualified: 'qualifié', importer: 'import.', nonImp: 'non-imp.', nonQual: 'non-qual.' },
    navHome: 'Accueil', navFrance: 'France par département', navLive: 'Match en direct', navAdmin: 'Admin', navSignIn: 'Connexion', navSignOut: 'Déconnexion',
    offlineTitle: 'Serveur indisponible', offlineHappened: 'Que s’est-il passé ?',
    offlineBody: 'Certaines fonctionnalités nécessitent un serveur qui ne tourne pas en permanence. La carte, les données et la navigation fonctionnent sans lui. Seuls l’authentification et le suivi en direct sont affectés.',
    offlineContact: 'Besoin de le démarrer ?', offlineContactBody: 'Contactez Christophe Thiebaud sur WhatsApp pour lui demander de démarrer le serveur :',
    offlineWaTip: 'Demander à Christophe Thiebaud de le démarrer',
    liveTitle: 'Match en direct', liveSubtitle: 'Coupe du monde 2026',
    liveConnecting: 'Connexion au serveur…', liveNotRunning: 'Le serveur ne tourne pas.',
    liveRetrying: s => `Nouvelle tentative dans <span style="font-family:monospace">${s}</span>s…`,
    liveNoBackend: 'serveur arrêté', liveBadgeConnecting: 'connexion…', liveLastKnown: 'dernières données',
    liveNoMatch: 'Aucun match de la Coupe du monde en cours.',
    liveLive: 'en direct', liveMatches: (n) => n > 1 ? `${n} matchs` : '1 match',
    liveError: 'erreur', liveCoach: 'Sélectionneur', liveStartXI: 'Titulaires', liveSubs: 'Remplaçants',
    liveBornIn: (c) => `Né en ${c}`, liveLineupsNA: 'Compositions non encore disponibles.',
    liveStatLabel: (type) => ({'Ball Possession':'Possession','Total Shots':'Tirs','Shots on Goal':'Tirs cadrés','Shots off Goal':'Tirs non cadrés','Blocked Shots':'Tirs bloqués','Shots insidebox':'Tirs dans la surface','Shots outsidebox':'Tirs hors surface','Fouls':'Fautes','Corner Kicks':'Corners','Offsides':'Hors-jeu','Yellow Cards':'Cartons jaunes','Red Cards':'Cartons rouges','Goalkeeper Saves':'Arrêts','Total passes':'Passes','Passes accurate':'Passes réussies','Passes %':'Passes %','expected_goals':'Buts attendus (xG)'}[type] ?? type),
    liveGroup: g => `Groupe ${g}`, liveP: 'J', liveW: 'V', liveD: 'N', liveL: 'D', liveGF: 'BP', liveGA: 'BC', liveGD: 'DB', livePts: 'Pts',
    liveStats: 'Statistiques', liveLineups: 'Compositions',
  },
  it: {
    pageHeading:    'Luogo di nascita dei giocatori dei Mondiali 2026',
    pageDescription: 'Mappa coropletica dei Mondiali 2026 — paesi di nascita dei giocatori, alcuni dei quali giocano per un altro paese.',
    pageQuotes: _fmtQuotes('it'),
    pageSub:       n => `${n} giocatori in totale · fonte: Wikipedia`,
    mapAriaLabel:  'Mappa coropletica dei paesi di nascita dei giocatori dei Mondiali 2026',

    zoomHint:      'scorri per zoomare · trascina per spostarti',
    notQualified: 'non qualificato',

    tabPlayersHint:'Clicca su un paese per vedere i suoi giocatori.',

    noExport:      name => `Nessun giocatore nato${name ? ' ' + _itPrep(name) + ' ' + name : ' qui'} è selezionato da un altro paese qualificato.`,
    noImport:      name => `Tutti i giocatori della rosa sono nati${name ? ' ' + _itPrep(name) + ' ' + name : ' qui'}`,
    selectedBy:    n => `e selezionat${n === 1 ? 'o' : 'i'} da un altro paese`,
    selectedByLabel: name => `Giocatori selezionati ${_itDa(name)} ${name} nati in un altro paese`,
    clickForAll:   'Clicca sul paese per vedere la lista completa',
    clickForAllPlural: 'Clicca sul paese per vedere le liste complete',
    perMillion:    '/ milione di ab.',
    ofSquad:       'della rosa',
    pop:           'ab.',
    cap:           'cap.',
    caps:          'pres.',
    coach:         'allenatore',
    players:       n => `giocator${n === 1 ? 'e' : 'i'}`,
    exported:      (n, name) => `giocator${n === 1 ? 'e nato' : 'i nati'}${name ? ' ' + _itPrep(name) + ' ' + name : ' qui'}`,

    ptNative:      (n, name) => name ? `giocator${n === 1 ? 'e' : 'i'} nat${n === 1 ? 'o' : 'i'} ${_itPrep(name)} ${name} e selezionat${n === 1 ? 'o' : 'i'} per ${_itDefArt(name)}${name}` : `giocator${n === 1 ? 'e' : 'i'} nat${n === 1 ? 'o' : 'i'} e selezionat${n === 1 ? 'o' : 'i'} qui`,
    ptImportTitle: (n, name) => `giocator${n === 1 ? 'e' : 'i'} selezionat${n === 1 ? 'o' : 'i'} per ${_itDefArt(name)}${name} e nat${n === 1 ? 'o' : 'i'} in un altro paese`,

    chainLegend:   { pre: 'Il più lungo', bornIn: 'nato in', playsFor: 'gioca per', post: 'cammino' },
    chainSubtitle: (p, c) => `${p} giocatori · ${c} paesi`,
    eloSource:   'fonte: ',
    eloUpdated:  'aggiornato il ',
    eloFilter:   'filtro',
    legendCountries: 'paesi', legendBorn: 'nati',
    sortLabels: { action: 'ordine', elo: 'classifica', exp: 'export', imp: 'import', pop: 'popolazione', delta: 'Δ', alpha: 'A–Z' },
    filterLabels: { action: 'filtro', exporter: 'export.', nonExp: 'non-exp.', qualified: 'qualific.', importer: 'import.', nonImp: 'non-imp.', nonQual: 'non-qual.' },
    navHome: 'Home', navFrance: 'Francia per dipartimento', navLive: 'Partita in diretta', navAdmin: 'Admin', navSignIn: 'Accedi', navSignOut: 'Esci',
    offlineTitle: 'Backend non disponibile', offlineHappened: 'Cosa è successo:',
    offlineBody: "Alcune funzionalità richiedono un server che non è sempre attivo. La mappa, i dati e la navigazione funzionano senza. Solo l'autenticazione e gli aggiornamenti in diretta sono interessati.",
    offlineContact: 'Serve avviarlo?', offlineContactBody: 'Contatta Christophe Thiebaud su WhatsApp per chiedergli di avviare il server:',
    offlineWaTip: 'Chiedi a Christophe Thiebaud di avviarlo',
    liveTitle: 'Partita in diretta', liveSubtitle: 'Coppa del mondo 2026',
    liveConnecting: 'Connessione al server…', liveNotRunning: 'Il server non è attivo.',
    liveRetrying: s => `Nuovo tentativo tra <span style="font-family:monospace">${s}</span>s…`,
    liveNoBackend: 'server fermo', liveBadgeConnecting: 'connessione…', liveLastKnown: 'ultimi dati',
    liveNoMatch: 'Nessuna partita della Coppa del mondo in corso.',
    liveLive: 'in diretta', liveMatches: (n) => n > 1 ? `${n} partite` : '1 partita',
    liveError: 'errore', liveCoach: 'Allenatore', liveStartXI: 'Titolari', liveSubs: 'Sostituti',
    liveBornIn: (c) => `Nato in ${c}`, liveLineupsNA: 'Formazioni non ancora disponibili.',
    liveStatLabel: (type) => ({'Ball Possession':'Possesso palla','Total Shots':'Tiri totali','Shots on Goal':'Tiri in porta','Shots off Goal':'Tiri fuori','Blocked Shots':'Tiri bloccati','Shots insidebox':'Tiri in area','Shots outsidebox':'Tiri fuori area','Fouls':'Falli','Corner Kicks':'Calci d\'angolo','Offsides':'Fuorigioco','Yellow Cards':'Cartellini gialli','Red Cards':'Cartellini rossi','Goalkeeper Saves':'Parate','Total passes':'Passaggi','Passes accurate':'Passaggi riusciti','Passes %':'Passaggi %','expected_goals':'Gol attesi (xG)'}[type] ?? type),
    liveGroup: g => `Girone ${g}`, liveP: 'G', liveW: 'V', liveD: 'P', liveL: 'S', liveGF: 'GF', liveGA: 'GS', liveGD: 'DR', livePts: 'Pti',
    liveStats: 'Statistiche', liveLineups: 'Formazioni',
  },
  de: {
    pageHeading:    'Geburtsort der Spieler der WM 2026',
    pageDescription: 'Choroplethenkarte der WM 2026 — Geburtsländer der Spieler, darunter einige, die für ein anderes Land spielen.',
    pageQuotes: _fmtQuotes('de'),
    pageSub:       n => `${n} Spieler insgesamt · Quelle: Wikipedia`,
    mapAriaLabel:  'Choroplethenkarte der Geburtsländer der Spieler der WM 2026',

    zoomHint:      'Scrollen zum Zoomen · Ziehen zum Verschieben',
    notQualified: 'nicht qualifiziert',

    tabPlayersHint:'Klicke auf ein Land, um seine Spieler zu sehen.',

    noExport:      name => name ? `Kein in ${name} geborener Spieler wird von einem anderen qualifizierten Land aufgestellt.` : 'Kein hier geborener Spieler wird von einem anderen qualifizierten Land aufgestellt.',
    noImport:      name => name ? `Alle Kaderspieler wurden in ${name} geboren` : 'Alle Kaderspieler wurden hier geboren',
    selectedBy:    () => 'ausgewählt von einem anderen Land',
    selectedByLabel: name => `Von ${name} ausgewählte Spieler, geboren in einem anderen Land`,
    clickForAll:   'Land anklicken für die vollständige Liste',
    clickForAllPlural: 'Land anklicken für die vollständigen Listen',
    perMillion:    '/ Mio. Einwohner',
    ofSquad:       'im Kader',
    pop:           'Einw.',
    cap:           'Hptst.',
    caps:          'Sp.',
    coach:         'Trainer',
    players:       () => 'Spieler',
    exported:      (n, name) => name ? 'in ' + name + (n === 1 ? ' geborener Spieler' : ' geborene Spieler') : (n === 1 ? 'hier geborener Spieler' : 'hier geborene Spieler'),

    ptNative:      (_, name) => name ? `in ${name} geborene und für ${name} ausgewählte Spieler` : 'hier geborene und ausgewählte Spieler',
    ptImportTitle: (_, name) => name ? `für ${name} ausgewählte, woanders geborene Spieler` : 'anderswo geborene Spieler',

    chainLegend:   { pre: 'Der längste', bornIn: 'geboren in', playsFor: 'spielt für', post: 'Weg' },
    chainSubtitle: (p, c) => `${p} Spieler · ${c} Länder`,
    eloSource:   'Quelle: ',
    eloUpdated:  'aktualisiert am ',
    eloFilter:   'Filter',
    legendCountries: 'Länder', legendBorn: 'geboren',
    sortLabels: { action: 'Sort.', elo: 'Rang', exp: 'Export', imp: 'Import', pop: 'Bevölkerung', delta: 'Δ', alpha: 'A–Z' },
    filterLabels: { action: 'Filter', exporter: 'Export.', nonExp: 'kein-Exp.', qualified: 'qualif.', importer: 'Import.', nonImp: 'kein-Imp.', nonQual: 'nicht-qual.' },
    navHome: 'Startseite', navFrance: 'Frankreich nach Departement', navLive: 'Live-Spiel', navAdmin: 'Admin', navSignIn: 'Anmelden', navSignOut: 'Abmelden',
    offlineTitle: 'Backend nicht erreichbar', offlineHappened: 'Was ist passiert:',
    offlineBody: 'Einige Funktionen benötigen einen Backend-Server, der nicht immer läuft. Karte, Daten und Navigation funktionieren ohne ihn. Nur Anmeldung und Live-Spielaktualisierungen sind betroffen.',
    offlineContact: 'Soll er gestartet werden?', offlineContactBody: 'Kontaktieren Sie Christophe Thiebaud auf WhatsApp und bitten Sie ihn, den Server zu starten:',
    offlineWaTip: 'Christophe Thiebaud bitten, ihn zu starten',
    liveTitle: 'Live-Spiel', liveSubtitle: 'WM 2026',
    liveConnecting: 'Verbindung zum Server…', liveNotRunning: 'Der Server läuft nicht.',
    liveRetrying: s => `Neuer Versuch in <span style="font-family:monospace">${s}</span>s…`,
    liveNoBackend: 'Server gestoppt', liveBadgeConnecting: 'verbinde…', liveLastKnown: 'letzter Stand',
    liveNoMatch: 'Kein WM-Spiel gerade live.',
    liveLive: 'live', liveMatches: (n) => n > 1 ? `${n} Spiele` : '1 Spiel',
    liveError: 'Fehler', liveCoach: 'Trainer', liveStartXI: 'Startelf', liveSubs: 'Ersatzspieler',
    liveBornIn: (c) => `Geboren in ${c}`, liveLineupsNA: 'Aufstellungen noch nicht verfügbar.',
    liveStatLabel: (type) => ({'Ball Possession':'Ballbesitz','Total Shots':'Torschüsse','Shots on Goal':'Schüsse aufs Tor','Shots off Goal':'Schüsse daneben','Blocked Shots':'Geblockte Schüsse','Shots insidebox':'Schüsse im Strafraum','Shots outsidebox':'Schüsse außerhalb','Fouls':'Fouls','Corner Kicks':'Ecken','Offsides':'Abseits','Yellow Cards':'Gelbe Karten','Red Cards':'Rote Karten','Goalkeeper Saves':'Torwartparaden','Total passes':'Pässe','Passes accurate':'Pässe erfolgreich','Passes %':'Pässe %','expected_goals':'Erwartete Tore (xG)'}[type] ?? type),
    liveGroup: g => `Gruppe ${g}`, liveP: 'Sp', liveW: 'S', liveD: 'U', liveL: 'N', liveGF: 'T', liveGA: 'GT', liveGD: 'TD', livePts: 'Pkt',
    liveStats: 'Statistiken', liveLineups: 'Aufstellungen',
  },
  es: {
    pageHeading:    'Lugar de nacimiento de los jugadores del Mundial 2026',
    pageDescription: 'Mapa coroplético del Mundial 2026 — países de nacimiento de los jugadores, algunos de los cuales juegan para otro país.',
    pageQuotes: _fmtQuotes('es'),
    pageSub:       n => `${n} jugadores en total · fuente: Wikipedia`,
    mapAriaLabel:  'Mapa coroplético de los países de nacimiento de los jugadores del Mundial 2026',

    zoomHint:      'rueda para zoom · arrastra para mover',
    notQualified: 'no clasificado',

    tabPlayersHint:'Haz clic en un país para ver sus jugadores.',

    noExport:      name => `Ningún jugador nacido${name ? ' ' + _esPrep(name) + ' ' + name : ' aquí'} es seleccionado por otro país clasificado.`,
    noImport:      name => `Todos los jugadores de la selección nacieron${name ? ' ' + _esPrep(name) + ' ' + name : ' aquí'}`,
    selectedBy:    n => `y seleccionado${n === 1 ? '' : 's'} por otro país`,
    selectedByLabel: name => `Jugadores seleccionados por ${_esDefArt(name)}${name} nacidos en otro país`,
    clickForAll:   'Haz clic en el país para ver la lista completa',
    clickForAllPlural: 'Haz clic en el país para ver las listas completas',
    perMillion:    '/ millón de hab.',
    ofSquad:       'de la selección',
    pop:           'pob.',
    cap:           'cap.',
    caps:          'int.',
    coach:         'entrenador',
    players:       n => `jugador${n === 1 ? '' : 'es'}`,
    exported:      (n, name) => `jugador${n === 1 ? '' : 'es'} nacido${n === 1 ? '' : 's'}${name ? ' ' + _esPrep(name) + ' ' + name : ' aquí'}`,

    ptNative:      (n, name) => name ? `jugador${n === 1 ? '' : 'es'} nacido${n === 1 ? '' : 's'} ${_esPrep(name)} ${name} y seleccionado${n === 1 ? '' : 's'} por ${_esDefArt(name)}${name}` : `jugador${n === 1 ? '' : 'es'} nacido${n === 1 ? '' : 's'} y seleccionado${n === 1 ? '' : 's'} aquí`,
    ptImportTitle: (n, name) => `jugador${n === 1 ? '' : 'es'} seleccionado${n === 1 ? '' : 's'} por ${_esDefArt(name)}${name} nacido${n === 1 ? '' : 's'} en otro país`,

    chainLegend:   { pre: 'El más largo', bornIn: 'nacido en', playsFor: 'juega para', post: 'camino' },
    chainSubtitle: (p, c) => `${p} jugadores · ${c} países`,
    eloSource:   'fuente: ',
    eloUpdated:  'actualizado el ',
    eloFilter:   'filtro',
    legendCountries: 'países', legendBorn: 'nacidos',
    sortLabels: { action: 'orden', elo: 'ranking', exp: 'exports', imp: 'imports', pop: 'población', delta: 'Δ', alpha: 'A–Z' },
    filterLabels: { action: 'filtro', exporter: 'export.', nonExp: 'no-exp.', qualified: 'clasific.', importer: 'import.', nonImp: 'no-imp.', nonQual: 'no-clasif.' },
    navHome: 'Inicio', navFrance: 'Francia por departamento', navLive: 'Partido en vivo', navAdmin: 'Admin', navSignIn: 'Iniciar sesión', navSignOut: 'Cerrar sesión',
    offlineTitle: 'Backend no disponible', offlineHappened: '¿Qué pasó?',
    offlineBody: 'Algunas funciones requieren un servidor que no siempre está activo. El mapa, los datos y la navegación funcionan sin él. Solo la autenticación y las actualizaciones en directo se ven afectadas.',
    offlineContact: '¿Necesitas que se inicie?', offlineContactBody: 'Contacta a Christophe Thiebaud por WhatsApp para pedirle que inicie el servidor:',
    offlineWaTip: 'Pedir a Christophe Thiebaud que lo inicie',
    liveTitle: 'Partido en vivo', liveSubtitle: 'Copa del mundo 2026',
    liveConnecting: 'Conectando al servidor…', liveNotRunning: 'El servidor no está activo.',
    liveRetrying: s => `Reintentando en <span style="font-family:monospace">${s}</span>s…`,
    liveNoBackend: 'servidor parado', liveBadgeConnecting: 'conectando…', liveLastKnown: 'últimos datos',
    liveNoMatch: 'Ningún partido de la Copa del mundo en curso.',
    liveLive: 'en vivo', liveMatches: (n) => n > 1 ? `${n} partidos` : '1 partido',
    liveError: 'error', liveCoach: 'Director técnico', liveStartXI: 'Titulares', liveSubs: 'Suplentes',
    liveBornIn: (c) => `Nacido en ${c}`, liveLineupsNA: 'Alineaciones aún no disponibles.',
    liveStatLabel: (type) => ({'Ball Possession':'Posesión','Total Shots':'Tiros totales','Shots on Goal':'Tiros a puerta','Shots off Goal':'Tiros fuera','Blocked Shots':'Tiros bloqueados','Shots insidebox':'Tiros dentro del área','Shots outsidebox':'Tiros fuera del área','Fouls':'Faltas','Corner Kicks':'Córners','Offsides':'Fueras de juego','Yellow Cards':'Tarjetas amarillas','Red Cards':'Tarjetas rojas','Goalkeeper Saves':'Paradas','Total passes':'Pases','Passes accurate':'Pases precisos','Passes %':'Pases %','expected_goals':'Goles esperados (xG)'}[type] ?? type),
    liveGroup: g => `Grupo ${g}`, liveP: 'PJ', liveW: 'G', liveD: 'E', liveL: 'P', liveGF: 'GF', liveGA: 'GC', liveGD: 'DG', livePts: 'Pts',
    liveStats: 'Estadísticas', liveLineups: 'Alineaciones',
  },
  en: {
    pageHeading:    'Birthplace of 2026 World Cup Players',
    pageDescription: 'Choropleth map of the 2026 World Cup — birth countries of players, some of whom play for another country.',
    pageQuotes: _fmtQuotes('en'),
    pageSub:       n => `${n} players total · source: Wikipedia`,
    mapAriaLabel:  'Choropleth map of birth countries of 2026 World Cup players',

    zoomHint:      'scroll to zoom · drag to pan',
    notQualified: 'not qualified',

    tabPlayersHint:'Click a country on the map to see its players.',

    noExport:      name => `No player born${name ? ' in ' + name : ' here'} is selected by another qualified country.`,
    noImport:      name => `All squad players were born${name ? ' in ' + name : ' here'}`,
    selectedBy:    () => 'selected by another country',
    selectedByLabel: name => `Players selected by ${name} born in another country`,
    clickForAll:   'Click the country to see the complete list',
    clickForAllPlural: 'Click the country to see the complete lists',
    perMillion:    '/ million inhab.',
    ofSquad:       'of the squad',
    pop:           'pop.',
    cap:           'cap.',
    caps:          'caps',
    coach:         'coach',
    players:       n => `player${n > 1 ? 's' : ''}`,
    exported:      (n, name) => `player${n > 1 ? 's' : ''} born${name ? ' in ' + name : ' here'}`,

    ptNative:      (n, name) => name ? `player${n > 1 ? 's' : ''} born in ${name} and selected for ${name}` : `player${n > 1 ? 's' : ''} born and selected here`,
    ptImportTitle: (n, name) => `player${n > 1 ? 's' : ''} selected for ${name} born in another country`,

    chainLegend:   { pre: 'Longest', bornIn: 'born in', playsFor: 'plays for', post: 'path' },
    chainSubtitle: (p, c) => `${p} players · ${c} countries`,
    eloSource:   'source: ',
    eloUpdated:  'updated ',
    eloFilter:   'filter',
    legendCountries: 'countries', legendBorn: 'born',
    sortLabels: { action: 'sort', elo: 'ranking', exp: 'exports', imp: 'imports', pop: 'population', delta: 'Δ', alpha: 'A–Z' },
    filterLabels: { action: 'filter', exporter: 'exporter', nonExp: 'non-exp.', qualified: 'qualified', importer: 'importer', nonImp: 'non-imp.', nonQual: 'non-qual.' },
    navHome: 'Home', navFrance: 'France by department', navLive: 'Live game', navAdmin: 'Admin', navSignIn: 'Sign in', navSignOut: 'Sign out',
    offlineTitle: 'Backend unavailable', offlineHappened: 'What happened:',
    offlineBody: 'Some features require a backend server that is not always running. The map, data, and navigation work fine without it. Only authentication and live game updates are affected.',
    offlineContact: 'Need it started?', offlineContactBody: 'Contact Christophe Thiebaud on WhatsApp and ask him to start the server:',
    offlineWaTip: 'Ask Christophe Thiebaud to start it',
    liveTitle: 'Live Game', liveSubtitle: 'World Cup 2026',
    liveConnecting: 'Connecting to backend…', liveNotRunning: 'Backend is not running.',
    liveRetrying: s => `Retrying in <span style="font-family:monospace">${s}</span>s…`,
    liveNoBackend: 'server down', liveBadgeConnecting: 'connecting…', liveLastKnown: 'last known',
    liveNoMatch: 'No World Cup match currently live.',
    liveLive: 'live', liveMatches: (n) => n > 1 ? `${n} matches` : '1 match',
    liveError: 'error', liveCoach: 'Coach', liveStartXI: 'Starting XI', liveSubs: 'Substitutes',
    liveBornIn: (c) => `Born in ${c}`, liveLineupsNA: 'Lineups not yet available.',
    liveStatLabel: (type) => ({'Ball Possession':'Possession','Shots insidebox':'Shots inside box','Shots outsidebox':'Shots outside box','Total passes':'Total Passes','Passes accurate':'Accurate Passes','expected_goals':'Expected Goals (xG)'}[type] ?? type),
    liveGroup: g => `Group ${g}`, liveP: 'P', liveW: 'W', liveD: 'D', liveL: 'L', liveGF: 'GF', liveGA: 'GA', liveGD: 'GD', livePts: 'Pts',
    liveStats: 'Statistics', liveLineups: 'Lineups',
  },
}[_LANG];