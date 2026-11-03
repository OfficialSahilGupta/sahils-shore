-- ============================================================================
-- Sahil's Shore: Phase 11 Schema Enhancements
-- Analytics & AI Coach Caching Table & Settings Configuration
-- ============================================================================

-- 1. AI Coach Insights Table (caches daily & weekly coach evaluations)
create table if not exists public.ai_coach_insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  period_date date not null,
  insight_type text not null default 'daily', -- 'daily' or 'weekly'
  summary text not null,                      -- 3-line summary
  pattern text not null,                      -- 1 pattern noticed across stats
  suggested_priorities jsonb not null default '[]'::jsonb, -- array of 3 actionable priorities
  gentle_nudge text not null,                 -- supportive nudge
  weekly_review jsonb,                        -- optional extended breakdown for weekly reviews
  raw_stats jsonb not null default '{}'::jsonb, -- sanitized stats snapshot used for generation
  provider text not null default 'heuristic', -- 'gemini', 'anthropic', or 'heuristic'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_coach_insights_user_date_type_key unique (user_id, period_date, insight_type)
);

-- Index for speedy lookups by user, date, and type
create index if not exists idx_ai_coach_insights_lookup
  on public.ai_coach_insights (user_id, period_date desc, insight_type);

-- Row-Level Security: single user access
alter table public.ai_coach_insights enable row level security;

create policy "Users can manage their own coach insights"
  on public.ai_coach_insights
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Updated_at trigger
drop trigger if exists set_ai_coach_insights_updated_at on public.ai_coach_insights;
create trigger set_ai_coach_insights_updated_at
  before update on public.ai_coach_insights
  for each row
  execute function public.handle_updated_at();

-- 2. Settings table enhancement: add ai_coach config column
alter table if exists public.settings
  add column if not exists ai_coach jsonb not null default '{"enabled":true,"opt_in_journal":false,"provider":"auto"}'::jsonb;
