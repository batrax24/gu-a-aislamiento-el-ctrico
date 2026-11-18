/**
 * Modelos numéricos compartidos por los 19 simuladores, el simulacro y las pruebas.
 * Todos los valores del guion, las diapositivas y la guía de ejercicios se reproducen
 * exactamente con las hipótesis declaradas en cada fuente.
 */

export const P0 = 101.325; // kPa (nivel del mar estándar)
export const T0 = 293.15; // K (20 °C)
export const E0_AIRE = 21.1; // kV/cm eficaces, aire estándar (efecto corona)

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const r2 = (v: number, d = 2) => Number(v.toFixed(d));

/** Formato es-CO: coma decimal, punto de miles. */
export function fmt(v: number, d = 2): string {
  if (!Number.isFinite(v)) return '—';
  const s = Math.abs(v).toFixed(d);
  const [ent, dec] = s.split('.');
  const miles = ent.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = v < 0 && Number(s) !== 0 ? '−' : '';
  return dec ? `${sign}${miles},${dec}` : `${sign}${miles}`;
}

export function fmtInt(v: number): string {
  return fmt(v, 0);
}

/** Evalúa un polinomio con coeficientes de mayor a menor grado (Horner). */
function poly(coeffs: readonly number[], x: number): number {
  return coeffs.reduce((acc, c) => acc * x + c, 0);
}

/** Aproximación de Acklam para el cuantil normal estándar. */
export function normalQuantile(p: number): number {
  const pp = clamp(p, 1e-9, 1 - 1e-9);
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.38357751867269e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (pp < pl) {
    const q = Math.sqrt(-2 * Math.log(pp));
    return poly(c, q) / poly([...d, 1], q);
  }
  if (pp > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - pp));
    return -poly(c, q) / poly([...d, 1], q);
  }
  const q = pp - 0.5;
  const r = q * q;
  return (poly(a, r) * q) / poly([...b, 1], r);
}

/** Función de distribución normal acumulada (Abramowitz-Stegun 7.1.26). */
export function normalCdf(z: number, mu = 0, sigma = 1): number {
  if (sigma <= 0) return z >= mu ? 1 : 0;
  const x = (z - mu) / sigma;
  const t = 1 / (1 + (0.3275911 * Math.abs(x)) / Math.SQRT2);
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? 0.5 * (1 + y) : 0.5 * (1 - y);
}

/** Presión atmosférica aproximada (kPa) para una altitud h en metros. */
export function pressureAt(h: number): number {
  const hh = clamp(h, 0, 6000);
  return P0 * Math.pow(1 - 2.25577e-5 * hh, 5.25588);
}

/** Densidad relativa del aire δ = (p/p₀)·(T₀/T), con T en °C. */
export function airDensity(h: number, tempC: number, pressureKPa?: number): number {
  const p = pressureKPa && pressureKPa > 0 ? pressureKPa : pressureAt(h);
  const T = tempC + 273.15;
  return (p / P0) * (T0 / T);
}

/* ------------------------- Impulso de tensión ------------------------- */

/** Doble exponencial normalizada a 1 en su cresta; t y tau en µs. */
export function impulseShape(t: number, tau1: number, tau2: number): number {
  const tp = peakTime(tau1, tau2);
  const den = Math.exp(-tp / tau2) - Math.exp(-tp / tau1);
  if (!Number.isFinite(t) || Math.abs(den) < 1e-12) return 0;
  return (Math.exp(-t / tau2) - Math.exp(-t / tau1)) / den;
}

export function peakTime(tau1: number, tau2: number): number {
  if (tau2 <= tau1) return 0;
  const a = 1 / tau1;
  const b = 1 / tau2;
  return Math.log(a / b) / (a - b);
}

function crossTime(f: (t: number) => number, target: number, lo: number, hi: number, rising: boolean): number {
  let a = lo;
  let b = hi;
  const fa = f(a) - target;
  const fb = f(b) - target;
  if (fa * fb > 0) return rising ? lo : hi;
  for (let i = 0; i < 80; i++) {
    const m = (a + b) / 2;
    const fm = f(m) - target;
    if ((fa < 0 && fm < 0) || (fa > 0 && fm > 0)) a = m;
    else b = m;
  }
  return (a + b) / 2;
}

export type ImpulseMetrics = {
  tau1: number;
  tau2: number;
  tp: number;
  t30: number;
  t90: number;
  /** tiempo de frente convencional 1,67·(t90−t30) */
  t1: number;
  /** origen virtual (cruce por cero de la recta 30–90 %) */
  t0: number;
  /** tiempo hasta la semiamplitud en la cola, medido desde t0 */
  t2: number;
  /** instante real del 50 % en la cola */
  t50: number;
  /** etiqueta redondeada t1/t2 */
  label: string;
};

export function impulseMetrics(tau1: number, tau2: number): ImpulseMetrics {
  const f = (t: number) => impulseShape(t, tau1, tau2);
  const tp = peakTime(tau1, tau2);
  const t30 = crossTime(f, 0.3, 0, tp, true);
  const t90 = crossTime(f, 0.9, 0, tp, true);
  const slope = (0.9 - 0.3) / Math.max(1e-6, t90 - t30);
  const t0 = t30 - 0.3 / slope;
  const t50 = crossTime(f, 0.5, tp, tau2 * 10 + 100, false);
  const t1 = 1.67 * (t90 - t30);
  const t2 = t50 - t0;
  return { tau1, tau2, tp, t30, t90, t1, t0, t2, t50, label: `${t1.toFixed(1)}/${t2.toFixed(1)} µs` };
}

/* --------------------- Probabilidad de disrupción --------------------- */

export function flashoverVoltage(u50: number, sigmaPct: number, probabilityPct: number): number {
  const sigma = (sigmaPct / 100) * u50;
  return u50 + normalQuantile(probabilityPct / 100) * sigma;
}

/* ------------------------- Cadena de aisladores ------------------------ */

/** Criterio de fuga (IEC 60815 / Cardona). base: 1 = entre fases, 2 = fase–tierra. */
export function creepageRequired(um: number, kf: number, base: 1 | 2, ka = 1): number {
  const denom = ka * (base === 2 ? Math.sqrt(3) : 1);
  return (kf * um) / Math.max(1e-6, denom);
}

/** Relación CFO–número de aisladores del material (Cardona, UNAL). */
export const CFO_FIT = { a: 6.6485e-6, b: 7.9192e-3, c: -0.4219 };

export function insulatorsFromCfo(cfo: number): number {
  const { a, b, c } = CFO_FIT;
  return Math.max(0, a * cfo * cfo + b * cfo + c);
}

export function cfoFromInsulators(n: number): number {
  const { a, b, c } = CFO_FIT;
  const disc = b * b - 4 * a * (c - n);
  if (disc <= 0) return 0;
  return (-b + Math.sqrt(disc)) / (2 * a);
}

/** CFO requerido por sobretensión de maniobra, corregido por altitud (δ^exponent). */
export function cfoRequired(um: number, fv: number, fs: number, k: number, sigmaPct: number, delta: number, exponent = 1): number {
  const uSupport = fs * fv * um * Math.sqrt(2 / 3);
  const cfoAtSea = uSupport / Math.max(1e-6, 1 - k * (sigmaPct / 100));
  return cfoAtSea / Math.pow(Math.max(1e-6, delta), exponent);
}

export function switchingSupport(um: number, fv: number, fs: number): number {
  return fs * fv * um * Math.sqrt(2 / 3);
}

/* ----------------------------- Atmósfera ----------------------------- */

export function densityCorrected(uRef: number, delta: number, n = 0.75): number {
  return uRef * Math.pow(Math.max(1e-6, delta), n);
}

/* ------------------------------ Puesta a tierra ----------------------- */

export function rodResistance(rho: number, s: number, r: number): number {
  return (rho / (2 * Math.PI * s)) * Math.log((2 * s) / r);
}

export function counterpoiseResistance(rho: number, s: number, r: number, d: number): number {
  return (rho / (Math.PI * s)) * (Math.log((2 * s) / Math.sqrt(4 * r * d)) - 1);
}

export function parallelRods(r1: number, n: number): number {
  return r1 / Math.pow(Math.max(1, n), 0.78);
}

export function towerPotential(iKA: number, rt: number, lMicroH: number, didtKAus: number): number {
  return iKA * rt + lMicroH * didtKAus;
}

/* ------------------------------ Ondas viajeras ------------------------ */

export function reflection(z1: number, z2: number): number {
  return (z2 - z1) / Math.max(1e-9, z2 + z1);
}

export function transmission(z1: number, z2: number): number {
  return (2 * z2) / Math.max(1e-9, z2 + z1);
}

export function lineParams(lMHkm: number, cNFkm: number): { zc: number; v: number } {
  const lp = (lMHkm * 1e-3) / 1000; // H/m
  const cp = (cNFkm * 1e-9) / 1000; // F/m
  if (lp <= 0 || cp <= 0) return { zc: 0, v: 0 };
  return { zc: Math.sqrt(lp / cp), v: 1 / Math.sqrt(lp * cp) };
}

/* ------------------------------- Pararrayos --------------------------- */

export function ucMin(um: number, solidlyEarthed = true): number {
  return solidlyEarthed ? 1.05 * (um / Math.sqrt(3)) : 1.05 * um;
}

export function tovEquivalent(uTov: number, durationS: number, md = 0.02): number {
  return uTov * Math.pow(durationS / 10, md);
}

export function tovCapability(cap1s: number, durationS: number, md = 0.02): number {
  return cap1s * Math.pow(1 / durationS, md);
}

export function protectionMargin(uWithstand: number, uApplied: number): number {
  return (uWithstand / Math.max(1e-6, uApplied) - 1) * 100;
}

export function effectiveProtection(ures: number, d: number, lcMicroHm: number, didtKAus: number): number {
  return ures + lcMicroHm * d * didtKAus;
}

/* --------------------------------- Corona ----------------------------- */

export function bundleEquivalentRadius(r: number, n: number, bundleRadius: number): number {
  if (n <= 1) return r;
  return Math.pow(n * r * Math.pow(Math.max(1e-6, bundleRadius), n - 1), 1 / n);
}

export function coronaInception(rEq: number, s: number, delta: number, m = 1): { e0: number; u0: number } {
  const e0 = E0_AIRE * delta * m;
  return { e0, u0: e0 * rEq * Math.log(Math.max(1.01, s / rEq)) };
}

export function peekLoss(rEq: number, s: number, f: number, delta: number, u: number, u0: number): number {
  if (u <= u0) return 0;
  const k = (242 / Math.max(1e-6, delta)) * (f + 25) * Math.sqrt(rEq / s);
  return k * Math.pow(u - u0, 2) * 1e-5;
}

/* ---------------------- Medición de aislamiento ----------------------- */

export type InsulationState = {
  conductionUA: number;
  absorptionUA: number;
  absTau: number;
  testV: number;
};

export function insulationResistance(t: number, st: InsulationState): number {
  const decay = Math.pow(1 + t / Math.max(0.5, st.absTau), -1.2);
  const i = (st.conductionUA + st.absorptionUA * decay) * 1e-6;
  return st.testV / Math.max(1e-12, i) / 1e6;
}

export function insulationCurrents(t: number, st: InsulationState): { ic: number; ia: number; icap: number; total: number } {
  const ic = st.conductionUA;
  const ia = st.absorptionUA * Math.pow(1 + t / Math.max(0.5, st.absTau), -1.2);
  const icap = (st.testV / 100) * Math.exp(-t / 2.2);
  return { ic, ia, icap, total: ic + ia + icap };
}

export function dar(r: InsulationState): number {
  return insulationResistance(60, r) / insulationResistance(30, r);
}

export function piIndex(r: InsulationState): number {
  return insulationResistance(600, r) / insulationResistance(60, r);
}

export function correctTo20(rMeasured: number, tempC: number): number {
  return rMeasured * Math.pow(2, (tempC - 20) / 10);
}

/* ------------------------------ Utilidades ---------------------------- */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function linspace(a: number, b: number, n: number): number[] {
  if (n < 2) return [a];
  return Array.from({ length: n }, (_, i) => a + ((b - a) * i) / (n - 1));
}

export function logspace(a: number, b: number, n: number): number[] {
  const la = Math.log10(a);
  const lb = Math.log10(b);
  return Array.from({ length: n }, (_, i) => Math.pow(10, la + ((lb - la) * i) / (n - 1)));
}
