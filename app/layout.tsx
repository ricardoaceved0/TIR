import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TIE 2026",
  description: "Next.js + Supabase, deployed on Vercel",
};

// Runs before first paint: resolves the saved theme (or the OS preference when
// none is saved) and stamps data-theme on <html> so the CSS token block flips
// with no flash of the wrong theme. Kept tiny and dependency-free on purpose.
const THEME_SCRIPT = `(function(){try{var p=JSON.parse(localStorage.getItem("tir:prefs")||"{}");var t=p.theme||"system";if(t==="system"){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
