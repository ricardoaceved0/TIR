-- ============================================================
-- Conocimientos (skill/cert chips) and Logros (career milestones)
-- edited in /profile and fed into the diagnostic. Stored as JSONB on
-- the profile. Run after 0001_profile.sql.
-- ============================================================

alter table public.profiles
  add column if not exists knowledge jsonb not null default '[]'::jsonb;

-- knowledge: string[]  e.g. ["SAP","EOS","PMP"]
-- achievements: { title, impact, year, detail }[]
alter table public.profiles
  add column if not exists achievements jsonb not null default '[]'::jsonb;
