/**
 * The FIXED diagnostic contract — the part the Prompt Studio does NOT
 * control. Screen 02 (Diagnóstico) renders this exact JSON shape, so the
 * keys are locked here and enforced two ways: the contract text is appended
 * to the (editable) Studio system instruction, and DIAGNOSTIC_SCHEMA is sent
 * to Gemini as `responseSchema` so the model can only return this shape.
 */

export type Diagnostic = {
  box_1: {
    technical_match: number; // 0–100
    abilities_match: number; // 0–100
    titles_degrees_match: number; // 0–100
  };
  gap: { identified_gap: string; mitigation_strategy: string };
  adjetivo: { weak_claim: string; evidenced_upgrade: string };
  resultado: { task_focused_statement: string; metric_driven_upgrade: string };
  question_set: { id: number; question: string; questions_why: string }[];
};

/** Appended to the Studio-composed system instruction (fixed output shape). */
export const DIAGNOSTIC_CONTRACT = `
== OUTPUT FORMAT (NO NEGOCIABLE) ==
Respondé ÚNICAMENTE con un objeto JSON válido con exactamente esta estructura
(sin texto adicional, sin markdown, sin backticks):

{
  "box_1": {
    "technical_match": 85,        // entero 0-100: skills técnicas del CV vs JD
    "abilities_match": 70,        // entero 0-100: capacidades/ejecución del CV vs JD
    "titles_degrees_match": 90    // entero 0-100: títulos/certificaciones/rol vs JD
  },
  "gap": {
    "identified_gap": "El déficit principal del candidato frente al JD",
    "mitigation_strategy": "Cómo reencuadrarlo o pivotear en la entrevista"
  },
  "adjetivo": {
    "weak_claim": "Afirmación vaga o con adjetivos del CV",
    "evidenced_upgrade": "Reescritura reemplazando adjetivos por evidencia concreta"
  },
  "resultado": {
    "task_focused_statement": "Tarea listada en el CV sin métricas",
    "metric_driven_upgrade": "Cómo expresarla con impacto y resultados medibles"
  },
  "question_set": [
    { "id": 1, "question": "Pregunta de entrevista…", "questions_why": "Qué evalúa realmente el entrevistador…" }
  ]
}

Reglas: box_1 son enteros 0-100. question_set tiene 5-7 items adaptados a la
Etapa del proceso. Todo el contenido de texto va en el idioma preferido.
`.trim();

/** Gemini REST (v1beta) responseSchema — uppercase OpenAPI types. */
export const DIAGNOSTIC_SCHEMA = {
  type: "OBJECT",
  properties: {
    box_1: {
      type: "OBJECT",
      properties: {
        technical_match: { type: "INTEGER" },
        abilities_match: { type: "INTEGER" },
        titles_degrees_match: { type: "INTEGER" },
      },
      required: ["technical_match", "abilities_match", "titles_degrees_match"],
    },
    gap: {
      type: "OBJECT",
      properties: {
        identified_gap: { type: "STRING" },
        mitigation_strategy: { type: "STRING" },
      },
      required: ["identified_gap", "mitigation_strategy"],
    },
    adjetivo: {
      type: "OBJECT",
      properties: {
        weak_claim: { type: "STRING" },
        evidenced_upgrade: { type: "STRING" },
      },
      required: ["weak_claim", "evidenced_upgrade"],
    },
    resultado: {
      type: "OBJECT",
      properties: {
        task_focused_statement: { type: "STRING" },
        metric_driven_upgrade: { type: "STRING" },
      },
      required: ["task_focused_statement", "metric_driven_upgrade"],
    },
    question_set: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "INTEGER" },
          question: { type: "STRING" },
          questions_why: { type: "STRING" },
        },
        required: ["id", "question", "questions_why"],
      },
    },
  },
  required: ["box_1", "gap", "adjetivo", "resultado", "question_set"],
} as const;

/** Safely coerce the model's response into a Diagnostic (defensive). */
export function parseDiagnostic(raw: string): Diagnostic {
  let text = raw.trim();
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) text = fence[1].trim();

  let obj: Record<string, unknown>;
  try {
    obj = JSON.parse(text) as Record<string, unknown>;
  } catch {
    // Fallback: grab the outermost {...} in case the model added prose.
    const first = text.indexOf("{");
    const last = text.lastIndexOf("}");
    if (first !== -1 && last > first) {
      try {
        obj = JSON.parse(text.slice(first, last + 1)) as Record<string, unknown>;
      } catch {
        throw new Error("La respuesta del modelo no es JSON válido.");
      }
    } else {
      throw new Error("La respuesta del modelo no es JSON válido.");
    }
  }

  const g = (o: unknown, k: string): unknown => (o as Record<string, unknown>)?.[k];
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const int = (v: unknown) => {
    const n = Math.round(Number(v));
    return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
  };

  const box = g(obj, "box_1");
  const qs = g(obj, "question_set");

  return {
    box_1: {
      technical_match: int(g(box, "technical_match")),
      abilities_match: int(g(box, "abilities_match")),
      titles_degrees_match: int(g(box, "titles_degrees_match")),
    },
    gap: {
      identified_gap: str(g(g(obj, "gap"), "identified_gap")),
      mitigation_strategy: str(g(g(obj, "gap"), "mitigation_strategy")),
    },
    adjetivo: {
      weak_claim: str(g(g(obj, "adjetivo"), "weak_claim")),
      evidenced_upgrade: str(g(g(obj, "adjetivo"), "evidenced_upgrade")),
    },
    resultado: {
      task_focused_statement: str(g(g(obj, "resultado"), "task_focused_statement")),
      metric_driven_upgrade: str(g(g(obj, "resultado"), "metric_driven_upgrade")),
    },
    question_set: Array.isArray(qs)
      ? qs
          .map((q, i) => ({
            id: Number.isFinite(Number(g(q, "id"))) ? Number(g(q, "id")) : i + 1,
            question: str(g(q, "question")),
            questions_why: str(g(q, "questions_why")),
          }))
          .filter((q) => q.question)
      : [],
  };
}
