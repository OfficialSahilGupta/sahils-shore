-- ============================================================================
-- Sahil's Shore: Phase 8 Migration - German Hub & Pronunciation Lab
-- Enhances vocab_cards, grammar_notes, pronunciation_recordings
-- Adds german_progress, german_listening_logs, german_writing_entries
-- ============================================================================

-- 1. ENHANCE VOCAB CARDS (tags array)
alter table public.vocab_cards
  add column if not exists tags text[] not null default '{}'::text[];

create index if not exists idx_vocab_cards_next_review 
  on public.vocab_cards(user_id, next_review_at);

create index if not exists idx_vocab_cards_cefr 
  on public.vocab_cards(user_id, cefr_level);

-- 2. ENHANCE GRAMMAR NOTES (topic, tags)
alter table public.grammar_notes
  add column if not exists topic text not null default 'General',
  add column if not exists tags text[] not null default '{}'::text[];

create index if not exists idx_grammar_notes_level_topic 
  on public.grammar_notes(user_id, cefr_level, topic);

-- 3. ENHANCE PRONUNCIATION RECORDINGS (drive_file_id, hard_sounds, speech_rate, mode, attempt_number)
alter table public.pronunciation_recordings
  add column if not exists drive_file_id text,
  add column if not exists hard_sounds text[] not null default '{}'::text[],
  add column if not exists speech_rate numeric(3,2) not null default 1.0,
  add column if not exists mode text not null default 'standard' check (mode in ('standard', 'shadowing')),
  add column if not exists attempt_number integer not null default 1;

create index if not exists idx_pronunciation_recordings_user_phrase 
  on public.pronunciation_recordings(user_id, phrase);

-- 4. CEFR PROGRESS TABLE (competencies checklist per level)
create table if not exists public.german_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  level text not null check (level in ('A1', 'A2', 'B1', 'B2')),
  competency_id text not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, level, competency_id)
);

alter table public.german_progress enable row level security;

create policy "Users can manage their own german_progress"
  on public.german_progress for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger handle_german_progress_updated_at
  before update on public.german_progress
  for each row execute function public.handle_updated_at();

create index if not exists idx_german_progress_user_level 
  on public.german_progress(user_id, level);

-- 5. GERMAN LISTENING LOGS TABLE
create table if not exists public.german_listening_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  media_type text not null default 'Podcast',
  duration_minutes integer not null default 15,
  cefr_level text not null default 'A1' check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  notes text,
  vocabulary_learned text[] not null default '{}'::text[],
  logged_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.german_listening_logs enable row level security;

create policy "Users can manage their own german_listening_logs"
  on public.german_listening_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger handle_german_listening_logs_updated_at
  before update on public.german_listening_logs
  for each row execute function public.handle_updated_at();

create index if not exists idx_german_listening_logs_user_date 
  on public.german_listening_logs(user_id, logged_at);

-- 6. GERMAN WRITING ENTRIES TABLE
create table if not exists public.german_writing_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt_id text,
  prompt_title text not null,
  cefr_level text not null default 'A1' check (cefr_level in ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
  content text not null,
  word_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.german_writing_entries enable row level security;

create policy "Users can manage their own german_writing_entries"
  on public.german_writing_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger handle_german_writing_entries_updated_at
  before update on public.german_writing_entries
  for each row execute function public.handle_updated_at();

create index if not exists idx_german_writing_entries_user_date 
  on public.german_writing_entries(user_id, created_at desc);
