-- ============================================================================
-- Migration: Add Album Date and Index for Past Pictures Support
-- File: supabase/migrations/20261106000000_album_date_and_media_drive.sql
-- ============================================================================

-- 1. Add album_date to albums table
alter table public.albums
  add column if not exists album_date timestamptz default now();

-- 2. Backfill existing albums with their creation timestamp
update public.albums
set album_date = created_at
where album_date is null;

-- 3. Add composite index for chronologically querying albums
create index if not exists idx_albums_user_date
  on public.albums(user_id, album_date desc);
