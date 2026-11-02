-- ============================================================================
-- Sahil's Shore: Phase 4 Migration - Expenses & Food Diary Enhancements
-- Adds recurrence rules, recurring_expenses table, and food diary extensions
-- ============================================================================

-- 1. Enhance Expenses Table with recurrence_rule
alter table public.expenses 
  add column if not exists recurrence_rule jsonb;

-- 2. Enhance Meals Table with favorite and eat_again flags
alter table public.meals 
  add column if not exists is_favorite boolean not null default false,
  add column if not exists eat_again boolean not null default false;

-- 3. Create Recurring Expenses Table (Templates for rent, subscriptions, etc.)
create table if not exists public.recurring_expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.expense_categories(id) on delete set null,
  amount_paise bigint not null check (amount_paise >= 0),
  payment_method text not null default 'UPI',
  place text,
  notes text,
  frequency text not null default 'monthly' check (frequency in ('daily', 'weekly', 'monthly', 'yearly')),
  day_of_month integer check (day_of_month between 1 and 31),
  day_of_week text,
  is_active boolean not null default true,
  last_processed_at timestamptz,
  next_due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row Level Security (RLS) on recurring_expenses
alter table public.recurring_expenses enable row level security;

create policy "Users can read own recurring expenses"
  on public.recurring_expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own recurring expenses"
  on public.recurring_expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own recurring expenses"
  on public.recurring_expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own recurring expenses"
  on public.recurring_expenses for delete
  using (auth.uid() = user_id);

-- Attach handle_updated_at trigger
drop trigger if exists set_recurring_expenses_updated_at on public.recurring_expenses;
create trigger set_recurring_expenses_updated_at
  before update on public.recurring_expenses
  for each row execute function public.handle_updated_at();

-- Indexes for performance
create index if not exists idx_recurring_expenses_user on public.recurring_expenses (user_id, is_active);
create index if not exists idx_meals_user_eaten on public.meals (user_id, eaten_at desc);
create index if not exists idx_meals_favorite on public.meals (user_id, is_favorite) where is_favorite = true;
create index if not exists idx_meals_eat_again on public.meals (user_id, eat_again) where eat_again = true;
