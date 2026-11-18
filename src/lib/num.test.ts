import '../test/setup';
import { describe, expect, it } from 'vitest';
import {
  airDensity,
  bundleEquivalentRadius,
  cfoFromInsulators,
  clamp,
  coronaInception,
  correctTo20,
  creepageRequired,
  dar,
  densityCorrected,
  effectiveProtection,
  flashoverVoltage,
  fmt,
  fmtInt,
  impulseMetrics,
  impulseShape,
  insulationResistance,
  insulatorsFromCfo,
  lineParams,
  linspace,
  logspace,
  mulberry32,
  normalCdf,
  normalQuantile,
  parallelRods,
  peekLoss,
  peakTime,
  piIndex,
  pressureAt,
  protectionMargin,
  reflection,
  rodResistance,
  switchingSupport,
  towerPotential,
  transmission,
  ucMin,
  type InsulationState,
} from './num';

describe('formato y funciones básicas', () => {
  it('usa coma decimal, punto de miles y signo menos tipográfico', () => {
    expect(fmt(200.0417, 2)).toBe('200,04');
    expect(fmt(141.4508, 2)).toBe('141,45');
    expect(fmtInt(6125)).toBe('6.125');
    expect(fmt(-1234.5, 1)).toBe('−1.234,5');
    expect(fmt(Number.NaN)).toBe('—');
    expect(clamp(12, 0, 10)).toBe(10);
    expect(linspace(0, 10, 6)).toEqual([0, 2, 4, 6, 8, 10]);
    expect(logspace(1, 1000, 4)).toEqual([1, 10, 100, 1000]);
  });

  it('el cuantil normal corregido es simétrico y reproduce la cola al 10 %', () => {
    expect(normalQuantile(0.5)).toBeCloseTo(0, 6);
    expect(normalQuantile(0.1)).toBeCloseTo(-1.281552, 4);
    expect(normalQuantile(0.9)).toBeCloseTo(1.281552, 4);
    expect(normalQuantile(0.01)).toBeCloseTo(-2.326348, 4);
    expect(normalCdf(0)).toBeCloseTo(0.5, 6);
    expect(normalCdf(1.281552)).toBeCloseTo(0.9, 4);
  });

  it('genera secuencias reproducibles', () => {
    const a = mulberry32(7);
    const b = mulberry32(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe('anclas numéricas del guion y de la guía de ejercicios', () => {
  it('245 kV: fase–tierra eficaz y cresta normal', () => {
    expect(245 / Math.sqrt(3)).toBeCloseTo(141.45, 2);
    expect(245 * Math.sqrt(2 / 3)).toBeCloseTo(200.04, 2);
    expect(switchingSupport(245, 2.5, 1.15)).toBeCloseTo(575.12, 2);
  });

  it('impulso 1,2/50 µs desde τ₁ = 0,41 µs y τ₂ = 66 µs', () => {
    const m = impulseMetrics(0.41, 66);
    expect(m.tp).toBeCloseTo(2.096, 2);
    expect(m.t1).toBeCloseTo(1.214, 2);
    expect(m.t2).toBeCloseTo(48.478, 2);
    expect(m.label).toBe('1.2/48.5 µs');
    expect(impulseShape(0, 0.41, 66)).toBeCloseTo(0, 6);
    expect(impulseShape(peakTime(0.41, 66), 0.41, 66)).toBeCloseTo(1, 6);
  });

  it('Bogotá 2.640 m, 14 °C: presión, δ y corrección de 700 kV', () => {
    const p = pressureAt(2640);
    const delta = airDensity(2640, 14);
    expect(p).toBeCloseTo(73.378, 3);
    expect(delta).toBeCloseTo(0.739318, 5);
    expect(densityCorrected(700, delta, 0.75)).toBeCloseTo(558.112, 2);
  });

  it('U₅₀ = 700 kV, σ = 6 %: 10 % de disrupción ≈ 646,2 kV', () => {
    expect(flashoverVoltage(700, 6, 10)).toBeCloseTo(646.175, 2);
    expect(flashoverVoltage(700, 6, 50)).toBeCloseTo(700, 6);
  });

  it('línea de fuga 245 kV / k_f 25: 6.125 mm y 21 discos', () => {
    expect(creepageRequired(245, 25, 1)).toBeCloseTo(6125, 2);
    expect(creepageRequired(245, 25, 2)).toBeCloseTo(6125 / Math.sqrt(3), 2);
    expect(cfoFromInsulators(insulatorsFromCfo(700))).toBeCloseTo(700, 3);
  });
});

describe('torre, tierra, ondas y subestación', () => {
  it('varilla de 3 m en suelo de 300 Ω·m: 101,8 Ω', () => {
    const r1 = rodResistance(300, 3, 0.01);
    expect(r1).toBeCloseTo(101.81, 2);
    expect(parallelRods(r1, 4)).toBeLessThan(r1);
    expect(parallelRods(r1, 4)).toBeGreaterThan(r1 / 4);
    expect(towerPotential(10, 15, 20, 30)).toBeCloseTo(750, 6);
  });

  it('Γ y τ conservan el signo y el límite abierto es asintótico', () => {
    expect(reflection(400, 100)).toBeCloseTo(-0.6, 6);
    expect(transmission(400, 100)).toBeCloseTo(0.4, 6);
    expect(reflection(400, 2000)).toBeCloseTo(2 / 3, 6);
    expect(transmission(400, 2000)).toBeCloseTo(5 / 3, 6);
    const lp = lineParams(1, 10);
    expect(lp.zc).toBeCloseTo(316.228, 2);
    expect(Number.isFinite(lp.v)).toBe(true);
  });

  it('selección de ZnO: U_c, margen y caída inductiva de conexiones', () => {
    expect(ucMin(245)).toBeCloseTo(148.523, 2);
    expect(effectiveProtection(600, 12, 1, 5)).toBeCloseTo(660, 6);
    expect(protectionMargin(1050, 660)).toBeCloseTo(59.091, 2);
  });

  it('corona: haz, umbral calculado y pérdida de Peek', () => {
    const rEq = bundleEquivalentRadius(1.5, 2, 20);
    expect(rEq).toBeGreaterThan(1.5);
    expect(coronaInception(1.5, 600, 0.9).e0).toBeCloseTo(18.99, 2);
    expect(coronaInception(1.5, 600, 0.9).u0).toBeGreaterThan(0);
    expect(peekLoss(1.5, 600, 60, 0.9, 150, 120)).toBeCloseTo(10.285, 2);
  });

  it('megóhmetro: absorción en ley de potencia y corrección térmica', () => {
    const st: InsulationState = { conductionUA: 1, absorptionUA: 9, absTau: 40, testV: 1000 };
    const r30 = insulationResistance(30, st);
    const r60 = insulationResistance(60, st);
    const r600 = insulationResistance(600, st);
    expect(r60).toBeGreaterThan(r30);
    expect(r600).toBeGreaterThan(r60);
    expect(dar(st)).toBeGreaterThan(1);
    expect(piIndex(st)).toBeGreaterThan(1);
    expect(correctTo20(100, 30)).toBeCloseTo(200, 6);
  });
});
