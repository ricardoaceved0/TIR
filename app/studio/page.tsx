import AdminShell from "@/app/components/AdminShell";
import StudioClient from "./StudioClient";

export const dynamic = "force-dynamic";

/**
 * Prompt Studio — the backend team's screen to edit the "special
 * instructions" that get mixed with each candidate's Entrada inputs
 * before the AI call. Persists to Supabase via /api/prompt-config.
 * Rendered inside the admin backend shell (left menu, role-gated).
 */
export default function StudioPage() {
  return (
    <AdminShell active="studio" bare>
      <StudioClient />
    </AdminShell>
  );
}
