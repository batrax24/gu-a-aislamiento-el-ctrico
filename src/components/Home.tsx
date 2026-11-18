import { useRef, useState } from 'react';
import { DIAGNOSTICS, buildNumericBank } from '../content/practica';
import { STAGES, TOPICS, stageForTopic } from '../content/topics';
import { EXPERIMENTS, experimentsForTopic } from '../experiments';
import { rankFor, type Progress } from '../lib/storage';
import { BrandEmblem, TopicGlyph } from './Icons';
import { LineMap } from './LineMap';
import { Btn, Chip, Stars } from './ui';

const BANK_SIZE = buildNumericBank().length;

export function Home({
  progress,
  onTopic,
  onExp,
  onPractice,
  onSources,
  onCatalog,
  onGlossary,
  onExport,
  onImport,
  onReset,
}: {
  progress: Progress;
  onTopic: (id: number) => void;
  onExp: (id: string) => void;
  onPractice: () => void;
  onSources: () => void;
  onCatalog: () => void;
  onGlossary: () => void;
  onExport: () => void;
  onImport: (text: string) => void;
  onReset: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const rank = rankFor(progress.xp);
  const solved = Object.keys(progress.solved).length;
  const solvedStars = Object.values(progress.solved).reduce((acc, s) => acc + (s.stars || 0), 0);

  return (
    <div className="page home-page">
      <section className="hero">
        <div className="hero-copy">
          <div className="hero-kicker">
            <BrandEmblem size={30} />
            <span className="eyebrow">AislaLab · edición exposición v4</span>
          </div>
          <h1>
            Coordinación de aislamiento
            <br />
            <em>sobre una línea real.</em>
          </h1>
          <p className="lead">
            No empieces con una fórmula suelta: empieza por la nube de tormenta, el cable de guarda, los discos de
            porcelana, la varilla enterrada y el transformador. Toca cada parte, mueve sus variables y mira qué falla.
          </p>
          <div className="hero-actions">
            <Btn tone="primary" onClick={() => onTopic(1)}>
              Empezar por el Tema 1
            </Btn>
            <Btn tone="soft" onClick={onCatalog}>
              Explorar los 18 simuladores
            </Btn>
            <Btn tone="ghost" onClick={onPractice}>
              Ir al simulacro
            </Btn>
          </div>
          <div className="hero-stats" aria-label="Contenido de AislaLab">
            <div>
              <b>{EXPERIMENTS.length}</b>
              <span>simuladores</span>
            </div>
            <div>
              <b>{TOPICS.length}</b>
              <span>temas · exposición</span>
            </div>
            <div>
              <b>{DIAGNOSTICS.length}</b>
              <span>diagnósticos</span>
            </div>
            <div>
              <b>{BANK_SIZE}</b>
              <span>cálculos del banco</span>
            </div>
          </div>
        </div>

        <aside className="hero-blueprint" aria-label="Ficha técnica del caso de estudio">
          <div className="blueprint-head">
            <span className="eyebrow">Caso de estudio</span>
            <Chip tone="accent">Línea 245 kV · Bogotá</Chip>
          </div>
          <svg viewBox="0 0 420 260" role="img" aria-label="Esquema de una torre, cable de guarda, cadena de aisladores y onda viajera">
            <rect x="0" y="0" width="420" height="260" rx="12" fill="#F8FAFC" />
            <g stroke="#CBD5E1" strokeWidth="1">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                <line key={`v${i}`} x1={i * 60} y1="0" x2={i * 60} y2="260" />
              ))}
              {[0, 1, 2, 3, 4].map((i) => (
                <line key={`h${i}`} x1="0" y1={i * 65} x2="420" y2={i * 65} />
              ))}
            </g>
            <path d="M0 218 Q100 190 210 218 T420 206" fill="none" stroke="#6DA35F" strokeWidth="3" />
            <g stroke="#4E6378" strokeWidth="3" fill="none">
              <path d="M178 218 L198 84 L210 58 L222 84 L242 218 Z" />
              <path d="M178 218 H242 M186 174 H234 M192 130 H228" strokeWidth="1.5" />
              <line x1="158" y1="112" x2="262" y2="112" strokeWidth="4" />
              <line x1="170" y1="156" x2="250" y2="156" strokeWidth="2.5" />
            </g>
            <path d="M0 84 Q105 73 210 84 T420 96" fill="none" stroke="#C97A08" strokeWidth="2.5" />
            <path d="M0 156 Q105 143 210 156 T420 168" fill="none" stroke="#0B63CE" strokeWidth="2.8" />
            <g>
              {[0, 1, 2, 3, 4].map((i) => (
                <ellipse key={i} cx="210" cy={117 + i * 8} rx="11" ry="3" fill="#58D5C3" stroke="#0F8578" />
              ))}
            </g>
            <path d="M300 66 L282 96 L300 92 L286 122 L326 82 L306 86 L320 66" fill="#B694FF" stroke="#6D3CE8" strokeWidth="1.5" />
            <rect x="24" y="18" width="140" height="42" rx="7" fill="#FFFFFF" stroke="#CBD5E1" />
            <text x="34" y="36" fontSize="10" fontWeight="700" fill="#33475B">
              2.640 m · 14 °C
            </text>
            <text x="34" y="51" fontSize="10" fill="#60758B" fontFamily="ui-monospace, monospace">
              p = 73,38 kPa · δ = 0,739
            </text>
            <rect x="270" y="178" width="128" height="42" rx="7" fill="#FFFFFF" stroke="#CBD5E1" />
            <text x="280" y="196" fontSize="10" fontWeight="700" fill="#33475B">
              21 discos · 3,066 m
            </text>
            <text x="280" y="211" fontSize="10" fill="#60758B" fontFamily="ui-monospace, monospace">
              U₅₀ = 700 δ⁰·⁷⁵ ≈ 558 kV
            </text>
          </svg>
          <div className="blueprint-values">
            <span>1,2/50 µs</span>
            <span>31 kA</span>
            <span>21 discos</span>
            <span>15 Ω</span>
            <span>Γ = −0,60</span>
            <span>BIL 1050 kV</span>
          </div>
          <p className="blueprint-note">
            Un solo hilo conductor: la misma línea de 245 kV atraviesa los 11 temas de la exposición y los 18 bancos de prueba.
          </p>
        </aside>
      </section>

      <section className="principles" aria-label="Cómo se aprende en AislaLab">
        <article className="principle">
          <span className="pnum">1</span>
          <h3>Nombra el objeto</h3>
          <p>Antes de calcular, ubica dónde está el fenómeno: una cadena, un vano con viento, una varilla en el suelo o los niveles IEC junto al transformador.</p>
        </article>
        <article className="principle">
          <span className="pnum">2</span>
          <h3>Mueve y observa</h3>
          <p>Cada control cambia una escena física, lecturas con unidades reales y una gráfica. La fórmula aparece con tus números, no con letras abstractas.</p>
        </article>
        <article className="principle">
          <span className="pnum">3</span>
          <h3>Verifica el conjunto</h3>
          <p>Un reto se aprueba solo si se cumplen todos los requisitos. La misión final exige las 6 verificaciones en verde al mismo tiempo.</p>
        </article>
      </section>

      <LineMap onOpenTopic={onTopic} onOpenExperiment={onExp} />

      <section className="progress-card">
        <div className="progress-summary">
          <span className="eyebrow">Tu bitácora de campo</span>
          <h2>{rank.name}</h2>
          <p>
            {progress.xp} XP · {solved} de {EXPERIMENTS.length} retos cerrados · {solvedStars} estrellas ·{' '}
            {Object.keys(progress.quiz).length} decisiones registradas
          </p>
          <div className="progress-line" aria-label={`Progreso hacia ${rank.nextName ?? 'rango máximo'}`}>
            <span style={{ width: `${rank.pct}%` }} />
          </div>
          {rank.next && (
            <p className="muted small">
              Faltan {rank.next - progress.xp} XP para «{rank.nextName}». Visitar un simulador nuevo suma 5 XP; cerrarlo, 20 XP.
            </p>
          )}
        </div>
        <div className="progress-actions">
          <Btn tone="ghost" onClick={onExport}>
            Descargar avance
          </Btn>
          <Btn tone="ghost" onClick={() => fileRef.current?.click()}>
            Cargar avance
          </Btn>
          {!confirmReset ? (
            <Btn tone="warn" onClick={() => setConfirmReset(true)}>
              Reiniciar
            </Btn>
          ) : (
            <div className="confirm-row">
              <span>¿Borrar todo el avance?</span>
              <Btn
                tone="warn"
                onClick={() => {
                  onReset();
                  setConfirmReset(false);
                }}
              >
                Sí, borrar
              </Btn>
              <Btn tone="ghost" onClick={() => setConfirmReset(false)}>
                Cancelar
              </Btn>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            aria-label="Archivo de progreso"
            onChange={(ev) => {
              const file = ev.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = () => onImport(String(reader.result ?? ''));
              reader.readAsText(file);
              ev.target.value = '';
            }}
          />
        </div>
      </section>

      <section className="curriculum">
        <div className="section-head">
          <div>
            <span className="eyebrow">Ruta de aprendizaje · 4 etapas físicas</span>
            <h2>De la tormenta al transformador</h2>
            <p>El recorrido sigue la exposición: 7 temas de coordinación (Expo 77) más los fundamentos de sobretensiones (39 diapositivas), ordenados por dónde ocurre cada fenómeno.</p>
          </div>
          <Btn tone="soft" onClick={onGlossary}>
            Abrir diccionario visual
          </Btn>
        </div>
        <div className="stage-rail-grid">
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`stage-rail-item stage-${s.color}`}
              onClick={() => onTopic(s.topicIds[0])}
            >
              <span className="stage-rail-num">{s.step}</span>
              <strong>{s.title}</strong>
              <small>{s.subtitle}</small>
              <em>Temas {s.topicIds[0]}–{s.topicIds[s.topicIds.length - 1]}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="curriculum">
        <div className="section-head">
          <div>
            <span className="eyebrow">Los 11 temas de la exposición</span>
            <h2>Cada tema, con su parte de la instalación</h2>
            <p>Abre el tema para ver el ejemplo concreto, la analogía y sus bancos de prueba; o entra directo al simulador.</p>
          </div>
          <Btn tone="soft" onClick={onCatalog}>
            Ver catálogo visual
          </Btn>
        </div>
        <div className="topic-grid">
          {TOPICS.map((t) => {
            const exps = experimentsForTopic(t.id);
            const st = stageForTopic(t.id);
            return (
              <article className={`topic-card stage-${st.color}`} key={t.id}>
                <header>
                  <span className="topic-card-glyph" aria-hidden="true">
                    <TopicGlyph icon={t.icon} size={22} />
                  </span>
                  <span className="topic-num mono">{String(t.id).padStart(2, '0')}</span>
                  <div>
                    <h3>{t.title}</h3>
                    <span className="topic-card-meta mono">
                      {t.minutes} · diap. {t.slides}
                    </span>
                  </div>
                </header>
                <p className="topic-card-question">{t.question}</p>
                <p className="topic-card-where">
                  <strong>Dónde:</strong> {t.whereOnLine}
                </p>
                <div className="topic-exp-chips">
                  {exps.length === 0 && <Chip tone="neutral">Marco general · mini-simulador</Chip>}
                  {exps.map((e) => (
                    <button key={e.id} type="button" className="exp-chip" onClick={() => onExp(e.id)}>
                      <span className="mono">{e.id.toUpperCase()}</span>
                      <span>{e.contextLabel}</span>
                      {progress.solved[e.id] ? <Stars n={progress.solved[e.id].stars} size={10} /> : <span className="pending-dot" />}
                    </button>
                  ))}
                </div>
                <footer>
                  <button type="button" className="text-link" onClick={() => onTopic(t.id)}>
                    Abrir tema {t.id} →
                  </button>
                  <span className="stage-tag">{st.title}</span>
                </footer>
              </article>
            );
          })}
        </div>
      </section>

      <section className="closing-card">
        <div>
          <span className="eyebrow">Antes de sustentar</span>
          <h2>Cierra el ciclo con el simulacro</h2>
          <p>
            Ocho preguntas por ronda: cinco cálculos generados desde los mismos presets del laboratorio (tolerancia
            2 %) y tres diagnósticos de casos reales. Cada respuesta te devuelve al simulador que la explica.
          </p>
        </div>
        <div className="closing-actions">
          <Btn tone="primary" onClick={onPractice}>
            Abrir simulacro
          </Btn>
          <Btn tone="ghost" onClick={onSources}>
            Ver fuentes y correcciones
          </Btn>
        </div>
      </section>
    </div>
  );
}
