-- ============================================================================
-- Sahil's Shore: Phase 6 Migration - DSA Tracker & Full-Stack Learning Hub
-- Enhances dsa_problems, learning_tracks, learning_items, projects, interview_qa
-- Adds learning_concepts, mini_project_ideas, resource_links
-- ============================================================================

-- 1. ENHANCE DSA PROBLEMS
-- Update status check constraint to support Solved, Needs revision, Stuck, Revisit
alter table public.dsa_problems 
  drop constraint if exists dsa_problems_status_check;

alter table public.dsa_problems 
  add constraint dsa_problems_status_check 
  check (status in ('Solved', 'Needs revision', 'Stuck', 'Revisit', 'solved', 'attempted', 'todo', 'mastered'));

-- Add complexity, revision interval ladder, and rating columns
alter table public.dsa_problems
  add column if not exists time_complexity text,
  add column if not exists space_complexity text,
  add column if not exists revision_interval_days integer not null default 1,
  add column if not exists last_revised_at timestamptz,
  add column if not exists revision_history jsonb not null default '[]'::jsonb,
  add column if not exists rating text check (rating in ('Easy', 'Hard', null));

-- 2. ENHANCE LEARNING TRACKS
alter table public.learning_tracks
  add column if not exists slug text;

-- 3. ENHANCE LEARNING ITEMS (Roadmap Checklist)
alter table public.learning_items
  add column if not exists order_index integer not null default 0,
  add column if not exists category text;

-- 4. ENHANCE PROJECTS
alter table public.projects
  add column if not exists readme_notes text;

-- 5. ENHANCE INTERVIEW Q&A
alter table public.interview_qa
  add column if not exists confidence integer not null default 3 check (confidence between 1 and 5),
  add column if not exists last_practiced_at timestamptz;

-- 6. CREATE LEARNING CONCEPTS TABLE (Concepts-learned log)
create table if not exists public.learning_concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.learning_tracks(id) on delete cascade,
  title text not null,
  notes text not null,
  learned_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.learning_concepts enable row level security;

create policy "Users can read own learning concepts"
  on public.learning_concepts for select
  using (auth.uid() = user_id);

create policy "Users can insert own learning concepts"
  on public.learning_concepts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own learning concepts"
  on public.learning_concepts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own learning concepts"
  on public.learning_concepts for delete
  using (auth.uid() = user_id);

drop trigger if exists set_learning_concepts_updated_at on public.learning_concepts;
create trigger set_learning_concepts_updated_at
  before update on public.learning_concepts
  for each row execute function public.handle_updated_at();

-- 7. CREATE MINI PROJECT IDEAS TABLE
create table if not exists public.mini_project_ideas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.learning_tracks(id) on delete cascade,
  title text not null,
  description text,
  difficulty text default 'Beginner' check (difficulty in ('Beginner', 'Intermediate', 'Advanced')),
  suggested_tech text[] not null default '{}'::text[],
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mini_project_ideas enable row level security;

create policy "Users can read own mini project ideas"
  on public.mini_project_ideas for select
  using (auth.uid() = user_id);

create policy "Users can insert own mini project ideas"
  on public.mini_project_ideas for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mini project ideas"
  on public.mini_project_ideas for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own mini project ideas"
  on public.mini_project_ideas for delete
  using (auth.uid() = user_id);

drop trigger if exists set_mini_project_ideas_updated_at on public.mini_project_ideas;
create trigger set_mini_project_ideas_updated_at
  before update on public.mini_project_ideas
  for each row execute function public.handle_updated_at();

-- 8. CREATE RESOURCE LINKS TABLE
create table if not exists public.resource_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  track_id uuid references public.learning_tracks(id) on delete cascade,
  title text not null,
  url text not null,
  category text not null default 'Documentation',
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resource_links enable row level security;

create policy "Users can read own resource links"
  on public.resource_links for select
  using (auth.uid() = user_id);

create policy "Users can insert own resource links"
  on public.resource_links for insert
  with check (auth.uid() = user_id);

create policy "Users can update own resource links"
  on public.resource_links for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own resource links"
  on public.resource_links for delete
  using (auth.uid() = user_id);

drop trigger if exists set_resource_links_updated_at on public.resource_links;
create trigger set_resource_links_updated_at
  before update on public.resource_links
  for each row execute function public.handle_updated_at();

-- 9. PERFORMANCE INDEXES
create index if not exists idx_dsa_problems_user_topic on public.dsa_problems (user_id, topic);
create index if not exists idx_dsa_problems_next_rev on public.dsa_problems (user_id, next_revision_at);
create index if not exists idx_learning_concepts_track on public.learning_concepts (user_id, track_id, learned_at desc);
create index if not exists idx_mini_project_ideas_track on public.mini_project_ideas (user_id, track_id);
create index if not exists idx_resource_links_track on public.resource_links (user_id, track_id, category);
create index if not exists idx_interview_qa_confidence on public.interview_qa (user_id, track_id, confidence);
