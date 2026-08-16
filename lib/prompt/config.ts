/**
 * Prompt Studio configuration — the "special instructions" the backend
 * team edits from the browser. These fields are composed (in `lib/ai`)
 * with the candidate's Entrada inputs to build the final AI prompt.
 *
 * The config is stored as a single row in Supabase (`prompt_config`).
 * When Supabase isn't reachable, DEFAULT_PROMPT_CONFIG below is used so
 * the app keeps working (and the Studio still renders sensible defaults).
 */

export type PromptConfig = {
  /** Persona / who the AI is. */
  role: string;
  /** Hard rules & boundaries the AI must respect. */
  constraints: string;
  /** Output-format / technical requirements (e.g. strict JSON). */
  technical: string;
  /** Model id sent to the provider. */
  model: string;
  /** Sampling temperature, 0.0–1.0. */
  temperature: number;
  /** What the AI should produce. */
  outputInstructions: string;
};

/**
 * Available models for the Studio's Model radio group.
 * `gemini-2.0-flash` is retired upstream; `gemini-3.5-flash` is the
 * current free flash model. Claude is wired for later (provider swap in
 * lib/ai), so it's shown but disabled for now.
 */
export const MODEL_OPTIONS: { id: string; label: string; available: boolean }[] = [
  { id: "gemini-2.5-flash", label: "gemini-2.5-flash", available: true },
  { id: "gemini-2.5-pro", label: "gemini-2.5-pro", available: true },
  { id: "claude-opus-5", label: "claude-opus-5", available: false },
];

/**
 * The editable "brain" of the diagnostic. Admins tune these in the Studio;
 * the FIXED JSON output shape is enforced separately by DIAGNOSTIC_CONTRACT +
 * responseSchema (see lib/prompt/diagnostic.ts), so edits here can't break
 * screen 02's rendering.
 */
export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  role:
    "Eres un reclutador ejecutivo experto y estratega de preparación de entrevistas " +
    'para "The Interview Room" (TIR). Analizas el CV y el stack técnico del candidato ' +
    "contra la vacante (JD) y el contexto de la entrevista, y produces un diagnóstico estructurado.",
  constraints:
    "- Usá solo evidencia real del CV y del JD; no inventes.\n" +
    "- box_1: puntuá 0-100 (enteros) tres pilares — skills técnicas, capacidades núcleo, títulos/grados — comparando CV vs JD.\n" +
    "- Adaptá todo específicamente a una entrevista de etapa: {{interview.stage}}.\n" +
    "- Respondé en {{user.preferred_language}}.",
  technical:
    "La respuesta debe ser JSON estricto que cumpla el contrato de salida (box_1, gap, adjetivo, resultado, question_set).",
  model: "gemini-2.5-flash",
  temperature: 0.2,
  outputInstructions:
    "Producí:\n" +
    "1. box_1: % de match de skills técnicas, capacidades y títulos/grados.\n" +
    "2. gap: el déficit principal frente al JD + estrategia para pivotearlo.\n" +
    "3. adjetivo: una afirmación vaga del CV reescrita con evidencia.\n" +
    "4. resultado: una tarea sin métrica reescrita con impacto medible.\n" +
    "5. question_set: 5-7 preguntas para la etapa {{interview.stage}}, cada una con su intención (questions_why).",
};

/**
 * Variables available for {{...}} substitution inside the prompt text.
 * (The Studio's "Variables" section documents these; "coming soon" there
 * refers to editing them from the UI — the substitution itself works now.)
 */
export type PromptVariables = {
  "interview.stage": string;
  "user.preferred_language": string;
};

/** Replace every {{key}} token in `text` with the matching variable value. */
export function applyVariables(text: string, vars: PromptVariables): string {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, key: string) => {
    const v = (vars as Record<string, string>)[key];
    return v != null && v !== "" ? v : whole;
  });
}

/** Coerce an unknown object (e.g. a DB row or request body) into a PromptConfig. */
export function normalizeConfig(input: unknown): PromptConfig {
  const o = (input ?? {}) as Record<string, unknown>;
  const str = (v: unknown, fallback: string) =>
    typeof v === "string" ? v : fallback;
  const num = (v: unknown, fallback: number) => {
    const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
  };
  return {
    role: str(o.role, DEFAULT_PROMPT_CONFIG.role),
    constraints: str(o.constraints, DEFAULT_PROMPT_CONFIG.constraints),
    technical: str(o.technical, DEFAULT_PROMPT_CONFIG.technical),
    model: str(o.model, DEFAULT_PROMPT_CONFIG.model),
    temperature: num(o.temperature, DEFAULT_PROMPT_CONFIG.temperature),
    outputInstructions: str(o.outputInstructions, DEFAULT_PROMPT_CONFIG.outputInstructions),
  };
}
