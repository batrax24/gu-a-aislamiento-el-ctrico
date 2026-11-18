import { useEffect, useMemo, useRef, useState } from 'react';
import { SOURCES } from '../content/bibliography';
import { stageForTopic, type Topic } from '../content/topics';
import type { Experiment, ParamDef } from '../experiments/types';
import type { Solved } from '../lib/storage';
import { Btn, Chip, Checks, Control, Equation, getSceneClock, Readouts, Stars } from './ui';

type Status = 'idle' | 'fail' | 'ok';

export function ExperimentView({
  exp,
  topic,
  solved,
  quizAnswer,
  prev,
  next,
  onVisit,
  onSolve,
  onQuiz,
  onHome,
  onCatalog,
  onBack,
  onPrev,
  onNext,
}: {
  exp: Experiment;
  topic: Topic;
  solved?: Solved;
  quizAnswer?: string;
  prev?: Experiment;
  next?: Experiment;
  onVisit: () => void;
  onSolve: (attempts: number, hint: boolean) => number;
  onQuiz: (optionId: string) => void;
  onHome: () => void;
  onCatalog: () => void;
  onBack: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const base = useMemo(() => Object.fromEntries(exp.params.map((x) => [x.id, x.def])), [exp]);
  const [p, setP] = useState(() => ({ ...base }));
  const [presetId, setPresetId] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [hint, setHint] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [stars, setStars] = useState(solved?.stars ?? 0);
  const [quizPick, setQuizPick] = useState<string | undefined>(quizAnswer);
  const [milestones, setMilestones] = useState<string[]>(() =>
    solved ? exp.goals.filter((g) => g.kind === 'exploracion').map((g) => g.id) : [],
  );

  const visitedRef = useRef('');
  useEffect(() => {
    if (visitedRef.current !== exp.id) {
      visitedRef.current = exp.id;
      onVisit();
    }
  }, [exp.id, onVisit]);

  /** Las escenas usan `t` en operaciones aritméticas: el objeto lee el reloj vivo en cada fotograma. */
  const liveT = useMemo(() => {
    const boxed = Object(0) as Number;
    Object.defineProperty(boxed, 'valueOf', { value: getSceneClock });
    return boxed as unknown as number;
  }, []);

  const Scene = exp.scene;
  const Chart = exp.plot;
  const stage = stageForTopic(exp.topicId);

  const d = useMemo(() => exp.compute(p), [exp, p]);
  const live = exp.liveStatus(p, d);
  const readings = exp.readings(d, p);
  const equations = exp.equations(p, d);
  const checks = exp.checks ? exp.checks(p, d) : [];
  const activePreset = exp.presets.find((x) => x.id === presetId);

  const groupedParams = useMemo(() => {
    const out: { name: string; items: ParamDef[] }[] = [];
    const byName = new Map<string, ParamDef[]>();
    for (const def of exp.params) {
      const name = def.group ?? 'Ajustes del banco';
      if (!byName.has(name)) {
        const items: ParamDef[] = [];
        byName.set(name, items);
        out.push({ name, items });
      }
      byName.get(name)!.push(def);
    }
    return out;
  }, [exp]);

  const goals = exp.goals.map((g) => ({
    ...g,
    pass: g.test(p, d),
    exploracion: g.kind === 'exploracion',
    visited: milestones.includes(g.id),
  }));
  const reqs = goals.filter((g) => !g.exploracion);
  const reqOk = reqs.every((g) => g.pass);
  const pending = goals.filter((g) => g.exploracion && !g.pass && !g.visited);
  const ready = reqOk && pending.length === 0;
  const quizOk = !exp.quiz || quizPick === exp.quiz.correct;
  const canValidate = ready && quizOk;

  useEffect(() => {
    const hit = goals.filter((g) => g.exploracion && g.pass && !g.visited).map((g) => g.id);
    if (hit.length > 0) {
      setMilestones((previous) => [...previous, ...hit.filter((id) => !previous.includes(id))]);
    }
  }, [goals, milestones]);

  const setParam = (id: string, v: number) => {
    setP((previous) => ({ ...previous, [id]: v }));
    setPresetId('');
    setStatus('idle');
  };

  const loadPreset = (id: string) => {
    const preset = exp.presets.find((x) => x.id === id);
    if (!preset) return;
    setP({ ...base, ...preset.values });
    setPresetId(id);
    setStatus('idle');
  };

  const resetLab = () => {
    setP({ ...base });
    setPresetId('');
    setStatus('idle');
    setAttempts(0);
    setHint(false);
    setMilestones([]);
  };

  const validate = () => {
    if (canValidate) {
      const s = onSolve(attempts, hint);
      setStars(s);
      setStatus('ok');
    } else {
      setAttempts((a) => a + 1);
      setStatus('fail');
    }
  };

  const unmet = goals.filter((g) => (g.exploracion ? !(g.pass || g.visited) : !g.pass));

  return (
    <div className="page exp-page">
      <nav className="breadcrumb" aria-label="Ruta de navegación">
        <button type="button" onClick={onHome}>
          Inicio
        </button>
        <span aria-hidden="true">/</span>
        <button type="button" onClick={onCatalog}>
          Catálogo
        </button>
        <span aria-hidden="true">/</span>
        <button type="button" onClick={onBack}>
          Tema {topic.id}
        </button>
        <span aria-hidden="true">/</span>
        <span aria-current="page" className="mono">
          {exp.id.toUpperCase()}
        </span>
      </nav>

      <header className={`exp-hero stage-${stage.color}`}>
        <div>
          <div className="exp-hero-meta">
            <Chip tone="accent">{exp.contextLabel}</Chip>
            <span>Etapa {stage.step} · {stage.title}</span>
            <span>Tema {topic.id}</span>
          </div>
          <h1>{exp.title}</h1>
          <p className="exp-tagline">{exp.tagline}</p>
          <p className="exp-why">
            <strong>Para qué sirve:</strong> {exp.why}
          </p>
        </div>
        <div className="exp-hero-badges">
          <span className="mono">{exp.id.toUpperCase()}</span>
          {solved ? <Stars n={solved.stars} size={18} /> : <Chip tone="neutral">Reto pendiente</Chip>}
          <span>{exp.goals.length} criterios</span>
        </div>
      </header>

      <div className={`live-banner tone-${live.tone}`} role="status">
        <strong>{live.badge}</strong>
        <span>{live.message}</span>
      </div>

      <div className="lab-grid">
        <div className="lab-main">
          <section className="lab-card">
            <div className="card-head">
              <div>
                <span className="eyebrow">Escena física animada</span>
                <h2>Qué está pasando en la instalación</h2>
              </div>
              <span className="muted small">Pausa o repite para observar con calma</span>
            </div>
            <Scene p={p} d={d} t={liveT} />
          </section>

          <section className="lab-card">
            <div className="card-head">
              <div>
                <span className="eyebrow">Gráfica del modelo</span>
                <h2>Comportamiento con tus valores</h2>
              </div>
              <span className="muted small">Pasa el cursor sobre la curva</span>
            </div>
            <Chart p={p} d={d} />
          </section>

          <section className="lab-card learn-card">
            <div className="card-head">
              <div>
                <span className="eyebrow">Guía para aprender</span>
                <h2>Antes de tocar los controles</h2>
              </div>
              <Chip tone="accent">{exp.id.toUpperCase()}</Chip>
            </div>

            <div className="learn-analogy">
              <span className="eyebrow">Analogía concreta</span>
              <p>{exp.learn.analogy}</p>
            </div>

            <div className="learn-grid">
              <article>
                <h3>El fenómeno</h3>
                <p>{exp.learn.phenomenon}</p>
              </article>
              <article>
                <h3>Qué podrás explicar</h3>
                <p>{exp.learn.objective}</p>
              </article>
            </div>

            <div className="learn-watch">
              <h3>Qué mirar para convencerte</h3>
              <ol>
                {exp.learn.watch.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ol>
            </div>

            <div className="learn-cautions">
              <article>
                <h3>Error clásico</h3>
                <p>{exp.learn.misconception}</p>
              </article>
              {exp.learn.model && (
                <article>
                  <h3>Límite del modelo</h3>
                  <p>{exp.learn.model}</p>
                </article>
              )}
            </div>

            {exp.notes && exp.notes.length > 0 && (
              <details className="notes-details">
                <summary>Notas de cálculo y convenciones ({exp.notes.length})</summary>
                <ul>
                  {exp.notes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
              </details>
            )}

            <div className="exp-sources">
              <span className="eyebrow">Fuentes de este banco</span>
              <div>
                {exp.sources.map((k) => (
                  <span className="source-pill" key={k} title={`${SOURCES[k].title} — ${SOURCES[k].role}`}>
                    <strong>{SOURCES[k].short}</strong>
                    <em>{SOURCES[k].pages}</em>
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>

        <aside className="lab-side">
          <section className="lab-card">
            <div className="card-head">
              <div>
                <span className="eyebrow">Banco de controles</span>
                <h2>Parámetros</h2>
              </div>
              <button type="button" className="text-link" onClick={resetLab}>
                Reiniciar
              </button>
            </div>

            {exp.presets.length > 0 && (
              <div className="preset-block">
                <span className="eyebrow">Casos preparados</span>
                <div className="preset-list" role="group" aria-label="Casos preparados">
                  {exp.presets.map((pr) => (
                    <button
                      key={pr.id}
                      type="button"
                      className={`preset-btn ${presetId === pr.id ? 'active' : ''}`}
                      onClick={() => loadPreset(pr.id)}
                      title={pr.note}
                    >
                      {pr.label}
                    </button>
                  ))}
                </div>
                {activePreset?.note && <p className="preset-note">{activePreset.note}</p>}
              </div>
            )}

            <div className="control-groups">
              {groupedParams.map((group) => (
                <fieldset className="control-group" key={group.name}>
                  <legend>{group.name}</legend>
                  {group.items.map((def) => (
                    <Control key={def.id} def={def} value={p[def.id]} onChange={(v) => setParam(def.id, v)} />
                  ))}
                </fieldset>
              ))}
            </div>
          </section>

          <section className="lab-card">
            <div className="card-head">
              <div>
                <span className="eyebrow">Instrumentos</span>
                <h2>Lecturas</h2>
              </div>
              <span className="muted small">con unidades reales</span>
            </div>
            <Readouts items={readings} />
          </section>

          <section className={`lab-card challenge-card status-${status}`}>
            <div className="card-head">
              <div>
                <span className="eyebrow">Reto de diseño</span>
                <h2>El reto</h2>
              </div>
              <Stars n={stars} size={16} />
            </div>

            <p className="challenge-summary">
              {ready
                ? quizOk
                  ? 'Todo en verde: valida para cerrar el reto.'
                  : 'Los cálculos están listos; falta responder la decisión.'
                : reqOk
                  ? `Faltan hitos por explorar: ${pending.map((g) => g.label).join(' · ')}.`
                  : 'Ajusta los parámetros hasta cumplir los requisitos marcados.'}
            </p>

            <ul className="goal-list">
              {goals.map((g) => {
                const done = g.exploracion ? g.pass || g.visited : g.pass;
                return (
                  <li key={g.id} className={done ? 'pass' : ''}>
                    <span className="goal-dot" aria-hidden="true">
                      {done ? '✓' : '○'}
                    </span>
                    <span>
                      <strong>
                        {g.label}
                        <span className={`goal-tag ${g.exploracion ? 'exploracion' : 'requisito'}`}>
                          {g.exploracion ? 'hito' : 'requisito'}
                        </span>
                      </strong>
                      <em>{g.detail(p, d)}</em>
                      {g.exploracion && g.visited && !g.pass && <em className="milestone-note">Alcanzado antes en esta sesión</em>}
                    </span>
                  </li>
                );
              })}
            </ul>

            {exp.quiz && (
              <div className="quiz-block">
                <h3>Decisión de ingeniería</h3>
                <p>{exp.quiz.question}</p>
                <div className="quiz-options">
                  {exp.quiz.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className={`quiz-opt ${quizPick === o.id ? 'picked' : ''} ${quizPick && o.id === exp.quiz!.correct ? 'right' : ''}`}
                      aria-pressed={quizPick === o.id}
                      onClick={() => {
                        setQuizPick(o.id);
                        onQuiz(o.id);
                        setStatus('idle');
                      }}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {quizPick && (
                  <p className={`quiz-feedback ${quizOk ? 'ok' : 'bad'}`}>
                    <strong>{quizOk ? 'Correcto. ' : 'Revisa. '}</strong>
                    {exp.quiz.explanation}
                  </p>
                )}
              </div>
            )}

            <div className="challenge-actions">
              <Btn tone="primary" onClick={validate}>
                Validar reto
              </Btn>
              <Btn tone="ghost" onClick={() => setHint((h) => !h)}>
                {hint ? 'Ocultar pista' : 'Pista'}
              </Btn>
            </div>

            {hint && (
              <div className="hint-box">
                <strong>Pista concreta</strong>
                <ul>
                  {unmet.slice(0, 3).map((g) => (
                    <li key={g.id}>
                      {g.label}: {g.tip ?? g.detail(p, d)}
                    </li>
                  ))}
                  {unmet.length === 0 && <li>Ya cumples los criterios; si hay decisión, elige la respuesta correcta y valida.</li>}
                </ul>
              </div>
            )}

            {status === 'fail' && (
              <p className="feedback-line bad">
                Todavía no: {unmet.map((g) => g.label).join(', ') || 'falta responder la decisión'}.
              </p>
            )}
            {status === 'ok' && (
              <p className="feedback-line ok">
                Reto cerrado con {stars} {stars === 1 ? 'estrella' : 'estrellas'}.{' '}
                {attempts === 0 ? 'Sin intentos fallidos.' : `Intentos fallidos: ${attempts}.`}
              </p>
            )}
            {attempts > 0 && status !== 'ok' && <p className="muted small">Intentos fallidos: {attempts}.</p>}
          </section>

          {checks.length > 0 && (
            <section className="lab-card">
              <div className="card-head">
                <div>
                  <span className="eyebrow">Semáforos</span>
                  <h2>Verificaciones</h2>
                </div>
              </div>
              <Checks items={checks} />
            </section>
          )}

          <section className="lab-card">
            <Equation lines={equations} />
          </section>

          <nav className="exp-nav" aria-label="Navegación secuencial de simuladores">
            <Btn tone="ghost" onClick={onPrev} disabled={!prev}>
              ← {prev ? `${prev.id.toUpperCase()} · ${prev.contextLabel}` : 'Inicio'}
            </Btn>
            <Btn tone="primary" onClick={onNext}>
              {next ? `${next.id.toUpperCase()} · ${next.contextLabel}` : 'Cerrar recorrido · Simulacro'} →
            </Btn>
          </nav>
        </aside>
      </div>
    </div>
  );
}
