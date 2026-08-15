/**
 * The candidate intake captured on Entrada (screen 01) and posted to
 * /api/analyze. Mirrors the fields in app/member/MemberArea.tsx.
 */
export type Intake = {
  empresa: string;
  posicion: string;
  fecha: string; // YYYY-MM-DD, may be ""
  jobDescription: string;
  stage: string; // e.g. "Reclutador" | "Jefe Directo" | ...
  linkedinUrl: string; // may be ""
  tools: string[];
  /** Language the AI should answer in. Defaults to Spanish. */
  preferredLanguage?: string;
};

/** Coerce an unknown request body into a safe Intake shape. */
export function normalizeIntake(input: unknown): Intake {
  const o = (input ?? {}) as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  return {
    empresa: str(o.empresa),
    posicion: str(o.posicion),
    fecha: str(o.fecha),
    jobDescription: str(o.jobDescription),
    stage: str(o.stage),
    linkedinUrl: str(o.linkedinUrl),
    tools: Array.isArray(o.tools) ? o.tools.filter((t): t is string => typeof t === "string") : [],
    preferredLanguage: str(o.preferredLanguage) || "español",
  };
}

/** Render the intake as the human-readable data block the AI analyzes. */
export function intakeToText(intake: Intake): string {
  const lines = [
    `Empresa: ${intake.empresa || "(no especificada)"}`,
    `Posición: ${intake.posicion || "(no especificada)"}`,
    `Fecha de la entrevista: ${intake.fecha || "(no especificada)"}`,
    `Etapa del proceso: ${intake.stage || "(no especificada)"}`,
    `Herramientas / metodologías del rol: ${intake.tools.length ? intake.tools.join(", ") : "(ninguna)"}`,
    `LinkedIn del entrevistador: ${intake.linkedinUrl || "(no especificado)"}`,
    "",
    "Job description:",
    intake.jobDescription || "(no proporcionado)",
  ];
  return lines.join("\n");
}
