import { describe, expect, it } from 'vitest';
import {
  airDensity,
  cfoFromInsulators,
  counterpoiseResistance,
  creepageRequired,
  flashoverVoltage,
  impulseShape,
  insulatorsFromCfo,
  linspace,
  lognormalExceed,
  logspace,
  lightningTailApprox,
  pressureAt,
  mulberry32,
  ngFromStormDays,
  normalCdf,
  normalQuantile,
  peekLoss,
  peakTime,
  reflection,
  returnStrokeVelocity,
  rodResistance,
  switchingSupport,
  lineParams,
  cfoRequired,
  transmission,
  towerPotential,
} from './num';

describe('utilidades', () => {
  it('linspace y logspace generan extremos correctos', () => {
    expect(linspace(0, 10, 6)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(logspace(1, 1000, 4)).toEqual([1, 10, 100, 1000]);
  });

  it('normalQuantile es la inversa de normalCdf', () => {
    expect(normalQuantile(0.5)).toBeCloseTo(0, 6);
    expect(normalQuantile(0.1)).toBeCloseTo(-1.281552, 4);
    expect(normalQuantile(0.9)).toBeCloseTo(1.281552, 4);
    expect(normalQuantile(0.01)).toBeCloseTo(-2.326348, 4);
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.281552)).toBeCloseTo(0.9, 4);
    expect(normalCdf(normalQuantile(0.025))).toBeCloseTo(0.025, 4);
  });

  it('mulberry32 es determinista', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
    seqA.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
    seqA.forEach((v) => expect(v).toBeLessThan(1));
  });
});

describe('impulso de tensión (ondas normalizadas, didáctico)', () => {
  it('es cero al inicio y uno en la cresta', () => {
    const tPeak = peakTime(0.41, 66);
    expect(impulseShape(0, 0.41, 66)).toBeCloseTo(0, 6);
    expect(impulseShape(tPeak, 0.41, 66)).toBeCloseTo(1, 6);
    expect(impulseShape(4 * 66, 0.41, 66)).toBeLessThan(0.02);
  });
});

describe('densidad del aire δ = (b/101,3)·(293/(273+T)) (Expo 39, p. 38)', () => {
  it('a nivel del mar y 20 °C, δ = 1', () => {
    expect(airDensity(0, 20, 101.325)).toBeCloseTo(1, 6);
  });
  it('a 0 °C y b = 101,3 kPa, δ ≈ 1,073', () => {
    expect(airDensity(0, 0, 101.325)).toBeCloseTo(1.0733, 3);
  });
  it('con b = 75 kPa y 20 °C, δ ≈ 0,74 (ejemplo de la diapositiva)', () => {
    expect(airDensity(0, 20, 75)).toBeCloseTo(0.74, 2);
  });
  it('presión disminuye con la altitud (h = 2600 m, Bogotá)', () => {
    expect(pressureAt(2600)).toBeCloseTo(73.7, 0);
    expect(airDensity(2600, 20)).toBeCloseTo(0.728, 2);
  });
});

describe('carácter estadístico del rayo (Sobretensiones, pp. 24–30)', () => {
  it('la mediana negativa es 29,96 kA y la positiva 35,16 kA', () => {
    expect(lognormalExceed(29.96, 'negativa')).toBeCloseTo(0.5, 4);
    expect(lognormalExceed(35.16, 'positiva')).toBeCloseTo(0.5, 4);
  });
  it('la aproximación cerrada de la diapositiva vale 0,5 en 31 kA', () => {
    expect(lightningTailApprox(31)).toBeCloseTo(0.5, 6);
    expect(lightningTailApprox(10)).toBeCloseTo(0.95, 2);
    expect(lightningTailApprox(100)).toBeCloseTo(0.0454, 3);
  });
  it('N_g = 0,04·T_d^1,25 con T_d = 40 días da ≈ 4 descargas/km²·año', () => {
    expect(ngFromStormDays(40)).toBeCloseTo(4.02, 2);
  });
  it('la velocidad de retorno con W = 100 e I = 30 kA es 0,48·c', () => {
    expect(returnStrokeVelocity(30, 100) / 299792458).toBeCloseTo(0.48, 2);
  });
});

describe('nivel de aislamiento estadístico (Expo 77, p. 8)', () => {
  it('con U₅₀ = 700 kV y σ = 6 %, U₁₀ ≈ 646,2 kV', () => {
    expect(flashoverVoltage(700, 6, 10)).toBeCloseTo(646.175, 2);
    expect(flashoverVoltage(700, 6, 50)).toBeCloseTo(700, 6);
  });
});

describe('cadena de aisladores (Expo 77, pp. 13–16)', () => {
  it('L_f = k_f · Uₘ: 25 mm/kV × 245 kV = 6.125 mm (actividad 06, lámina 13)', () => {
    expect(creepageRequired(245, 25)).toBeCloseTo(6125, 2);
    expect(creepageRequired(245, 25, 2)).toBeCloseTo(6125 / Math.sqrt(3), 2);
  });
  it('⌈6.125 mm / 292 mm por disco⌉ = 21 discos (fuga efectiva 6.132 mm, actividad 06)', () => {
    expect(Math.ceil(6125 / 292)).toBe(21);
    expect(21 * 292).toBe(6132);
  });
  it('la relación N(CFO) de la diapositiva reproduce 7,95 discos para 623,8 kV', () => {
    expect(insulatorsFromCfo(623.8)).toBeCloseTo(7.95, 2);
    expect(cfoFromInsulators(8)).toBeCloseTo(626.94, 1);
  });
  it('CFO requerido con 2,5 p.u. y 1,15 de corrección: soporte ≈ 575,1 kV; CFO ≈ 623,8 kV', () => {
    expect(switchingSupport(245, 2.5, 1.15)).toBeCloseTo(575.12, 2);
    expect(cfoRequired(245, 2.5, 1.15, 1.3, 6, 1)).toBeCloseTo(623.77, 2);
  });
});

describe('puesta a tierra (Expo 77, pp. 49–56)', () => {
  it('varilla ρ = 100 Ω·m, s = 3 m, r = 0,008 m → R ≈ 35,1 Ω (actividad 11)', () => {
    expect(rodResistance(100, 3, 0.008)).toBeCloseTo(35.12, 2);
  });
  it('contrapeso ρ = 100 Ω·m, s = 20 m, r = 0,005 m, d = 0,5 m → R ≈ 7,94 Ω', () => {
    expect(counterpoiseResistance(100, 20, 0.005, 0.5)).toBeCloseTo(7.94, 2);
  });
  it('V_torre = R·i + L·di/dt: 20 kA × 25 Ω + 1 µH × 10 kA/µs = 510 kV', () => {
    expect(towerPotential(20, 25, 1, 10)).toBeCloseTo(510, 6);
  });
});

describe('ondas viajeras (Expo 77, pp. 60–64)', () => {
  it('Γ = (Z₂ − Z₁)/(Z₂ + Z₁) conserva el signo', () => {
    expect(reflection(400, 100)).toBeCloseTo(-0.6, 6);
    expect(reflection(100, 400)).toBeCloseTo(0.6, 6);
    expect(transmission(400, 100)).toBeCloseTo(0.4, 6); // Vi = 100 kV → Vt = 40 kV (lámina 62)
    // Reflexión total en extremo abierto y cortocircuito
    expect(reflection(1e9, 100)).toBeCloseTo(-1, 6);
    expect(reflection(100, 1e9)).toBeCloseTo(1, 6);
  });
  it('Z_c y v para línea de transmisión típica de 132 kV', () => {
    // L′ = 1 mH/km, C′ = 10 nF/km → Z_c ≈ 316 Ω, v ≈ 3×10⁸ m/s
    const { zc, v } = lineParams(1, 10);
    expect(zc).toBeCloseTo(316.2, 1);
    expect(v / 1e8).toBeCloseTo(3.1623, 3);
  });
});

describe('corona (Expo 77, pp. 69–71; δ según Sobretensiones, p. 38)', () => {
  it('la fórmula de Peek con los datos del ejemplo da ≈ 10,3 kW/km', () => {
    // U = 150 kV, U₀ = 120 kV, f = 60 Hz, δ = 0,9, r = 1,5 cm, s = 600 cm
    expect(peekLoss(1.5, 600, 60, 0.9, 150, 120)).toBeCloseTo(10.29, 1);
  });
  it('por debajo de U₀ no hay pérdidas', () => {
    expect(peekLoss(1.5, 600, 60, 0.9, 110, 120)).toBe(0);
  });
});
