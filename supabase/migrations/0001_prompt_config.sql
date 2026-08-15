-- Prompt Studio configuration: a single editable row (id = 1) holding the
-- "special instructions" the backend team tunes from /studio. Read/written
-- by lib/prompt/store.ts through the Supabase anon client.
--
-- Run this in the Supabase SQL editor (or via the CLI) for the
-- knvykpqhrgbogicfoncs project.

create table if not exists public.prompt_config (
  id                  integer primary key default 1,
  role                text        not null default '',
  constraints         text        not null default '',
  technical           text        not null default '',
  model               text        not null default 'gemini-3.5-flash',
  temperature         double precision not null default 0.5,
  output_instructions text        not null default '',
  updated_at          timestamptz not null default now(),
  -- enforce the single-row invariant
  constraint prompt_config_singleton check (id = 1)
);

-- Seed the default row so the Studio has content on first load.
insert into public.prompt_config
  (id, role, constraints, technical, model, temperature, output_instructions)
values (
  1,
  'You are an expert technical interviewer and executive talent strategist. Your task is to analyze a job posting and a candidate''s background to provide actionable interview preparation advice.',
  '- Rely only on facts provided in the candidate data and job details.' || chr(10) ||
  '- Adapt the advice specifically for an: {{interview.stage}} interview.' || chr(10) ||
  '- Respond in {{user.preferred_language}}.',
  'Response must come in strict JSON form',
  'gemini-3.5-flash',
  0.5,
  'Provide a structured preparation plan containing:' || chr(10) ||
  '1. Top 3 strengths to highlight for this specific round.' || chr(10) ||
  '2. 5 predicted questions tailored for a {{interview.stage}} interviewer.' || chr(10) ||
  '3. 2 reverse questions the candidate should ask the interviewer.'
)
on conflict (id) do nothing;

-- Row Level Security. For the POC we allow the anon key to read and write
-- the single config row. TIGHTEN THIS before production (e.g. restrict
-- writes to authenticated backend/admin users).
alter table public.prompt_config enable row level security;

drop policy if exists prompt_config_read on public.prompt_config;
create policy prompt_config_read
  on public.prompt_config for select
  using (true);

drop policy if exists prompt_config_write on public.prompt_config;
create policy prompt_config_write
  on public.prompt_config for all
  using (true)
  with check (true);
