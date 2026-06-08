-- Quick issue capture needs Backlog to be a valid task status.
-- Safe to run more than once.

DO $$ BEGIN
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
  ALTER TABLE tasks ADD CONSTRAINT tasks_status_check
    CHECK (status IN ('backlog','todo','in_progress','in_review','done','blocked'));
END $$;
