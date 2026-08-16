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
import { callGemini } from "@/lib/ai/gemini";
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

  // Provider dispatch. Only Gemini is wired for the POC; Claude is the
  // planned production swap (see lib/prompt/config MODEL_OPTIONS).
  const text = await callGemini({
    model: config.model,
    temperature: config.temperature,
    system,
    userContent,
    responseMimeType: "application/json",
    responseSchema: DIAGNOSTIC_SCHEMA,
  });

  return { diagnostic: parseDiagnostic(text), model: config.model };
}
