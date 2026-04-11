// DevTrack — kanban.js
// Full Pointer Events drag-and-drop board (enterprise quality)

import { getTasks, reorderTasks, updateTask, getProfiles, getProjectMembers } from './supabase.js';
import { renderTaskCard, STATUSES, openCreateTaskModal } from './tasks.js';
import { showToast } from './ui.js';

// ── State machine ─────────────────────────────────────────────
// idle → dragging → dropped|cancelled
const DragState = {
  phase: 'idle',       // 'idle' | 'dragging'
  taskId: null,
  taskEl: null,
  ghost: null,
  sourceCol: null,
  sourceIndex: -1,
  currentCol: null,
  currentIndex: -1,
  startX: 0,
  startY: 0,
  offsetX: 0,
  offsetY: 0,
  scrollRAF: null,
  dropLine: null
};

let _profileMap = {};
let _taskCache = [];
let _filters = {};
let _projectId = null;

// ── Main render ──────────────────────────────────────────────
export async function renderKanban(projectId, filters = {}, appState = {}) {
  _filters = filters;
  _projectId = projectId;
  const board = document.getElementById('kanban-board');
  if (!board) return;

  board.style.cssText = ''; // Reset any inline styles set by other views
  board.innerHTML = `<div class="empty-state" style="width:100%;margin-top:60px">
    <div class="animate-spin" style="width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%"></div>
  </div>`;

  try {
    const [tasks, members] = await Promise.all([
      getTasks(projectId, filters),
      getProjectMembers(projectId).catch(() => [])
    ]);

    _taskCache = tasks;

    // Normalize legacy status values from old data imports
    const statusMap = {
      'todo':        'todo',
      'Todo':        'todo',
      'backlog':     'backlog',
      'Backlog':     'backlog',
      'in_progress': 'in_progress',
      'In Progress': 'in_progress',
      'in_review':   'in_review',
      'In Review':   'in_review',
      'Review':      'in_review',
      'done':        'done',
      'Done':        'done',
      'blocked':     'blocked',
      'Blocked':     'blocked',
    };
    const knownStatusIds = new Set(STATUSES.map(s => s.id));
    tasks.forEach(t => {
      if (statusMap[t.status]) {
        t.status = statusMap[t.status];
      } else if (!knownStatusIds.has(t.status)) {
        // Unknown status → fall into backlog so it's visible
        t.status = 'backlog';
      }
    });

    // Fetch checklist and subtasks for all tasks in parallel
    await Promise.all(tasks.map(async t => {
      const [checks, subs] = await Promise.all([
        import('./supabase.js').then(m => m.getChecklist(t.id).catch(() => [])),
        import('./supabase.js').then(m => m.getSubtasks(t.id).catch(() => []))
      ]);
      t._checklist = checks;
      t._subtasks = subs;
    }));

    // Collect all unique user IDs (members + task creators + assignees)
    const userIds = new Set(members.map(m => m.user_id));
    tasks.forEach(t => {
      if (t.user_id) userIds.add(t.user_id);
      if (t.assignees) t.assignees.forEach(uid => userIds.add(uid));
    });

    if (userIds.size > 0) {
      const profiles = await getProfiles(Array.from(userIds)).catch(() => []);
      _profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
    }

    board.innerHTML = '';
    const isOwner = appState.currentProject?._role === 'owner' || appState.currentProject?.user_id === appState.userId;

    for (const col of STATUSES) {
      const colTasks = tasks.filter(t => t.status === col.id);
      const colEl = await buildColumn(col, colTasks, projectId, isOwner);
      board.appendChild(colEl);
    }

    initDragAndDrop(board);
  } catch (err) {
    board.innerHTML = `<div class="empty-state" style="width:100%"><p style="color:var(--red)">${err.message}</p></div>`;
    showToast('Failed to load board', 'error');
  }
}

// ── Build column ──────────────────────────────────────────────
async function buildColumn(col, tasks, projectId, isOwner) {
  const el = document.createElement('div');
  el.className = 'kanban-column';
  el.dataset.status = col.id;

  const cardsHtml = await Promise.all(
    tasks.map(t => renderTaskCard(t, {
      showChecklist: true,
      profiles: _profileMap
    }))
  );

  el.innerHTML = `
    <div class="kanban-col-header">
      <span class="col-dot" style="background:${col.color}"></span>
      <span class="col-title" style="color:${col.color}">${col.label}</span>
      <span class="col-count">${tasks.length}</span>
    </div>
    <div class="kanban-cards" data-col="${col.id}">
      ${cardsHtml.join('')}
    </div>
    <div class="col-add-btn" data-status="${col.id}" data-project="${projectId}">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      Add task
    </div>
  `;

  // Card clicks → detail panel
  el.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('click', e => {
      if (DragState.phase === 'dragging') return;
      const id = card.dataset.taskId;
      const task = _taskCache.find(t => t.id === id);
      if (task) import('./collaboration.js').then(m => m.openTaskDetail(task));
    });
  });

  // Add task button
  el.querySelector('.col-add-btn')?.addEventListener('click', async e => {
    e.stopPropagation();
    const status = e.currentTarget.dataset.status;
    await openCreateTaskModal(projectId, status);
  });

  return el;
}

// ══════════════════════════════════════════════════════════════
// DRAG AND DROP — Pointer Events API
// ══════════════════════════════════════════════════════════════
function initDragAndDrop(board) {
  board.addEventListener('pointerdown', onPointerDown, { passive: false });
}

function onPointerDown(e) {
  // Only left button (mouse) or single touch
  if (e.pointerType === 'mouse' && e.button !== 0) return;

  const card = e.target.closest('.task-card');
  if (!card) return;
  if (e.target.closest('a, button, input, select, textarea, [contenteditable]')) return;

  e.preventDefault();
  e.stopPropagation();

  const rect = card.getBoundingClientRect();
  DragState.phase = 'pre-drag';
  DragState.taskId = card.dataset.taskId;
  DragState.taskEl = card;
  DragState.startX = e.clientX;
  DragState.startY = e.clientY;
  DragState.offsetX = e.clientX - rect.left;
  DragState.offsetY = e.clientY - rect.top;
  DragState.sourceCol = card.closest('[data-col]');
  DragState.sourceIndex = getCardIndex(card);

  card.setPointerCapture(e.pointerId);
  card.addEventListener('pointermove', onPointerMove, { passive: false });
  card.addEventListener('pointerup', onPointerUp, { once: true });
  card.addEventListener('pointercancel', onPointerCancel, { once: true });
}

function onPointerMove(e) {
  e.preventDefault();

  if (DragState.phase === 'pre-drag') {
    const dx = Math.abs(e.clientX - DragState.startX);
    const dy = Math.abs(e.clientY - DragState.startY);
    if (dx < 4 && dy < 4) return; // Minimum movement threshold
    startDrag(e);
  }

  if (DragState.phase !== 'dragging') return;

  // Move ghost
  const x = e.clientX - DragState.offsetX;
  const y = e.clientY - DragState.offsetY;
  DragState.ghost.style.transform = `translate3d(${x}px,${y}px,0) scale(1.03) rotate(1.2deg)`;

  // Find target column
  const targetCol = getColumnAtPoint(e.clientX, e.clientY);
  if (targetCol) {
    if (DragState.currentCol && DragState.currentCol !== targetCol) {
      DragState.currentCol.classList.remove('drag-over');
    }
    targetCol.classList.add('drag-over');
    DragState.currentCol = targetCol;

    // Position drop line
    const cards = Array.from(targetCol.querySelectorAll('.task-card:not(.dragging)'));
    const idx = getInsertIndex(cards, e.clientY);
    DragState.currentIndex = idx;
    positionDropLine(targetCol, cards, idx);
  }

  // Auto-scroll
  autoScrollColumn(e.clientX, e.clientY);
}

function onPointerUp(e) {
  if (DragState.taskEl) {
    DragState.taskEl.removeEventListener('pointermove', onPointerMove);
  }

  if (DragState.phase === 'dragging') {
    completeDrop(e);
  } else {
    cleanup();
  }
}

function onPointerCancel() {
  if (DragState.taskEl) {
    DragState.taskEl.removeEventListener('pointermove', onPointerMove);
  }
  cancelDrag();
}

function startDrag(e) {
  DragState.phase = 'dragging';
  const card = DragState.taskEl;
  const rect = card.getBoundingClientRect();

  // Create ghost (visual clone)
  const ghost = document.createElement('div');
  ghost.className = 'drag-ghost task-card';
  ghost.innerHTML = card.innerHTML;
  ghost.style.width = `${rect.width}px`;
  ghost.style.position = 'fixed';
  ghost.style.top = '0';
  ghost.style.left = '0';
  ghost.style.pointerEvents = 'none';
  ghost.style.zIndex = '9999';
  ghost.style.willChange = 'transform';
  ghost.style.transform = `translate3d(${rect.left}px,${rect.top}px,0) scale(1.03) rotate(1.2deg)`;
  ghost.style.transition = 'none';
  ghost.style.boxShadow = 'var(--shadow-xl)';
  document.body.appendChild(ghost);
  DragState.ghost = ghost;

  // Fade source card
  card.classList.add('dragging');

  // Create persistent drop line
  const dropLine = document.createElement('div');
  dropLine.className = 'drop-line';
  DragState.dropLine = dropLine;
}

function completeDrop(e) {
  const targetCol = DragState.currentCol;

  if (!targetCol) { cancelDrag(); return; }

  const newStatus = targetCol.dataset.col;
  const taskId = DragState.taskId;
  const task = _taskCache.find(t => t.id === taskId);

  // Capture position before cleanup resets DragState
  const capturedIndex = DragState.currentIndex;

  // Spring animation on ghost
  if (DragState.ghost) {
    const targetCards = Array.from(targetCol.querySelectorAll('.task-card:not(.dragging)'));
    const insertIdx = capturedIndex;
    let targetY;

    if (targetCards.length === 0 || insertIdx >= targetCards.length) {
      const cardsContainer = targetCol;
      const r = cardsContainer.getBoundingClientRect();
      targetY = r.bottom - DragState.ghost.offsetHeight - 8;
    } else {
      const r = targetCards[insertIdx].getBoundingClientRect();
      targetY = r.top - 4;
    }

    DragState.ghost.style.transition = 'transform 260ms cubic-bezier(0.175,0.885,0.32,1.275)';
    DragState.ghost.style.transform = `translate3d(${e.clientX - DragState.offsetX}px,${targetY}px,0) scale(1) rotate(0deg)`;
  }

  setTimeout(async () => {
    cleanup();

    if (!task) return;

    // Gather all cards in target column (excluding dragged)
    const cards = Array.from(targetCol.querySelectorAll('.task-card'));
    const insertIdx = Math.min(capturedIndex, cards.length);

    // Build new order for the column
    const colTasks = _taskCache.filter(t => t.status === newStatus && t.id !== taskId);
    colTasks.splice(insertIdx, 0, { ...task, status: newStatus });

    try {
      // Optimistic UI update
      _taskCache = _taskCache.map(t => t.id === taskId ? { ...t, status: newStatus } : t);

      if (task.status !== newStatus) {
        await updateTask(taskId, { status: newStatus, position: insertIdx * 100 });
      }
      await reorderTasks(colTasks);

      // Refresh the board to reflect DB state
      await renderKanban(_projectId, _filters);
    } catch (err) {
      showToast('Failed to move task', 'error');
      await renderKanban(_projectId, _filters);
    }
  }, 280);
}

function cancelDrag() {
  cleanup();
}

function cleanup() {
  // Remove ghost
  if (DragState.ghost) {
    DragState.ghost.remove();
    DragState.ghost = null;
  }

  // Restore source card
  if (DragState.taskEl) {
    DragState.taskEl.classList.remove('dragging');
    DragState.taskEl.removeEventListener('pointermove', onPointerMove);
    DragState.taskEl = null;
  }

  // Remove drop line
  if (DragState.dropLine) {
    DragState.dropLine.remove();
    DragState.dropLine = null;
  }

  // Remove column highlights
  document.querySelectorAll('.kanban-column.drag-over').forEach(c => c.classList.remove('drag-over'));
  document.querySelectorAll('.drop-line').forEach(l => l.remove());

  // Cancel auto-scroll
  if (DragState.scrollRAF) {
    cancelAnimationFrame(DragState.scrollRAF);
    DragState.scrollRAF = null;
  }

  // Reset state
  Object.assign(DragState, {
    phase: 'idle', taskId: null, taskEl: null, ghost: null,
    sourceCol: null, sourceIndex: -1, currentCol: null, currentIndex: -1,
    startX: 0, startY: 0, offsetX: 0, offsetY: 0, dropLine: null
  });
}

// ── Helper: find column at pointer position ───────────────────
function getColumnAtPoint(x, y) {
  const cols = document.querySelectorAll('.kanban-column');
  for (const col of cols) {
    const r = col.getBoundingClientRect();
    if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) {
      return col.querySelector('[data-col]');
    }
  }
  return null;
}

// ── Helper: insert index from Y position ─────────────────────
function getInsertIndex(cards, clientY) {
  for (let i = 0; i < cards.length; i++) {
    const r = cards[i].getBoundingClientRect();
    const mid = r.top + r.height / 2;
    if (clientY < mid) return i;
  }
  return cards.length;
}

// ── Helper: card index in parent ─────────────────────────────
function getCardIndex(card) {
  const parent = card.closest('[data-col]');
  if (!parent) return -1;
  return Array.from(parent.querySelectorAll('.task-card')).indexOf(card);
}

// ── Drop line positioning ─────────────────────────────────────
function positionDropLine(colEl, cards, insertIdx) {
  // Remove existing drop lines
  colEl.querySelectorAll('.drop-line').forEach(l => l.remove());
  document.querySelectorAll('.kanban-column .drop-line').forEach(l => l.remove());

  const line = document.createElement('div');
  line.className = 'drop-line visible';
  line.style.cssText = 'height:2px;background:var(--accent);border-radius:2px;box-shadow:0 0 8px var(--accent);margin:2px 0;pointer-events:none';

  if (insertIdx >= cards.length) {
    colEl.appendChild(line);
  } else {
    colEl.insertBefore(line, cards[insertIdx]);
  }
}

// ── Auto-scroll ───────────────────────────────────────────────
function autoScrollColumn(x, y) {
  if (DragState.scrollRAF) cancelAnimationFrame(DragState.scrollRAF);

  const col = DragState.currentCol;
  if (!col) return;

  DragState.scrollRAF = requestAnimationFrame(() => {
    const r = col.getBoundingClientRect();
    const edgeSize = 60;
    const speed = 8;

    if (y < r.top + edgeSize) {
      col.scrollTop -= speed * (1 - (y - r.top) / edgeSize);
    } else if (y > r.bottom - edgeSize) {
      col.scrollTop += speed * (1 - (r.bottom - y) / edgeSize);
    }
  });
}

// ── Refresh board in place ────────────────────────────────────
export async function refreshKanban(appState = {}) {
  if (appState.currentProjectId) {
    await renderKanban(appState.currentProjectId, _filters, appState);
  }
}
