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
  { id: "gemini-3.5-flash", label: "gemini-3.5-flash", available: true },
  { id: "claude-opus-5", label: "claude-opus-5", available: false },
];

export const DEFAULT_PROMPT_CONFIG: PromptConfig = {
  role:
    "You are an expert technical interviewer and executive talent strategist. " +
    "Your task is to analyze a job posting and a candidate's background to " +
    "provide actionable interview preparation advice.",
  constraints:
    "- Rely only on facts provided in the candidate data and job details.\n" +
    "- Adapt the advice specifically for an: {{interview.stage}} interview.\n" +
    "- Respond in {{user.preferred_language}}.",
  technical: "Response must come in strict JSON form",
  model: "gemini-3.5-flash",
  temperature: 0.5,
  outputInstructions:
    "Provide a structured preparation plan containing:\n" +
    "1. Top 3 strengths to highlight for this specific round.\n" +
    "2. 5 predicted questions tailored for a {{interview.stage}} interviewer.\n" +
    "3. 2 reverse questions the candidate should ask the interviewer.",
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
