# The Interview Room™

A member-area web app for interview preparation — the product spinoff of
*The Interview Edit™* with Mariana & Graciela Atencio.

Built with **Next.js (App Router)** + **Supabase** + **Google Gemini**, deployed on **Vercel**.

- **Vercel project:** `tie-2026`
- **Supabase project:** `knvykpqhrgbogicfoncs`

---

## What's here

The homepage (`/`) renders the **member area**: a five-stage click-through a
candidate moves through to prepare for a specific interview.

| Stage | Route/anchor | What it does |
|-------|--------------|--------------|
| 01 · Entrada | `/` (stage `s1`) | Intake: empresa, posición, fecha, job description, and a collapsible interview-configuration panel (process stage, interviewer LinkedIn/title, tools). An onboarding tracker ("Lo que la sala ya sabe de ti") links to the CV / Conocimientos / Logros a richer diagnostic needs. "Enviar" posts the intake to `/api/analyze`. |
| 02 · Diagnóstico | stage `s2` | **Real AI analysis.** Renders the structured diagnostic returned by Gemini — box_1 match rings, the gap + mitigation, adjetivo/resultado rewrites, and a generated question set. Shows a loading/shimmer state while the model reads the JD, and an error state on failure. |
| 03 · La Sala | stage `s3` | Practice room: pick the interviewer type, answer the question. |
| 04 · El Edit | stage `s4` | The edit: highlighted answer, rubric, progress. |
| 05 · Story Bank | stage `s5` | Deliverables, pocket stories, export kit. |

### Other routes

| Route | What it does |
|-------|--------------|
| `/profile` | Member account area (left-sidebar layout, mobile dropdown): **Cuenta** (name, avatar upload, email, password), **Mis CVs** (upload PDF/DOCX → Markdown, pick the active CV), **Conocimientos** (skills/certs not on the CV), **Logros** (career milestones), **Historial** (past runs + CSV/XLSX export), **Preferencias** (text size, language, reduce-motion, **dark-mode toggle**), **Subscripción** (plan, credits, billing), **Datos y privacidad** (account export + lock/delete). |
| `/login` · `/register` · `/forgot-password` · `/reset-password` | Full email/password auth on Supabase Auth. |
| `/admin-backend` | Admin backend (same layout), menu: **AI Studio** (`/studio`), **Usuarios** (`/admin-users`), **Lenguaje** (`/admin-lenguaje`). Gated to admin/super_admin. |
| `/admin-users` | Create/manage users and see the deletion-request list. Backed by `POST /api/admin/users` (service-role, server-guarded). |
| `/studio` | **AI Studio** — the backend prompt editor. Four saveable prompt profiles; edits the role/constraints/technical/output/model/temperature the diagnostic uses. See the prompt handoff doc below. |
| `/status` | Live green/red check of the Supabase connection. |

**Roles** (`regular` · `admin` · `super_admin`) live on `profiles.role`. The
header **ghost icon** shows only for admins/super_admins and links to
`/admin-backend`. `middleware.ts` gates routes server-side (with a dev bypass
via `NEXT_PUBLIC_DEV_ROLE` in non-production). See **`docs/USERS_SETUP.md`**.

**Theme & chrome.** Header and footer are shared (`SiteChrome.tsx`) and render on
every screen. Dark mode is OS-aware with a toggle in Preferencias; the choice
persists in `localStorage` (`tir:prefs`) and a pre-paint script avoids a flash of
the wrong theme. The footer's ES/EN toggle shares that same `language` preference.

### The AI diagnostic (screen 02)

The interesting part. The intake from Entrada is mixed with the **editable AI
Studio config** and a **fixed JSON contract**, sent to Gemini, and rendered as
structured data on screen 02.

```
Entrada intake ─┐
                ├─► /api/analyze ─► generateAnalysis() ─► Gemini ─► JSON ─► screen 02
Studio config ──┘                     (system = editable config + fixed contract)
```

- **Editable** (from `/studio`, per profile): role, constraints, technical
  requirements, output instructions, model, temperature.
- **Fixed** (locked in code so the UI can't break): the output JSON shape
  (`box_1`, `gap`, `adjetivo`, `resultado`, `question_set`), enforced both as
  a contract appended to the prompt and as Gemini's `responseSchema`.
- **Self-healing model** — Google keeps retiring model IDs; if the chosen model
  404s, the server lists the key's available models and picks a working flash.

**Full prompt reference:** [`docs/PROMPT_SYSTEM_HANDOFF.md`](docs/PROMPT_SYSTEM_HANDOFF.md)
— the whole prompt structure, every editable field, the fixed contract, and the
variables. Written to be uploaded into a Claude Project for prompt tuning.

`POST /api/cv/convert` converts an uploaded **PDF or DOCX** CV to Markdown
server-side (mammoth + unpdf).

### Project structure

```
app/
  page.tsx                     Homepage → renders <MemberArea/>
  member/MemberArea.tsx        The member-area client component (all 5 stages)
  member/member.css            Design tokens + styles (scoped under .tir), incl. dark theme + footer
  components/SiteChrome.tsx     Shared header + footer (SiteHeader / SiteFooter)
  components/AdminShell.tsx     Admin backend shell (left menu, role gating)
  profile/                      /profile — account area (client) + profile.css
  studio/                       /studio — AI Studio (client) + studio.css
  login|register|forgot-password|reset-password/   Auth screens
  admin-backend|admin-users|admin-lenguaje/        Admin screens
  not-found.tsx                On-brand 404 (auto-redirects home after 5s)
  api/
    analyze/                    POST — run the AI diagnostic
    prompt-config/              GET/PUT — load/save an AI Studio profile
    cv/convert/                 POST — CV (PDF/DOCX) → Markdown
    admin/users/                Admin user management (service-role)
    account/export/             Account data export (CSV + XLSX)
    account/lock/               Account lock / deletion request
  layout.tsx                    Root layout + pre-paint theme script
  globals.css                  Global styles (theme-aware canvas bg)
lib/
  ai/gemini.ts                 Gemini REST wrapper (+ model discovery/fallback)
  ai/generateAnalysis.ts       Provider-agnostic analysis entry point
  prompt/config.ts             Editable PromptConfig + defaults + {{var}} substitution
  prompt/diagnostic.ts         FIXED output contract + responseSchema + parser
  prompt/intake.ts             Entrada intake type + prompt data block
  prompt/store.ts              Load/save the 4 Studio profiles in Supabase
  auth/roles.ts                Role/account helpers
  supabase/                    Browser/server clients + middleware helper
middleware.ts                  Session refresh + route gating
supabase/migrations/           SQL: profiles, roles, CVs, runs, lists, prompt_config, account-lock
docs/
  PROMPT_SYSTEM_HANDOFF.md     The AI prompt structure + editable/fixed parts (for a Claude Project)
  AI_INTEGRATION_HANDOFF.md    Original AI-wiring handoff (historical)
  PROFILE_SETUP.md             Wiring /profile (auth, storage, subscriptions)
  USERS_SETUP.md               Migrations, service-role key, seeding the super admin
```

### Current state

- Member-area **UI is complete** and responsive (verified down to 402×874),
  in **light and dark**.
- The **AI diagnostic is live** (Gemini, free flash tier) — Entrada → screen 02
  renders a real structured analysis. Requires `GEMINI_API_KEY` on the server.
- Auth, roles, profile, CV conversion, run history, and the admin backend are
  wired against Supabase. Some product surfaces (La Sala / El Edit / Story Bank
  content, real subscription billing) still use demo data.

---

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in the values
npm run dev
```

Open <http://localhost:3000>. The member area renders regardless of env vars;
the AI diagnostic needs `GEMINI_API_KEY`, and `/status` turns green once your
Supabase anon key is valid.

## Environment variables

Local dev uses `.env.local` (git-ignored). See `.env.example` for the template.

| Name | Where it's used | Notes |
|------|-----------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | `https://knvykpqhrgbogicfoncs.supabase.co` — public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | public (protected by Row Level Security) |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | ⛔️ secret — needed for admin user management; never expose or commit |
| `GEMINI_API_KEY` | **server only** | Required for the AI diagnostic. Free key from <https://aistudio.google.com/apikey>. Never expose to the browser |
| `NEXT_PUBLIC_DEV_ROLE` | dev only | Optional. Bypasses route gating in non-production (e.g. `super_admin`) |

Set the same variables in the Vercel project (**Settings → Environment
Variables**) and redeploy — env-var changes only take effect on the next deploy.

> The **anon key** is browser-safe because data is protected by
> [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security).
> The **service_role key** and **GEMINI_API_KEY** are server-side only, never committed.

## Deploy

Every push to the default branch (`main`) auto-deploys to Vercel Production.
Add the environment variables before the first deploy.

## Database

Migrations live in `supabase/migrations/` (run them in the Supabase SQL editor,
in order). They set up `profiles` (+ RLS), roles, the active-CV flag, the `runs`
history table, profile lists (Conocimientos/Logros), the `prompt_config` table
(the 4 Studio profiles), and the account-lock columns. See `docs/USERS_SETUP.md`.

### Using Supabase from code

```tsx
// Client Component
"use client";
import { createClient } from "@/lib/supabase/client";
const supabase = createClient();

// Server Component / Route Handler
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient();
```

---

## Tuning the AI

The whole point of AI Studio is that the prompt is **editable without a deploy**.
To change how the diagnostic reads, edit the fields in `/studio` (or the defaults
in `lib/prompt/config.ts`). The output shape is intentionally **not** editable —
it's fixed in `lib/prompt/diagnostic.ts` so screen 02 always has the keys it
renders. The full structure, every editable field, and the variables are
documented in **[`docs/PROMPT_SYSTEM_HANDOFF.md`](docs/PROMPT_SYSTEM_HANDOFF.md)**.
