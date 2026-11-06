-- ============================================================================
-- Migration: Food Diary Calendar, Skipped Meals & Fasting Engine
-- Expands meals check constraint for amrita_mess, adds skipped flags, and creates fasting_logs
-- ============================================================================

-- 1. Expand location_type constraint on meals if present
do $$
begin
  if exists (
    select 1 from pg_constraint where conname = 'meals_location_type_check'
  ) then
    alter table public.meals drop constraint meals_location_type_check;
    alter table public.meals add constraint meals_location_type_check
      check (location_type in ('home', 'restaurant', 'office', 'amrita_mess', 'other'));
  end if;
end $$;

-- 2. Add is_skipped and skipped_reason to meals
alter table public.meals add column if not exists is_skipped boolean not null default false;
alter table public.meals add column if not exists skipped_reason text;
alter table public.meals add column if not exists photo_urls text[];

-- 3. Intermittent Fasting Tracker table
create table if not exists public.fasting_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  protocol text not null default '16:8', -- '16:8', '18:6', '20:4', '14:10', '24:0', 'custom'
  target_hours numeric(4,1) not null default 16.0,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  is_active boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS for fasting_logs
alter table public.fasting_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'fasting_logs' and policyname = 'fasting_logs_user_policy'
  ) then
    create policy "fasting_logs_user_policy" on public.fasting_logs
      for all using (auth.uid() = user_id);
  end if;
end $$;

create index if not exists idx_fasting_logs_user_start
  on public.fasting_logs(user_id, started_at desc);
create index if not exists idx_fasting_logs_active
  on public.fasting_logs(user_id, is_active);
