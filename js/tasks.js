// DevTrack — tasks.js
// Task CRUD, all task fields, filters, quick-create

import {
  getTasks, createTask, updateTask, deleteTask, archiveTask,
  getChecklist, getSubtasks, getMilestones, getSprints,
  getProjectMembers, getProfiles, logActivity
} from './supabase.js';
import { showToast, openModal, closeModal, confirm } from './ui.js';
import { initials } from './auth.js';
import { escHtml } from './projects.js';

// ── Task type config ──────────────────────────────────────────
const ICON = {
  feature:  `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  bug:      `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="4"/><path d="M4 10h4m12 0h-4M6 15h12M8 19h8"/><line x1="12" y1="12" x2="12" y2="21"/></svg>`,
  chore:    `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  research: `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`,
  design:   `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>`,
};

export const TASK_TYPES = {
  feature:  { label: 'Feature',  svg: ICON.feature,  color: 'var(--accent)' },
  bug:      { label: 'Bug',      svg: ICON.bug,      color: 'var(--red)' },
  chore:    { label: 'Chore',    svg: ICON.chore,    color: 'var(--text-dim)' },
  research: { label: 'Research', svg: ICON.research, color: 'var(--purple)' },
  design:   { label: 'Design',   svg: ICON.design,   color: 'var(--amber)' },
};

export const STATUSES = [
  { id: 'todo',        label: 'To Do',       color: '#888890' },
  { id: 'in_progress', label: 'In Progress', color: '#4f8eff' },
  { id: 'in_review',  label: 'In Review',   color: '#a855f7' },
  { id: 'done',       label: 'Done',         color: '#3ecf8e' },
  { id: 'blocked',    label: 'Blocked',      color: '#f05151' },
  { id: 'backlog',    label: 'Backlog',      color: '#55555c' },
];

export const PRIORITIES = [
  { id: 'critical', label: 'Critical', color: 'var(--red)' },
  { id: 'high',     label: 'High',     color: 'var(--amber)' },
  { id: 'medium',   label: 'Medium',   color: 'var(--accent)' },
  { id: 'low',      label: 'Low',      color: 'var(--text-dim)' },
];

// ── Status normalization (handles legacy/imported data) ───────
const STATUS_NORM = {
  'Todo': 'todo', 'todo': 'todo',
  'Backlog': 'backlog', 'backlog': 'backlog',
  'In Progress': 'in_progress', 'in_progress': 'in_progress',
  'In Review': 'in_review', 'in_review': 'in_review', 'Review': 'in_review',
  'Done': 'done', 'done': 'done',
  'Blocked': 'blocked', 'blocked': 'blocked',
};
export function normalizeTasks(tasks) {
  const knownIds = new Set(STATUSES.map(s => s.id));
  tasks.forEach(t => {
    const mapped = STATUS_NORM[t.status];
    if (mapped) t.status = mapped;
    else if (!knownIds.has(t.status)) t.status = 'backlog';
  });
  return tasks;
}

// ── Load tasks for a project ─────────────────────────────────
export async function loadTasks(projectId, filters = {}) {
  try {
    const tasks = await getTasks(projectId, filters);
    return normalizeTasks(tasks);
  } catch (err) {
    showToast('Failed to load tasks', 'error');
    return [];
  }
}

// ── Quick create (inline in Kanban column) ───────────────────
export function quickCreateTask(status, projectId, onCreated) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    background:var(--surface);border:1px solid var(--accent);
    border-radius:var(--r3);padding:10px;margin:4px 0;
  `;
  overlay.innerHTML = `
    <input class="form-input" id="quick-task-title" placeholder="Task title…"
      style="width:100%;margin-bottom:8px;background:var(--elevated)" />
    <div style="display:flex;gap:6px;justify-content:flex-end">
      <button class="btn btn-ghost btn-sm" id="quick-cancel">Cancel</button>
      <button class="btn btn-primary btn-sm" id="quick-save">Add</button>
    </div>
  `;

  document.getElementById('quick-cancel')?.remove();
  return overlay;
}

// ── Create task modal ────────────────────────────────────────
export async function openCreateTaskModal(projectId, defaultStatus = 'todo', defaultFields = {}) {
  const [milestones, sprints, members, profiles] = await Promise.all([
    getMilestones(projectId).catch(() => []),
    getSprints(projectId).catch(() => []),
    getProjectMembers(projectId).catch(() => []),
    getProfiles([]).catch(() => [])
  ]);

  const memberProfiles = members.length > 0
    ? await getProfiles(members.map(m => m.user_id)).catch(() => [])
    : [];

  const body = buildTaskForm({
    milestones, sprints, memberProfiles,
    defaults: { status: defaultStatus, ...defaultFields }
  });

  openModal({
    id: 'modal-create-task',
    title: 'New Task',
    body,
    size: 'lg',
    primaryLabel: 'Create Task',
    onPrimary: async () => {
      const title = document.getElementById('tf-title').value.trim();
      if (!title) { showToast('Title is required', 'error'); return false; }

      const tags = document.getElementById('tf-tags').value
        .split(',').map(t => t.trim()).filter(Boolean);

      const taskType = document.getElementById('tf-type').value;
      let bugFields = {};
      if (taskType === 'bug') {
        bugFields = {
          steps: document.getElementById('tf-bug-steps')?.value || '',
          expected: document.getElementById('tf-bug-expected')?.value || '',
          actual: document.getElementById('tf-bug-actual')?.value || '',
          environment: document.getElementById('tf-bug-env')?.value || ''
        };
      }

      const assigneeEls = document.querySelectorAll('#tf-assignees input:checked');
      const assignees = Array.from(assigneeEls).map(el => el.value);

      try {
        const task = await createTask({
          project_id: projectId,
          title,
          description: document.getElementById('tf-desc').value.trim(),
          task_type: taskType,
          status: document.getElementById('tf-status').value,
          priority: document.getElementById('tf-priority').value,
          due_date: document.getElementById('tf-due').value || null,
          github_url: document.getElementById('tf-github').value.trim() || null,
          is_blocker: document.getElementById('tf-blocker').checked,
          milestone_id: document.getElementById('tf-milestone').value || null,
          sprint_id: document.getElementById('tf-sprint').value || null,
          tags,
          assignees,
          bug_fields: bugFields,
          notes: document.getElementById('tf-notes').value.trim() || null,
          prompt: document.getElementById('tf-prompt').value.trim() || null,
        });
        showToast('Task created', 'success');
        if (typeof defaultFields.onCreated === 'function') defaultFields.onCreated(task);
        import('./app.js').then(m => m.refreshCurrentView());
        return true;
      } catch (err) { showToast(err.message, 'error'); return false; }
    }
  });

  // Show/hide bug fields
  setTimeout(() => {
    const typeSelect = document.getElementById('tf-type');
    typeSelect?.addEventListener('change', () => {
      const bugSection = document.getElementById('tf-bug-section');
      if (bugSection) bugSection.style.display = typeSelect.value === 'bug' ? 'block' : 'none';
    });
    // Trigger once
    if (typeSelect && typeSelect.value === 'bug') {
      const bugSection = document.getElementById('tf-bug-section');
      if (bugSection) bugSection.style.display = 'block';
    }
  }, 50);
}

// ── Edit task modal ──────────────────────────────────────────
export async function openEditTaskModal(task) {
  const [milestones, sprints, members] = await Promise.all([
    getMilestones(task.project_id).catch(() => []),
    getSprints(task.project_id).catch(() => []),
    getProjectMembers(task.project_id).catch(() => [])
  ]);

  const memberProfiles = members.length > 0
    ? await getProfiles(members.map(m => m.user_id)).catch(() => [])
    : [];

  const body = buildTaskForm({
    milestones, sprints, memberProfiles,
    defaults: task,
    isEdit: true
  });

  openModal({
    id: 'modal-edit-task',
    title: 'Edit Task',
    body,
    size: 'lg',
    primaryLabel: 'Save Changes',
    onPrimary: async () => {
      const title = document.getElementById('tf-title').value.trim();
      if (!title) { showToast('Title required', 'error'); return false; }

      const tags = document.getElementById('tf-tags').value
        .split(',').map(t => t.trim()).filter(Boolean);

      const taskType = document.getElementById('tf-type').value;
      let bugFields = task.bug_fields || {};
      if (taskType === 'bug') {
        bugFields = {
          steps: document.getElementById('tf-bug-steps')?.value || '',
          expected: document.getElementById('tf-bug-expected')?.value || '',
          actual: document.getElementById('tf-bug-actual')?.value || '',
          environment: document.getElementById('tf-bug-env')?.value || ''
        };
      }

      const assigneeEls = document.querySelectorAll('#tf-assignees input:checked');
      const assignees = Array.from(assigneeEls).map(el => el.value);

      try {
        const updated = await updateTask(task.id, {
          title,
          description: document.getElementById('tf-desc').value.trim(),
          task_type: taskType,
          status: document.getElementById('tf-status').value,
          priority: document.getElementById('tf-priority').value,
          due_date: document.getElementById('tf-due').value || null,
          github_url: document.getElementById('tf-github').value.trim() || null,
          is_blocker: document.getElementById('tf-blocker').checked,
          milestone_id: document.getElementById('tf-milestone').value || null,
          sprint_id: document.getElementById('tf-sprint').value || null,
          tags,
          assignees,
          bug_fields: bugFields,
          notes: document.getElementById('tf-notes').value.trim() || null,
          prompt: document.getElementById('tf-prompt').value.trim() || null,
        });

        await logActivity(task.project_id, task.id, 'task_updated', { title });
        showToast('Task updated', 'success');
        import('./app.js').then(m => m.refreshCurrentView());

        // Re-render detail panel if open
        const panel = document.getElementById('detail-panel');
        if (panel && panel.classList.contains('open')) {
          import('./collaboration.js').then(m => m.openTaskDetail(updated));
        }
        return true;
      } catch (err) { showToast(err.message, 'error'); return false; }
    }
  });

  setTimeout(() => {
    const typeSelect = document.getElementById('tf-type');
    if (typeSelect) {
      typeSelect.addEventListener('change', () => {
        const bugSection = document.getElementById('tf-bug-section');
        if (bugSection) bugSection.style.display = typeSelect.value === 'bug' ? 'block' : 'none';
      });
      if (typeSelect.value === 'bug') {
        const bugSection = document.getElementById('tf-bug-section');
        if (bugSection) bugSection.style.display = 'block';
      }
    }
  }, 50);
}

// ── Build task form HTML ──────────────────────────────────────
function buildTaskForm({ milestones = [], sprints = [], memberProfiles = [], defaults = {}, isEdit = false }) {
  const d = defaults;
  const bf = d.bug_fields || {};

  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;min-height:0">

      <!-- LEFT COLUMN -->
      <div style="display:flex;flex-direction:column;gap:12px;padding-right:16px;border-right:1px solid var(--border)">
        <div class="form-group">
          <label class="form-label">Title *</label>
          <input class="form-input" id="tf-title" value="${escHtml(d.title || '')}" placeholder="Task title…" required />
        </div>

        <div class="form-group">
          <label class="form-label">Description</label>
          <textarea class="form-input" id="tf-desc" rows="3" placeholder="What needs to be done?">${escHtml(d.description || '')}</textarea>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-group">
            <label class="form-label">Type</label>
            <select class="form-input form-select" id="tf-type">
              ${Object.entries(TASK_TYPES).map(([id, t]) =>
                `<option value="${id}" ${d.task_type === id ? 'selected' : ''}>${t.label}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input form-select" id="tf-status">
              ${STATUSES.map(s =>
                `<option value="${s.id}" ${(d.status || 'todo') === s.id ? 'selected' : ''}>${s.label}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Priority</label>
            <select class="form-input form-select" id="tf-priority">
              ${PRIORITIES.map(p =>
                `<option value="${p.id}" ${(d.priority || 'medium') === p.id ? 'selected' : ''}>${p.label}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Due Date</label>
            <input class="form-input" id="tf-due" type="date" value="${d.due_date || ''}" />
          </div>
        </div>

        ${memberProfiles.length > 0 ? `
        <div class="form-group">
          <label class="form-label">Assignees</label>
          <div id="tf-assignees" style="display:flex;flex-wrap:wrap;gap:6px">
            ${memberProfiles.map(p => `
              <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:12px;padding:4px 8px;border:1px solid var(--border);border-radius:var(--r-full);transition:all var(--t-fast)"
                     onmouseenter="this.style.borderColor='var(--accent)'"
                     onmouseleave="this.style.borderColor=this.querySelector('input').checked?'var(--accent)':'var(--border)'">
                <input type="checkbox" value="${p.id}" style="display:none" ${(d.assignees || []).includes(p.id) ? 'checked' : ''}
                       onchange="this.closest('label').style.borderColor=this.checked?'var(--accent)':'var(--border)';this.closest('label').style.background=this.checked?'var(--accent-dim)':''" />
                <span class="avatar avatar-xs" style="background:${p.avatar_color||'#4f8eff'};color:#fff">${initials(p.display_name)}</span>
                ${escHtml(p.display_name || 'User')}
              </label>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="form-group">
          <label class="form-label">Notes</label>
          <textarea class="form-input" id="tf-notes" rows="2" placeholder="Context, links, internal notes…">${escHtml(d.notes || '')}</textarea>
        </div>
      </div>

      <!-- RIGHT COLUMN -->
      <div style="display:flex;flex-direction:column;gap:12px;padding-left:16px">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          <div class="form-group">
            <label class="form-label">Milestone</label>
            <select class="form-input form-select" id="tf-milestone">
              <option value="">None</option>
              ${milestones.map(m =>
                `<option value="${m.id}" ${d.milestone_id === m.id ? 'selected' : ''}>${escHtml(m.name)}</option>`
              ).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sprint</label>
            <select class="form-input form-select" id="tf-sprint">
              <option value="">None</option>
              ${sprints.map(s =>
                `<option value="${s.id}" ${d.sprint_id === s.id ? 'selected' : ''}>${escHtml(s.name)}</option>`
              ).join('')}
            </select>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">Tags <span style="font-weight:400;text-transform:none;letter-spacing:0">(comma separated)</span></label>
          <input class="form-input" id="tf-tags" value="${(d.tags || []).join(', ')}" placeholder="frontend, api, urgent…" />
        </div>

        <div class="form-group">
          <label class="form-label">GitHub / GitLab URL</label>
          <input class="form-input" id="tf-github" type="url" value="${escHtml(d.github_url || '')}" placeholder="https://github.com/…/issues/123" />
        </div>

        <div class="form-group">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:12px">
            <input type="checkbox" id="tf-blocker" ${d.is_blocker ? 'checked' : ''} />
            <span style="color:var(--red);font-weight:500">Mark as Blocker</span>
          </label>
        </div>

        <!-- AI Prompt -->
        <div class="form-group" style="flex:1">
          <label class="form-label" style="color:var(--accent)">AI Prompt</label>
          <textarea class="form-input" id="tf-prompt" rows="5" placeholder="Paste your AI prompt or context here…" style="font-family:var(--font-mono);font-size:12px;line-height:1.6;resize:vertical;flex:1">${escHtml(d.prompt || '')}</textarea>
        </div>

        <!-- Bug fields (shown only when type = bug) -->
        <div id="tf-bug-section" style="display:none">
          <div style="font-family:var(--font-mono);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--red);margin-bottom:10px">Bug Report</div>
          <div style="display:flex;flex-direction:column;gap:10px">
            <div class="form-group">
              <label class="form-label">Steps to Reproduce</label>
              <textarea class="form-input" id="tf-bug-steps" rows="2" placeholder="1. Go to…">${escHtml(bf.steps || '')}</textarea>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              <div class="form-group">
                <label class="form-label">Expected</label>
                <textarea class="form-input" id="tf-bug-expected" rows="2" placeholder="What should happen?">${escHtml(bf.expected || '')}</textarea>
              </div>
              <div class="form-group">
                <label class="form-label">Actual</label>
                <textarea class="form-input" id="tf-bug-actual" rows="2" placeholder="What happened?">${escHtml(bf.actual || '')}</textarea>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Environment</label>
              <input class="form-input" id="tf-bug-env" value="${escHtml(bf.environment || '')}" placeholder="OS, browser, version…" />
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Delete task ───────────────────────────────────────────────
export async function deleteTaskWithConfirm(task) {
  const ok = await confirm(`Delete "${task.title}"?`, 'This cannot be undone.');
  if (!ok) return;
  try {
    await deleteTask(task.id);
    showToast('Task deleted', 'success');
    import('./app.js').then(m => m.refreshCurrentView());
    // Close detail panel if showing this task
    const panel = document.getElementById('detail-panel');
    if (panel && panel.dataset.taskId === task.id) {
      panel.classList.remove('open');
    }
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Render task card ──────────────────────────────────────────
export async function renderTaskCard(task, opts = {}) {
  const dueCls = getDueDateClass(task.due_date);
  const typeConf = TASK_TYPES[task.task_type] || TASK_TYPES.feature;
  const priorityConf = PRIORITIES.find(p => p.id === task.priority) || PRIORITIES[2];

  // Checklist & Subtask progress
  let progressHtml = '';
  const checkTotal = (task._checklist || []).length;
  const subTotal = (task._subtasks || []).length;
  
  if (checkTotal > 0 || subTotal > 0) {
    const checkDone = (task._checklist || []).filter(c => c.done).length;
    const subDone = (task._subtasks || []).filter(s => s.status === 'done').length;
    const total = checkTotal + subTotal;
    const done = checkDone + subDone;
    const pct = Math.round((done / total) * 100);
    progressHtml = `
      <div class="progress-bar" title="${done}/${total} done" style="margin-top:6px">
        <div class="progress-fill ${pct === 100 ? 'complete' : ''}" style="width:${pct}%"></div>
      </div>
    `;
  }

  // Creator Avatar
  let creatorHtml = '';
  if (task.user_id && opts.profiles) {
    const p = opts.profiles[task.user_id];
    creatorHtml = `
      <div class="avatar avatar-xs" style="background:${p?.avatar_color || '#4f8eff'};color:#fff;border:1px solid var(--border)" title="Created by: ${escHtml(p?.display_name || 'Unknown')}">
        ${initials(p?.display_name || '?')}
      </div>
    `;
  }

  // Assignee avatars
  let assigneeHtml = '';
  if (task.assignees && task.assignees.length > 0 && opts.profiles) {
    const shown = task.assignees.slice(0, 3);
    const extra = task.assignees.length - 3;
    assigneeHtml = `<div class="avatar-group">
      ${extra > 0 ? `<div class="avatar avatar-xs avatar-overflow">+${extra}</div>` : ''}
      ${shown.map(uid => {
        const p = opts.profiles[uid];
        return `<div class="avatar avatar-xs" style="background:${p?.avatar_color || '#4f8eff'};color:#fff" title="Assignee: ${escHtml(p?.display_name || '')}">
          ${initials(p?.display_name || '?')}
        </div>`;
      }).reverse().join('')}
    </div>`;
  }

  // Tags
  const tagsHtml = (task.tags || []).slice(0, 3).map(t =>
    `<span class="tag-pill">${escHtml(t)}</span>`
  ).join('');

  // GitHub badge
  const githubHtml = task.github_url
    ? `<a href="${escHtml(task.github_url)}" target="_blank" rel="noopener" class="repo-badge" onclick="event.stopPropagation()">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58 0-.28-.01-1.03-.02-2.03-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.11-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.65 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.21.7.82.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg>
        ${getRepoName(task.github_url)}
      </a>`
    : '';

  return `
    <div class="task-card ${task.is_blocker ? 'is-blocker' : ''} ${dueCls}"
         data-task-id="${task.id}"
         data-status="${task.status}">

      <div class="card-drag-handle" aria-label="Drag task">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="6" r="1" fill="currentColor"/><circle cx="15" cy="6" r="1" fill="currentColor"/>
          <circle cx="9" cy="12" r="1" fill="currentColor"/><circle cx="15" cy="12" r="1" fill="currentColor"/>
          <circle cx="9" cy="18" r="1" fill="currentColor"/><circle cx="15" cy="18" r="1" fill="currentColor"/>
        </svg>
      </div>

      <div class="card-header">
        <span class="badge" style="background:${typeConf.color}22;color:${typeConf.color};flex-shrink:0">${typeConf.svg}</span>
        <div class="card-title">${escHtml(task.title)}</div>
        ${task.is_blocker ? `<span style="font-size:9px;font-family:var(--font-mono);color:var(--red);font-weight:700;flex-shrink:0">BLOCK</span>` : ''}
      </div>

      <div class="card-meta">
        <span class="badge badge-default" data-priority="${task.priority}" style="font-size:10px">
          <span class="priority-dot"></span>${priorityConf.label}
        </span>
        ${task.due_date ? `<span class="badge ${dueCls === 'due-overdue' ? 'badge-red' : dueCls === 'due-today' ? 'badge-amber' : 'badge-accent'}" style="font-size:10px">${formatShortDate(task.due_date)}</span>` : ''}
        ${tagsHtml}
      </div>

      ${progressHtml}

      ${(assigneeHtml || creatorHtml || githubHtml) ? `<div class="card-footer">${creatorHtml}${assigneeHtml}<div style="flex:1"></div>${githubHtml}</div>` : ''}
    </div>
  `;
}

// ── Filter bar ────────────────────────────────────────────────
export function renderFilterBar(filters, onChange) {
  const container = document.getElementById('filter-bar');
  if (!container) return;

  container.innerHTML = `
    <div class="filter-bar">
      <div class="search-input" style="min-width:180px">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
        <input type="text" id="filter-search" placeholder="Search tasks…" value="${filters.search || ''}" />
      </div>

      <select class="form-input form-select" id="filter-status" style="width:auto;font-size:12px;padding:5px 24px 5px 8px">
        <option value="">All Status</option>
        ${STATUSES.map(s => `<option value="${s.id}" ${filters.status === s.id ? 'selected' : ''}>${s.label}</option>`).join('')}
      </select>

      <select class="form-input form-select" id="filter-priority" style="width:auto;font-size:12px;padding:5px 24px 5px 8px">
        <option value="">All Priority</option>
        ${PRIORITIES.map(p => `<option value="${p.id}" ${filters.priority === p.id ? 'selected' : ''}>${p.label}</option>`).join('')}
      </select>

      <select class="form-input form-select" id="filter-type" style="width:auto;font-size:12px;padding:5px 24px 5px 8px">
        <option value="">All Types</option>
        ${Object.entries(TASK_TYPES).map(([id, t]) =>
          `<option value="${id}" ${filters.task_type === id ? 'selected' : ''}>${t.label}</option>`
        ).join('')}

      </select>

      <label class="filter-chip ${filters.is_blocker ? 'active' : ''}" id="filter-blocker">
        <input type="checkbox" style="display:none" ${filters.is_blocker ? 'checked' : ''} />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        Blockers
      </label>

      ${Object.keys(filters).some(k => filters[k] && k !== 'status') ? `
        <button class="btn btn-ghost btn-sm" id="filter-clear" style="font-size:11px">Clear filters</button>
      ` : ''}
    </div>
  `;

  // Wire events
  let debounceTimer;
  document.getElementById('filter-search')?.addEventListener('input', e => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => onChange({ ...filters, search: e.target.value }), 300);
  });
  document.getElementById('filter-status')?.addEventListener('change', e => onChange({ ...filters, status: e.target.value }));
  document.getElementById('filter-priority')?.addEventListener('change', e => onChange({ ...filters, priority: e.target.value }));
  document.getElementById('filter-type')?.addEventListener('change', e => onChange({ ...filters, task_type: e.target.value }));
  document.getElementById('filter-blocker')?.addEventListener('click', () => {
    onChange({ ...filters, is_blocker: !filters.is_blocker });
  });
  document.getElementById('filter-clear')?.addEventListener('click', () => onChange({}));
}

// ── Date utilities ────────────────────────────────────────────
export function getDueDateClass(due) {
  if (!due) return '';
  const today = new Date(); today.setHours(0,0,0,0);
  const d = new Date(due + 'T00:00:00');
  if (d < today) return 'due-overdue';
  if (d.getTime() === today.getTime()) return 'due-today';
  const week = new Date(today); week.setDate(today.getDate() + 7);
  if (d <= week) return 'due-week';
  return '';
}

export function formatShortDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  const today = new Date(); today.setHours(0,0,0,0);
  const diff = Math.round((d - today) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getRepoName(url) {
  try {
    const u = new URL(url);
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) return `${parts[0]}/${parts[1]}`;
    return u.hostname;
  } catch { return 'Link'; }
}
