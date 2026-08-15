import ProfileClient from "./ProfileClient";

export const dynamic = "force-dynamic";

/**
 * /profile — the member's account area: Cuenta (name, avatar, email,
 * password), Mis CVs (upload + convert to Markdown), Preferencias, and
 * Subscripción. The Supabase-backed writes activate once auth + Storage
 * exist (see docs/PROFILE_SETUP.md); the CV→Markdown conversion works today.
 */
export default function ProfilePage() {
  return <ProfileClient />;
}
