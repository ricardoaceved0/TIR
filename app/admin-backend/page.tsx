import AdminShell, { AdminPanelHead } from "@/app/components/AdminShell";

export const dynamic = "force-dynamic";

export default function AdminBackendPage() {
  return (
    <AdminShell>
      <AdminPanelHead
        title="Bienvenido al backend"
        hint="Desde aquí administras la sala. Elige una sección en el menú de la izquierda."
      />
      <ul className="pf-panelhint" style={{ lineHeight: 2, marginTop: 4 }}>
        <li><b>AI Studio</b> — ajusta el prompt que la sala mezcla con cada Entrada.</li>
        <li><b>Usuarios</b> — crea cuentas y define su nivel de acceso.</li>
        <li><b>Lenguaje</b> — traducciones de la interfaz (próximamente).</li>
      </ul>
    </AdminShell>
  );
}
