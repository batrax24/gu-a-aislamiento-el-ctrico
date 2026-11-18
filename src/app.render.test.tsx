import './test/setup';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ALL_SOURCES, SOURCES } from './content/bibliography';
import { GLOSSARY } from './content/glossary';
import { LINE_HOTSPOTS } from './content/lineMap';
import { DIAGNOSTICS, buildNumericBank } from './content/practica';
import { STAGES, TOPICS } from './content/topics';
import { EXPERIMENTS, EXPERIMENT_BY_ID, SEQUENTIAL_ORDER, experimentNeighbors, experimentsForTopic } from './experiments';
import { defaults, type Experiment, type Params } from './experiments/types';
import { canvasCalls, canvasNaNProblems, clearCanvasCalls, flushAnimationFrame } from './test/setup';

const BAD_TEXT = /NaN|Infinity|undefined/;
let consoleError: ReturnType<typeof vi.spyOn>;

afterEach(() => {
  consoleError?.mockRestore();
});

function assertClean(label: string, value: unknown) {
  if (typeof value === 'number') {
    expect(Number.isFinite(value), `${label} debe ser finito`).toBe(true);
  } else if (typeof value === 'string') {
    expect(BAD_TEXT.test(value), `${label}: «${value}»`).toBe(false);
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => assertClean(`${label}[${i}]`, v));
  } else if (value && typeof value === 'object') {
    Object.entries(value).forEach(([k, v]) => assertClean(`${label}.${k}`, v));
  }
}

function allStrings(e: Experiment, p: Params, d: Record<string, number>): string[] {
  const live = e.liveStatus(p, d);
  const readings = e.readings(d, p);
  const equations = e.equations(p, d);
  const checks = e.checks?.(p, d) ?? [];
  const goals = e.goals.map((g) => ({ label: g.label, detail: g.detail(p, d), tip: g.tip }));
  return [
    live.badge,
    live.message,
    ...readings.flatMap((r) => [r.label, r.value, r.sub ?? '']),
    ...equations,
    ...checks.flatMap((c) => [c.label, c.detail ?? '']),
    ...goals.flatMap((g) => [g.label, g.detail, g.tip ?? '']),
    ...e.learn.watch,
    e.learn.analogy,
    e.learn.phenomenon,
    e.learn.objective,
    e.learn.misconception,
    e.learn.model ?? '',
    ...(e.notes ?? []),
    ...(e.quiz ? [e.quiz.question, e.quiz.explanation, ...e.quiz.options.map((o) => o.label)] : []),
  ];
}

describe('integridad del currículo', () => {
  it('ordena los 19 simuladores de e01 a e19 sin saltos', () => {
    expect(SEQUENTIAL_ORDER).toHaveLength(19);
    expect(EXPERIMENTS.map((e) => e.id)).toEqual([...SEQUENTIAL_ORDER]);
    expect(new Set(EXPERIMENTS.map((e) => e.id)).size).toBe(19);
    expect(Object.keys(EXPERIMENT_BY_ID)).toHaveLength(19);
    for (let i = 0; i < EXPERIMENTS.length; i++) {
      const { prev, next, index } = experimentNeighbors(EXPERIMENTS[i].id);
      expect(index).toBe(i);
      expect(prev?.id).toBe(i > 0 ? EXPERIMENTS[i - 1].id : undefined);
      expect(next?.id).toBe(i < EXPERIMENTS.length - 1 ? EXPERIMENTS[i + 1].id : undefined);
    }
    // Errores concretos de la v2: estos vecinos antes se saltaban.
    expect(experimentNeighbors('e02').prev?.id).toBe('e01');
    expect(experimentNeighbors('e02').next?.id).toBe('e03');
    expect(experimentNeighbors('e06').next?.id).toBe('e07');
    expect(experimentNeighbors('e09').next?.id).toBe('e10');
    expect(experimentNeighbors('e11').next?.id).toBe('e12');
    expect(experimentNeighbors('e14').next?.id).toBe('e15');
    expect(experimentNeighbors('e19').next).toBeUndefined();
  });

  it('conserva 11 temas, 4 etapas, 10 hotspots, 27 fichas, 16 fuentes y 8 diagnósticos', () => {
    expect(TOPICS).toHaveLength(11);
    expect(STAGES).toHaveLength(4);
    expect(LINE_HOTSPOTS).toHaveLength(10);
    expect(GLOSSARY).toHaveLength(27);
    expect(ALL_SOURCES).toHaveLength(16);
    expect(DIAGNOSTICS).toHaveLength(8);
    expect(experimentsForTopic(1)).toHaveLength(0);
    expect(experimentsForTopic(2).map((e) => e.id)).toEqual(['e01', 'e02', 'e03']);
    expect(experimentsForTopic(11).map((e) => e.id)).toEqual(['e16', 'e18', 'e19']);
    for (const d of DIAGNOSTICS) {
      expect(d.options.some((o) => o.id === d.correct)).toBe(true);
      expect(EXPERIMENT_BY_ID[d.exp]).toBeTruthy();
    }
    for (const item of GLOSSARY) expect(EXPERIMENT_BY_ID[item.expId]).toBeTruthy();
    for (const h of LINE_HOTSPOTS) {
      expect(TOPICS.some((t) => t.id === h.topicId)).toBe(true);
      h.expIds.forEach((id) => expect(EXPERIMENT_BY_ID[id]).toBeTruthy());
    }
  });

  it('genera un banco numérico con tolerancia del 2 % y soluciones limpias', () => {
    const bank = buildNumericBank();
    expect(bank.length).toBeGreaterThan(30);
    for (const q of bank) {
      expect(Number.isFinite(q.answer)).toBe(true);
      expect(q.tolerance).toBeGreaterThanOrEqual(Math.abs(q.answer) * 0.02 - 1e-9);
      expect(EXPERIMENT_BY_ID[q.exp]).toBeTruthy();
      assertClean(`banco ${q.id}`, q.prompt);
      assertClean(`banco ${q.id}`, q.solution);
      assertClean(`banco ${q.id}`, q.unit);
    }
  });

  it('cada definición trae contrato completo, fuentes válidas y parámetros dentro de rango', () => {
    for (const e of EXPERIMENTS) {
      expect(e.presets.length, `${e.id} presets`).toBeGreaterThanOrEqual(3);
      expect(e.goals.length, `${e.id} goals`).toBeGreaterThanOrEqual(2);
      expect(e.learn.watch.length, `${e.id} watch`).toBeGreaterThanOrEqual(2);
      expect(e.sources.length, `${e.id} sources`).toBeGreaterThan(0);
      e.sources.forEach((k) => expect(SOURCES[k], `${e.id} fuente ${k}`).toBeTruthy());
      expect(TOPICS.some((t) => t.id === e.topicId)).toBe(true);
      expect(e.scene).toBeTypeOf('function');
      expect(e.plot).toBeTypeOf('function');
      for (const def of e.params) {
        expect(Number.isFinite(def.def)).toBe(true);
        expect(def.def).toBeGreaterThanOrEqual(def.min - 1e-9);
        expect(def.def).toBeLessThanOrEqual(def.max + 1e-9);
        expect(def.step).toBeGreaterThan(0);
        for (const preset of e.presets) {
          if (!(def.id in preset.values)) continue;
          const v = preset.values[def.id];
          expect(v, `${e.id}/${preset.id}/${def.id} mínimo`).toBeGreaterThanOrEqual(def.min - 1e-9);
          expect(v, `${e.id}/${preset.id}/${def.id} máximo`).toBeLessThanOrEqual(def.max + 1e-9);
        }
      }
    }
  });
});

describe('ejecución de los 19 laboratorios', () => {
  it('calcula todos los presets, ejecuta goals/checks y renderiza escenas y gráficas sin NaN ni errores', () => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    for (const e of EXPERIMENTS) {
      const cases: Params[] = [defaults(e), ...e.presets.map((pr) => ({ ...defaults(e), ...pr.values }))];
      for (const [caseIndex, p] of cases.entries()) {
        const d = e.compute(p);
        Object.entries(d).forEach(([k, v]) => assertClean(`${e.id}/caso${caseIndex}/${k}`, v));
        allStrings(e, p, d).forEach((s, i) => assertClean(`${e.id}/caso${caseIndex}/texto${i}`, s));

        for (const g of e.goals) {
          expect(typeof g.test(p, d), `${e.id}/${g.id} test`).toBe('boolean');
          assertClean(`${e.id}/${g.id} detail`, g.detail(p, d));
        }
        if (e.quiz) {
          expect(e.quiz.options.some((o) => o.id === e.quiz!.correct)).toBe(true);
        }

        clearCanvasCalls();
        const Scene = e.scene;
        const sceneView = render(<Scene p={p} d={d} t={1.25} />);
        flushAnimationFrame();
        expect(canvasCalls.length, `${e.id}/caso${caseIndex} draw`).toBeGreaterThan(0);
        expect(canvasNaNProblems(), `${e.id}/caso${caseIndex} canvas`).toEqual([]);
        sceneView.unmount();

        const Chart = e.plot;
        const plotView = render(<Chart p={p} d={d} />);
        expect(plotView.container.querySelector('svg'), `${e.id}/caso${caseIndex} svg`).toBeTruthy();
        const text = plotView.container.textContent ?? '';
        expect(BAD_TEXT.test(text), `${e.id}/caso${caseIndex} gráfica: ${text.slice(0, 180)}`).toBe(false);
        plotView.unmount();
      }
    }

    expect(consoleError).not.toHaveBeenCalled();
  });
});
