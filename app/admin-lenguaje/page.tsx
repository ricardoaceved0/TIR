import AdminShell, { AdminPanelHead } from "@/app/components/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminLenguajePage() {
  return (
    <AdminShell active="lang">
      <AdminPanelHead title="Lenguaje" hint="Gestión de traducciones de la interfaz." />
      <div className="adm-soon">
        <span className="adm-soon-badge">Coming Soon</span>
        <h2>Próximamente</h2>
        <p>La administración de idiomas y traducciones de la interfaz llegará pronto.</p>
      </div>
    </AdminShell>
  );
}
