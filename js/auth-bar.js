import { T as _t } from './i18n.js';
import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { unsafeHTML } from 'https://cdn.jsdelivr.net/npm/lit-html@3/directives/unsafe-html.js';

const _icon = (paths) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
const ICON_HOME = _icon(`<path d="M22 22L2 22" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M2 11L10.1259 4.49931C11.2216 3.62279 12.7784 3.62279 13.8741 4.49931L22 11" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M15.5 5.5V3.5C15.5 3.22386 15.7239 3 16 3H18.5C18.7761 3 19 3.22386 19 3.5V8.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M4 22V9.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M20 22V9.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M15 22V17C15 15.5858 15 14.8787 14.5607 14.4393C14.1213 14 13.4142 14 12 14C10.5858 14 9.87868 14 9.43934 14.4393C9 14.8787 9 15.5858 9 17V22" stroke="#1C274C" stroke-width="1.5"/><path d="M14 9.5C14 10.6046 13.1046 11.5 12 11.5C10.8954 11.5 10 10.6046 10 9.5C10 8.39543 10.8954 7.5 12 7.5C13.1046 7.5 14 8.39543 14 9.5Z" stroke="#1C274C" stroke-width="1.5"/>`);
const ICON_LIVE = _icon(`<path d="M10.165 4.77922L10.6669 5.13443C11.0567 5.41029 11.5225 5.55844 12 5.55844C12.4776 5.55844 12.9434 5.41029 13.3332 5.13441L13.8351 4.77922C14.5514 4.27225 15.4074 4 16.2849 4H16.8974C17.3016 4 17.7099 4.02549 18.0908 4.16059C20.4735 5.00566 22.1125 8.09503 21.994 15.1026C21.9701 16.5145 21.6397 18.075 20.3658 18.6842C19.9688 18.8741 19.5033 19 18.9733 19C18.3373 19 17.8322 18.8187 17.4424 18.5632C16.5285 17.9642 15.8588 16.9639 14.8888 16.4609C14.3048 16.1581 13.6566 16 12.9989 16H11.0011C10.3434 16 9.69519 16.1581 9.11125 16.4609C8.14122 16.9639 7.47153 17.9642 6.55763 18.5632C6.1678 18.8187 5.66273 19 5.02671 19C4.49667 19 4.03121 18.8741 3.63423 18.6842C2.3603 18.075 2.02992 16.5145 2.00604 15.1026C1.88749 8.09504 3.52645 5.00566 5.90915 4.16059C6.29009 4.02549 6.69838 4 7.10257 4H7.71504C8.59264 4 9.44862 4.27225 10.165 4.77922Z" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M7.5 9V12M6 10.5L9 10.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M19 10.25C19 10.6642 18.6642 11 18.25 11C17.8358 11 17.5 10.6642 17.5 10.25C17.5 9.83579 17.8358 9.5 18.25 9.5C18.6642 9.5 19 9.83579 19 10.25Z" fill="#1C274C"/><path d="M16 10.25C16 10.6642 15.6642 11 15.25 11C14.8358 11 14.5 10.6642 14.5 10.25C14.5 9.83579 14.8358 9.5 15.25 9.5C15.6642 9.5 16 9.83579 16 10.25Z" fill="#1C274C"/><path d="M16.75 8C17.1642 8 17.5 8.33579 17.5 8.75C17.5 9.16421 17.1642 9.5 16.75 9.5C16.3358 9.5 16 9.16421 16 8.75C16 8.33579 16.3358 8 16.75 8Z" fill="#1C274C"/><path d="M16.75 11C17.1642 11 17.5 11.3358 17.5 11.75C17.5 12.1642 17.1642 12.5 16.75 12.5C16.3358 12.5 16 12.1642 16 11.75C16 11.3358 16.3358 11 16.75 11Z" fill="#1C274C"/>`);
const ICON_FRANCE = `<svg width="24" height="24" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="#1C274C" stroke-width="24" stroke-linejoin="round" d="M283.4 19.83c-3.2 0-31.2 5.09-31.2 5.09-1.3 41.61-30.4 78.48-90.3 84.88l-12.8-23.07-25.1 2.48 11.3 60.09-113.79-4.9 12.2 41.5C156.3 225.4 150.7 338.4 124 439.4c47 53 141.8 47.8 186 43.1 3.1-62.2 52.4-64.5 135.9-32.2 11.3-17.6 18.8-36 44.6-50.7l-46.6-139.5-27.5 6.2c11-21.1 32.2-49.9 50.4-63.4l15.6-86.9c-88.6-6.3-146.4-46.36-199-96.17z"/></svg>`;
const ICON_RANKINGS = _icon(`<path d="M12.0002 16C6.24021 16 5.21983 10.2595 5.03907 5.70647C4.98879 4.43998 4.96365 3.80673 5.43937 3.22083C5.91508 2.63494 6.48445 2.53887 7.62318 2.34674C8.74724 2.15709 10.2166 2 12.0002 2C13.7837 2 15.2531 2.15709 16.3771 2.34674C17.5159 2.53887 18.0852 2.63494 18.5609 3.22083C19.0367 3.80673 19.0115 4.43998 18.9612 5.70647C18.7805 10.2595 17.7601 16 12.0002 16Z" stroke="#1C274C" stroke-width="1.5"/><path d="M19 5L19.9486 5.31621C20.9387 5.64623 21.4337 5.81124 21.7168 6.20408C22 6.59692 22 7.11873 21.9999 8.16234L21.9999 8.23487C21.9999 9.09561 21.9999 9.52598 21.7927 9.87809C21.5855 10.2302 21.2093 10.4392 20.4569 10.8572L17.5 12.5" stroke="#1C274C" stroke-width="1.5"/><path d="M4.99994 5L4.05132 5.31621C3.06126 5.64623 2.56623 5.81124 2.2831 6.20408C1.99996 6.59692 1.99997 7.11873 2 8.16234L2 8.23487C2.00003 9.09561 2.00004 9.52598 2.20723 9.87809C2.41441 10.2302 2.79063 10.4392 3.54305 10.8572L6.49994 12.5" stroke="#1C274C" stroke-width="1.5"/><path d="M12 17V19" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M15.5 22H8.5L8.83922 20.3039C8.93271 19.8365 9.34312 19.5 9.8198 19.5H14.1802C14.6569 19.5 15.0673 19.8365 15.1608 20.3039L15.5 22Z" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M18 22H6" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>`);
const ICON_GUIDE = _icon(`<circle cx="12" cy="12" r="10" stroke="#1C274C" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke="#1C274C" stroke-width="1.5"/><path d="M15 9L19 5" stroke="#1C274C" stroke-width="1.5"/><path d="M5 19L9 15" stroke="#1C274C" stroke-width="1.5"/><path d="M9 9L5 5" stroke="#1C274C" stroke-width="1.5"/><path d="M19 19L15 15" stroke="#1C274C" stroke-width="1.5"/>`);
const ICON_LOGIN = _icon(`<path d="M21.999 11.999L7.999 11.999M7.999 11.999L11.499 8.99902M7.999 11.999L11.499 14.999" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14.998 7C14.986 4.82497 14.8895 3.64706 14.1211 2.87868C13.2424 2 11.8282 2 8.9998 2L7.9998 2C5.1714 2 3.7571 2 2.8785 2.87868C1.9998 3.75736 1.9998 5.17157 1.9998 8L1.9998 16C1.9998 18.8284 1.9998 20.2426 2.8785 21.1213C3.7571 22 5.1714 22 7.9998 22H8.9998C11.8282 22 13.2424 22 14.1211 21.1213C14.8895 20.3529 14.986 19.175 14.998 17" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>`);
const ICON_LOGOUT = _icon(`<path d="M14.998 7C14.986 4.82497 14.8895 3.64706 14.1211 2.87868C13.2424 2 11.8282 2 8.9998 2L7.9998 2C5.1714 2 3.7571 2 2.8785 2.87868C1.9998 3.75736 1.9998 5.17157 1.9998 8L1.9998 16C1.9998 18.8284 1.9998 20.2426 2.8785 21.1213C3.7571 22 5.1714 22 7.9998 22H8.9998C11.8282 22 13.2424 22 14.1211 21.1213C14.8895 20.3529 14.986 19.175 14.998 17" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M9 12L22 12M22 12L18.5 9M22 12L18.5 15" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);
const WA_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366" style="width:18px;height:18px;vertical-align:-3px;display:inline-block"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
const WARN_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" style="width:24px;height:24px;vertical-align:-3px;display:inline-block"><path d="M3 10.4167C3 7.21907 3 5.62028 3.37752 5.08241C3.75503 4.54454 5.25832 4.02996 8.26491 3.00079L8.83772 2.80472C10.405 2.26824 11.1886 2 12 2C12.8114 2 13.595 2.26824 15.1623 2.80472L15.7351 3.00079C18.7417 4.02996 20.245 4.54454 20.6225 5.08241C21 5.62028 21 7.21907 21 10.4167C21 10.8996 21 11.4234 21 11.9914C21 17.6294 16.761 20.3655 14.1014 21.5273C13.38 21.8424 13.0193 22 12 22C10.9807 22 10.62 21.8424 9.89856 21.5273C7.23896 20.3655 3 17.6294 3 11.9914C3 11.4234 3 10.8996 3 10.4167Z" stroke="#f59e0b" stroke-width="1.5"/><path d="M12 8V12" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="15" r="1" fill="#f59e0b"/></svg>`;

const _hoverStyle = 'line-height:0;opacity:.6;transition:opacity .2s';
const _navLink = (href, label, icon, extra = '', guideId = '') =>
  html`<a href=${href} class="text-decoration-none d-flex align-items-center ${extra}"
    aria-label=${label} title=${label} style=${_hoverStyle}
    data-guide=${guideId || nothing}
    @mouseover=${e => e.currentTarget.style.opacity = 1}
    @mouseout=${e => e.currentTarget.style.opacity = .6}>${unsafeHTML(icon)}</a>`;

const _authSectionTemplate = ({onSignIn, onSignOut} = {}) => html`
  <button data-ref="sign-in" class="btn btn-link btn-sm p-0 d-flex align-items-center"
    aria-label=${_t.navSignIn} title=${_t.navSignIn} style=${_hoverStyle}
    @click=${onSignIn}
    @mouseover=${e => e.currentTarget.style.opacity = 1}
    @mouseout=${e => e.currentTarget.style.opacity = .6}>${unsafeHTML(ICON_LOGIN)}</button>
  <div data-ref="signed-in" class="d-none d-flex align-items-center gap-3">
    <a data-ref="pic-link" href="#" target="_blank" class="d-flex" style="cursor:default">
      <img data-ref="pic" class="rounded-circle" width="24" height="24" alt="" referrerpolicy="no-referrer">
    </a>
    <button data-ref="sign-out" class="btn btn-link btn-sm p-0 d-flex align-items-center"
      aria-label=${_t.navSignOut} title=${_t.navSignOut} style=${_hoverStyle}
      @click=${onSignOut}
      @mouseover=${e => e.currentTarget.style.opacity = 1}
      @mouseout=${e => e.currentTarget.style.opacity = .6}>${unsafeHTML(ICON_LOGOUT)}</button>
  </div>`;

const _offlineSectionTemplate = (category, onWarnClick) => {
  const tip = category === 'server' ? _t.offlineTitle : _t.offlineTitleConn;
  return html`<button class="btn btn-link btn-sm p-0 d-flex align-items-center"
    title=${tip} style="line-height:0"
    @click=${onWarnClick}>${unsafeHTML(WARN_ICON)}</button>`;
};

const _offlineModalTemplate = (category) => {
  const title = category === 'server' ? _t.offlineTitle : _t.offlineTitleConn;
  const body = category === 'server' ? _t.offlineBody : _t.offlineBodyConn;
  return html`
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header py-2">
        <h6 class="modal-title d-flex align-items-center gap-2">${unsafeHTML(WARN_ICON)} ${title}</h6>
        <button type="button" class="btn-close btn-close-sm" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body" style="font-size:14px">
        <p>${body}</p>
        <p class="mb-0"><strong>${_t.offlineContact}</strong> ${_t.offlineContactBody}<br>
          <a href="https://wa.me/393755042951" target="_blank" rel="noopener"
            class="d-inline-flex align-items-center gap-1 mt-1"
            style="color:#25D366">${unsafeHTML(WA_ICON)} +39 375 504 2951</a>
        </p>
      </div>
    </div>
  </div>`;
};

class MundialAuthBar extends HTMLElement {
  constructor() {
    super();
    this.BACKEND = '';
    this._guideActive = false;
  }

  connectedCallback() {
    render(html`
      <nav class="navbar navbar-light bg-white border-bottom py-0 px-2"
        style="position:fixed;top:0;left:0;right:0;z-index:1050;height:32px">
        <div class="container-xxl d-flex align-items-center gap-3 px-1">
          ${_navLink('/', _t.navHome, ICON_HOME, '', 'home')}
          ${_navLink('wc2026_countries.html', _t.navCountries, ICON_RANKINGS, '', 'countries')}
          ${_navLink('wc2026_france_departments.html', _t.navFrance, ICON_FRANCE, '', 'france')}
          ${_navLink('wc2026_live_game.html', _t.navLive, ICON_LIVE, '', 'live')}
          <div data-ref="auth-section" data-guide="auth"
            class="d-flex align-items-center gap-3 ms-auto">
            ${_authSectionTemplate()}
          </div>
          <button data-ref="guide-btn"
            class="btn btn-outline-secondary p-0 d-flex align-items-center"
            aria-label=${_t.navGuide} title=${_t.navGuide}
            data-bs-toggle="button"
            @click=${() => this._onGuideClick()}>
            ${unsafeHTML(ICON_GUIDE)}
          </button>
        </div>
      </nav>`, this);

    const page = location.pathname.split('/').pop() || 'index.html';
    const navLinks = {
      '/': ['index.html', 'wc2026_map_exported.html', ''],
      'wc2026_countries.html': ['wc2026_countries.html'],
      'wc2026_france_departments.html': ['wc2026_france_departments.html'],
      'wc2026_live_game.html': ['wc2026_live_game.html'],
      'guide.html': ['guide.html'],
    };
    this.querySelectorAll('nav a[href]').forEach(a => {
      const href = a.getAttribute('href');
      const pages = navLinks[href];
      if (pages && pages.includes(page)) {
        a.removeAttribute('href');
        a.style.opacity = '.25';
        a.style.pointerEvents = 'none';
      }
    });

    this._refs = {};
    this.querySelectorAll('[data-ref]').forEach(el => {
      this._refs[el.dataset.ref] = el;
    });

    const _guideIdMap = {
      '': 'home', 'index.html': 'home', 'wc2026_map_exported.html': 'home',
      'wc2026_countries.html': 'countries',
      'wc2026_france_departments.html': 'france',
      'wc2026_live_game.html': 'live',
    };
    this._currentGuideId = _guideIdMap[page] ?? null;
    if (!this._currentGuideId) {
      const btn = this._el('guide-btn');
      if (btn) btn.disabled = true;
    }

    this._el('auth-section').style.visibility = 'hidden';
    this._offsetSibling();
    this._init();
  }

  _el(ref) { return this._refs[ref]; }

  async _onGuideClick() {
    this._guideActive = !this._guideActive;
    const { toggleGuide } = await import('./guide-mode.js');
    toggleGuide(this);
  }

  _showOffline(category, techDetail) {
    console.warn('[auth-bar]', techDetail);
    const nav = this.querySelector('nav');
    if (nav) nav.style.background = '#f5f2ec';
    const section = this._freshAuthSection();
    section.style.visibility = '';

    const modalId = 'mundial-offline-modal';
    const onWarnClick = () => {
      let existing = document.getElementById(modalId);
      if (existing) { bootstrap.Modal.getInstance(existing)?.dispose(); existing.remove(); }
      const modal = document.createElement('div');
      modal.id = modalId;
      modal.className = 'modal fade';
      modal.tabIndex = -1;
      render(_offlineModalTemplate(category), modal);
      document.body.appendChild(modal);
      new bootstrap.Modal(modal).show();
    };

    render(_offlineSectionTemplate(category, onWarnClick), section);
    this.dispatchEvent(new CustomEvent('auth-bar-offline', { bubbles: true, detail: { category } }));
  }

  _backendCheck() {
    return fetch(this.BACKEND + '/api/auth/me', {
      credentials: 'include',
      signal: AbortSignal.timeout(3000),
      headers: {'ngrok-skip-browser-warning': '1'}
    });
  }

  _retryUntilOnline() {
    return new Promise(resolve => {
      const attempt = async () => {
        await new Promise(r => setTimeout(r, 30000));
        try {
          await this._backendCheck();
          resolve();
        } catch {
          attempt();
        }
      };
      attempt();
    });
  }

  _restoreAuthSection() {
    const nav = this.querySelector('nav');
    if (nav) nav.style.background = '';
    const section = this._freshAuthSection();
    render(_authSectionTemplate(this._authCallbacks), section);
    section.querySelectorAll('[data-ref]').forEach(el => {
      this._refs[el.dataset.ref] = el;
    });
    const modal = document.getElementById('mundial-offline-modal');
    if (modal) modal.remove();
    this.dispatchEvent(new CustomEvent('auth-bar-online', { bubbles: true, detail: { socket: this.socket, backend: this.BACKEND } }));
  }

  _freshAuthSection() {
    const old = this._el('auth-section');
    const fresh = old.cloneNode(false);
    old.replaceWith(fresh);
    this._refs['auth-section'] = fresh;
    return fresh;
  }

  _offsetSibling() {
    const next = this.nextElementSibling;
    if (next) {
      const pos = getComputedStyle(next).position;
      if (pos === 'fixed' || pos === 'sticky') next.style.top = '32px';
      else next.style.marginTop = '32px';
    }
  }

  async _init() {
    try {
      if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        this.BACKEND = 'http://localhost:5002';
      } else {
        const cfg = await fetch('./backend_config.json').then(r => r.json());
        this.BACKEND = cfg.backend_url;
      }
      if (!this.BACKEND) {
        this._showOffline('server', 'not configured');
        return;
      }
      await this._backendCheck();
    } catch (err) {
      const techDetail = err.name === 'TimeoutError' ? `timed out (${this.BACKEND})` : `unreachable (${this.BACKEND || 'no URL'})`;
      this._showOffline('connection', techDetail);
      await this._retryUntilOnline();
      this._restoreAuthSection();
    }

    this._authCallbacks = {
      onSignIn: () => window.open(this.BACKEND + '/login', 'mundial_login', 'width=420,height=500,left=200,top=200'),
      onSignOut: async () => {
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
      },
    };

    const section = this._freshAuthSection();
    render(_authSectionTemplate(this._authCallbacks), section);
    section.querySelectorAll('[data-ref]').forEach(el => { this._refs[el.dataset.ref] = el; });
    section.style.visibility = '';
    this.dispatchEvent(new CustomEvent('auth-bar-ready', { bubbles: true, detail: { backend: this.BACKEND } }));

    const stored = localStorage.getItem('mundial_user');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this._showUser(data.user ?? data, data.admin ?? false);
      } catch {}
    }

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

    this._connectWebSocket();
  }

  _showUser(user, isAdmin) {
    this._el('sign-in').classList.add('d-none');
    this._el('signed-in').classList.remove('d-none');
    this._el('pic').src = user.picture;
    const picLink = this._el('pic-link');
    if (isAdmin) {
      picLink.href = this.BACKEND + '/admin-auth';
      picLink.title = _t.navAdmin;
      picLink.style.cursor = 'pointer';
    } else {
      picLink.removeAttribute('href');
      picLink.title = user.name;
      picLink.style.cursor = 'default';
    }
  }

  _signOut() {
    localStorage.removeItem('mundial_user');
    localStorage.removeItem('mundial_sid');
    this._el('signed-in').classList.add('d-none');
    this._el('sign-in').classList.remove('d-none');
  }

  _connectWebSocket() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/socket.io-client@4/dist/socket.io.min.js';
    script.onload = () => {
      this.socket = io(this.BACKEND, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
      });
      const sock = this.socket;

      let offlineTimer = null;

      sock.on('connect', () => {
        console.log('[auth-bar] WebSocket connected, id:', sock.id);
        if (offlineTimer) { clearTimeout(offlineTimer); offlineTimer = null; }
        this._hideConnectionToast();
        if (this._wsOffline) {
          this._wsOffline = false;
          this._restoreAuthSection();
          this._el('auth-section').style.visibility = '';
          this._refreshAuth();
        } else {
          this._refreshAuth();
          this.dispatchEvent(new CustomEvent('auth-bar-online', { bubbles: true, detail: { socket: this.socket, backend: this.BACKEND } }));
        }
      });

      sock.on('disconnect', (reason) => {
        console.warn('[auth-bar] WebSocket disconnected:', reason);
        offlineTimer = setTimeout(() => {
          this._wsOffline = true;
          this._showOffline('connection', 'WebSocket disconnected');
        }, 5000);
      });

      sock.on('reconnect', (attempt) => {
        console.log('[auth-bar] WebSocket reconnected after', attempt, 'attempt(s)');
      });

      sock.on('reconnect_attempt', (attempt) => {
        console.log('[auth-bar] WebSocket reconnection attempt', attempt);
      });

      sock.on('connect_error', (err) => {
        console.warn('[auth-bar] WebSocket connect error:', err.message);
      });

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

      sock.on('user_login', ({email}) => {
        console.log('[auth-bar] user_login event:', email);
      });

      sock.on('user_logout', ({email}) => {
        console.log('[auth-bar] user_logout event:', email);
        const raw = localStorage.getItem('mundial_user');
        if (!raw) return;
        try {
          const data = JSON.parse(raw);
          const cur = (data.user ?? data).email;
          if (cur === email) this._signOut();
        } catch {}
      });
    };
    document.head.appendChild(script);
  }

  async _refreshAuth() {
    try {
      const resp = await fetch(this.BACKEND + '/api/auth/me', {
        credentials: 'include',
        signal: AbortSignal.timeout(3000),
        headers: {'ngrok-skip-browser-warning': '1'}
      });
      const data = await resp.json();
      if (data.user) {
        localStorage.setItem('mundial_user', JSON.stringify(data));
        this._showUser(data.user, data.admin ?? false);
      } else {
        this._signOut();
      }
    } catch {}
  }

  _showConnectionToast(msg, type) {
    this._hideConnectionToast();
    const toast = document.createElement('div');
    toast.id = 'mundial-conn-toast';
    const bg = type === 'warning' ? '#fff3cd' : '#d1e7dd';
    const color = type === 'warning' ? '#664d03' : '#0f5132';
    toast.style.cssText = `position:fixed;bottom:12px;left:50%;transform:translateX(-50%);z-index:9999;padding:6px 16px;border-radius:6px;font-size:12px;background:${bg};color:${color};box-shadow:0 2px 8px rgba(0,0,0,.15);transition:opacity .3s`;
    toast.textContent = msg;
    document.body.appendChild(toast);
  }

  _hideConnectionToast() {
    const existing = document.getElementById('mundial-conn-toast');
    if (existing) existing.remove();
  }
}

customElements.define('mundial-auth-bar', MundialAuthBar);
