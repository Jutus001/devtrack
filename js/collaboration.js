// DevTrack — collaboration.js
// Task Detail Panel, Comments, Activity Log, Realtime

import { 
  getComments, addComment, deleteComment, 
  getActivity, getTaskActivity,
  getProfiles
} from './supabase.js';
import { showToast } from './ui.js';
import { initials } from './auth.js';
import { escHtml } from './projects.js';

// ── Open Task Detail Panel ───────────────────────────────────
export async function openTaskDetail(task) {
  const panel = document.getElementById('detail-panel');
  if (!panel) return;

  panel.dataset.taskId = task.id;
  panel.innerHTML = `
    <div class="panel-header">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px">
        <div style="font-size:16px;font-weight:600;color:var(--text);line-height:1.4">${escHtml(task.title)}</div>
        <div style="display:flex;gap:8px">
          <button id="btn-pin-task" class="btn btn-ghost btn-icon btn-sm" title="Pin to Today's Focus">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/><polyline points="16.5 9.4 16.5 16.01"/><polyline points="10 12.8 10 19.41"/></svg>
          </button>
          <button class="panel-close-btn" style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:var(--r2);color:var(--text-muted);background:none;border:none;cursor:pointer;transition:background var(--t-fast),color var(--t-fast)" title="Close (Esc)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <span class="badge badge-accent">${task.status}</span>
        <span class="badge badge-default">${task.priority}</span>
        <span class="badge badge-default">${task.task_type}</span>
      </div>
    </div>
    
    <div class="panel-tabs">
      <button class="panel-tab active" data-tab="overview">Overview</button>
      <button class="panel-tab" data-tab="prompt">Prompt</button>
      <button class="panel-tab" data-tab="checklist">Checklist</button>
      <button class="panel-tab" data-tab="subtasks">Subtasks</button>
      <button class="panel-tab" data-tab="comments">Comments</button>
      <button class="panel-tab" data-tab="activity">Activity</button>
    </div>

    <div class="panel-body">
      <div id="panel-tab-overview" class="tab-content active">
        <div class="section">
          <div class="section-label">Description</div>
          <div class="section-text">${escHtml(task.description || 'No description provided.')}</div>
        </div>
        ${task.notes ? `
        <div class="section" style="border-top:1px solid var(--border);padding-top:14px;margin-top:14px">
          <div class="section-label">Notes</div>
          <div class="section-text" style="white-space:pre-wrap">${escHtml(task.notes)}</div>
        </div>
        ` : ''}
        ${task.task_type === 'bug' ? renderBugFields(task.bug_fields) : ''}
      </div>
      <div id="panel-tab-prompt" class="tab-content">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="font-size:11px;font-family:var(--font-mono);font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--accent)">AI Prompt</div>
          ${task.prompt ? `<button id="btn-copy-prompt" class="btn btn-ghost btn-sm" style="font-size:11px;display:flex;align-items:center;gap:5px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            Copy
          </button>` : ''}
        </div>
        ${task.prompt
          ? `<pre style="font-family:var(--font-mono);font-size:12px;line-height:1.65;color:var(--text);background:var(--elevated);border:1px solid var(--border);border-radius:var(--r2);padding:14px;white-space:pre-wrap;word-break:break-word;max-height:60vh;overflow-y:auto;margin:0">${escHtml(task.prompt)}</pre>`
          : `<div class="empty-state" style="padding:40px 0"><p>No prompt added yet.<br>Edit the task to add one.</p></div>`
        }
      </div>
      <div id="panel-tab-checklist" class="tab-content">
        <div id="checklist-list">Loading...</div>
        <div class="input-group" style="margin-top:16px;display:flex;gap:8px">
          <input type="text" id="new-check-text" class="form-input" placeholder="Add item..." />
          <button id="btn-add-check" class="btn btn-primary btn-sm">Add</button>
        </div>
      </div>
      <div id="panel-tab-subtasks" class="tab-content">
        <div id="subtasks-list">Loading...</div>
        <div class="input-group" style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
          <input type="text" id="new-sub-title" class="form-input" placeholder="Subtask title..." />
          <div style="display:flex;gap:8px">
            <select id="new-sub-tag" class="form-input form-select" style="flex:1">
              <option value="">No Tag</option>
              <option value="Frontend">Frontend</option>
              <option value="Backend">Backend</option>
              <option value="Design">Design</option>
            </select>
            <button id="btn-add-sub" class="btn btn-primary btn-sm">Add Subtask</button>
          </div>
        </div>
      </div>
      <div id="panel-tab-comments" class="tab-content">
        <div id="comments-list">Loading...</div>
        <div class="comment-input-area" style="margin-top:16px">
          <textarea id="new-comment-body" class="form-input" rows="3" placeholder="Write a comment..."></textarea>
          <button id="btn-add-comment" class="btn btn-primary btn-sm" style="margin-top:8px">Post Comment</button>
        </div>
      </div>
      <div id="panel-tab-activity" class="tab-content">
        <div id="activity-list">Loading...</div>
      </div>
    </div>
  `;

  panel.classList.add('open');

  // Update mobile nav active state
  import('./app.js').then(m => m.setMobileNavActive('detail'));

  // Wire close
  const closePanel = () => {
    panel.classList.remove('open');
    import('./app.js').then(m => m.setMobileNavActive('board'));
  };
  panel.querySelector('.panel-close-btn').onclick = closePanel;

  // ESC closes the panel
  const escHandler = (e) => { if (e.key === 'Escape') { closePanel(); document.removeEventListener('keydown', escHandler); } };

  document.addEventListener('keydown', escHandler);
  
  panel.querySelector('#btn-pin-task').onclick = async () => {
    const { togglePinTask } = await import('./app.js');
    await togglePinTask(task.id);
  };
  
  const tabs = panel.querySelectorAll('.panel-tab');
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panel.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const tabEl = panel.querySelector(`#panel-tab-${tab.dataset.tab}`);
      if (tabEl) tabEl.classList.add('active');

      if (tab.dataset.tab === 'checklist') loadChecklist(task.id);
      if (tab.dataset.tab === 'subtasks') loadSubtasks(task.id);
      if (tab.dataset.tab === 'comments') loadComments(task.id);
      if (tab.dataset.tab === 'activity') loadActivity(task.id);
    };
  });

  // Copy prompt button
  const copyBtn = panel.querySelector('#btn-copy-prompt');
  if (copyBtn && task.prompt) {
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(task.prompt).then(() => {
        copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        setTimeout(() => {
          copyBtn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copy`;
        }, 2000);
      }).catch(() => showToast('Copy failed', 'error'));
    };
  }

  document.getElementById('btn-add-check').onclick = async () => {
    const text = document.getElementById('new-check-text').value.trim();
    if (!text) return;
    try {
      await import('./supabase.js').then(m => m.addChecklistItem(task.id, text));
      document.getElementById('new-check-text').value = '';
      loadChecklist(task.id);
    } catch (err) { showToast(err.message, 'error'); }
  };

  document.getElementById('btn-add-sub').onclick = async () => {
    const title = document.getElementById('new-sub-title').value.trim();
    const tag = document.getElementById('new-sub-tag').value || null;
    if (!title) return;
    try {
      await import('./supabase.js').then(m => m.addSubtask(task.id, { title, tag }));
      document.getElementById('new-sub-title').value = '';
      loadSubtasks(task.id);
    } catch (err) { showToast(err.message, 'error'); }
  };

  document.getElementById('btn-add-comment').onclick = async () => {
    const body = document.getElementById('new-comment-body').value.trim();
    if (!body) return;
    try {
      await addComment(task.id, body);
      document.getElementById('new-comment-body').value = '';
      loadComments(task.id);
    } catch (err) { showToast(err.message, 'error'); }
  };
}

async function loadChecklist(taskId) {
  const container = document.getElementById('checklist-list');
  try {
    const items = await import('./supabase.js').then(m => m.getChecklist(taskId));
    if (items.length === 0) {
      container.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:20px 0">No checklist items.</div>';
      return;
    }
    container.innerHTML = items.map(item => `
      <div class="checklist-item" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border)">
        <input type="checkbox" ${item.done ? 'checked' : ''} data-id="${item.id}" />
        <span style="${item.done ? 'text-decoration:line-through;color:var(--text-dim)' : ''};font-size:13px">${escHtml(item.text)}</span>
      </div>
    `).join('');

    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.onchange = async () => {
        await import('./supabase.js').then(m => m.toggleChecklistItem(cb.dataset.id, cb.checked));
        loadChecklist(taskId);
      };
    });
  } catch (err) { container.innerHTML = 'Error loading checklist.'; }
}

async function loadSubtasks(taskId) {
  const container = document.getElementById('subtasks-list');
  try {
    const subs = await import('./supabase.js').then(m => m.getSubtasks(taskId));
    if (subs.length === 0) {
      container.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:20px 0">No subtasks.</div>';
      return;
    }
    container.innerHTML = subs.map(s => `
      <div class="subtask-item" style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="badge ${s.status === 'done' ? 'badge-green' : 'badge-default'}">${s.status}</span>
          <span style="font-size:13px">${escHtml(s.title)}</span>
          ${s.tag ? `<span class="tag-pill" style="font-size:10px">${s.tag}</span>` : ''}
        </div>
        <button class="btn btn-ghost btn-sm" data-id="${s.id}" data-action="toggle" title="Toggle done">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </button>
      </div>
    `).join('');

    container.querySelectorAll('[data-action="toggle"]').forEach(btn => {
      btn.onclick = async () => {
        const sub = subs.find(s => s.id === btn.dataset.id);
        const newStatus = sub.status === 'done' ? 'todo' : 'done';
        await import('./supabase.js').then(m => m.updateSubtask(sub.id, { status: newStatus }));
        loadSubtasks(taskId);
      };
    });
  } catch (err) { container.innerHTML = 'Error loading subtasks.'; }
}

function renderBugFields(fields = {}) {
  return `
    <div class="section" style="border-top:1px solid var(--border);padding-top:16px;margin-top:16px">
      <div style="font-size:11px;font-family:var(--font-mono);font-weight:700;color:var(--red);text-transform:uppercase;margin-bottom:12px">Bug Details</div>
      <div class="bug-field"><div class="field-label">Steps</div><div class="field-val">${escHtml(fields.steps || '—')}</div></div>
      <div class="bug-field"><div class="field-label">Expected</div><div class="field-val">${escHtml(fields.expected || '—')}</div></div>
      <div class="bug-field"><div class="field-label">Actual</div><div class="field-val">${escHtml(fields.actual || '—')}</div></div>
      <div class="bug-field"><div class="field-label">Environment</div><div class="field-val">${escHtml(fields.environment || '—')}</div></div>
    </div>
  `;
}

async function loadComments(taskId) {
  const container = document.getElementById('comments-list');
  try {
    const comments = await getComments(taskId);
    if (comments.length === 0) {
      container.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:20px 0">No comments yet.</div>';
      return;
    }
    
    const profiles = await getProfiles(comments.map(c => c.user_id));
    const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

    container.innerHTML = comments.map(c => {
      const p = profileMap[c.user_id] || {};
      return `
        <div class="comment-item" style="margin-bottom:16px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <div class="avatar avatar-xs" style="background:${p.avatar_color || '#4f8eff'};color:#fff">${initials(p.display_name || 'U')}</div>
            <div style="font-size:12px;font-weight:600">${escHtml(p.display_name || 'Unknown')}</div>
            <div style="font-size:10px;color:var(--text-dim)">${new Date(c.created_at).toLocaleString()}</div>
          </div>
          <div style="font-size:13px;color:var(--text);line-height:1.5;padding-left:28px">${escHtml(c.body)}</div>
        </div>
      `;
    }).join('');
  } catch (err) { container.innerHTML = 'Error loading comments.'; }
}

async function loadActivity(taskId) {
  const container = document.getElementById('activity-list');
  try {
    const activity = await getTaskActivity(taskId);
    if (activity.length === 0) {
      container.innerHTML = '<div style="color:var(--text-dim);font-size:13px;padding:20px 0">No activity yet.</div>';
      return;
    }
    
    const profiles = await getProfiles(activity.map(a => a.user_id));
    const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));

    container.innerHTML = activity.map(a => {
      const p = profileMap[a.user_id] || {};
      return `
        <div style="font-size:12px;color:var(--text-dim);margin-bottom:8px">
          <span style="font-weight:600;color:var(--text)">${escHtml(p.display_name || 'User')}</span>
          ${a.action.replace('_', ' ')}
          <span style="font-size:10px;color:var(--text-muted)">${new Date(a.created_at).toLocaleTimeString()}</span>
        </div>
      `;
    }).join('');
  } catch (err) { container.innerHTML = 'Error loading activity.'; }
}
