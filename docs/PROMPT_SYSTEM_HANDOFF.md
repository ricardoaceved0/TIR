# The Interview Room™ — AI Prompt System Handoff

**Purpose of this document.** Upload it to a Claude Project as knowledge, then
iterate on the prompt there. It describes the *entire* prompt the product sends
to the model for the screen 02 diagnostic: which parts you can edit from the
backend (**AI Studio**, `/studio`), which parts are locked in code, what data
the model receives, and how the pieces are assembled into the final request.

Nothing here is secret — there are no keys or credentials in this file. It is a
faithful copy of the prompt logic so you can tune wording, tone, scoring rules,
and question style without touching code or waiting for a deploy.

---

## 1. The big picture

The screen 02 "Diagnóstico" is produced by one model call. That call is built
from three sources:

```
  ┌─────────────────────────┐     ┌───────────────────────────────┐
  │ AI STUDIO CONFIG        │     │ FIXED OUTPUT CONTRACT          │
  │ (editable, per profile) │     │ (locked in code)              │
  │  • role                 │     │  • exact JSON shape screen 02  │
  │  • constraints          │     │    renders                     │
  │  • technical            │     │  • also sent as responseSchema │
  │  • outputInstructions   │     └───────────────┬───────────────┘
  │  • model, temperature   │                     │
  └───────────┬─────────────┘                     │
              │            SYSTEM INSTRUCTION      │
              └───────────────────┬───────────────┘
                                  │
   ┌──────────────────────────┐   │
   │ CANDIDATE INTAKE         │   │
   │ (screen 01 + profile)   │   │
   │  • CV (Markdown)         │──►│  USER CONTENT (data block)
   │  • Conocimientos, Logros │   │
   │  • JD, empresa, posición │   │
   │  • etapa, entrevistador  │   │
   └──────────────────────────┘   │
                                  ▼
                          Gemini generateContent
                                  │
                                  ▼
                    Strict JSON → parsed → screen 02
```

- **System instruction** = the four editable Studio text fields **plus** the
  fixed output contract, concatenated.
- **User content** = the candidate's data rendered as a labeled text block.
- **Generation config** = `temperature` (editable), plus a fixed
  `responseSchema` and `responseMimeType: application/json` that force valid JSON.

The design goal: **you can rewrite every instruction the model follows, but you
cannot change the shape of the answer** — so the screen can never break from a
prompt edit.

---

## 2. What you can edit (AI Studio)

Each of these is a field in `/studio`. There are **four saveable profiles**
(rows 1–4); **profile 1 is the live one** the diagnostic reads. Use the others
as drafts/experiments.

| Field | Type | What it controls |
|-------|------|------------------|
| `role` | multi-line text | The persona — who the model is and what job it's doing. |
| `constraints` | multi-line text | Hard rules and boundaries (what to do / never do, how to score). |
| `technical` | multi-line text | Output-format / technical requirements (kept short — the real format is enforced by the contract below). |
| `outputInstructions` | multi-line text | What to produce, item by item. |
| `model` | select | `gemini-flash-latest (auto)` recommended. If a specific ID 404s, the server auto-falls-back to a working flash. Claude is reserved for later. |
| `temperature` | 0.0–1.0 | Creativity vs. determinism. Diagnostics want **low** (default `0.2`). |

### 2.1 Current default values (verbatim)

These ship in `lib/prompt/config.ts` and are what a fresh install / unsaved
profile uses. Treat them as your starting point for tuning.

**`role`**
```
Eres un reclutador ejecutivo experto y estratega de preparación de entrevistas para "The Interview Room" (TIR). Analizas el CV y el stack técnico del candidato contra la vacante (JD) y el contexto de la entrevista, y produces un diagnóstico estructurado.
```

**`constraints`**
```
- Usá solo evidencia real del CV y del JD; no inventes.
- box_1: puntuá 0-100 (enteros) tres pilares — skills técnicas, capacidades núcleo, títulos/grados — comparando CV vs JD.
- Adaptá todo específicamente a una entrevista de etapa: {{interview.stage}}.
- Respondé en {{user.preferred_language}}.
```

**`technical`**
```
La respuesta debe ser JSON estricto que cumpla el contrato de salida (box_1, gap, adjetivo, resultado, question_set).
```

**`outputInstructions`**
```
Producí:
1. box_1: % de match de skills técnicas, capacidades y títulos/grados.
2. gap: el déficit principal frente al JD + estrategia para pivotearlo.
3. adjetivo: una afirmación vaga del CV reescrita con evidencia.
4. resultado: una tarea sin métrica reescrita con impacto medible.
5. question_set: 5-7 preguntas para la etapa {{interview.stage}}, cada una con su intención (questions_why).
```

**`model`** = `gemini-flash-latest` **`temperature`** = `0.2`

### 2.2 How the four text fields become the system instruction

They are joined under fixed Markdown headers, in this exact order, then the
`{{variables}}` are substituted:

```
# Rol
{role}

# Restricciones y límites
{constraints}

# Requisitos técnicos
{technical}

# Instrucciones de salida
{outputInstructions}

{FIXED OUTPUT CONTRACT — see §3}
```

You control everything above the contract line. Keep your edits inside the field
they belong to (don't, for example, put output format rules in `role`).

---

## 3. What you cannot edit (the fixed contract)

This block is appended to the system instruction on every call **and** encoded
as the model's `responseSchema`. It guarantees screen 02 always gets the keys it
renders. If you want to change the *shape* of the answer (add a field, rename a
key), that's a **code change** in `lib/prompt/diagnostic.ts` + the screen — not a
Studio edit. Shown here so you understand the box the editable instructions live
in.

```
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
```

### What each output field drives on screen 02

| Key | Rendered as |
|-----|-------------|
| `box_1.technical_match` / `abilities_match` / `titles_degrees_match` | The three match rings / meters ("Lo que necesita el puesto"). |
| `gap.identified_gap` + `gap.mitigation_strategy` | The main gap + how to pivot it. |
| `adjetivo.weak_claim` + `evidenced_upgrade` | A vague CV line rewritten with evidence. |
| `resultado.task_focused_statement` + `metric_driven_upgrade` | A task rewritten with measurable impact. |
| `question_set[]` (`question`, `questions_why`) | The generated question list, each with its intent. |

---

## 4. Variables you can use in any editable field

Write `{{key}}` anywhere in `role` / `constraints` / `technical` /
`outputInstructions`; it's replaced at call time. If a value is missing, the
literal `{{key}}` is left as-is (safe).

| Variable | Filled from | Example |
|----------|-------------|---------|
| `{{interview.stage}}` | The "Etapa del proceso" chosen in Entrada's config panel | `Reclutador`, `Jefe Directo`, … (defaults to `general`) |
| `{{user.preferred_language}}` | The member's language preference | `español` (default), `english` |

---

## 5. What the model actually receives as input (user content)

The candidate's intake is rendered into this labeled block (empty fields show a
placeholder). This is the "user" turn — the data the instructions above operate
on. Template:

```
CANDIDATE CV (MARKDOWN):
{cv as Markdown, or "(no proporcionado)"}

Herramientas / metodologías del candidato: {tools, comma-separated, or "(ninguna)"}
Conocimientos adicionales (no en el CV): {conocimientos, or "(ninguno)"}

LOGROS PRINCIPALES:
{1. title (year) — impacto: impact: detail   ×N, or "(ninguno)"}

JOB DETAILS:
- Empresa: {empresa}
- Posición: {posicion}
- Job description:
{full JD text, or "(no proporcionado)"}

CONTEXTO:
- Fecha de la entrevista: {fecha or "(no especificada)"}
- Etapa del proceso: {stage or "(general)"}
- Título del entrevistador: {interviewerTitle or "(no especificado)"}
- LinkedIn del entrevistador: {linkedinUrl or "(no especificado)"}
```

Where the inputs come from:

| Input | Source |
|-------|--------|
| CV (Markdown) | `/profile → Mis CVs` (PDF/DOCX uploaded, converted, one marked active) |
| Conocimientos | `/profile → Conocimientos` (skills/certs not visible on the CV) |
| Logros | `/profile → Logros` (title, year, impact, detail) |
| Empresa, Posición, Fecha, JD | Entrada (screen 01) |
| Etapa, entrevistador, LinkedIn, tools | Entrada's collapsible config panel |
| Preferred language | Member preference (Preferencias / footer toggle) |

---

## 6. The full assembled prompt (paste-ready for the Project)

This is exactly what goes over the wire for a run (system + user), using the
current defaults and an illustrative candidate. Paste it into the Claude Project
to experiment; edit the **§2** fields, keep the **§3** contract fixed.

**SYSTEM:**
```
# Rol
Eres un reclutador ejecutivo experto y estratega de preparación de entrevistas para "The Interview Room" (TIR). Analizas el CV y el stack técnico del candidato contra la vacante (JD) y el contexto de la entrevista, y produces un diagnóstico estructurado.

# Restricciones y límites
- Usá solo evidencia real del CV y del JD; no inventes.
- box_1: puntuá 0-100 (enteros) tres pilares — skills técnicas, capacidades núcleo, títulos/grados — comparando CV vs JD.
- Adaptá todo específicamente a una entrevista de etapa: Jefe Directo.
- Respondé en español.

# Requisitos técnicos
La respuesta debe ser JSON estricto que cumpla el contrato de salida (box_1, gap, adjetivo, resultado, question_set).

# Instrucciones de salida
Producí:
1. box_1: % de match de skills técnicas, capacidades y títulos/grados.
2. gap: el déficit principal frente al JD + estrategia para pivotearlo.
3. adjetivo: una afirmación vaga del CV reescrita con evidencia.
4. resultado: una tarea sin métrica reescrita con impacto medible.
5. question_set: 5-7 preguntas para la etapa Jefe Directo, cada una con su intención (questions_why).

== OUTPUT FORMAT (NO NEGOCIABLE) ==
Respondé ÚNICAMENTE con un objeto JSON válido con exactamente esta estructura
(sin texto adicional, sin markdown, sin backticks):

{ … the §3 contract … }
```

**USER:**
```
CANDIDATE CV (MARKDOWN):
# Valentina Rossi
Marketing Manager con 8 años de experiencia…

Herramientas / metodologías del candidato: HubSpot, SQL, Looker
Conocimientos adicionales (no en el CV): SAP, certificación PMP

LOGROS PRINCIPALES:
1. Relanzamiento de marca (2023) — impacto: +40% leads: lideré el rebrand end-to-end.

JOB DETAILS:
- Empresa: Lumen Health
- Posición: Sr. Marketing Manager
- Job description:
Buscamos un líder de marketing con experiencia en growth B2B…

CONTEXTO:
- Fecha de la entrevista: 2026-09-01
- Etapa del proceso: Jefe Directo
- Título del entrevistador: VP Marketing
- LinkedIn del entrevistador: (no especificado)
```

---

## 7. Tuning guide — which lever does what

| You want to… | Edit this field |
|--------------|-----------------|
| Change the voice/persona (tougher coach, warmer mentor) | `role` |
| Change how strictly it scores, or add a scoring rubric | `constraints` (the `box_1` line) |
| Forbid a behavior (no clichés, never invent numbers) | `constraints` |
| Change how many questions, or their difficulty/depth | `outputInstructions` (the `question_set` line) |
| Make rewrites punchier / more specific | `outputInstructions` (adjetivo/resultado lines) |
| Tailor harder to the interview stage | reference `{{interview.stage}}` in more fields |
| Make it more/less deterministic | `temperature` (lower = steadier) |

**Rules of thumb**
- Keep instructions in the field they belong to; don't restate the JSON format
  (the contract already does, forcefully).
- Prefer *evidence-based* phrasing — the product's promise is "no inventes".
- Every scored pillar (`box_1`) should have a clear definition in `constraints`,
  or scores drift between runs.
- If you add a new question type or tone, add one line to `outputInstructions`
  rather than overloading `role`.
- Test at `temperature 0.2` first; only raise it if answers feel too templated.

**What NOT to change here** (needs a code change): the output JSON keys, the
number of `box_1` pillars, adding a whole new output section, or swapping the
provider to Claude. Those live in `lib/prompt/diagnostic.ts`, the screen, and
`lib/ai/`.

---

## 8. Where each piece lives in the codebase (reference)

| Concern | File |
|---------|------|
| Editable fields, defaults, `{{var}}` substitution | `lib/prompt/config.ts` |
| Fixed output contract + `responseSchema` + parser | `lib/prompt/diagnostic.ts` |
| Intake type + the user-content data block | `lib/prompt/intake.ts` |
| System-instruction assembly + model fallback | `lib/ai/generateAnalysis.ts` |
| Gemini REST call | `lib/ai/gemini.ts` |
| Load/save the 4 Studio profiles | `lib/prompt/store.ts` |
| Run endpoint | `app/api/analyze/route.ts` |
| Studio load/save endpoint | `app/api/prompt-config/route.ts` |
| The Studio UI | `app/studio/` |
