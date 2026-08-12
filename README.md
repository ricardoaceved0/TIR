# TIE 2026

Next.js (App Router) + Supabase, deployed on Vercel.

- **Vercel project:** `tie-2026`
- **Supabase project:** `knvykpqhrgbogicfoncs`

The homepage (`app/page.tsx`) shows a live green/red indicator of whether
the Supabase connection is configured correctly — a quick way to confirm
your keys are wired up.

---

## 1. Get your Supabase API keys

1. Open your project: <https://supabase.com/dashboard/project/knvykpqhrgbogicfoncs>
2. Go to **Project Settings** (gear icon) → **API**.
3. You need two values:

   | Value | Where | Safe to expose? |
   |-------|-------|-----------------|
   | **Project URL** | "Project URL" — `https://knvykpqhrgbogicfoncs.supabase.co` | ✅ Public |
   | **anon `public` key** | "Project API keys" → `anon` `public` | ✅ Public (ships in the browser) |
   | **service_role key** | "Project API keys" → `service_role` `secret` | ⛔️ **Secret — never expose** |

   > The **anon key** is safe in the browser because your data is protected
   > by [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security).
   > The **service_role key** bypasses RLS entirely — only ever use it in
   > server-side code, and never commit it or paste it anywhere public.

---

## 2. Configure environment variables

### Local development

`.env.local` is already created (and git-ignored). Open it and replace the
placeholders:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://knvykpqhrgbogicfoncs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste your anon key here>
```

Only add `SUPABASE_SERVICE_ROLE_KEY` if you write admin-level server code.

### Vercel (production)

1. Open the Vercel project **`tie-2026`** → **Settings** → **Environment
   Variables**.
2. Add the same variables (select all environments — Production, Preview,
   Development):

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://knvykpqhrgbogicfoncs.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | your anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` *(optional)* | your service_role key |

3. Redeploy (env-var changes only take effect on the next deploy).

> **Tip:** In the Supabase dashboard you can also use the **Vercel
> integration** (Project Settings → Integrations) to sync these variables
> automatically instead of copying them by hand.

---

## 3. Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The status card turns **green** once your
anon key is valid.

---

## 4. Deploy to Vercel

If the Vercel project isn't linked to this Git repo yet:

1. Vercel dashboard → **Add New… → Project** → import this repository.
2. Vercel auto-detects Next.js — no build config needed.
3. Add the environment variables from step 2 **before** the first deploy.
4. Deploy. Every push to your default branch then deploys automatically.

---

## Project structure

```
app/
  layout.tsx          Root layout
  page.tsx            Homepage + Supabase connection check
  globals.css         Styles
lib/supabase/
  client.ts           Browser client (Client Components)
  server.ts           Server client (Server Components / Actions / Route Handlers)
  middleware.ts       Session refresh helper
middleware.ts         Runs the session refresh on every request
.env.example          Template — safe to commit
.env.local            Your real keys — git-ignored, never commit
```

## Using Supabase in your code

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
