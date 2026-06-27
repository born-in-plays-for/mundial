import { _LANG } from './i18n.js';
import { marked } from 'https://cdn.jsdelivr.net/npm/marked@14/+esm';

let _active = false;
let _showingId = null;
let _pageId = null;
let _panel = null;
let _navHandler = null;

const _guideToPage = {
  home: '/',
  france: 'wc2026_france_departments.html',
  live: 'wc2026_live_game.html',
};

marked.use({
  hooks: {
    postprocess(html) {
      return html.replace(/<table>/g, '<table class="table table-bordered">');
    }
  },
  renderer: {
    image({ href, title, text }) {
      const src = href.startsWith('http') ? href : `guide/${href}`;
      return `<img class="img-fluid d-block" src="${src}" alt="${text}"${title ? ` title="${title}"` : ''}>`;
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

function _ensurePanel() {
  if (_panel) { _panel.style.display = ''; return; }
  _injectStyles();
  _panel = document.createElement('div');
  _panel.id = 'mundial-guide-panel';
  _panel.style.cssText = 'position:fixed;top:32px;left:0;right:0;bottom:0;z-index:1049;background:#faf9f6;overflow-y:auto;padding:2rem 1rem 4rem';
  document.body.appendChild(_panel);
}

function _injectStyles() {
  if (document.getElementById('mundial-guide-panel-styles')) return;
  const s = document.createElement('style');
  s.id = 'mundial-guide-panel-styles';
  s.textContent = `
#mundial-guide-panel .gp-body{max-width:720px;margin:0 auto}
#mundial-guide-panel .gp-body h1{font-size:1.5rem;font-weight:700;margin-bottom:2rem;padding-bottom:.5rem;border-bottom:2px solid var(--border,#e4e0d8)}
#mundial-guide-panel .gp-body h2{font-size:1.05rem;font-weight:600;margin-top:2.5rem;margin-bottom:.6rem;padding-bottom:.3rem;border-bottom:1px solid var(--border,#e4e0d8)}
#mundial-guide-panel .gp-body h3{font-size:.9rem;font-weight:600;margin-top:1.4rem;margin-bottom:.4rem;color:#555}
#mundial-guide-panel .gp-body p:not(.taxonomy *){font-size:.925rem;line-height:1.7;color:#333}
#mundial-guide-panel .gp-body code:not(.taxonomy *){font-size:.82em;background:var(--bg-hover,#f0ede8);padding:.1em .38em;border-radius:3px;color:var(--color-default,#171715)}
#mundial-guide-panel .gp-body img:not(.taxonomy *){border:1px solid var(--border,#e4e0d8);border-radius:6px;margin:.75rem auto .2rem}
#mundial-guide-panel .gp-body blockquote{border-left:3px solid var(--border-strong,#c8c4be);background:var(--bg-hover,#f0ede8);padding:.55rem 1rem;border-radius:0 4px 4px 0;margin:1.25rem 0}
#mundial-guide-panel .gp-body blockquote p{font-size:.875rem;margin:0;color:#444}
#mundial-guide-panel .gp-body table{--bs-table-border-color:var(--border,#e4e0d8);font-size:.875rem;margin:1rem 0}
#mundial-guide-panel .gp-body th{background:var(--bg-hover,#f0ede8);font-weight:600}
#mundial-guide-panel .gp-body img+p>em:only-child,
#mundial-guide-panel .gp-body svg+p>em:only-child{display:block;font-size:.8rem;font-style:italic;color:var(--text-muted,#999);text-align:center;margin-top:.1rem;margin-bottom:1.25rem}
#mundial-guide-panel .gp-body::after{content:'';display:table;clear:both}
`;
  document.head.appendChild(s);
}

async function _showSection(guideId) {
  if (!_panel) return;
  _highlightNav(guideId);
  _panel.innerHTML = '<div class="gp-body"><p style="color:var(--text-muted,#999);text-align:center;margin-top:5rem;font-size:.875rem">Loading…</p></div>';

  const md = await _fetchContent(guideId);
  const body = document.createElement('div');
  body.className = 'gp-body';
  if (md) {
    body.innerHTML = marked.parse(md);
  } else {
    const labels = { home: 'Map', france: 'France departments', live: 'Live game', auth: 'Authentication' };
    body.innerHTML = `<p style="color:var(--text-muted,#999);font-size:.9rem;margin-top:2rem;text-align:center">
      Guide for <strong>${labels[guideId] ?? guideId}</strong> is not yet available.</p>`;
  }
  const icon = _sectionIcon(guideId);
  if (icon) body.prepend(icon);
  _panel.innerHTML = '';
  _panel.appendChild(body);
  _panel.scrollTop = 0;
}

async function _fetchContent(guideId) {
  const lang = _LANG ?? 'en';
  const candidates = [
    `guide/built/${lang}-${guideId}.md`,
    `guide/built/en-${guideId}.md`,
    ...(guideId === 'home' ? [`guide/built/${lang}.md`, 'guide/built/en.md'] : []),
  ];
  for (const url of candidates) {
    try {
      const r = await fetch(url);
      if (r.ok) return r.text();
    } catch {}
  }
  return null;
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
    if (!el) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    _showingId = el.dataset.guide;
    _showSection(_showingId);
  };
  document.addEventListener('click', _navHandler, true);
}

function _uninstallHandler() {
  if (_navHandler) {
    document.removeEventListener('click', _navHandler, true);
    _navHandler = null;
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
  const authBar = document.querySelector('mundial-auth-bar');
  if (!authBar) return null;
  const source = guideId === 'auth'
    ? authBar.querySelector('[data-ref="sign-in"]')
    : authBar.querySelector(`nav a[data-guide="${guideId}"]`);
  const svg = source?.querySelector('svg');
  if (!svg) return null;
  const clone = svg.cloneNode(true);
  clone.removeAttribute('width');
  clone.removeAttribute('height');
  clone.style.cssText = 'float:left;width:6rem;height:6rem;margin:.1rem 1.5rem .5rem 0;opacity:.2';
  return clone;
}
