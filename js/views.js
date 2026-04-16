// DevTrack — views.js
// Table, Upcoming, and Roadmap views

import { getTasks, getMilestones, getSprints, getProfiles, getProjectMembers } from './supabase.js';
import { renderTaskCard, STATUSES, PRIORITIES, TASK_TYPES, getDueDateClass, formatShortDate } from './tasks.js';
import { initials } from './auth.js';
import { escHtml } from './projects.js';
import { showToast } from './ui.js';

// ══════════════════════════════════════════════════════════════
// TABLE VIEW
// ══════════════════════════════════════════════════════════════
const PRIORITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_ORDER   = { todo: 0, in_progress: 1, in_review: 2, done: 3, blocked: 4, backlog: 5 };
const TYPE_ORDER     = { feature: 0, bug: 1, chore: 2, research: 3, design: 4 };

function sortTaskList(tasks, col, dir) {
  return [...tasks].sort((a, b) => {
    let av, bv;
    if (col === 'priority') {
      av = PRIORITY_ORDER[a.priority] ?? 99;
      bv = PRIORITY_ORDER[b.priority] ?? 99;
    } else if (col === 'status') {
      av = STATUS_ORDER[a.status] ?? 99;
      bv = STATUS_ORDER[b.status] ?? 99;
    } else if (col === 'task_type') {
      av = TYPE_ORDER[a.task_type] ?? 99;
      bv = TYPE_ORDER[b.task_type] ?? 99;
    } else if (col === 'due_date') {
      av = a.due_date || 'zzz';
      bv = b.due_date || 'zzz';
    } else {
      av = (a[col] || '').toString().toLowerCase();
      bv = (b[col] || '').toString().toLowerCase();
    }
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ?  1 : -1;
    return 0;
  });
}

const SORT_ICON_NEUTRAL = `<svg class="sort-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 15l5 5 5-5M7 9l5-5 5 5"/></svg>`;
const SORT_ICON_ASC     = `<svg class="sort-icon sort-active" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 14l5 5 5-5"/><path d="M7 10h10" opacity=".3"/></svg>`;
const SORT_ICON_DESC    = `<svg class="sort-icon sort-active" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M7 10l5-5 5 5"/><path d="M7 14h10" opacity=".3"/></svg>`;

export async function renderTableView(projectId, filters = {}, appState = {}) {
  const container = document.getElementById('kanban-board');
  if (!container) return;
  document.getElementById('kanban-indicator')?.style.setProperty('display', 'none', 'important');
  container.style.cssText = 'display:block;flex:1;min-height:0;overflow:hidden;padding:0';

  const SPINNER = `<div class="animate-spin" style="display:inline-block;width:18px;height:18px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%"></div>`;

  container.innerHTML = `
    <div class="table-view-container" style="height:100%;overflow:auto">
      <table class="task-table" id="task-table-el">
        <thead>
          <tr>
            <th class="th-flag" style="width:32px"></th>
            <th class="th-sortable" data-sort="title">Title ${SORT_ICON_NEUTRAL}</th>
            <th class="th-sortable table-col-hide-tablet" data-sort="task_type">Type ${SORT_ICON_NEUTRAL}</th>
            <th class="th-sortable" data-sort="status">Status ${SORT_ICON_NEUTRAL}</th>
            <th class="th-sortable table-col-hide-tablet" data-sort="priority">Priority ${SORT_ICON_NEUTRAL}</th>
            <th class="table-col-hide-mobile">Assignees</th>
            <th class="th-sortable table-col-hide-mobile" data-sort="due_date">Due ${SORT_ICON_NEUTRAL}</th>
            <th class="table-col-hide-tablet">Tags</th>
            <th class="th-actions" style="width:48px"></th>
          </tr>
        </thead>
        <tbody id="task-table-body">
          <tr><td colspan="9" style="text-align:center;padding:48px;color:var(--text-dim)">${SPINNER}</td></tr>
        </tbody>
      </table>
    </div>`;

  try {
    // Use pre-loaded tasks from AppState to avoid double-fetching
    const tasks = Array.isArray(appState.tasks)
      ? [...appState.tasks]
      : await getTasks(projectId, filters);

    const members = await getProjectMembers(projectId).catch(() => []);
    let profileMap = {};
    if (members.length > 0) {
      const profiles = await getProfiles(members.map(m => m.user_id)).catch(() => []);
      profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
    }

    let sortCol = 'title';
    let sortDir = 'asc';

    function updateSortHeaders() {
      document.querySelectorAll('#task-table-el .th-sortable').forEach(th => {
        th.classList.remove('th-sort-asc', 'th-sort-desc');
        const iconEl = th.querySelector('.sort-icon');
        if (!iconEl) return;
        const isActive = th.dataset.sort === sortCol;
        iconEl.classList.toggle('sort-active', isActive);
        if (isActive && sortDir === 'asc') {
          th.classList.add('th-sort-asc');
          iconEl.innerHTML = '<path d="M7 14l5 5 5-5"/><path d="M7 10h10" opacity=".3"/>';
        } else if (isActive && sortDir === 'desc') {
          th.classList.add('th-sort-desc');
          iconEl.innerHTML = '<path d="M7 10l5-5 5 5"/><path d="M7 14h10" opacity=".3"/>';
        } else {
          iconEl.innerHTML = '<path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>';
        }
      });
    }

    function renderRows(sorted) {
      const tbody = document.getElementById('task-table-body');
      if (!tbody) return;

      if (sorted.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><p>No tasks found</p></div></td></tr>`;
        return;
      }

      tbody.innerHTML = sorted.map(task => {
        const status   = STATUSES.find(s => s.id === task.status) || STATUSES[0];
        const priority = PRIORITIES.find(p => p.id === task.priority) || PRIORITIES[2];
        const typeConf = TASK_TYPES[task.task_type] || TASK_TYPES.feature;
        const dueCls   = getDueDateClass(task.due_date);
        const assigneeAvatars = (task.assignees || []).slice(0, 3).map(uid => {
          const p = profileMap[uid];
          return `<div class="avatar avatar-xs" style="background:${p?.avatar_color||'#4f8eff'};color:#fff;margin-left:-4px" title="${escHtml(p?.display_name||'')}">${initials(p?.display_name || '?')}</div>`;
        }).join('');

        const dueBadge = task.due_date
          ? `<span class="badge ${dueCls === 'due-overdue' ? 'badge-red' : dueCls === 'due-today' ? 'badge-amber' : dueCls === 'due-week' ? 'badge-accent' : 'badge-default'}" style="font-size:10px">${formatShortDate(task.due_date)}</span>`
          : `<span style="color:var(--text-dim);font-size:11px">—</span>`;

        const tagChips = (task.tags || []).slice(0, 3).map(t =>
          `<span class="tag-pill">${escHtml(t)}</span>`
        ).join('');

        return `
          <tr data-task-id="${task.id}"${task.is_blocker ? ' class="blocker-row"' : ''}>
            <td class="td-flag">
              ${task.is_blocker ? `<span class="blocker-icon" title="Blocker"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></span>` : ''}
            </td>
            <td class="td-title">
              <div style="display:flex;align-items:center;gap:6px;min-width:0">
                <span class="task-title-text">${escHtml(task.title)}</span>
                ${task.prompt?.trim() ? `<span class="card-prompt-dot" title="Has AI prompt"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></span>` : ''}
              </div>
              ${(task.tags||[]).length > 0 ? `<div class="td-tags-inline">${tagChips}</div>` : ''}
            </td>
            <td class="table-col-hide-tablet">
              <span class="badge" style="background:${typeConf.color}1a;color:${typeConf.color};gap:5px">${typeConf.svg} ${typeConf.label}</span>
            </td>
            <td>
              <span class="badge status-badge" data-status="${task.status}">${status.label}</span>
            </td>
            <td class="table-col-hide-tablet">
              <span class="priority-text" data-priority="${task.priority || 'medium'}">${priority.label}</span>
            </td>
            <td class="table-col-hide-mobile">
              <div style="display:flex;align-items:center;flex-direction:row-reverse;justify-content:flex-end;margin-left:4px">
                ${assigneeAvatars}
              </div>
            </td>
            <td class="table-col-hide-mobile">${dueBadge}</td>
            <td class="table-col-hide-tablet">
              <div style="display:flex;gap:4px;flex-wrap:wrap">${tagChips}</div>
            </td>
            <td class="td-actions">
              <div class="row-actions">
                <button class="btn-row-edit btn-edit-task" data-task-id="${task.id}" title="Edit task">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
            </td>
          </tr>`;
      }).join('');

      // Row click → open detail panel
      tbody.querySelectorAll('tr[data-task-id]').forEach(row => {
        row.addEventListener('click', e => {
          if (e.target.closest('button')) return;
          const task = tasks.find(t => t.id === row.dataset.taskId);
          if (task) import('./collaboration.js').then(m => m.openTaskDetail(task));
        });
      });

      // Edit buttons
      tbody.querySelectorAll('.btn-edit-task').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const task = tasks.find(t => t.id === btn.dataset.taskId);
          if (task) import('./tasks.js').then(m => m.openEditTaskModal(task));
        });
      });
    }

    // Bind sort header clicks
    document.querySelectorAll('#task-table-el .th-sortable').forEach(th => {
      th.addEventListener('click', () => {
        if (sortCol === th.dataset.sort) {
          sortDir = sortDir === 'asc' ? 'desc' : 'asc';
        } else {
          sortCol = th.dataset.sort;
          sortDir = 'asc';
        }
        updateSortHeaders();
        renderRows(sortTaskList(tasks, sortCol, sortDir));
      });
    });

    // Initial render
    updateSortHeaders();
    renderRows(sortTaskList(tasks, sortCol, sortDir));

  } catch (err) {
    showToast('Failed to load table view', 'error');
    console.error(err);
  }
}

// ══════════════════════════════════════════════════════════════
// UPCOMING VIEW
// ══════════════════════════════════════════════════════════════
export async function renderUpcomingView(projectId, filters = {}, appState = {}) {
  const container = document.getElementById('kanban-board');
  if (!container) return;
  document.getElementById('kanban-indicator')?.style.setProperty('display', 'none', 'important');
  container.style.cssText = 'display:block;flex:1;min-height:0;overflow:hidden;padding:0';
  container.innerHTML = `<div style="height:100%;overflow-y:auto" id="upcoming-scroll">
    <div class="empty-state" style="padding:60px">
      <div class="animate-spin" style="width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%"></div>
    </div>
  </div>`;

  try {
    const tasks = Array.isArray(appState.tasks) ? [...appState.tasks] : await getTasks(projectId, { ...filters });
    const scroll = document.getElementById('upcoming-scroll');
    if (!scroll) return;

    const today = new Date(); today.setHours(0,0,0,0);
    const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);

    const groups = {
      overdue:  { label: 'Overdue',    color: 'var(--red)',    tasks: [] },
      today:    { label: 'Today',       color: 'var(--amber)',  tasks: [] },
      this_week:{ label: 'This Week',   color: 'var(--accent)', tasks: [] },
      no_date:  { label: 'No Due Date', color: 'var(--text-dim)', tasks: [] },
    };

    for (const task of tasks) {
      if (!task.due_date) {
        groups.no_date.tasks.push(task);
        continue;
      }
      const d = new Date(task.due_date + 'T00:00:00');
      if (d < today) groups.overdue.tasks.push(task);
      else if (d.getTime() === today.getTime()) groups.today.tasks.push(task);
      else if (d <= weekEnd) groups.this_week.tasks.push(task);
      else groups.no_date.tasks.push(task);
    }

    const html = Object.entries(groups).map(([key, group]) => {
      if (group.tasks.length === 0) return '';
      return `
        <div class="upcoming-group">
          <div class="upcoming-group-header">
            <span class="upcoming-group-title" style="color:${group.color}">${group.label}</span>
            <span class="upcoming-group-count">${group.tasks.length}</span>
            <div class="upcoming-group-line"></div>
          </div>
          ${group.tasks.map(task => buildUpcomingRow(task)).join('')}
        </div>
      `;
    }).join('');

    scroll.innerHTML = html || `<div class="empty-state"><p>No tasks with due dates</p></div>`;

    // Click to open detail
    scroll.querySelectorAll('.upcoming-task-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.taskId;
        const task = tasks.find(t => t.id === id);
        if (task) import('./collaboration.js').then(m => m.openTaskDetail(task));
      });
    });

  } catch (err) {
    showToast('Failed to load upcoming view', 'error');
  }
}

function buildUpcomingRow(task) {
  const status = STATUSES.find(s => s.id === task.status) || STATUSES[0];
  const typeConf = TASK_TYPES[task.task_type] || TASK_TYPES.feature;
  const dueCls = getDueDateClass(task.due_date);

  return `
    <div class="upcoming-task-row" data-task-id="${task.id}">
      <span class="badge" style="background:${typeConf.color}22;color:${typeConf.color};width:20px;justify-content:center">${typeConf.svg}</span>
      <span style="flex:1;font-size:13px;font-weight:500;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${escHtml(task.title)}</span>
      ${task.due_date ? `
        <span class="badge ${dueCls==='due-overdue'?'badge-red':dueCls==='due-today'?'badge-amber':'badge-accent'}" style="font-size:10px;flex-shrink:0">
          ${formatShortDate(task.due_date)}
        </span>` : ''}
      <span class="badge status-badge" data-status="${task.status}" style="flex-shrink:0">${status.label}</span>
      ${task.is_blocker ? `<span style="color:var(--red);font-size:10px;font-family:var(--font-mono);flex-shrink:0">BLOCKED</span>` : ''}
    </div>
  `;
}

// ══════════════════════════════════════════════════════════════
// ROADMAP VIEW
// ══════════════════════════════════════════════════════════════
export async function renderRoadmapView(projectId, appState = {}) {
  const container = document.getElementById('kanban-board');
  if (!container) return;
  document.getElementById('kanban-indicator')?.style.setProperty('display', 'none', 'important');
  container.style.cssText = 'display:block;flex:1;min-height:0;overflow:hidden;padding:0';
  container.innerHTML = `<div id="roadmap-view">
    <div class="empty-state">
      <div class="animate-spin" style="width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%"></div>
    </div>
  </div>`;

  try {
    const [milestones, sprints] = await Promise.all([
      getMilestones(projectId).catch(() => []),
      getSprints(projectId).catch(() => [])
    ]);
    const tasks = Array.isArray(appState.tasks) ? [...appState.tasks] : await getTasks(projectId);

    const roadmap = document.getElementById('roadmap-view');
    if (!roadmap) return;

    // Determine date range
    const datesWithData = [
      ...tasks.filter(t => t.due_date).map(t => new Date(t.due_date)),
      ...milestones.filter(m => m.due_date).map(m => new Date(m.due_date)),
      ...sprints.filter(s => s.start_date || s.end_date).flatMap(s => [
        s.start_date ? new Date(s.start_date) : null,
        s.end_date ? new Date(s.end_date) : null
      ].filter(Boolean))
    ];

    const now = new Date();
    const minDate = datesWithData.length > 0
      ? new Date(Math.min(...datesWithData.map(d => d.getTime()), now.getTime()))
      : new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const maxDate = datesWithData.length > 0
      ? new Date(Math.max(...datesWithData.map(d => d.getTime())))
      : new Date(now.getFullYear(), now.getMonth() + 4, 0);

    // Round to month boundaries
    const startDate = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
    const endDate   = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
    const totalDays = Math.max(1, Math.round((endDate - startDate) / 86400000));

    // Build month headers
    const months = [];
    let d = new Date(startDate);
    while (d <= endDate) {
      months.push({ year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }) });
      d = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    }

    function pct(date) {
      const days = Math.round((new Date(date) - startDate) / 86400000);
      return Math.max(0, Math.min(100, (days / totalDays) * 100));
    }

    // Tasks with due dates
    const roadmapTasks = tasks.filter(t => t.due_date);

    // Sprints with date range
    const roadmapSprints = sprints.filter(s => s.start_date && s.end_date);

    const html = `
      <!-- Header: months -->
      <div class="roadmap-header">
        <div class="roadmap-label-col">Task / Sprint</div>
        <div class="roadmap-timeline">
          ${months.map(m => `<div class="roadmap-month">${m.label}</div>`).join('')}
        </div>
      </div>

      <!-- Today marker -->
      <div style="position:relative;height:0">
        <div style="position:absolute;left:calc(200px + ${pct(now)}%);top:-10px;width:1px;height:calc(100% + 20px);background:var(--amber);opacity:.6;z-index:5;pointer-events:none">
          <div style="position:absolute;top:4px;left:4px;font-size:9px;font-family:var(--font-mono);color:var(--amber);white-space:nowrap">Today</div>
        </div>
      </div>

      <!-- Sprint rows -->
      ${roadmapSprints.map(sprint => {
        const left = pct(sprint.start_date);
        const right = pct(sprint.end_date);
        const width = right - left;
        const statusColor = sprint.status === 'active' ? 'var(--green)' : sprint.status === 'completed' ? 'var(--text-dim)' : 'var(--accent)';
        return `
          <div class="roadmap-row">
            <div class="roadmap-task-label" style="font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${escHtml(sprint.name)}</div>
            <div class="roadmap-bar-area">
              <div class="roadmap-bar" style="left:${left}%;width:${Math.max(width, 2)}%;background:${statusColor}22;border-color:${statusColor};color:${statusColor}">
                ${escHtml(sprint.name)}
              </div>
            </div>
          </div>
        `;
      }).join('')}

      <!-- Task rows -->
      ${roadmapTasks.length === 0 && roadmapSprints.length === 0 ? `
        <div class="empty-state" style="margin-top:40px">
          <p>Add due dates to tasks to see them on the roadmap</p>
        </div>
      ` : roadmapTasks.map(task => {
        const typeConf = TASK_TYPES[task.task_type] || TASK_TYPES.feature;
        const left = pct(task.due_date);
        // Task bar spans from 3 days before due date to due date
        const barStart = Math.max(0, left - (3 / totalDays * 100));
        const barWidth = left - barStart;

        return `
          <div class="roadmap-row" data-task-id="${task.id}">
            <div class="roadmap-task-label" title="${escHtml(task.title)}">
              <span style="color:${typeConf.color};margin-right:4px">${typeConf.svg}</span>
              ${escHtml(task.title)}
            </div>
            <div class="roadmap-bar-area">
              <div class="roadmap-bar" style="left:${barStart}%;width:${Math.max(barWidth, 1)}%;min-width:6px"
                   data-task-id="${task.id}">
                ${escHtml(task.title)}
              </div>
            </div>
          </div>
        `;
      }).join('')}

      <!-- Milestone markers -->
      ${milestones.filter(m => m.due_date).map(ms => `
        <div style="position:relative;height:16px;display:flex;align-items:center">
          <div class="roadmap-task-label" style="font-size:11px;color:var(--amber);font-family:var(--font-mono)">⬥ ${escHtml(ms.name)}</div>
          <div style="flex:1;position:relative;height:100%">
            <div class="roadmap-milestone-marker" style="left:${pct(ms.due_date)}%" title="${escHtml(ms.name)}: ${ms.due_date}"></div>
          </div>
        </div>
      `).join('')}
    `;

    roadmap.innerHTML = html;

    // Click task bar → open detail
    roadmap.querySelectorAll('.roadmap-bar[data-task-id]').forEach(bar => {
      bar.addEventListener('click', () => {
        const id = bar.dataset.taskId;
        const task = tasks.find(t => t.id === id);
        if (task) import('./collaboration.js').then(m => m.openTaskDetail(task));
      });
    });

    roadmap.querySelectorAll('.roadmap-row[data-task-id]').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('.roadmap-bar')) return;
        const id = row.dataset.taskId;
        const task = tasks.find(t => t.id === id);
        if (task) import('./collaboration.js').then(m => m.openTaskDetail(task));
      });
    });

  } catch (err) {
    showToast('Failed to load roadmap', 'error');
    console.error(err);
  }
}
