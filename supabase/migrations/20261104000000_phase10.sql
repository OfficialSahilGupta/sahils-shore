-- ============================================================================
-- Sahil's Shore: Phase 10 Schema Enhancements
-- Adds folder to notes, linked entities to goals, and quality/type to health_logs
-- ============================================================================

-- 1. Notes: Add folder categorization column (defaults to 'General')
alter table if exists public.notes 
  add column if not exists folder text not null default 'General';

-- Index for folder queries
create index if not exists idx_notes_user_folder 
  on public.notes (user_id, folder);

-- 2. Goals: Add linked entity array columns for dynamic progress computation
alter table if exists public.goals 
  add column if not exists linked_task_ids uuid[] not null default '{}'::uuid[],
  add column if not exists linked_habit_ids uuid[] not null default '{}'::uuid[],
  add column if not exists linked_activity_ids uuid[] not null default '{}'::uuid[];

-- 3. Health Logs: Add sleep quality (1-5) and workout type
alter table if exists public.health_logs 
  add column if not exists sleep_quality integer check (sleep_quality between 1 and 5),
  add column if not exists workout_type text;
