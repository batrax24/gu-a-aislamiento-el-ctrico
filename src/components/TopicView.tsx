import { useState } from 'react';
import { STAGES, TOPICS, stageForTopic } from '../content/topics';
import { experimentsForTopic } from '../experiments';
import type { ParamDef, Params } from '../experiments/types';
import { fmt } from '../lib/num';
import type { Progress } from '../lib/storage';
import { TopicGlyph } from './Icons';
import { BarComparisonPlot, Btn, Chip, Control, Stars } from './ui';

/* ------------------ Mini-simulador introductorio del Tema 1 ------------------ */

const MINI_PARAMS: ParamDef[] = [
  {
    id: 'effort',
    label: 'Pico de voltaje que llega (esfuerzo)',
    unit: 'kV',
    min: 400,
    max: 1600,
    step: 10,
    def: 900,
    help: 'El «camión más pesado» que puede aparecer: rayo o maniobra.',
  },
  {
    id: 'support',
    label: 'Lo que aguanta el aislamiento (soporte / BIL)',
    unit: 'kV',
    min: 500,
    max: 1800,
    step: 10,
    def: 1050,
    help: 'La resistencia de las «vigas»: cadena, aire y equipo.',
  },
  {
    id: 'arrester',
    label: 'Techo que impone el pararrayos (U_equipo)',
    unit: 'kV',
    min: 300,
    max: 1200,
    step: 10,
    def: 660,
    help: 'El «control de peso» a la entrada: recorta el pico antes de que llegue.',
  },
];

function BalanceMiniSim() {
  const [values, setValues] = useState<Params>({ effort: 900, support: 1050, arrester: 660 });
  const effective = Math.min(values.effort, values.arrester);
  const without = values.support >= values.effort;
  const withArrester = values.support >= effective;
  const margin = (values.support / Math.max(1, effective) - 1) * 100;

  return (
    <div className="mini-sim">
      <div className="mini-sim-head">
        <div>
          <span className="eyebrow">Simulador de entrada · Tema 1</span>
          <h3>Balanza: esfuerzo vs. soporte vs. pararrayos</h3>
          <p>
            Mueve los tres controles. El objetivo no es «poner el número más grande», sino dejar el pico que llega por
            debajo de lo que el equipo aguanta, con un pararrayos que recorte el exceso.
          </p>
        </div>
        <Chip tone={withArrester ? 'ok' : 'bad'}>{withArrester ? 'Diseño coordinado' : 'Riesgo de falla'}</Chip>
      </div>

      <div className="mini-sim-grid">
        <div className="mini-sim-visual">
          <svg viewBox="0 0 600 190" role="img" aria-label="Puente con un camión, una viga de soporte y una barrera de control de peso">
            <rect x="0" y="0" width="600" height="190" rx="12" fill="#F8FAFC" />
            {/* Puente */}
            <path d="M40 128 H560" stroke="#4E6378" strokeWidth="10" strokeLinecap="round" />
            <path d="M40 128 Q300 178 560 128" fill="none" stroke="#9FB4C7" strokeWidth="4" />
            <path d="M40 128 V160 M560 128 V160 M40 160 H560" stroke="#8A5A32" strokeWidth="5" />
            {/* Camión de voltaje */}
            <g transform={`translate(${Math.max(70, Math.min(350, 70 + (values.effort - 400) * 0.2))} 84)`}>
              <rect x="0" y="0" width="86" height="34" rx="5" fill="#E05249" stroke="#B42318" strokeWidth="2" />
              <rect x="88" y="12" width="34" height="22" rx="4" fill="#D6362C" stroke="#B42318" strokeWidth="2" />
              <circle cx="20" cy="38" r="9" fill="#102033" />
              <circle cx="104" cy="38" r="9" fill="#102033" />
              <text x="43" y="22" textAnchor="middle" fontSize="12" fontWeight="800" fill="#FFFFFF">
                {fmt(values.effort, 0)} kV
              </text>
            </g>
            {/* Barrera de control de peso = pararrayos */}
            <g transform="translate(430 62)">
              <rect x="0" y="0" width="8" height="66" fill="#6D5A7C" />
              <path d="M8 12 H86" stroke="#C97A08" strokeWidth="6" />
              <text x="47" y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#33475B">
                PARARRAYOS ≤ {fmt(values.arrester, 0)} kV
              </text>
            </g>
            <text x="300" y="22" textAnchor="middle" fontSize="12" fontWeight="700" fill="#0D8A59">
              VIGAS / BIL = {fmt(values.support, 0)} kV
            </text>
          </svg>
          <div className={`mini-sim-status ${withArrester ? 'ok' : 'bad'}`}>
            <strong>{withArrester ? '✓ Coordinado' : '✕ Falla el aislamiento'}</strong>
            <span>
              Sin pararrayos: {without ? 'soportaba' : 'NO soportaba'} {fmt(values.effort, 0)} kV. Con el pararrayos el equipo ve {fmt(effective, 0)} kV y queda un margen de {fmt(margin, 1)} % frente al BIL.
            </span>
          </div>
        </div>

        <div className="mini-sim-controls">
          {MINI_PARAMS.map((def) => (
            <Control
              key={def.id}
              def={def}
              value={values[def.id]}
              onChange={(v) => setValues((prev) => ({ ...prev, [def.id]: v }))}
            />
          ))}
          <div className="mini-sim-bars">
            <BarComparisonPlot
              groups={[
                { label: 'Sin protección', stress: values.effort, withstand: values.support },
                { label: 'Con pararrayos', stress: effective, withstand: values.support },
              ]}
              caption="Rojo = pico exigido; verde = capacidad del aislamiento. El pararrayos reduce el esfuerzo que efectivamente llega al equipo."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ Vista de tema ------------------------------ */

export function TopicView({
  topicId,
  progress,
  onNavigateHome,
  onOpenTopic,
  onOpenExperiment,
  onNavigateCatalog,
}: {
  topicId: number;
  progress: Progress;
  onNavigateHome: () => void;
  onOpenTopic: (id: number) => void;
  onOpenExperiment: (id: string) => void;
  onNavigateCatalog: () => void;
}) {
  const topic = TOPICS.find((t) => t.id === topicId) ?? TOPICS[0];
  const stage = stageForTopic(topic.id);
  const exps = experimentsForTopic(topic.id);
  const prev = TOPICS.find((t) => t.id === topic.id - 1);
  const next = TOPICS.find((t) => t.id === topic.id + 1);

  return (
    <div className="page topic-page">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <button type="button" onClick={onNavigateHome}>
          Inicio
        </button>
        <span aria-hidden="true">/</span>
        <button type="button" onClick={() => onOpenTopic(stage.topicIds[0])}>
          {stage.title}
        </button>
        <span aria-hidden="true">/</span>
        <span aria-current="page">Tema {topic.id}</span>
      </nav>

      <header className={`topic-hero stage-${stage.color}`}>
        <div className="topic-hero-icon" aria-hidden="true">
          <TopicGlyph icon={topic.icon} size={34} />
        </div>
        <div className="topic-hero-copy">
          <div className="topic-hero-meta">
            <Chip tone="accent">Etapa {stage.step} · {stage.title}</Chip>
            <span>{topic.minutes}</span>
            <span>Diapositivas {topic.slides}</span>
          </div>
          <h1>
            Tema {topic.id}: {topic.title}
          </h1>
          <p className="topic-question">{topic.question}</p>
          <p className="topic-idea">{topic.idea}</p>
          <div className="topic-where">
            <strong>Dónde ocurre en la línea:</strong> {topic.whereOnLine}
          </div>
        </div>
      </header>

      <section className="topic-section">
        <div className="topic-two-col">
          <article className="concrete-card">
            <span className="eyebrow">Ejemplo concreto</span>
            <h2>En la vida real se parece a esto</h2>
            <p>{topic.realWorld}</p>
          </article>
          <article className="concrete-card keys-card">
            <span className="eyebrow">Lo que no puedes confundir</span>
            <h2>Puntos clave</h2>
            <ul>
              {topic.keys.map((k) => (
                <li key={k}>{k}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      {topic.id === 1 && (
        <section className="topic-section">
          <BalanceMiniSim />
        </section>
      )}

      <section className="topic-section">
        <div className="section-head">
          <div>
            <span className="eyebrow">Laboratorio de este tema</span>
            <h2>{exps.length > 0 ? `${exps.length} simulador(es) para tocar el fenómeno` : 'Sigue con el recorrido'}</h2>
            <p>{exps.length > 0 ? 'Cada tarjeta abre una bancada con controles, escena física, lecturas y reto.' : 'Este tema introduce el marco general; los simuladores comienzan en el Tema 2.'}</p>
          </div>
          <Btn tone="soft" onClick={onNavigateCatalog}>
            Ver catálogo completo
          </Btn>
        </div>

        {exps.length > 0 ? (
          <div className="topic-exp-grid">
            {exps.map((e) => {
              const solved = progress.solved[e.id];
              return (
                <article className="topic-exp-card" key={e.id}>
                  <div className="topic-exp-top">
                    <span className="exp-seq">{e.id.toUpperCase()}</span>
                    {solved ? <Stars n={solved.stars} /> : <Chip tone="neutral">Pendiente</Chip>}
                  </div>
                  <span className="exp-context">{e.contextLabel}</span>
                  <h3>{e.title}</h3>
                  <p>{e.tagline}</p>
                  <Btn tone="primary" onClick={() => onOpenExperiment(e.id)}>
                    Abrir simulador
                  </Btn>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <h3>Empieza por el mapa físico</h3>
            <p>El Tema 1 plantea la pregunta general; en el Tema 2 ya puedes mover ondas reales.</p>
            <Btn tone="primary" onClick={() => onOpenTopic(2)}>
              Ir al Tema 2
            </Btn>
          </div>
        )}
      </section>

      <section className="topic-section stage-rail">
        <h2>Ruta de las 4 etapas físicas</h2>
        <div className="stage-rail-grid">
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`stage-rail-item stage-${s.color} ${s.id === stage.id ? 'active' : ''}`}
              onClick={() => onOpenTopic(s.topicIds[0])}
            >
              <span>{s.step}</span>
              <strong>{s.title}</strong>
              <small>{s.subtitle}</small>
            </button>
          ))}
        </div>
      </section>

      <footer className="topic-nav">
        {prev ? (
          <Btn tone="ghost" onClick={() => onOpenTopic(prev.id)}>
            ← Tema {prev.id}: {prev.title}
          </Btn>
        ) : (
          <Btn tone="ghost" onClick={onNavigateHome}>
            ← Volver al inicio
          </Btn>
        )}
        {next ? (
          <Btn tone="primary" onClick={() => onOpenTopic(next.id)}>
            Siguiente tema → Tema {next.id}
          </Btn>
        ) : (
          <Btn tone="primary" onClick={() => onOpenExperiment('e18')}>
            Ir a la misión final →
          </Btn>
        )}
      </footer>
    </div>
  );
}
