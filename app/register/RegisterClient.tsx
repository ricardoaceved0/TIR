"use client";

import { useState } from "react";
import "../member/member.css";
import "../profile/profile.css";
import "../components/admin.css";
import { SiteHeader, SiteFooter } from "@/app/components/SiteChrome";
import { createClient } from "@/lib/supabase/client";

export default function RegisterClient() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<null | "session" | "confirm">(null);

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
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: name.trim() ? { full_name: name.trim() } : undefined,
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;
      if (data.session) {
        window.location.href = "/";
        return;
      }
      setDone("confirm");
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo crear la cuenta.");
      setBusy(false);
    }
  };

  return (
    <div className="tir">
      <div className="ghost-bg" aria-hidden="true">
        <span className="g1">cuenta</span>
        <span className="g3">bienvenida a la sala</span>
        <span className="g5">registro /reˈxistɾo/</span>
        <span className="g7">crear</span>
        <span className="g9">acceso</span>
      </div>

      <SiteHeader avatar="" actions={false} />

      <main className="shell">
        <div className="login-wrap">
          <div className="eyebrow" style={{ textAlign: "center" }}>Crear cuenta</div>
          <h1 className="display" style={{ textAlign: "center", marginBottom: 20 }}>
            Únete a la <em>sala</em>
          </h1>

          {done === "confirm" ? (
            <div className="login-card" style={{ textAlign: "center" }}>
              <p className="pf-panelhint" style={{ margin: "0 auto" }}>
                Te enviamos un correo a <b>{email}</b> para confirmar tu cuenta. Ábrelo y luego
                inicia sesión.
              </p>
              <div className="login-links" style={{ justifyContent: "center", marginTop: 18 }}>
                <a href="/login">Ir a iniciar sesión</a>
              </div>
            </div>
          ) : (
            <form className="login-card" onSubmit={submit}>
              <label className="fld" htmlFor="r-name">Nombre (opcional)</label>
              <input className="txt" id="r-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
              <label className="fld" htmlFor="r-email">Correo</label>
              <input className="txt" id="r-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@empresa.com" />
              <label className="fld" htmlFor="r-pw">Contraseña</label>
              <input className="txt" id="r-pw" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 8 caracteres" />
              <label className="fld" htmlFor="r-pw2">Confirmar contraseña</label>
              <input className="txt" id="r-pw2" type="password" autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} placeholder="••••••••" />
              {err && <p className="adm-msg err" style={{ marginTop: 12 }}>{err}</p>}
              <div className="login-actions">
                <button className="btn" type="submit" disabled={busy}>
                  {busy ? "Creando…" : "Crear cuenta"}
                </button>
              </div>
              <div className="login-links">
                <span />
                <a href="/login">Ya tengo cuenta</a>
              </div>
            </form>
          )}
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
