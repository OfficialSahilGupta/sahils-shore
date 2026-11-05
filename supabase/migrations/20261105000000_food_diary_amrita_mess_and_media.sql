-- ============================================================================
-- Sahil's Shore: Food Diary Amrita Mess & Multi-Photo Media Enhancement
-- 1. Updates location_type check constraint to include 'amrita_mess'
-- 2. Adds photo_urls jsonb column to support multiple photos and media links
-- ============================================================================

-- 1. Update location_type check constraint on public.meals
alter table public.meals 
  drop constraint if exists meals_location_type_check;

alter table public.meals
  add constraint meals_location_type_check 
  check (location_type in ('home', 'amrita_mess', 'office', 'restaurant', 'other'));

-- 2. Add photo_urls jsonb column for multi-photo gallery support
alter table public.meals 
  add column if not exists photo_urls jsonb default '[]'::jsonb;

-- 3. Performance Indexes
create index if not exists idx_meals_location_type on public.meals (user_id, location_type);
