"use client";

import { useState } from "react";
import "../member/member.css";
import "../profile/profile.css";
import "../components/admin.css";
import { SiteHeader, SiteFooter } from "@/app/components/SiteChrome";
import { createClient } from "@/lib/supabase/client";

export default function LoginClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) throw error;
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.href = next && next.startsWith("/") ? next : "/";
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "No se pudo iniciar sesión.");
      setBusy(false);
    }
  };

  return (
    <div className="tir">
      <div className="ghost-bg" aria-hidden="true">
        <span className="g1">acceso</span>
        <span className="g3">bienvenida de vuelta</span>
        <span className="g5">sesión /seˈsjon/</span>
        <span className="g7">la sala</span>
        <span className="g9">entrar</span>
      </div>

      <SiteHeader avatar="" actions={false} />

      <main className="shell">
        <div className="login-wrap">
          <div className="eyebrow" style={{ textAlign: "center" }}>Acceso</div>
          <h1 className="display" style={{ textAlign: "center", marginBottom: 20 }}>
            Iniciar <em>sesión</em>
          </h1>
          <form className="login-card" onSubmit={submit}>
            <label className="fld" htmlFor="l-email">Correo</label>
            <input className="txt" id="l-email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@empresa.com" />
            <label className="fld" htmlFor="l-pw">Contraseña</label>
            <input className="txt" id="l-pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            {err && <p className="adm-msg err" style={{ marginTop: 12 }}>{err}</p>}
            <div className="login-actions">
              <button className="btn" type="submit" disabled={busy}>
                {busy ? "Entrando…" : "Entrar"}
              </button>
            </div>
            <div className="login-links">
              <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
              <a href="/register">Crear cuenta</a>
            </div>
          </form>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
