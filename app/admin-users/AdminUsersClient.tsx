"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPanelHead } from "@/app/components/AdminShell";
import { ROLE_LABELS, Role } from "@/lib/auth/roles";

type UserRow = {
  id: string;
  email: string | undefined;
  role: Role;
  full_name: string;
  locked?: boolean;
  deletion_requested_at?: string | null;
  created_at?: string;
};

export default function AdminUsersClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("regular");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const [users, setUsers] = useState<UserRow[]>([]);
  const [me, setMe] = useState<{ id: string; role: Role } | null>(null);
  const [listErr, setListErr] = useState("");
  const [rowMsg, setRowMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [rowBusy, setRowBusy] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoadingList(true);
    setListErr("");
    try {
      const res = await fetch("/api/admin/users", { cache: "no-store" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setUsers(data.users as UserRow[]);
      setMe(data.me ?? null);
    } catch (e) {
      setListErr(e instanceof Error ? e.message : "No se pudieron cargar los usuarios.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  // Mirror of the server rule (UI gating only — the API enforces it for real).
  const isSelf = (u: UserRow) => Boolean(me && me.id === u.id);
  const canManage = (u: UserRow) => {
    if (!me) return false;
    if (me.role === "super_admin") return true;
    if (me.role === "admin") return u.role === "regular";
    return false;
  };
  const canChangeRole = (u: UserRow) => me?.role === "super_admin" && !isSelf(u);

  const changeRole = async (u: UserRow, newRole: Role) => {
    if (newRole === u.role) return;
    setRowBusy(u.id);
    setRowMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: u.id, action: "role", role: newRole }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setRowMsg({ kind: "ok", text: `${u.email}: nivel cambiado a ${ROLE_LABELS[newRole]}.` });
      loadUsers();
    } catch (e) {
      setRowMsg({ kind: "err", text: e instanceof Error ? e.message : "No se pudo cambiar el nivel." });
    } finally {
      setRowBusy(null);
    }
  };

  const resetPassword = async (u: UserRow) => {
    const pw = window.prompt(`Nueva contraseña para ${u.email} (mínimo 8 caracteres):`);
    if (pw == null) return; // cancelled
    if (pw.length < 8) {
      setRowMsg({ kind: "err", text: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }
    setRowBusy(u.id);
    setRowMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: u.id, action: "reset_password", password: pw }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setRowMsg({ kind: "ok", text: `Contraseña restablecida para ${u.email}.` });
    } catch (e) {
      setRowMsg({ kind: "err", text: e instanceof Error ? e.message : "No se pudo restablecer la contraseña." });
    } finally {
      setRowBusy(null);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const unlock = async (u: UserRow) => {
    setRowBusy(u.id);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: u.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      loadUsers();
    } catch (e) {
      setListErr(e instanceof Error ? e.message : "No se pudo desbloquear.");
    } finally {
      setRowBusy(null);
    }
  };

  const purge = async (u: UserRow) => {
    if (!window.confirm(`Eliminar DEFINITIVAMENTE la cuenta de ${u.email} y todos sus datos? Esta acción no se puede deshacer.`)) {
      return;
    }
    setRowBusy(u.id);
    setRowMsg(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: u.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setRowMsg({ kind: "ok", text: `Cuenta eliminada: ${u.email}.` });
      loadUsers();
    } catch (e) {
      setRowMsg({ kind: "err", text: e instanceof Error ? e.message : "No se pudo eliminar." });
    } finally {
      setRowBusy(null);
    }
  };

  const locked = users.filter((u) => u.locked);
  const fmtDate = (iso?: string | null) => {
    if (!iso) return "";
    try {
      return new Date(iso).toLocaleDateString("es", { dateStyle: "medium" });
    } catch {
      return iso;
    }
  };

  const create = async () => {
    setMsg(null);
    if (!email || !password) {
      setMsg({ kind: "err", text: "Correo y contraseña son obligatorios." });
      return;
    }
    if (password.length < 8) {
      setMsg({ kind: "err", text: "La contraseña debe tener al menos 8 caracteres." });
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setMsg({ kind: "ok", text: `Usuario creado: ${email}` });
      setName("");
      setEmail("");
      setPassword("");
      setRole("regular");
      loadUsers();
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "No se pudo crear el usuario." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <AdminPanelHead
        title="Usuarios"
        hint="Crea cuentas de acceso a la sala y define su nivel: Regular, Admin o Super Admin. Solo un Super Admin puede crear administradores."
      />

      <div className="adm-userform">
        <div className="adm-full">
          <label className="fld" htmlFor="u-name">Nombre (opcional)</label>
          <input className="txt" id="u-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre completo" />
        </div>
        <div>
          <label className="fld" htmlFor="u-email">Correo (login)</label>
          <input className="txt" id="u-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@empresa.com" />
        </div>
        <div>
          <label className="fld" htmlFor="u-pw">Contraseña</label>
          <input className="txt" id="u-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
        </div>
        <div className="adm-full">
          <label className="fld" htmlFor="u-role">Nivel de acceso</label>
          <select className="txt" id="u-role" value={role} onChange={(e) => setRole(e.target.value as Role)}>
            <option value="regular">Regular — usuario de la sala</option>
            <option value="admin">Admin — accede al backend</option>
            <option value="super_admin">Super Admin — control total</option>
          </select>
        </div>
      </div>

      <div className="adm-actions">
        {msg && <span className={`adm-msg ${msg.kind}`}>{msg.text}</span>}
        <button className="btn" type="button" onClick={create} disabled={busy}>
          {busy ? "Creando…" : "Crear usuario"}
        </button>
      </div>

      <div className="kicker-rule" />

      <div className="adm-userlist">
        <div className="adm-userlist-title">
          <div className="eyebrow" style={{ margin: 0 }}>Usuarios existentes</div>
          <button className="pf-linkbtn" onClick={loadUsers}>Refrescar</button>
        </div>
        {me?.role === "super_admin" && (
          <p className="adm-empty" style={{ marginTop: -4, marginBottom: 10 }}>
            Cambia el nivel de acceso, restablece la contraseña o elimina cualquier cuenta.
          </p>
        )}

        {rowMsg && <p className={`adm-msg ${rowMsg.kind}`} style={{ marginBottom: 8 }}>{rowMsg.text}</p>}
        {loadingList && <p className="adm-empty">Cargando…</p>}
        {!loadingList && listErr && <p className="adm-msg err">{listErr}</p>}
        {!loadingList && !listErr && users.length === 0 && <p className="adm-empty">Todavía no hay usuarios.</p>}

        {users.map((u) => (
          <div className="adm-userrow" key={u.id}>
            <div>
              <div className="adm-user-email">
                {u.email}
                {isSelf(u) && <span className="adm-you"> · tú</span>}
              </div>
              {u.full_name && <div className="adm-user-name">{u.full_name}</div>}
            </div>
            <div className="adm-row-right">
              <div className="adm-row-badges">
                {u.locked && <span className="adm-rolebadge locked">Bloqueado</span>}
                {canChangeRole(u) ? (
                  <select
                    className="txt adm-rolesel"
                    aria-label={`Nivel de acceso de ${u.email}`}
                    value={u.role}
                    disabled={rowBusy === u.id}
                    onChange={(e) => changeRole(u, e.target.value as Role)}
                  >
                    <option value="regular">Regular</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                ) : (
                  <span className={`adm-rolebadge ${u.role}`}>{ROLE_LABELS[u.role]}</span>
                )}
              </div>
              {canManage(u) && !isSelf(u) && (
                <div className="adm-row-actions">
                  <button className="pf-linkbtn" disabled={rowBusy === u.id} onClick={() => resetPassword(u)}>
                    Restablecer contraseña
                  </button>
                  <button className="pf-linkbtn danger" disabled={rowBusy === u.id} onClick={() => purge(u)}>
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="kicker-rule" />

      <div className="adm-userlist">
        <div className="adm-userlist-title">
          <div className="eyebrow" style={{ margin: 0 }}>Solicitudes de eliminación</div>
          <button className="pf-linkbtn" onClick={loadUsers}>Refrescar</button>
        </div>
        <p className="adm-empty" style={{ marginTop: -4, marginBottom: 10 }}>
          Cuentas bloqueadas por el usuario. Desbloquéalas o elimínalas de la base de datos.
        </p>

        {loadingList && <p className="adm-empty">Cargando…</p>}
        {!loadingList && !listErr && locked.length === 0 && (
          <p className="adm-empty">No hay solicitudes de eliminación.</p>
        )}

        {locked.map((u) => (
          <div className="adm-userrow" key={u.id}>
            <div>
              <div className="adm-user-email">{u.email}</div>
              <div className="adm-user-name">
                {u.full_name ? `${u.full_name} · ` : ""}Solicitado {fmtDate(u.deletion_requested_at)}
              </div>
            </div>
            <div className="adm-row-actions">
              <button className="pf-linkbtn" disabled={rowBusy === u.id} onClick={() => unlock(u)}>
                Desbloquear
              </button>
              <button className="pf-linkbtn danger" disabled={rowBusy === u.id} onClick={() => purge(u)}>
                Eliminar definitivamente
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
