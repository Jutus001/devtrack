// DevTrack — supabase.js
// Supabase client init + all database helper functions

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL  = 'https://vccpdyhxmfzgvgpqfzgm.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjY3BkeWh4bWZ6Z3ZncHFmemdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDI1NjIsImV4cCI6MjA5MDk3ODU2Mn0.HzDXgkU-UIg0F35BLvhYfaen9vdGOl0oNBSM5NiZq3A';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Current user helper ──────────────────────────────────────
export const getUser = () => supabase.auth.getUser().then(r => r.data.user);

// ══════════════════════════════════════════════════════════════
// PROFILES
// ══════════════════════════════════════════════════════════════
export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function upsertProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates }, { onConflict: 'id' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// Fetch multiple profiles by id array (for avatars)
export async function getProfiles(ids) {
  if (!ids || ids.length === 0) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_color')
    .in('id', ids);
  if (error) throw error;
  return data || [];
}

// ══════════════════════════════════════════════════════════════
// PROJECTS
// ══════════════════════════════════════════════════════════════
export async function getProjects() {
  const user = await getUser();
  if (!user) return [];

  // Get owned projects
  const { data: owned, error: e1 } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (e1) { console.error('[DevTrack] projects query failed:', e1.message, e1); throw e1; }

  // Get joined projects
  const { data: memberRows, error: e2 } = await supabase
    .from('project_members')
    .select('project_id, role')
    .eq('user_id', user.id);
  if (e2) { console.error('[DevTrack] project_members query failed:', e2.message, e2); throw e2; }

  let joined = [];
  if (memberRows && memberRows.length > 0) {
    const ids = memberRows.map(r => r.project_id);
    const { data: jp, error: e3 } = await supabase
      .from('projects')
      .select('*')
      .in('id', ids)
      .neq('user_id', user.id);
    if (e3) throw e3;
    joined = (jp || []).map(p => ({
      ...p,
      _role: (memberRows.find(r => r.project_id === p.id) || {}).role || 'member'
    }));
  }

  const ownedWithRole = (owned || []).map(p => ({ ...p, _role: 'owner' }));
  return [...ownedWithRole, ...joined];
}

export async function getProject(id) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createProject(fields) {
  const user = await getUser();
  const joinCode = generateCode();
  const { data, error } = await supabase
    .from('projects')
    .insert({ ...fields, user_id: user.id, join_code: joinCode })
    .select()
    .single();
  if (error) throw error;
  // Add owner to project_members
  await supabase.from('project_members').insert({
    project_id: data.id, user_id: user.id, role: 'owner'
  });
  return data;
}

export async function updateProject(id, fields) {
  const { data, error } = await supabase
    .from('projects')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

export async function joinProjectByCode(code) {
  // Uses a SECURITY DEFINER RPC to bypass RLS — the joiner isn't a member yet
  // so a direct table query would be blocked.
  const { data, error } = await supabase.rpc('join_project_by_code', {
    p_code: code.toUpperCase()
  });
  if (error) throw new Error(error.message || 'Invalid join code');
  if (!data) throw new Error('Invalid join code');
  return data;
}

export async function getProjectMembers(projectId) {
  const { data, error } = await supabase
    .from('project_members')
    .select('id, user_id, role, joined_at')
    .eq('project_id', projectId);
  if (error) throw error;
  return data || [];
}

export async function removeProjectMember(projectId, userId) {
  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', userId);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════
// TASKS
// ══════════════════════════════════════════════════════════════
export async function getTasks(projectId, filters = {}) {
  let q = supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .or('archived.eq.false,archived.is.null')
    .order('position', { ascending: true })
    .order('created_at', { ascending: false });

  if (filters.status)      q = q.eq('status', filters.status);
  if (filters.priority)    q = q.eq('priority', filters.priority);
  if (filters.task_type)   q = q.eq('task_type', filters.task_type);
  if (filters.assignee)    q = q.contains('assignees', [filters.assignee]);
  if (filters.milestone_id) q = q.eq('milestone_id', filters.milestone_id);
  if (filters.sprint_id)   q = q.eq('sprint_id', filters.sprint_id);
  if (filters.is_blocker)  q = q.eq('is_blocker', true);
  if (filters.search)      q = q.ilike('title', `%${filters.search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function getTask(id) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function createTask(fields) {
  const user = await getUser();
  const { data, error } = await supabase
    .from('tasks')
    .insert({ ...fields, user_id: user.id })
    .select()
    .single();
  if (error) throw error;
  await logActivity(fields.project_id, data.id, 'task_created', { title: data.title });
  return data;
}

export async function updateTask(id, fields) {
  const { data, error } = await supabase
    .from('tasks')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTask(id) {
  const task = await getTask(id);
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) throw error;
  if (task) await logActivity(task.project_id, null, 'task_deleted', { title: task.title });
}

export async function archiveTask(id) {
  return updateTask(id, { archived: true });
}

// Reorder tasks in a column (update positions)
export async function reorderTasks(tasks) {
  const updates = tasks.map((t, i) => ({ id: t.id, position: i * 100, status: t.status }));
  const { error } = await supabase.from('tasks').upsert(updates, { onConflict: 'id' });
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════
// CHECKLISTS
// ══════════════════════════════════════════════════════════════
export async function getChecklist(taskId) {
  const { data, error } = await supabase
    .from('checklist_items')
    .select('*')
    .eq('task_id', taskId)
    .order('position');
  if (error) throw error;
  return data || [];
}

export async function addChecklistItem(taskId, text) {
  const { data: existing } = await supabase
    .from('checklist_items')
    .select('position')
    .eq('task_id', taskId)
    .order('position', { ascending: false })
    .limit(1);
  const pos = existing && existing[0] ? existing[0].position + 10 : 0;
  const { data, error } = await supabase
    .from('checklist_items')
    .insert({ task_id: taskId, text, position: pos })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleChecklistItem(id, done) {
  const { data, error } = await supabase
    .from('checklist_items')
    .update({ done })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteChecklistItem(id) {
  const { error } = await supabase.from('checklist_items').delete().eq('id', id);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════
// SUBTASKS
// ══════════════════════════════════════════════════════════════
export async function getSubtasks(taskId) {
  const { data, error } = await supabase
    .from('subtasks')
    .select('*')
    .eq('task_id', taskId)
    .order('position');
  if (error) throw error;
  return data || [];
}

export async function addSubtask(taskId, fields) {
  const { data, error } = await supabase
    .from('subtasks')
    .insert({ task_id: taskId, ...fields })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSubtask(id, fields) {
  const { data, error } = await supabase
    .from('subtasks')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSubtask(id) {
  const { error } = await supabase.from('subtasks').delete().eq('id', id);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════
// COMMENTS
// ══════════════════════════════════════════════════════════════
export async function getComments(taskId) {
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at');
  if (error) throw error;
  return data || [];
}

export async function addComment(taskId, body, parentId = null) {
  const user = await getUser();
  const { data, error } = await supabase
    .from('comments')
    .insert({ task_id: taskId, user_id: user.id, body, parent_id: parentId })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════
// ACTIVITY
// ══════════════════════════════════════════════════════════════
export async function logActivity(projectId, taskId, action, meta = {}) {
  const user = await getUser();
  if (!user) return;
  await supabase.from('activity').insert({
    project_id: projectId,
    task_id: taskId,
    user_id: user.id,
    action,
    meta
  });
}

export async function getActivity(projectId, limit = 50) {
  const { data, error } = await supabase
    .from('activity')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function getTaskActivity(taskId) {
  const { data, error } = await supabase
    .from('activity')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ══════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ══════════════════════════════════════════════════════════════
export async function getNotifications() {
  const user = await getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30);
  if (error) throw error;
  return data || [];
}

export async function markNotificationRead(id) {
  await supabase.from('notifications').update({ read: true }).eq('id', id);
}

export async function markAllNotificationsRead() {
  const user = await getUser();
  if (!user) return;
  await supabase.from('notifications').update({ read: true }).eq('user_id', user.id);
}

export async function addNotification(userId, type, message, projectId = null, taskId = null) {
  await supabase.from('notifications').insert({
    user_id: userId, type, message, project_id: projectId, task_id: taskId
  });
}

// ══════════════════════════════════════════════════════════════
// MILESTONES
// ══════════════════════════════════════════════════════════════
export async function getMilestones(projectId) {
  const { data, error } = await supabase
    .from('milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function createMilestone(projectId, fields) {
  const user = await getUser();
  const { data, error } = await supabase
    .from('milestones')
    .insert({ project_id: projectId, created_by: user.id, ...fields })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMilestone(id, fields) {
  const { data, error } = await supabase
    .from('milestones')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMilestone(id) {
  const { error } = await supabase.from('milestones').delete().eq('id', id);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════
// SPRINTS
// ══════════════════════════════════════════════════════════════
export async function getSprints(projectId) {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', projectId)
    .order('start_date', { ascending: true, nullsFirst: false });
  if (error) throw error;
  return data || [];
}

export async function createSprint(projectId, fields) {
  const user = await getUser();
  const { data, error } = await supabase
    .from('sprints')
    .insert({ project_id: projectId, created_by: user.id, ...fields })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSprint(id, fields) {
  const { data, error } = await supabase
    .from('sprints')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteSprint(id) {
  const { error } = await supabase.from('sprints').delete().eq('id', id);
  if (error) throw error;
}

// ══════════════════════════════════════════════════════════════
// REALTIME SUBSCRIPTIONS
// ══════════════════════════════════════════════════════════════
export function subscribeToTasks(projectId, callback) {
  return supabase
    .channel(`tasks:${projectId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` },
      callback
    )
    .subscribe();
}

export function subscribeToComments(taskId, callback) {
  return supabase
    .channel(`comments:${taskId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'comments', filter: `task_id=eq.${taskId}` },
      callback
    )
    .subscribe();
}

export function subscribeToNotifications(userId, callback) {
  return supabase
    .channel(`notifications:${userId}`)
    .on('postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
      callback
    )
    .subscribe();
}

export function unsubscribe(channel) {
  if (channel) supabase.removeChannel(channel);
}

// ══════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export { generateCode };
