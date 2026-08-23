-- ============================================================
-- Account lock — "Delete account" locks the user out (they can't sign
-- in or reset their password) without deleting data, so an admin can
-- later purge the records. The auth-level lock is a ban applied via the
-- service role (see /api/account/lock); these columns flag it for admins.
-- Run after 0001_profile.sql.
-- ============================================================

alter table public.profiles
  add column if not exists locked boolean not null default false;

alter table public.profiles
  add column if not exists deletion_requested_at timestamptz;
