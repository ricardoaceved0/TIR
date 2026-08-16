-- ============================================================
-- Profile feature — schema, RLS, and storage.
-- Idempotent: safe to re-run (drops each policy before creating it).
-- Run in the Supabase SQL editor (or `supabase db push`) once you
-- want the /profile writes to persist. Requires email auth enabled.
-- See docs/PROFILE_SETUP.md.
-- ============================================================

-- ---------- profiles: display name, avatar, preferences ----------
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

-- ---------- cvs: uploaded CV + its Markdown conversion ----------
create table if not exists public.cvs (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  filename     text not null,
  storage_path text,               -- object path in the `cvs` bucket
  markdown     text,               -- output of /api/cv/convert
  created_at   timestamptz not null default now()
);

alter table public.cvs enable row level security;

drop policy if exists "cvs: owner reads"   on public.cvs;
drop policy if exists "cvs: owner inserts" on public.cvs;
drop policy if exists "cvs: owner deletes" on public.cvs;
create policy "cvs: owner reads"   on public.cvs for select using (auth.uid() = user_id);
create policy "cvs: owner inserts" on public.cvs for insert with check (auth.uid() = user_id);
create policy "cvs: owner deletes" on public.cvs for delete using (auth.uid() = user_id);

-- ---------- subscriptions: plan, credits, renewal ----------
create table if not exists public.subscriptions (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  plan        text not null default 'acceso_activo',
  status      text not null default 'active',      -- active | paused | canceled
  price_cents int  not null default 2900,
  renews_at   date,
  credits     int  not null default 200,
  credits_max int  not null default 200,
  updated_at  timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "subs: owner reads" on public.subscriptions;
create policy "subs: owner reads" on public.subscriptions for select using (auth.uid() = user_id);
-- writes come from the server (Stripe webhook / service role), not the client.

-- ---------- storage buckets ----------
-- avatars: public-read (so <img> works without signed URLs)
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- cvs: private (served via signed URLs only)
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

-- object policies: users may manage only files under a folder named by their uid
drop policy if exists "avatars: owner writes"  on storage.objects;
drop policy if exists "avatars: owner updates" on storage.objects;
drop policy if exists "avatars: public reads"  on storage.objects;
create policy "avatars: owner writes" on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: owner updates" on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars: public reads" on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "cvs: owner writes"  on storage.objects;
drop policy if exists "cvs: owner reads"   on storage.objects;
drop policy if exists "cvs: owner deletes" on storage.objects;
create policy "cvs: owner writes" on storage.objects for insert
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cvs: owner reads" on storage.objects for select
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "cvs: owner deletes" on storage.objects for delete
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
