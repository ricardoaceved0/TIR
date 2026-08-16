import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client for privileged server-side operations
 * (creating users, listing all users, writing roles). Uses the secret
 * SUPABASE_SERVICE_ROLE_KEY — it bypasses RLS, so it must ONLY ever be
 * imported from server code (Route Handlers / Server Actions), never from
 * a Client Component. Returns null when the key is not configured.
 */
export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
