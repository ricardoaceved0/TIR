/**
 * GET /api/account/export?scope=account|runs&format=csv|xlsx
 * Exports the signed-in user's data. `account` = everything (profile, CVs,
 * subscription, history) as a multi-sheet workbook / sectioned CSV; `runs` =
 * just the diagnostic history as one table. RLS scopes everything to the user.
 */
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Cell = string | number | null | undefined;

function csvCell(v: Cell): string {
  const s = v == null ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function csvTable(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
}
function csvSection(title: string, header: string[], rows: Cell[][]): string {
  return `# ${title}\r\n${csvTable(header, rows)}`;
}

const RUNS_HEADER = [
  "Fecha", "Empresa", "Posición", "Etapa", "Modelo",
  "Technical %", "Abilities %", "Títulos %",
  "Gap", "Estrategia", "Adjetivo débil", "Adjetivo mejorado",
  "Tarea", "Resultado", "# Preguntas", "Job description", "CV (chars)", "Diagnóstico (JSON)",
];

type Dx = {
  box_1?: { technical_match?: number; abilities_match?: number; titles_degrees_match?: number };
  gap?: { identified_gap?: string; mitigation_strategy?: string };
  adjetivo?: { weak_claim?: string; evidenced_upgrade?: string };
  resultado?: { task_focused_statement?: string; metric_driven_upgrade?: string };
  question_set?: unknown[];
};

function runsRows(runs: Record<string, unknown>[]): Cell[][] {
  return runs.map((r) => {
    const d = (r.diagnostic ?? {}) as Dx;
    const b = d.box_1 ?? {};
    return [
      String(r.created_at ?? ""),
      r.empresa as string, r.posicion as string, r.stage as string, r.model as string,
      b.technical_match, b.abilities_match, b.titles_degrees_match,
      d.gap?.identified_gap, d.gap?.mitigation_strategy,
      d.adjetivo?.weak_claim, d.adjetivo?.evidenced_upgrade,
      d.resultado?.task_focused_statement, d.resultado?.metric_driven_upgrade,
      Array.isArray(d.question_set) ? d.question_set.length : 0,
      r.job_description as string,
      ((r.cv_text as string) ?? "").length,
      JSON.stringify(d),
    ];
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") === "runs" ? "runs" : "account";
  const format = url.searchParams.get("format") === "csv" ? "csv" : "xlsx";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "No autenticado." }, { status: 401 });

  const runs =
    (await supabase.from("runs").select("*").eq("user_id", user.id).order("created_at", { ascending: false })).data ??
    [];

  let profile: Record<string, unknown> | null = null;
  let cvs: Record<string, unknown>[] = [];
  let sub: Record<string, unknown> | null = null;
  if (scope === "account") {
    profile = (await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()).data;
    cvs = (await supabase.from("cvs").select("filename,is_active,markdown,created_at").eq("user_id", user.id)).data ?? [];
    sub = (await supabase.from("subscriptions").select("*").eq("user_id", user.id).maybeSingle()).data;
  }

  const base = scope === "account" ? "tir-cuenta" : "tir-historial";

  if (format === "csv") {
    let csv: string;
    if (scope === "account") {
      csv = [
        csvSection("PERFIL", ["Campo", "Valor"], [
          ["Nombre", (profile?.full_name as string) ?? ""],
          ["Correo", user.email ?? ""],
          ["Rol", (profile?.role as string) ?? "regular"],
          ["Bloqueada", profile?.locked ? "sí" : "no"],
        ]),
        csvSection("CVS", ["Archivo", "Activo", "Creado", "Markdown"],
          cvs.map((c) => [c.filename as string, c.is_active ? "sí" : "no", String(c.created_at ?? ""), (c.markdown as string) ?? ""])),
        csvSection("SUSCRIPCION", ["Campo", "Valor"], [
          ["Plan", (sub?.plan as string) ?? ""],
          ["Estado", (sub?.status as string) ?? ""],
          ["Créditos", (sub?.credits as number) ?? ""],
          ["Renueva", (sub?.renews_at as string) ?? ""],
        ]),
        csvSection("HISTORIAL", RUNS_HEADER, runsRows(runs)),
      ].join("\r\n\r\n");
    } else {
      csv = csvTable(RUNS_HEADER, runsRows(runs));
    }
    return new Response("﻿" + csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${base}.csv"`,
      },
    });
  }

  // xlsx
  const wb = new ExcelJS.Workbook();
  if (scope === "account") {
    const ps = wb.addWorksheet("Perfil");
    ps.addRow(["Campo", "Valor"]);
    ps.addRows([
      ["Nombre", (profile?.full_name as string) ?? ""],
      ["Correo", user.email ?? ""],
      ["Rol", (profile?.role as string) ?? "regular"],
      ["Bloqueada", profile?.locked ? "sí" : "no"],
    ]);
    const cs = wb.addWorksheet("CVs");
    cs.addRow(["Archivo", "Activo", "Creado", "Markdown"]);
    cvs.forEach((c) => cs.addRow([c.filename, c.is_active ? "sí" : "no", String(c.created_at ?? ""), c.markdown]));
    const ss = wb.addWorksheet("Suscripción");
    ss.addRow(["Campo", "Valor"]);
    ss.addRows([
      ["Plan", (sub?.plan as string) ?? ""],
      ["Estado", (sub?.status as string) ?? ""],
      ["Créditos", (sub?.credits as number) ?? ""],
      ["Renueva", (sub?.renews_at as string) ?? ""],
    ]);
  }
  const rs = wb.addWorksheet("Historial");
  rs.addRow(RUNS_HEADER);
  runsRows(runs).forEach((r) => rs.addRow(r));

  const buf = await wb.xlsx.writeBuffer();
  return new Response(buf, {
    headers: {
      "content-type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="${base}.xlsx"`,
    },
  });
}
