// DevTrack — app.js
// Global App State & Orchestrator

import { supabase } from './supabase.js';
import { 
  initTheme, showAuthScreen, hideAuthScreen, 
  initTopbarAvatar, toggleProfilePanel, toggleTheme 
} from './auth.js';
import { loadProjectsSidebar, openCreateProjectModal, openJoinProjectModal } from './projects.js';
import { loadTasks } from './tasks.js';
import { renderTableView, renderUpcomingView, renderRoadmapView } from './views.js';
import { showLoading, showToast } from './ui.js';

// ── Global State ─────────────────────────────────────────────
export const AppState = {
  user: null,
  userId: null,
  projects: [],
  currentProjectId: null,
  currentProject: null,
  tasks: [],
  activeView: 'kanban', // 'kanban' | 'table' | 'upcoming' | 'roadmap'
  filters: {
    search: '',
    status: '',
    priority: '',
    task_type: '',
    is_blocker: false
  }
};

// ── Initialization ───────────────────────────────────────────
async function init() {
  showLoading(true);
  
  // 1. Theme
  initTheme(localStorage.getItem('devtrack_theme'));

  // 2. Auth Listener
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
      AppState.user = session.user;
      AppState.userId = session.user.id;
      hideAuthScreen();
      await bootApp();
    } else {
      AppState.user = null;
      AppState.userId = null;
      showAuthScreen();
    }
    showLoading(false);
  });

  // 3. Global UI events
  setupGlobalEvents();
  setupCommandPalette();
}

// ── Command Palette ──────────────────────────────────────────
function setupCommandPalette() {
  window.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleCommandPalette();
    }
    if (e.key === 'Escape') hideCommandPalette();
  });
}

function toggleCommandPalette() {
  const existing = document.getElementById('command-palette');
  if (existing) hideCommandPalette();
  else showCommandPalette();
}

function hideCommandPalette() {
  document.getElementById('command-palette')?.remove();
}

async function showCommandPalette() {
  const palette = document.createElement('div');
  palette.id = 'command-palette';
  palette.innerHTML = `
    <div class="palette-box">
      <div class="palette-search">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="palette-input" placeholder="Search tasks, projects, or commands..." autocomplete="off" />
      </div>
      <div id="palette-results" class="palette-results">
        <div class="palette-section-label">Common Commands</div>
        <div class="palette-item" data-action="new-project">
          <div class="palette-item-icon">P</div>
          <div class="palette-item-label">Create New Project</div>
          <div class="palette-item-meta">⌘N</div>
        </div>
        <div class="palette-item" data-action="new-task">
          <div class="palette-item-icon">T</div>
          <div class="palette-item-label">Create New Task</div>
          <div class="palette-item-meta">⌘T</div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(palette);
  
  const input = document.getElementById('palette-input');
  input.focus();

  input.addEventListener('input', async (e) => {
    const query = e.target.value.trim().toLowerCase();
    renderPaletteResults(query);
  });

  palette.addEventListener('click', e => {
    if (e.target === palette) hideCommandPalette();
    const item = e.target.closest('.palette-item');
    if (item) handlePaletteAction(item.dataset.action, item.dataset.id);
  });
}

async function renderPaletteResults(query) {
  const container = document.getElementById('palette-results');
  if (!query) {
    // Show defaults
    return; 
  }

  const results = [];
  
  // Search tasks
  const tasks = AppState.tasks.filter(t => t.title.toLowerCase().includes(query));
  if (tasks.length > 0) {
    results.push('<div class="palette-section-label">Tasks</div>');
    tasks.slice(0, 5).forEach(t => {
      results.push(`
        <div class="palette-item" data-action="open-task" data-id="${t.id}">
          <div class="palette-item-icon" style="color:var(--accent)">#</div>
          <div class="palette-item-label">${t.title}</div>
          <div class="palette-item-meta">${t.status}</div>
        </div>
      `);
    });
  }

  // Search projects
  const projects = AppState.projects.filter(p => p.name.toLowerCase().includes(query));
  if (projects.length > 0) {
    results.push('<div class="palette-section-label">Projects</div>');
    projects.forEach(p => {
      results.push(`
        <div class="palette-item" data-action="switch-project" data-id="${p.id}">
          <div class="palette-item-icon" style="background:${p.color || '#4f8eff'};width:10px;height:10px;border-radius:50%;margin:9px"></div>
          <div class="palette-item-label">${p.name}</div>
        </div>
      `);
    });
  }

  container.innerHTML = results.length > 0 ? results.join('') : '<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:13px">No results found</div>';
}

function handlePaletteAction(action, id) {
  hideCommandPalette();
  if (action === 'new-project') openCreateProjectModal();
  if (action === 'new-task') {
    if (AppState.currentProjectId) {
      import('./tasks.js').then(m => m.openCreateTaskModal(AppState.currentProjectId));
    } else {
      showToast('Select a project first', 'warning');
    }
  }
  if (action === 'switch-project') switchProject(id);
  if (action === 'open-task') {
    const task = AppState.tasks.find(t => t.id === id);
    if (task) import('./collaboration.js').then(m => m.openTaskDetail(task));
  }
}

async function bootApp() {
  showLoading(true);
  try {
    await initTopbarAvatar();
    const projects = await loadProjectsSidebar();
    
    if (projects.length > 0) {
      const lastId = localStorage.getItem('devtrack_active_pid');
      const targetId = projects.find(p => p.id === lastId)?.id || projects[0].id;
      await switchProject(targetId);
    } else {
      showDashboard();
    }
  } catch (err) {
    console.error('Boot error:', err);
    showToast('Failed to initialize app', 'error');
  } finally {
    showLoading(false);
  }
}

// ── Navigation & Views ───────────────────────────────────────
export async function switchProject(projectId) {
  AppState.currentProjectId = projectId;
  AppState.currentProject = AppState.projects.find(p => p.id === projectId);
  localStorage.setItem('devtrack_active_pid', projectId);
  
  // Update sidebar UI
  document.querySelectorAll('.project-item').forEach(el => {
    el.classList.toggle('active', el.dataset.projectId === projectId);
  });

  document.getElementById('no-project').style.display = 'none';
  document.getElementById('project-view').style.display = 'flex';
  
  await refreshCurrentView();
}

export async function refreshCurrentView() {
  if (!AppState.currentProjectId) return;
  
  showLoading(true);
  try {
    const project = AppState.projects.find(p => p.id === AppState.currentProjectId);
    if (project) {
      document.getElementById('proj-title-text').textContent = project.name;
      renderFocusStrip(project);
      renderProjectNotes(project);
    }

    if (AppState.activeView === 'kanban') {
      const { renderKanban } = await import('./kanban.js');
      await renderKanban(AppState.currentProjectId, AppState.filters);
    } else if (AppState.activeView === 'table') {
      await renderTableView(AppState.currentProjectId, AppState.filters);
    } else if (AppState.activeView === 'upcoming') {
      await renderUpcomingView(AppState.currentProjectId, AppState.filters);
    } else if (AppState.activeView === 'roadmap') {
      await renderRoadmapView(AppState.currentProjectId);
    }
  } catch (err) {
    console.error('View refresh error:', err);
  } finally {
    showLoading(false);
  }
}

export function showDashboard() {
  AppState.currentProjectId = null;
  document.getElementById('project-view').style.display = 'none';
  document.getElementById('no-project').style.display = 'flex';
}

export function setView(view) {
  AppState.activeView = view;
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });
  refreshCurrentView();
}

// ── Event Handlers ───────────────────────────────────────────
function setupGlobalEvents() {
  // Topbar
  document.getElementById('topbar-avatar')?.addEventListener('click', e => {
    e.stopPropagation();
    toggleProfilePanel();
  });

  document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleTheme);

  // Sidebar
  document.getElementById('btn-new-project')?.addEventListener('click', openCreateProjectModal);
  document.getElementById('btn-join-project')?.addEventListener('click', openJoinProjectModal);

  document.getElementById('btn-notifications')?.addEventListener('click', e => {
    e.stopPropagation();
    toggleNotificationsPanel();
  });

  document.getElementById('btn-mark-all-read')?.addEventListener('click', markAllNotificationsRead);

  // Notes & Decisions
  const leftOffEl = document.getElementById('left-off-text');
  if (leftOffEl) {
    leftOffEl.addEventListener('blur', () => saveLeftOff(leftOffEl.innerText));
  }
  document.getElementById('decision-log-box')?.addEventListener('click', openDecisionLogModal);

  // Tabs
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => setView(tab.dataset.view));
  });
}

function toggleNotificationsPanel() {
  const panel = document.getElementById('notifications-panel');
  if (panel.classList.contains('hidden')) {
    panel.classList.remove('hidden');
    loadNotifications();
  } else {
    panel.classList.add('hidden');
  }
}

async function loadNotifications() {
  const container = document.getElementById('notif-list');
  try {
    const { getNotifications } = await import('./supabase.js');
    const notifs = await getNotifications();
    if (notifs.length === 0) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:13px">No notifications</div>';
      return;
    }
    container.innerHTML = notifs.map(n => `
      <div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
        <div class="notif-item-body">
          <div class="notif-item-msg">${n.message}</div>
          <div class="notif-item-time">${new Date(n.created_at).toLocaleString()}</div>
        </div>
      </div>
    `).join('');
  } catch (err) { console.error(err); }
}

async function markAllNotificationsRead() {
  try {
    const { markAllNotificationsRead: apiMarkRead } = await import('./supabase.js');
    await apiMarkRead();
    loadNotifications();
    showToast('All marked as read');
  } catch (err) { showToast(err.message, 'error'); }
}

function renderFocusStrip(project) {
  const strip = document.getElementById('focus-strip');
  if (!strip) return;

  const focusIds = project.today_focus || [];
  if (focusIds.length === 0) {
    strip.classList.add('hidden');
    return;
  }

  const focusTasks = AppState.tasks.filter(t => focusIds.includes(t.id));
  if (focusTasks.length === 0) {
    strip.classList.add('hidden');
    return;
  }

  strip.classList.remove('hidden');
  strip.innerHTML = `
    <div class="focus-strip-label">Today's Focus</div>
    <div style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px">
      ${focusTasks.map(t => `
        <div class="focus-task-pill" data-id="${t.id}">
          <span class="fp-dot"></span>
          <span>${t.title}</span>
        </div>
      `).join('')}
    </div>
  `;

  strip.querySelectorAll('.focus-task-pill').forEach(pill => {
    pill.onclick = () => {
      const task = focusTasks.find(t => t.id === pill.dataset.id);
      if (task) import('./collaboration.js').then(m => m.openTaskDetail(task));
    };
  });
}

function renderProjectNotes(project) {
  const el = document.getElementById('left-off-text');
  if (el) {
    el.innerText = project.where_i_left_off || 'Click to add a note...';
  }
}

async function saveLeftOff(text) {
  if (!AppState.currentProjectId) return;
  try {
    const { updateProject } = await import('./supabase.js');
    await updateProject(AppState.currentProjectId, { where_i_left_off: text });
    // Update local cache
    const p = AppState.projects.find(proj => proj.id === AppState.currentProjectId);
    if (p) p.where_i_left_off = text;
  } catch (err) { console.error(err); }
}

async function openDecisionLogModal() {
  if (!AppState.currentProject) return;
  const { openModal } = await import('./ui.js');
  const { updateProject } = await import('./supabase.js');

  const content = AppState.currentProject.decision_log || '';

  openModal({
    id: 'modal-decision-log',
    title: 'Decision Log — ' + AppState.currentProject.name,
    size: 'lg',
    body: `
      <div class="form-group">
        <label class="form-label">Markdown Content</label>
        <textarea id="decision-log-editor" class="form-input" style="height:400px;font-family:var(--font-mono);font-size:13px">${content}</textarea>
      </div>
    `,
    primaryLabel: 'Save Log',
    onPrimary: async () => {
      const newLog = document.getElementById('decision-log-editor').value;
      await updateProject(AppState.currentProjectId, { decision_log: newLog });
      AppState.currentProject.decision_log = newLog;
      showToast('Decision log updated', 'success');
      return true;
    }
  });
}

// Kick off
document.addEventListener('DOMContentLoaded', init);
