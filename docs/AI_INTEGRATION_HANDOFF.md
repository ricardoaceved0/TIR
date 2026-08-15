# Handoff — Wire the AI analysis on Entrada → Diagnóstico

Paste this whole file into a **new Claude Code session** to start the AI work.
It contains everything needed to replace the simulated analysis with a real
Anthropic (Claude) API call.

---

## Goal

When the user fills **Entrada** (stage 01) and taps **Enviar**, the app jumps to
**Diagnóstico** (stage 02) and shows an "Análisis de la sala" box in a loading
state. Today that box is filled by a `setTimeout` with canned text. Replace it
with a real call to the Claude API that analyzes the job description + intake
and returns the diagnosis.

**Tech:** Next.js (App Router) + TypeScript. Use the official
**`@anthropic-ai/sdk`** from a **Next.js Route Handler** (server-side). Do NOT
call the API from the browser — the API key must stay server-only.

**Model:** `claude-opus-5` (the current default). Only switch if the product
owner asks (e.g. `claude-sonnet-5` or `claude-haiku-4-5` for lower cost).

> Before writing any Claude code, load the `claude-api` skill (`/claude-api`)
> for the current SDK syntax, model IDs, and streaming/structured-output
> patterns. The snippets below are a starting point, not a substitute.

---

## The exact integration point

File: `app/member/MemberArea.tsx`, function `submitEntrada`. It currently does:

```tsx
const submitEntrada = () => {
  const val = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value.trim() || "";
  const empresa = val("empresa") || "la empresa";
  const posicion = val("posicion") || "esta posición";
  setAiText("");
  setAiState("loading");
  go("s2");
  if (aiTimer.current) window.clearTimeout(aiTimer.current);
  aiTimer.current = window.setTimeout(() => {
    setAiText(`Leí el job description para ${posicion} en ${empresa}. …`);
    setAiState("done");
  }, 2400);
};
```

Replace the `setTimeout` block with a `fetch` to a new route handler. Keep the
`aiState` machine (`"idle" | "loading" | "done"`) and the `aiText` string — the
UI (the `.ai-box` in the Diagnóstico section) already renders all three states.

Also read the other intake fields, which are plain uncontrolled inputs:
`empresa`, `posicion`, `fecha` (a `type="date"` input → `YYYY-MM-DD`), `jd`
(the job-description textarea). The interview-config values live in React state:
`stage` (process stage), `liUrl` (interviewer LinkedIn), `tools` (string[]).

---

## Data contract

**Client → server (POST `/api/analyze`):**

```ts
type AnalyzeRequest = {
  empresa: string;
  posicion: string;
  fecha: string;        // YYYY-MM-DD, may be ""
  jobDescription: string;
  stage: string;        // e.g. "Reclutador" | "Jefe Directo" | "Pares · Equipo" | "Ronda Final · Ejecutivo"
  linkedinUrl: string;  // may be ""
  tools: string[];      // e.g. ["HubSpot","SQL"]
};
```

**Server → client:** for the first cut, stream or return plain Spanish text and
put it in `aiText`. When you're ready for the richer Diagnóstico UI (the three
"problemas" cards and the question set that already exist as static markup),
switch to **structured output** with a schema like:

```ts
type Analysis = {
  summary: string;                 // the "Análisis de la sala" paragraph
  realProblem: { title: string; detail: string };   // the dark card
  problems: { term: string; severity: "CRÍTICO" | "ALTO" | "MEDIO"; definition: string }[]; // 3 items
  questions: string[];             // the tailored question set
};
```

Use `client.messages.parse({ output_config: { format: zodOutputFormat(schema) } })`
(structured outputs) so the response validates against the schema.

---

## Suggested implementation

1. `npm install @anthropic-ai/sdk zod`
2. Add `ANTHROPIC_API_KEY` to `.env.local` and to Vercel (server-side only).
3. Create the route handler:

```ts
// app/api/analyze/route.ts
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";        // SDK needs Node, not edge
export const dynamic = "force-dynamic";

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env

export async function POST(req: Request) {
  const body = await req.json();
  const { empresa, posicion, jobDescription, stage, tools } = body ?? {};

  const system =
    "Eres la sala de The Interview Room. Analizas el job description y el rol " +
    "para explicarle a la candidata el problema real detrás de la vacante y " +
    "cómo debe orientar su narrativa. Responde en español, directo y concreto.";

  const stream = client.messages.stream({
    model: "claude-opus-5",
    max_tokens: 2048,
    system,
    messages: [{
      role: "user",
      content:
        `Empresa: ${empresa}\nPosición: ${posicion}\n` +
        `Etapa del proceso: ${stage}\nHerramientas del rol: ${(tools ?? []).join(", ")}\n\n` +
        `Job description:\n${jobDescription}`,
    }],
  });

  // Stream text back to the browser as it's generated.
  return new Response(stream.toReadableStream(), {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
```

4. In `submitEntrada`, POST the intake and read the stream into `aiText`:

```tsx
const submitEntrada = async () => {
  const val = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value.trim() || "";
  setAiText("");
  setAiState("loading");
  go("s2");
  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        empresa: val("empresa"),
        posicion: val("posicion"),
        fecha: val("fecha"),
        jobDescription: (document.getElementById("jd") as HTMLTextAreaElement | null)?.value ?? "",
        stage,
        linkedinUrl: liUrl,
        tools,
      }),
    });
    if (!res.body) throw new Error("no stream");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let text = "";
    setAiState("done"); // reveal the box; text streams in
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      text += dec.decode(value, { stream: true });
      setAiText(text);
    }
  } catch {
    setAiState("done");
    setAiText("No pude generar el análisis. Intenta de nuevo.");
  }
};
```

> Note: `stream.toReadableStream()` emits raw SSE event JSON. The snippet above
> is simplified — decode the `text_delta` chunks (or use a plain non-streaming
> `client.messages.create` and return `response.content[0].text` for the first
> version, then add streaming). Check the `claude-api` skill for the exact
> streaming shape before shipping.

---

## Checklist

- [ ] `ANTHROPIC_API_KEY` set locally and in Vercel (server-side only; never `NEXT_PUBLIC_`).
- [ ] `app/api/analyze/route.ts` route handler calling `claude-opus-5`.
- [ ] `submitEntrada` POSTs the intake and drives `aiState`/`aiText` from the response.
- [ ] Handle errors and empty inputs gracefully (the box has an error state).
- [ ] (Later) Switch to structured output to populate the Diagnóstico cards + question set.
- [ ] (Later) Persist the analysis to Supabase so it survives navigation/reload.

## Guardrails

- Never expose the API key to the client. Route handler / server action only.
- Job descriptions can be long — prefer streaming (`client.messages.stream`) so
  the request doesn't hit an HTTP timeout, and set a sensible `max_tokens`.
- The Diagnóstico UI already exists in `MemberArea.tsx` (dark "problema real"
  card, three `.entry` blocks, the question set). Wire real data into those
  instead of rebuilding them.
