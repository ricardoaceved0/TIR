/**
 * Provider-agnostic entry point for the AI analysis.
 *
 * The route handler calls THIS function and never talks to a provider
 * directly, so switching the free POC model (Gemini) to Claude later is a
 * one-file change: implement a new branch here (or a new module) and route
 * to it based on `config.model`.
 */
import { PromptConfig, applyVariables } from "@/lib/prompt/config";
import { Intake, intakeToText } from "@/lib/prompt/intake";
import {
  callGemini,
  isModelUnavailable,
  listGenerateContentModels,
  pickBestModel,
} from "@/lib/ai/gemini";
import {
  Diagnostic,
  DIAGNOSTIC_CONTRACT,
  DIAGNOSTIC_SCHEMA,
  parseDiagnostic,
} from "@/lib/prompt/diagnostic";

export type AnalysisResult = {
  /** Structured diagnostic rendered on screen 02. */
  diagnostic: Diagnostic;
  /** Model actually used. */
  model: string;
};

// Cache the model we discovered works, so we don't re-list on every request.
let resolvedModel: string | null = null;

/** Build the system instruction from the editable Studio config. */
export function buildSystemInstruction(config: PromptConfig, intake: Intake): string {
  const vars = {
    "interview.stage": intake.stage || "general",
    "user.preferred_language": intake.preferredLanguage || "español",
  };
  const sections = [
    `# Rol\n${config.role}`,
    `# Restricciones y límites\n${config.constraints}`,
    `# Requisitos técnicos\n${config.technical}`,
    `# Instrucciones de salida\n${config.outputInstructions}`,
  ];
  return applyVariables(sections.join("\n\n"), vars);
}

export async function generateAnalysis(
  config: PromptConfig,
  intake: Intake
): Promise<AnalysisResult> {
  // System = the EDITABLE Studio instruction + the FIXED JSON contract.
  const system = `${buildSystemInstruction(config, intake)}\n\n${DIAGNOSTIC_CONTRACT}`;
  const userContent = intakeToText(intake);

  const call = (model: string) =>
    callGemini({
      model,
      temperature: config.temperature,
      system,
      userContent,
      responseMimeType: "application/json",
      responseSchema: DIAGNOSTIC_SCHEMA,
      maxOutputTokens: 8192,
      // Disable "thinking" on flash models so the whole budget goes to the JSON.
      ...(/flash/i.test(model) ? { thinkingBudget: 0 } : {}),
    });

  // Google keeps retiring model IDs (e.g. gemini-2.5-flash → 404 for new
  // keys). Try the configured/last-good model; if it's unavailable, ask the
  // key which models it has and pick a working flash, then cache it.
  const preferred = resolvedModel || config.model;
  let model = preferred;
  let text: string;
  try {
    text = await call(preferred);
  } catch (e) {
    if (!isModelUnavailable(e)) throw e;
    const available = await listGenerateContentModels();
    const pick = pickBestModel(available);
    if (!pick) {
      throw new Error(
        `El modelo "${preferred}" no está disponible y no encontré otro. ` +
          (available.length ? `Disponibles: ${available.join(", ")}` : "La API no devolvió modelos.")
      );
    }
    resolvedModel = pick;
    model = pick;
    text = await call(pick);
  }

  return { diagnostic: parseDiagnostic(text), model };
}
