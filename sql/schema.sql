-- Run this entire file in Supabase SQL Editor
-- DevTrack full schema — safe to re-run (IF NOT EXISTS + DO $$ blocks)

-- ============================================================
-- 1. CORE TABLES (create if missing)
-- ============================================================

-- profiles
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_color text DEFAULT '#4f8eff',
  theme       text DEFAULT 'dark' CHECK (theme IN ('dark','light')),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_self" ON profiles;
CREATE POLICY "profiles_self" ON profiles
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- projects
CREATE TABLE IF NOT EXISTS projects (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name             text NOT NULL,
  description      text DEFAULT '',
  stack            text DEFAULT '',
  color            text DEFAULT '#4f8eff',
  status           text DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  join_code        char(6) UNIQUE,
  decision_log     text DEFAULT '',
  where_i_left_off text DEFAULT '',
  today_focus      uuid[] DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "projects_owner" ON projects;
DROP POLICY IF EXISTS "projects_member_read" ON projects;
DROP POLICY IF EXISTS "projects_member_update" ON projects;
DROP POLICY IF EXISTS "projects_select" ON projects;
DROP POLICY IF EXISTS "projects_insert" ON projects;
DROP POLICY IF EXISTS "projects_update" ON projects;
DROP POLICY IF EXISTS "projects_delete" ON projects;
-- Single SELECT policy: owner or member (no self-referencing recursion)
CREATE POLICY "projects_select" ON projects FOR SELECT
  USING (auth.uid() = user_id OR id IN (
    SELECT project_id FROM project_members WHERE user_id = auth.uid()
  ));
CREATE POLICY "projects_insert" ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "projects_update" ON projects FOR UPDATE
  USING (auth.uid() = user_id);
CREATE POLICY "projects_delete" ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- tasks (create if your existing system doesn't have it yet)
CREATE TABLE IF NOT EXISTS tasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title       text NOT NULL,
  description text DEFAULT '',
  task_type   text DEFAULT 'feature' CHECK (task_type IN ('feature','bug','chore','research','design')),
  status      text DEFAULT 'todo' CHECK (status IN ('todo','in_progress','in_review','done','blocked')),
  priority    text DEFAULT 'medium' CHECK (priority IN ('critical','high','medium','low')),
  tags        text[] DEFAULT '{}',
  archived    boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_project_access" ON tasks;
CREATE POLICY "tasks_project_access" ON tasks
  USING (
    user_id = auth.uid() OR
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()) OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() OR
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- ============================================================
-- 2. ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================================

-- Add new columns to projects (if table already existed without them)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='join_code') THEN
    ALTER TABLE projects ADD COLUMN join_code char(6) UNIQUE;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='decision_log') THEN
    ALTER TABLE projects ADD COLUMN decision_log text DEFAULT '';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='where_i_left_off') THEN
    ALTER TABLE projects ADD COLUMN where_i_left_off text DEFAULT '';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='projects' AND column_name='today_focus') THEN
    ALTER TABLE projects ADD COLUMN today_focus uuid[] DEFAULT '{}';
  END IF;
END $$;

-- Ensure tasks table has RLS enabled and a working policy
-- (safe if already set — DROP POLICY IF EXISTS handles duplicates)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tasks_project_access" ON tasks;
CREATE POLICY "tasks_project_access" ON tasks
  USING (
    user_id = auth.uid() OR
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid()) OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid() OR
    project_id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())
  );

-- Add new columns to existing tasks table
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='assignees') THEN
    ALTER TABLE tasks ADD COLUMN assignees uuid[] DEFAULT '{}';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='due_date') THEN
    ALTER TABLE tasks ADD COLUMN due_date date;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='is_blocker') THEN
    ALTER TABLE tasks ADD COLUMN is_blocker boolean DEFAULT false;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='github_url') THEN
    ALTER TABLE tasks ADD COLUMN github_url text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='milestone_id') THEN
    ALTER TABLE tasks ADD COLUMN milestone_id uuid;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='sprint_id') THEN
    ALTER TABLE tasks ADD COLUMN sprint_id uuid;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='position') THEN
    ALTER TABLE tasks ADD COLUMN position integer DEFAULT 0;
  END IF;
END $$;
-- Bug template fields stored in jsonb bugs column
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='bug_fields') THEN
    ALTER TABLE tasks ADD COLUMN bug_fields jsonb DEFAULT '{}';
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='notes') THEN
    ALTER TABLE tasks ADD COLUMN notes text;
  END IF;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tasks' AND column_name='prompt') THEN
    ALTER TABLE tasks ADD COLUMN prompt text;
  END IF;
END $$;

-- ============================================================
-- 3. SUPPORTING TABLES
-- ============================================================

-- project_members: collaboration join codes
CREATE TABLE IF NOT EXISTS project_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        text NOT NULL DEFAULT 'member' CHECK (role IN ('owner','member')),
  joined_at   timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "members_visible_to_project_members" ON project_members;
DROP POLICY IF EXISTS "members_insert_self" ON project_members;
DROP POLICY IF EXISTS "members_delete_owner" ON project_members;
DROP POLICY IF EXISTS "members_select" ON project_members;
DROP POLICY IF EXISTS "members_insert" ON project_members;
DROP POLICY IF EXISTS "members_delete" ON project_members;
-- No self-reference: visible if you are the member OR you own the project
CREATE POLICY "members_select" ON project_members FOR SELECT
  USING (
    user_id = auth.uid() OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );
CREATE POLICY "members_insert" ON project_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "members_delete" ON project_members FOR DELETE
  USING (
    user_id = auth.uid() OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- milestones
CREATE TABLE IF NOT EXISTS milestones (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        text NOT NULL,
  due_date    date,
  color       text DEFAULT '#4f8eff',
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "milestones_project_members" ON milestones;
CREATE POLICY "milestones_project_members" ON milestones
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ) OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- sprints
CREATE TABLE IF NOT EXISTS sprints (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name        text NOT NULL,
  start_date  date,
  end_date    date,
  status      text DEFAULT 'planned' CHECK (status IN ('planned','active','completed')),
  created_by  uuid REFERENCES auth.users(id),
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE sprints ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sprints_project_members" ON sprints;
CREATE POLICY "sprints_project_members" ON sprints
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ) OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- checklists (per task)
CREATE TABLE IF NOT EXISTS checklist_items (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  text        text NOT NULL,
  done        boolean DEFAULT false,
  position    integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "checklist_task_owner" ON checklist_items;
CREATE POLICY "checklist_task_owner" ON checklist_items
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
      UNION
      SELECT t.id FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = auth.uid()
    )
  );

-- subtasks
CREATE TABLE IF NOT EXISTS subtasks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title       text NOT NULL,
  status      text DEFAULT 'todo' CHECK (status IN ('todo','in_progress','done')),
  tag         text CHECK (tag IN ('Frontend','Backend','Design',NULL)),
  assignee    uuid REFERENCES auth.users(id),
  position    integer DEFAULT 0,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE subtasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subtasks_task_owner" ON subtasks;
CREATE POLICY "subtasks_task_owner" ON subtasks
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
      UNION
      SELECT t.id FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = auth.uid()
    )
  );

-- comments (threaded)
CREATE TABLE IF NOT EXISTS comments (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES comments(id) ON DELETE CASCADE,
  body        text NOT NULL,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "comments_project_members" ON comments;
CREATE POLICY "comments_project_members" ON comments
  USING (
    task_id IN (
      SELECT id FROM tasks WHERE user_id = auth.uid()
      UNION
      SELECT t.id FROM tasks t
      JOIN project_members pm ON pm.project_id = t.project_id AND pm.user_id = auth.uid()
    )
  )
  WITH CHECK (user_id = auth.uid());

-- activity log
CREATE TABLE IF NOT EXISTS activity (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id     uuid REFERENCES tasks(id) ON DELETE SET NULL,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action      text NOT NULL,
  meta        jsonb DEFAULT '{}',
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "activity_project_members" ON activity;
CREATE POLICY "activity_project_members" ON activity
  USING (
    project_id IN (
      SELECT project_id FROM project_members WHERE user_id = auth.uid()
    ) OR
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id     uuid REFERENCES tasks(id) ON DELETE SET NULL,
  type        text NOT NULL,
  message     text NOT NULL,
  read        boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "notifications_self" ON notifications;
CREATE POLICY "notifications_self" ON notifications
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================================
-- 4. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_tasks_project_id     ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id        ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status         ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date       ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_milestone_id   ON tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id      ON tasks(sprint_id);
CREATE INDEX IF NOT EXISTS idx_tasks_position       ON tasks(project_id, status, position);

CREATE INDEX IF NOT EXISTS idx_project_members_project ON project_members(project_id);
CREATE INDEX IF NOT EXISTS idx_project_members_user    ON project_members(user_id);

CREATE INDEX IF NOT EXISTS idx_milestones_project   ON milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_sprints_project      ON sprints(project_id);

CREATE INDEX IF NOT EXISTS idx_checklist_task       ON checklist_items(task_id);
CREATE INDEX IF NOT EXISTS idx_subtasks_task        ON subtasks(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_task        ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_activity_project     ON activity(project_id);
CREATE INDEX IF NOT EXISTS idx_activity_task        ON activity(task_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id, read);

-- ============================================================
-- 5. HELPER FUNCTIONS & TRIGGERS
-- ============================================================

CREATE OR REPLACE FUNCTION generate_join_code()
RETURNS char(6) LANGUAGE plpgsql AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code  char(6) := '';
  i     int;
BEGIN
  FOR i IN 1..6 LOOP
    code := code || substr(chars, floor(random() * length(chars))::int + 1, 1);
  END LOOP;
  RETURN code;
END;
$$;

-- Auto-create profile row on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, display_name)
  VALUES (NEW.id, split_part(NEW.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
