# Profile — what's wired and how to finish it

The `/profile` page (Layout: left sidebar) ships with four sections:

| Section | Status today | To go live |
|---|---|---|
| **Cuenta** — name, avatar, email, password | UI complete; save calls `supabase.auth.updateUser` + `profiles` upsert, guarded on a session | Enable auth + run the migration |
| **Mis CVs** — upload → Markdown, persisted, pick the active one | Converts via `POST /api/cv/convert`; saves each CV to the `cvs` table; "Usar/En uso" marks one active (`cvs.is_active`). The active CV's Markdown is sent as `cv_text` to `/api/analyze` for the diagnostic. | Run `0003_cv_active.sql`; needs auth |
| **Preferencias** — text size, language, reduce motion | **Functional now**, stored in `localStorage` | Mirror to `profiles.preferences` on save |
| **Subscripción** — plan, credits, billing | UI complete with demo data | Read from `subscriptions`; write via Stripe webhook |

The header **profile circle → `/profile`** and the **gear → `/profile#preferencias`**.

---

## Prerequisite: authentication

There is **no login yet**. The account writes (name/email/password, avatar
upload, saving CVs) need an authenticated session, so build a Supabase email
auth flow first (login + registro + a route that establishes the session).
Until then `/profile` shows a banner and the account form reports it needs a
session — the CV converter and preferences already work without one.

## 1 · Run the schema

Apply `supabase/migrations/0001_profile.sql` (Supabase SQL editor, or
`supabase db push`). It creates `profiles`, `cvs`, `subscriptions` with
owner-only RLS, an auto-profile trigger on signup, and the `avatars`
(public) + `cvs` (private) storage buckets with per-user folder policies.

## 2 · Environment variables

Already used by the app (set locally in `.env.local` and in Vercel):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — client reads/writes under RLS.
- `SUPABASE_SERVICE_ROLE_KEY` — **server only**, for the future Stripe webhook that writes `subscriptions`. Never expose to the browser.

## 3 · Persisting CVs (optional, after auth)

`/api/cv/convert` is stateless — it returns Markdown and stores nothing. To
save a CV to the user's library after conversion:

1. Upload the original file to the `cvs` bucket at `${user.id}/${filename}`.
2. Insert a `cvs` row `{ user_id, filename, storage_path, markdown }`.
3. On load, list the user's `cvs` rows into the "Mis CVs" list.

## 4 · Avatar upload (after auth)

In `MainPanel`, on file pick: `supabase.storage.from('avatars').upload(\`${user.id}/avatar.<ext>\`, file, { upsert: true })`,
then save the public URL to `profiles.avatar_url` and `auth.updateUser({ data: { avatar_url } })`.

## 5 · Subscription data

Replace the demo constants in `SubPanel` with a read from `subscriptions`
(`select … where user_id = auth.uid()`). Real plan/credit changes should come
from a Stripe webhook writing that table with the service-role key — not from
the browser.

## CV → Markdown conversion (already done)

`app/api/cv/convert/route.ts` (Node runtime): accepts `multipart/form-data`
with a `file` field, parses **DOCX** via `mammoth` and **PDF** via `unpdf`,
returns `{ ok, markdown, filename }`. 8 MB limit; scanned/image-only PDFs
return a clear error (add OCR later if needed).
