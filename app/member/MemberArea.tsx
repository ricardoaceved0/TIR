"use client";

import { useEffect, useRef, useState } from "react";
import "./member.css";

type ScreenId = "s1" | "s2" | "s3" | "s4" | "s5";

const STEPS: { id: ScreenId; num: string; lbl: string }[] = [
  { id: "s1", num: "01", lbl: "Entrada" },
  { id: "s2", num: "02", lbl: "Diagnóstico" },
  { id: "s3", num: "03", lbl: "La sala" },
  { id: "s4", num: "04", lbl: "El edit" },
  { id: "s5", num: "05", lbl: "Story Bank" },
];

const ARCHETYPES = [
  { no: "01", nm: "The Re-Entry", ds: "Vuelves después de un layoff, una pausa o una licencia de maternidad." },
  { no: "02", nm: "The Rebuilder", ds: "Reconstruiste tu carrera después de migrar y ahora vas por lo que vales." },
  { no: "03", nm: "The Pivot", ds: "Cambias de industria y necesitas traducir tu experiencia anterior." },
  { no: "04", nm: "The Experienced", ds: "Una década de experiencia en otro mercado y en otro idioma." },
  { no: "05", nm: "The Rusty One", ds: "Tu última entrevista fue hace diez años. El formato cambió." },
  { no: "06", nm: "The Invisible One", ds: "Dijiste todo, pero no te vieron. Nombrar no es narrar." },
];

const MODES = ["Conductual", "Técnica", "Panel", "Promoción interna", "Hostil"];

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

function GearIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function Seal() {
  return (
    <svg className="seal" width="52" height="52" viewBox="0 0 100 100" aria-hidden="true">
      <defs>
        <path id="tir-ring" d="M50,50 m-36,0 a36,36 0 1,1 72,0 a36,36 0 1,1 -72,0" />
      </defs>
      <circle cx="50" cy="50" r="45" fill="none" stroke="#fff" strokeWidth="1" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="#fff" strokeWidth=".5" />
      <text fill="#fff" fontFamily="Poppins,sans-serif" fontSize="8.2" letterSpacing="1.5">
        <textPath href="#tir-ring" startOffset="4%">
          THE INTERVIEW ROOM • THE INTERVIEW ROOM •
        </textPath>
      </text>
      <text x="50" y="60" textAnchor="middle" fill="#fff" fontFamily="Playfair Display,serif" fontSize="30" letterSpacing="-1">
        IR
      </text>
    </svg>
  );
}

export default function MemberArea() {
  const [view, setView] = useState<ScreenId>("s1");
  const [arch, setArch] = useState("01");
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

  const go = (id: ScreenId) => {
    setView(id);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

      <header className="bar">
        <div className="bar-in">
          <button className="brand" onClick={() => go("s1")} aria-label="Ir al inicio">
            <Seal />
            <div>
              <div className="wordmark">
                The Interview <em>Room</em>
                <sup>™</sup>
              </div>
              <div className="byline">con Mariana &amp; Graciela Atencio</div>
            </div>
          </button>

          <div className="hdr-actions">
            <button className="hdr-btn" aria-label="Ajustes" title="Ajustes">
              <GearIcon />
            </button>
            <button className="hdr-btn bell" aria-label="Notificaciones" title="Notificaciones">
              <BellIcon />
              <span className="bell-dot" aria-hidden="true" />
            </button>
            <button className="hdr-btn avatar" aria-label="Tu perfil" title="Tu perfil">
              VR
            </button>
          </div>
        </div>
      </header>

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

      <div className="ribbon">
        <div className="ribbon-in">
          <span>
            <span className="dot" />
            VALENTINA R. · THE RE-ENTRY
          </span>
          <span>
            <span className="k">memoria:</span> 4 historias guardadas · 6 sesiones
          </span>
          <span>
            <span className="k">rol activo:</span> Sr. Marketing Manager — Lumen Health
          </span>
          <span>
            <span className="k">última sesión:</span> hace 2 días
          </span>
        </div>
      </div>

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

            <div className="card dark stack">
              <h2 className="sect" style={{ color: "#fff" }}>Lo que la sala ya sabe de ti</h2>
              <p className="lede">De tu clase, tu workbook y tus sesiones anteriores. No empiezas de cero cada vez.</p>
              <div className="agentline">
                <span className="blink" />
                <span>
                  <b>Workbook de The Interview Edit™</b>
                  <br />
                  importado — tu estructura de 5 piezas está guardada
                </span>
              </div>
              <div className="agentline">
                <span className="blink" />
                <span>
                  <b>4 historias de bolsillo</b>
                  <br />
                  escritas en las sesiones del 12 y 19 de julio
                </span>
              </div>
              <div className="agentline">
                <span className="blink" />
                <span>
                  <b>Tu patrón recurrente</b>
                  <br />
                  bajas el volumen cuando hablas de resultados propios
                </span>
              </div>
            </div>
          </div>

          <div className="kicker-rule" />

          <div className="card entrada-form">
            <div className="entrada-form-row">
              <div>
                <label className="fld" htmlFor="rol">Rol y empresa</label>
                <input className="txt" id="rol" defaultValue="Sr. Marketing Manager — Lumen Health" readOnly />
              </div>
              <div>
                <label className="fld" htmlFor="fecha">Fecha de la entrevista</label>
                <input className="txt" id="fecha" defaultValue="Jueves 6 de agosto · 10:00 AM ET · Zoom · panel de 3" readOnly />
              </div>
            </div>
            <div style={{ marginTop: 16 }}>
              <label className="fld" htmlFor="jd">Job description</label>
              <textarea className="txt" id="jd" rows={10} readOnly defaultValue={
                "We're looking for a Senior Marketing Manager to own lifecycle and activation. Our signup volume has grown 3x YoY, but 60-day activation has stayed flat. You'll rebuild onboarding comms end to end, partner with Product on in-app education, and own the activation number..."
              } />
            </div>
          </div>

          <div className="kicker-rule" />

          <div className="eyebrow">Tu momento — puedes cambiarlo cuando cambie tu situación</div>
          <div className="arch-grid">
            {ARCHETYPES.map((a) => (
              <button
                key={a.no}
                className="arch"
                aria-pressed={arch === a.no}
                onClick={() => setArch(a.no)}
              >
                <span className="no">{a.no}</span>
                <span className="nm">{a.nm}</span>
                <span className="ds">{a.ds}</span>
              </button>
            ))}
          </div>

          <div className="row-actions">
            <button className="btn" onClick={() => go("s2")}>Leer el job description →</button>
            <button className="btn ghost" onClick={() => go("s3")}>Ir directo a practicar</button>
          </div>
        </section>

        {/* ═══════════ 02 DIAGNÓSTICO ═══════════ */}
        <section className={`screen${view === "s2" ? " on" : ""}`} id="s2">
          <div className="eyebrow">02 — Diagnóstico</div>
          <h1 className="display">
            No están buscando
            <br />
            un currículum. Están
            <br />
            buscando <em>una solución.</em>
          </h1>

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
          <div className="eyebrow">03 — La sala</div>
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
          <div className="eyebrow">04 — El edit</div>
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
          <div className="eyebrow">05 — Story Bank</div>
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

        <footer className="foot">
          The Interview Room™ — spinoff de The Interview Edit™ con Mariana &amp; Graciela Atencio
        </footer>
      </div>
    </div>
  );
}
