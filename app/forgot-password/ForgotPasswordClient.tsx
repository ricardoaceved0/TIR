"use client";

import { useState } from "react";
import "../member/member.css";
import "../profile/profile.css";
import "../components/admin.css";
import { SiteHeader, SiteFooter } from "@/app/components/SiteChrome";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo enviar el correo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tir">
      <div className="ghost-bg" aria-hidden="true">
        <span className="g1">contraseña</span>
        <span className="g3">recupera tu acceso</span>
        <span className="g5">correo /koˈreo/</span>
        <span className="g7">enviar</span>
      </div>

      <SiteHeader avatar="" actions={false} />

      <main className="shell">
        <div className="login-wrap">
          <div className="eyebrow" style={{ textAlign: "center" }}>Recuperar acceso</div>
          <h1 className="display" style={{ textAlign: "center", marginBottom: 20 }}>
            Olvidé mi <em>contraseña</em>
          </h1>

          {sent ? (
            <div className="login-card" style={{ textAlign: "center" }}>
              <p className="pf-panelhint" style={{ margin: "0 auto" }}>
                Si <b>{email}</b> tiene una cuenta, te enviamos un enlace para restablecer tu
                contraseña. Revisa tu correo.
              </p>
              <div className="login-links" style={{ justifyContent: "center", marginTop: 18 }}>
                <a href="/login">Volver a iniciar sesión</a>
              </div>
            </div>
          ) : (
            <form className="login-card" onSubmit={submit}>
              <label className="fld" htmlFor="fp-email">Correo</label>
              <input className="txt" id="fp-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@empresa.com" />
              {err && <p className="adm-msg err" style={{ marginTop: 12 }}>{err}</p>}
              <div className="login-actions">
                <button className="btn" type="submit" disabled={busy}>
                  {busy ? "Enviando…" : "Enviar enlace"}
                </button>
              </div>
              <div className="login-links">
                <span />
                <a href="/login">Volver a iniciar sesión</a>
              </div>
            </form>
          )}
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
