-- ============================================================================
-- Sahil's Shore: Seed Data Script
-- File: supabase/seed.sql
-- Description: Creates default expense categories, default activities, and
--              learning tracks for local development and testing.
-- ============================================================================

-- If a test user exists or is created via supabase auth in local dev:
-- You can run `select public.seed_user_defaults('your-user-uuid'::uuid);`
-- Or use the queries below when a mock user is present.

-- 1. Default Expense Categories (Fallback template insert)
-- Categories: Food, Transport, Study, Bills, Shopping, Health, Entertainment, Other
insert into public.expense_categories (user_id, name, icon, color, is_default)
select
  auth.uid(),
  c.name,
  c.icon,
  c.color,
  true
from (
  values
    ('Food', 'Utensils', '#E0A458'),
    ('Transport', 'Car', '#1F7A8C'),
    ('Study', 'BookOpen', '#4FB3C8'),
    ('Bills', 'Receipt', '#D1495B'),
    ('Shopping', 'ShoppingBag', '#9B5DE5'),
    ('Health', 'HeartPulse', '#2E9E6B'),
    ('Entertainment', 'Film', '#F15BB5'),
    ('Other', 'MoreHorizontal', '#5B6B76')
) as c(name, icon, color)
where auth.uid() is not null
on conflict do nothing;

-- 2. Default Activities
-- Activities: DSA, Spring Boot, MERN, German, Gym, Reading
insert into public.activities (user_id, name, icon, color, daily_target_minutes, is_active)
select
  auth.uid(),
  a.name,
  a.icon,
  a.color,
  a.daily_target_minutes,
  true
from (
  values
    ('DSA', 'Code', '#1F7A8C', 60),
    ('Spring Boot', 'Cpu', '#2E9E6B', 60),
    ('MERN', 'Layers', '#4FB3C8', 60),
    ('German', 'Globe', '#E0A458', 30),
    ('Gym', 'Dumbbell', '#D1495B', 45),
    ('Reading', 'BookMarked', '#9B5DE5', 30)
) as a(name, icon, color, daily_target_minutes)
where auth.uid() is not null
on conflict do nothing;
