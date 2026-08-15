/**
 * GET  /api/prompt-config  → current Prompt Studio config (+ persistence note)
 * PUT  /api/prompt-config  → save config to Supabase
 *
 * Used by the Prompt Studio screen (/studio).
 */
import { NextResponse } from "next/server";
import { normalizeConfig } from "@/lib/prompt/config";
import { loadPromptConfig, savePromptConfig } from "@/lib/prompt/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { config, persisted, note } = await loadPromptConfig();
  return NextResponse.json({ config, persisted, note });
}

export async function PUT(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const config = normalizeConfig(body);
  const { ok, note } = await savePromptConfig(config);
  if (!ok) {
    return NextResponse.json({ ok: false, error: note ?? "No se pudo guardar." }, { status: 502 });
  }
  return NextResponse.json({ ok: true, config });
}
