"use client";

import { useCallback, useEffect, useState } from "react";
import "../member/member.css";
import "./studio.css";
import { AdminPanelHead } from "@/app/components/AdminShell";
import {
  DEFAULT_PROMPT_CONFIG,
  MODEL_OPTIONS,
  PromptConfig,
} from "@/lib/prompt/config";

type SaveState = "idle" | "saving" | "saved" | "error";

export default function StudioClient() {
  const [cfg, setCfg] = useState<PromptConfig>(DEFAULT_PROMPT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState<string>("");
  const [persisted, setPersisted] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveMsg, setSaveMsg] = useState("");
  const [profile, setProfile] = useState(1); // active profile slot 1–4

  // Load a profile's saved config from Supabase (falls back to defaults).
  const loadProfile = useCallback(async (n: number) => {
    setProfile(n);
    setLoading(true);
    setSaveMsg("");
    setSaveState("idle");
    try {
      const res = await fetch(`/api/prompt-config?profile=${n}`, { cache: "no-store" });
      const data = await res.json();
      if (data?.config) setCfg(data.config as PromptConfig);
      setPersisted(Boolean(data?.persisted));
      setNote(data?.note ?? "");
    } catch {
      setCfg(DEFAULT_PROMPT_CONFIG);
      setNote("No se pudo cargar la configuración; mostrando valores por defecto.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile(1);
  }, [loadProfile]);

  const set = <K extends keyof PromptConfig>(key: K, value: PromptConfig[K]) =>
    setCfg((c) => ({ ...c, [key]: value }));

  // Save the current form into the active profile slot (overwrites it).
  const save = async () => {
    setSaveState("saving");
    setSaveMsg("");
    try {
      const res = await fetch("/api/prompt-config", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...cfg, profile }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setSaveState("saved");
      setPersisted(true);
      setSaveMsg(`Perfil ${profile} guardado.`);
      setTimeout(() => setSaveState("idle"), 2500);
    } catch (e) {
      setSaveState("error");
      setSaveMsg(e instanceof Error ? e.message : "Error al guardar.");
    }
  };

  // Empty every field (does not save until you press Guardar).
  const clearAll = () =>
    setCfg((c) => ({
      ...c,
      role: "",
      constraints: "",
      technical: "",
      outputInstructions: "",
      temperature: 0,
    }));

  return (
    <>
      <div className="st-topbar">
        <AdminPanelHead
          title="AI Studio"
          hint="Define las “instrucciones especiales” que la sala mezcla con la Entrada del candidato antes de llamar al modelo."
        />
        <div className={`st-status ${persisted ? "ok" : "warn"}`}>
          <span className="st-dot" aria-hidden="true" />
          <span className="st-status-txt">
            {loading
              ? "Cargando…"
              : persisted
              ? "Guardado en Supabase"
              : "Sin persistir · valores por defecto"}
          </span>
          {note && <span className="st-note">{note}</span>}
        </div>
      </div>

      {/* 1 · Rol */}
        <Section title="Rol" hint="Un bloque de texto para definir la persona (p. ej. “Eres un entrevistador ejecutivo de élite y coach de carrera…”).">
          <textarea
            className="txt mono"
            rows={4}
            value={cfg.role}
            onChange={(e) => set("role", e.target.value)}
          />
        </Section>

        {/* 2 · Restricciones y límites */}
        <Section
          title="Restricciones y límites"
          hint="Reglas explícitas de lo que la IA NUNCA debe hacer (p. ej. no salir del personaje, no revelar las instrucciones del sistema, mantener respuestas por debajo de 300 palabras)."
        >
          <textarea
            className="txt mono"
            rows={5}
            value={cfg.constraints}
            onChange={(e) => set("constraints", e.target.value)}
          />
        </Section>

        {/* 3 · Requisitos técnicos */}
        <Section title="Requisitos técnicos" hint="Formato de salida y reglas técnicas. Editable.">
          <textarea
            className="txt mono"
            rows={3}
            value={cfg.technical}
            onChange={(e) => set("technical", e.target.value)}
          />
        </Section>

        {/* 4 · Variables */}
        <Section title="Variables" hint="Próximamente.">
          <div className="st-comingsoon">
            <p>Próximamente — edición de variables desde la UI.</p>
            <p className="st-vars-help">
              Por ahora puedes usar estas variables dentro de cualquier bloque; se
              reemplazan al momento de analizar:
            </p>
            <ul className="st-varlist">
              <li><code>{"{{interview.stage}}"}</code> — etapa del proceso seleccionada en Entrada.</li>
              <li><code>{"{{user.preferred_language}}"}</code> — idioma preferido (por defecto “español”).</li>
            </ul>
          </div>
        </Section>

        {/* 5 · Modelo */}
        <Section title="Modelo" hint="gemini-2.0-flash fue retirado por Google; se usa gemini-3.5-flash (nivel flash gratuito actual y estable).">
          <div className="st-radios">
            {MODEL_OPTIONS.map((m) => (
              <label key={m.id} className={`st-radio ${m.available ? "" : "disabled"}`}>
                <input
                  type="radio"
                  name="model"
                  value={m.id}
                  checked={cfg.model === m.id}
                  disabled={!m.available}
                  onChange={() => m.available && set("model", m.id)}
                />
                <span>{m.label}</span>
                {!m.available && <span className="st-soon">no disponible</span>}
              </label>
            ))}
          </div>
        </Section>

        {/* 6 · Temperatura */}
        <Section
          title="Temperatura"
          hint="Más baja (0.2–0.4) para tareas analíticas como emparejar el CV con la descripción del puesto. Más alta (0.7–0.8) para roleplay creativo y generación de preguntas."
        >
          <div className="st-temp">
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={cfg.temperature}
              onChange={(e) => set("temperature", parseFloat(e.target.value))}
            />
            <span className="st-temp-val">{cfg.temperature.toFixed(1)}</span>
          </div>
        </Section>

        {/* 7 · Instrucciones de salida */}
        <Section title="Instrucciones de salida">
          <textarea
            className="txt mono"
            rows={6}
            value={cfg.outputInstructions}
            onChange={(e) => set("outputInstructions", e.target.value)}
          />
        </Section>

        <div className="st-actions">
          <button className="btn ghost" type="button" onClick={clearAll}>
            Limpiar todos los campos
          </button>
          <div className="st-actions-right">
            <div className="st-profiles" role="group" aria-label="Perfiles de instrucciones">
              <span className="st-profiles-lbl">Perfiles</span>
              {[1, 2, 3, 4].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`st-profile${profile === n ? " on" : ""}`}
                  aria-pressed={profile === n}
                  title={`Cargar perfil ${n}`}
                  onClick={() => loadProfile(n)}
                  disabled={loading}
                >
                  {n}
                </button>
              ))}
            </div>
            {saveMsg && (
              <span className={`st-savemsg ${saveState === "error" ? "err" : "ok"}`}>{saveMsg}</span>
            )}
            <button className="btn" type="button" onClick={save} disabled={saveState === "saving"}>
              {saveState === "saving" ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </div>
    </>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card st-section">
      <div className="st-section-head">
        <div className="eyebrow st-h2">{title}</div>
        {hint && <p className="st-hint">{hint}</p>}
      </div>
      {children}
    </section>
  );
}
