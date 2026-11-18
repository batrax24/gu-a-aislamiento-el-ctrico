import { PAL } from '../lib/draw';

/** Clasificación de una sobretensión por el tiempo de frente (µs) y cola (µs). */
/** Clasificación por duración según Sobretensiones, láminas 5 y 6:
 *  frente rápido (rayo) 0,1–20 µs · frente lento (maniobra) 20–5000 µs · temporales ms–s a frecuencia de red. */
export function classifyFront(tFront: number, tTail: number): 'atmosférica' | 'maniobra' | 'temporal' {
  if (tTail >= 20000 || tFront >= 5000) return 'temporal';
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
