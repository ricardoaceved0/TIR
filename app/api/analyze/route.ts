/**
 * POST /api/analyze
 * Takes the Entrada (screen 01) intake, mixes it with the editable Prompt
 * Studio config (loaded from Supabase / defaults), calls the AI, and
 * returns the raw text for the Diagnóstico (screen 02) .ai-box.
 */
import { NextResponse } from "next/server";
import { normalizeIntake } from "@/lib/prompt/intake";
import { loadPromptConfig } from "@/lib/prompt/store";
import { generateAnalysis } from "@/lib/ai/generateAnalysis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const intake = normalizeIntake(body);
  const { config } = await loadPromptConfig();

  try {
    const result = await generateAnalysis(config, intake);
    return NextResponse.json({ ok: true, diagnostic: result.diagnostic, model: result.model });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Error desconocido al generar el análisis.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
