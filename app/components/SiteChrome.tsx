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

export function SiteFooter() {
  return (
    <footer className="foot">
      The Interview Room™ — spinoff de The Interview Edit™ con Mariana &amp; Graciela Atencio
    </footer>
  );
}
