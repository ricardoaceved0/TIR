# Users & roles — setup

Three roles: **regular**, **admin**, **super_admin**.

- **regular** — a member of the sala. No backend access; the ghost icon is hidden.
- **admin** — sees the ghost icon → `/admin-backend`; can create **regular** users.
- **super_admin** — full access; can create users of any level.

The role lives on `public.profiles.role`. A user only ever reads their own
role (RLS); the column is written only through the **service role** — the
`/admin-users` screen and the seed script — never from the browser.

## What's in the app

| Piece | File |
|---|---|
| Login (session) | `/login` → `supabase.auth.signInWithPassword` |
| Ghost gating | `SiteHeader` shows the ghost only for admin/super_admin |
| Admin backend + menu | `/admin-backend`, shared `AdminShell` (AI Studio · Usuarios · Lenguaje) |
| Create users | `/admin-users` → `POST /api/admin/users` (service role, server-guarded) |
| Lenguaje | `/admin-lenguaje` (Coming Soon) |

`/api/admin/users` verifies the caller's session role **server-side** before
doing anything, then uses the service-role Admin API. A regular/anonymous
caller gets 401/403 regardless of the UI.

## 1 · Apply the migrations

Run in the Supabase SQL editor (or `supabase db push`), in order:

1. `supabase/migrations/0001_profile.sql`
2. `supabase/migrations/0002_roles.sql`

## 2 · Enable email auth

Supabase dashboard → **Authentication → Providers → Email**: enable it. Keep
**sign-ups enabled** if you want the public `/register` screen to work; if you
require email confirmation, new users get a "revisa tu correo" step before they
can log in.

### Auth gating & flows (in the app)

- **Every route is gated.** `middleware.ts` redirects any un-authenticated
  request to `/login?next=…`. Public pages: `/login`, `/register`,
  `/forgot-password`, `/reset-password` (and `/api/*`, which self-authorize).
- **/login** has **¿Olvidaste tu contraseña?** → `/forgot-password`
  (`resetPasswordForEmail`, redirects to `/reset-password`) and **Crear
  cuenta** → `/register` (`signUp`).
- **Logout** lives in `/profile → Cuenta` ("Cerrar sesión").
- Auth screens use a minimal header (no gear/bell/avatar).

### Avatar photos

`/profile → Cuenta → Cambiar foto` uploads to the **`avatars`** bucket at
`${uid}/avatar.<ext>` and stores the public URL on `profiles.avatar_url` +
auth metadata. The header shows the photo everywhere once set. The bucket +
per-user policies come from `0001_profile.sql`.

## 3 · Server env

Add to Vercel (and `.env.local` for local runs) — **server-side, never `NEXT_PUBLIC_`**:

```
SUPABASE_SERVICE_ROLE_KEY=<from Supabase dashboard → Settings → API>
```

`/api/admin/users` returns a clear "service role no configurada" error until this is set.

## 4 · Seed the super admin

The password is **not** stored in the repo. Create the requested super admin
by passing it through the environment once:

```bash
SUPABASE_URL=https://knvykpqhrgbogicfoncs.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=<service role key> \
SUPERADMIN_EMAIL=ricardoacevedo@gmail.com \
SUPERADMIN_PASSWORD='<the password you gave me>' \
node scripts/seed-superadmin.mjs
```

It creates the user (email pre-confirmed) and sets `role = super_admin`.
Re-running resets that user's password and role (idempotent). After this, log
in at `/login` — the ghost icon appears and `/admin-backend` opens.

## Dev affordance

To work on the admin UI before auth is seeded, run `next dev` with
`NEXT_PUBLIC_DEV_ROLE=super_admin` in `.env.local`. This forces the client
role **only in development** (`NODE_ENV==='development'`); it is inert in
production builds and never affects the server-side checks in `/api/admin/*`.
Remove it once real auth is in place.
