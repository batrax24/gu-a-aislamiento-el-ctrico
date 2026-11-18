import { TOPICS } from '../content/topics';
import { overvoltageExperiments } from './defs/overvoltages';
import { lightningExperiments } from './defs/lightning';
import { insulationExperiments } from './defs/insulation';
import { towerExperiments } from './defs/tower';
import { protectionExperiments } from './defs/protection';
import { protection2Experiments } from './defs/protection2';
import type { Experiment } from './types';

/** Orden secuencial del currículo: el botón «Siguiente» recorre los 19 simuladores sin saltarse ninguno. */
export const SEQUENTIAL_ORDER = [
  'e01',
  'e02',
  'e03',
  'e04',
  'e05',
  'e06',
  'e07',
  'e08',
  'e09',
  'e10',
  'e11',
  'e12',
  'e13',
  'e14',
  'e15',
  'e16',
  'e17',
  'e18',
  'e19',
] as const;

export const ALL_DEFS: Experiment[] = [
  ...overvoltageExperiments,
  ...lightningExperiments,
  ...insulationExperiments,
  ...towerExperiments,
  ...protectionExperiments,
  ...protection2Experiments,
];

const byIdMap = new Map(ALL_DEFS.map((e) => [e.id, e]));

export const EXPERIMENTS: Experiment[] = SEQUENTIAL_ORDER.map((id) => {
  const exp = byIdMap.get(id);
  if (!exp) throw new Error(`Falta la definición del simulador ${id}`);
  return exp;
});

export const EXPERIMENT_BY_ID: Record<string, Experiment> = Object.fromEntries(EXPERIMENTS.map((e) => [e.id, e]));

export function getExperiment(id: string): Experiment | undefined {
  return EXPERIMENT_BY_ID[id];
}

export function experimentsForTopic(topicId: number): Experiment[] {
  const topic = TOPICS.find((t) => t.id === topicId);
  if (!topic) return [];
  return topic.experiments.map((id) => EXPERIMENT_BY_ID[id]).filter((e): e is Experiment => Boolean(e));
}

/** Vecinos estrictamente secuenciales (no salta al primer experimento del tema siguiente). */
export function experimentNeighbors(id: string): { prev?: Experiment; next?: Experiment; index: number } {
  const index = EXPERIMENTS.findIndex((e) => e.id === id);
  if (index < 0) return { index: -1 };
  return {
    index,
    prev: index > 0 ? EXPERIMENTS[index - 1] : undefined,
    next: index < EXPERIMENTS.length - 1 ? EXPERIMENTS[index + 1] : undefined,
  };
}

export const TOTAL_EXPERIMENTS = EXPERIMENTS.length;
