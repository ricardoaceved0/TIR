# The Interview Room™

A member-area web app for interview preparation — the product spinoff of
*The Interview Edit™* with Mariana & Graciela Atencio.

Built with **Next.js (App Router)** + **Supabase**, deployed on **Vercel**.

- **Vercel project:** `tie-2026`
- **Supabase project:** `knvykpqhrgbogicfoncs`

---

## What's here

The homepage (`/`) renders the **member area**: a five-stage click-through
that a candidate moves through to prepare for a specific interview.

| Stage | Route/anchor | What it does |
|-------|--------------|--------------|
| 01 · Entrada | `/` (stage `s1`) | Intake: empresa, posición, fecha (date picker), job description, and a collapsible interview-configuration panel (process stage, interviewer LinkedIn, tools). "Enviar" carries the inputs to Diagnóstico. |
| 02 · Diagnóstico | stage `s2` | The AI analysis area ("Análisis de la sala") plus the diagnostic breakdown and question set. |
| 03 · La Sala | stage `s3` | Practice room: pick the interviewer type, answer the question. |
| 04 · El Edit | stage `s4` | The edit: highlighted answer, rubric, progress. |
| 05 · Story Bank | stage `s5` | Deliverables, pocket stories, export kit. |

Other routes:

| Route | What it does |
|-------|--------------|
| `/profile` | Member account area (left-sidebar layout): **Cuenta** (name, avatar, email, password), **Mis CVs** (upload → Markdown), **Preferencias** (text size, language, motion), **Subscripción** (plan, credits, billing). Header profile → `/profile`, gear → `/profile#preferencias`. See **`docs/PROFILE_SETUP.md`**. |
| `/login` | Email/password sign-in (`supabase.auth.signInWithPassword`). |
| `/admin-backend` | Admin backend (same left-sidebar layout), menu: **AI Studio** (`/studio`), **Usuarios** (`/admin-users`), **Lenguaje** (`/admin-lenguaje`). Gated to admin/super_admin. |
| `/admin-users` | Create users (login, password, access level) via `POST /api/admin/users` (service-role, server-guarded). |
| `/studio` | Backend **Prompt Studio** — edits the prompt config the AI mixes with each intake. |
| `/status` | Live green/red check of the Supabase connection. |

**Roles** (`regular` · `admin` · `super_admin`) live on `profiles.role`. The
header **ghost icon** shows only for admins/super_admins and links to
`/admin-backend`. See **`docs/USERS_SETUP.md`** (migrations, service-role key,
and seeding the super admin — the password is passed via env, never committed).

`POST /api/cv/convert` converts an uploaded **PDF or DOCX** CV to Markdown
server-side (mammoth + unpdf) — fully functional, no auth required.

### Project structure

```
app/
  page.tsx              Homepage → renders <MemberArea/>
  member/
    MemberArea.tsx      The member-area client component (all 5 stages)
    member.css          Design tokens + styles (scoped under .tir)
  components/SiteChrome.tsx   Shared header + footer (SiteHeader / SiteFooter)
  profile/              /profile — account area (client) + profile.css
  studio/               /studio — Prompt Studio (client) + studio.css
  api/cv/convert/       CV → Markdown route (PDF + DOCX, server-side)
  status/page.tsx       Supabase connection check
  layout.tsx            Root layout
  globals.css           Global styles
lib/supabase/           Browser/server clients + middleware helper
middleware.ts           Session refresh on every request
supabase/migrations/    SQL for the profile tables, RLS, and storage buckets
docs/
  AI_INTEGRATION_HANDOFF.md   How to wire the AI analysis
  PROFILE_SETUP.md            How to finish wiring /profile (auth, storage, subscriptions)
```

### Current state

- The member-area **UI is complete** and responsive (verified down to 402×874).
- Content is **static demo data** (Valentina R. / Lumen Health).
- The **AI analysis is simulated** — "Enviar" on Entrada jumps to Diagnóstico
  and shows a loading state that fills after a timeout. The real Anthropic API
  call is not wired yet. See **`docs/AI_INTEGRATION_HANDOFF.md`** to build it.

---

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The member area renders regardless of env vars
(it's static). `/status` turns green once your Supabase anon key is valid.

## Environment variables

Local dev uses `.env.local` (git-ignored). See `.env.example` for the template.

| Name | Where it's used | Notes |
|------|-----------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | `https://knvykpqhrgbogicfoncs.supabase.co` — public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | public (protected by Row Level Security) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only, optional | ⛔️ secret — never expose or commit |
| `ANTHROPIC_API_KEY` | **server only** | Required once the AI analysis is wired (see handoff doc) — never expose to the browser |

Set the same variables in the Vercel project (**Settings → Environment
Variables**) and redeploy — env-var changes only take effect on the next deploy.

> The **anon key** is browser-safe because data is protected by
> [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security).
> The **service_role key** bypasses RLS — server-side only, never committed.

## Deploy

Every push to the default branch (`main`) auto-deploys to Vercel Production.
Add the environment variables before the first deploy.

## Using Supabase

**Client Component:**

```tsx
"use client";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data } = await supabase.from("your_table").select();
```

**Server Component / Route Handler:**

```tsx
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data } = await supabase.from("your_table").select();
```

---

## Next steps

The biggest pieces of remaining work, roughly in order:

1. **Wire the AI analysis** — `docs/AI_INTEGRATION_HANDOFF.md` (start a fresh session with it).
2. Model the data in Supabase and persist the intake + Story Bank.
3. Auth (login/registro), account/subscription, and the Clase/Cuenta screens.

See the imported project backlog for the full task list.
