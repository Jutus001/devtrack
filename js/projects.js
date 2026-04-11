// DevTrack — projects.js
// Project CRUD, join codes, members, milestones, sprints

import {
  getProjects, createProject, updateProject, deleteProject,
  joinProjectByCode, getProjectMembers, removeProjectMember,
  getMilestones, createMilestone, updateMilestone, deleteMilestone,
  getSprints, createSprint, updateSprint, deleteSprint,
  getProfiles, logActivity
} from './supabase.js';
import { showToast, openModal, closeModal, confirm } from './ui.js';
import { initials } from './auth.js';

// ── Project list (sidebar) ───────────────────────────────────
export async function loadProjectsSidebar() {
  try {
    const projects = await getProjects();
    // We update AppState in app.js after calling this
    renderProjectsSidebar(projects);
    return projects;
  } catch (err) {
    showToast('Failed to load projects', 'error');
    return [];
  }
}

export function renderProjectsSidebar(projects) {
  const container = document.getElementById('projects-list');
  if (!container) return;

  if (projects.length === 0) {
    container.innerHTML = `
      <div style="padding:8px 12px;font-size:12px;color:var(--text-dim)">No projects yet</div>`;
    return;
  }

  container.innerHTML = projects.map(p => `
    <div class="sidebar-item project-item" data-project-id="${p.id}" title="${p.name}">
      <span class="project-dot" style="background:${p.color || '#4f8eff'}"></span>
      <span class="sidebar-label">${escHtml(p.name)}</span>
      ${p._role === 'member' ? `<span class="badge badge-default" style="font-size:9px;padding:1px 5px;margin-left:auto">member</span>` : ''}
      <button class="project-menu-btn" data-project-id="${p.id}" title="Project settings" tabindex="-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="5" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="19" r="1" fill="currentColor"/>
        </svg>
      </button>
    </div>
  `).join('');

  container.querySelectorAll('.project-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.project-menu-btn')) return;
      const id = el.dataset.projectId;
      import('./app.js').then(m => m.switchProject(id));
    });
  });

  container.querySelectorAll('.project-menu-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.projectId;
      const project = projects.find(p => p.id === id);
      if (project) openProjectContextMenu(btn, project);
    });
  });
}

function openProjectContextMenu(anchor, project) {
  // Remove any existing menu
  document.getElementById('project-ctx-menu')?.remove();

  const isOwner = project._role === 'owner';
  const menu = document.createElement('div');
  menu.id = 'project-ctx-menu';
  menu.style.cssText = `
    position:fixed;z-index:2000;background:var(--surface);border:1px solid var(--border);
    border-radius:var(--r2);box-shadow:var(--shadow-xl);padding:4px;min-width:170px;
    font-size:13px;
  `;

  const items = [
    { label: 'Members & Invite', icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`, action: 'members' },
    ...(isOwner ? [
      { label: 'Edit Project', icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`, action: 'edit' },
      { label: 'Delete Project', icon: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>`, action: 'delete', danger: true },
    ] : []),
  ];

  menu.innerHTML = items.map(item => `
    <div class="ctx-menu-item${item.danger ? ' ctx-menu-danger' : ''}" data-action="${item.action}"
         style="display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:var(--r1);cursor:pointer;color:${item.danger ? 'var(--red)' : 'var(--text)'};transition:background var(--t-fast)">
      ${item.icon}
      ${item.label}
    </div>
  `).join('');

  document.body.appendChild(menu);

  // Position near anchor
  const rect = anchor.getBoundingClientRect();
  const menuW = 170;
  let left = rect.right + 4;
  if (left + menuW > window.innerWidth - 8) left = rect.left - menuW - 4;
  menu.style.left = `${left}px`;
  menu.style.top = `${Math.min(rect.top, window.innerHeight - menu.offsetHeight - 8)}px`;

  // Hover styles
  menu.querySelectorAll('.ctx-menu-item').forEach(item => {
    item.addEventListener('mouseenter', () => item.style.background = 'var(--elevated)');
    item.addEventListener('mouseleave', () => item.style.background = '');
  });

  // Action handlers
  menu.addEventListener('click', e => {
    const item = e.target.closest('[data-action]');
    if (!item) return;
    closeMenu();
    const action = item.dataset.action;
    if (action === 'members') openMembersModal(project);
    if (action === 'edit')    openEditProjectModal(project);
    if (action === 'delete')  import('./projects.js').then(m => m.deleteProjectWithConfirm(project));
  });

  // Close on outside click
  const closeMenu = () => {
    menu.remove();
    document.removeEventListener('click', outsideHandler, true);
  };
  const outsideHandler = e => {
    if (!menu.contains(e.target)) closeMenu();
  };
  setTimeout(() => document.addEventListener('click', outsideHandler, true), 0);
}

// ── Create project modal ─────────────────────────────────────
export function openCreateProjectModal() {
  const PROJECT_COLORS = ['#4f8eff','#3ecf8e','#f05151','#f0a030','#a855f7','#ec4899','#06b6d4','#84cc16'];
  let selectedColor = PROJECT_COLORS[0];

  const body = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="form-group">
        <label class="form-label">Project Name *</label>
        <input class="form-input" id="cp-name" placeholder="My Awesome Project" required />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input" id="cp-desc" placeholder="What is this project about?" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Stack / Tags</label>
        <input class="form-input" id="cp-stack" placeholder="React, Node, Postgres…" />
      </div>
      <div class="form-group">
        <label class="form-label">Color</label>
        <div class="color-swatches" id="cp-colors">
          ${PROJECT_COLORS.map((c, i) => `
            <div class="color-swatch ${i === 0 ? 'selected' : ''}" data-color="${c}" style="background:${c}"></div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  openModal({
    id: 'modal-create-project',
    title: 'New Project',
    body,
    size: 'sm',
    primaryLabel: 'Create',
    onPrimary: async () => {
      const name = document.getElementById('cp-name').value.trim();
      if (!name) { showToast('Name is required', 'error'); return false; }
      try {
        const project = await createProject({
          name,
          description: document.getElementById('cp-desc').value.trim(),
          stack: document.getElementById('cp-stack').value.trim(),
          color: selectedColor,
          status: 'active'
        });
        showToast(`Project "${name}" created`, 'success');
        await loadProjectsSidebar();
        import('./app.js').then(m => m.switchProject(project.id));
        return true;
      } catch (err) {
        showToast(err.message, 'error');
        return false;
      }
    }
  });

  // Color picker
  setTimeout(() => {
    document.querySelectorAll('#cp-colors .color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        document.querySelectorAll('#cp-colors .color-swatch').forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
        selectedColor = sw.dataset.color;
      });
    });
  }, 50);
}

// ── Edit project modal ───────────────────────────────────────
export async function openEditProjectModal(project) {
  const PROJECT_COLORS = ['#4f8eff','#3ecf8e','#f05151','#f0a030','#a855f7','#ec4899','#06b6d4','#84cc16'];
  let selectedColor = project.color || '#4f8eff';

  const body = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <div class="form-group">
        <label class="form-label">Project Name *</label>
        <input class="form-input" id="ep-name" value="${escHtml(project.name)}" required />
      </div>
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea class="form-input" id="ep-desc" rows="2">${escHtml(project.description || '')}</textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Stack</label>
        <input class="form-input" id="ep-stack" value="${escHtml(project.stack || '')}" />
      </div>
      <div class="form-group">
        <label class="form-label">Status</label>
        <select class="form-input form-select" id="ep-status">
          ${['active','paused','archived'].map(s =>
            `<option value="${s}" ${project.status === s ? 'selected' : ''}>${capitalize(s)}</option>`
          ).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Color</label>
        <div class="color-swatches" id="ep-colors">
          ${PROJECT_COLORS.map(c => `
            <div class="color-swatch ${selectedColor === c ? 'selected' : ''}" data-color="${c}" style="background:${c}"></div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  openModal({
    id: 'modal-edit-project',
    title: 'Edit Project',
    body,
    size: 'sm',
    primaryLabel: 'Save',
    onPrimary: async () => {
      const name = document.getElementById('ep-name').value.trim();
      if (!name) { showToast('Name required', 'error'); return false; }
      try {
        await updateProject(project.id, {
          name,
          description: document.getElementById('ep-desc').value.trim(),
          stack: document.getElementById('ep-stack').value.trim(),
          status: document.getElementById('ep-status').value,
          color: selectedColor
        });
        showToast('Project updated', 'success');
        await loadProjectsSidebar();
        import('./app.js').then(m => m.refreshCurrentView());
        return true;
      } catch (err) { showToast(err.message, 'error'); return false; }
    }
  });

  setTimeout(() => {
    document.querySelectorAll('#ep-colors .color-swatch').forEach(sw => {
      sw.addEventListener('click', () => {
        document.querySelectorAll('#ep-colors .color-swatch').forEach(s => s.classList.remove('selected'));
        sw.classList.add('selected');
        selectedColor = sw.dataset.color;
      });
    });
  }, 50);
}

// ── Delete project ───────────────────────────────────────────
export async function deleteProjectWithConfirm(project) {
  const ok = await confirm(
    `Delete "${project.name}"?`,
    'This will permanently delete the project and all its tasks. This cannot be undone.'
  );
  if (!ok) return;
  try {
    await deleteProject(project.id);
    showToast('Project deleted', 'success');
    await loadProjectsSidebar();
    import('./app.js').then(m => m.showDashboard());
  } catch (err) { showToast(err.message, 'error'); }
}

// ── Join project modal ───────────────────────────────────────
export function openJoinProjectModal(prefillCode = '') {
  openModal({
    id: 'modal-join-project',
    title: 'Join a Project',
    body: `
      <div style="display:flex;flex-direction:column;gap:12px">
        <p style="font-size:13px;color:var(--text-muted)">
          Enter the 6-character invite code, or open an invite link sent by the project owner.
        </p>
        <div class="form-group">
          <label class="form-label">Join Code</label>
          <input class="form-input" id="jc-code"
            placeholder="ABC123"
            value="${escHtml(prefillCode.toUpperCase())}"
            style="font-family:var(--font-mono);font-size:18px;text-align:center;letter-spacing:4px;text-transform:uppercase"
            maxlength="6" />
        </div>
      </div>
    `,
    size: 'sm',
    primaryLabel: 'Join',
    onPrimary: async () => {
      const code = document.getElementById('jc-code').value.trim();
      if (code.length !== 6) { showToast('Enter a 6-character code', 'error'); return false; }
      try {
        const project = await joinProjectByCode(code);
        showToast(`Joined "${project.name}"`, 'success');
        await loadProjectsSidebar();
        import('./app.js').then(m => m.switchProject(project.id));
        return true;
      } catch (err) { showToast(err.message, 'error'); return false; }
    }
  });
  setTimeout(() => {
    const input = document.getElementById('jc-code');
    if (input) input.focus();
  }, 100);
}

// ── Members panel ────────────────────────────────────────────
export async function openMembersModal(project) {
  const members = await getProjectMembers(project.id);
  const profiles = await getProfiles(members.map(m => m.user_id));
  const profileMap = Object.fromEntries(profiles.map(p => [p.id, p]));
  const { data: { user: currentUser } } = await import('./supabase.js').then(m => m.supabase.auth.getUser());
  const isOwner = project._role === 'owner' || project.user_id === currentUser?.id;

  const membersHtml = members.map(m => {
    const p = profileMap[m.user_id] || {};
    const name = p.display_name || 'Unknown';
    const color = p.avatar_color || '#4f8eff';
    return `
      <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid var(--border)">
        <div class="avatar avatar-sm" style="background:${color};color:#fff">${initials(name)}</div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:500">${escHtml(name)}</div>
          <div style="font-size:10px;color:var(--text-dim);font-family:var(--font-mono)">${m.role}</div>
        </div>
        ${isOwner && m.role !== 'owner' ? `
          <button class="btn btn-ghost btn-sm" style="color:var(--red)" data-remove="${m.user_id}">
            Remove
          </button>
        ` : ''}
      </div>
    `;
  }).join('');

  const inviteLink = project.join_code
    ? (window.location.origin + window.location.pathname + '?join=' + project.join_code)
    : '';

  const codeSection = isOwner ? `
    <div style="margin-top:16px;padding:14px;background:var(--elevated);border-radius:var(--r2);border:1px solid var(--border)">
      <div style="font-size:11px;font-family:var(--font-mono);color:var(--text-dim);margin-bottom:8px;text-transform:uppercase;letter-spacing:.06em">Invite to Project</div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
        <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;letter-spacing:6px;color:var(--text);flex:1">${project.join_code || '------'}</div>
        <button class="btn btn-ghost btn-sm" id="copy-join-code" title="Copy 6-character code">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          Copy Code
        </button>
      </div>
      <div style="border-top:1px solid var(--border);padding-top:10px">
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-family:var(--font-mono)">${inviteLink}</div>
        <button class="btn btn-primary btn-sm" id="copy-invite-link" style="width:100%">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
          Copy Invite Link
        </button>
      </div>
      <div style="font-size:11px;color:var(--text-dim);margin-top:6px">Anyone with the link or code can join this project</div>
    </div>
  ` : '';

  openModal({
    id: 'modal-members',
    title: `Members — ${project.name}`,
    body: `<div>${membersHtml}</div>${codeSection}`,
    size: 'sm'
  });

  setTimeout(() => {
    document.querySelectorAll('[data-remove]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const uid = btn.dataset.remove;
        await removeProjectMember(project.id, uid);
        showToast('Member removed', 'success');
        closeModal('modal-members');
        openMembersModal(project);
      });
    });
    const copyBtn = document.getElementById('copy-join-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(project.join_code || '');
        showToast('Code copied!', 'success');
      });
    }
    const linkBtn = document.getElementById('copy-invite-link');
    if (linkBtn) {
      linkBtn.addEventListener('click', () => {
        navigator.clipboard.writeText(inviteLink);
        linkBtn.textContent = 'Link Copied!';
        setTimeout(() => {
          linkBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg> Copy Invite Link`;
        }, 2000);
        showToast('Invite link copied!', 'success');
      });
    }
  }, 50);
}

// ── Milestones ───────────────────────────────────────────────
export async function openMilestonesModal(projectId) {
  const milestones = await getMilestones(projectId);

  const listHtml = milestones.length === 0
    ? `<div style="font-size:13px;color:var(--text-dim);text-align:center;padding:24px">No milestones yet</div>`
    : milestones.map(m => `
      <div class="milestone-card" style="border-left:3px solid ${m.color || '#4f8eff'}">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div class="milestone-name">${escHtml(m.name)}</div>
          <button class="btn btn-ghost btn-sm" data-delete-milestone="${m.id}" style="color:var(--red)">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6m4-6v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
          </button>
        </div>
        ${m.due_date ? `<div style="font-size:11px;color:var(--text-dim);font-family:var(--font-mono);margin-top:4px">Due: ${m.due_date}</div>` : ''}
      </div>
    `).join('');

  openModal({
    id: 'modal-milestones',
    title: 'Milestones',
    body: `
      <div id="milestones-list" style="margin-bottom:16px">${listHtml}</div>
      <div style="border-top:1px solid var(--border);padding-top:16px">
        <div style="font-size:12px;font-weight:600;margin-bottom:10px;font-family:var(--font-mono)">Add Milestone</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <input class="form-input" id="ms-name" placeholder="Milestone name" />
          <input class="form-input" id="ms-date" type="date" />
          <button class="btn btn-primary btn-sm" id="ms-add">Add Milestone</button>
        </div>
      </div>
    `,
    size: 'sm'
  });

  setTimeout(() => {
    document.querySelectorAll('[data-delete-milestone]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await deleteMilestone(btn.dataset.deleteMilestone);
        showToast('Milestone deleted', 'success');
        closeModal('modal-milestones');
        openMilestonesModal(projectId);
      });
    });
    document.getElementById('ms-add')?.addEventListener('click', async () => {
      const name = document.getElementById('ms-name').value.trim();
      if (!name) return;
      await createMilestone(projectId, {
        name,
        due_date: document.getElementById('ms-date').value || null
      });
      showToast('Milestone added', 'success');
      closeModal('modal-milestones');
      openMilestonesModal(projectId);
    });
  }, 50);
}

// ── Sprints ──────────────────────────────────────────────────
export async function openSprintsModal(projectId) {
  const sprints = await getSprints(projectId);

  const listHtml = sprints.length === 0
    ? `<div style="font-size:13px;color:var(--text-dim);text-align:center;padding:24px">No sprints yet</div>`
    : sprints.map(s => `
      <div class="sprint-card">
        <div style="display:flex;align-items:center;justify-content:space-between">
          <div class="sprint-name">${escHtml(s.name)}</div>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="badge ${s.status === 'active' ? 'badge-green' : s.status === 'completed' ? 'badge-default' : 'badge-accent'}">${s.status}</span>
            <button class="btn btn-ghost btn-sm" data-delete-sprint="${s.id}" style="color:var(--red)">✕</button>
          </div>
        </div>
        ${s.start_date ? `<div style="font-size:11px;color:var(--text-dim);font-family:var(--font-mono);margin-top:4px">${s.start_date} → ${s.end_date || '?'}</div>` : ''}
      </div>
    `).join('');

  openModal({
    id: 'modal-sprints',
    title: 'Sprints',
    body: `
      <div id="sprints-list" style="margin-bottom:16px">${listHtml}</div>
      <div style="border-top:1px solid var(--border);padding-top:16px">
        <div style="font-size:12px;font-weight:600;margin-bottom:10px;font-family:var(--font-mono)">New Sprint</div>
        <div style="display:flex;flex-direction:column;gap:10px">
          <input class="form-input" id="sp-name" placeholder="Sprint name" />
          <div style="display:flex;gap:8px">
            <input class="form-input" id="sp-start" type="date" style="flex:1" />
            <input class="form-input" id="sp-end" type="date" style="flex:1" />
          </div>
          <button class="btn btn-primary btn-sm" id="sp-add">Add Sprint</button>
        </div>
      </div>
    `,
    size: 'sm'
  });

  setTimeout(() => {
    document.querySelectorAll('[data-delete-sprint]').forEach(btn => {
      btn.addEventListener('click', async () => {
        await deleteSprint(btn.dataset.deleteSprint);
        showToast('Sprint deleted', 'success');
        closeModal('modal-sprints');
        openSprintsModal(projectId);
      });
    });
    document.getElementById('sp-add')?.addEventListener('click', async () => {
      const name = document.getElementById('sp-name').value.trim();
      if (!name) return;
      await createSprint(projectId, {
        name,
        start_date: document.getElementById('sp-start').value || null,
        end_date: document.getElementById('sp-end').value || null
      });
      showToast('Sprint added', 'success');
      closeModal('modal-sprints');
      openSprintsModal(projectId);
    });
  }, 50);
}

// ── Utilities ────────────────────────────────────────────────
export function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function capitalize(s) {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
