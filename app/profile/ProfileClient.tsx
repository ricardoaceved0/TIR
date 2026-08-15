"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "../member/member.css";
import "./profile.css";
import { SiteHeader, SiteFooter } from "@/app/components/SiteChrome";
import { createClient } from "@/lib/supabase/client";

/* ─────────────────────────── sections ─────────────────────────── */

type SectionId = "main" | "cvs" | "prefs" | "sub";

const SECTIONS: { id: SectionId; hash: string; label: string; sub: string }[] = [
  { id: "main", hash: "cuenta", label: "Cuenta", sub: "Nombre, foto, correo y contraseña" },
  { id: "cvs", hash: "mis-cvs", label: "Mis CVs", sub: "Sube tu CV y conviértelo a Markdown" },
  { id: "prefs", hash: "preferencias", label: "Preferencias", sub: "Texto, idioma y accesibilidad" },
  { id: "sub", hash: "subscripcion", label: "Subscripción", sub: "Plan, créditos y facturación" },
];

function sectionFromHash(): SectionId {
  if (typeof window === "undefined") return "main";
  const h = window.location.hash.replace("#", "");
  const found = SECTIONS.find((s) => s.hash === h);
  return found ? found.id : "main";
}

/* ─────────────────────────── icons ─────────────────────────── */

function IconAccount() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}
function IconSliders() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}
function IconCard() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
    </svg>
  );
}
const ICONS: Record<SectionId, () => React.JSX.Element> = {
  main: IconAccount,
  cvs: IconDoc,
  prefs: IconSliders,
  sub: IconCard,
};

/* ─────────────────────────── preferences ─────────────────────────── */

type Prefs = { textSize: "sm" | "md" | "lg"; language: "es" | "en"; reduceMotion: boolean };
const DEFAULT_PREFS: Prefs = { textSize: "md", language: "es", reduceMotion: false };
const PREFS_KEY = "tir:prefs";

function loadPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try {
    return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(PREFS_KEY) || "{}") };
  } catch {
    return DEFAULT_PREFS;
  }
}

/* ─────────────────────────── component ─────────────────────────── */

type CvItem = { id: string; filename: string; markdown: string };

export default function ProfileClient() {
  const [section, setSection] = useState<SectionId>("main");
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // hydrate section from the URL hash (gear icon links to #preferencias)
  useEffect(() => {
    setSection(sectionFromHash());
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // who's logged in? (auth may not exist yet — that's fine, we degrade)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getUser();
        if (alive && data?.user) setUser({ id: data.user.id, email: data.user.email ?? undefined });
      } catch {
        /* no session / auth not configured */
      } finally {
        if (alive) setAuthChecked(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const goSection = (id: SectionId) => {
    setSection(id);
    const s = SECTIONS.find((x) => x.id === id);
    if (s) history.replaceState(null, "", `#${s.hash}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="tir">
      <div className="ghost-bg" aria-hidden="true">
        <span className="g1">perfil</span>
        <span className="g2">cuenta /ˈkwenta/</span>
        <span className="g3">tu material se queda contigo</span>
        <span className="g4">créditos</span>
        <span className="g5">preferencia /pɾefeˈɾenθja/</span>
        <span className="g6">markdown</span>
        <span className="g7">subscripción</span>
        <span className="g8">hoja de vida</span>
        <span className="g9">idioma /iˈðjoma/</span>
        <span className="g10">tu acceso</span>
      </div>

      <SiteHeader avatar="VR" />

      <main className="shell pf">
        <div className="pf-hero">
          <div className="eyebrow">Tu cuenta</div>
          <h1 className="display">
            Perfil <em>&amp; ajustes</em>
          </h1>
        </div>

        {authChecked && !user && (
          <div className="pf-authbanner">
            <b>Estás viendo tu perfil sin sesión.</b> El login aún no está conectado, así que los
            cambios de cuenta, la foto y tu biblioteca de CVs se guardarán cuando exista. La
            conversión de CV a Markdown y las preferencias ya funcionan.
          </div>
        )}

        <div className="pf-layout">
          <nav className="pf-nav" aria-label="Secciones del perfil">
            {SECTIONS.map((s) => {
              const Icon = ICONS[s.id];
              return (
                <button
                  key={s.id}
                  className={`pf-navitem${section === s.id ? " on" : ""}`}
                  aria-current={section === s.id ? "page" : undefined}
                  onClick={() => goSection(s.id)}
                >
                  <span className="pf-navico" aria-hidden="true"><Icon /></span>
                  <span className="pf-navtext">
                    <span className="pf-navlabel">{s.label}</span>
                    <span className="pf-navsub">{s.sub}</span>
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="pf-panel">
            {section === "main" && <MainPanel user={user} />}
            {section === "cvs" && <CvsPanel hasSession={!!user} />}
            {section === "prefs" && <PrefsPanel />}
            {section === "sub" && <SubPanel />}
          </div>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}

/* ─────────────────────────── Cuenta (Main) ─────────────────────────── */

function MainPanel({ user }: { user: { id: string; email?: string } | null }) {
  const [name, setName] = useState("Valentina Rossi");
  const [email, setEmail] = useState(user?.email ?? "valentina@example.com");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [state, setState] = useState<"idle" | "saving">("idle");
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
  }, [user?.email]);

  const pickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setAvatar(URL.createObjectURL(f));
  };

  const save = async () => {
    setMsg(null);
    if (pw && pw !== pw2) {
      setMsg({ kind: "err", text: "Las contraseñas no coinciden." });
      return;
    }
    if (!user) {
      setMsg({ kind: "err", text: "Necesitas iniciar sesión para guardar (auth aún no conectada)." });
      return;
    }
    setState("saving");
    try {
      const supabase = createClient();
      const payload: { email?: string; password?: string; data: { full_name: string } } = {
        data: { full_name: name },
      };
      if (email && email !== user.email) payload.email = email;
      if (pw) payload.password = pw;
      const { error: authErr } = await supabase.auth.updateUser(payload);
      if (authErr) throw authErr;
      // mirror the display fields into a profiles row (owner-scoped by RLS)
      await supabase.from("profiles").upsert({ id: user.id, full_name: name });
      setMsg({ kind: "ok", text: "Cambios guardados." });
      setPw("");
      setPw2("");
    } catch (e) {
      setMsg({ kind: "err", text: e instanceof Error ? e.message : "No se pudo guardar." });
    } finally {
      setState("idle");
    }
  };

  return (
    <>
      <PanelHead title="Cuenta" hint="Tu identidad en la sala: cómo te llamas, tu foto y tus credenciales de acceso." />

      <div className="pf-avatar-row">
        <div className="pf-avatar" aria-hidden="true">
          {avatar ? <img src={avatar} alt="" /> : <span>VR</span>}
        </div>
        <div>
          <button className="btn ghost sm" type="button" onClick={() => fileRef.current?.click()}>
            Cambiar foto
          </button>
          <p className="pf-help">JPG o PNG, hasta 4 MB.</p>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg" hidden onChange={pickAvatar} />
        </div>
      </div>

      <div className="pf-fields">
        <div>
          <label className="fld" htmlFor="pf-name">Nombre completo</label>
          <input className="txt" id="pf-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className="fld" htmlFor="pf-email">Correo</label>
          <input className="txt" id="pf-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <p className="pf-help">Cambiar el correo envía un enlace de confirmación a la nueva dirección.</p>
        </div>
        <div className="pf-two">
          <div>
            <label className="fld" htmlFor="pf-pw">Nueva contraseña</label>
            <input className="txt" id="pf-pw" type="password" value={pw} placeholder="••••••••" onChange={(e) => setPw(e.target.value)} />
          </div>
          <div>
            <label className="fld" htmlFor="pf-pw2">Confirmar contraseña</label>
            <input className="txt" id="pf-pw2" type="password" value={pw2} placeholder="••••••••" onChange={(e) => setPw2(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="pf-actions">
        {msg && <span className={`pf-msg ${msg.kind}`}>{msg.text}</span>}
        <button className="btn" type="button" onClick={save} disabled={state === "saving"}>
          {state === "saving" ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>
    </>
  );
}

/* ─────────────────────────── Mis CVs ─────────────────────────── */

function CvsPanel({ hasSession }: { hasSession: boolean }) {
  const [items, setItems] = useState<CvItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const convert = useCallback(async (file: File) => {
    setErr("");
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "docx") {
      setErr("Solo PDF o DOCX por ahora.");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/cv/convert", { method: "POST", body: fd });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      const item: CvItem = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        filename: data.filename || file.name,
        markdown: data.markdown as string,
      };
      setItems((xs) => [item, ...xs]);
      setOpenId(item.id);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "No se pudo convertir.");
    } finally {
      setBusy(false);
    }
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) convert(f);
    e.target.value = "";
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) convert(f);
  };

  const copy = (item: CvItem) => {
    navigator.clipboard?.writeText(item.markdown);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId((id) => (id === item.id ? null : id)), 1800);
  };
  const download = (item: CvItem) => {
    const blob = new Blob([item.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = item.filename.replace(/\.(pdf|docx)$/i, "") + ".md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PanelHead title="Mis CVs" hint="Sube tu hoja de vida en PDF o DOCX y la sala la convierte a Markdown limpio, listo para leer y editar." />

      <div
        className={`pf-drop${dragOver ? " over" : ""}${busy ? " busy" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => !busy && fileRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && !busy && fileRef.current?.click()}
      >
        <input ref={fileRef} type="file" accept=".pdf,.docx" hidden onChange={onPick} />
        {busy ? (
          <div className="pf-drop-busy">
            <span className="blink" /> Convirtiendo a Markdown…
          </div>
        ) : (
          <>
            <div className="pf-drop-title">Arrastra tu CV aquí o toca para subir</div>
            <div className="pf-drop-sub">PDF o DOCX · hasta 8 MB</div>
          </>
        )}
      </div>
      {err && <p className="pf-msg err">{err}</p>}
      {!hasSession && items.length > 0 && (
        <p className="pf-help">La conversión funciona sin sesión; para guardar tus CVs en tu biblioteca inicia sesión.</p>
      )}

      <div className="pf-cvlist">
        {items.length === 0 && !busy && (
          <p className="pf-empty">Todavía no has subido ningún CV.</p>
        )}
        {items.map((item) => (
          <div className="pf-cv" key={item.id}>
            <div className="pf-cv-head">
              <span className="pf-cv-ico" aria-hidden="true"><IconDoc /></span>
              <span className="pf-cv-name">{item.filename}</span>
              <span className="pf-cv-badge">Markdown</span>
              <div className="pf-cv-actions">
                <button className="pf-linkbtn" onClick={() => setOpenId((id) => (id === item.id ? null : item.id))}>
                  {openId === item.id ? "Ocultar" : "Ver"}
                </button>
                <button className="pf-linkbtn" onClick={() => copy(item)}>
                  {copiedId === item.id ? "¡Copiado!" : "Copiar"}
                </button>
                <button className="pf-linkbtn" onClick={() => download(item)}>Descargar .md</button>
              </div>
            </div>
            {openId === item.id && <pre className="pf-md">{item.markdown}</pre>}
          </div>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────── Preferencias ─────────────────────────── */

function PrefsPanel() {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);

  useEffect(() => setPrefs(loadPrefs()), []);

  // apply live + persist
  useEffect(() => {
    const root = document.querySelector(".pf") as HTMLElement | null;
    if (root) root.setAttribute("data-textsize", prefs.textSize);
    document.documentElement.classList.toggle("tir-reduce-motion", prefs.reduceMotion);
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => setPrefs((p) => ({ ...p, [k]: v }));

  return (
    <>
      <PanelHead title="Preferencias" hint="Ajusta la lectura y la accesibilidad. Se guardan en este dispositivo y se sincronizarán a tu cuenta cuando inicies sesión." />

      <div className="pf-pref">
        <div className="pf-pref-label">
          <span className="pf-pref-title">Tamaño de texto</span>
          <span className="pf-pref-sub">Escala el texto de lectura.</span>
        </div>
        <div className="pf-seg">
          {(["sm", "md", "lg"] as const).map((v) => (
            <button key={v} className="pf-segbtn" aria-pressed={prefs.textSize === v} onClick={() => set("textSize", v)}>
              {v === "sm" ? "Pequeño" : v === "md" ? "Mediano" : "Grande"}
            </button>
          ))}
        </div>
      </div>

      <div className="pf-pref">
        <div className="pf-pref-label">
          <span className="pf-pref-title">Idioma</span>
          <span className="pf-pref-sub">La traducción completa de la interfaz llegará pronto.</span>
        </div>
        <div className="pf-seg">
          {(["es", "en"] as const).map((v) => (
            <button key={v} className="pf-segbtn" aria-pressed={prefs.language === v} onClick={() => set("language", v)}>
              {v === "es" ? "Español" : "English"}
            </button>
          ))}
        </div>
      </div>

      <div className="pf-pref">
        <div className="pf-pref-label">
          <span className="pf-pref-title">Reducir movimiento</span>
          <span className="pf-pref-sub">Desactiva animaciones y efectos de brillo.</span>
        </div>
        <button
          className={`pf-toggle${prefs.reduceMotion ? " on" : ""}`}
          role="switch"
          aria-checked={prefs.reduceMotion}
          onClick={() => set("reduceMotion", !prefs.reduceMotion)}
        >
          <span className="pf-knob" />
        </button>
      </div>

      <p className="pf-sample">
        Vista previa: este párrafo cambia de tamaño con la preferencia de arriba, para que veas
        cómo se leerá la sala.
      </p>
    </>
  );
}

/* ─────────────────────────── Subscripción ─────────────────────────── */

function SubPanel() {
  // Demo billing data — reads from the `subscriptions` table once wired.
  const credits = 120;
  const creditsMax = 200;
  const pct = Math.round((credits / creditsMax) * 100);
  const history = [
    { date: "14 ago 2026", detail: "Renovación mensual · Acceso Activo", amount: "$29.00" },
    { date: "14 jul 2026", detail: "Renovación mensual · Acceso Activo", amount: "$29.00" },
    { date: "14 jun 2026", detail: "Primer pago · Acceso Activo", amount: "$29.00" },
  ];

  return (
    <>
      <PanelHead title="Subscripción" hint="Tu plan, tus créditos de práctica y tu historial de pagos." />

      <div className="pf-plan card dark">
        <div className="eyebrow" style={{ color: "#9c9ca8" }}>Tu plan</div>
        <div className="pf-plan-row">
          <div>
            <h2 className="sect" style={{ color: "#fff" }}>Acceso Activo</h2>
            <p style={{ color: "#c9c9d2", fontSize: 14, marginTop: 6 }}>
              Renueva el <b>14 de septiembre de 2026</b> · $29/mes
            </p>
          </div>
          <span className="pf-plan-badge">Activo</span>
        </div>
        <div className="pf-plan-cta">
          <button className="btn onDark">Gestionar plan</button>
          <button className="btn ghost sm" style={{ color: "#fff", borderColor: "#4b4b55" }}>Pausar acceso</button>
        </div>
      </div>

      <div className="pf-credits">
        <div className="pf-credits-top">
          <span className="pf-pref-title">Créditos de práctica</span>
          <span className="pf-credits-num">{credits} <span>/ {creditsMax}</span></span>
        </div>
        <div className="pf-meter"><i style={{ width: `${pct}%` }} /></div>
        <p className="pf-help">Se reponen a {creditsMax} cada ciclo de facturación. Cada sesión en la sala consume 1 crédito.</p>
      </div>

      <div className="pf-billing">
        <div className="eyebrow">Historial de pagos</div>
        {history.map((h, i) => (
          <div className="pf-bill-row" key={i}>
            <span className="pf-bill-date">{h.date}</span>
            <span className="pf-bill-detail">{h.detail}</span>
            <span className="pf-bill-amt">{h.amount}</span>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─────────────────────────── shared ─────────────────────────── */

function PanelHead({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="pf-panelhead">
      <h2 className="sect">{title}</h2>
      <p className="pf-panelhint">{hint}</p>
    </div>
  );
}
