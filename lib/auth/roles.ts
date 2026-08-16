import type { SupabaseClient } from "@supabase/supabase-js";

export type Role = "regular" | "admin" | "super_admin";

export const ROLES: Role[] = ["regular", "admin", "super_admin"];

export const ROLE_LABELS: Record<Role, string> = {
  regular: "Regular",
  admin: "Admin",
  super_admin: "Super Admin",
};

export function isRole(v: unknown): v is Role {
  return v === "regular" || v === "admin" || v === "super_admin";
}

/** admin and super_admin get the backend; regular users don't. */
export function isAdminRole(role: Role | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

/**
 * Resolve the current user's role from a browser Supabase client.
 * Returns null when nobody is signed in.
 *
 * Dev affordance: in `next dev` only, NEXT_PUBLIC_DEV_ROLE overrides the
 * result so the admin UI can be worked on before auth is seeded. It is
 * inert in production builds (NODE_ENV === "production") and never affects
 * the server-side authorization in /api/admin/*, which always checks the
 * real session.
 */
export async function fetchRole(supabase: SupabaseClient): Promise<Role | null> {
  if (process.env.NODE_ENV === "development" && isRole(process.env.NEXT_PUBLIC_DEV_ROLE)) {
    return process.env.NEXT_PUBLIC_DEV_ROLE;
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return isRole(data?.role) ? data.role : "regular";
}
