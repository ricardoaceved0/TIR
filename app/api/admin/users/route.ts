import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isAdminRole, isRole, Role } from "@/lib/auth/roles";
import type { SupabaseClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Gate = { role: Role; id: string };

/** Verify the caller has an admin/super_admin session. Returns role + id. */
async function requireAdmin(): Promise<Gate | { error: string; status: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado.", status: 401 };
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role: Role = isRole(data?.role) ? data.role : "regular";
  if (!isAdminRole(role)) return { error: "No autorizado.", status: 403 };
  return { role, id: user.id };
}

/**
 * Who may a given actor act on (change role / delete / reset password)?
 *   super_admin → anyone.
 *   admin       → only regular users (never an admin or super_admin).
 * This is what keeps super_admins un-removable by admins.
 */
function canManage(actorRole: Role, targetRole: Role): boolean {
  if (actorRole === "super_admin") return true;
  if (actorRole === "admin") return targetRole === "regular";
  return false;
}

/** Read a target user's current role (defaults to 'regular' if no row). */
async function targetRole(admin: SupabaseClient, id: string): Promise<Role> {
  const { data } = await admin.from("profiles").select("role").eq("id", id).single();
  return isRole(data?.role) ? data.role : "regular";
}

const NO_SERVICE = {
  ok: false as const,
  error: "SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor.",
};

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return Response.json({ ok: false, error: gate.error }, { status: gate.status });

  const admin = createServiceClient();
  if (!admin) return Response.json(NO_SERVICE, { status: 500 });

  const { data: list, error } = await admin.auth.admin.listUsers();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, role, full_name, locked, deletion_requested_at");
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const users = list.users.map((u) => {
    const p = byId.get(u.id);
    return {
      id: u.id,
      email: u.email,
      role: (isRole(p?.role) ? p?.role : "regular") as Role,
      full_name: p?.full_name ?? "",
      locked: Boolean(p?.locked),
      deletion_requested_at: p?.deletion_requested_at ?? null,
      created_at: u.created_at,
    };
  });

  // `me` lets the client render only the controls this caller is allowed to use.
  return Response.json({ ok: true, users, me: { id: gate.id, role: gate.role } });
}

/**
 * PATCH is action-based:
 *   action "role"           → change a user's access level (super_admin only)
 *   action "reset_password" → set a new password (per canManage)
 *   action "unlock" (default) → clear a lock / deletion request (admin+)
 */
export async function PATCH(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return Response.json({ ok: false, error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) return Response.json({ ok: false, error: "Falta el id." }, { status: 400 });
  const action = String(body?.action ?? "unlock");

  const admin = createServiceClient();
  if (!admin) return Response.json(NO_SERVICE, { status: 500 });

  if (action === "role") {
    if (gate.role !== "super_admin") {
      return Response.json(
        { ok: false, error: "Solo un Super Admin puede cambiar niveles de acceso." },
        { status: 403 }
      );
    }
    if (id === gate.id) {
      return Response.json(
        { ok: false, error: "No puedes cambiar tu propio nivel de acceso." },
        { status: 400 }
      );
    }
    const newRole = body?.role;
    if (!isRole(newRole)) {
      return Response.json({ ok: false, error: "Nivel de acceso inválido." }, { status: 400 });
    }
    const { error } = await admin.from("profiles").upsert({ id, role: newRole });
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  if (action === "reset_password") {
    const password = String(body?.password ?? "");
    if (password.length < 8) {
      return Response.json(
        { ok: false, error: "La contraseña debe tener al menos 8 caracteres." },
        { status: 400 }
      );
    }
    if (!canManage(gate.role, await targetRole(admin, id))) {
      return Response.json(
        { ok: false, error: "No tienes permiso para gestionar esta cuenta." },
        { status: 403 }
      );
    }
    const { error } = await admin.auth.admin.updateUserById(id, { password });
    if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  }

  // default: unlock a locked / deletion-requested account
  const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: "none" });
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  await admin.from("profiles").update({ locked: false, deletion_requested_at: null }).eq("id", id);
  return Response.json({ ok: true });
}

/** Permanently delete an account and its data (per canManage; never yourself). */
export async function DELETE(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return Response.json({ ok: false, error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => null);
  const id = String(body?.id ?? "");
  if (!id) return Response.json({ ok: false, error: "Falta el id." }, { status: 400 });
  if (id === gate.id) {
    return Response.json({ ok: false, error: "No puedes eliminar tu propia cuenta." }, { status: 400 });
  }

  const admin = createServiceClient();
  if (!admin) return Response.json(NO_SERVICE, { status: 500 });

  if (!canManage(gate.role, await targetRole(admin, id))) {
    return Response.json(
      { ok: false, error: "No tienes permiso para eliminar esta cuenta." },
      { status: 403 }
    );
  }

  // Removing the auth user cascades to profiles/cvs/runs (FK on delete cascade).
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

export async function POST(req: Request) {
  const gate = await requireAdmin();
  if ("error" in gate) return Response.json({ ok: false, error: gate.error }, { status: gate.status });

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const role = body?.role;
  const fullName = String(body?.name ?? "").trim();

  if (!email || !password) {
    return Response.json({ ok: false, error: "Correo y contraseña son obligatorios." }, { status: 400 });
  }
  if (password.length < 8) {
    return Response.json({ ok: false, error: "La contraseña debe tener al menos 8 caracteres." }, { status: 400 });
  }
  if (!isRole(role)) {
    return Response.json({ ok: false, error: "Nivel de acceso inválido." }, { status: 400 });
  }
  // Only a super_admin may mint admins or other super_admins.
  if (gate.role !== "super_admin" && role !== "regular") {
    return Response.json(
      { ok: false, error: "Solo un Super Admin puede crear administradores." },
      { status: 403 }
    );
  }

  const admin = createServiceClient();
  if (!admin) return Response.json(NO_SERVICE, { status: 500 });

  const { data: created, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: fullName ? { full_name: fullName } : undefined,
  });
  if (error || !created?.user) {
    return Response.json({ ok: false, error: error?.message ?? "No se pudo crear el usuario." }, { status: 400 });
  }

  await admin.from("profiles").upsert({ id: created.user.id, role, full_name: fullName });

  return Response.json({ ok: true, user: { id: created.user.id, email, role, full_name: fullName } });
}
