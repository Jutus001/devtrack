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
import { showLoading, forceHideLoader, showToast } from './ui.js';

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

// ============================================================================
// MOBILE RESPONSIVE STATE
// ============================================================================
export const ResponsiveState = {
  isSidebarVisible: false, // left panel (projects)
  isDetailVisible: false,  // right panel (task detail)
  activeNavBtn: 'board'    // 'projects' | 'board' | 'detail'
};

export const closeAllPanels = () => {
  ResponsiveState.isSidebarVisible = false;
  ResponsiveState.isDetailVisible = false;
  ResponsiveState.activeNavBtn = 'board';
  
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('detail-panel')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('active');
  
  setMobileNavActive('board');
};

export const toggleLeftPanel = () => {
  if (ResponsiveState.isSidebarVisible) {
    closeAllPanels();
  } else {
    closeAllPanels();
    ResponsiveState.isSidebarVisible = true;
    ResponsiveState.activeNavBtn = 'projects';
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.add('active');
    setMobileNavActive('projects');
  }
};

export const toggleRightPanel = () => {
  if (ResponsiveState.isDetailVisible) {
    closeAllPanels();
  } else {
    closeAllPanels();
    ResponsiveState.isDetailVisible = true;
    ResponsiveState.activeNavBtn = 'detail';
    document.getElementById('detail-panel')?.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.add('active');
    setMobileNavActive('detail');
  }
};

const handleResponsiveResize = () => {
  if (window.innerWidth > 1024) closeAllPanels();
};

// ── Initialization ───────────────────────────────────────────
let _isBooting = false;
let _hasBooted = false;

async function init() {
  showLoading(true);

  // 0. Capture ?join=CODE before anything clears it (handles unauthenticated visitors)
  const _initJoinCode = new URLSearchParams(window.location.search).get('join');
  if (_initJoinCode) {
    sessionStorage.setItem('devtrack_pending_join', _initJoinCode.toUpperCase());
    window.history.replaceState({}, '', window.location.pathname);
  }

  // 1. Theme
  initTheme(localStorage.getItem('devtrack_theme'));

  // 2. Restore session immediately from cache — no waiting for network
  const { data: { session: existingSession } } = await supabase.auth.getSession();
  if (existingSession) {
    AppState.user = existingSession.user;
    AppState.userId = existingSession.user.id;
    hideAuthScreen();
    _isBooting = true;
    _hasBooted = false;
    await bootApp(existingSession.user);
    _isBooting = false;
    _hasBooted = true;
  } else {
    showAuthScreen();
  }
  forceHideLoader(); // always guaranteed to clear the loader

  // 3. Auth listener — ONLY reacts to actual sign-in / sign-out
  //    TOKEN_REFRESHED and INITIAL_SESSION fire on tab focus — ignore them
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') return;

    if (event === 'SIGNED_IN' && session && !_hasBooted && !_isBooting) {
      AppState.user = session.user;
      AppState.userId = session.user.id;
      hideAuthScreen();
      _isBooting = true;
      await bootApp(session.user);
      _isBooting = false;
      _hasBooted = true;
    } else if (event === 'SIGNED_OUT') {
      AppState.user = null;
      AppState.userId = null;
      _isBooting = false;
      _hasBooted = false;
      showAuthScreen();
    }
  });

  // 4. When tab regains focus: just kill any stuck loader, don't refresh anything
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      forceHideLoader();
    }
  });

  window.addEventListener('resize', handleResponsiveResize);
  window.addEventListener('orientationchange', closeAllPanels);

  // 5. Global UI events
  setupGlobalEvents();
  setupCommandPalette();
}

async function bootApp(user) {
  showLoading(true);
  try {
    await initTopbarAvatar(user);
    const projects = await loadProjectsSidebar();
    AppState.projects = projects;

    // Initialize Filter Bar
    const { renderFilterBar } = await import('./tasks.js');
    renderFilterBar(AppState.filters, (newFilters) => {
      AppState.filters = newFilters;
      refreshCurrentView();
    });
    
    if (projects.length > 0) {
      const lastId = localStorage.getItem('devtrack_active_pid');
      const targetId = projects.find(p => p.id === lastId)?.id || projects[0].id;
      await switchProject(targetId);
    } else {
      showDashboard();
    }
    // Handle ?join=CODE invite links (code saved to sessionStorage at page load)
    const joinCode = sessionStorage.getItem('devtrack_pending_join');
    if (joinCode) {
      sessionStorage.removeItem('devtrack_pending_join');
      setTimeout(async () => {
        const { openJoinProjectModal } = await import('./projects.js');
        openJoinProjectModal(joinCode);
      }, 400);
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

  // On mobile, close sidebar after selecting a project
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar')?.classList.remove('open');
    setMobileNavActive('board');
  }

  // Update sidebar UI
  document.querySelectorAll('.project-item').forEach(el => {
    el.classList.toggle('active', el.dataset.projectId === projectId);
  });

  ensureProjectViewStructure();
  document.getElementById('no-project').style.display = 'none';
  document.getElementById('project-view').style.display = 'flex';
  document.getElementById('btn-add-task').style.display = '';
  document.getElementById('btn-export').style.display = '';

  await refreshCurrentView();
}

// Restore #view-container HTML structure if non-kanban views replaced it
function ensureProjectViewStructure() {
  const container = document.getElementById('view-container');
  if (!container) return;
  if (!document.getElementById('project-view')) {
    container.innerHTML = `
      <div id="no-project" class="empty-state" style="display:none;height:100%">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="3" y1="9" x2="21" y2="9"/></svg>
        <h3>Welcome to DevTrack</h3>
        <p>Select a project from the sidebar or create a new one to get started with your tasks.</p>
      </div>
      <div id="project-view" style="display:none;height:100%;flex-direction:column;overflow:hidden">
        <div id="project-header" style="display:flex;align-items:center;gap:8px;padding:6px 12px;border-bottom:1px solid var(--border);background:var(--surface);flex-shrink:0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" stroke-width="2" style="flex-shrink:0"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          <span id="left-off-text" contenteditable="true" style="flex:1;font-size:12px;color:var(--text-muted);outline:none;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" data-placeholder="Note where you left off…"></span>
          <button id="btn-save-wilo" class="btn btn-ghost btn-sm" style="font-size:11px;opacity:0;pointer-events:none;flex-shrink:0">Save</button>
          <button id="decision-log-box" class="btn btn-ghost btn-sm" style="font-size:11px;flex-shrink:0;gap:5px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            Log
          </button>
        </div>
        <div id="kanban-board"></div>
      </div>
    `;
    // Re-bind notes/decisions events after restoring structure
    document.getElementById('left-off-text')?.addEventListener('input', () => {
      const btn = document.getElementById('btn-save-wilo');
      if (btn) { btn.style.opacity = '1'; btn.style.pointerEvents = ''; }
    });
    document.getElementById('btn-save-wilo')?.addEventListener('click', () => {
      const el = document.getElementById('left-off-text');
      saveLeftOff(el?.innerText?.trim() || '');
      const btn = document.getElementById('btn-save-wilo');
      if (btn) { btn.style.opacity = '0'; btn.style.pointerEvents = 'none'; }
    });
    document.getElementById('decision-log-box')?.addEventListener('click', openDecisionLogModal);
  }
}

export async function refreshCurrentView(silent = false) {
  if (!AppState.currentProjectId) return;

  if (!silent) showLoading(true);
  try {
    // 1. Sync Project Info
    const project = AppState.projects.find(p => p.id === AppState.currentProjectId);
    if (project) {
      AppState.currentProject = project;
      document.getElementById('proj-title-text').textContent = project.name;
      renderProjectNotes(project);
    }

    // 2. Load Tasks into State
    AppState.tasks = await loadTasks(AppState.currentProjectId, AppState.filters);

    // 3. Render Focus Strip
    renderFocusStrip(project);

    // 4. Render Active View
    if (AppState.activeView === 'kanban') {
      const { renderKanban } = await import('./kanban.js');
      await renderKanban(AppState.currentProjectId, AppState.filters, AppState);
    } else if (AppState.activeView === 'table') {
      await renderTableView(AppState.currentProjectId, AppState.filters, AppState);
    } else if (AppState.activeView === 'upcoming') {
      await renderUpcomingView(AppState.currentProjectId, AppState.filters, AppState);
    } else if (AppState.activeView === 'roadmap') {
      await renderRoadmapView(AppState.currentProjectId, AppState);
    }
  } catch (err) {
    console.error('View refresh error:', err);
  } finally {
    showLoading(false);
  }
}

export function showDashboard() {
  AppState.currentProjectId = null;
  AppState.currentProject = null;
  ensureProjectViewStructure();
  document.getElementById('project-view').style.display = 'none';
  document.getElementById('no-project').style.display = 'flex';
  document.getElementById('btn-add-task').style.display = 'none';
}

export function setView(view) {
  AppState.activeView = view;
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.view === view);
  });
  ensureProjectViewStructure();
  if (AppState.currentProjectId) {
    document.getElementById('project-view').style.display = 'flex';
    document.getElementById('no-project').style.display = 'none';
  }
  refreshCurrentView();
}

// ── Event Handlers ───────────────────────────────────────────
// ── Mobile Sidebar ───────────────────────────────────────────
function openMobileSidebar() {
  document.getElementById('sidebar')?.classList.add('open');
  setMobileNavActive('projects');
}

function closeMobileSidebar() {
  document.getElementById('sidebar')?.classList.remove('open');
  setMobileNavActive('board');
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  if (sidebar?.classList.contains('open')) {
    closeMobileSidebar();
  } else {
    // Close detail panel first
    document.getElementById('detail-panel')?.classList.remove('open');
    openMobileSidebar();
  }
}

export function setMobileNavActive(tab) {
  document.querySelectorAll('.mobile-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`mobile-nav-${tab}`)?.classList.add('active');
}

function exportTasks() {
  const tasks = AppState.tasks;
  const project = AppState.currentProject;
  if (!tasks?.length) { showToast('No tasks to export', 'warning'); return; }

  // Show format picker
  import('./ui.js').then(({ openModal, closeModal }) => {
    openModal({
      id: 'modal-export',
      title: 'Export Tasks',
      body: `
        <div style="display:flex;flex-direction:column;gap:12px">
          <p style="font-size:13px;color:var(--text-muted)">${tasks.length} task${tasks.length !== 1 ? 's' : ''} from <strong>${project?.name || 'this project'}</strong></p>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <button id="exp-json" class="btn btn-secondary" style="flex-direction:column;padding:16px;height:auto;gap:6px">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <span style="font-size:13px;font-weight:600">JSON</span>
              <span style="font-size:11px;color:var(--text-dim)">Full data, all fields</span>
            </button>
            <button id="exp-csv" class="btn btn-secondary" style="flex-direction:column;padding:16px;height:auto;gap:6px">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
              <span style="font-size:13px;font-weight:600">CSV</span>
              <span style="font-size:11px;color:var(--text-dim)">Spreadsheet-ready</span>
            </button>
          </div>
        </div>
      `,
      size: 'sm',
      primaryLabel: null,
    });
    setTimeout(() => {
      document.getElementById('exp-json')?.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: 'application/json' });
        _downloadBlob(blob, `${project?.name || 'devtrack'}-tasks.json`);
        closeModal('modal-export');
      });
      document.getElementById('exp-csv')?.addEventListener('click', () => {
        const cols = ['id','title','task_type','status','priority','due_date','description','notes','tags','github_url','created_at'];
        const header = cols.join(',');
        const rows = tasks.map(t => cols.map(c => {
          const v = Array.isArray(t[c]) ? t[c].join(';') : (t[c] ?? '');
          return `"${String(v).replace(/"/g, '""')}"`;
        }).join(','));
        const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
        _downloadBlob(blob, `${project?.name || 'devtrack'}-tasks.csv`);
        closeModal('modal-export');
      });
    }, 50);
  });
}

function _downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Downloaded', 'success');
}

function setupGlobalEvents() {
  // Sidebar collapse (desktop)
  const collapseBtn = document.getElementById('sidebar-collapse-btn');
  if (collapseBtn) {
    const app = document.getElementById('app');
    const isCollapsed = localStorage.getItem('devtrack_sidebar_collapsed') === '1';
    if (isCollapsed) {
      app?.classList.add('sidebar-collapsed');
      collapseBtn.querySelector('svg')?.setAttribute('transform', 'rotate(180)');
    }
    collapseBtn.addEventListener('click', () => {
      const collapsed = app?.classList.toggle('sidebar-collapsed');
      localStorage.setItem('devtrack_sidebar_collapsed', collapsed ? '1' : '0');
      collapseBtn.querySelector('svg')?.setAttribute('transform', collapsed ? 'rotate(180)' : '');
    });
  }

  // Mobile sidebar
  document.getElementById('btn-sidebar-toggle')?.addEventListener('click', toggleLeftPanel);
  document.getElementById('sidebar-overlay')?.addEventListener('click', closeAllPanels);

  // Bottom nav
  document.getElementById('mobile-nav-projects')?.addEventListener('click', toggleLeftPanel);
  document.getElementById('mobile-nav-board')?.addEventListener('click', closeAllPanels);
  document.getElementById('mobile-nav-detail')?.addEventListener('click', toggleRightPanel);

  // Topbar
  document.getElementById('topbar-avatar')?.addEventListener('click', e => {
    e.stopPropagation();
    toggleProfilePanel();
  });

  document.getElementById('btn-theme-toggle')?.addEventListener('click', toggleTheme);

  // Sidebar
  document.getElementById('btn-new-project')?.addEventListener('click', openCreateProjectModal);
  document.getElementById('btn-join-project')?.addEventListener('click', openJoinProjectModal);

  document.getElementById('btn-add-task')?.addEventListener('click', () => {
    if (AppState.currentProjectId) {
      import('./tasks.js').then(m => m.openCreateTaskModal(AppState.currentProjectId));
    }
  });

  document.getElementById('btn-notifications')?.addEventListener('click', e => {
    e.stopPropagation();
    toggleNotificationsPanel();
  });

  document.getElementById('btn-mark-all-read')?.addEventListener('click', markAllNotificationsRead);

  // Export
  document.getElementById('btn-export')?.addEventListener('click', () => exportTasks());

  // Notes & Decisions — compact bar
  document.getElementById('left-off-text')?.addEventListener('input', () => {
    const btn = document.getElementById('btn-save-wilo');
    if (btn) { btn.style.opacity = '1'; btn.style.pointerEvents = ''; }
  });
  document.getElementById('btn-save-wilo')?.addEventListener('click', () => {
    const el = document.getElementById('left-off-text');
    const text = el?.innerText?.trim() || '';
    saveLeftOff(text);
    const btn = document.getElementById('btn-save-wilo');
    if (btn) { btn.style.opacity = '0'; btn.style.pointerEvents = 'none'; }
  });
  document.getElementById('decision-log-box')?.addEventListener('click', openDecisionLogModal);

  // Tabs
  document.querySelectorAll('.view-tab').forEach(tab => {
    tab.addEventListener('click', () => setView(tab.dataset.view));
  });
}

// ── Notifications ────────────────────────────────────────────
function toggleNotificationsPanel() {
  const panel = document.getElementById('notifications-panel');
  if (panel.classList.contains('hidden')) {
    panel.classList.remove('hidden');
    loadNotifications();
    // Close on outside click
    setTimeout(() => {
      document.addEventListener('click', function closeNotifs(e) {
        if (!panel.contains(e.target) && !e.target.closest('#btn-notifications')) {
          panel.classList.add('hidden');
          document.removeEventListener('click', closeNotifs);
        }
      });
    }, 0);
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

// ── Focus & Notes ────────────────────────────────────────────
export async function togglePinTask(taskId) {
  if (!AppState.currentProjectId || !AppState.currentProject) return;
  
  const focusIds = AppState.currentProject.today_focus || [];
  const isPinned = focusIds.includes(taskId);
  let newFocus;

  if (isPinned) {
    newFocus = focusIds.filter(id => id !== taskId);
  } else {
    if (focusIds.length >= 3) {
      showToast('Maximum 3 tasks in focus', 'warning');
      return;
    }
    newFocus = [...focusIds, taskId];
  }

  try {
    const { updateProject } = await import('./supabase.js');
    await updateProject(AppState.currentProjectId, { today_focus: newFocus });
    AppState.currentProject.today_focus = newFocus;
    renderFocusStrip(AppState.currentProject);
    showToast(isPinned ? 'Removed from focus' : 'Pinned to focus', 'success');
  } catch (err) { showToast(err.message, 'error'); }
}

function renderFocusStrip(project) {
  const strip = document.getElementById('focus-strip');
  if (!strip) return;
  if (!project) { strip.classList.add('hidden'); return; }

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
    el.innerText = project.where_i_left_off || '';
    el.setAttribute('data-placeholder', 'Note where you left off…');
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
    showToast('Sticky note saved', 'success');
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
        <textarea id="decision-log-editor" class="form-input" style="height:400px;font-family:var(--font-mono);font-size:13px;line-height:1.6">${content}</textarea>
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

// ── Command Palette ──────────────────────────────────────────
function setupCommandPalette() {
  window.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      toggleCommandPalette();
    }
    if (e.key === 'Escape') {
      hideCommandPalette();
      if (document.getElementById('sidebar')?.classList.contains('open')) closeMobileSidebar();
    }
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
  if (!query) return;

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

// Kick off
document.addEventListener('DOMContentLoaded', init);
