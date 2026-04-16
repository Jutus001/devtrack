// DevTrack — login.js
// Standalone auth page entry point

import { supabase, upsertProfile } from './supabase.js';
import { initTheme, initials } from './auth.js';

// Apply saved theme immediately
initTheme(localStorage.getItem('devtrack_theme'));

// If already signed in, go straight to the app
const { data: { session } } = await supabase.auth.getSession();
if (session) {
  window.location.replace('app.html');
}

// ── Form state ────────────────────────────────────────────────
let _mode = 'login'; // 'login' | 'signup'

function render() {
  const card     = document.getElementById('auth-card');
  const subtitle = document.getElementById('login-subtitle');
  if (!card) return;

  if (subtitle) {
    subtitle.textContent = _mode === 'login' ? 'Welcome back' : 'Create your account';
  }

  card.innerHTML = `
    <form id="auth-form" autocomplete="on">
      <div style="display:flex;flex-direction:column;gap:14px">
        ${_mode === 'signup' ? `
        <div class="form-group">
          <label class="form-label">Display Name</label>
          <input class="form-input" id="auth-name" type="text" placeholder="Your name" autocomplete="name" />
        </div>` : ''}

        <div class="form-group">
          <label class="form-label">Email</label>
          <input class="form-input" id="auth-email" type="email" placeholder="you@example.com"
            autocomplete="email" required />
        </div>

        <div class="form-group">
          <label class="form-label">Password</label>
          <input class="form-input" id="auth-password" type="password" placeholder="••••••••"
            autocomplete="${_mode === 'login' ? 'current-password' : 'new-password'}" required />
        </div>

        <div id="auth-error" style="font-size:12px;color:var(--red);display:none;padding:8px 10px;background:var(--red-dim);border-radius:var(--r2)"></div>

        <button class="btn btn-primary" type="submit" id="auth-submit"
          style="width:100%;justify-content:center;padding:11px;font-size:14px">
          ${_mode === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </div>
    </form>

    <div style="text-align:center;margin-top:20px;font-size:13px;color:var(--text-muted)">
      ${_mode === 'login'
        ? `Don't have an account? <a href="#" id="auth-switch" style="color:var(--accent);font-weight:500">Sign up</a>`
        : `Already have an account? <a href="#" id="auth-switch" style="color:var(--accent);font-weight:500">Sign in</a>`}
    </div>
  `;

  document.getElementById('auth-form').addEventListener('submit', handleSubmit);
  document.getElementById('auth-switch').addEventListener('click', e => {
    e.preventDefault();
    _mode = _mode === 'login' ? 'signup' : 'login';
    render();
  });

  // Auto-focus first visible input
  setTimeout(() => {
    (document.getElementById('auth-name') || document.getElementById('auth-email'))?.focus();
  }, 50);
}

async function handleSubmit(e) {
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
      const name = document.getElementById('auth-name')?.value.trim() || '';
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      if (data.user) {
        await upsertProfile(data.user.id, {
          display_name: name || email.split('@')[0]
        });
      }
    }
    // Success — go to main app
    window.location.replace('app.html');
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.style.display = 'block';
    submitBtn.disabled = false;
    submitBtn.textContent = _mode === 'login' ? 'Sign In' : 'Create Account';
  }
}

render();
