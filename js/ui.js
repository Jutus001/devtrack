// DevTrack — ui.js
// Shared UI components: Toasts, Modals, Confirmation Dialogs

// ── Toasts ──────────────────────────────────────────────────
export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container') || createToastContainer();
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">${message}</div>
    <button class="toast-close">&times;</button>
  `;
  
  container.appendChild(toast);
  
  // Auto remove
  const timeout = setTimeout(() => {
    removeToast(toast);
  }, 4000);

  toast.querySelector('.toast-close').onclick = () => {
    clearTimeout(timeout);
    removeToast(toast);
  };
}

function removeToast(toast) {
  toast.style.opacity = '0';
  toast.style.transform = 'translateY(10px)';
  setTimeout(() => toast.remove(), 300);
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  document.body.appendChild(container);
  return container;
}

// ── Modals ───────────────────────────────────────────────────
// options: { id, title, body, size, primaryLabel, onPrimary, secondaryLabel, onSecondary }
export function openModal(options) {
  // Remove existing if any
  const existing = document.getElementById(options.id);
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = options.id;
  modal.className = 'modal-backdrop';
  modal.innerHTML = `
    <div class="modal modal-${options.size || 'sm'}">
      <div class="modal-header">
        <div class="modal-title">${options.title || 'Modal'}</div>
        <button class="modal-close-btn" title="Close (Esc)">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div class="modal-body">${options.body || ''}</div>
      <div class="modal-footer">
        ${options.secondaryLabel ? `<button class="btn btn-ghost" id="${options.id}-secondary">${options.secondaryLabel}</button>` : ''}
        <button class="btn" id="${options.id}-close">${options.closeLabel || 'Cancel'}</button>
        ${options.primaryLabel ? `<button class="btn btn-primary" id="${options.id}-primary">${options.primaryLabel}</button>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Wire events
  const close = () => {
    modal.remove();
    document.removeEventListener('keydown', escHandler);
    if (options.onClose) options.onClose();
  };

  const escHandler = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', escHandler);

  modal.querySelector('.modal-close-btn').onclick = close;
  modal.querySelector(`#${options.id}-close`).onclick = close;

  if (options.primaryLabel) {
    const btn = modal.querySelector(`#${options.id}-primary`);
    btn.onclick = async () => {
      btn.disabled = true;
      btn.textContent = 'Please wait...';
      const success = await options.onPrimary();
      if (success !== false) close();
      else {
        btn.disabled = false;
        btn.textContent = options.primaryLabel;
      }
    };
  }

  if (options.secondaryLabel) {
    modal.querySelector(`#${options.id}-secondary`).onclick = () => {
      if (options.onSecondary) options.onSecondary();
      close();
    };
  }

  // Focus first input
  const firstInput = modal.querySelector('input, select, textarea');
  if (firstInput) setTimeout(() => firstInput.focus(), 50);

  return modal;
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.remove();
}

// ── Confirmation ─────────────────────────────────────────────
export function confirm(title, message) {
  return new Promise((resolve) => {
    let resolved = false;
    const done = (val) => { if (!resolved) { resolved = true; resolve(val); } };
    openModal({
      id: 'modal-confirm',
      title,
      body: `<p style="font-size:14px;color:var(--text-muted);line-height:1.5">${message}</p>`,
      size: 'xs',
      primaryLabel: 'Confirm',
      closeLabel: 'Cancel',
      onPrimary: () => { done(true); return true; },
      onClose: () => done(false)
    });
  });
}

// ── Loader ───────────────────────────────────────────────────
// Simple depth counter. Loader only hides when ALL callers are done.
let _depth = 0;
let _safetyTimer = null;

export function showLoading(show) {
  const loader = document.getElementById('global-loader');
  if (!loader) return;

  if (show) {
    _depth++;
    loader.classList.add('visible');
    // Safety: hide after 5s from the FIRST show, regardless of later calls
    if (!_safetyTimer) {
      _safetyTimer = setTimeout(() => hideLoader(loader), 5000);
    }
  } else {
    _depth = Math.max(0, _depth - 1);
    if (_depth === 0) hideLoader(loader);
  }
}

export function forceHideLoader() {
  _depth = 0;
  const loader = document.getElementById('global-loader');
  if (loader) hideLoader(loader);
}

function hideLoader(loader) {
  _depth = 0;
  clearTimeout(_safetyTimer);
  _safetyTimer = null;
  loader.classList.remove('visible');
}
