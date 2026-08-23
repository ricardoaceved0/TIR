/**
 * POST /api/account/lock
 * "Delete account" — locks the signed-in user out (bans them so they can't
 * sign in or reset their password) WITHOUT deleting data, and flags the
 * profile so an admin can purge the records later. Uses the service role.
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });

  const admin = createServiceClient();
  if (!admin) {
    return NextResponse.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor." },
      { status: 500 }
    );
  }

  // Ban ~100 years — blocks sign-in and token refresh (reversible by an admin
  // with ban_duration: 'none'). No data is deleted.
  const { error } = await admin.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  await admin
    .from("profiles")
    .upsert({ id: user.id, locked: true, deletion_requested_at: new Date().toISOString() });

  // Best-effort: clear the current session server-side.
  try {
    await supabase.auth.signOut();
  } catch {
    /* ignore */
  }

  return NextResponse.json({ ok: true });
}
