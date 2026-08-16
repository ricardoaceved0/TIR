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
  const acc = await fetchAccount(supabase);
  return acc ? acc.role : null;
}

export type Account = {
  id: string | null;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: Role;
};

/**
 * Resolve the signed-in user's identity (email, display name, role) from a
 * browser Supabase client. Returns null when nobody is signed in. Same dev
 * override as before (NEXT_PUBLIC_DEV_ROLE, plus optional NEXT_PUBLIC_DEV_NAME),
 * active only in `next dev` and inert in production.
 */
export async function fetchAccount(supabase: SupabaseClient): Promise<Account | null> {
  if (process.env.NODE_ENV === "development" && isRole(process.env.NEXT_PUBLIC_DEV_ROLE)) {
    return {
      id: null,
      email: "dev@local",
      fullName: process.env.NEXT_PUBLIC_DEV_NAME ?? null,
      avatarUrl: null,
      role: process.env.NEXT_PUBLIC_DEV_ROLE,
    };
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("role, full_name, avatar_url")
    .eq("id", user.id)
    .single();
  const metaName =
    typeof user.user_metadata?.full_name === "string" ? user.user_metadata.full_name : null;
  const metaAvatar =
    typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null;
  return {
    id: user.id,
    email: user.email ?? null,
    fullName: typeof data?.full_name === "string" && data.full_name ? data.full_name : metaName,
    avatarUrl: typeof data?.avatar_url === "string" && data.avatar_url ? data.avatar_url : metaAvatar,
    role: isRole(data?.role) ? data.role : "regular",
  };
}

/** Two-letter avatar initials from a name (preferred) or email. */
export function initialsFrom(name?: string | null, email?: string | null): string {
  const n = (name ?? "").trim();
  if (n) {
    const parts = n.split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  const e = (email ?? "").trim();
  return e ? e.slice(0, 2).toUpperCase() : "";
}
