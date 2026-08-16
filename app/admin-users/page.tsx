import AdminShell from "@/app/components/AdminShell";
import AdminUsersClient from "./AdminUsersClient";

export const dynamic = "force-dynamic";

export default function AdminUsersPage() {
  return (
    <AdminShell active="users">
      <AdminUsersClient />
    </AdminShell>
  );
}
