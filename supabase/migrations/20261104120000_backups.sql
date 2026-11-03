-- ============================================================================
-- Sahil's Shore: Phase 12 Database Migration — Backups and Restore
-- ============================================================================

create table if not exists public.backup_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_type text not null check (trigger_type in ('manual', 'cron', 'restore')),
  status text not null check (status in ('in_progress', 'success', 'failed')),
  drive_folder_id text,
  folder_name text not null,
  tables_count int not null default 0,
  rows_count int not null default 0,
  file_size_bytes bigint not null default 0,
  details jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for querying recent backups
create index if not exists idx_backup_logs_user_created 
  on public.backup_logs(user_id, created_at desc);

-- Enable RLS
alter table public.backup_logs enable row level security;

-- Strict RLS Policy: single-user isolation
create policy "backup_logs_user_policy"
  on public.backup_logs
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Attach standard updated_at trigger
create trigger set_backup_logs_updated_at
  before update on public.backup_logs
  for each row execute function public.handle_updated_at();
