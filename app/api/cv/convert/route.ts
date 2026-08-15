import mammoth from "mammoth";
import { extractText, getDocumentProxy } from "unpdf";

// mammoth ships convertToMarkdown at runtime but omits it from its types.
const mammothMd = mammoth as unknown as {
  convertToMarkdown: (input: { buffer: Buffer }) => Promise<{ value: string }>;
};

export const runtime = "nodejs"; // parsing libs need Node, not edge
export const dynamic = "force-dynamic";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

function extOf(name: string) {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toLowerCase() : "";
}

/** Collapse a flat text dump into lightweight Markdown paragraphs. */
function textToMarkdown(raw: string) {
  return raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Convert an uploaded CV (PDF or DOCX) to Markdown, server-side.
 * POST multipart/form-data with a `file` field. Returns { ok, markdown }.
 * Stateless — does not require auth or storage; persisting the result to a
 * user's CV library is handled separately once auth + Storage exist.
 */
export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ ok: false, error: "No se recibió ningún archivo." }, { status: 400 });
    }
    if (file.size === 0) {
      return Response.json({ ok: false, error: "El archivo está vacío." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ ok: false, error: "El archivo supera el límite de 8 MB." }, { status: 413 });
    }

    const ext = extOf(file.name);
    const buffer = Buffer.from(await file.arrayBuffer());

    let markdown = "";
    if (ext === "docx" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const { value } = await mammothMd.convertToMarkdown({ buffer });
      markdown = value.trim();
    } else if (ext === "pdf" || file.type === "application/pdf") {
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const { text } = await extractText(pdf, { mergePages: true });
      markdown = textToMarkdown(Array.isArray(text) ? text.join("\n\n") : text);
    } else {
      return Response.json(
        { ok: false, error: "Formato no soportado. Sube un PDF o un DOCX." },
        { status: 415 }
      );
    }

    if (!markdown) {
      return Response.json(
        { ok: false, error: "No se pudo extraer texto. ¿El PDF es una imagen escaneada?" },
        { status: 422 }
      );
    }

    return Response.json({ ok: true, markdown, filename: file.name });
  } catch (e) {
    return Response.json(
      { ok: false, error: e instanceof Error ? e.message : "Error al convertir el archivo." },
      { status: 500 }
    );
  }
}
