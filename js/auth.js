// DevTrack — auth.js
// Login, signup, profile panel, theme (light/dark)

import { supabase, getProfile, upsertProfile } from './supabase.js';
import { showToast } from './ui.js';

// ── Theme ────────────────────────────────────────────────────
export function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  document.documentElement.classList.toggle('dark', theme === 'dark');
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) {
    btn.innerHTML = theme === 'dark' ? iconSun() : iconMoon();
    btn.title = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  }
}

export function initTheme(savedTheme) {
  const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  applyTheme(savedTheme || preferred);
}

export async function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark';
  const next = current === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    await upsertProfile(user.id, { theme: next }).catch(() => {});
  } else {
    localStorage.setItem('devtrack_theme', next);
  }
}

// ── Auth screen ──────────────────────────────────────────────
let _mode = 'login'; // 'login' | 'signup'

export function showAuthScreen() {
  window.location.replace('login.html');
}

export function hideAuthScreen() {
  // no-op — auth is handled on login.html
}

function renderAuthForm() {
  const card = document.querySelector('.auth-card');
  if (!card) return;
  card.innerHTML = `
    <div style="text-align:center;margin-bottom:32px">
      <div style="font-family:var(--font-mono);font-size:22px;font-weight:700;letter-spacing:-1px;color:var(--text)">
        dev<span style="color:var(--accent)">track</span>
      </div>
      <div style="font-size:12px;color:var(--text-muted);margin-top:6px">
        ${_mode === 'login' ? 'Welcome back' : 'Create your account'}
      </div>
    </div>

    <form id="auth-form" autocomplete="on">
      <div style="display:flex;flex-direction:column;gap:14px">
        ${_mode === 'signup' ? `
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input class="form-input" id="auth-name" type="text" placeholder="Your name" autocomplete="name" required />
        </div>` : ''}
        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" id="auth-email" type="email" placeholder="you@example.com" autocomplete="email" required />
        </div>
        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" id="auth-password" type="password" placeholder="••••••••" autocomplete="${_mode === 'login' ? 'current-password' : 'new-password'}" required />
        </div>
        <div id="auth-error" style="font-size:12px;color:var(--red);display:none"></div>
        <button class="btn btn-primary" type="submit" id="auth-submit" style="width:100%;justify-content:center;padding:10px">
          ${_mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </div>
    </form>

    <div style="text-align:center;margin-top:20px;font-size:12px;color:var(--text-muted)">
      ${_mode === 'login'
        ? `Don't have an account? <a href="#" id="auth-switch" style="color:var(--accent)">Sign up</a>`
        : `Already have an account? <a href="#" id="auth-switch" style="color:var(--accent)">Sign in</a>`
      }
    </div>
  `;

  document.getElementById('auth-form').addEventListener('submit', handleAuthSubmit);
  document.getElementById('auth-switch').addEventListener('click', e => {
    e.preventDefault();
    _mode = _mode === 'login' ? 'signup' : 'login';
    renderAuthForm();
  });
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const submitBtn = document.getElementById('auth-submit');
  const errorEl   = document.getElementById('auth-error');
  const email     = document.getElementById('auth-email').value.trim();
  const password  = document.getElementById('auth-password').value;

  submitBtn.disabled = true;
  submitBtn.textContent = 'Please wait…';
  errorEl.style.display = 'none';

  try {
    if (_mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } else {
      const name = document.getElementById('auth-name')?.value.trim();
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) {
        await upsertProfile(data.user.id, { display_name: name || email.split('@')[0] });
      }
    }
    // onAuthStateChange will handle navigation
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = _mode === 'login' ? 'Sign In' : 'Create Account';
  }
}

// ── Profile Panel ────────────────────────────────────────────
let _profilePanelOpen = false;

export async function toggleProfilePanel() {
  const existing = document.getElementById('profile-panel-popup');
  if (existing) { existing.remove(); _profilePanelOpen = false; return; }
  _profilePanelOpen = true;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  const profile = await getProfile(user.id) || {};

  const panel = document.createElement('div');
  panel.id = 'profile-panel-popup';
  panel.className = 'profile-panel';
  panel.innerHTML = `
    <div style="padding:20px;border-bottom:1px solid var(--border)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
        <div id="pp-avatar" class="avatar avatar-xl" style="background:${profile.avatar_color || '#4f8eff'};color:#fff;cursor:pointer;position:relative">
          ${initials(profile.display_name || user.email)}
          <div style="position:absolute;inset:0;background:rgba(0,0,0,.3);border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity var(--t-fast)" class="avatar-edit-overlay">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </div>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-weight:600;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${profile.display_name || 'Anonymous'}</div>
          <div style="font-size:11px;color:var(--text-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.email}</div>
          <div style="font-size:10px;color:var(--text-dim);font-family:var(--font-mono);margin-top:2px">
            Joined ${formatDate(user.created_at)}
          </div>
        </div>
      </div>

      <div class="color-swatches" id="avatar-color-swatches">
        ${AVATAR_COLORS.map(c => `
          <div class="color-swatch ${profile.avatar_color === c ? 'selected' : ''}"
               style="background:${c}" data-color="${c}" title="${c}"></div>
        `).join('')}
      </div>
    </div>

    <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
      <div class="form-group">
        <label class="form-label">Display Name</label>
        <input class="form-input" id="pp-name" type="text" value="${profile.display_name || ''}" placeholder="Your name" />
      </div>
      <div class="form-group">
        <label class="form-label">New Password</label>
        <input class="form-input" id="pp-password" type="password" placeholder="Leave blank to keep current" autocomplete="new-password" />
      </div>
      <button class="btn btn-primary" id="pp-save" style="width:100%;justify-content:center">Save Changes</button>
    </div>

    <div style="padding:0 16px 16px;display:flex;justify-content:space-between;border-top:1px solid var(--border);padding-top:12px">
      <button class="btn btn-ghost btn-sm" id="pp-signout" style="color:var(--red)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
      <span style="font-size:10px;color:var(--text-dim);font-family:var(--font-mono);align-self:center">
        v1.0
      </span>
    </div>
  `;

  document.body.appendChild(panel);

  // Avatar color picker
  panel.querySelectorAll('.color-swatch').forEach(sw => {
    sw.addEventListener('click', async () => {
      panel.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      sw.classList.add('selected');
      const color = sw.dataset.color;
      document.getElementById('pp-avatar').style.background = color;
      await upsertProfile(user.id, { avatar_color: color });
      // Update topbar avatar
      refreshTopbarAvatar(profile.display_name, color);
    });
  });

  // Hover overlay on avatar
  const av = panel.querySelector('#pp-avatar');
  av.addEventListener('mouseenter', () => av.querySelector('.avatar-edit-overlay').style.opacity = '1');
  av.addEventListener('mouseleave', () => av.querySelector('.avatar-edit-overlay').style.opacity = '0');

  // Save
  panel.querySelector('#pp-save').addEventListener('click', async () => {
    const name = document.getElementById('pp-name').value.trim();
    const pass = document.getElementById('pp-password').value;
    try {
      await upsertProfile(user.id, { display_name: name });
      if (pass) await supabase.auth.updateUser({ password: pass });
      showToast('Profile updated', 'success');
      panel.remove();
      _profilePanelOpen = false;
      refreshTopbarAvatar(name, profile.avatar_color);
    } catch (err) { showToast(err.message, 'error'); }
  });

  // Sign out
  panel.querySelector('#pp-signout').addEventListener('click', async () => {
    await supabase.auth.signOut();
    panel.remove();
  });

  // Close on outside click
  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!panel.contains(e.target) && !e.target.closest('#btn-avatar')) {
        panel.remove();
        _profilePanelOpen = false;
        document.removeEventListener('click', handler);
      }
    });
  }, 0);
}

function refreshTopbarAvatar(name, color) {
  const av = document.getElementById('topbar-avatar');
  if (av) {
    av.style.background = color || '#4f8eff';
    av.textContent = initials(name);
  }
}

export async function initTopbarAvatar(userArg = null) {
  const user = userArg || (await supabase.auth.getUser()).data.user;
  if (!user) return;
  const profile = await getProfile(user.id);
  refreshTopbarAvatar(profile?.display_name || user.email, profile?.avatar_color || '#4f8eff');
}

// ── Helpers ──────────────────────────────────────────────────
export function initials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

const AVATAR_COLORS = [
  '#4f8eff', '#3ecf8e', '#f05151', '#f0a030',
  '#a855f7', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#64748b'
];

function iconSun() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>`;
}

function iconMoon() {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>`;
}
