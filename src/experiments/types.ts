import type { ComponentType } from 'react';
import type { SourceKey } from '../content/bibliography';

export type Params = Record<string, number>;
export type Derived = Record<string, number>;
export type Tone = 'neutral' | 'ok' | 'warn' | 'bad';

export type Reading = {
  label: string;
  value: string;
  sub?: string;
  tone?: Tone;
};

export type CheckItem = {
  label: string;
  ok: boolean;
  detail?: string;
  info?: boolean;
};

export type LiveStatus = {
  tone: 'ok' | 'warn' | 'bad' | 'info';
  badge: string;
  message: string;
};

export type LegendItem = {
  color: string;
  label: string;
};

export type ParamDef = {
  id: string;
  label: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  def: number;
  decimals?: number;
  help?: string;
  /** Agrupación visual opcional para paneles con muchos controles. */
  group?: string;
  options?: { value: number; label: string }[];
};

export type Preset = {
  id: string;
  label: string;
  note?: string;
  values: Params;
};

export type Goal = {
  id: string;
  /**
   * 'requisito' (por defecto): debe cumplirse en el estado actual al comprobar.
   * 'exploracion': paso de exploración que queda marcado apenas se alcanza una vez.
   */
  kind?: 'requisito' | 'exploracion';
  label: string;
  /** Consejo práctico en lenguaje sencillo para la pista. */
  tip?: string;
  test: (p: Params, d: Derived) => boolean;
  detail: (p: Params, d: Derived) => string;
};

export type Quiz = {
  question: string;
  options: { id: string; label: string }[];
  correct: string;
  explanation: string;
};

export type Learn = {
  /** Analogía concreta de la vida cotidiana para aterrizar el concepto. */
  analogy: string;
  /** Qué fenómeno físico se está mirando, en palabras simples. */
  phenomenon: string;
  /** Qué podrá explicar quien use el simulador. */
  objective: string;
  /** Pasos concretos para probar y observar en la pantalla. */
  watch: string[];
  /** Error típico que este simulador evita. */
  misconception: string;
  /** Alcance y límite honesto del modelo. */
  model?: string;
};

export type SceneProps = { p: Params; d: Derived; t: number };
export type PlotProps = { p: Params; d: Derived };

export type Experiment = {
  id: string;
  topicId: number;
  /** Etiqueta física corta para tarjetas (ej. «Torre y viento», «Bogotá 2.640 m»). */
  contextLabel: string;
  title: string;
  tagline: string;
  why: string;
  params: ParamDef[];
  presets: Preset[];
  compute: (p: Params) => Derived;
  liveStatus: (p: Params, d: Derived) => LiveStatus;
  readings: (d: Derived, p: Params) => Reading[];
  equations: (p: Params, d: Derived) => string[];
  checks?: (p: Params, d: Derived) => CheckItem[];
  goals: Goal[];
  quiz?: Quiz;
  learn: Learn;
  sources: SourceKey[];
  notes?: string[];
  scene: ComponentType<SceneProps>;
  plot: ComponentType<PlotProps>;
};

export const defaults = (e: Experiment): Params =>
  Object.fromEntries(e.params.map((p) => [p.id, p.def])) as Params;

export const presetParams = (e: Experiment, presetId: string): Params => {
  const base = defaults(e);
  const preset = e.presets.find((x) => x.id === presetId);
  return preset ? { ...base, ...preset.values } : base;
};
