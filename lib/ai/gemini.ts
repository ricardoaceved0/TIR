/**
 * Thin server-only wrapper over Google's Generative Language REST API.
 *
 * We call the REST endpoint directly (no SDK) — it's a single fetch, keeps
 * the dependency tree small, and works with the current key/endpoint. The
 * API key is read from GEMINI_API_KEY and must NEVER reach the browser.
 */

const API_ROOT = "https://generativelanguage.googleapis.com/v1beta";

export type GeminiCall = {
  model: string;
  temperature: number;
  system: string;
  userContent: string;
  /** Force a MIME type (e.g. "application/json") for structured output. */
  responseMimeType?: string;
  /** OpenAPI-subset schema constraining the response (structured output). */
  responseSchema?: unknown;
  /** Cap on output tokens (default 8192). */
  maxOutputTokens?: number;
  /** Gemini 2.5 thinking budget. 0 disables "thinking" (flash only) so the
   *  whole token budget goes to the answer — important for JSON extraction. */
  thinkingBudget?: number;
};

export async function callGemini({
  model,
  temperature,
  system,
  userContent,
  responseMimeType,
  responseSchema,
  maxOutputTokens = 8192,
  thinkingBudget,
}: GeminiCall): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY no está configurada en el servidor.");
  }

  const url = `${API_ROOT}/models/${encodeURIComponent(model)}:generateContent?key=${key}`;
  const payload = JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts: [{ text: userContent }] }],
    generationConfig: {
      temperature,
      maxOutputTokens,
      ...(responseMimeType ? { responseMimeType } : {}),
      ...(responseSchema ? { responseSchema } : {}),
      ...(thinkingBudget !== undefined ? { thinkingConfig: { thinkingBudget } } : {}),
    },
  });

  // Free-tier flash models occasionally return 503 (overloaded) or 429
  // (rate-limited). Retry those a few times with exponential backoff.
  let res: Response | null = null;
  const delays = [800, 1600, 3200];
  for (let attempt = 0; attempt <= delays.length; attempt++) {
    res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      cache: "no-store",
      body: payload,
    });
    if (res.ok || (res.status !== 503 && res.status !== 429) || attempt === delays.length) break;
    await new Promise((r) => setTimeout(r, delays[attempt]));
  }

  if (!res || !res.ok) {
    const detail = res ? await res.text().catch(() => "") : "";
    throw new Error(`Gemini HTTP ${res?.status ?? "?"}: ${detail.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    candidates?: {
      content?: { parts?: { text?: string; thought?: boolean }[] };
      finishReason?: string;
    }[];
    promptFeedback?: { blockReason?: string };
  };

  if (data.promptFeedback?.blockReason) {
    throw new Error(`Gemini bloqueó la solicitud: ${data.promptFeedback.blockReason}`);
  }

  const candidate = data.candidates?.[0];
  // Exclude "thought" parts (2.5 thinking) — we only want the answer text.
  const text =
    candidate?.content?.parts
      ?.filter((p) => !p.thought)
      .map((p) => p.text ?? "")
      .join("") ?? "";

  if (!text.trim()) {
    if (candidate?.finishReason === "MAX_TOKENS") {
      throw new Error("La respuesta se truncó por límite de tokens. Intenta de nuevo.");
    }
    throw new Error("Gemini devolvió una respuesta vacía.");
  }
  return text;
}

/** True when an error looks like "model not found / not available to this key". */
export function isModelUnavailable(err: unknown): boolean {
  const s = err instanceof Error ? err.message : String(err);
  return /HTTP 404|NOT_FOUND|no longer available|not found|is not supported/i.test(s);
}

/** List model IDs this API key can call with generateContent. */
export async function listGenerateContentModels(): Promise<string[]> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return [];
  try {
    const res = await fetch(`${API_ROOT}/models?key=${key}&pageSize=1000`, { cache: "no-store" });
    if (!res.ok) return [];
    const data = (await res.json()) as {
      models?: { name?: string; supportedGenerationMethods?: string[] }[];
    };
    return (data.models ?? [])
      .filter((m) => (m.supportedGenerationMethods ?? []).includes("generateContent"))
      .map((m) => (m.name ?? "").replace(/^models\//, ""))
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** Pick the best general-purpose flash model from a list of available IDs. */
export function pickBestModel(models: string[]): string | null {
  const usable = models.filter(
    (m) => /gemini/i.test(m) && !/(embedding|aqa|image|imagen|tts|audio|live|vision|thinking|exp)/i.test(m)
  );
  const score = (m: string) => {
    let s = /latest/i.test(m) ? 1000 : 0;
    const ver = m.match(/(\d+(?:\.\d+)?)/);
    if (ver) s += parseFloat(ver[1]) * 10;
    if (/flash/i.test(m)) s += 5;
    if (/lite/i.test(m)) s -= 3;
    if (/preview/i.test(m)) s -= 1;
    return s;
  };
  const pool = usable.length ? usable : models;
  return pool.sort((a, b) => score(b) - score(a))[0] ?? null;
}
