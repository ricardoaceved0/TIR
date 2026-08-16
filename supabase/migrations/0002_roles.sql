-- ============================================================
-- User roles — regular · admin · super_admin.
-- Run after 0001_profile.sql. See docs/USERS_SETUP.md.
-- ============================================================

alter table public.profiles
  add column if not exists role text not null default 'regular';

alter table public.profiles
  drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check
  check (role in ('regular', 'admin', 'super_admin'));

create index if not exists profiles_role_idx on public.profiles (role);

-- New signups default to 'regular' (the trigger in 0001 inserts the row;
-- role falls back to its default). Admin/super_admin are granted only via
-- the service-role path (the /admin-users screen or the seed script),
-- never by the client — RLS lets a user read their own role but the role
-- column is only writable through the service role, which bypasses RLS.
