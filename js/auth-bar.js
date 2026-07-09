import { T as _t } from './i18n.js';
import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { unsafeHTML } from 'https://cdn.jsdelivr.net/npm/lit-html@3/directives/unsafe-html.js';

const _icon = (paths) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
const ICON_HOME = _icon(`<circle cx="12" cy="12" r="10" stroke="#1C274C" stroke-width="1.5"/><path d="M6 4.71053C6.78024 5.42105 8.38755 7.36316 8.57481 9.44737C8.74984 11.3955 10.0357 12.9786 12 13C12.7549 13.0082 13.5183 12.4629 13.5164 11.708C13.5158 11.4745 13.4773 11.2358 13.417 11.0163C13.3331 10.7108 13.3257 10.3595 13.5 10C14.1099 8.74254 15.3094 8.40477 16.2599 7.72186C16.6814 7.41898 17.0659 7.09947 17.2355 6.84211C17.7037 6.13158 18.1718 4.71053 17.9377 4" stroke="#1C274C" stroke-width="1.5"/><path d="M22 13C21.6706 13.931 21.4375 16.375 17.7182 16.4138C17.7182 16.4138 14.4246 16.4138 13.4365 18.2759C12.646 19.7655 13.1071 21.3793 13.4365 22" stroke="#1C274C" stroke-width="1.5"/>`);
const ICON_LIVE = _icon(`<path d="M10.165 4.77922L10.6669 5.13443C11.0567 5.41029 11.5225 5.55844 12 5.55844C12.4776 5.55844 12.9434 5.41029 13.3332 5.13441L13.8351 4.77922C14.5514 4.27225 15.4074 4 16.2849 4H16.8974C17.3016 4 17.7099 4.02549 18.0908 4.16059C20.4735 5.00566 22.1125 8.09503 21.994 15.1026C21.9701 16.5145 21.6397 18.075 20.3658 18.6842C19.9688 18.8741 19.5033 19 18.9733 19C18.3373 19 17.8322 18.8187 17.4424 18.5632C16.5285 17.9642 15.8588 16.9639 14.8888 16.4609C14.3048 16.1581 13.6566 16 12.9989 16H11.0011C10.3434 16 9.69519 16.1581 9.11125 16.4609C8.14122 16.9639 7.47153 17.9642 6.55763 18.5632C6.1678 18.8187 5.66273 19 5.02671 19C4.49667 19 4.03121 18.8741 3.63423 18.6842C2.3603 18.075 2.02992 16.5145 2.00604 15.1026C1.88749 8.09504 3.52645 5.00566 5.90915 4.16059C6.29009 4.02549 6.69838 4 7.10257 4H7.71504C8.59264 4 9.44862 4.27225 10.165 4.77922Z" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M7.5 9V12M6 10.5L9 10.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M19 10.25C19 10.6642 18.6642 11 18.25 11C17.8358 11 17.5 10.6642 17.5 10.25C17.5 9.83579 17.8358 9.5 18.25 9.5C18.6642 9.5 19 9.83579 19 10.25Z" fill="#1C274C"/><path d="M16 10.25C16 10.6642 15.6642 11 15.25 11C14.8358 11 14.5 10.6642 14.5 10.25C14.5 9.83579 14.8358 9.5 15.25 9.5C15.6642 9.5 16 9.83579 16 10.25Z" fill="#1C274C"/><path d="M16.75 8C17.1642 8 17.5 8.33579 17.5 8.75C17.5 9.16421 17.1642 9.5 16.75 9.5C16.3358 9.5 16 9.16421 16 8.75C16 8.33579 16.3358 8 16.75 8Z" fill="#1C274C"/><path d="M16.75 11C17.1642 11 17.5 11.3358 17.5 11.75C17.5 12.1642 17.1642 12.5 16.75 12.5C16.3358 12.5 16 12.1642 16 11.75C16 11.3358 16.3358 11 16.75 11Z" fill="#1C274C"/>`);
const ICON_FRANCE = `<svg style="width:24px;height:24px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="#1C274C" stroke-width="24" stroke-linejoin="round" d="M283.4 19.83c-3.2 0-31.2 5.09-31.2 5.09-1.3 41.61-30.4 78.48-90.3 84.88l-12.8-23.07-25.1 2.48 11.3 60.09-113.79-4.9 12.2 41.5C156.3 225.4 150.7 338.4 124 439.4c47 53 141.8 47.8 186 43.1 3.1-62.2 52.4-64.5 135.9-32.2 11.3-17.6 18.8-36 44.6-50.7l-46.6-139.5-27.5 6.2c11-21.1 32.2-49.9 50.4-63.4l15.6-86.9c-88.6-6.3-146.4-46.36-199-96.17z"/></svg>`;
const ICON_RANKINGS = _icon(`<path d="M16 22V13C16 11.5858 16 10.8787 15.5607 10.4393C15.1213 10 14.4142 10 13 10H11C9.58579 10 8.87868 10 8.43934 10.4393C8 10.8787 8 11.5858 8 13V22" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M8 22C8 20.5858 8 19.8787 7.56066 19.4393C7.12132 19 6.41421 19 5 19C3.58579 19 2.87868 19 2.43934 19.4393C2 19.8787 2 20.5858 2 22" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M22 22V19C22 17.5858 22 16.8787 21.5607 16.4393C21.1213 16 20.4142 16 16.4393 16.4393C16 16.8787 16 17.5858 16 19V22" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M11.1459 3.02251C11.5259 2.34084 11.7159 2 12 2C12.2841 2 12.4741 2.34084 12.8541 3.02251L12.9524 3.19887C13.0603 3.39258 13.1143 3.48944 13.1985 3.55334C13.2827 3.61725 13.3875 3.64097 13.5972 3.68841L13.7881 3.73161C14.526 3.89857 14.895 3.98205 14.9828 4.26432C15.0706 4.54659 14.819 4.84072 14.316 5.42898L14.1858 5.58117C14.0429 5.74833 13.9714 5.83191 13.9392 5.93531C13.9071 6.03872 13.9179 6.15023 13.9395 6.37327L13.9592 6.57632C14.0352 7.36118 14.0733 7.75361 13.8435 7.92807C13.6136 8.10252 13.2682 7.94346 12.5773 7.62535L12.3986 7.54305C12.2022 7.45265 12.1041 7.40745 12 7.40745C11.8959 7.40745 11.7978 7.45265 11.6014 7.54305L11.4227 7.62535C10.7318 7.94346 10.3864 8.10252 10.1565 7.92807C9.92674 7.75361 9.96476 7.36118 10.0408 6.57632L10.0605 6.37327C10.0821 6.15023 10.0929 6.03872 10.0608 5.93531C10.0286 5.83191 9.95713 5.74833 9.81418 5.58117L9.68403 5.42898C9.18097 4.84072 8.92945 4.54659 9.01723 4.26432C9.10501 3.98205 9.47396 3.89857 10.2119 3.73161L10.4028 3.68841C10.6125 3.64097 10.7173 3.61725 10.8015 3.55334C10.8857 3.48944 10.9397 3.39258 11.0476 3.19887L11.1459 3.02251Z" stroke="#1C274C" stroke-width="1.5"/>`);
const ICON_PLAYERS = _icon(`<circle cx="12" cy="9" r="3" stroke="#1C274C" stroke-width="1.5"/><circle cx="12" cy="12" r="10" stroke="#1C274C" stroke-width="1.5"/><path d="M17.9691 20C17.81 17.1085 16.9247 15 11.9999 15C7.07521 15 6.18991 17.1085 6.03076 20" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>`);
const ICON_GUIDE = _icon(`<circle cx="12" cy="12" r="10" stroke="#1C274C" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke="#1C274C" stroke-width="1.5"/><path d="M15 9L19 5" stroke="#1C274C" stroke-width="1.5"/><path d="M5 19L9 15" stroke="#1C274C" stroke-width="1.5"/><path d="M9 9L5 5" stroke="#1C274C" stroke-width="1.5"/><path d="M19 19L15 15" stroke="#1C274C" stroke-width="1.5"/>`);
const ICON_MENU_DOTS = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="12" r="2" stroke="#1C274C" stroke-width="1.5"/><circle cx="12" cy="12" r="2" stroke="#1C274C" stroke-width="1.5"/><circle cx="19" cy="12" r="2" stroke="#1C274C" stroke-width="1.5"/></svg>`;
const ICON_COURSE_UP = _icon(`<path d="M2 12C2 7.28595 2 4.92893 3.46447 3.46447C4.92893 2 7.28595 2 12 2C16.714 2 19.0711 2 20.5355 3.46447C22 4.92893 22 7.28595 22 12C22 16.714 22 19.0711 20.5355 20.5355C19.0711 22 16.714 22 12 22C7.28595 22 4.92893 22 3.46447 20.5355C2 19.0711 2 16.714 2 12Z" stroke="#1C274C" stroke-width="1.5"/><path d="M7 14L9.29289 11.7071C9.68342 11.3166 10.3166 11.3166 10.7071 11.7071L12.2929 13.2929C12.6834 13.6834 13.3166 13.6834 13.7071 13.2929L17 10M17 10V12.5M17 10H14.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICON_STATUS = _icon(`<path d="M4 4H20L14 12V19L10 21V12L4 4Z" stroke="#1C274C" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`);
const ICON_LOGIN = _icon(`<path d="M12.9999 21.9994C17.055 21.9921 19.1784 21.8926 20.5354 20.5355C21.9999 19.0711 21.9999 16.714 21.9999 12C21.9999 7.28595 21.9999 4.92893 20.5354 3.46447C19.071 2 16.714 2 11.9999 2C7.28587 2 4.92884 2 3.46438 3.46447C2.10734 4.8215 2.00779 6.94493 2.00049 11" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M3 21L11 13M11 13H5M11 13V19" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICON_LOGOUT = _icon(`<path d="M12.9999 21.9994C17.055 21.9921 19.1784 21.8926 20.5354 20.5355C21.9999 19.0711 21.9999 16.714 21.9999 12C21.9999 7.28595 21.9999 4.92893 20.5354 3.46447C19.071 2 16.714 2 11.9999 2C7.28587 2 4.92884 2 3.46438 3.46447C2.10734 4.8215 2.00779 6.94493 2.00049 11" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M11 13L3 21M3 21H9M3 21V15" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);
const WA_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366" style="width:18px;height:18px;vertical-align:-3px;display:inline-block"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
const WARN_ICON = `<svg class="warn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" style="width:24px;height:24px;vertical-align:-3px;display:inline-block"><path d="M3 10.4167C3 7.21907 3 5.62028 3.37752 5.08241C3.75503 4.54454 5.25832 4.02996 8.26491 3.00079L8.83772 2.80472C10.405 2.26824 11.1886 2 12 2C12.8114 2 13.595 2.26824 15.1623 2.80472L15.7351 3.00079C18.7417 4.02996 20.245 4.54454 20.6225 5.08241C21 5.62028 21 7.21907 21 10.4167C21 10.8996 21 11.4234 21 11.9914C21 17.6294 16.761 20.3655 14.1014 21.5273C13.38 21.8424 13.0193 22 12 22C10.9807 22 10.62 21.8424 9.89856 21.5273C7.23896 20.3655 3 17.6294 3 11.9914C3 11.4234 3 10.8996 3 10.4167Z" stroke="#f59e0b" stroke-width="1.5"/><path d="M12 8V12" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round"/><circle cx="12" cy="15" r="1" fill="#f59e0b"/></svg>`;

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
          ${_navLink('/', _t.navMap, ICON_HOME, '', 'map')}
          ${_navLink('/wc2026_countries.html', _t.navCountries, ICON_RANKINGS, '', 'countries')}
          ${_navLink('/wc2026_players.html', _t.navPlayers, ICON_PLAYERS, '', 'players')}
          ${_navLink('/wc2026_live.html', _t.navLive, ICON_LIVE, '', 'live')}
          <div class="dropdown">
            <a class="nav-link dropdown-toggle d-flex align-items-center lh-1 p-0"
              href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false"
              style="opacity:0.6">
              ${unsafeHTML(ICON_MENU_DOTS)}
            </a>
            <ul class="dropdown-menu dropdown-menu-start" style="min-width:0">
              <li><a href="/insights/france.html" class="dropdown-item d-flex align-items-center gap-2"
                aria-label=${_t.navFrance} title=${_t.navFrance} data-guide="france"
                style="opacity:0.6">
                ${unsafeHTML(ICON_FRANCE)} ${_t.navFrance}
              </a></li>
              <li><a href="/insights/perf.html" class="dropdown-item d-flex align-items-center gap-2"
                aria-label="Performance" title="Group stage performance"
                style="opacity:0.6">
                ${unsafeHTML(ICON_COURSE_UP)} Performance
              </a></li>
              <li><a href="/insights/status.html" class="dropdown-item d-flex align-items-center gap-2"
                aria-label="Status" title="Imported players — elimination status"
                style="opacity:0.6">
                ${unsafeHTML(ICON_STATUS)} Status
              </a></li>
            </ul>
          </div>
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
      '/': ['index.html', 'wc2026_map.html', ''],
      '/wc2026_countries.html': ['wc2026_countries.html'],
      '/wc2026_players.html': ['wc2026_players.html'],
      '/insights/france.html': ['france.html'],
      '/insights/perf.html': ['perf.html'],
      '/insights/status.html': ['status.html'],
      '/wc2026_live.html': ['wc2026_live.html'],
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
      '': 'map', 'index.html': 'map', 'wc2026_map.html': 'map',
      'wc2026_countries.html': 'countries',
      'wc2026_players.html': 'players',
      'france.html': 'france',
      'wc2026_live.html': 'live',
    };
    this._currentGuideId = _guideIdMap[page] ?? null;
    if (!this._currentGuideId) {
      const btn = this._el('guide-btn');
      if (btn) btn.disabled = true;
    }

    this._el('auth-section').style.visibility = 'hidden';
    this._offsetSibling();
    this._init();

    // ?guide[=section] — auto-open guide panel on load
    const _sp = new URLSearchParams(location.search);
    if (_sp.has('guide')) {
      const _validGuide = new Set(['map', 'countries', 'players', 'france', 'live', 'auth']);
      const _target = _sp.get('guide') || this._currentGuideId;
      if (_target && _validGuide.has(_target)) {
        this._currentGuideId = _target;
        requestAnimationFrame(async () => {
          this._guideActive = true;
          const { toggleGuide } = await import('./guide-mode.js');
          toggleGuide(this);
        });
      }
    }
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
    // Deliberately matches the page's own background (--page-bg, css/global.css) rather than
    // the navbar's normal one — offline state visually "flattens" the navbar into the page
    // instead of standing out. Was a hardcoded literal duplicate of body's own background;
    // reads the shared variable now so the two can't silently drift apart.
    if (nav) nav.style.background = 'var(--page-bg)';
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
        const cfg = await fetch('/backend_config.json').then(r => r.json());
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
