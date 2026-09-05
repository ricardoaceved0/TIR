-- ============================================================
-- Tu LinkedIn + Tu Momento — the onboarding inputs that replace
-- Conocimientos/Logros in the Screen 01 tracker and /profile.
--   linkedin_markdown / linkedin_filename: the candidate's LinkedIn
--     profile export (PDF/DOCX) converted to Markdown (like a CV).
--   momento: the candidate's chosen career situation (one of the ids
--     in lib/prompt/moments.ts, e.g. 're-entry', 'pivot').
-- Run after 0001_profile.sql. The older knowledge/achievements columns
-- are left in place (unused) so no data is dropped.
-- ============================================================

alter table public.profiles add column if not exists linkedin_markdown text;
alter table public.profiles add column if not exists linkedin_filename text;
alter table public.profiles add column if not exists momento text;
