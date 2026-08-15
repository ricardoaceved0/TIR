import StudioClient from "./StudioClient";

export const dynamic = "force-dynamic";

/**
 * Prompt Studio — the backend team's screen to edit the "special
 * instructions" that get mixed with each candidate's Entrada inputs
 * before the AI call. Persists to Supabase via /api/prompt-config.
 *
 * NOTE: this screen is unauthenticated for the POC. Gate it behind auth
 * before exposing it in production.
 */
export default function StudioPage() {
  return <StudioClient />;
}
