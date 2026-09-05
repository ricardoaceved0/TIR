-- ============================================================================
-- The Interview Room — full database setup (all migrations, consolidated).
-- Idempotent: safe to run more than once. Paste into the Supabase SQL editor
-- for the knvykpqhrgbogicfoncs project and Run.
--
-- Order matters (later blocks add columns to tables the first block creates).
-- Combines: 0001_profile, 0001_prompt_config, 0002_roles, 0003_cv_active,
--           0004_runs, 0005_account_lock, 0006_profile_lists
-- plus a backfill + super_admin seed at the end.
-- ============================================================================

-- ---------- profiles: display name, avatar, preferences ---------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  avatar_url  text,
  preferences jsonb not null default '{}'::jsonb,
  updated_at  timestamptz not null default now()
);
alter table public.profiles enable row level security;

drop policy if exists "profiles: owner reads"   on public.profiles;
drop policy if exists "profiles: owner inserts" on public.profiles;
drop policy if exists "profiles: owner updates" on public.profiles;
create policy "profiles: owner reads"   on public.profiles for select using (auth.uid() = id);
create policy "profiles: owner inserts" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles: owner updates" on public.profiles for update using (auth.uid() = id);

-- create a profile row automatically when a user signs up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- roles: regular · admin · super_admin ----------------------------
alter table public.profiles add column if not exists role text not null default 'regular';
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('regular', 'admin', 'super_admin'));
create index if not exists profiles_role_idx on public.profiles (role);

-- ---------- account lock + profile lists (columns on profiles) --------------
alter table public.profiles add column if not exists locked boolean not null default false;
alter table public.profiles add column if not exists deletion_requested_at timestamptz;
alter table public.profiles add column if not exists knowledge jsonb not null default '[]'::jsonb;      -- string[] (legacy, unused)
alter table public.profiles add column if not exists achievements jsonb not null default '[]'::jsonb;   -- {title,impact,year,detail}[] (legacy, unused)
-- Tu LinkedIn (profile export → Markdown) + Tu Momento (chosen situation id)
alter table public.profiles add column if not exists linkedin_markdown text;
alter table public.profiles add column if not exists linkedin_filename text;
alter table public.profiles add column if not exists momento text;

-- ---------- cvs: uploaded CV + its Markdown conversion ----------------------
create table if not exists public.cvs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  filename     text not null,
  storage_path text,
  markdown     text,
  created_at   timestamptz not null default now()
);
alter table public.cvs add column if not exists is_active boolean not null default false;
alter table public.cvs enable row level security;

drop policy if exists "cvs: owner reads"   on public.cvs;
drop policy if exists "cvs: owner inserts" on public.cvs;
drop policy if exists "cvs: owner updates" on public.cvs;
drop policy if exists "cvs: owner deletes" on public.cvs;
create policy "cvs: owner reads"   on public.cvs for select using (auth.uid() = user_id);
create policy "cvs: owner inserts" on public.cvs for insert with check (auth.uid() = user_id);
create policy "cvs: owner updates" on public.cvs for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cvs: owner deletes" on public.cvs for delete using (auth.uid() = user_id);

-- at most one active CV per user
create unique index if not exists cvs_one_active_per_user on public.cvs (user_id) where is_active;

-- ---------- subscriptions: plan, credits, renewal ---------------------------
create table if not exists public.subscriptions (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  plan        text not null default 'acceso_activo',
  status      text not null default 'active',
  price_cents int  not null default 2900,
  renews_at   date,
  credits     int  not null default 200,
  credits_max int  not null default 200,
  updated_at  timestamptz not null default now()
);
alter table public.subscriptions enable row level security;
drop policy if exists "subs: owner reads" on public.subscriptions;
create policy "subs: owner reads" on public.subscriptions for select using (auth.uid() = user_id);

-- ---------- runs: every diagnostic (Historial + export) ---------------------
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

-- ---------- prompt_config: the 4 editable AI Studio profiles (rows 1..4) -----
-- NOTE: no singleton constraint (Studio uses profiles 1..4). No seed row, so
-- the app uses the polished defaults in lib/prompt/config.ts until you tune
-- them in /studio (which then writes the row).
create table if not exists public.prompt_config (
  id                  integer primary key,
  role                text        not null default '',
  constraints         text        not null default '',
  technical           text        not null default '',
  model               text        not null default 'gemini-flash-latest',
  temperature         double precision not null default 0.5,
  output_instructions text        not null default '',
  updated_at          timestamptz not null default now()
);
-- drop the old single-row invariant if a previous run created it
alter table public.prompt_config drop constraint if exists prompt_config_singleton;
alter table public.prompt_config enable row level security;
drop policy if exists prompt_config_read  on public.prompt_config;
drop policy if exists prompt_config_write on public.prompt_config;
create policy prompt_config_read  on public.prompt_config for select using (true);
create policy prompt_config_write on public.prompt_config for all using (true) with check (true);

-- ---------- storage buckets -------------------------------------------------
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('cvs', 'cvs', false)
  on conflict (id) do nothing;

drop policy if exists "avatars: owner writes"  on storage.objects;
drop policy if exists "avatars: owner updates" on storage.objects;
drop policy if exists "avatars: public reads"  on storage.objects;
create policy "avatars: owner writes"  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: owner updates" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: public reads"  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "cvs: owner writes"  on storage.objects;
drop policy if exists "cvs: owner reads"   on storage.objects;
drop policy if exists "cvs: owner deletes" on storage.objects;
create policy "cvs: owner writes"  on storage.objects for insert
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cvs: owner reads"   on storage.objects for select
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cvs: owner deletes" on storage.objects for delete
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- backfill + seed super_admin -------------------------------------
-- Ensure every existing auth user has a profile row (the trigger only fires
-- for NEW signups), then promote your account.
insert into public.profiles (id)
  select id from auth.users
  on conflict (id) do nothing;

update public.profiles p
  set role = 'super_admin'
  from auth.users u
  where u.id = p.id and lower(u.email) = lower('ricardoacevedo@gmail.com');

-- Verify
select u.email, p.role
  from public.profiles p join auth.users u on u.id = p.id
  order by p.role desc, u.email;
