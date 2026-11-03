-- ============================================================================
-- Sahil's Shore: Phase 9 Migration - Resume & Career Hub
-- Enhances resumes, bullet_bank, applications, interview_stories
-- Adds company_notes table with RLS, updated_at trigger, and indexes
-- ============================================================================

-- 1. ENHANCE RESUMES (notes, file_size, uploaded_date)
alter table public.resumes
  add column if not exists notes text,
  add column if not exists file_size integer default 0,
  add column if not exists uploaded_date date default current_date;

create index if not exists idx_resumes_user_primary
  on public.resumes(user_id, is_primary);

-- 2. ENHANCE BULLET BANK (project, role)
alter table public.bullet_bank
  add column if not exists project text,
  add column if not exists role text;

create index if not exists idx_bullet_bank_user_category
  on public.bullet_bank(user_id, category);

-- 3. ENHANCE APPLICATIONS (resume_id, source, salary paise, contacts)
alter table public.applications
  add column if not exists resume_id uuid references public.resumes(id) on delete set null,
  add column if not exists source text default 'LinkedIn',
  add column if not exists salary_min_paise bigint,
  add column if not exists salary_max_paise bigint,
  add column if not exists contacts jsonb not null default '[]'::jsonb;

create index if not exists idx_applications_user_stage
  on public.applications(user_id, stage);

create index if not exists idx_applications_user_follow_up
  on public.applications(user_id, next_follow_up);

-- 4. ENHANCE INTERVIEW STORIES (tags)
alter table public.interview_stories
  add column if not exists tags text[] not null default '{}'::text[];

create index if not exists idx_interview_stories_user_title
  on public.interview_stories(user_id, title);

-- 5. COMPANY NOTES TABLE (culture, tech stack, interview process, questions asked, prep checklist)
create table if not exists public.company_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  culture text,
  tech_stack text[] not null default '{}'::text[],
  interview_process text,
  questions_asked text[] not null default '{}'::text[],
  prep_checklist jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.company_notes enable row level security;

create policy "Users can manage their own company_notes"
  on public.company_notes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger handle_company_notes_updated_at
  before update on public.company_notes
  for each row execute function public.handle_updated_at();

create index if not exists idx_company_notes_user_company
  on public.company_notes(user_id, company);
