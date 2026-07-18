import { _LANG, countryName } from './i18n.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@14/+esm';
import mermaid from 'https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.esm.min.mjs';

mermaid.initialize({ startOnLoad: false, theme: 'neutral', fontFamily: 'inherit' });

let _active = false;
let _showingId = null;
let _pageId = null;
let _panel = null;
let _navHandler = null;
let _escHandler = null;
let _authStateHandler = null;

const _CURRENT_STATE_LABEL = { fr: 'État actuel', de: 'Aktueller Status', it: 'Stato attuale', es: 'Estado actual' };

const _WIP_HTML = `<div class="gp-wip-banner"><div class="gp-wip-box">
  <div class="gp-wip-title">WORK IN PROGRESS</div>
  <div class="gp-wip-sub">This guide section is under construction.</div>
</div></div>`;

// Distinct from _WIP_HTML: a fetch/network failure (page exists, couldn't load it right now)
// used to render identically to "genuinely no content yet" (_WIP_HTML), which was
// indistinguishable in the UI — see _fetchContent's `failed` flag.
const _ERROR_HTML = `<div class="gp-wip-banner"><div class="gp-wip-box">
  <div class="gp-wip-title">COULDN'T LOAD</div>
  <div class="gp-wip-sub">Check your connection and try again.</div>
</div></div>`;

// 'map' and 'api' are the 2 real, page-tied guide topics — see auth-bar.js's own
// _guideIdMap comment for why 'api' now points at the Players page rather than the
// retired wc2026_countries.html. 'auth' and 'default' are deliberately absent here: neither
// is tied to one specific page (auth is reachable from the profile icon on any page; default
// is whatever page you're already on), so there's nothing to navigate to when toggling guide
// mode off from either — see toggleGuide's own `if (dest)` guard below.
const _guideToPage = {
  map: '/',
  api: 'wc2026_players.html',
};

const _ARROW_BLUE = '<svg class="gp-arrow" width="40" height="12" viewBox="0 0 40 12"><line x1="1" y1="6" x2="39" y2="6" stroke="#1d4ed8" stroke-width="2.5"/><path d="M17,2.5 L24,6 L17,9.5Z" fill="#1d4ed8"/></svg>';
const _ARROW_RED  = '<svg class="gp-arrow" width="40" height="12" viewBox="0 0 40 12"><line x1="1" y1="6" x2="39" y2="6" stroke="#dc2626" stroke-width="2.5"/><path d="M23,2.5 L16,6 L23,9.5Z" fill="#dc2626"/></svg>';

marked.use({
  hooks: {
    postprocess(html) {
      return html
        .replace(/<table>/g, '<table class="table table-bordered">')
        .replace(/\{\{ARROW_BLUE\}\}/g, _ARROW_BLUE)
        .replace(/\{\{ARROW_RED\}\}/g,  _ARROW_RED);
    }
  },
  renderer: {
    heading({ text, depth, raw }) {
      const id = raw.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();
      return `<h${depth} id="${id}">${text}</h${depth}>\n`;
    },
    image({ href, title, text }) {
      const src = href.startsWith('http') ? href : `guide/${href}`;
      return `<img class="img-fluid d-block" src="${src}" alt="${text}"${title ? ` title="${title}"` : ''}>`;
    },
    code({ text, lang }) {
      if (lang === 'mermaid') return `<pre class="mermaid">${text}</pre>`;
      return false;
    }
  }
});

const _STRIPE = 'repeating-linear-gradient(-45deg,#fff 0,#fff 8px,#ddd 8px,#ddd 9px)';

export function toggleGuide(authBar) {
  _active = !_active;
  const nav = document.querySelector('mundial-auth-bar nav');
  if (_active) {
    if (nav) nav.style.background = _STRIPE;
    _pageId = authBar._currentGuideId;
    _showingId = _pageId;
    _ensurePanel();
    _showSection(_showingId);
    _installHandler();
  } else {
    if (nav) nav.style.background = '';
    _uninstallHandler();
    if (_panel) _panel.style.display = 'none';
    if (_showingId && _showingId !== _pageId) {
      const dest = _guideToPage[_showingId];
      if (dest) { location.href = dest; return; }
    }
  }
}

const _GUIDE_IDS = new Set(['map', 'api', 'auth', 'default']);

function _ensurePanel() {
  if (_panel) { _panel.style.display = ''; return; }
  _injectStyles();
  _panel = document.createElement('div');
  _panel.id = 'mundial-guide-panel';
  _panel.style.cssText = 'position:fixed;top:32px;left:0;right:0;bottom:0;z-index:1049;background:#faf9f6;overflow-y:auto;padding:2rem 1rem 4rem';
  _panel.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a) return;
    const guideParam = new URL(a.href, location.href).searchParams.get('guide');
    if (guideParam && _GUIDE_IDS.has(guideParam)) {
      e.preventDefault();
      _showingId = guideParam;
      _showSection(guideParam);
      _highlightNav(guideParam);
    }
  });
  document.body.appendChild(_panel);
}

function _ensureLink(href) {
  if ([...document.styleSheets].some(s => s.href?.endsWith(href))) return;
  const l = Object.assign(document.createElement('link'), { rel: 'stylesheet', href });
  document.head.appendChild(l);
}

function _injectStyles() {
  _ensureLink('css/wc2026_map.css');
  _ensureLink('css/taxonomy.css');
  if (document.getElementById('mundial-guide-panel-styles')) return;
  const s = document.createElement('style');
  s.id = 'mundial-guide-panel-styles';
  s.textContent = `
#mundial-guide-panel .gp-layout{display:flex;gap:3rem;max-width:960px;margin:0 auto}
#mundial-guide-panel .gp-body{flex:1;min-width:0}
#mundial-guide-panel .gp-toc{width:190px;flex-shrink:0;position:sticky;top:1rem;align-self:flex-start;max-height:calc(100vh - 64px);overflow-y:auto}
#mundial-guide-panel .gp-toc-title{display:block;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#aaa;margin-bottom:.6rem}
#mundial-guide-panel .gp-toc-list,#mundial-guide-panel .gp-toc-list ul{list-style:none;padding:0;margin:0}
#mundial-guide-panel .gp-toc-list li{margin:.18rem 0}
#mundial-guide-panel .gp-toc-list ul{padding-left:.75rem;margin-top:.18rem}
#mundial-guide-panel .gp-toc-list a{color:#999;text-decoration:none;font-size:.78rem;line-height:1.4;display:block}
#mundial-guide-panel .gp-toc-list a:hover{color:#333}
@media(max-width:767px){#mundial-guide-panel .gp-layout{flex-direction:column}#mundial-guide-panel .gp-toc{position:static;width:100%}}
#mundial-guide-panel .gp-body h1{font-size:1.5rem;font-weight:700;margin-bottom:2rem;padding-bottom:.5rem;border-bottom:2px solid var(--border,#e4e0d8);overflow:hidden}
#mundial-guide-panel .gp-body h2{font-size:1.05rem;font-weight:600;margin-top:2.5rem;margin-bottom:.6rem;padding-bottom:.3rem;border-bottom:1px solid var(--border,#e4e0d8)}
#mundial-guide-panel .gp-body h3{font-size:.9rem;font-weight:600;margin-top:1.4rem;margin-bottom:.4rem;color:#555}
#mundial-guide-panel .gp-body p:not(.taxonomy *),
#mundial-guide-panel .gp-body li:not(.taxonomy *){font-size:.925rem;line-height:1.7;color:#333}
#mundial-guide-panel .gp-body code:not(.taxonomy *){font-size:.82em;background:var(--bg-hover,#f0ede8);padding:.1em .38em;border-radius:3px;color:var(--color-default,#171715)}
#mundial-guide-panel .gp-body pre:not(.taxonomy *){background:var(--bg-hover,#f0ede8);border-radius:3px;overflow-x:auto}
#mundial-guide-panel .gp-body pre code:not(.taxonomy *){padding:0;background:transparent;border-radius:0;font-size:inherit}
#mundial-guide-panel .gp-body img:not(.taxonomy *):not(.gp-icon):not(.ga-icon){border:1px solid var(--border,#e4e0d8);border-radius:6px;margin:.75rem auto .2rem}
#mundial-guide-panel .gp-icon{display:inline;vertical-align:middle;width:1.1em;height:1.1em;opacity:.7}
#mundial-guide-panel .gp-body blockquote{border-left:3px solid var(--border-strong,#c8c4be);background:var(--bg-hover,#f0ede8);padding:.55rem 1rem;border-radius:0 4px 4px 0;margin:1.25rem 0}
#mundial-guide-panel .gp-body blockquote p{font-size:.875rem;margin:0;color:#444}
#mundial-guide-panel .gp-body table{--bs-table-border-color:var(--border,#e4e0d8);font-size:.875rem;margin:1rem 0}
#mundial-guide-panel .gp-body th{background:var(--bg-hover,#f0ede8);font-weight:600}
#mundial-guide-panel .gp-body img+p>em:only-child,
#mundial-guide-panel .gp-body svg+p>em:only-child{display:block;font-size:.8rem;font-style:italic;color:var(--text-muted,#999);text-align:center;margin-top:.1rem;margin-bottom:1.25rem}
#mundial-guide-panel .gp-body::after{content:'';display:table;clear:both}
#mundial-guide-panel{user-select:text;-webkit-user-select:text}
#mundial-guide-panel .gp-arrow{display:inline!important;width:40px!important;height:12px!important;vertical-align:middle;flex-shrink:0}
.gp-wip-banner{text-align:center;margin:2rem 0}
.gp-wip-box{display:inline-block;border-radius:12px;padding:1.5rem 2.5rem;background-color:#f0ede8;background-image:repeating-linear-gradient(90deg,#c8c4be 0,#c8c4be 8px,transparent 8px,transparent 16px),repeating-linear-gradient(0deg,#c8c4be 0,#c8c4be 8px,transparent 8px,transparent 16px),repeating-linear-gradient(90deg,#c8c4be 0,#c8c4be 8px,transparent 8px,transparent 16px),repeating-linear-gradient(0deg,#c8c4be 0,#c8c4be 8px,transparent 8px,transparent 16px);background-size:100% 3px,3px 100%,100% 3px,3px 100%;background-position:0 0,100% 0,0 100%,0 0;background-repeat:no-repeat;animation:gp-wip-march .8s linear infinite}
@keyframes gp-wip-march{to{background-position:16px 0,100% 16px,-16px 100%,0 -16px}}
.gp-wip-title{font-size:2.5rem;font-weight:700;color:#888;letter-spacing:.05em;line-height:1.2}
.gp-wip-sub{font-size:.9rem;color:#999;margin-top:.4rem}
#mundial-guide-panel .ga-state{border:1px solid var(--border,#e4e0d8);border-radius:6px;padding:1.1rem 1.25rem 1rem;margin:1.25rem 0;overflow:hidden}
#mundial-guide-panel .ga-state h2{margin-top:0;border-bottom:none!important;padding-bottom:0!important;display:flex;align-items:center;flex-wrap:wrap;gap:.5rem}
#mundial-guide-panel .ga-state.ga-current{border-color:#0dcaf0;border-width:2px;background:rgba(13,202,240,.08)}
#mundial-guide-panel .ga-badge{font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#0e7490;background:rgba(13,202,240,.2);border-radius:999px;padding:.2em .65em}
#mundial-guide-panel .ga-feature{margin:1.5rem 0;overflow:hidden}
#mundial-guide-panel .ga-feature h3{margin-top:0}
#mundial-guide-panel .ga-icon{float:left;width:2.25rem;height:2.25rem;margin:.1rem 1rem .5rem 0;border-radius:4px}
`;
  document.head.appendChild(s);
}

async function _showSection(guideId) {
  if (!_panel) return;
  _highlightNav(guideId);
  _panel.innerHTML = '<div class="gp-body"><p style="color:var(--text-muted,#999);text-align:center;margin-top:5rem;font-size:.875rem">Loading…</p></div>';

  const { md, failed } = await _fetchContent(guideId);
  // _showingId may have moved on to a different topic while this fetch was in flight (e.g. two
  // nav clicks in quick succession) — bail out rather than clobbering the more recent one with
  // this now-stale result.
  if (_showingId !== guideId) return;
  const body = document.createElement('div');
  body.className = 'gp-body';
  if (md) {
    body.innerHTML = marked.parse(md);
    body.querySelectorAll('.gp-wip').forEach(el => el.outerHTML = _WIP_HTML);
    // Country-example pills (elo-name spans) are static English text baked into the
    // markdown source — re-localize them here rather than translating 16+ literal
    // country names per language file.
    body.querySelectorAll('.elo-name[data-id]').forEach(el => {
      el.textContent = countryName(Number(el.dataset.id), el.textContent);
    });
  } else {
    body.innerHTML = failed ? _ERROR_HTML : _WIP_HTML;
  }
  const icon = _sectionIcon(guideId);
  if (icon) body.prepend(icon);

  const toc = _buildToc(body);
  const layout = document.createElement('div');
  layout.className = 'gp-layout';
  layout.appendChild(body);
  if (toc) layout.appendChild(toc);

  _panel.innerHTML = '';
  _panel.appendChild(layout);
  _panel.scrollTop = 0;
  const mermaidNodes = [..._panel.querySelectorAll('pre.mermaid')];
  if (mermaidNodes.length) mermaid.run({ nodes: mermaidNodes });
  _refreshAuthState();
}

// The 'auth' guide topic (js/guide-mode.js's _GUIDE_IDS 'auth' entry) describes every possible
// backend-connection state — this highlights whichever one is live right now, read from
// <mundial-auth-bar>'s own connectionState(). No-ops for every other guide topic.
function _refreshAuthState() {
  if (!_panel || _showingId !== 'auth') return;
  const authBar = document.querySelector('mundial-auth-bar');
  const state = authBar?.connectionState?.() ?? 'online';
  const label = _CURRENT_STATE_LABEL[_LANG] ?? 'Current state';
  _panel.querySelectorAll('.ga-state').forEach(el => {
    const isCurrent = el.dataset.gaState === state;
    el.classList.toggle('ga-current', isCurrent);
    const heading = el.querySelector('h2');
    if (!heading) return;
    let badge = heading.querySelector('.ga-badge');
    if (isCurrent) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'ga-badge';
        heading.appendChild(badge);
      }
      badge.textContent = label;
    } else {
      badge?.remove();
    }
  });
}

function _buildToc(body) {
  // h1 covers both the page title and this guide's own major section dividers ("The Control
  // Panel", "The Map", "The Bottom Panel", "Data Sources") — each is a top-level TOC entry.
  // h2 nests one level under the nearest preceding h1; h3 nests under the nearest preceding
  // h2 (or directly under the h1, if this h1 has no h2 of its own yet).
  const headings = [...body.querySelectorAll('h1, h2, h3')];
  if (headings.length < 2) return null;
  const _TOC_LABELS = { fr: 'Sur cette page', de: 'Auf dieser Seite', it: 'In questa pagina', es: 'En esta página' };
  const nav = document.createElement('nav');
  nav.className = 'gp-toc';
  nav.innerHTML = `<strong class="gp-toc-title">${_TOC_LABELS[_LANG] ?? 'On this page'}</strong>`;
  const root = document.createElement('ul');
  root.className = 'gp-toc-list';
  let h1Li = null, h1Ul = null, h2Li = null, h2Ul = null;
  headings.forEach(h => {
    const li = document.createElement('li');
    li.innerHTML = `<a href="#${h.id}">${h.textContent}</a>`;
    if (h.tagName === 'H1') {
      root.appendChild(li);
      h1Li = li; h1Ul = null; h2Li = null; h2Ul = null;
    } else if (h.tagName === 'H2') {
      if (!h1Ul) { h1Ul = document.createElement('ul'); (h1Li ?? root).appendChild(h1Ul); }
      h1Ul.appendChild(li);
      h2Li = li; h2Ul = null;
    } else {
      const parent = h2Li ?? h1Li;
      if (!h2Ul) { h2Ul = document.createElement('ul'); (parent ?? root).appendChild(h2Ul); }
      h2Ul.appendChild(li);
    }
  });
  nav.appendChild(root);
  return nav;
}

// Returns { md, failed }: md is the fetched markdown, or null if unavailable. failed
// distinguishes "we tried and the network/fetch itself broke" (show _ERROR_HTML) from
// "the server genuinely has nothing there, both candidates 404'd" (show _WIP_HTML) — these used
// to be indistinguishable, both silently collapsing to the same null/WIP result.
async function _fetchContent(guideId) {
  const lang = _LANG ?? 'en';
  const candidates = [
    `guide/built/${lang}-${guideId}.md`,
    `guide/built/en-${guideId}.md`,
  ];
  let failed = false;
  for (const url of candidates) {
    try {
      const r = await fetch(`${url}?v=${Date.now()}`);
      if (r.ok) return { md: await r.text(), failed: false };
    } catch (err) {
      failed = true;
      console.warn('[guide-mode] failed to fetch', url, err);
    }
  }
  return { md: null, failed };
}

function _installHandler() {
  // Re-enable pointer events on the current-page nav link while guide is active
  // so the user can click it to switch back to its guide section.
  const authBar = document.querySelector('mundial-auth-bar');
  if (authBar) {
    authBar.querySelectorAll('nav a[data-guide]').forEach(a => {
      a._guideSavedPointerEvents = a.style.pointerEvents;
      a._guideSavedOpacity = a.style.opacity;
      a.style.pointerEvents = '';
    });
  }

  _navHandler = (e) => {
    const el = e.target.closest('mundial-auth-bar [data-guide]');
    if (el) {
      e.preventDefault();
      e.stopImmediatePropagation();
      _showingId = el.dataset.guide;
      _showSection(_showingId);
      return;
    }
    // Any other navbar link (Live, Countries, Goodies dropdown items, …) has no guide
    // section of its own — show the shared "nothing here yet" placeholder instead of
    // letting the click navigate away, so guide mode can only be closed via Escape or
    // re-clicking the guide button itself.
    const navLink = e.target.closest('mundial-auth-bar nav a[href]');
    if (navLink && navLink.dataset.ref !== 'guide-btn') {
      e.preventDefault();
      _showingId = 'default';
      _showSection(_showingId);
    }
  };
  document.addEventListener('click', _navHandler, true);

  _escHandler = (e) => {
    if (e.key !== 'Escape') return;
    if (authBar) authBar._guideActive = false;
    toggleGuide(authBar);
  };
  document.addEventListener('keydown', _escHandler);

  // Live-updates the 'auth' guide topic's highlighted state if connectivity changes while
  // it's the section currently open — _refreshAuthState() itself no-ops for every other topic.
  _authStateHandler = () => _refreshAuthState();
  document.addEventListener('auth-bar-online', _authStateHandler);
  document.addEventListener('auth-bar-offline', _authStateHandler);
}

function _uninstallHandler() {
  if (_navHandler) {
    document.removeEventListener('click', _navHandler, true);
    _navHandler = null;
  }
  if (_escHandler) {
    document.removeEventListener('keydown', _escHandler);
    _escHandler = null;
  }
  if (_authStateHandler) {
    document.removeEventListener('auth-bar-online', _authStateHandler);
    document.removeEventListener('auth-bar-offline', _authStateHandler);
    _authStateHandler = null;
  }
  const authBar = document.querySelector('mundial-auth-bar');
  if (authBar) {
    authBar.querySelectorAll('nav a[data-guide]').forEach(a => {
      if ('_guideSavedPointerEvents' in a) {
        a.style.pointerEvents = a._guideSavedPointerEvents;
        a.style.opacity = a._guideSavedOpacity;
        delete a._guideSavedPointerEvents;
        delete a._guideSavedOpacity;
      }
    });
  }
}

function _highlightNav(activeGuideId) {
  const authBar = document.querySelector('mundial-auth-bar');
  if (!authBar) return;
  authBar.querySelectorAll('nav a[data-guide]').forEach(a => {
    a.style.opacity = a.dataset.guide === activeGuideId ? '1' : '.4';
  });
}

function _sectionIcon(guideId) {
  // 'auth' already carries a .ga-icon on every one of its own sections (see guide-auth.md) —
  // a second, much larger floating icon at the very top read as redundant.
  if (guideId === 'auth') return null;
  const authBar = document.querySelector('mundial-auth-bar');
  if (!authBar) return null;
  const source = authBar.querySelector(`nav a[data-guide="${guideId}"]`);
  const svg = source?.querySelector('svg');
  if (!svg) return null;
  const clone = svg.cloneNode(true);
  clone.removeAttribute('width');
  clone.removeAttribute('height');
  clone.style.cssText = 'float:left;width:6rem;height:6rem;margin:.1rem 1.5rem .5rem 0;opacity:.2';
  return clone;
}
