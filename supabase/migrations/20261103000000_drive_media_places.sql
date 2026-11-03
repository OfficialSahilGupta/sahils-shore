-- ============================================================================
-- Migration: 20261103000000_drive_media_places.sql
-- Enhancements for Google Drive sync, Media Vault, and Places module
-- ============================================================================

-- 1. Extend drive_credentials with folder_tree and connected email
alter table public.drive_credentials
  add column if not exists folder_tree jsonb not null default '{}'::jsonb,
  add column if not exists google_email text;

-- 2. Performance indexes for Media Items
create index if not exists idx_media_items_user_taken 
  on public.media_items (user_id, taken_at desc);

create index if not exists idx_media_items_sync_status 
  on public.media_items (user_id, sync_status);

create index if not exists idx_media_items_album 
  on public.media_items (album_id);

create index if not exists idx_media_items_links_place 
  on public.media_items ((links->>'place_id'))
  where links->>'place_id' is not null;

create index if not exists idx_media_items_links_expense 
  on public.media_items ((links->>'expense_id'))
  where links->>'expense_id' is not null;

create index if not exists idx_media_items_links_meal 
  on public.media_items ((links->>'meal_id'))
  where links->>'meal_id' is not null;

-- 3. Performance indexes for Places
create index if not exists idx_places_user_visited 
  on public.places (user_id, visited_at desc);

create index if not exists idx_places_user_category 
  on public.places (user_id, category);

-- 4. Sync Queue Index
create index if not exists idx_sync_queue_user_status 
  on public.sync_queue (user_id, status);

-- 5. Set up private storage bucket for media thumbnails (if storage schema exists)
do $$
begin
  if exists (select 1 from information_schema.schemata where schema_name = 'storage') then
    insert into storage.buckets (id, name, public)
    values ('media_thumbnails', 'media_thumbnails', false)
    on conflict (id) do nothing;
  end if;
end $$;
