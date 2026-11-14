-- ============================================================================
-- Sahil's Shore: Workout & Fitness Hub Schema
-- Dedicated tables for workout sessions, exercise sets, physique photos, and PRs
-- ============================================================================

-- 1. Workout Sessions Table
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  routine_name text not null, -- 'Push Day', 'Pull Day', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'Custom'
  split_type text not null default 'custom',
  muscle_groups text[] not null default '{}'::text[],
  duration_minutes integer not null default 45 check (duration_minutes >= 0),
  total_volume_kg numeric(10,2) not null default 0 check (total_volume_kg >= 0),
  total_sets integer not null default 0 check (total_sets >= 0),
  intensity_rating integer check (intensity_rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for fast user and date sorting
create index if not exists idx_workout_sessions_user_date 
  on public.workout_sessions (user_id, workout_date desc);

-- 2. Workout Exercises Table (nested sets stored as jsonb)
create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  muscle_group text not null, -- 'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core'
  order_index integer not null default 0,
  sets jsonb not null default '[]'::jsonb, -- array of { setNumber, weightKg, reps, rpe, completed, isPr }
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_workout_exercises_session 
  on public.workout_exercises (session_id, order_index asc);

-- 3. Daily Physique Photos Table
create table if not exists public.workout_physique_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  photo_date date not null,
  photo_url text not null,
  drive_file_id text,
  sync_status text not null default 'synced',
  pose_type text not null default 'front', -- 'front', 'back', 'side', 'legs', 'flex', 'scale'
  weight_kg numeric(5,2),
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists idx_workout_physique_user_date 
  on public.workout_physique_photos (user_id, photo_date desc);

-- 4. Personal Records (PRs) Table
create table if not exists public.workout_prs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_name text not null,
  weight_kg numeric(6,2) not null check (weight_kg > 0),
  reps integer not null default 1 check (reps > 0),
  estimated_1rm numeric(6,2) not null check (estimated_1rm > 0),
  achieved_date date not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint workout_prs_user_exercise unique (user_id, exercise_name)
);

create index if not exists idx_workout_prs_user 
  on public.workout_prs (user_id, exercise_name);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

alter table public.workout_sessions enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_physique_photos enable row level security;
alter table public.workout_prs enable row level security;

create policy "Users own workout sessions"
  on public.workout_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users own workout exercises"
  on public.workout_exercises for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users own workout physique photos"
  on public.workout_physique_photos for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users own workout prs"
  on public.workout_prs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Updated_at triggers
create trigger handle_workout_sessions_updated_at
  before update on public.workout_sessions
  for each row execute function public.handle_updated_at();

create trigger handle_workout_prs_updated_at
  before update on public.workout_prs
  for each row execute function public.handle_updated_at();
