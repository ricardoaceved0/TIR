import { momentById } from "@/lib/prompt/moments";

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
  linkedinUrl: string; // may be "" (the interviewer's LinkedIn, from Entrada)
  interviewerTitle: string; // may be ""
  tools: string[];
  /** Candidate CV as Markdown (from /profile → Tu CV). May be "". */
  cvText: string;
  /** Candidate's LinkedIn profile export as text (/profile → Tu LinkedIn). May be "". */
  linkedinText: string;
  /** The candidate's chosen career moment id (/profile → Tu Momento). May be "". */
  momento: string;
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
    linkedinText: str(o.linkedinText, o.linkedin_text),
    momento: str(o.momento),
    preferredLanguage: str(o.preferredLanguage) || "español",
  };
}

/** Render the intake as the human-readable data block the AI analyzes. */
export function intakeToText(intake: Intake): string {
  const moment = momentById(intake.momento);
  const lines = [
    "CANDIDATE CV (MARKDOWN):",
    intake.cvText || "(no proporcionado)",
    "",
    "PERFIL DE LINKEDIN DEL CANDIDATO (EXPORT):",
    intake.linkedinText || "(no proporcionado)",
    "",
    "MOMENTO PROFESIONAL DEL CANDIDATO:",
    moment ? `${moment.title} — ${moment.description}` : "(no especificado)",
    "",
    `Herramientas / metodologías del candidato: ${intake.tools.length ? intake.tools.join(", ") : "(ninguna)"}`,
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
