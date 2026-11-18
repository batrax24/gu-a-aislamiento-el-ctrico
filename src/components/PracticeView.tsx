import { useMemo, useState } from 'react';
import { DIAGNOSTICS, buildNumericBank, fmtAnswer, type Diagnostic, type NumericQuestion } from '../content/practica';
import { EXPERIMENT_BY_ID } from '../experiments';
import { mulberry32 } from '../lib/num';
import type { Progress } from '../lib/storage';
import { Btn, Chip } from './ui';

type Item = { kind: 'num'; q: NumericQuestion } | { kind: 'diag'; q: Diagnostic };

function parseInput(text: string): number | null {
  const t = text.trim().replace(/\s|kV|MΩ|Ω|m|%|mm|kW\/km|µs|pF|Hz/gi, '').replace('−', '-');
  if (!t) return null;
  let norm = t;
  if (t.includes(',') && t.includes('.')) norm = t.replace(/\./g, '').replace(',', '.');
  else if (t.includes(',')) norm = t.replace(',', '.');
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) norm = t.replace(/\./g, '');
  const n = Number(norm);
  return Number.isFinite(n) ? n : null;
}

function buildRound(seed: number): Item[] {
  const rnd = mulberry32(seed);
  const numeric = [...buildNumericBank()];
  const diagnostic = [...DIAGNOSTICS];
  const chosen: Item[] = [];
  for (let i = 0; i < 5 && numeric.length > 0; i++) {
    const idx = Math.floor(rnd() * numeric.length);
    const [q] = numeric.splice(idx, 1);
    chosen.push({ kind: 'num', q });
  }
  for (let i = 0; i < 3 && diagnostic.length > 0; i++) {
    const idx = Math.floor(rnd() * diagnostic.length);
    const [q] = diagnostic.splice(idx, 1);
    chosen.push({ kind: 'diag', q });
  }
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  return chosen;
}

export function PracticeView({
  onExp,
  progress,
  onFinish,
}: {
  onExp: (id: string) => void;
  progress: Progress;
  onFinish: (score: number, total: number) => void;
}) {
  const [seed, setSeed] = useState(1);
  const items = useMemo(() => buildRound(seed), [seed]);
  const [numAnswers, setNumAnswers] = useState<Record<string, string>>({});
  const [diagAnswers, setDiagAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const score = items.reduce((acc, it) => {
    if (it.kind === 'num') {
      const v = parseInput(numAnswers[it.q.id] ?? '');
      return acc + (v !== null && Math.abs(v - it.q.answer) <= it.q.tolerance ? 1 : 0);
    }
    return acc + (diagAnswers[it.q.id] === it.q.correct ? 1 : 0);
  }, 0);

  const answered = items.filter((it) =>
    it.kind === 'num' ? (numAnswers[it.q.id] ?? '').trim() !== '' : Boolean(diagAnswers[it.q.id]),
  ).length;

  return (
    <div className="page practice-page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Simulacro de sustentación · {DIAGNOSTICS.length} casos · {buildNumericBank().length} cálculos</span>
          <h1>Ocho decisiones sobre la misma línea</h1>
          <p>
            Cinco cálculos salen de los presets y modelos que acabas de mover (tolerancia del 2 %). Tres casos piden
            diagnosticar qué ocurre y qué revisarías en campo. Cada solución enlaza de vuelta a su simulador.
          </p>
        </div>
        <div className={`score-box ${submitted ? (score >= 6 ? 'ok' : 'bad') : ''}`}>
          <span className="eyebrow">{submitted ? 'Resultado' : 'En curso'}</span>
          <b className="mono">{submitted ? `${score}/${items.length}` : `${answered}/${items.length}`}</b>
          <span>{submitted ? (score >= 6 ? 'Aprobado: puedes sustentar.' : 'Repasa los temas marcados.') : 'responde y califica'}</span>
        </div>
      </header>

      <ol className="practice-list">
        {items.map((it, i) => {
          const idx = i + 1;
          if (it.kind === 'num') {
            const q = it.q;
            const exp = EXPERIMENT_BY_ID[q.exp];
            const raw = numAnswers[q.id] ?? '';
            const v = parseInput(raw);
            const ok = v !== null && Math.abs(v - q.answer) <= q.tolerance;
            return (
              <li key={q.id} className={`practice-item ${submitted ? (ok ? 'ok' : 'bad') : ''}`}>
                <div className="practice-item-head">
                  <Chip tone="neutral">Cálculo {idx}</Chip>
                  <span>{exp?.title} · tema {q.topicId}</span>
                </div>
                <p className="practice-question">{q.prompt}</p>
                <div className="answer-row">
                  <label className="field">
                    <span className="sr-only">Respuesta numérica {idx}</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Escribe el valor"
                      value={raw}
                      onChange={(e) => setNumAnswers({ ...numAnswers, [q.id]: e.target.value })}
                      disabled={submitted}
                    />
                  </label>
                  <span className="unit mono">{q.unit}</span>
                  {submitted && (
                    <span className={`verdict ${ok ? 'ok' : 'bad'}`}>
                      {ok ? '✓ correcto' : `✕ esperado ${fmtAnswer(q.answer, q.unit)}`}
                    </span>
                  )}
                </div>
                {submitted && (
                  <div className="solution-box">
                    <p className="mono">{q.solution}</p>
                    <button type="button" className="text-link" onClick={() => onExp(q.exp)}>
                      Abrir {q.exp.toUpperCase()} →
                    </button>
                  </div>
                )}
              </li>
            );
          }

          const q = it.q;
          const pick = diagAnswers[q.id];
          const ok = pick === q.correct;
          const exp = EXPERIMENT_BY_ID[q.exp];
          return (
            <li key={q.id} className={`practice-item ${submitted ? (ok ? 'ok' : 'bad') : ''}`}>
              <div className="practice-item-head">
                <Chip tone="accent">Caso {idx}</Chip>
                <span>
                  {exp?.title} · tema {exp?.topicId}
                  {progress.quiz[q.exp] === q.correct ? ' · ya lo resolviste' : ''}
                </span>
              </div>
              <p className="scenario">{q.scenario}</p>
              <p className="practice-question">{q.question}</p>
              <div className="quiz-options">
                {q.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className={`quiz-opt ${pick === o.id ? 'picked' : ''} ${submitted && o.id === q.correct ? 'right' : ''}`}
                    aria-pressed={pick === o.id}
                    onClick={() => !submitted && setDiagAnswers({ ...diagAnswers, [q.id]: o.id })}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
              {submitted && (
                <div className="solution-box">
                  <p>{q.explanation}</p>
                  <button type="button" className="text-link" onClick={() => onExp(q.exp)}>
                    Abrir {q.exp.toUpperCase()} →
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <footer className="practice-actions">
        {!submitted ? (
          <>
            <Btn tone="primary" onClick={() => { setSubmitted(true); onFinish(score, items.length); }}>
              Calificar simulacro
            </Btn>
            <span className="muted small">{answered} de {items.length} respondidas · se aprueba con 6 o más.</span>
          </>
        ) : (
          <>
            <Btn
              tone="primary"
              onClick={() => {
                setSubmitted(false);
                setNumAnswers({});
                setDiagAnswers({});
                setSeed((s) => s + 1);
              }}
            >
              Otra ronda
            </Btn>
            <span className="muted small">Obtuviste {score}/{items.length}. Cada ronda mezcla el banco con una semilla distinta.</span>
          </>
        )}
      </footer>
    </div>
  );
}
