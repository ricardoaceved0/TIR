"use client";

import { useEffect, useState } from "react";
import "../member/member.css";
import "../profile/profile.css";
import "../components/admin.css";
import { SiteHeader, SiteFooter } from "@/app/components/SiteChrome";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordClient() {
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  // The reset email links here with a recovery code; exchange it for a
  // session so updateUser can set the new password.
  useEffect(() => {
    (async () => {
      try {
        const supabase = createClient();
        const code = new URLSearchParams(window.location.search).get("code");
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
        const { data } = await supabase.auth.getUser();
        setReady(Boolean(data?.user));
      } catch {
        setReady(false);
      }
    })();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    if (password.length < 8) {
      setErr("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== password2) {
      setErr("Las contraseñas no coinciden.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo actualizar la contraseña.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tir">
      <div className="ghost-bg" aria-hidden="true">
        <span className="g1">contraseña</span>
        <span className="g3">nueva clave</span>
        <span className="g5">seguridad /seɣuɾiˈðað/</span>
        <span className="g7">guardar</span>
      </div>

      <SiteHeader avatar="" actions={false} />

      <main className="shell">
        <div className="login-wrap">
          <div className="eyebrow" style={{ textAlign: "center" }}>Nueva contraseña</div>
          <h1 className="display" style={{ textAlign: "center", marginBottom: 20 }}>
            Restablecer <em>acceso</em>
          </h1>

          {done ? (
            <div className="login-card" style={{ textAlign: "center" }}>
              <p className="pf-panelhint" style={{ margin: "0 auto" }}>Tu contraseña se actualizó.</p>
              <div className="login-links" style={{ justifyContent: "center", marginTop: 18 }}>
                <a href="/login">Iniciar sesión</a>
              </div>
            </div>
          ) : (
            <form className="login-card" onSubmit={submit}>
              {!ready && (
                <p className="pf-help" style={{ marginTop: 0, marginBottom: 12 }}>
                  Abre esta página desde el enlace del correo de recuperación.
                </p>
              )}
              <label className="fld" htmlFor="rp-pw">Nueva contraseña</label>
              <input className="txt" id="rp-pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
              <label className="fld" htmlFor="rp-pw2">Confirmar contraseña</label>
              <input className="txt" id="rp-pw2" type="password" autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="••••••••" />
              {err && <p className="adm-msg err" style={{ marginTop: 12 }}>{err}</p>}
              <div className="login-actions">
                <button className="btn" type="submit" disabled={busy || !ready}>
                  {busy ? "Guardando…" : "Guardar contraseña"}
                </button>
              </div>
            </form>
          )}
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
