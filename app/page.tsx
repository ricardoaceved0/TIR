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
    const supabase = await createClient();
    const { error } = await supabase.auth.getUser();
    // "Auth session missing" just means no one is logged in — the
    // connection itself works. Any other error is a real problem.
    if (error && !/session|missing|jwt/i.test(error.message)) {
      return { ok: false, detail: error.message };
    }
    return { ok: true, detail: `Connected to ${url}` };
  } catch (e) {
    return {
      ok: false,
      detail: e instanceof Error ? e.message : "Unknown error",
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
