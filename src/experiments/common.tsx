import { PAL } from '../lib/draw';

/** Clasificación de una sobretensión por el tiempo de frente (µs) y cola (µs). */
export function classifyFront(tFront: number, tTail: number): 'atmosférica' | 'maniobra' | 'temporal' {
  if (tTail >= 8000 || tFront >= 3000) return 'temporal';
  if (tFront <= 20) return 'atmosférica';
  return 'maniobra';
}

export const FRONT_COLOR = {
  atmosférica: PAL.surge,
  maniobra: PAL.warn,
  temporal: PAL.bad,
} as const;

export const FRONT_BRIGHT = {
  atmosférica: PAL.surgeBright,
  maniobra: PAL.warnBright,
  temporal: PAL.badBright,
} as const;
