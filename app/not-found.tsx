"use client";

import { useEffect, useState } from "react";
import "./member/member.css";
import { SiteHeader, SiteFooter } from "@/app/components/SiteChrome";

export default function NotFound() {
  const [n, setN] = useState(5);

  useEffect(() => {
    const tick = setInterval(() => setN((x) => (x > 0 ? x - 1 : 0)), 1000);
    const go = setTimeout(() => {
      window.location.href = "/";
    }, 5000);
    return () => {
      clearInterval(tick);
      clearTimeout(go);
    };
  }, []);

  return (
    <div className="tir">
      <div className="ghost-bg" aria-hidden="true">
        <span className="g1">404</span>
        <span className="g3">esta puerta no da a ninguna sala</span>
        <span className="g5">extravío /ekstɾaˈβio/</span>
        <span className="g7">volver</span>
        <span className="g9">inicio</span>
      </div>

      <SiteHeader avatar="" actions={false} />

      <main className="shell">
        <div className="nf-wrap">
          <div className="eyebrow">Error 404</div>
          <h1 className="display">
            Esta puerta no da
            <br />
            a ninguna <em>sala.</em>
          </h1>
          <p className="lede">
            La página que buscas no existe o cambió de lugar. Te llevamos de vuelta al inicio
            en <b>{n}</b> segundo{n === 1 ? "" : "s"}.
          </p>
          <div className="row-actions">
            <a className="btn" href="/">Volver al inicio ahora</a>
          </div>
        </div>

        <SiteFooter />
      </main>
    </div>
  );
}
