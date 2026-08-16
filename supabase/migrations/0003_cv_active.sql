-- ============================================================
-- Mark one CV as the active one used for the AI diagnostic (cv_text).
-- Run after 0001_profile.sql.
-- ============================================================

alter table public.cvs
  add column if not exists is_active boolean not null default false;

-- Owners need UPDATE to flip is_active (0001 only granted select/insert/delete).
drop policy if exists "cvs: owner updates" on public.cvs;
create policy "cvs: owner updates" on public.cvs
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- At most one active CV per user.
create unique index if not exists cvs_one_active_per_user
  on public.cvs (user_id) where is_active;
