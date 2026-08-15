/**
 * Load/save the Prompt Studio config from Supabase (`prompt_config`, a
 * single row with id = 1). If Supabase isn't configured or the row is
 * missing, we fall back to DEFAULT_PROMPT_CONFIG so nothing breaks — the
 * POC works before the table exists, and the Studio still renders.
 */
import { createClient } from "@/lib/supabase/server";
import {
  DEFAULT_PROMPT_CONFIG,
  PromptConfig,
  normalizeConfig,
} from "@/lib/prompt/config";

const TABLE = "prompt_config";
const ROW_ID = 1;

function supabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return Boolean(url && key && key !== "your-anon-key" && !url.includes("your-project-ref"));
}

/** DB row → PromptConfig (snake_case columns → camelCase fields). */
function rowToConfig(row: Record<string, unknown>): PromptConfig {
  return normalizeConfig({
    role: row.role,
    constraints: row.constraints,
    technical: row.technical,
    model: row.model,
    temperature: row.temperature,
    outputInstructions: row.output_instructions,
  });
}

/** PromptConfig → DB row. */
function configToRow(config: PromptConfig): Record<string, unknown> {
  return {
    id: ROW_ID,
    role: config.role,
    constraints: config.constraints,
    technical: config.technical,
    model: config.model,
    temperature: config.temperature,
    output_instructions: config.outputInstructions,
    updated_at: new Date().toISOString(),
  };
}

export type LoadResult = { config: PromptConfig; persisted: boolean; note?: string };

export async function loadPromptConfig(): Promise<LoadResult> {
  if (!supabaseConfigured()) {
    return {
      config: DEFAULT_PROMPT_CONFIG,
      persisted: false,
      note: "Supabase no está configurado; usando valores por defecto.",
    };
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.from(TABLE).select("*").eq("id", ROW_ID).maybeSingle();
    if (error) {
      return { config: DEFAULT_PROMPT_CONFIG, persisted: false, note: error.message };
    }
    if (!data) {
      return { config: DEFAULT_PROMPT_CONFIG, persisted: false, note: "Sin fila guardada aún." };
    }
    return { config: rowToConfig(data as Record<string, unknown>), persisted: true };
  } catch (e) {
    return {
      config: DEFAULT_PROMPT_CONFIG,
      persisted: false,
      note: e instanceof Error ? e.message : "Error al leer Supabase.",
    };
  }
}

export type SaveResult = { ok: boolean; note?: string };

export async function savePromptConfig(config: PromptConfig): Promise<SaveResult> {
  if (!supabaseConfigured()) {
    return { ok: false, note: "Supabase no está configurado. Agrega las llaves para guardar." };
  }
  try {
    const supabase = await createClient();
    const { error } = await supabase.from(TABLE).upsert(configToRow(config), { onConflict: "id" });
    if (error) return { ok: false, note: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, note: e instanceof Error ? e.message : "Error al guardar en Supabase." };
  }
}
