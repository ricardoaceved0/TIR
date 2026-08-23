-- ============================================================
-- Runs — every diagnostic the user generates (inputs + output),
-- powering the /profile → Historial screen and account export.
-- Run after 0001_profile.sql.
-- ============================================================

create table if not exists public.runs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  empresa           text,
  posicion          text,
  fecha             text,
  stage             text,
  job_description   text,
  tools             text[] not null default '{}',
  linkedin_url      text,
  interviewer_title text,
  cv_text           text,
  diagnostic        jsonb,
  model             text,
  created_at        timestamptz not null default now()
);

create index if not exists runs_user_created_idx on public.runs (user_id, created_at desc);

alter table public.runs enable row level security;

drop policy if exists "runs: owner reads"   on public.runs;
drop policy if exists "runs: owner inserts" on public.runs;
drop policy if exists "runs: owner deletes" on public.runs;
create policy "runs: owner reads"   on public.runs for select using (auth.uid() = user_id);
create policy "runs: owner inserts" on public.runs for insert with check (auth.uid() = user_id);
create policy "runs: owner deletes" on public.runs for delete using (auth.uid() = user_id);
