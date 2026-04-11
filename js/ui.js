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
        <button class="modal-close-btn">&times;</button>
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
  
  // Show it (trigger animation)
  setTimeout(() => modal.classList.add('open'), 10);

  // Wire events
  const close = () => {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 300);
  };

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
  if (firstInput) setTimeout(() => firstInput.focus(), 100);

  return modal;
}

export function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.remove('open');
    setTimeout(() => modal.remove(), 300);
  }
}

// ── Confirmation ─────────────────────────────────────────────
export function confirm(title, message) {
  return new Promise((resolve) => {
    openModal({
      id: 'modal-confirm',
      title,
      body: `<p style="font-size:14px;color:var(--text-muted);line-height:1.5">${message}</p>`,
      size: 'xs',
      primaryLabel: 'Confirm',
      closeLabel: 'Cancel',
      onPrimary: () => { resolve(true); return true; }
    }).querySelector('.modal-close-btn').onclick = () => { resolve(false); closeModal('modal-confirm'); };
    
    document.getElementById('modal-confirm-close').onclick = () => { resolve(false); closeModal('modal-confirm'); };
  });
}

// ── Loader ───────────────────────────────────────────────────
// Ref counter so nested showLoading(true/false) calls don't race
let _loadingCount = 0;

export function showLoading(show) {
  let loader = document.getElementById('global-loader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'global-loader';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader-spinner"></div>
        <div class="loader-text">dev<span>track</span></div>
      </div>
    `;
    document.body.appendChild(loader);
  }

  if (show) {
    _loadingCount++;
    loader.classList.remove('hidden');
    loader.classList.add('visible');
  } else {
    _loadingCount = Math.max(0, _loadingCount - 1);
    if (_loadingCount === 0) {
      loader.classList.remove('visible');
    }
  }
}
