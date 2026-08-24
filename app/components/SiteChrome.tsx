"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchAccount, initialsFrom, isAdminRole, Role } from "@/lib/auth/roles";

/**
 * Shared site chrome for The Interview Room — the header bar and footer that
 * every screen (member area, Prompt Studio, …) renders so the design system
 * stays consistent in one place. Markup uses the `.tir` design-system classes
 * defined in app/member/member.css, so any page using these must render inside
 * a `<div className="tir">` and import that stylesheet.
 */

export function Seal() {
  return (
    <svg className="seal" width="52" height="52" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path id="tir-ring" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="#fff" strokeWidth="1" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="#fff" strokeWidth=".5" />
      <text fill="#fff" fontFamily="Poppins,sans-serif" fontSize="8.2" letterSpacing="1.5">
        <textPath href="#tir-ring" startOffset="4%">
          THE INTERVIEW ROOM • THE INTERVIEW ROOM •
        </textPath>
      </text>
      <text x="50" y="60" textAnchor="middle" fill="#fff" fontFamily="Playfair Display,serif" fontSize="30" letterSpacing="-1">
        IR
      </text>
    </svg>
  );
}

function GhostIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 21V9a7 7 0 0 1 14 0v12l-2.5-1.8L14 21l-2-1.8L10 21l-2.5-1.8L5 21z" />
      <circle cx="9.3" cy="10.5" r="1.15" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="10.5" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

export function SiteHeader({
  onBrand,
  avatar = "VR",
  actions = true,
}: {
  /** In-page brand handler (member area). When omitted, the brand links to "/". */
  onBrand?: () => void;
  avatar?: string;
  /** Hide the action controls (gear/bell/ghost/avatar) — used on auth screens. */
  actions?: boolean;
}) {
  // Identity comes from the real session: the ghost (admin backend) shows only
  // for admins/super_admins, and the avatar initials/photo + name reflect the
  // signed-in user across every screen. Falls back to the `avatar` prop when out.
  const [role, setRole] = useState<Role | null>(null);
  const [initials, setInitials] = useState<string>("");
  const [name, setName] = useState<string | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const acc = await fetchAccount(createClient());
        if (!alive || !acc) return;
        setRole(acc.role);
        setInitials(initialsFrom(acc.fullName, acc.email));
        setName(acc.fullName);
        setPhoto(acc.avatarUrl);
      } catch {
        /* not signed in / auth not configured */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const shownAvatar = initials || avatar;

  const brandInner = (
    <>
      <Seal />
      <div>
        <div className="wordmark">
          The Interview <em>Room</em>
          <sup>™</sup>
        </div>
        <div className="byline">con Mariana &amp; Graciela Atencio</div>
      </div>
    </>
  );

  return (
    <header className="bar">
      <div className="bar-in">
        {onBrand ? (
          <button className="brand" onClick={onBrand} aria-label="Ir al inicio">
            {brandInner}
          </button>
        ) : (
          <a className="brand" href="/" aria-label="Ir al inicio">
            {brandInner}
          </a>
        )}

        {actions && (
          <div className="hdr-actions">
            {isAdminRole(role) && (
              <a className="hdr-btn" href="/admin-backend" aria-label="Backend de administración" title="Backend de administración">
                <GhostIcon />
              </a>
            )}
            <a className="hdr-btn" href="/profile#preferencias" aria-label="Preferencias" title="Preferencias">
              <GearIcon />
            </a>
            <button className="hdr-btn bell" aria-label="Notificaciones" title="Notificaciones">
              <BellIcon />
              <span className="bell-dot" aria-hidden="true" />
            </button>
            {shownAvatar && (
              <a className="hdr-btn avatar" href="/profile" aria-label="Tu perfil" title={name ?? "Tu perfil"}>
                {photo ? <img className="hdr-avatar-img" src={photo} alt="" /> : shownAvatar}
              </a>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

/* ─────────────────────────── footer ─────────────────────────── */

type Lang = "es" | "en";

/** Four monochrome channel marks, glyph-only, on a 24×24 viewBox. */
function SocialIcon({ name }: { name: "instagram" | "x" | "linkedin" | "substack" }) {
  const common = {
    viewBox: "0 0 24 24",
    width: 19,
    height: 19,
    "aria-hidden": true as const,
  };
  if (name === "instagram") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5" />
        <circle cx="12" cy="12" r="4.15" />
        <circle cx="17.05" cy="6.95" r="0.9" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "x") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4 L20 20" />
        <path d="M20 4 L4 20" />
      </svg>
    );
  }
  if (name === "linkedin") {
    return (
      <svg {...common} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="3" />
        <path d="M7.6 10.4 V16.6" />
        <circle cx="7.6" cy="7.5" r="0.95" fill="currentColor" stroke="none" />
        <path d="M11.6 16.6 V10.4 M11.6 12.6 c0-1.4 1-2.2 2.3-2.2 1.4 0 2.5.8 2.5 2.6 V16.6" />
      </svg>
    );
  }
  return (
    <svg {...common} fill="currentColor" stroke="none">
      <rect x="4" y="3.9" width="16" height="2.4" />
      <rect x="4" y="8.6" width="16" height="2.4" />
      <path d="M4 13.3 h16 V20.6 L12 16.3 4 20.6 Z" />
    </svg>
  );
}

const FT_COPY: Record<Lang, {
  legal: string[];
  nlHeading: string;
  nlBlurb: string;
  nlPlaceholder: string;
  nlButton: string;
  nlDone: string;
  rights: string;
}> = {
  es: {
    legal: ["Términos y condiciones", "Privacidad", "Cookies", "Contacto"],
    nlHeading: "La carta de los domingos",
    nlBlurb: "Una pregunta de entrevista, desarmada. Cada domingo, en tu correo.",
    nlPlaceholder: "tu@correo.com",
    nlButton: "Suscribirme",
    nlDone: "¡Gracias! Revisa tu correo para confirmar.",
    rights: "Todos los derechos reservados.",
  },
  en: {
    legal: ["Terms & Conditions", "Privacy", "Cookies", "Contact"],
    nlHeading: "The Sunday letter",
    nlBlurb: "One interview question, taken apart. Every Sunday, in your inbox.",
    nlPlaceholder: "you@email.com",
    nlButton: "Subscribe",
    nlDone: "Thanks! Check your inbox to confirm.",
    rights: "All rights reserved.",
  },
};

// Placeholder targets — see the footer handoff's "Open Items". Wire these to the
// real legal routes, social handles, and Substack endpoint when they exist.
const LEGAL_HREFS = ["#", "#", "#", "#"];
const SOCIALS: { name: "instagram" | "x" | "linkedin" | "substack"; label: string; href: string }[] = [
  { name: "instagram", label: "Instagram", href: "#" },
  { name: "x", label: "X", href: "#" },
  { name: "linkedin", label: "LinkedIn", href: "#" },
  { name: "substack", label: "Substack", href: "#" },
];

/**
 * The ink-dark footer used identically on every screen. Locale is shared with
 * the rest of the app through the `tir:prefs` preference (the same key the
 * Preferencias → Idioma toggle writes), so switching here switches everywhere.
 */
export function SiteFooter() {
  const [lang, setLang] = useState<Lang>("es");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const year = new Date().getFullYear();

  // hydrate locale from the shared preference (falls back to es)
  useEffect(() => {
    try {
      const p = JSON.parse(localStorage.getItem("tir:prefs") || "{}");
      if (p.language === "en" || p.language === "es") setLang(p.language);
    } catch {
      /* no stored prefs */
    }
  }, []);

  const setLangShared = (next: Lang) => {
    setLang(next);
    try {
      const p = JSON.parse(localStorage.getItem("tir:prefs") || "{}");
      localStorage.setItem("tir:prefs", JSON.stringify({ ...p, language: next }));
    } catch {
      /* storage unavailable */
    }
  };

  const t = FT_COPY[lang];

  const onSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    // TODO: POST to the real Substack endpoint (see handoff Open Items).
    setSubscribed(true);
  };

  return (
    <footer className="ft">
      <div className="ft-upper">
        {/* COLUMN 1 — brand */}
        <div className="ft-brand">
          <div className="wordmark ft-wordmark">
            The Interview <em>Room</em>
            <sup>™</sup>
          </div>
          <div className="byline">con Mariana &amp; Graciela Atencio</div>

          <nav className="ft-legal" aria-label={lang === "es" ? "Enlaces legales" : "Legal links"}>
            {t.legal.map((label, i) => (
              <a key={label} className="ft-legal-link" href={LEGAL_HREFS[i]}>
                {label}
              </a>
            ))}
          </nav>

          <div className="ft-socials">
            {SOCIALS.map((s) => (
              <a key={s.name} className="ft-social" href={s.href} aria-label={s.label} title={s.label}>
                <SocialIcon name={s.name} />
              </a>
            ))}
          </div>
        </div>

        {/* COLUMN 2 — newsletter */}
        <div className="ft-news">
          <h2 className="ft-news-head">{t.nlHeading}</h2>
          <p className="ft-news-blurb">{t.nlBlurb}</p>
          {subscribed ? (
            <p className="ft-news-done" role="status">{t.nlDone}</p>
          ) : (
            <form className="ft-news-form" onSubmit={onSubscribe}>
              <input
                className="ft-news-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.nlPlaceholder}
                aria-label={t.nlHeading}
              />
              <button className="ft-news-btn" type="submit">{t.nlButton}</button>
            </form>
          )}
        </div>
      </div>

      <div className="ft-lower">
        <span className="ft-copy">
          © {year} The Interview Room™ · {t.rights}
        </span>
        <div className="ft-locale" role="group" aria-label={lang === "es" ? "Idioma" : "Language"}>
          <button
            className={`ft-lang${lang === "es" ? " on" : ""}`}
            aria-pressed={lang === "es"}
            onClick={() => setLangShared("es")}
          >
            es
          </button>
          <span className="ft-locale-sep" aria-hidden="true">/</span>
          <button
            className={`ft-lang${lang === "en" ? " on" : ""}`}
            aria-pressed={lang === "en"}
            onClick={() => setLangShared("en")}
          >
            en
          </button>
        </div>
      </div>
    </footer>
  );
}
