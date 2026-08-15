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
};

export async function callGemini({ model, temperature, system, userContent }: GeminiCall): Promise<string> {
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
      maxOutputTokens: 2048,
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
    candidates?: { content?: { parts?: { text?: string }[] } }[];
    promptFeedback?: { blockReason?: string };
  };

  if (data.promptFeedback?.blockReason) {
    throw new Error(`Gemini bloqueó la solicitud: ${data.promptFeedback.blockReason}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
  if (!text.trim()) {
    throw new Error("Gemini devolvió una respuesta vacía.");
  }
  return text;
}
