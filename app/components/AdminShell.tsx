"use client";

import { useEffect, useState } from "react";
import "../member/member.css";
import "../profile/profile.css";
import "./admin.css";
import { SiteHeader, SiteFooter } from "./SiteChrome";
import { createClient } from "@/lib/supabase/client";
import { fetchRole, isAdminRole, Role } from "@/lib/auth/roles";

type AdminKey = "studio" | "users" | "lang";

const ITEMS: { key: AdminKey; label: string; sub: string; href: string }[] = [
  { key: "studio", label: "AI Studio", sub: "Configuración del prompt", href: "/studio" },
  { key: "users", label: "Usuarios", sub: "Crear y gestionar accesos", href: "/admin-users" },
  { key: "lang", label: "Lenguaje", sub: "Traducciones de la interfaz", href: "/admin-lenguaje" },
];

function GhostMark() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 21V9a7 7 0 0 1 14 0v12l-2.5-1.8L14 21l-2-1.8L10 21l-2.5-1.8L5 21z" />
      <circle cx="9.3" cy="10.5" r="1.05" fill="currentColor" stroke="none" />
      <circle cx="14.7" cy="10.5" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * Shared chrome for the admin backend (/admin-backend, /admin-users,
 * /admin-lenguaje): the header, footer, and the left section menu — mirroring
 * the /profile layout. Guards on role: only admins and super_admins see the
 * content; everyone else gets a "no autorizado" panel. (This is UX gating; the
 * real security is server-side in /api/admin/*.)
 */
export default function AdminShell({
  active,
  bare = false,
  children,
}: {
  active?: AdminKey;
  /** When true the content renders without the `.pf-panel` card wrapper
   *  (for pages like /studio that provide their own section cards). */
  bare?: boolean;
  children: React.ReactNode;
}) {
  const [role, setRole] = useState<Role | null | undefined>(undefined); // undefined = checking
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetchRole(createClient());
        if (alive) setRole(r);
      } catch {
        if (alive) setRole(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const authorized = isAdminRole(role);

  return (
    <div className="tir">
      <div className="ghost-bg" aria-hidden="true">
        <span className="g1">admin</span>
        <span className="g2">acceso /akˈθeso/</span>
        <span className="g3">el backend de la sala</span>
        <span className="g4">usuarios</span>
        <span className="g5">rol /rol/</span>
        <span className="g6">prompt</span>
        <span className="g7">super admin</span>
        <span className="g8">lenguaje</span>
        <span className="g9">nivel /niˈβel/</span>
        <span className="g10">la sala</span>
      </div>

      <SiteHeader avatar="RA" />

      <main className="shell pf">
        <div className="pf-hero">
          <div className="eyebrow">Backend de administración</div>
          <h1 className="display">
            Admin <em>backend</em>
          </h1>
        </div>

        {role === undefined ? (
          <div className="adm-checking">Verificando acceso…</div>
        ) : !authorized ? (
          <div className="adm-denied">
            <div className="adm-denied-mark" aria-hidden="true"><GhostMark /></div>
            <h2 className="sect">Acceso restringido</h2>
            <p className="pf-panelhint">
              Esta área es solo para administradores. Inicia sesión con una cuenta con permisos.
            </p>
            <a className="btn" href="/login">Iniciar sesión</a>
          </div>
        ) : (
          <div className="pf-layout">
            {/* mobile: custom dropdown (the rail is hidden ≤760px) */}
            <div className="pf-navmobile">
              <button
                className="pf-navsel"
                aria-expanded={navOpen}
                onClick={() => setNavOpen((o) => !o)}
              >
                <span className="pf-navico" aria-hidden="true"><GhostMark /></span>
                <span className="pf-navsel-label">
                  {ITEMS.find((it) => it.key === active)?.label ?? "Secciones"}
                </span>
                <span className="pf-navsel-chev" aria-hidden="true">{navOpen ? "▴" : "▾"}</span>
              </button>
              {navOpen && (
                <>
                  <div className="pf-navbackdrop" onClick={() => setNavOpen(false)} aria-hidden="true" />
                  <div className="pf-navmenu" role="menu">
                    {ITEMS.map((it) => (
                      <a
                        key={it.key}
                        className={`pf-navitem${active === it.key ? " on" : ""}`}
                        href={it.href}
                        aria-current={active === it.key ? "page" : undefined}
                      >
                        <span className="pf-navico" aria-hidden="true"><GhostMark /></span>
                        <span className="pf-navtext">
                          <span className="pf-navlabel">{it.label}</span>
                          <span className="pf-navsub">{it.sub}</span>
                        </span>
                      </a>
                    ))}
                  </div>
                </>
              )}
            </div>

            <nav className="pf-nav" aria-label="Secciones del backend">
              {ITEMS.map((it) => (
                <a
                  key={it.key}
                  className={`pf-navitem${active === it.key ? " on" : ""}`}
                  href={it.href}
                  aria-current={active === it.key ? "page" : undefined}
                >
                  <span className="pf-navico" aria-hidden="true"><GhostMark /></span>
                  <span className="pf-navtext">
                    <span className="pf-navlabel">{it.label}</span>
                    <span className="pf-navsub">{it.sub}</span>
                  </span>
                </a>
              ))}
            </nav>

            {bare ? (
              <div className="adm-bare">{children}</div>
            ) : (
              <div className="pf-panel">{children}</div>
            )}
          </div>
        )}

        <SiteFooter />
      </main>
    </div>
  );
}

export function AdminPanelHead({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="pf-panelhead">
      <h2 className="sect">{title}</h2>
      <p className="pf-panelhint">{hint}</p>
    </div>
  );
}
