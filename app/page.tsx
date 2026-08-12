import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * Homepage that verifies the Supabase connection. It attempts a
 * lightweight auth call — if the client is configured correctly with
 * valid env vars, the request reaches Supabase and returns without a
 * transport error (even when no user is signed in).
 */
async function checkSupabase(): Promise<{
  ok: boolean;
  detail: string;
}> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || url.includes("your-project-ref") || !key || key === "your-anon-key") {
    return {
      ok: false,
      detail:
        "Environment variables not set. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    };
  }

  try {
    // Make a real round-trip to the project's REST endpoint. This both
    // reaches the server AND validates the key: 200 = key valid + project
    // reachable, 401 = invalid/expired key. (getUser() alone short-circuits
    // offline when there's no session, so it can't prove either.)
    // Send only the `apikey` header. New-style Supabase keys
    // (sb_publishable_… / sb_secret_…) are NOT JWTs, so passing the key
    // as `Authorization: Bearer` makes the REST layer try to parse it as a
    // JWT and return 401. `apikey` alone authenticates as the anon role.
    const res = await fetch(`${url}/rest/v1/`, {
      headers: { apikey: key },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, detail: `Reached ${url} but the key was rejected (HTTP ${res.status}). Check NEXT_PUBLIC_SUPABASE_ANON_KEY.` };
    }
    if (!res.ok) {
      return { ok: false, detail: `Reached ${url} but got HTTP ${res.status}.` };
    }
    return { ok: true, detail: `Connected to ${url} (key validated, HTTP ${res.status})` };
  } catch (e) {
    return {
      ok: false,
      detail: `Could not reach ${url}: ${e instanceof Error ? e.message : "unknown error"}`,
    };
  }
}

export default async function Home() {
  const status = await checkSupabase();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        gap: "1.5rem",
      }}
    >
      <h1 style={{ fontSize: "2rem", margin: 0 }}>TIE 2026</h1>
      <p style={{ color: "var(--muted)", margin: 0 }}>
        Next.js + Supabase on Vercel
      </p>

      <div
        style={{
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "1.25rem 1.5rem",
          maxWidth: 560,
          width: "100%",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontWeight: 600,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: status.ok ? "var(--ok)" : "var(--err)",
              display: "inline-block",
            }}
          />
          {status.ok ? "Supabase connected" : "Supabase not connected"}
        </div>
        <p
          style={{
            color: "var(--muted)",
            fontSize: "0.9rem",
            marginBottom: 0,
            wordBreak: "break-word",
          }}
        >
          {status.detail}
        </p>
      </div>

      <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
        See <code>README.md</code> for setup and API-key instructions.
      </p>
    </main>
  );
}
