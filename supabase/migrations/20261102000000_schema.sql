-- ============================================================================
-- Sahil's Shore: Master Database Schema
-- Migration: 20261102000000_schema.sql
-- Description: Core tables, planner, tracker, learning, career, finances, media,
--              reflection, infra, RLS policies, indexes, updated_at triggers,
--              and user seed functions.
-- ============================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "pgcrypto";
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 0. Generic updated_at trigger function
-- ----------------------------------------------------------------------------
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ============================================================================
-- 1. CORE TABLES
-- ============================================================================

-- 1.1 Profiles
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  email text not null,
  full_name text,
  avatar_url text,
  timezone text not null default 'Asia/Kolkata',
  currency text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.2 Settings (jsonb configs for theme, layout, module configuration, privacy)
create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  theme jsonb not null default '{"preset":"shore","mode":"system","accent":"#1F7A8C","font":"sans","radius":"md","density":"comfortable"}'::jsonb,
  layout jsonb not null default '{"sidebar_collapsed":false,"widgets":[]}'::jsonb,
  modules_config jsonb not null default '{}'::jsonb,
  privacy jsonb not null default '{"lock_journal":false,"lock_expenses":false,"lock_media":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 1.3 Timeline Events (Unified activity feed across all Shore modules)
create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null,
  occurred_at timestamptz not null default now(),
  ref_table text,
  ref_id uuid,
  summary text not null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 2. PLANNER MODULE
-- ============================================================================

-- 2.1 Tasks
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'completed', 'cancelled')),
  due_date date,
  due_time time,
  tags text[] not null default '{}'::text[],
  is_recurring boolean not null default false,
  recurrence_rule jsonb,
  completed_at timestamptz,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.2 Subtasks
create table if not exists public.subtasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  task_id uuid not null references public.tasks(id) on delete cascade,
  title text not null,
  is_completed boolean not null default false,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.3 Habits
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  frequency text not null default 'daily' check (frequency in ('daily', 'weekly', 'custom')),
  target_days text[] not null default '{}'::text[],
  color text,
  icon text,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2.4 Habit Logs
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  habit_id uuid not null references public.habits(id) on delete cascade,
  logged_date date not null,
  completed boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habit_logs_user_habit_date_unique unique (user_id, habit_id, logged_date)
);

-- ============================================================================
-- 3. TRACKER MODULE
-- ============================================================================

-- 3.1 Activities
create table if not exists public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  daily_target_minutes integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3.2 Activity Logs
create table if not exists public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  started_at timestamptz not null default now(),
  duration_seconds integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 4. LEARNING MODULE
-- ============================================================================

-- 4.1 DSA Problems
create table if not exists public.dsa_problems (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  link text,
  platform text,
  topic text,
  difficulty text not null default 'Medium' check (difficulty in ('Easy', 'Medium', 'Hard')),
  status text not null default 'solved' check (status in ('todo', 'attempted', 'solved', 'mastered')),
  time_spent_minutes integer,
  approach_notes text,
  code_snippet text,
  language text not null default 'java',
  next_revision_at timestamptz,
  revision_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.2 Learning Tracks (e.g., Java/Spring Boot & MERN)
create table if not exists public.learning_tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  icon text,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.3 Learning Items (Roadmap checklist per track)
create table if not exists public.learning_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.learning_tracks(id) on delete cascade,
  topic text not null,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'completed')),
  notes text,
  resources jsonb not null default '[]'::jsonb,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.4 Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.learning_tracks(id) on delete set null,
  title text not null,
  description text,
  tech_stack text[] not null default '{}'::text[],
  status text not null default 'in_progress' check (status in ('idea', 'in_progress', 'completed', 'deployed')),
  repo_url text,
  deployed_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.5 Interview Q&A
create table if not exists public.interview_qa (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.learning_tracks(id) on delete set null,
  technology text not null,
  question text not null,
  answer text not null,
  difficulty text default 'medium',
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.6 Vocab Cards (German SM-2 Spaced Repetition)
create table if not exists public.vocab_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  german_text text not null,
  english_meaning text not null,
  part_of_speech text,
  gender text check (gender in ('der', 'die', 'das', null)),
  plural text,
  example_sentence text,
  cefr_level text not null default 'A1' check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  repetition integer not null default 0,
  interval integer not null default 0,
  ease_factor numeric(4,2) not null default 2.50,
  next_review_at timestamptz not null default now(),
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.7 Grammar Notes
create table if not exists public.grammar_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  cefr_level text not null default 'A1',
  content text not null,
  rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4.8 Pronunciation Recordings
create table if not exists public.pronunciation_recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  phrase text not null,
  audio_url text not null,
  reference_audio_url text,
  score integer,
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 5. CAREER HUB
-- ============================================================================

-- 5.1 Resumes
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  version_label text not null,
  target_role text,
  file_url text,
  drive_file_id text,
  content jsonb not null default '{}'::jsonb,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5.2 Bullet Bank
create table if not exists public.bullet_bank (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  category text,
  skills text[] not null default '{}'::text[],
  metrics text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5.3 Job Applications
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  role text not null,
  location text,
  stage text not null default 'wishlist' check (stage in ('wishlist', 'applied', 'interview', 'offer', 'rejected')),
  applied_at timestamptz,
  salary_range text,
  job_url text,
  notes text,
  next_follow_up timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5.4 Interview Stories (STAR Method)
create table if not exists public.interview_stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  situation text not null,
  task text not null,
  action text not null,
  result text not null,
  skills text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 6. MONEY & LIFE
-- ============================================================================

-- 6.1 Expense Categories
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text,
  color text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6.2 Expenses (amount_paise stored as integer paise: Rs 10.50 = 1050)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.expense_categories(id) on delete set null,
  amount_paise bigint not null check (amount_paise >= 0),
  spent_at timestamptz not null default now(),
  payment_method text not null default 'UPI',
  place text,
  notes text,
  receipt_url text,
  drive_file_id text,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6.3 Incomes
create table if not exists public.incomes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source text not null,
  amount_paise bigint not null check (amount_paise >= 0),
  received_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6.4 Budgets (Monthly category caps)
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null references public.expense_categories(id) on delete cascade,
  month_year text not null, -- Format: 'YYYY-MM'
  amount_paise bigint not null check (amount_paise >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_user_category_month_unique unique (user_id, category_id, month_year)
);

-- 6.5 Meals (Food Diary)
create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  description text not null,
  location_type text not null default 'home' check (location_type in ('home', 'restaurant', 'office', 'other')),
  restaurant_name text,
  expense_id uuid references public.expenses(id) on delete set null,
  rating integer check (rating between 1 and 5),
  photo_url text,
  notes_taste text,
  notes_health text,
  eaten_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6.6 Places (Leaflet / OSM Coordinates)
create table if not exists public.places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  category text not null default 'cafe',
  visited_at timestamptz not null default now(),
  lat double precision,
  lng double precision,
  rating integer check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6.7 Albums
create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6.8 Media Items (Google Drive sync, links to place/meal/expense/journal)
create table if not exists public.media_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  drive_file_id text,
  file_name text not null,
  mime_type text not null,
  media_type text not null default 'photo' check (media_type in ('photo', 'video', 'receipt', 'audio')),
  thumb_path text,
  taken_at timestamptz not null default now(),
  lat double precision,
  lng double precision,
  links jsonb not null default '{}'::jsonb,
  album_id uuid references public.albums(id) on delete set null,
  sync_status text not null default 'synced' check (sync_status in ('pending', 'synced', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 7. REFLECTION & SECOND BRAIN
-- ============================================================================

-- 7.1 Journal Entries
create table if not exists public.journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null,
  mood integer check (mood between 1 and 5),
  energy integer check (energy between 1 and 5),
  gratitude text[] not null default '{}'::text[],
  wins text[] not null default '{}'::text[],
  lessons text[] not null default '{}'::text[],
  content text,
  tags text[] not null default '{}'::text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint journal_entries_user_date_unique unique (user_id, entry_date)
);

-- 7.2 Notes (Markdown Second Brain)
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null default '',
  tags text[] not null default '{}'::text[],
  is_pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7.3 Note Links ([[backlinks]])
create table if not exists public.note_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_note_id uuid not null references public.notes(id) on delete cascade,
  target_note_id uuid not null references public.notes(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint note_links_user_pair_unique unique (user_id, source_note_id, target_note_id)
);

-- 7.4 Goals
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  target_date date,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed', 'archived')),
  progress_percent integer not null default 0 check (progress_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7.5 Milestones
create table if not exists public.milestones (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal_id uuid not null references public.goals(id) on delete cascade,
  title text not null,
  due_date date,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7.6 Health Logs (Water, Sleep, Workouts, Weight)
create table if not exists public.health_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  logged_date date not null,
  water_ml integer check (water_ml >= 0),
  sleep_hours numeric(3,1) check (sleep_hours >= 0),
  workout_minutes integer check (workout_minutes >= 0),
  workout_notes text,
  weight_kg numeric(4,1) check (weight_kg >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_logs_user_date_unique unique (user_id, logged_date)
);

-- ============================================================================
-- 8. INFRASTRUCTURE TABLES
-- ============================================================================

-- 8.1 Google Drive Credentials (Encrypted refresh token, server-only)
create table if not exists public.drive_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  encrypted_refresh_token text not null,
  folder_id text,
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8.2 Sync Queue (Background upload/retry pipeline)
create table if not exists public.sync_queue (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'processing', 'completed', 'failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
--    Rule: Every table must have RLS enabled and only accessible when
--    auth.uid() = user_id.
-- ============================================================================

do $$
declare
  tbl text;
  tables text[] := array[
    'profiles',
    'settings',
    'timeline_events',
    'tasks',
    'subtasks',
    'habits',
    'habit_logs',
    'activities',
    'activity_logs',
    'dsa_problems',
    'learning_tracks',
    'learning_items',
    'projects',
    'interview_qa',
    'vocab_cards',
    'grammar_notes',
    'pronunciation_recordings',
    'resumes',
    'bullet_bank',
    'applications',
    'interview_stories',
    'expense_categories',
    'expenses',
    'incomes',
    'budgets',
    'meals',
    'places',
    'albums',
    'media_items',
    'journal_entries',
    'notes',
    'note_links',
    'goals',
    'milestones',
    'health_logs',
    'drive_credentials',
    'sync_queue'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table public.%I enable row level security;', tbl);

    execute format('drop policy if exists "Users can read own %I" on public.%I;', tbl, tbl);
    execute format('create policy "Users can read own %I" on public.%I for select using (auth.uid() = user_id);', tbl, tbl);

    execute format('drop policy if exists "Users can insert own %I" on public.%I;', tbl, tbl);
    execute format('create policy "Users can insert own %I" on public.%I for insert with check (auth.uid() = user_id);', tbl, tbl);

    execute format('drop policy if exists "Users can update own %I" on public.%I;', tbl, tbl);
    execute format('create policy "Users can update own %I" on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', tbl, tbl);

    execute format('drop policy if exists "Users can delete own %I" on public.%I;', tbl, tbl);
    execute format('create policy "Users can delete own %I" on public.%I for delete using (auth.uid() = user_id);', tbl, tbl);
  end loop;
end $$;

-- ============================================================================
-- 10. UPDATED_AT TRIGGERS
-- ============================================================================

do $$
declare
  tbl text;
  tables text[] := array[
    'profiles',
    'settings',
    'timeline_events',
    'tasks',
    'subtasks',
    'habits',
    'habit_logs',
    'activities',
    'activity_logs',
    'dsa_problems',
    'learning_tracks',
    'learning_items',
    'projects',
    'interview_qa',
    'vocab_cards',
    'grammar_notes',
    'pronunciation_recordings',
    'resumes',
    'bullet_bank',
    'applications',
    'interview_stories',
    'expense_categories',
    'expenses',
    'incomes',
    'budgets',
    'meals',
    'places',
    'albums',
    'media_items',
    'journal_entries',
    'notes',
    'note_links',
    'goals',
    'milestones',
    'health_logs',
    'drive_credentials',
    'sync_queue'
  ];
begin
  foreach tbl in array tables loop
    execute format('drop trigger if exists set_%I_updated_at on public.%I;', tbl, tbl);
    execute format('create trigger set_%I_updated_at before update on public.%I for each row execute function public.handle_updated_at();', tbl, tbl);
  end loop;
end $$;

-- ============================================================================
-- 11. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core
create index if not exists idx_profiles_user on public.profiles (user_id);
create index if not exists idx_settings_user on public.settings (user_id);
create index if not exists idx_timeline_events_user_occurred on public.timeline_events (user_id, occurred_at desc);
create index if not exists idx_timeline_events_ref on public.timeline_events (ref_table, ref_id);

-- Planner
create index if not exists idx_tasks_user_status_due on public.tasks (user_id, status, due_date);
create index if not exists idx_subtasks_task on public.subtasks (task_id);
create index if not exists idx_habits_user_active on public.habits (user_id, is_active);
create index if not exists idx_habit_logs_user_date on public.habit_logs (user_id, logged_date desc);

-- Tracker
create index if not exists idx_activities_user_active on public.activities (user_id, is_active);
create index if not exists idx_activity_logs_user_started on public.activity_logs (user_id, started_at desc);
create index if not exists idx_activity_logs_activity on public.activity_logs (activity_id);

-- Learning
create index if not exists idx_dsa_problems_user_status on public.dsa_problems (user_id, status);
create index if not exists idx_dsa_problems_user_revision on public.dsa_problems (user_id, next_revision_at);
create index if not exists idx_learning_tracks_user on public.learning_tracks (user_id);
create index if not exists idx_learning_items_track on public.learning_items (track_id, status);
create index if not exists idx_projects_user_status on public.projects (user_id, status);
create index if not exists idx_interview_qa_tech on public.interview_qa (user_id, technology);
create index if not exists idx_vocab_cards_user_review on public.vocab_cards (user_id, next_review_at);
create index if not exists idx_grammar_notes_user_level on public.grammar_notes (user_id, cefr_level);
create index if not exists idx_pronunciation_user on public.pronunciation_recordings (user_id);

-- Career
create index if not exists idx_resumes_user on public.resumes (user_id);
create index if not exists idx_bullet_bank_user on public.bullet_bank (user_id);
create index if not exists idx_applications_user_stage on public.applications (user_id, stage);
create index if not exists idx_interview_stories_user on public.interview_stories (user_id);

-- Money & Life
create index if not exists idx_expense_categories_user on public.expense_categories (user_id);
create index if not exists idx_expenses_user_spent on public.expenses (user_id, spent_at desc);
create index if not exists idx_expenses_category on public.expenses (category_id);
create index if not exists idx_incomes_user_received on public.incomes (user_id, received_at desc);
create index if not exists idx_budgets_user_month on public.budgets (user_id, month_year);
create index if not exists idx_meals_user_eaten on public.meals (user_id, eaten_at desc);
create index if not exists idx_places_user_visited on public.places (user_id, visited_at desc);
create index if not exists idx_albums_user on public.albums (user_id);
create index if not exists idx_media_items_user_taken on public.media_items (user_id, taken_at desc);

-- Reflection
create index if not exists idx_journal_entries_user_date on public.journal_entries (user_id, entry_date desc);
create index if not exists idx_notes_user_pinned on public.notes (user_id, is_pinned desc);
create index if not exists idx_note_links_source on public.note_links (source_note_id);
create index if not exists idx_note_links_target on public.note_links (target_note_id);
create index if not exists idx_goals_user_status on public.goals (user_id, status);
create index if not exists idx_milestones_goal on public.milestones (goal_id);
create index if not exists idx_health_logs_user_date on public.health_logs (user_id, logged_date desc);

-- Infra
create index if not exists idx_sync_queue_user_status on public.sync_queue (user_id, status, attempts);

-- ============================================================================
-- 12. SEED FUNCTIONS & USER INITIALIZATION TRIGGER
-- ============================================================================

-- 12.1 Procedure to seed default expense categories and activities for a user
create or replace function public.seed_user_defaults(p_user_id uuid)
returns void as $$
begin
  -- 1. Default Expense Categories
  insert into public.expense_categories (user_id, name, icon, color, is_default)
  values
    (p_user_id, 'Food', 'Utensils', '#E0A458', true),
    (p_user_id, 'Transport', 'Car', '#1F7A8C', true),
    (p_user_id, 'Study', 'BookOpen', '#4FB3C8', true),
    (p_user_id, 'Bills', 'Receipt', '#D1495B', true),
    (p_user_id, 'Shopping', 'ShoppingBag', '#9B5DE5', true),
    (p_user_id, 'Health', 'HeartPulse', '#2E9E6B', true),
    (p_user_id, 'Entertainment', 'Film', '#F15BB5', true),
    (p_user_id, 'Other', 'MoreHorizontal', '#5B6B76', true)
  on conflict do nothing;

  -- 2. Default Activities (DSA, Spring Boot, MERN, German, Gym, Reading)
  insert into public.activities (user_id, name, icon, color, daily_target_minutes, is_active)
  values
    (p_user_id, 'DSA', 'Code', '#1F7A8C', 60, true),
    (p_user_id, 'Spring Boot', 'Cpu', '#2E9E6B', 60, true),
    (p_user_id, 'MERN', 'Layers', '#4FB3C8', 60, true),
    (p_user_id, 'German', 'Globe', '#E0A458', 30, true),
    (p_user_id, 'Gym', 'Dumbbell', '#D1495B', 45, true),
    (p_user_id, 'Reading', 'BookMarked', '#9B5DE5', 30, true)
  on conflict do nothing;

  -- 3. Default Learning Tracks
  insert into public.learning_tracks (user_id, title, description, icon, color)
  values
    (p_user_id, 'Java / Spring Boot', 'Java, JPA/Hibernate, Spring Security, Microservices, SQL', 'Cpu', '#2E9E6B'),
    (p_user_id, 'MERN & Full-Stack', 'MongoDB, Express, React, Node.js, Next.js & TypeScript', 'Layers', '#4FB3C8')
  on conflict do nothing;
end;
$$ language plpgsql security definer;

-- 12.2 Automatic trigger for new user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Create profile
  insert into public.profiles (user_id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Sahil'),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', null)
  )
  on conflict (user_id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url);

  -- Create default settings
  insert into public.settings (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  -- Seed default categories and activities
  perform public.seed_user_defaults(new.id);

  return new;
end;
$$ language plpgsql security definer;

-- Drop and recreate the trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
