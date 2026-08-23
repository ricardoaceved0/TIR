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
  interviewerTitle: string; // may be ""
  tools: string[];
  /** Candidate CV as Markdown (from /profile → Mis CVs). May be "". */
  cvText: string;
  /** Extra skills/certs not on the CV (/profile → Conocimientos). */
  conocimientos: string[];
  /** Career milestones (/profile → Logros). */
  logros: { title: string; impact: string; year: string; detail: string }[];
  /** Language the AI should answer in. Defaults to Spanish. */
  preferredLanguage?: string;
};

/** Coerce an unknown request body into a safe Intake shape. Accepts both the
 *  member-area field names and the diagnostic aliases (cv_text, jd_text…). */
export function normalizeIntake(input: unknown): Intake {
  const o = (input ?? {}) as Record<string, unknown>;
  const str = (...vs: unknown[]) => {
    for (const v of vs) if (typeof v === "string" && v.trim()) return v.trim();
    return "";
  };
  return {
    empresa: str(o.empresa, o.company),
    posicion: str(o.posicion, o.position),
    fecha: str(o.fecha, o.interview_date),
    jobDescription: str(o.jobDescription, o.jd_text),
    stage: str(o.stage),
    linkedinUrl: str(o.linkedinUrl, o.interviewer_url),
    interviewerTitle: str(o.interviewerTitle, o.interviewer_title),
    tools: Array.isArray(o.tools)
      ? o.tools.filter((t): t is string => typeof t === "string")
      : typeof o.tools === "string" && o.tools.trim()
      ? o.tools.split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    cvText: str(o.cvText, o.cv_text),
    conocimientos: Array.isArray(o.conocimientos)
      ? o.conocimientos.filter((t): t is string => typeof t === "string")
      : [],
    logros: Array.isArray(o.logros)
      ? o.logros
          .map((l) => {
            const one = (v: unknown) => (typeof v === "string" ? v.trim() : "");
            const o2 = (l ?? {}) as Record<string, unknown>;
            return { title: one(o2.title), impact: one(o2.impact), year: one(o2.year), detail: one(o2.detail) };
          })
          .filter((l) => l.title || l.detail)
      : [],
    preferredLanguage: str(o.preferredLanguage) || "español",
  };
}

/** Render the intake as the human-readable data block the AI analyzes. */
export function intakeToText(intake: Intake): string {
  const lines = [
    "CANDIDATE CV (MARKDOWN):",
    intake.cvText || "(no proporcionado)",
    "",
    `Herramientas / metodologías del candidato: ${intake.tools.length ? intake.tools.join(", ") : "(ninguna)"}`,
    `Conocimientos adicionales (no en el CV): ${intake.conocimientos.length ? intake.conocimientos.join(", ") : "(ninguno)"}`,
    "",
    "LOGROS PRINCIPALES:",
    intake.logros.length
      ? intake.logros
          .map(
            (l, i) =>
              `${i + 1}. ${l.title}${l.year ? ` (${l.year})` : ""}${l.impact ? ` — impacto: ${l.impact}` : ""}${l.detail ? `: ${l.detail}` : ""}`
          )
          .join("\n")
      : "(ninguno)",
    "",
    "JOB DETAILS:",
    `- Empresa: ${intake.empresa || "(no especificada)"}`,
    `- Posición: ${intake.posicion || "(no especificada)"}`,
    "- Job description:",
    intake.jobDescription || "(no proporcionado)",
    "",
    "CONTEXTO:",
    `- Fecha de la entrevista: ${intake.fecha || "(no especificada)"}`,
    `- Etapa del proceso: ${intake.stage || "(general)"}`,
    `- Título del entrevistador: ${intake.interviewerTitle || "(no especificado)"}`,
    `- LinkedIn del entrevistador: ${intake.linkedinUrl || "(no especificado)"}`,
  ];
  return lines.join("\n");
}
