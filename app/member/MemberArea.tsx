"use client";

import { useEffect, useRef, useState } from "react";
import "./member.css";
import { SiteHeader, SiteFooter } from "@/app/components/SiteChrome";

type ScreenId = "s1" | "s2" | "s3" | "s4" | "s5";

const STEPS: { id: ScreenId; num: string; lbl: string }[] = [
  { id: "s1", num: "01", lbl: "Entrada" },
  { id: "s2", num: "02", lbl: "Diagnóstico" },
  { id: "s3", num: "03", lbl: "La sala" },
  { id: "s4", num: "04", lbl: "El edit" },
  { id: "s5", num: "05", lbl: "Story Bank" },
];

const MODES = ["Conductual", "Técnica", "Panel", "Promoción interna", "Hostil"];

const STAGES = [
  { v: "Reclutador", full: "Reclutador", short: "Reclutador" },
  { v: "Jefe Directo", full: "Jefe Directo", short: "Jefe Directo" },
  { v: "Pares · Equipo", full: "Pares · Equipo", short: "Pares/Equipo" },
  { v: "Ronda Final · Ejecutivo", full: "Ronda Final · Ejecutivo", short: "Ejecutivo" },
];

const NOTES: Record<string, [string, string]> = {
  disculpa: [
    "Ownership, sin disculpa",
    "Le estás enseñando al panel a leerlo como un problema antes de que ellos decidan si lo es. Quita la frase completa. El gap no necesita permiso: necesita marco.",
  ],
  adjetivo: [
    "Evidencia en vez de adjetivos",
    "“Hard worker” lo dice todo el mundo y no lo prueba nadie. Reemplázalo por el resultado que solo tú tienes.",
  ],
  verbo: [
    "Resultado medible",
    "“Handled” describe una tarea, no un impacto. Cambia el verbo y pega el número: led / took / rebuilt + cuánto.",
  ],
  hedge: [
    "¿Eres la solución a su problema?",
    "“I think I could” te pone a pedir permiso. Ellos tienen un problema concreto de activación: nómbralo y di que ya lo resolviste antes.",
  ],
};

const RAW_ANSWER =
  "So, um, I took some time off after my daughter was born — about fourteen months — and I know that's a bit of a gap. Before that I was at Meridian for four years, where I was a hard worker and I handled marketing for a few product lines. I'm really passionate about health tech and I think I could bring a lot to this role.";

function SlidersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </svg>
  );
}

export default function MemberArea() {
  const [view, setView] = useState<ScreenId>("s1");
  const [mode, setMode] = useState("Conductual");
  const [answer, setAnswer] = useState(RAW_ANSWER);
  const [activeNote, setActiveNote] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(107);

  const clockRef = useRef<number | null>(null);

  useEffect(() => {
    clockRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (clockRef.current) window.clearInterval(clockRef.current);
    };
  }, []);

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const activeStep = STEPS.find((s) => s.id === view) ?? STEPS[0];

  // mobile nav: the active-stage label is hidden by default and flashes on tap
  const [showNavLabel, setShowNavLabel] = useState(false);
  const navLabelTimer = useRef<number | null>(null);
  const flashNavLabel = () => {
    setShowNavLabel(true);
    if (navLabelTimer.current) window.clearTimeout(navLabelTimer.current);
    navLabelTimer.current = window.setTimeout(() => setShowNavLabel(false), 2200);
  };
  useEffect(() => () => {
    if (navLabelTimer.current) window.clearTimeout(navLabelTimer.current);
  }, []);

  // Entrada: collapsible interview-configuration section
  const [cfgOpen, setCfgOpen] = useState(false);
  const [stage, setStage] = useState(STAGES[0].v);
  const [liUrl, setLiUrl] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [toolDraft, setToolDraft] = useState("");
  const addTool = () => {
    const t = toolDraft.trim();
    if (t && !tools.includes(t)) setTools([...tools, t]);
    setToolDraft("");
  };
  const removeTool = (t: string) => setTools(tools.filter((x) => x !== t));

  const go = (id: ScreenId) => {
    setView(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Diagnóstico: AI analysis state. On submit we jump to s2, POST the intake
  // to /api/analyze, and drop the raw AI response into the .ai-box. The
  // server mixes these inputs with the editable Prompt Studio config and
  // calls the model — the API key never touches the browser.
  const [aiState, setAiState] = useState<"idle" | "loading" | "done">("idle");
  const [aiText, setAiText] = useState("");

  const submitEntrada = async () => {
    const val = (id: string) => (document.getElementById(id) as HTMLInputElement | null)?.value.trim() || "";
    const jd = (document.getElementById("jd") as HTMLTextAreaElement | null)?.value.trim() || "";
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
          jobDescription: jd,
          stage,
          linkedinUrl: liUrl,
          tools,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setAiText(data.text as string);
      setAiState("done");
    } catch (e) {
      setAiText(
        `No pude generar el análisis. ${e instanceof Error ? e.message : "Intenta de nuevo."}`
      );
      setAiState("done");
    }
  };

  return (
    <div className="tir">
      <div className="ghost-bg" aria-hidden="true">
        <span className="g1">narrative</span>
        <span className="g2">re·source /rɪˈsɔːs/</span>
        <span className="g3">the gap is not the problem</span>
        <span className="g4">evidence</span>
        <span className="g5">ownership /ˈəʊnəʃɪp/</span>
        <span className="g6">tell me about yourself</span>
        <span className="g7">leverage</span>
        <span className="g8">what are your salary expectations</span>
        <span className="g9">pivot /ˈpɪvət/</span>
        <span className="g10">say it again</span>
      </div>

      <SiteHeader onBrand={() => go("s1")} avatar="VR" />

      <nav className="steps" role="tablist" aria-label="Etapas">
        <div className="steps-in">
          {STEPS.map((s) => (
            <button
              key={s.id}
              className="step"
              role="tab"
              aria-selected={view === s.id}
              onClick={() => go(s.id)}
            >
              <span className="num">{s.num}</span>
              <span className="lbl">{s.lbl}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* mobile stage nav (option D): fixed numbers + active label */}
      <nav className="steps-m" aria-label="Etapas">
        <div className="steps-m-nums">
          {STEPS.map((s) => (
            <button
              key={s.id}
              className="dnum"
              aria-current={view === s.id ? "step" : undefined}
              aria-label={`Etapa ${s.num}: ${s.lbl}`}
              onClick={() => {
                go(s.id);
                flashNavLabel();
              }}
            >
              <span className="n">{s.num}</span>
            </button>
          ))}
        </div>
        <div className={`steps-m-label${showNavLabel ? " show" : ""}`} aria-hidden={!showNavLabel}>
          <span className="num">{activeStep.num}</span>
          <span className="dash">—</span>
          <span className="lbl">{activeStep.lbl}</span>
        </div>
      </nav>

      <div className="shell">
        {/* ═══════════ 01 ENTRADA ═══════════ */}
        <section className={`screen${view === "s1" ? " on" : ""}`} id="s1">
          <div className="two entrada-hero">
            <div>
              <h1 className="display">
                ¿Qué entrevista
                <br />
                estás <em>preparando?</em>
              </h1>
              <p className="lede">
                Pega el job description. La sala lee lo que la empresa realmente necesita, no lo
                que dice el título del puesto, y arma tu set de preguntas a partir de ahí.
              </p>
            </div>

            <div className="card dark stack sabe-card">
              <h2 className="sect" style={{ color: "#fff" }}>Lo que la sala ya sabe de ti</h2>
              <div className="steps-prog">
                <div className="pstep">
                  <span className="pdot done" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </span>
                  <div className="pbody">
                    <span className="pt">Hoja de Vida</span>
                    <span className="ps done">Completado</span>
                  </div>
                </div>
                <div className="pstep">
                  <span className="pdot todo" aria-hidden="true">2</span>
                  <div className="pbody">
                    <span className="pt">Conocimientos</span>
                    <button type="button" className="plink">Completar →</button>
                  </div>
                </div>
                <div className="pstep">
                  <span className="pdot todo" aria-hidden="true">3</span>
                  <div className="pbody">
                    <span className="pt">Logros</span>
                    <button type="button" className="plink">Completar →</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="kicker-rule" />

          <div className="card entrada-form">
            <div className="entrada-form-row">
              <div>
                <label className="fld" htmlFor="empresa">Empresa</label>
                <input className="txt" id="empresa" placeholder="Nombre de la empresa" />
              </div>
              <div>
                <label className="fld" htmlFor="posicion">Posición</label>
                <input className="txt" id="posicion" placeholder="Título del puesto — ej. Sr. Marketing Manager" />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label className="fld" htmlFor="fecha">Fecha de la entrevista</label>
              <input className="txt txt-date" id="fecha" type="date" aria-label="Fecha de la entrevista (MM/DD/AAAA)" />
            </div>
            <div style={{ marginTop: 16 }}>
              <label className="fld" htmlFor="jd">Job description</label>
              <textarea className="txt" id="jd" rows={6} placeholder="Pega aquí el job description completo. La sala lee lo que la empresa realmente necesita, no solo el título del puesto." />
            </div>

            {/* collapsible interview configuration */}
            <div className={`cfg${cfgOpen ? " open" : ""}`}>
              <button
                type="button"
                className="cfg-head"
                aria-expanded={cfgOpen}
                onClick={() => setCfgOpen((v) => !v)}
              >
                <span className="cfg-title">
                  <span className="cfg-ico" aria-hidden="true"><SlidersIcon /></span>
                  <span className="cfg-title-full">Configuración de la entrevista</span>
                  <span className="cfg-title-short">Configuración</span>
                </span>
                <span className="cfg-meta">
                  Opcional
                  <span className="chev">{cfgOpen ? "▴" : "▾"}</span>
                </span>
              </button>

              {cfgOpen && (
                <div className="cfg-body">
                  <div className="cfg-group">
                    <label className="fld">
                      Etapa del proceso<span className="seg-q"> — ¿a quién vas a enfrentar?</span>
                    </label>
                    {/* desktop: segmented control */}
                    <div className="segrow">
                      {STAGES.map((s) => (
                        <button
                          key={s.v}
                          type="button"
                          className="seg"
                          aria-pressed={stage === s.v}
                          onClick={() => setStage(s.v)}
                        >
                          {s.full}
                        </button>
                      ))}
                    </div>
                    {/* mobile: vertical radio list */}
                    <div className="vlist" role="radiogroup" aria-label="Etapa del proceso">
                      {STAGES.map((s) => (
                        <button
                          key={s.v}
                          type="button"
                          className="vrow"
                          role="radio"
                          aria-checked={stage === s.v}
                          onClick={() => setStage(s.v)}
                        >
                          <span className="rdot" aria-hidden="true" />
                          <span className="vl">{s.short}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="cfg-group">
                    <label className="fld" htmlFor="li">Perfil del entrevistador</label>
                    <input
                      className="txt"
                      id="li"
                      type="url"
                      placeholder="https://linkedin.com/in/nombre-del-entrevistador"
                      value={liUrl}
                      onChange={(e) => setLiUrl(e.target.value)}
                    />
                    <input
                      className="txt subtle"
                      style={{ marginTop: 10 }}
                      placeholder="Título / seniority (opcional) — ej. VP of Marketing"
                    />
                  </div>

                  <div className="cfg-group">
                    <label className="fld" htmlFor="tool">Herramientas y metodologías del rol</label>
                    <div className="chips">
                      {tools.map((t) => (
                        <span className="chip" key={t}>
                          {t}
                          <button
                            type="button"
                            className="x"
                            aria-label={`Quitar ${t}`}
                            onClick={() => removeTool(t)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      <input
                        id="tool"
                        className="chipinput"
                        placeholder="+ Agregar…"
                        value={toolDraft}
                        onChange={(e) => setToolDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            addTool();
                          }
                        }}
                      />
                    </div>
                    <p className="hint">La sala usa esto para hacer preguntas técnicas realistas y afinar tu vocabulario.</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="row-actions end">
            <button className="btn" onClick={submitEntrada}>Enviar</button>
          </div>
        </section>

        {/* ═══════════ 02 DIAGNÓSTICO ═══════════ */}
        <section className={`screen${view === "s2" ? " on" : ""}`} id="s2">
          <h1 className="display">
            No están buscando
            <br />
            un currículum. Están
            <br />
            buscando <em>una solución.</em>
          </h1>

          <div className="kicker-rule" />

          <div className="ai-panel">
            <div className="eyebrow">Análisis de la sala</div>
            <div className={`ai-box ${aiState}`} aria-live="polite">
              {aiState === "loading" && (
                <>
                  <div className="ai-loading-row">
                    <span className="blink" />
                    <span>Analizando tu entrevista…</span>
                  </div>
                  <div className="ai-shimmer" aria-hidden="true"><i /><i /><i /></div>
                </>
              )}
              {aiState === "done" && <p className="ai-text">{aiText}</p>}
              {aiState === "idle" && (
                <p className="ai-empty">
                  Completa <b>Entrada</b> y toca <b>Enviar</b> para ver aquí el análisis de la sala.
                </p>
              )}
            </div>
          </div>

          <div className="kicker-rule" />

          <div className="card dark">
            <div className="eyebrow" style={{ color: "#9c9ca8" }}>El problema real detrás de la vacante</div>
            <h2 className="sect" style={{ color: "#fff" }}>
              Lumen Health no tiene un problema de tráfico.
              <br />
              Tiene un problema de activación.
            </h2>
            <p className="lede">
              Triplicaron signups y la activación a 60 días no se movió. Eso significa que quien
              entre a este puesto no será evaluado por campañas: será evaluado por retención
              temprana. Toda tu narrativa debe apuntar ahí.
            </p>
            <div className="agentline" style={{ marginTop: 18 }}>
              <span className="blink" />
              <span style={{ color: "#a8a8b4" }}>
                Fuentes leídas: job description · sala de prensa · 2 reseñas de producto · perfil del hiring manager
              </span>
            </div>
          </div>

          <div className="kicker-rule" />

          <div className="eyebrow">Tres cosas que hoy te cuestan el puesto</div>
          <div style={{ marginTop: 10 }}>
            <div className="entry">
              <div className="hd">
                <span className="term">el gap sin marco</span>
                <span className="ipa">/el ɡap sin ˈmaɾko/</span>
                <span className="pos">sust.</span>
                <span className="sev hi">CRÍTICO</span>
              </div>
              <p className="def">
                Cuentas los catorce meses en orden cronológico, como si hubieran pasado. No como
                una decisión que tomaste y de la que volviste con un criterio nuevo. El
                entrevistador no está juzgando el tiempo: está midiendo si tú lo juzgas.
              </p>
              <p className="ev">
                En tu sesión del 19 de julio empezaste esa respuesta con <em>“I know that's a bit of a gap”</em>. Esa frase le enseña al panel a verlo como un problema.
              </p>
            </div>

            <div className="entry">
              <div className="hd">
                <span className="term">adjetivo sin evidencia</span>
                <span className="ipa">/aðxeˈtiβo sin eβiˈðenθja/</span>
                <span className="pos">sust.</span>
                <span className="sev">ALTO</span>
              </div>
              <p className="def">
                Describes cómo eres en vez de mostrar qué produjiste. <em>Hard worker, detail-oriented, passionate</em>: son palabras que cualquiera puede decir de sí mismo, y por eso no pesan. La evidencia es lo único que no se puede copiar.
              </p>
              <p className="ev">4 de 6 respuestas de tu última sesión abrieron con un adjetivo antes de llegar a un número.</p>
            </div>

            <div className="entry">
              <div className="hd">
                <span className="term">resultado sin recencia</span>
                <span className="ipa">/resulˈtaðo sin reˈθensja/</span>
                <span className="pos">sust.</span>
                <span className="sev">MEDIO</span>
              </div>
              <p className="def">
                Tus mejores métricas son de hace dos años y las cuentas en pasado lejano, lo que refuerza la distancia. La misma métrica se lee distinta cuando la conectas con el problema que ellos tienen hoy.
              </p>
              <p className="ev">Tienes el número que necesitan oír. Está en tu historia #2 y no la estás usando en esta entrevista.</p>
            </div>
          </div>

          <div className="kicker-rule" />

          <div className="two">
            <div className="card">
              <div className="eyebrow">Tu set para esta entrevista — 11 preguntas</div>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 17, lineHeight: 1.55 }}>
                Tell me about yourself.
                <br />
                Walk me through the last two years.
                <br />
                You've been out for a while — how do you get up to speed?
                <br />
                Tell me about a time you moved a retention metric.
                <br />
                <span style={{ color: "var(--muted)" }}>+ 7 más, incluida la de salario</span>
              </p>
            </div>
            <div className="card flat" style={{ background: "var(--wash)" }}>
              <div className="eyebrow">Por qué estas y no otras</div>
              <p style={{ fontSize: 13.5, color: "#3d3d45" }}>
                Seis salen del job description. Tres salen de tu arquetipo. Dos salen de lo que el panel de Lumen preguntó a otros candidatos, según sus perfiles públicos. Ninguna es genérica.
              </p>
            </div>
          </div>

          <div className="row-actions">
            <button className="btn" onClick={() => go("s3")}>Entrar a la sala →</button>
            <button className="btn ghost" onClick={() => go("s1")}>Cambiar el rol</button>
          </div>
        </section>

        {/* ═══════════ 03 LA SALA ═══════════ */}
        <section className={`screen${view === "s3" ? " on" : ""}`} id="s3">
          <h1 className="display">
            Practica hoy la respuesta
            <br />
            que vas a dar <em>el jueves.</em>
          </h1>

          <div className="kicker-rule" />

          <div className="eyebrow">¿A quién enfrentas?</div>
          <div className="mode-row">
            {MODES.map((m) => (
              <button
                key={m}
                className="mode"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>

          <div className="q-block" style={{ marginTop: 20 }}>
            <div className="q-meta">
              <span>PREGUNTA 03 / 11 · CONDUCTUAL · PANEL DE 3</span>
              <span className="timer">{clock}</span>
            </div>
            <p className="q-text">“You've been out of the market for over a year. Walk me through that time.”</p>
            <p className="q-sub">Coaching en español · práctica en inglés. Escribes o hablas: la sala evalúa igual.</p>
          </div>

          <div className="two" style={{ marginTop: 20 }}>
            <div className="card stack">
              <div>
                <label className="fld" htmlFor="ans">Tu respuesta</label>
                <textarea
                  className="txt"
                  id="ans"
                  rows={8}
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button className="btn" onClick={() => go("s4")}>Enviar a evaluación →</button>
                <button className="btn ghost">Grabar en voz</button>
              </div>
            </div>

            <div className="card flat" style={{ background: "var(--wash)" }}>
              <div className="eyebrow">Tu estructura de 5 piezas</div>
              <p style={{ fontSize: 13.5, color: "#3d3d45", lineHeight: 1.75 }}>
                <b>1.</b> Dónde estás parada hoy
                <br />
                <b>2.</b> La evidencia que lo respalda
                <br />
                <b>3.</b> El giro — por qué te moviste
                <br />
                <b>4.</b> El problema de ellos
                <br />
                <b>5.</b> Por qué tú lo resuelves
              </p>
              <div className="note" style={{ marginTop: 18 }}>
                <span className="who">Nota de la clase · Bloque 1</span>
                La pieza 4 es la que casi nadie incluye, y es la única que responde la pregunta que el entrevistador sí tiene en la cabeza.
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ 04 EL EDIT ═══════════ */}
        <section className={`screen${view === "s4" ? " on" : ""}`} id="s4">
          <h1 className="display">
            Lo que dijiste,
            <br />
            <em>editado.</em>
          </h1>
          <p className="lede">Toca cualquier parte marcada en amarillo para ver por qué te está costando.</p>

          <div className="kicker-rule" />

          <div className="split">
            <div>
              <h4>Tu respuesta — 4 marcas</h4>
              <p className="answer">
                So, um, I took some time off after my daughter was born — about fourteen months — and{" "}
                <mark
                  className={`m${activeNote === "disculpa" ? " act" : ""}`}
                  onClick={() => setActiveNote("disculpa")}
                >
                  I know that's a bit of a gap
                </mark>
                . Before that I was at Meridian for four years, where{" "}
                <mark
                  className={`m${activeNote === "adjetivo" ? " act" : ""}`}
                  onClick={() => setActiveNote("adjetivo")}
                >
                  I was a hard worker
                </mark>{" "}
                and{" "}
                <mark
                  className={`m${activeNote === "verbo" ? " act" : ""}`}
                  onClick={() => setActiveNote("verbo")}
                >
                  I handled marketing for a few product lines
                </mark>
                . I'm really passionate about health tech and{" "}
                <mark
                  className={`m${activeNote === "hedge" ? " act" : ""}`}
                  onClick={() => setActiveNote("hedge")}
                >
                  I think I could bring a lot to this role
                </mark>
                .
              </p>
              <div className="note">
                <span className="who">
                  {activeNote ? `Criterio · ${NOTES[activeNote][0]}` : "Toca una marca amarilla"}
                </span>
                {activeNote
                  ? NOTES[activeNote][1]
                  : "Cada marca corresponde a un criterio de la clase. Aquí verás cuál, y qué hacer con él."}
              </div>
            </div>
            <div>
              <h4>La versión que resuelve su problema</h4>
              <p className="answer serif">
                I led marketing for three product lines at Meridian for four years. I took our
                flagship line from $4M to $11M in eighteen months by rebuilding the acquisition
                funnel. Then I took fourteen months to be with my daughter — and I came back on
                purpose, looking for a company where growth is an activation problem, not a traffic
                problem. That's what I read in your posting: you're not short on signups, you're
                short on 60-day activation. That's the exact work I did at Meridian, and it's the
                work I want to do next.
              </p>
              <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn ghost sm">Escuchar en voz alta</button>
                <button className="btn ghost sm">Ver otra versión</button>
              </div>
            </div>
          </div>

          <div className="kicker-rule" />

          <div className="eyebrow">Evaluación contra el criterio de Mariana &amp; Graciela</div>
          <div className="rub">
            <div className="rub-row master">
              <div className="cr">
                ¿Demostraste que eres la solución a su problema?
                <small>El criterio maestro. Todo lo demás se subordina a este.</small>
              </div>
              <div className="meter"><i style={{ width: "22%" }} /></div>
              <div className="scr">2/9</div>
            </div>
            <div className="rub-row">
              <div className="cr">
                Evidencia en vez de adjetivos
                <small>“Hard worker” no convence. Un número sí.</small>
              </div>
              <div className="meter"><i style={{ width: "33%" }} /></div>
              <div className="scr">3/9</div>
            </div>
            <div className="rub-row">
              <div className="cr">
                Resultado medible
                <small>Ningún número apareció en la respuesta.</small>
              </div>
              <div className="meter"><i style={{ width: "11%" }} /></div>
              <div className="scr">1/9</div>
            </div>
            <div className="rub-row">
              <div className="cr">
                Ownership, sin disculpa
                <small>El gap se presentó como algo que te pasó.</small>
              </div>
              <div className="meter"><i style={{ width: "33%" }} /></div>
              <div className="scr">3/9</div>
            </div>
            <div className="rub-row">
              <div className="cr">
                Estructura de 5 piezas
                <small>Piezas 1, 2 y 4 ausentes.</small>
              </div>
              <div className="meter"><i style={{ width: "44%" }} /></div>
              <div className="scr">4/9</div>
            </div>
          </div>

          <div className="two" style={{ marginTop: 22 }}>
            <div className="card">
              <div className="eyebrow">Tu progreso en esta pregunta</div>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, lineHeight: 1.4 }}>
                Intento 1: 13/45 · Intento 2: 21/45 · <b>hoy: 27/45</b>
              </p>
              <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 8 }}>
                Subiste ownership. Sigues perdiendo todo el peso en evidencia. La próxima repetición debe abrir con el número, no con el contexto.
              </p>
            </div>
            <div className="card dark">
              <div className="eyebrow" style={{ color: "#9c9ca8" }}>Lo que sigue</div>
              <p style={{ color: "#c9c9d2", fontSize: 14 }}>
                Repite esta respuesta abriendo con los $11M. Si te sale, la guardamos como tu apertura oficial para Lumen.
              </p>
              <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button className="btn onDark" onClick={() => go("s3")}>Repetir</button>
                <button className="btn onDark" onClick={() => go("s5")}>Guardar en Story Bank</button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════ 05 STORY BANK ═══════════ */}
        <section className={`screen${view === "s5" ? " on" : ""}`} id="s5">
          <h1 className="display">
            Tu material.
            <br />
            Se queda contigo
            <br />
            <em>aunque pauses.</em>
          </h1>
          <p className="lede">Lo que construiste en la clase, afilado en cada sesión. Exportable cuando quieras, en español y en inglés.</p>

          <div className="kicker-rule" />

          <div className="two">
            <div className="card">
              <div className="eyebrow">Los seis entregables de The Interview Edit™</div>
              <div style={{ marginTop: 6 }}>
                <div className="asset">
                  <span className="ix">01</span>
                  <div>
                    <div className="ttl">Tell me about yourself</div>
                    <div className="sub">Versión Lumen Health · 5 piezas completas · 38 segundos</div>
                  </div>
                  <span className="pill done">Listo</span>
                </div>
                <div className="asset">
                  <span className="ix">02</span>
                  <div>
                    <div className="ttl">Historias de bolsillo</div>
                    <div className="sub">4 escritas · 2 atadas a este job description</div>
                  </div>
                  <span className="pill wip">4 de 6</span>
                </div>
                <div className="asset">
                  <span className="ix">03</span>
                  <div>
                    <div className="ttl">La frase del salario</div>
                    <div className="sub">Rango anclado: $145K–$165K · practicada 1 vez</div>
                  </div>
                  <span className="pill wip">Ensayar</span>
                </div>
                <div className="asset">
                  <span className="ix">04</span>
                  <div>
                    <div className="ttl">El follow-up</div>
                    <div className="sub">Se genera después de la entrevista real</div>
                  </div>
                  <span className="pill todo">En espera</span>
                </div>
                <div className="asset">
                  <span className="ix">05</span>
                  <div>
                    <div className="ttl">Tus preguntas de cierre</div>
                    <div className="sub">5 preguntas de nivel senior para el panel de Lumen</div>
                  </div>
                  <span className="pill done">Listo</span>
                </div>
                <div className="asset">
                  <span className="ix">06</span>
                  <div>
                    <div className="ttl">Tu narrativa del gap</div>
                    <div className="sub">Reescrita hoy · aún sin número de apertura</div>
                  </div>
                  <span className="pill wip">Repetir</span>
                </div>
              </div>
            </div>

            <div className="stack">
              <div className="card dark">
                <div className="eyebrow" style={{ color: "#9c9ca8" }}>Kit para el jueves</div>
                <p style={{ color: "#c9c9d2", fontSize: 14 }}>
                  Una página. Tus respuestas, tu rango de salario y tus preguntas de cierre. Para leer en los diez minutos antes de entrar.
                </p>
                <div style={{ marginTop: 16 }}>
                  <button className="btn onDark">Exportar mi kit</button>
                </div>
              </div>
              <div className="card flat" style={{ background: "var(--wash)" }}>
                <div className="eyebrow">Tu acceso</div>
                <p style={{ fontSize: 13.5, color: "#3d3d45" }}>
                  Renueva el 14 de septiembre. Puedes pausar cuando consigas el puesto y reactivar cuando lo necesites. Tu Story Bank se queda guardado, completo, sin importar cuánto tiempo pase.
                </p>
                <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button className="btn ghost sm">Pausar acceso</button>
                  <button className="btn ghost sm">Descargar todo</button>
                </div>
              </div>
            </div>
          </div>

          <div className="kicker-rule" />

          <div className="eyebrow">Tus historias de bolsillo</div>
          <div className="three" style={{ marginTop: 10 }}>
            <div className="story">
              <span className="tag">Historia 01 · Resultado</span>
              <p className="st">De $4M a $11M en dieciocho meses</p>
              <p className="mt">Usada en <b>3</b> respuestas · fuerza <b>8/9</b></p>
            </div>
            <div className="story">
              <span className="tag">Historia 02 · Retención</span>
              <p className="st">Bajé el churn de 60 días en 22 puntos</p>
              <p className="mt">Usada en <b>0</b> respuestas · <span style={{ color: "#8a6d18" }}>la que Lumen necesita oír</span></p>
            </div>
            <div className="story">
              <span className="tag">Historia 03 · Conflicto</span>
              <p className="st">El lanzamiento que detuve a tres días</p>
              <p className="mt">Usada en <b>2</b> respuestas · fuerza <b>6/9</b></p>
            </div>
          </div>

          <div style={{ marginTop: 26 }}>
            <button className="btn" onClick={() => go("s3")}>Volver a la sala</button>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  );
}
