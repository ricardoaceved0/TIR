import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TIE 2026",
  description: "Next.js + Supabase, deployed on Vercel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
