import { T as _t } from './i18n.js';
import { html, render, nothing } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';
import { unsafeHTML } from 'https://cdn.jsdelivr.net/npm/lit-html@3/directives/unsafe-html.js';

const _icon = (paths) => `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${paths}</svg>`;
const ICON_HOME = _icon(`<path d="M22 22L2 22" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M2 11L10.1259 4.49931C11.2216 3.62279 12.7784 3.62279 13.8741 4.49931L22 11" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M15.5 5.5V3.5C15.5 3.22386 15.7239 3 16 3H18.5C18.7761 3 19 3.22386 19 3.5V8.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M4 22V9.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M20 22V9.5" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M15 22V17C15 15.5858 15 14.8787 14.5607 14.4393C14.1213 14 13.4142 14 12 14C10.5858 14 9.87868 14 9.43934 14.4393C9 14.8787 9 15.5858 9 17V22" stroke="#1C274C" stroke-width="1.5"/><path d="M14 9.5C14 10.6046 13.1046 11.5 12 11.5C10.8954 11.5 10 10.6046 10 9.5C10 8.39543 10.8954 7.5 12 7.5C13.1046 7.5 14 8.39543 14 9.5Z" stroke="#1C274C" stroke-width="1.5"/>`);
const ICON_LIVE = _icon(`<path d="M2 14C2 10.2288 2 8.34315 3.17157 7.17157C4.34315 6 6.22876 6 10 6H14C17.7712 6 19.6569 6 20.8284 7.17157C22 8.34315 22 10.2288 22 14C22 17.7712 22 19.6569 20.8284 20.8284C19.6569 22 17.7712 22 14 22H10C6.22876 22 4.34315 22 3.17157 20.8284C2 19.6569 2 17.7712 2 14Z" stroke="#1C274C" stroke-width="1.5"/><circle cx="8" cy="14" r="3" stroke="#1C274C" stroke-width="1.5"/><path d="M13.5 11H19" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M13.5 14H19" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M13.5 17H19" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M6.5 6L15 2" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>`);
const ICON_FRANCE = `<svg style="width:24px;height:24px" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg"><path fill="none" stroke="#1C274C" stroke-width="24" stroke-linejoin="round" d="M283.4 19.83c-3.2 0-31.2 5.09-31.2 5.09-1.3 41.61-30.4 78.48-90.3 84.88l-12.8-23.07-25.1 2.48 11.3 60.09-113.79-4.9 12.2 41.5C156.3 225.4 150.7 338.4 124 439.4c47 53 141.8 47.8 186 43.1 3.1-62.2 52.4-64.5 135.9-32.2 11.3-17.6 18.8-36 44.6-50.7l-46.6-139.5-27.5 6.2c11-21.1 32.2-49.9 50.4-63.4l15.6-86.9c-88.6-6.3-146.4-46.36-199-96.17z"/></svg>`;
const ICON_RANKINGS = _icon(`<path d="M16 22V13C16 11.5858 16 10.8787 15.5607 10.4393C15.1213 10 14.4142 10 13 10H11C9.58579 10 8.87868 10 8.43934 10.4393C8 10.8787 8 11.5858 8 13V22" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M8 22C8 20.5858 8 19.8787 7.56066 19.4393C7.12132 19 6.41421 19 5 19C3.58579 19 2.87868 19 2.43934 19.4393C2 19.8787 2 20.5858 2 22" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M22 22V19C22 17.5858 22 16.8787 21.5607 16.4393C21.1213 16 20.4142 16 16.4393 16.4393C16 16.8787 16 17.5858 16 19V22" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M11.1459 3.02251C11.5259 2.34084 11.7159 2 12 2C12.2841 2 12.4741 2.34084 12.8541 3.02251L12.9524 3.19887C13.0603 3.39258 13.1143 3.48944 13.1985 3.55334C13.2827 3.61725 13.3875 3.64097 13.5972 3.68841L13.7881 3.73161C14.526 3.89857 14.895 3.98205 14.9828 4.26432C15.0706 4.54659 14.819 4.84072 14.316 5.42898L14.1858 5.58117C14.0429 5.74833 13.9714 5.83191 13.9392 5.93531C13.9071 6.03872 13.9179 6.15023 13.9395 6.37327L13.9592 6.57632C14.0352 7.36118 14.0733 7.75361 13.8435 7.92807C13.6136 8.10252 13.2682 7.94346 12.5773 7.62535L12.3986 7.54305C12.2022 7.45265 12.1041 7.40745 12 7.40745C11.8959 7.40745 11.7978 7.45265 11.6014 7.54305L11.4227 7.62535C10.7318 7.94346 10.3864 8.10252 10.1565 7.92807C9.92674 7.75361 9.96476 7.36118 10.0408 6.57632L10.0605 6.37327C10.0821 6.15023 10.0929 6.03872 10.0608 5.93531C10.0286 5.83191 9.95713 5.74833 9.81418 5.58117L9.68403 5.42898C9.18097 4.84072 8.92945 4.54659 9.01723 4.26432C9.10501 3.98205 9.47396 3.89857 10.2119 3.73161L10.4028 3.68841C10.6125 3.64097 10.7173 3.61725 10.8015 3.55334C10.8857 3.48944 10.9397 3.39258 11.0476 3.19887L11.1459 3.02251Z" stroke="#1C274C" stroke-width="1.5"/>`);
const ICON_PLAYERS = _icon(`<circle cx="12" cy="9" r="3" stroke="#1C274C" stroke-width="1.5"/><circle cx="12" cy="12" r="10" stroke="#1C274C" stroke-width="1.5"/><path d="M17.9691 20C17.81 17.1085 16.9247 15 11.9999 15C7.07521 15 6.18991 17.1085 6.03076 20" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>`);
const ICON_COUNTRIES = _icon(`<path d="M5 22V14M5 14V4M5 14L7.47067 13.5059C9.1212 13.1758 10.8321 13.3328 12.3949 13.958C14.0885 14.6354 15.9524 14.7619 17.722 14.3195L17.9364 14.2659C18.5615 14.1096 19 13.548 19 12.9037V5.53669C19 4.75613 18.2665 4.18339 17.5092 4.3727C15.878 4.78051 14.1597 4.66389 12.5986 4.03943L12.3949 3.95797C10.8321 3.33284 9.1212 3.17576 7.47067 3.50587L5 4M5 4V2" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/>`);
const ICON_GUIDE = _icon(`<circle cx="12" cy="12" r="10" stroke="#1C274C" stroke-width="1.5"/><circle cx="12" cy="12" r="4" stroke="#1C274C" stroke-width="1.5"/><path d="M15 9L19 5" stroke="#1C274C" stroke-width="1.5"/><path d="M5 19L9 15" stroke="#1C274C" stroke-width="1.5"/><path d="M9 9L5 5" stroke="#1C274C" stroke-width="1.5"/><path d="M19 19L15 15" stroke="#1C274C" stroke-width="1.5"/>`);
const ICON_STATUS = _icon(`<path d="M4 4H20L14 12V19L10 21V12L4 4Z" stroke="#1C274C" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`);
const ICON_HEATMAP = _icon(`<path d="M12 2C12 2 6 8 6 14C6 17.3137 8.68629 20 12 20C15.3137 20 18 17.3137 18 14C18 12 17 10 17 10C17 10 16 12 14 12C14 12 15 8 12 2Z" stroke="#1C274C" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>`);
const ICON_CARD = _icon(`<rect x="6" y="3" width="12" height="18" rx="2" stroke="#1C274C" stroke-width="1.5"/>`);
const ICON_CHAIN = `<svg class="chain-icon" width="24" height="24" viewBox="62 49 388 414" fill="none" xmlns="http://www.w3.org/2000/svg">
  <g fill="none" stroke-width="30" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="131,118 381,118 381,256 256,256" stroke="red" />
    <polygon points="185,64 77,118 185,172" fill="red" stroke="none" />
    
    <polyline points="256,256 131,256 131,394 381,394" stroke="blue" />
    <polygon points="327,340 435,394 327,448" fill="blue" stroke="none" />
  </g>
</svg>`;
const ICON_LOGIN = _icon(`<path d="M12.9999 21.9994C17.055 21.9921 19.1784 21.8926 20.5354 20.5355C21.9999 19.0711 21.9999 16.714 21.9999 12C21.9999 7.28595 21.9999 4.92893 20.5354 3.46447C19.071 2 16.714 2 11.9999 2C7.28587 2 4.92884 2 3.46438 3.46447C2.10734 4.8215 2.00779 6.94493 2.00049 11" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M3 21L11 13M11 13H5M11 13V19" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);
const ICON_LOGOUT = _icon(`<path d="M12.9999 21.9994C17.055 21.9921 19.1784 21.8926 20.5354 20.5355C21.9999 19.0711 21.9999 16.714 21.9999 12C21.9999 7.28595 21.9999 4.92893 20.5354 3.46447C19.071 2 16.714 2 11.9999 2C7.28587 2 4.92884 2 3.46438 3.46447C2.10734 4.8215 2.00779 6.94493 2.00049 11" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round"/><path d="M11 13L3 21M3 21H9M3 21V15" stroke="#1C274C" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>`);
const WA_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#25D366" style="width:18px;height:18px;vertical-align:-3px;display:inline-block"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>`;
// Backend not configured / not running — images/settings-off-svgrepo-com.svg (gear from solar_linear/settings-svgrepo-com.svg + crossing bar)
const ICON_SERVER_OFF = `<svg class="warn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" style="width:24px;height:24px;vertical-align:-3px;display:inline-block"><circle cx="12" cy="12" r="3" stroke="#0dcaf0" stroke-width="1.5"/><path d="M13.7654 2.15224C13.3978 2 12.9319 2 12 2C11.0681 2 10.6022 2 10.2346 2.15224C9.74457 2.35523 9.35522 2.74458 9.15223 3.23463C9.05957 3.45834 9.0233 3.7185 9.00911 4.09799C8.98826 4.65568 8.70226 5.17189 8.21894 5.45093C7.73564 5.72996 7.14559 5.71954 6.65219 5.45876C6.31645 5.2813 6.07301 5.18262 5.83294 5.15102C5.30704 5.08178 4.77518 5.22429 4.35436 5.5472C4.03874 5.78938 3.80577 6.1929 3.33983 6.99993C2.87389 7.80697 2.64092 8.21048 2.58899 8.60491C2.51976 9.1308 2.66227 9.66266 2.98518 10.0835C3.13256 10.2756 3.3397 10.437 3.66119 10.639C4.1338 10.936 4.43789 11.4419 4.43786 12C4.43783 12.5581 4.13375 13.0639 3.66118 13.3608C3.33965 13.5629 3.13248 13.7244 2.98508 13.9165C2.66217 14.3373 2.51966 14.8691 2.5889 15.395C2.64082 15.7894 2.87379 16.193 3.33973 17C3.80568 17.807 4.03865 18.2106 4.35426 18.4527C4.77508 18.7756 5.30694 18.9181 5.83284 18.8489C6.07289 18.8173 6.31632 18.7186 6.65204 18.5412C7.14547 18.2804 7.73556 18.27 8.2189 18.549C8.70224 18.8281 8.98826 19.3443 9.00911 19.9021C9.02331 20.2815 9.05957 20.5417 9.15223 20.7654C9.35522 21.2554 9.74457 21.6448 10.2346 21.8478C10.6022 22 11.0681 22 12 22C12.9319 22 13.3978 22 13.7654 21.8478C14.2554 21.6448 14.6448 21.2554 14.8477 20.7654C14.9404 20.5417 14.9767 20.2815 14.9909 19.902C15.0117 19.3443 15.2977 18.8281 15.781 18.549C16.2643 18.2699 16.8544 18.2804 17.3479 18.5412C17.6836 18.7186 17.927 18.8172 18.167 18.8488C18.6929 18.9181 19.2248 18.7756 19.6456 18.4527C19.9612 18.2105 20.1942 17.807 20.6601 16.9999C21.1261 16.1929 21.3591 15.7894 21.411 15.395C21.4802 14.8691 21.3377 14.3372 21.0148 13.9164C20.8674 13.7243 20.6602 13.5628 20.3387 13.3608C19.8662 13.0639 19.5621 12.558 19.5621 11.9999C19.5621 11.4418 19.8662 10.9361 20.3387 10.6392C20.6603 10.4371 20.8675 10.2757 21.0149 10.0835C21.3378 9.66273 21.4803 9.13087 21.4111 8.60497C21.3592 8.21055 21.1262 7.80703 20.6602 7C20.1943 6.19297 19.9613 5.78945 19.6457 5.54727C19.2249 5.22436 18.693 5.08185 18.1671 5.15109C17.9271 5.18269 17.6837 5.28136 17.3479 5.4588C16.8545 5.71959 16.2644 5.73002 15.7811 5.45096C15.2977 5.17191 15.0117 4.65566 14.9909 4.09794C14.9767 3.71848 14.9404 3.45833 14.8477 3.23463C14.6448 2.74458 14.2554 2.35523 13.7654 2.15224Z" stroke="#0dcaf0" stroke-width="1.5"/><path d="M2 2L22 22" stroke="#f5f2ec" stroke-width="5" stroke-linecap="round"/><path d="M2 2L22 22" stroke="#0dcaf0" stroke-width="2" stroke-linecap="round"/></svg>`;
// Internet confirmed working, backend unreachable — images/database-error-svgrepo-com.svg
const ICON_DB_ERROR = `<svg class="warn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" style="width:24px;height:24px;vertical-align:-3px;display:inline-block"><line x1="17.05" y1="20.5" x2="16.95" y2="20.5" stroke="#0dcaf0" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.95"/><path d="M21,12V10a1,1,0,0,0-1-1H4a1,1,0,0,0-1,1v4a1,1,0,0,0,1,1h8" stroke="#0dcaf0" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M12,15H4a1,1,0,0,0-1,1v4a1,1,0,0,0,1,1h8" stroke="#0dcaf0" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/><path d="M20,9H4A1,1,0,0,1,3,8V4A1,1,0,0,1,4,3H20a1,1,0,0,1,1,1V8A1,1,0,0,1,20,9Zm-3,4v3" stroke="#0dcaf0" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/></svg>`;
// No internet connection at all — images/wifi-off-svgrepo-com.svg
const ICON_WIFI_OFF = `<svg class="warn-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0dcaf0" style="width:24px;height:24px;vertical-align:-3px;display:inline-block"><circle cx="12" cy="19" r="1"/><path d="M12.44 11l-1.9-1.89-2.46-2.44-1.55-1.55-1.82-1.83a1 1 0 0 0-1.42 1.42l1.38 1.37 1.46 1.46 2.23 2.24 1.55 1.54 2.74 2.74 2.79 2.8 3.85 3.85a1 1 0 0 0 1.42 0 1 1 0 0 0 0-1.42z"/><path d="M21.72 7.93A13.93 13.93 0 0 0 12 4a14.1 14.1 0 0 0-4.44.73l1.62 1.62a11.89 11.89 0 0 1 11.16 3 1 1 0 0 0 .69.28 1 1 0 0 0 .72-.31 1 1 0 0 0-.03-1.39z"/><path d="M3.82 6.65a14.32 14.32 0 0 0-1.54 1.28 1 1 0 0 0 1.38 1.44 13.09 13.09 0 0 1 1.6-1.29z"/><path d="M17 13.14a1 1 0 0 0 .71.3 1 1 0 0 0 .72-1.69A9 9 0 0 0 12 9h-.16l2.35 2.35A7 7 0 0 1 17 13.14z"/><path d="M7.43 10.26a8.8 8.8 0 0 0-1.9 1.49A1 1 0 0 0 7 13.14a7.3 7.3 0 0 1 2-1.41z"/><path d="M8.53 15.4a1 1 0 1 0 1.39 1.44 3.06 3.06 0 0 1 3.84-.25l-2.52-2.52a5 5 0 0 0-2.71 1.33z"/></svg>`;

const _hoverStyle = 'line-height:0;opacity:.6;transition:opacity .2s';
const _navLink = (href, label, icon, extra = '', guideId = '', hidden = false) =>
  html`<a href=${href} class="text-decoration-none d-flex align-items-center ${extra}"
    aria-label=${label} title=${label} style=${hidden ? `${_hoverStyle};display:none !important` : _hoverStyle}
    data-guide=${guideId || nothing}
    @mouseover=${e => e.currentTarget.style.opacity = 1}
    @mouseout=${e => e.currentTarget.style.opacity = .6}>${unsafeHTML(icon)}</a>`;

const _dropdownItem = (href, label, icon, guideId = '', guideTab = '') =>
  html`<li><a href=${href} class="dropdown-item d-flex align-items-center gap-2"
    aria-label=${label} title=${label} style=${_hoverStyle}
    data-guide=${guideId || nothing} data-guide-tab=${guideTab || nothing}
    @mouseover=${e => e.currentTarget.style.opacity = 1}
    @mouseout=${e => e.currentTarget.style.opacity = .6}>${unsafeHTML(icon)} ${label}</a></li>`;

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

const _OFFLINE_TITLE = { server: () => _t.offlineTitle, connection: () => _t.offlineTitleConn, offline: () => _t.offlineTitleOffline };
const _OFFLINE_BODY = { server: () => _t.offlineBody, connection: () => _t.offlineBodyConn, offline: () => _t.offlineBodyOffline };
const _OFFLINE_ICON = { server: ICON_SERVER_OFF, connection: ICON_DB_ERROR, offline: ICON_WIFI_OFF };

const _offlineSectionTemplate = (category, onWarnClick) => {
  const tip = _OFFLINE_TITLE[category]();
  return html`<button class="btn btn-link btn-sm p-0 d-flex align-items-center"
    title=${tip} style="line-height:0"
    @click=${onWarnClick}>${unsafeHTML(_OFFLINE_ICON[category])}</button>`;
};

const _offlineModalTemplate = (category) => {
  const title = _OFFLINE_TITLE[category]();
  const body = _OFFLINE_BODY[category]();
  const icon = _OFFLINE_ICON[category];
  return html`
  <div class="modal-dialog modal-dialog-centered">
    <div class="modal-content">
      <div class="modal-header py-2">
        <h6 class="modal-title d-flex align-items-center gap-2">${unsafeHTML(icon)} ${title}</h6>
        <button type="button" class="btn-close btn-close-sm" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body" style="font-size:14px">
        <p class="${category === 'connection' ? '' : 'mb-0'}">${body}</p>
        ${category === 'connection' ? html`
        <p class="mb-0"><strong>${_t.offlineContact}</strong> ${_t.offlineContactBody}<br>
          <a href="https://wa.me/393755042951" target="_blank" rel="noopener"
            class="d-inline-flex align-items-center gap-1 mt-1"
            style="color:#25D366">${unsafeHTML(WA_ICON)} +39 375 504 2951</a>
        </p>` : nothing}
      </div>
    </div>
  </div>`;
};

class MundialAuthBar extends HTMLElement {
  constructor() {
    super();
    this.BACKEND = '';
    this._guideActive = false;
    this._offlineCategory = null;
  }

  // Public: 'online', or one of the _showOffline categories ('server', 'connection', 'offline').
  // Read by guide-mode.js's 'auth' guide topic to highlight the currently-active state.
  connectionState() {
    return this._offlineCategory ?? 'online';
  }

  connectedCallback() {
    const page = location.pathname.split('/').pop() || 'index.html';
    // 'map' (the User's Guide, off the home icon) is the only real, page-tied guide topic —
    // the API Guide (the app's URL query parameter API, off the Players icon, since
    // wc2026_countries.html is no longer linked from the UI; see guide/guide-api.md's own
    // header comment) and Data Sources are both tabs *within* 'map' now (see
    // js/guide-mode.js's _TAB_CONFIG), not independent topics of their own — reached via
    // _guideTabMap, below, rather than their own _guideIdMap entry. Any page with no entry
    // here falls back to 'default' (a single shared "nothing here yet" placeholder) rather
    // than disabling the guide button — covers wc2026_countries.html, wc2026_live.html,
    // insights/*.html, and anything added later without needing its own explicit mapping.
    // 'auth' (offline/no-server-connection help) is separate — it's reachable via the profile
    // icon on any page, not tied to a page at all.
    const _guideIdMap = {
      '': 'map', 'index.html': 'map', 'wc2026_map.html': 'map',
      'wc2026_players.html': 'map',
    };
    const _guideTabMap = {
      'wc2026_players.html': 'api',
    };
    this._currentGuideId = _guideIdMap[page] ?? 'default';
    this._currentGuideTab = _guideTabMap[page] ?? 'guide';
    const _guideHref = new URL(location.href);
    _guideHref.searchParams.set('guide', this._currentGuideId);
    if (this._currentGuideTab !== 'guide') _guideHref.searchParams.set('tab', this._currentGuideTab);

    render(html`
      <nav class="navbar navbar-light bg-white border-bottom py-0 px-2"
        style="position:fixed;top:0;left:0;right:0;z-index:1050;height:32px">
        <div class="container-xxl d-flex align-items-center gap-4 px-1">
          ${_navLink('/', _t.navMap, ICON_HOME, '', 'map')}
          ${_navLink('/wc2026_countries.html', _t.navCountries, ICON_RANKINGS, '', '', true)}
          ${_navLink('/wc2026_live.html', _t.navLive, ICON_LIVE)}
          <div class="dropdown">
            <a href="#" class="nav-link dropdown-toggle d-flex align-items-center lh-1 p-0"
              role="button" data-bs-toggle="dropdown" aria-expanded="false"
              aria-label=${_t.navGoodies} title=${_t.navGoodies} style=${_hoverStyle}
              @mouseover=${e => e.currentTarget.style.opacity = 1}
              @mouseout=${e => e.currentTarget.style.opacity = .6}>
              <img src="/images/puzzle-piece-svgrepo-com.svg" width="24" height="24" alt="">
            </a>
            <ul class="dropdown-menu dropdown-menu-start" style="min-width:0">
              <!-- Superseded by #tab-players-btn (wc2026_map.html's bottom panel) as the map's
                   own all-players view — kept reachable here rather than dropped outright, since
                   wc2026_players.html is still a real, independent standalone page. -->
              ${_dropdownItem('/wc2026_countries.html', _t.navCountries, ICON_COUNTRIES, 'map', 'api')}
              ${_dropdownItem('/wc2026_players.html', _t.navPlayers, ICON_PLAYERS, 'map', 'api')}
              ${_dropdownItem('/insights/discipline.html', _t.navDiscipline, ICON_CARD)}
              ${_dropdownItem('/insights/france.html', _t.navFrance, ICON_FRANCE)}
              ${_dropdownItem('/insights/status.html', _t.navStatus, ICON_STATUS)}
              ${_dropdownItem('/insights/heat-map.html', _t.navHeatmap, ICON_HEATMAP)}
              ${_dropdownItem('/chains/wc2026_chain_longest.html', _t.navChain, ICON_CHAIN)}
            </ul>
          </div>
          <div class="vr"></div>
          <a data-ref="guide-btn" href=${_guideHref.pathname + _guideHref.search}
            class="text-decoration-none d-flex align-items-center"
            aria-label=${_t.navGuide} title=${_t.navGuide} style=${_hoverStyle}
            data-bs-toggle="button"
            @click=${e => this._onGuideClick(e)}
            @mouseover=${e => e.currentTarget.style.opacity = 1}
            @mouseout=${e => e.currentTarget.style.opacity = .6}>
            ${unsafeHTML(ICON_GUIDE)}
          </a>
          <div data-ref="auth-section" data-guide="auth"
            class="d-flex align-items-center gap-3 ms-auto">
            ${_authSectionTemplate()}
          </div>
        </div>
      </nav>`, this);

    const navLinks = {
      '/': ['index.html', 'wc2026_map.html', ''],
      '/wc2026_countries.html': ['wc2026_countries.html'],
      '/wc2026_players.html': ['wc2026_players.html'],
      '/insights/france.html': ['france.html'],
      '/insights/discipline.html': ['discipline.html'],
      '/insights/status.html': ['status.html'],
      '/insights/heat-map.html': ['heat-map.html'],
      '/chains/wc2026_chain_longest.html': ['wc2026_chain_longest.html'],
      '/wc2026_live.html': ['wc2026_live.html'],
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

    this._el('auth-section').style.visibility = 'hidden';
    this._offsetSibling();
    this._init();

    // ?guide[=section][&tab=api|data] — auto-open guide panel on load
    const _sp = new URLSearchParams(location.search);
    if (_sp.has('guide')) {
      const _validGuide = new Set(['map', 'api', 'data', 'auth', 'default']);
      let _target = _sp.get('guide') || this._currentGuideId;
      let _targetTab = _sp.get('tab') || 'guide';
      // Legacy/old-bookmark support: 'api'/'data' used to be independent top-level guideIds —
      // they're tabs within 'map' now (see js/guide-mode.js's _TAB_CONFIG), so a bare
      // ?guide=api link still opens the right thing instead of silently doing nothing.
      if (_target === 'api' || _target === 'data') { _targetTab = _target; _target = 'map'; }
      if (_target && _validGuide.has(_target)) {
        this._currentGuideId = _target;
        this._currentGuideTab = _targetTab;
        requestAnimationFrame(async () => {
          this._guideActive = true;
          const { toggleGuide } = await import('./guide-mode.js');
          toggleGuide(this);
        });
      }
    }
  }

  _el(ref) { return this._refs[ref]; }

  async _onGuideClick(e) {
    // guide-btn is a real <a href="?guide=..."> so right-click / middle-click / ctrl+click
    // open it in a new tab or split view via the browser's native handling. Only intercept
    // a plain primary-button click for the in-page SPA toggle.
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    this._guideActive = !this._guideActive;
    const { toggleGuide } = await import('./guide-mode.js');
    toggleGuide(this);
  }

  _showOffline(category, techDetail) {
    console.warn('[auth-bar]', techDetail);
    this._offlineCategory = category;
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

  // navigator.onLine only reflects the network interface (false for airplane mode / wifi off);
  // it can't detect a dead wifi/captive portal, so a reachable-but-opaque probe confirms those too.
  async _hasInternet() {
    if (!navigator.onLine) return false;
    try {
      await fetch('https://www.google.com/generate_204', { mode: 'no-cors', cache: 'no-store', signal: AbortSignal.timeout(2000) });
      return true;
    } catch {
      return false;
    }
  }

  _retryUntilOnline() {
    return new Promise(resolve => {
      const attempt = async () => {
        await new Promise(r => setTimeout(r, 30000));
        try {
          await this._backendCheck();
          resolve();
        } catch {
          // Re-check which offline category applies on every retry, not just the first —
          // otherwise "no internet" can never turn into "server unreachable" (or back) while
          // this loop is still polling for the backend to come back on its own.
          const online = await this._hasInternet();
          const category = online ? 'connection' : 'offline';
          if (category !== this._offlineCategory) this._showOffline(category, 'retry check');
          attempt();
        }
      };
      attempt();
    });
  }

  _restoreAuthSection() {
    this._offlineCategory = null;
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
      const online = await this._hasInternet();
      const category = online ? 'connection' : 'offline';
      const techDetail = !online ? 'no internet connection'
        : err.name === 'TimeoutError' ? `timed out (${this.BACKEND})`
        : `unreachable (${this.BACKEND || 'no URL'})`;
      this._showOffline(category, techDetail);
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
        offlineTimer = setTimeout(async () => {
          this._wsOffline = true;
          const online = await this._hasInternet();
          this._showOffline(online ? 'connection' : 'offline', 'WebSocket disconnected');
        }, 5000);
      });

      sock.on('reconnect', (attempt) => {
        console.log('[auth-bar] WebSocket reconnected after', attempt, 'attempt(s)');
      });

      sock.on('reconnect_attempt', (attempt) => {
        console.log('[auth-bar] WebSocket reconnection attempt', attempt);
      });

      sock.on('connect_error', async (err) => {
        console.warn('[auth-bar] WebSocket connect error:', err.message);
        // Reconnection keeps retrying (reconnectionAttempts: Infinity) and firing this on every
        // failed attempt, but a plain 'disconnect' only fires once, when the transport first
        // drops — so once shown, the offline/connection category never re-evaluated on its own.
        // Re-checking here catches the internet-comes-back-but-backend-still-down transition.
        if (this._wsOffline) {
          const online = await this._hasInternet();
          const category = online ? 'connection' : 'offline';
          if (category !== this._offlineCategory) this._showOffline(category, 'WebSocket connect error');
        }
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
