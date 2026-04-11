# DevTrack — Project Intelligence File
> Claude Code reads this first before touching anything.

## Stack
- Frontend: Vanilla HTML / CSS / JS (no framework, no bundler)
- Backend: Supabase (Postgres + Auth + RLS)
- Hosting: Vercel (static, auto-deploy from GitHub)
- Repo: connected via VS Code GitHub extension

## Supabase Credentials
SUPABASE_URL=https://vccpdyhxmfzgvgpqfzgm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjY3BkeWh4bWZ6Z3ZncHFmemdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDI1NjIsImV4cCI6MjA5MDk3ODU2Mn0.HzDXgkU-UIg0F35BLvhYfaen9vdGOl0oNBSM5NiZq3A

## Current Database Schema (what already exists in Supabase)
- projects: id (uuid), user_id (uuid), name, description, stack, status, color, created_at
- tasks: id (uuid), user_id (uuid), project_id (uuid), title, task_type, status, priority, description, prompt, tags (text[]), notes (jsonb), archived (bool), created_at, updated_at
- RLS enabled on both tables: users see only their own rows via auth.uid() = user_id

## File Structure To Build
devtrack/
├── index.html
├── PROJECT.md (this file)
├── css/
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   └── responsive.css
├── js/
│   ├── supabase.js
│   ├── auth.js
│   ├── projects.js
│   ├── tasks.js
│   ├── kanban.js
│   ├── views.js
│   ├── collaboration.js
│   ├── ui.js
│   └── app.js
└── sql/
    └── schema.sql

## Design System
- Font: IBM Plex Mono (headings, badges, code), IBM Plex Sans (body)
- Dark bg: #0e0e0f, surface: #141415, elevated: #1a1a1c
- Accent blue: #4f8eff, green: #3ecf8e, red: #f05151, amber: #f0a030
- Border: #2a2a2d, radius: 6px / 10px
- CDN for Supabase: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2

## Features To Build (full list)
### Auth & Profile
- Login / signup screen (already working, keep same design)
- Profile page from topbar avatar: display name, initials avatar with color picker, change email/password, account created date
- Light/dark mode toggle in topbar, respects system preference on first load, preference saved to profiles table in Supabase

### Collaboration
- 6-char join code per project (owner generates, partner enters)
- project_members table: project_id, user_id, role (owner/member)
- Both members CRUD tasks, only owner deletes project
- Role badge shown in UI

### Task Cards
- Creator avatar (initials + color) on every card
- Assignee avatars on card (max 3 shown, then +N)
- Due date badge — overdue = red left border, today = amber left border, this week = blue left border
- Blocker flag — red stripe, filterable
- Checklist progress bar on card (X/Y done)
- Subtask progress bar on card
- GitHub/GitLab URL badge (clickable)
- Bug template: when task_type = Bug, show Steps to reproduce / Expected / Actual / Environment fields

### Views
- Kanban: full rewrite with Pointer Events API drag and drop (smooth, no lag, mobile+desktop)
- Table: existing, keep and improve
- Upcoming: grouped Overdue / Today / This week / No date
- Roadmap: horizontal timeline, milestones as markers, tasks as horizontal bars

### Detail Panel tabs
- Overview (description, tags, due date, assignees, milestone, sprint, github url)
- Checklist (add items, tick done, progress bar)
- Subtasks (Frontend/Backend/Design tags, own status)
- Comments (threaded, with avatars)
- Activity (log of every change on this task)
- Bug fields tab (only shown when task_type = Bug)

### Project Level Features
- Milestones: name, due date, progress bar, board filter
- Sprints: date range, assign tasks, sprint view, mark complete
- Decision log: freeform markdown notes per project
- "Where I left off": one pinned sticky note per project
- Today's focus strip: pin up to 3 tasks, shown at top of board
- Activity feed: full project log
- Notifications panel: bell icon in topbar, unread count, recent activity

### Keyboard
- Cmd+K command palette: search tasks, create task, switch project, move task

### Drag and Drop (critical — must be enterprise quality)
- Use Pointer Events API (pointerdown, pointermove, pointerup) NOT HTML5 drag events
- Hardware-accelerated ghost element (transform: translate3d, will-change: transform)
- Auto-scroll columns when dragging near top/bottom edge
- Spring animation on card drop (cubic-bezier settle)
- Position-aware drop line between cards (not full column highlight)
- Zero lag, zero flicker, works identically on touch and mouse
- Clean state machine: idle → dragging → dropped/cancelled

## SQL Output Requirement
Claude Code must create sql/schema.sql containing:
- All ALTER TABLE statements for existing tables (add new columns)
- All CREATE TABLE statements for new tables
- All RLS policies
- All indexes
- A comment at the top saying "Run this entire file in Supabase SQL Editor"
- Must be safe to run (use IF NOT EXISTS, DO $$ blocks for column adds)

## Deployment Notes
- No build step. Vercel serves static files directly.
- All JS files loaded as modules via <script type="module"> in index.html
- Supabase credentials live in js/supabase.js (hardcoded, this is a personal tool)
- No .env files needed

## Current Live URL
Deployed on Vercel — auto deploys on every push to main branch.