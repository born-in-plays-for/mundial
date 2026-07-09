import { html, render } from 'https://cdn.jsdelivr.net/npm/lit-html@3/lit-html.js';

// Wires a Share icon button: copies buildUrl() to the clipboard, shows a small Bootstrap toast
// confirming success/failure. Byte-for-byte identical UI on control_sidebar.js's #csb-share and
// players_sidebar.js's #psb-share — only what URL gets built differs per page, so that's the one
// thing left to the caller.
export function wireShareButton(btnEl, { T, buildUrl }) {
  let _toastEl = null;
  const _showToast = msg => {
    if (!_toastEl) {
      const container = document.createElement('div');
      container.className = 'toast-container position-fixed end-0 p-3';
      container.style.top = '32px'; // clears the fixed navbar (mundial-auth-bar)
      _toastEl = document.createElement('div');
      _toastEl.className = 'toast align-items-center';
      _toastEl.setAttribute('role', 'status');
      _toastEl.setAttribute('aria-live', 'polite');
      _toastEl.setAttribute('aria-atomic', 'true');
      container.appendChild(_toastEl);
      document.body.appendChild(container);
    }
    render(html`<div class="d-flex">
      <div class="toast-body">${msg}</div>
      <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast" aria-label="${T.csbParams.close}"></button>
    </div>`, _toastEl);
    bootstrap.Toast.getOrCreateInstance(_toastEl, { delay: 2000 }).show();
  };

  btnEl?.addEventListener('click', async e => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(buildUrl());
      _showToast(T.csbParams.shareCopied);
    } catch {
      _showToast(T.csbParams.shareFailed);
    }
  });
}
