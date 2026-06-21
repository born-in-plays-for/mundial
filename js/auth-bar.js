const ICON = (paths) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
const ICON_HOME = ICON(`<path d="M22 22L2 22" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M2 11L10.1259 4.49931C11.2216 3.62279 12.7784 3.62279 13.8741 4.49931L22 11" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M15.5 5.5V3.5C15.5 3.22386 15.7239 3 16 3H18.5C18.7761 3 19 3.22386 19 3.5V8.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M4 22V9.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M20 22V9.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M15 22V17C15 15.5858 15 14.8787 14.5607 14.4393C14.1213 14 13.4142 14 12 14C10.5858 14 9.87868 14 9.43934 14.4393C9 14.8787 9 15.5858 9 17V22" stroke="#1C274C" stroke-width="1.5"/><path d="M14 9.5C14 10.6046 13.1046 11.5 12 11.5C10.8954 11.5 10 10.6046 10 9.5C10 8.39543 10.8954 7.5 12 7.5C13.1046 7.5 14 8.39543 14 9.5Z" stroke="#1C274C" stroke-width="1.5"/>`);
const ICON_LIVE = ICON(`<path d="M10.165 4.77922L10.6669 5.13443C11.0567 5.41029 11.5225 5.55844 12 5.55844C12.4776 5.55844 12.9434 5.41029 13.3332 5.13441L13.8351 4.77922C14.5514 4.27225 15.4074 4 16.2849 4H16.8974C17.3016 4 17.7099 4.02549 18.0908 4.16059C20.4735 5.00566 22.1125 8.09503 21.994 15.1026C21.9701 16.5145 21.6397 18.075 20.3658 18.6842C19.9688 18.8741 19.5033 19 18.9733 19C18.3373 19 17.8322 18.8187 17.4424 18.5632C16.5285 17.9642 15.8588 16.9639 14.8888 16.4609C14.3048 16.1581 13.6566 16 12.9989 16H11.0011C10.3434 16 9.69519 16.1581 9.11125 16.4609C8.14122 16.9639 7.47153 17.9642 6.55763 18.5632C6.1678 18.8187 5.66273 19 5.02671 19C4.49667 19 4.03121 18.8741 3.63423 18.6842C2.3603 18.075 2.02992 16.5145 2.00604 15.1026C1.88749 8.09504 3.52645 5.00566 5.90915 4.16059C6.29009 4.02549 6.69838 4 7.10257 4H7.71504C8.59264 4 9.44862 4.27225 10.165 4.77922Z" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M7.5 9V12M6 10.5L9 10.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M19 10.25C19 10.6642 18.6642 11 18.25 11C17.8358 11 17.5 10.6642 17.5 10.25C17.5 9.83579 17.8358 9.5 18.25 9.5C18.6642 9.5 19 9.83579 19 10.25Z" fill="#1C274C"/><path d="M16 10.25C16 10.6642 15.6642 11 15.25 11C14.8358 11 14.5 10.6642 14.5 10.25C14.5 9.83579 14.8358 9.5 15.25 9.5C15.6642 9.5 16 9.83579 16 10.25Z" fill="#1C274C"/><path d="M16.75 8C17.1642 8 17.5 8.33579 17.5 8.75C17.5 9.16421 17.1642 9.5 16.75 9.5C16.3358 9.5 16 9.16421 16 8.75C16 8.33579 16.3358 8 16.75 8Z" fill="#1C274C"/><path d="M16.75 11C17.1642 11 17.5 11.3358 17.5 11.75C17.5 12.1642 17.1642 12.5 16.75 12.5C16.3358 12.5 16 12.1642 16 11.75C16 11.3358 16.3358 11 16.75 11Z" fill="#1C274C"/>`);
const ICON_ADMIN = ICON(`<circle cx="12" cy="12" r="3" stroke="#1C274C" stroke-width="1.5"/><path d="M13.7654 2.15224C13.3978 2 12.9319 2 12 2C11.0681 2 10.6022 2 10.2346 2.15224C9.74457 2.35523 9.35522 2.74458 9.15223 3.23463C9.05957 3.45834 9.0233 3.7185 9.00911 4.09799C8.98826 4.65568 8.70226 5.17189 8.21894 5.45093C7.73564 5.72996 7.14559 5.71954 6.65219 5.45876C6.31645 5.2813 6.07301 5.18262 5.83294 5.15102C5.30704 5.08178 4.77518 5.22429 4.35436 5.5472C4.03874 5.78938 3.80577 6.1929 3.33983 6.99993C2.87389 7.80697 2.64092 8.21048 2.58899 8.60491C2.51976 9.1308 2.66227 9.66266 2.98518 10.0835C3.13256 10.2756 3.3397 10.437 3.66119 10.639C4.1338 10.936 4.43789 11.4419 4.43786 12C4.43783 12.5581 4.13375 13.0639 3.66118 13.3608C3.33965 13.5629 3.13248 13.7244 2.98508 13.9165C2.66217 14.3373 2.51966 14.8691 2.5889 15.395C2.64082 15.7894 2.87379 16.193 3.33973 17C3.80568 17.807 4.03865 18.2106 4.35426 18.4527C4.77508 18.7756 5.30694 18.9181 5.83284 18.8489C6.07289 18.8173 6.31632 18.7186 6.65204 18.5412C7.14547 18.2804 7.73556 18.27 8.2189 18.549C8.70224 18.8281 8.98826 19.3443 9.00911 19.9021C9.02331 20.2815 9.05957 20.5417 9.15223 20.7654C9.35522 21.2554 9.74457 21.6448 10.2346 21.8478C10.6022 22 11.0681 22 12 22C12.9319 22 13.3978 22 13.7654 21.8478C14.2554 21.6448 14.6448 21.2554 14.8477 20.7654C14.9404 20.5417 14.9767 20.2815 14.9909 19.902C15.0117 19.3443 15.2977 18.8281 15.781 18.549C16.2643 18.2699 16.8544 18.2804 17.3479 18.5412C17.6836 18.7186 17.927 18.8172 18.167 18.8488C18.6929 18.9181 19.2248 18.7756 19.6456 18.4527C19.9612 18.2105 20.1942 17.807 20.6601 16.9999C21.1261 16.1929 21.3591 15.7894 21.411 15.395C21.4802 14.8691 21.3377 14.3372 21.0148 13.9164C20.8674 13.7243 20.6602 13.5628 20.3387 13.3608C19.8662 13.0639 19.5621 12.558 19.5621 11.9999C19.5621 11.4418 19.8662 10.9361 20.3387 10.6392C20.6603 10.4371 20.8675 10.2757 21.0149 10.0835C21.3378 9.66273 21.4803 9.13087 21.4111 8.60497C21.3592 8.21055 21.1262 7.80703 20.6602 7C20.1943 6.19297 19.9613 5.78945 19.6457 5.54727C19.2249 5.22436 18.693 5.08185 18.1671 5.15109C17.9271 5.18269 17.6837 5.28136 17.3479 5.4588C16.8545 5.71959 16.2644 5.73002 15.7811 5.45096C15.2977 5.17191 15.0117 4.65566 14.9909 4.09794C14.9767 3.71848 14.9404 3.45833 14.8477 3.23463C14.6448 2.74458 14.2554 2.35523 13.7654 2.15224Z" stroke="#1C274C" stroke-width="1.5"/>`);
const ICON_FRANCE = `<svg width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="#1C274C" stroke-width="24" stroke-linejoin="round" d="M283.4 19.83c-3.2 0-31.2 5.09-31.2 5.09-1.3 41.61-30.4 78.48-90.3 84.88l-12.8-23.07-25.1 2.48 11.3 60.09-113.79-4.9 12.2 41.5C156.3 225.4 150.7 338.4 124 439.4c47 53 141.8 47.8 186 43.1 3.1-62.2 52.4-64.5 135.9-32.2 11.3-17.6 18.8-36 44.6-50.7l-46.6-139.5-27.5 6.2c11-21.1 32.2-49.9 50.4-63.4l15.6-86.9c-88.6-6.3-146.4-46.36-199-96.17z"/></svg>`;
const ICON_LOGIN = ICON(`<path d="M2.00098 11.999L16.001 11.999M16.001 11.999L12.501 8.99902M16.001 11.999L12.501 14.999" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.00195 7C9.01406 4.82497 9.11051 3.64706 9.87889 2.87868C10.7576 2 12.1718 2 15.0002 2L16.0002 2C18.8286 2 20.2429 2 21.1215 2.87868C22.0002 3.75736 22.0002 5.17157 22.0002 8L22.0002 16C22.0002 18.8284 22.0002 20.2426 21.1215 21.1213C20.2429 22 18.8286 22 16.0002 22H15.0002C12.1718 22 10.7576 22 9.87889 21.1213C9.11051 20.3529 9.01406 19.175 9.00195 17" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>`);
const ICON_LOGOUT = ICON(`<path d="M9.00195 7C9.01406 4.82497 9.11051 3.64706 9.87889 2.87868C10.7576 2 12.1718 2 15.0002 2L16.0002 2C18.8286 2 20.2429 2 21.1215 2.87868C22.0002 3.75736 22.0002 5.17157 22.0002 8L22.0002 16C22.0002 18.8284 22.0002 20.2426 21.1215 21.1213C20.2429 22 18.8286 22 16.0002 22H15.0002C12.1718 22 10.7576 22 9.87889 21.1213C9.11051 20.3529 9.01406 19.175 9.00195 17" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M15 12L2 12M2 12L5.5 9M2 12L5.5 15" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);

class MundialAuthBar extends HTMLElement {
  constructor() {
    super();
    this.BACKEND = '';
  }

  connectedCallback() {
    this.innerHTML = `
<nav class="navbar navbar-light bg-white border-bottom py-0 px-2" style="position:fixed;top:0;left:0;right:0;z-index:1050;height:32px">
  <div class="container-xxl d-flex align-items-center px-1">
    <a href="/" class="text-decoration-none d-flex align-items-center" aria-label="Home" title="Home" style="line-height:0;opacity:.6;transition:opacity .2s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.6">${ICON_HOME}</a>
    <a href="wc2026_france_departments.html" class="text-decoration-none d-flex align-items-center ms-3" aria-label="France par département" title="France par département" style="line-height:0;opacity:.6;transition:opacity .2s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.6">${ICON_FRANCE}</a>
    <a data-ref="live-link" href="wc2026_live_game.html" class="text-decoration-none d-flex align-items-center ms-3" aria-label="Live game" title="Live game" style="line-height:0;opacity:.6;transition:opacity .2s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.6">${ICON_LIVE}</a>
    <div class="d-flex align-items-center gap-2 ms-auto">
      <a data-ref="admin-link" href="#" target="_blank" class="text-decoration-none d-none d-flex align-items-center" aria-label="Admin" title="Admin" style="line-height:0;opacity:.6;transition:opacity .2s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.6">${ICON_ADMIN}</a>
      <button data-ref="sign-in" class="btn btn-link btn-sm p-0 d-flex align-items-center" aria-label="Sign in" title="Sign in" style="line-height:0;opacity:.6;transition:opacity .2s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.6">${ICON_LOGIN}</button>
      <div data-ref="signed-in" class="d-none d-flex align-items-center gap-1">
        <img data-ref="pic" class="rounded-circle" width="22" height="22" style="cursor:default" alt="" referrerpolicy="no-referrer">
        <button data-ref="sign-out" class="btn btn-link btn-sm p-0 d-flex align-items-center" aria-label="Sign out" title="Sign out" style="line-height:0;opacity:.6;transition:opacity .2s" onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=.6">${ICON_LOGOUT}</button>
      </div>
    </div>
  </div>
</nav>`;

    const page = location.pathname.split('/').pop() || 'index.html';
    const navLinks = {
      '/': ['index.html', 'wc2026_map_exported.html', ''],
      'wc2026_france_departments.html': ['wc2026_france_departments.html'],
      'wc2026_live_game.html': ['wc2026_live_game.html'],
    };
    this.querySelectorAll('nav a[href]').forEach(a => {
      const href = a.getAttribute('href');
      const pages = navLinks[href];
      if (pages && pages.includes(page)) {
        a.removeAttribute('href');
        a.style.opacity = '.25';
        a.style.pointerEvents = 'none';
        a.onmouseover = null;
        a.onmouseout = null;
      }
    });

    this._refs = {};
    this.querySelectorAll('[data-ref]').forEach(el => {
      this._refs[el.dataset.ref] = el;
    });

    this._init();
  }

  _el(ref) { return this._refs[ref]; }

  _showOffline(reason) {
    console.warn('[auth-bar]', reason);
    this.innerHTML = `
<div style="position:fixed;top:0;left:0;right:0;z-index:1050;height:32px;background:#f5f2ec;border-bottom:1px solid #dee2e6;display:flex;align-items:center;justify-content:center">
  <span style="font-size:11px;color:#999">${reason}</span>
</div>`;
    this.style.display = '';
    const next = this.nextElementSibling;
    if (next) next.style.marginTop = '32px';
  }

  async _init() {
    this.style.display = 'none';

    try {
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        this.BACKEND = 'http://localhost:5002';
      } else {
        const cfg = await fetch('./backend_config.json').then(r => r.json());
        this.BACKEND = cfg.backend_url;
      }
      if (!this.BACKEND) {
        this._showOffline('Backend not configured');
        return;
      }
      await fetch(this.BACKEND + '/api/auth/me', {
        credentials: 'include',
        signal: AbortSignal.timeout(3000),
        headers: {'ngrok-skip-browser-warning': '1'}
      });
    } catch (err) {
      const detail = err.name === 'TimeoutError' ? 'Backend timed out' : `Backend unreachable (${this.BACKEND || 'no URL'})`;
      this._showOffline(detail);
      return;
    }

    this.style.display = '';
    const next = this.nextElementSibling;
    if (next) next.style.marginTop = '32px';
    this.dispatchEvent(new CustomEvent('auth-bar-ready', {bubbles: true}));

    const stored = localStorage.getItem('mundial_user');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this._showUser(data.user ?? data, data.admin ?? false);
      } catch {}
    }

    this._el('sign-in').addEventListener('click', () => {
      window.open(this.BACKEND + '/login', 'mundial_login', 'width=420,height=500,left=200,top=200');
    });

    window.addEventListener('message', e => {
      if (e.data?.type === 'mundial_auth' && e.data.user) {
        localStorage.setItem('mundial_user', JSON.stringify(e.data));
        localStorage.setItem('mundial_sid', e.data.sid ?? '');
        this._showUser(e.data.user, e.data.admin);
      }
      if (e.data?.type === 'mundial_kicked') {
        this._signOut();
      }
    });

    this._el('sign-out').addEventListener('click', async () => {
      const sid = localStorage.getItem('mundial_sid');
      const raw = localStorage.getItem('mundial_user');
      const email = raw ? (JSON.parse(raw).user ?? JSON.parse(raw)).email : null;
      await fetch(this.BACKEND + '/api/auth/logout', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        credentials: 'include',
        body: JSON.stringify({sid, email})
      }).catch(() => {});
      this._signOut();
    });

    this._connectWebSocket();
  }

  _showUser(user, isAdmin) {
    this._el('sign-in').classList.add('d-none');
    this._el('signed-in').classList.remove('d-none');
    this._el('pic').src = user.picture;
    this._el('pic').title = user.name;
    if (isAdmin) {
      this._el('admin-link').classList.remove('d-none');
      this._el('admin-link').href = this.BACKEND + '/admin';
    }
  }

  _signOut() {
    localStorage.removeItem('mundial_user');
    localStorage.removeItem('mundial_sid');
    this._el('signed-in').classList.add('d-none');
    this._el('sign-in').classList.remove('d-none');
    this._el('admin-link').classList.add('d-none');
  }

  _connectWebSocket() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/socket.io-client@4/dist/socket.io.min.js';
    script.onload = () => {
      const sock = io(this.BACKEND, {transports: ['websocket']});
      sock.on('user_kicked', ({email, sid: kickedSid}) => {
        const mySid = localStorage.getItem('mundial_sid');
        const raw = localStorage.getItem('mundial_user');
        if (!raw) return;
        try {
          const data = JSON.parse(raw);
          const cur = (data.user ?? data).email;
          if (kickedSid && mySid === kickedSid) this._signOut();
          else if (!kickedSid && cur === email) this._signOut();
        } catch {}
      });
    };
    document.head.appendChild(script);
  }
}

customElements.define('mundial-auth-bar', MundialAuthBar);
