import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/admin";
import { isAdminRole, isRole, Role } from "@/lib/auth/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Verify the caller has an admin/super_admin session. Returns their role. */
async function requireAdmin(): Promise<{ role: Role } | { error: string; status: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "No autenticado.", status: 401 };
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role: Role = isRole(data?.role) ? data.role : "regular";
  if (!isAdminRole(role)) return { error: "No autorizado.", status: 403 };
  return { role };
}

export async function GET() {
  const gate = await requireAdmin();
  if ("error" in gate) return Response.json({ ok: false, error: gate.error }, { status: gate.status });

  const admin = createServiceClient();
  if (!admin) {
    return Response.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor." },
      { status: 500 }
    );
  }

  const { data: list, error } = await admin.auth.admin.listUsers();
  if (error) return Response.json({ ok: false, error: error.message }, { status: 500 });

  const { data: profiles } = await admin.from("profiles").select("id, role, full_name");
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  const users = list.users.map((u) => ({
    id: u.id,
    email: u.email,
    role: (isRole(byId.get(u.id)?.role) ? byId.get(u.id)?.role : "regular") as Role,
    full_name: byId.get(u.id)?.full_name ?? "",
    created_at: u.created_at,
  }));

  return Response.json({ ok: true, users });
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
  if (!admin) {
    return Response.json(
      { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY no está configurada en el servidor." },
      { status: 500 }
    );
  }

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
