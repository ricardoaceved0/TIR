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
    // Validate against the auth health endpoint. A real round-trip that
    // both reaches the project AND checks the publishable key: the gateway
    // rejects an unknown key with 401 here, so 200 = key accepted + project
    // reachable. We deliberately do NOT probe `/rest/v1/` — its root
    // (schema introspection) endpoint requires a *secret* key under
    // Supabase's new key system and returns 401 (INVALID_API_KEY_TYPE) for
    // a publishable key, which is a browser-safe key and correct to use here.
    const res = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) {
      return { ok: false, detail: `Reached ${url} but the key was rejected (HTTP ${res.status}). Check NEXT_PUBLIC_SUPABASE_ANON_KEY.` };
    }
    if (!res.ok) {
      return { ok: false, detail: `Reached ${url} but got HTTP ${res.status}.` };
    }
    return { ok: true, detail: `Connected to ${url} (auth API reachable, key valid)` };
  } catch (e) {
    return {
      ok: false,
      detail: `Could not reach ${url}: ${e instanceof Error ? e.message : "unknown error"}`,
    };
  }
}

export default async function StatusPage() {
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
