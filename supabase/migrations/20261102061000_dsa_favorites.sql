-- ============================================================================
-- Sahil's Shore: Add is_favorite to dsa_problems
-- ============================================================================

alter table public.dsa_problems 
  add column if not exists is_favorite boolean not null default false;

create index if not exists idx_dsa_problems_user_fav on public.dsa_problems (user_id, is_favorite);
