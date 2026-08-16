/**
 * Seed (or reset) a Super Admin user.
 *
 * Reads everything from env so no secret is ever committed:
 *   SUPABASE_URL                 (or NEXT_PUBLIC_SUPABASE_URL)
 *   SUPABASE_SERVICE_ROLE_KEY    (secret — from Supabase dashboard → API)
 *   SUPERADMIN_EMAIL
 *   SUPERADMIN_PASSWORD
 *
 * Run once, after applying supabase/migrations/0001_profile.sql and
 * 0002_roles.sql:
 *
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *   SUPERADMIN_EMAIL=ricardoacevedo@gmail.com SUPERADMIN_PASSWORD='...' \
 *   node scripts/seed-superadmin.mjs
 *
 * Idempotent: if the user already exists it resets the password and role.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.SUPERADMIN_EMAIL;
const password = process.env.SUPERADMIN_PASSWORD;

if (!url || !key || !email || !password) {
  console.error(
    "Missing env. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPERADMIN_EMAIL, SUPERADMIN_PASSWORD."
  );
  process.exit(1);
}

const admin = createClient(url, key, { auth: { persistSession: false } });

let userId;
const { data, error } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});

if (error) {
  if (/already|registered|exists/i.test(error.message)) {
    // Find the existing user and reset password.
    let page = 1;
    for (;;) {
      const { data: list, error: listErr } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (listErr) {
        console.error("listUsers failed:", listErr.message);
        process.exit(1);
      }
      const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (found) {
        userId = found.id;
        break;
      }
      if (list.users.length < 200) break;
      page += 1;
    }
    if (!userId) {
      console.error("User reported as existing but not found.");
      process.exit(1);
    }
    const { error: upErr } = await admin.auth.admin.updateUserById(userId, { password });
    if (upErr) {
      console.error("Password reset failed:", upErr.message);
      process.exit(1);
    }
  } else {
    console.error("createUser failed:", error.message);
    process.exit(1);
  }
} else {
  userId = data.user.id;
}

const { error: profErr } = await admin
  .from("profiles")
  .upsert({ id: userId, role: "super_admin" });
if (profErr) {
  console.error("Setting super_admin role failed:", profErr.message);
  process.exit(1);
}

console.log(`✓ super_admin ready: ${email}`);
