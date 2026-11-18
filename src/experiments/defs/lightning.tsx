import { fmt, impulseShape, linspace, lognormalExceed, normalCdf, normalQuantile } from '../../lib/num';
import { PAL, circle, electricArc, environment, glow, insulatorString, latticeTower, line, pill, sceneHeader, stormCloud, text } from '../../lib/draw';
import { Plot, SceneCanvas } from '../../components/ui';
import type { Experiment } from '../types';

/* =============================== e04 =============================== */

const e04: Experiment = {
  id: 'e04',
  topicId: 3,
  contextLabel: 'Tormenta y tres caminos del rayo',
  title: 'El rayo: una distribución de corrientes y tres formas de atacar',
  tagline: 'No todos los rayos son iguales: unos son frecuentes y moderados, pocos son extremos',
  why: 'Entender cómo se cuantifica el riesgo de rayos en una línea real y diferenciar impacto en fase, flameo inverso y rayo cercano.',
  params: [
    {
      id: 'i',
      group: 'Severidad de la descarga',
      label: 'Corriente máxima del rayo (I)',
      unit: 'kA',
      min: 2,
      max: 200,
      step: 1,
      def: 31,
      help: '31 kA es el valor representativo (lámina 29); la mediana lognormal es 29,96 kA (lámina 25).',
    },
    {
      id: 'pol',
      group: 'Severidad de la descarga',
      label: 'Polaridad de la descarga',
      min: 0,
      max: 1,
      step: 1,
      def: 0,
      options: [
        { value: 0, label: 'Negativa (≈ 90 %)' },
        { value: 1, label: 'Positiva (< 10 %)' },
      ],
      help: 'Las descargas a tierra son ~90 % negativas (lámina 18). La positiva tiene cola más pesada (σ_ln = 1,23, Ī = 35,16 kA).',
    },
    {
      id: 'didt',
      group: 'Severidad de la descarga',
      label: 'Brusquedad de subida (di/dt)',
      unit: 'kA/µs',
      min: 2,
      max: 120,
      step: 1,
      def: 30,
      help: 'Cada kA/µs induce 1 kV por cada microhenrio (µH) de torre o cable.',
    },
    {
      id: 'gfd',
      group: 'Exposición geográfica de la línea',
      label: 'Actividad de rayos en la zona (N_g)',
      unit: 'rayos/km²·año',
      min: 0.5,
      max: 20,
      step: 0.5,
      def: 5,
      help: 'N_g varía entre 0 y 20 rayos/km²·año; los mapas promedian ≥ 5 años; sin red de localización se estima con días de tormenta T_d (lámina 30).',
    },
    {
      id: 'largo',
      group: 'Exposición geográfica de la línea',
      label: 'Longitud total de la línea',
      unit: 'km',
      min: 10,
      max: 300,
      step: 5,
      def: 100,
    },
    {
      id: 'h',
      group: 'Exposición geográfica de la línea',
      label: 'Altura media de las torres',
      unit: 'm',
      min: 15,
      max: 80,
      step: 1,
      def: 40,
      help: 'Torres más altas «atraen» rayos desde una franja de terreno más ancha.',
    },
    {
      id: 'b',
      group: 'Exposición geográfica de la línea',
      label: 'Separación entre cables de guarda (b)',
      unit: 'm',
      min: 0,
      max: 15,
      step: 0.5,
      def: 7,
      help: 'Término b del modelo de captación N_s = N_g·(28·h^0,6 + b)/10 (lámina 35).',
    },
  ],
  presets: [
    {
      id: 'mediana',
      label: 'Rayo representativo (31 kA, negativa)',
      note: 'Valor más representativo (lámina 29). La mediana lognormal es 29,96 kA (lámina 25); r_c ≈ 93,5 m.',
      values: { i: 31, pol: 0, didt: 30, gfd: 5, largo: 100, h: 40, b: 7 },
    },
    {
      id: 'severa',
      label: 'Rayo extremo (100 kA, 80 kA/µs)',
      note: 'Muy poco frecuente: ≈ 3,2 % de las descargas negativas supera 100 kA (lámina 25). r_c ≈ 200 m.',
      values: { i: 100, pol: 0, didt: 80, gfd: 5, largo: 100, h: 40, b: 7 },
    },
    {
      id: 'debil',
      label: 'Rayo pequeño (10 kA)',
      note: '≈ 95 % de las descargas negativas supera 10 kA (lámina 25); su r_c (≈ 45 m) es la que más fácil burla al cable de guarda.',
      values: { i: 10, pol: 0, didt: 12, gfd: 5, largo: 100, h: 40, b: 7 },
    },
  ],
  compute: (p) => {
    const neg = p.pol === 0;
    const mean = neg ? 29.96 : 35.16;
    const sigma = neg ? 0.65 : 1.23;
    const exceed = lognormalExceed(p.i, neg ? 'negativa' : 'positiva');
    const rc = 10 * Math.pow(Math.max(1e-9, p.i), 0.65); // lámina 40 (Expo 77)
    const ns = (p.gfd * (28 * Math.pow(p.h, 0.6) + p.b)) / 10; // impactos/100 km·año, lámina 35 (Expo 77)
    const flashes = (ns * p.largo) / 100;
    return { exceed, rc, ns, flashes, mean, sigma, lDidt: p.didt };
  },
  liveStatus: (p, d) => ({
    tone: d.exceed <= 0.05 ? 'ok' : d.exceed <= 0.25 ? 'warn' : 'info',
    badge: `I = ${fmt(p.i, 0)} kA · Solo ${fmt(d.exceed * 100, 1)} % de rayos la supera`,
    message: `Esta línea de ${fmt(p.largo, 0)} km recibe ~${fmt(d.flashes, 0)} impactos/año (N_s = ${fmt(d.ns, 0)}/100 km·año). Un rayo de ${fmt(p.i, 0)} kA «elige» objetivo desde r_c = ${fmt(d.rc, 0)} m.`,
  }),
  readings: (d, p) => [
    {
      label: 'Rayos que superan esta corriente',
      value: `${fmt(d.exceed * 100, 1)} %`,
      sub: `lognormal (${p.pol === 0 ? 'negativa' : 'positiva'}: Ī = ${fmt(d.mean, 2)} kA, σ_ln = ${fmt(d.sigma, 2)})`,
      tone: d.exceed <= 0.05 ? 'ok' : d.exceed < 0.2 ? 'warn' : 'bad',
    },
    { label: 'Distancia de choque r_c', value: `${fmt(d.rc, 1)} m`, sub: 'r_c = 10·I^0,65 (Expo 77, lámina 40)' },
    { label: 'Efecto inductivo por µH', value: `${fmt(p.didt, 0)} kV/µH`, sub: 'voltaje extra en torres y bajantes' },
    { label: 'Captación estimada N_s', value: `${fmt(d.ns, 0)} /100 km·año`, sub: 'N_g·(28·h^0,6 + b)/10 (lámina 35)' },
    { label: 'Impactos esperados en la línea', value: `${fmt(d.flashes, 0)} /año`, sub: `sobre ${fmt(p.largo, 0)} km, N_s prorrateado` },
  ],
  equations: (p, d) => [
    `P(I ≥ ${fmt(p.i, 0)} kA) = 1 − Φ((ln ${fmt(p.i, 0)} − ln ${fmt(d.mean, 2)}) / ${fmt(d.sigma, 2)}) = ${fmt(d.exceed * 100, 1)} %  (lámina 25)`,
    `Forma cerrada (lámina 26, ec. 3.4): P ≈ 1 / (1 + (I/31)^2,6) = ${fmt(100 / (1 + Math.pow(p.i / 31, 2.6)), 1)} %`,
    `Distancia de atracción: r_c = 10 · ${fmt(p.i, 0)}^0,65 = ${fmt(d.rc, 1)} m  (Expo 77, lámina 40)`,
    `N_s = N_g·(28·h^0,6 + b)/10 = ${fmt(p.gfd, 1)}×(28×${fmt(p.h, 0)}^0,6 + ${fmt(p.b, 1)})/10 = ${fmt(d.ns, 0)} /100 km·año  (lámina 35)`,
    `Voltaje inductivo: L · di/dt = ${fmt(p.didt, 0)} kV por cada 1 µH de inductancia`,
  ],
  checks: () => [
    { label: 'La corriente de rayo se trata como probabilidad', ok: true, detail: 'el diseño a 5 % de excedencia cubre el 95 % de los rayos' },
    { label: 'Tres caminos separados: fase, guarda/torre y suelo vecino', ok: true, detail: 'impacto directo, flameo inverso e inducida (láminas 32–33)' },
    { label: 'Importa tanto el pico (kA) como la rapidez di/dt (kA/µs)', ok: true, detail: 'di/dt eleva el potencial inductivo' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Sube la corriente de diseño hasta que solo el 5 % o menos de los rayos la supere',
      tip: 'Desliza la corriente I hacia arriba (~87 kA o más en negativas) o prueba «Rayo extremo (100 kA)».',
      test: (_p, d) => d.exceed <= 0.05,
      detail: (_p, d) => `excedencia actual: ${fmt(d.exceed * 100, 1)} % (meta: ≤ 5 %)`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Observa una distancia de choque r_c de 60 m o mayor',
      tip: 'Cualquier corriente de 16 kA o superior produce r_c ≥ 60 m.',
      test: (_p, d) => d.rc >= 60,
      detail: (_p, d) => `r_c = ${fmt(d.rc, 1)} m`,
    },
  ],
  learn: {
    analogy:
      'Diseñar contra rayos es como diseñar el alcantarillado contra aguaceros: no existe «la lluvia única», sino lluvias comunes y tormentas del siglo. Eliges hasta qué intensidad cubrir (por ejemplo el 95 % de los rayos) para que las salidas de línea al año sean mínimas.',
    phenomenon:
      'Una nube de tormenta lanza un canal ionizado hacia abajo (líder) y, al conectar con la torre, un cable o el suelo, circula una enorme corriente de retorno. En la escena se alternan los tres caminos por los que esa descarga afecta a la línea.',
    objective:
      'Explicar por qué el rayo se modela con curvas de probabilidad y distinguir visualmente impacto directo en fase, flameo inverso en la torre y sobretensión inducida por caída cercana.',
    watch: [
      'Observa en la escena cómo se turnan los 3 mecanismos cada pocos segundos: ① directo al cable azul, ② a la punta de la torre (con arco rojo a la fase) y ③ al terreno cercano.',
      'Sube la altura de torre o la densidad N_g y mira cómo crecen los rayos esperados por año sobre la línea.',
      'En la gráfica, busca dónde la curva cruza el 5 %: esa corriente (~90 kA) cubre 19 de cada 20 rayos.',
    ],
    misconception:
      'Afirmar que «un rayo tiene 30 kA». 31 kA es apenas la mediana: uno de cada veinte rayos supera los 90 kA, y los pequeños de 8–12 kA son los que más fácil esquivan el cable de guarda.',
    model: 'Distribución lognormal de la lámina 25: negativas Ī = 29,96 kA, σ_ln = 0,65; positivas Ī = 35,16 kA, σ_ln = 1,23. N_s = N_g·(28·h^0,6 + b)/10 (Expo 77, lámina 35); r_c = 10·I^0,65 (lámina 40).',
  },
  sources: ['expo39', 'expo77'],
  notes: ['Recuerda: la onda 8/20 µs usada en pararrayos es una onda de corriente (kA), distinta de la onda de voltaje 1,2/50 µs (kV).'],
  scene: ({ p, d, t }) => {
    const stage = Math.floor(t / 2.6) % 3; // alterna claramente los 3 mecanismos
    return (
      <SceneCanvas
        legend={[
          { color: PAL.phaseBright, label: '① Directo a la fase (burla guarda)' },
          { color: PAL.badBright, label: '② En guarda/torre → flameo inverso' },
          { color: PAL.surgeBright, label: '③ Cae cerca → onda inducida' },
        ]}
        draw={(ctx, w, h) => {
          const gy = h * 0.85;
          environment(ctx, w, h, { mood: 'storm', groundY: gy });
          stormCloud(ctx, w * 0.5, h * 0.16, w * 0.62);

          const tx = w * 0.5;
          const th = h * 0.54;
          const armHalf = w * 0.13;
          latticeTower(ctx, tx, gy, th, {
            color: PAL.steelLight,
            arms: [
              { yFrac: 0.8, half: armHalf },
              { yFrac: 0.58, half: armHalf * 0.82 },
            ],
          });

          const guardY = gy - th;
          const armY = gy - th * 0.8;
          const leftChain = insulatorString(ctx, tx - armHalf, armY, 7, 26, 0, {
            dark: true,
            flashover: stage === 1,
            t: t * 3,
          });
          const rightChain = insulatorString(ctx, tx + armHalf, armY, 7, 26, 0, { dark: true });

          // Cable de guarda y conductores de fase
          line(ctx, w * 0.08, guardY + 8, tx, guardY, { color: PAL.guardBright, width: 1.7 });
          line(ctx, tx, guardY, w * 0.92, guardY + 8, { color: PAL.guardBright, width: 1.7 });
          line(ctx, w * 0.05, leftChain.endY + 12, leftChain.endX, leftChain.endY, { color: PAL.phaseBright, width: 2.3 });
          line(ctx, rightChain.endX, rightChain.endY, w * 0.95, rightChain.endY + 12, { color: PAL.phaseBright, width: 2.3 });

          // Animación clara del mecanismo activo
          if (stage === 0) {
            const hitX = w * 0.22;
            const hitY = leftChain.endY + 7;
            electricArc(ctx, hitX - 12, h * 0.21, hitX, hitY, t * 4, PAL.phaseBright, 2.8);
            glow(ctx, hitX, hitY, 28, PAL.phaseBright, 0.55);
            pill(ctx, '① IMPACTO DIRECTO EN FASE (falla de apantallamiento)', w * 0.5, 22, { color: PAL.phaseBright, dark: true, align: 'center' });
          } else if (stage === 1) {
            electricArc(ctx, tx + 8, h * 0.21, tx, guardY, t * 4, PAL.guardBright, 2.8);
            glow(ctx, tx, guardY, 28, PAL.guardBright, 0.5);
            for (let k = 0; k < 4; k++) {
              const u = (t * 1.8 + k * 0.25) % 1;
              circle(ctx, tx, guardY + u * (gy - guardY), 3.2, { fill: PAL.guardBright });
            }
            pill(ctx, '② IMPACTO EN TORRE → sube voltaje y salta arco a la fase (flameo inverso)', w * 0.5, 22, {
              color: PAL.badBright,
              dark: true,
              align: 'center',
            });
          } else {
            const nx = w * 0.82;
            electricArc(ctx, nx - 8, h * 0.21, nx, gy, t * 4, PAL.surgeBright, 2.6);
            for (let k = 0; k < 3; k++) {
              const rr = 14 + ((t * 42 + k * 28) % 85);
              circle(ctx, nx, gy - 6, rr, { stroke: PAL.surgeBright, width: 1.4, alpha: Math.max(0.1, 0.65 - rr / 130) });
            }
            pill(ctx, '③ RAYO CERCANO AL SUELO → campo electromagnético induce voltaje', w * 0.5, 22, {
              color: PAL.surgeBright,
              dark: true,
              align: 'center',
            });
          }

          pill(ctx, `I = ${fmt(p.i, 0)} kA · r_c = ${fmt(d.rc, 0)} m · ~${fmt(d.flashes, 0)} rayos/año`, 12, h - 16, {
            color: '#E6F1FC',
            dark: true,
            mono: true,
            size: 9.8,
          });
        }}
        footer={
          <>
            <strong>Los 3 caminos se turnan en pantalla:</strong> observa cómo ① golpea el cable azul, ② golpea la torre y salta en rojo por los aisladores, y ③ cae en tierra induciendo ondas.
          </>
        }
      />
    );
  },
  plot: ({ p, d }) => {
    const pts: [number, number][] = linspace(2, 200, 200).map((x) => [x, lognormalExceed(x, p.pol === 0 ? 'negativa' : 'positiva') * 100]);
    return (
      <Plot
        xDomain={[2, 200]}
        yDomain={[0, 100]}
        xLog
        xLabel="Corriente máxima del rayo I (kA — escala logarítmica)"
        yLabel="% de rayos que superan ese valor"
        bands={[{ y1: 0, y2: 5, color: 'rgba(13, 138, 89, 0.10)', label: 'Zona de baja excedencia (≤ 5 %)', textColor: '#0A6E47' }]}
        series={[{ pts, color: PAL.surge, width: 2.4, area: true, label: 'Probabilidad P(I > valor)' }]}
        refs={[{ at: 5, label: 'Meta 5 % (cubre el 95 % de rayos)', color: PAL.ok }]}
        markers={[{ x: p.i, y: d.exceed * 100, color: PAL.warn, label: `${fmt(p.i, 0)} kA (${fmt(d.exceed * 100, 1)} %)` }]}
        caption="Excedencia lognormal (lámina 25). En negativas la mediana es 29,96 kA y el 5 % de excedencia queda en ≈ 87 kA; el valor representativo de la lámina 29 es 31 kA / 2 µs / 50 µs / 4 descargas."
      />
    );
  },
};

/* =============================== e05 =============================== */

const E05_STEPS: [number, number][] = [
  [1e-7, 6.4], [1e-4, 6.4], [1e-4, 3.9], [1e-2, 3.9], [1e-2, 1.5], [1e1, 1.5], [1e1, 1.3], [1e3, 1.3],
];

const e05puAt = (t: number): number => {
  if (t <= 1e-4) return 6.4;
  if (t <= 1e-2) return 3.9;
  if (t <= 1e1) return 1.5;
  return 1.3;
};

const e05Zone = (t: number): 'atmosférica' | 'maniobra' | 'temporal' => {
  if (t <= 20e-6) return 'atmosférica';
  if (t <= 5e-3) return 'maniobra';
  return 'temporal';
};

const e05: Experiment = {
  id: 'e05',
  topicId: 4,
  contextLabel: 'Tensión DC, AC e impulso',
  title: 'Ruptura en gases: DC, AC e impulso',
  tagline: 'El mismo espacio de aire se rompe distinto según cómo se le aplique la tensión',
  why: 'Distinguir los tres regímenes de ruptura descritos en las láminas 34–36 y entender por qué la duración de la tensión forma parte de la soportabilidad.',
  params: [
    {
      id: 'tlog',
      group: 'Visualización V–t',
      label: 'Tiempo de la tensión aplicada (log₁₀ t)',
      unit: 's',
      min: -7,
      max: 3.5,
      step: 0.25,
      def: -4,
      help: 't = 10^(valor). −6 ≈ 1 µs (frente de rayo) · −3,6 ≈ 250 µs (frente de maniobra) · 0 ≈ 1 s (temporal).',
    },
  ],
  presets: [
    {
      id: 'rayo',
      label: 'Impulso tipo rayo (t ≈ 1 µs)',
      note: 'Frente rápido 0,1–20 µs (lámina 6). La ruptura queda gobernada por t_s + t_f (lámina 36); onda 1,2/50 µs.',
      values: { tlog: -6 },
    },
    {
      id: 'maniobra',
      label: 'Impulso de maniobra (t ≈ 250 µs)',
      note: 'Frente lento 20–5000 µs (lámina 6), frecuencias de 2–20 kHz (lámina 5); onda 250/2500 µs (lámina 36).',
      values: { tlog: -3.6 },
    },
    {
      id: 'temporal',
      label: 'Temporal a frecuencia de red (t ≈ 1 s)',
      note: 'Frecuencia igual o próxima a la de operación, de ms a segundos (lámina 5). Se evalúa en kV eficaces.',
      values: { tlog: 0 },
    },
  ],
  compute: (p) => {
    const t = Math.pow(10, p.tlog);
    const pu = e05puAt(t);
    const zone = e05Zone(t);
    return { t, pu, zoneNumeric: zone === 'atmosférica' ? 0 : zone === 'maniobra' ? 1 : 2 };
  },
  liveStatus: (_p, d) => {
    const zone = e05Zone(d.t);
    if (zone === 'atmosférica') {
      return {
        tone: 'warn',
        badge: 'FRENTE RÁPIDO · Onda 1,2/50 µs',
        message: `t = ${fmt(d.t * 1e6, 2)} µs: ruptura gobernada por los retardos t_s y t_f (lámina 36). Ensayo: impulso tipo rayo en kV de cresta.`,
      };
    }
    if (zone === 'maniobra') {
      return {
        tone: 'ok',
        badge: 'FRENTE LENTO · Onda 250/2500 µs',
        message: `t = ${d.t < 1e-3 ? `${fmt(d.t * 1e6, 0)} µs` : `${fmt(d.t * 1e3, 1)} ms`}: sobretensión de maniobra, 2–20 kHz (lámina 5). Ensayo: impulso de maniobra en kV de cresta.`,
      };
    }
    return {
      tone: 'bad',
      badge: 'TEMPORAL · Frecuencia de red',
      message: `t = ${d.t >= 100 ? fmt(d.t, 0) : fmt(d.t, 2)} s: tensión de frecuencia industrial sostenida (lámina 5). Se evalúa en kV eficaces y con su duración, no con impulsos.`,
    };
  },
  readings: (d, p) => {
    const zone = e05Zone(d.t);
    const test =
      zone === 'atmosférica'
        ? 'Impulso tipo rayo 1,2/50 µs (kV cresta)'
        : zone === 'maniobra'
          ? 'Impulso de maniobra 250/2500 µs (kV cresta)'
          : 'Frecuencia industrial (kV eficaces)';
    return [
      { label: 'Tiempo aplicado', value: d.t < 1e-3 ? `${fmt(d.t * 1e6, 2)} µs` : d.t < 1 ? `${fmt(d.t * 1e3, 1)} ms` : `${fmt(d.t, 2)} s`, sub: `t = 10^${fmt(p.tlog, 2)} s` },
      { label: 'Familia por duración (láminas 5–6)', value: zone, sub: zone === 'atmosférica' ? 'frente rápido, 0,1–20 µs' : zone === 'maniobra' ? 'frente lento, 20–5000 µs' : 'ms–s, frecuencia de red' },
      { label: 'Nivel típico en la curva V–t (lámina 12)', value: `${fmt(d.pu, 1)} p.u.`, sub: 'meseta aproximada de la figura' , tone: 'warn' },
      { label: 'Ensayo de laboratorio', value: test, sub: 'misma forma y misma unidad, siempre' },
      {
        label: 'Mecanismo (láminas 34–36)',
        value: zone === 'temporal' ? 'AC / DC sostenido' : 'impulso',
        sub: zone === 'temporal' ? 'AC: iones oscilan sin cruzar; DC: carga espacial estacionaria' : 't_s (espera del electrón iniciador) + t_f (propagación del streamer)',
      },
    ];
  },
  equations: (p, d) => [
    `t = 10^${fmt(p.tlog, 2)} s = ${d.t < 1e-3 ? `${fmt(d.t * 1e6, 2)} µs` : d.t < 1 ? `${fmt(d.t * 1e3, 1)} ms` : `${fmt(d.t, 2)} s`}`,
    `Nivel V–t (figura de la lámina 12): ${fmt(d.pu, 1)} p.u.`,
    'DC: las cargas migran ordenadas → régimen estacionario de carga espacial (lámina 34).',
    'AC: los iones lentos oscilan sin cruzar el entrehierro (lámina 35).',
    'Impulso: t_s (estadístico: espera del electrón libre) + t_f (formativo: propagación del streamer) gobiernan la ruptura (lámina 36).',
  ],
  checks: () => [
    { label: 'Se declaran frecuencia y duración, no solo el pico', ok: true, detail: 'láminas 3–6' },
    { label: 'Impulsos en kV de cresta; temporales en kV eficaces', ok: true, detail: 'misma regla para todas las comparaciones' },
    { label: 'La ruptura por impulso considera t_s y t_f', ok: true, detail: 'no basta el valor instantáneo' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Lleva el cursor a la zona de impulsos rápidos (t ≤ 20 µs)',
      tip: 'Baja log₁₀ t hasta −4,7 o menos (usa el escenario «Impulso tipo rayo»).',
      test: (_p, d) => d.t <= 20e-6,
      detail: (_p, d) => `t = ${fmt(d.t * 1e6, 2)} µs`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Investiga la meseta temporal: llega a t ≥ 100 s',
      tip: 'Sube log₁₀ t por encima de 2 (por ejemplo 2,25 ≈ 178 s).',
      test: (_p, d) => d.t >= 100,
      detail: (_p, d) => `t = ${fmt(d.t, 1)} s`,
    },
  ],
  quiz: {
    question: '¿Por qué un aislamiento puede soportar un pico de 900 kV en impulso 1,2/50 µs y aun así romper a 500 kV en DC?',
    options: [
      { id: 'a', label: 'Porque en DC las cargas tienen tiempo de migrar y formar un canal estable; en el impulso, la ruptura necesita t_s + t_f que pueden superar la duración del frente.' },
      { id: 'b', label: 'Porque el impulso siempre es de menor voltaje que la DC.' },
      { id: 'c', label: 'Porque el aire se comporta como conductor perfecto en DC.' },
      { id: 'd', label: 'No puede ocurrir: la ruptura solo depende del valor pico.' },
    ],
    correct: 'a',
    explanation:
      'En DC se establece un régimen estacionario de carga espacial (lámina 34); en AC los iones oscilan sin cruzar (lámina 35). En impulso, la ruptura queda gobernada por t_s (espera del electrón iniciador) y t_f (propagación del streamer): si el pico pasa antes de t_s + t_f, el aislamiento soporta un voltaje mucho mayor que en estado estacionario (lámina 36).',
  },
  learn: {
    analogy:
      'Es como empujar una puerta con un golpe seco o apoyarse sobre ella varios segundos: el golpe (impulso) puede ser enorme en fuerza durante un instante sin moverla; el peso sostenido (temporal) la vence con menos fuerza pero durante mucho tiempo.',
    phenomenon:
      'Ante DC, las cargas espaciales migran de forma ordenada y continua hacia los electrodos opuestos, estableciendo un régimen estacionario (lámina 34). Ante AC, la inversión de cada medio ciclo impide que los iones positivos lentos crucen el espacio y quedan oscilando (lámina 35). Ante un impulso de microsegundos, la ruptura queda gobernada por el tiempo estadístico t_s y el tiempo formativo t_f (lámina 36).',
    objective:
      'Leer una curva V–t, reconocer las tres familias de sobretensión y relacionar la unidad de ensayo correcta con cada una.',
    watch: [
      'Mueve el control de tiempo desde µs hasta segundos y mira cómo cambia la familia: rayo → maniobra → temporal.',
      'En la gráfica, baja hasta la meseta de atmosféricas (≈ 6,4 p.u.) y sube hasta la de temporales (≈ 1,5 p.u.).',
      'En la escena, las tres ondas de prueba se dibujan a la misma escala; la zona activa se ilumina.',
    ],
    misconception:
      'Evaluar una sobretensión solo por su pico: la misma altura de 3 p.u. puede significar cosas distintas según la duración, y el aire responde distinto a un impulso y a una tensión sostenida.',
    model: 'Clasificación por duración y frecuencia según las láminas 5–6 y curva V–t cualitativa según la figura de la lámina 12. Las tolerancias del ensayo corresponden a la norma de técnicas de ensayo, fuera del alcance de las láminas; para U₅₀ y dispersión ver e06.',
  },
  sources: ['expo39'],
  scene: ({ d, t }) => {
    const zone = e05Zone(d.t);
    const lanes: { name: string; sub: string; color: string; draw: (ctx: CanvasRenderingContext2D, x: number, y: number, w: number) => void }[] = [
      {
        name: 'RAYO',
        sub: '1,2/50 µs · cresta',
        color: zone === 'atmosférica' ? PAL.surgeBright : 'rgba(140,155,175,0.5)',
        draw: (ctx, x, y, w) => {
          ctx.save();
          ctx.strokeStyle = zone === 'atmosférica' ? PAL.surgeBright : 'rgba(140,155,175,0.55)';
          ctx.lineWidth = zone === 'atmosférica' ? 3 : 1.6;
          ctx.beginPath();
          for (let i = 0; i <= 200; i++) {
            const u = i / 200;
            const xx = x + u * w;
            const yy = y - impulseShape(u * 260, 0.41, 66) * 44;
            if (i === 0) ctx.moveTo(xx, yy);
            else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
          ctx.restore();
        },
      },
      {
        name: 'MANIOBRA',
        sub: '250/2500 µs · cresta',
        color: zone === 'maniobra' ? PAL.warnBright : 'rgba(140,155,175,0.5)',
        draw: (ctx, x, y, w) => {
          ctx.save();
          ctx.strokeStyle = zone === 'maniobra' ? PAL.warnBright : 'rgba(140,155,175,0.55)';
          ctx.lineWidth = zone === 'maniobra' ? 3 : 1.6;
          ctx.beginPath();
          for (let i = 0; i <= 200; i++) {
            const u = i / 200;
            const xx = x + u * w;
            const yy = y - impulseShape(u * 300, 30, 2600) * 44;
            if (i === 0) ctx.moveTo(xx, yy);
            else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
          ctx.restore();
        },
      },
      {
        name: 'TEMPORAL',
        sub: 'frecuencia industrial · eficaces',
        color: zone === 'temporal' ? PAL.badBright : 'rgba(140,155,175,0.5)',
        draw: (ctx, x, y, w) => {
          ctx.save();
          ctx.strokeStyle = zone === 'temporal' ? PAL.badBright : 'rgba(140,155,175,0.55)';
          ctx.lineWidth = zone === 'temporal' ? 3 : 1.6;
          ctx.beginPath();
          for (let i = 0; i <= 260; i++) {
            const u = i / 260;
            const xx = x + u * w;
            const yy = y - Math.sin(u * Math.PI * 5 - t * 2.5) * 40;
            if (i === 0) ctx.moveTo(xx, yy);
            else ctx.lineTo(xx, yy);
          }
          ctx.stroke();
          ctx.restore();
        },
      },
    ];
    return (
      <SceneCanvas
        legend={[
          { color: PAL.surgeBright, label: 'Rayo 1,2/50 µs' },
          { color: PAL.warnBright, label: 'Maniobra 250/2500 µs' },
          { color: PAL.badBright, label: 'Temporal (frecuencia de red)' },
        ]}
        draw={(ctx, w, h) => {
          environment(ctx, w, h, { mood: 'lab' });
          sceneHeader(ctx, 'Las tres ondas de prueba, a la misma escala', 'La franja iluminada corresponde a la familia activa');
          const lx = w * 0.08;
          const lw = w * 0.84;
          const laneH = (h - 70) / 3;
          lanes.forEach((lane, i) => {
            const yTop = 46 + i * laneH;
            const active =
              (i === 0 && zone === 'atmosférica') || (i === 1 && zone === 'maniobra') || (i === 2 && zone === 'temporal');
            ctx.save();
            ctx.fillStyle = active ? 'rgba(11, 99, 206, 0.06)' : 'rgba(255,255,255,0.55)';
            ctx.strokeStyle = active ? lane.color : '#CBD5E1';
            ctx.lineWidth = active ? 2 : 1.2;
            ctx.beginPath();
            ctx.roundRect(lx - 6, yTop, lw + 12, laneH - 12, 12);
            ctx.fill();
            ctx.stroke();
            ctx.restore();
            text(ctx, lane.name, lx + 6, yTop + 18, { size: 12, weight: 800, color: active ? '#0B3B66' : PAL.muted, mono: true });
            text(ctx, lane.sub, lx + 6, yTop + 34, { size: 9, color: PAL.muted });
            const waveX = lx + lw * 0.22;
            const waveW = lw * 0.72;
            const waveY = yTop + laneH * 0.62;
            line(ctx, waveX - 8, waveY, waveX + waveW + 8, waveY, { color: 'rgba(78,99,120,0.25)', width: 1 });
            lane.draw(ctx, waveX, waveY, waveW);
            if (active) pill(ctx, 'ACTIVA', lx + lw - 4, yTop + 18, { color: lane.color, align: 'right', mono: true, size: 9.5 });
          });
        }}
        footer={
          <>
            <strong>Las tres ondas existen en el laboratorio:</strong> el simulador las agrupa porque cada una prueba cosas distintas. Abajo mueves el tiempo y la curva V–t dice qué soportada corresponde.
          </>
        }
      />
    );
  },
  plot: ({ d }) => (
    <Plot
      xDomain={[1e-7, 1e3]}
      yDomain={[0.8, 7]}
      xLog
      xLabel="Tiempo t (s — escala logarítmica)"
      yLabel="V (p.u.)"
      series={[{ pts: E05_STEPS, color: PAL.surge, width: 2.6, steps: true, label: 'Clasificación por amplitud y duración (lámina 12)' }]}
      refs={[{ at: 1, label: '1,0 p.u. (operación continua)', color: PAL.phase, dash: '3 4' }]}
      markers={[{ x: d.t, y: d.pu, color: PAL.warn, label: `Tu punto: ${fmt(d.pu, 1)} p.u.` }]}
      caption="Mesetas según la figura de la lámina 12: atmosféricas ≈ 6,4 p.u. hasta ~10⁻⁴ s · maniobras ≈ 3,9 p.u. (10⁻⁵–10⁻² s) · temporales ≈ 1,5 p.u. (hasta ~10 s) y después ≈ 1,3."
    />
  ),
};

/* =============================== e06 =============================== */

const e06: Experiment = {
  id: 'e06',
  topicId: 4,
  contextLabel: '¿Por qué U₅₀ falla la mitad de las veces?',
  title: 'U₅₀ (CFO) no es un voltaje seguro: probabilidad de falla',
  tagline: 'Dispara 40 impulsos iguales en el laboratorio y cuenta cuántos aguantan y cuántos rompen',
  why: 'Entender de forma visual qué significa U₅₀ (o CFO) y cuánto hay que bajar el voltaje para que el riesgo de falla sea del 10 % o del 1 %.',
  params: [
    {
      id: 'u50',
      label: 'Tensión crítica al 50 % (U₅₀ o CFO)',
      unit: 'kV',
      min: 400,
      max: 1600,
      step: 5,
      def: 700,
      help: 'Con este voltaje exacto fallan 20 de cada 40 disparos.',
    },
    {
      id: 'sigma',
      label: 'Dispersión del aislamiento (σ)',
      unit: '% de U₅₀',
      min: 2,
      max: 15,
      step: 0.5,
      def: 6,
      help: 'Típico: 6 % para maniobra y 3 % para impulso tipo rayo.',
    },
    {
      id: 'ptarget',
      label: 'Riesgo máximo deseado (P objetivo)',
      unit: '%',
      min: 1,
      max: 50,
      step: 0.5,
      def: 10,
      help: 'Calcula qué voltaje corresponde a esa probabilidad de falla.',
    },
    {
      id: 'uapp',
      label: 'Voltaje que disparas en el ensayo',
      unit: 'kV',
      min: 300,
      max: 1800,
      step: 5,
      def: 650,
      help: 'Súbelo a 700 kV para ver fallar la mitad; bájalo a 600 kV para ver fallar casi ninguno.',
    },
  ],
  presets: [
    {
      id: 'curso',
      label: 'Ejemplo de clase (U₅₀=700 kV, σ=6 %, P=10 %)',
      note: 'Para bajar el riesgo del 50 % al 10 %, el voltaje debe bajar de 700 kV a 646,2 kV (~4 fallas en 40 disparos).',
      values: { u50: 700, sigma: 6, ptarget: 10, uapp: 646 },
    },
    {
      id: 'riesgo1',
      label: 'Diseño seguro al 1 % (U₅₀=700 kV → 600 kV)',
      note: 'Bajando el voltaje aplicado a 600 kV (2,38 σ debajo de U₅₀), menos de 1 de cada 100 disparos produce arco.',
      values: { u50: 700, sigma: 6, ptarget: 1, uapp: 600 },
    },
    {
      id: 'alta',
      label: 'Prototipo con más dispersión (σ = 10 %)',
      note: 'ilustración didáctica: con más dispersión, la curva se achata y el riesgo a un mismo voltaje aplicado sube.',
      values: { u50: 700, sigma: 10, ptarget: 10, uapp: 646 },
    },
  ],
  compute: (p) => {
    const sigma = (p.sigma / 100) * p.u50;
    const z = normalQuantile(p.ptarget / 100);
    const up = p.u50 + z * sigma;
    const pApplied = normalCdf(p.uapp, p.u50, sigma);
    return { sigma, z, up, pApplied, p50: 0.5, margin: (p.u50 - p.uapp) / Math.max(1, sigma) };
  },
  liveStatus: (p, d) => {
    const pct = d.pApplied * 100;
    const expected40 = Math.round(d.pApplied * 40);
    if (pct <= 2) {
      return {
        tone: 'ok',
        badge: `✓ RIESGO MUY BAJO · ${fmt(pct, 2)} % de falla`,
        message: `Disparando ${fmt(p.uapp, 0)} kV (frente a U₅₀ = ${fmt(p.u50, 0)} kV), casi los 40 ensayos aguantan sin arco.`,
      };
    }
    if (pct <= 15) {
      return {
        tone: 'warn',
        badge: `RIESGO CONTROLADO · ${fmt(pct, 1)} % (~${expected40} de 40 fallan)`,
        message: `A ${fmt(p.uapp, 0)} kV estás ${fmt(d.margin, 1)} desviaciones debajo de U₅₀. Para P = ${fmt(p.ptarget, 0)} % el voltaje es ${fmt(d.up, 1)} kV.`,
      };
    }
    return {
      tone: 'bad',
      badge: `✕ RIESGO ALTO · ${fmt(pct, 1)} % (~${expected40} de 40 fallan)`,
      message: `A ${fmt(p.uapp, 0)} kV estás demasiado cerca o por encima de U₅₀ (${fmt(p.u50, 0)} kV): fallan muchos disparos.`,
    };
  },
  readings: (d, p) => [
    { label: `Tensión para P = ${fmt(p.ptarget, 1)} %`, value: `${fmt(d.up, 1)} kV`, sub: 'de cresta (U₅₀ + z·σ)', tone: 'warn' },
    {
      label: 'Riesgo al voltaje disparado',
      value: `${fmt(d.pApplied * 100, 2)} %`,
      sub: `con ${fmt(p.uapp, 0)} kV aplicados`,
      tone: d.pApplied <= 0.1 ? 'ok' : d.pApplied < 0.5 ? 'warn' : 'bad',
    },
    { label: 'Desviación estándar σ', value: `${fmt(d.sigma, 1)} kV`, sub: `${fmt(p.sigma, 1)} % de ${fmt(p.u50, 0)} kV` },
    { label: 'Factor z (desviaciones)', value: fmt(d.z, 3), sub: `corresponde a P = ${fmt(p.ptarget, 1)} %` },
    { label: 'Holgura bajo U₅₀', value: `${fmt(d.margin, 2)} σ`, sub: 'más σ = mucho menos riesgo' },
  ],
  equations: (p, d) => [
    `Desviación en kV: σ = ${fmt(p.sigma, 1)} % × ${fmt(p.u50, 0)} = ${fmt(d.sigma, 1)} kV`,
    `Voltaje para ${fmt(p.ptarget, 1)} % de falla: U_p = ${fmt(p.u50, 0)} + (${fmt(d.z, 3)}) × ${fmt(d.sigma, 1)} = ${fmt(d.up, 1)} kV`,
    `Probabilidad al disparar ${fmt(p.uapp, 0)} kV: Φ((${fmt(p.uapp, 0)} − ${fmt(p.u50, 0)}) / ${fmt(d.sigma, 1)}) = ${fmt(d.pApplied * 100, 2)} %`,
    'En aislamiento externo (aire) se trabaja con una probabilidad de falla pequeña (ej. 1 %–10 %), nunca pensando que U₅₀ protege al 100 %.',
  ],
  checks: (p, d) => [
    {
      label: 'El voltaje aplicado queda por debajo de U₅₀',
      ok: p.uapp < p.u50,
      detail: `riesgo actual: ${fmt(d.pApplied * 100, 2)} %`,
    },
    { label: 'Se declara la dispersión σ según el tipo de onda', ok: true, detail: `σ = ${fmt(p.sigma, 1)} % (${fmt(d.sigma, 1)} kV)` },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Reproduce el cálculo de clase: U₅₀ = 700 kV, σ = 6 % y P = 10 % → U₁₀ = 646,2 kV',
      tip: 'Usa el escenario «Ejemplo de clase (U₅₀=700 kV, σ=6 %, P=10 %)».',
      test: (_p, d) => Math.abs(d.up - 646.17) <= 1.5,
      detail: (_p, d) => `U_p = ${fmt(d.up, 1)} kV (meta: 646,2 kV)`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Con U₅₀ = 700 kV y σ = 6 %, baja el voltaje disparado hasta lograr riesgo ≤ 1 %',
      tip: 'Baja el control «Voltaje que disparas» a 600 kV o menos (y luego vuelve a poner P = 10 % si cambió).',
      test: (p, d) => Math.abs(p.u50 - 700) < 1 && Math.abs(p.sigma - 6) < 0.1 && d.pApplied <= 0.01,
      detail: (p, d) => `riesgo = ${fmt(d.pApplied * 100, 2)} % a ${fmt(p.uapp, 0)} kV`,
    },
  ],
  learn: {
    analogy:
      'Si una cuerda dice «resistencia media 700 kg», al colgarle exactamente 700 kg la mitad de las cuerdas se rompe. Nadie sube un ascensor con 700 kg ahí: te bajas a 600 kg para que casi ninguna falle. Eso mismo es U₅₀ frente al voltaje soportado.',
    phenomenon:
      'Si aplicas 40 veces exactamente el mismo impulso de voltaje a una cadena de aisladores en aire, unas veces soporta y otras salta arco por pequeñas variaciones aleatorias de la ionización. La campana gaussiana (curva S acumulada) describe ese porcentaje.',
    objective:
      'Interpretar U₅₀/CFO sin confundirlo con una garantía, calcular el voltaje para un riesgo dado (como 10 % → 646,2 kV) y ver cómo unas pocas decenas de kV menos desploman el riesgo.',
    watch: [
      'Pon «Voltaje que disparas» en 700 kV (= U₅₀): verás que en el tablero de 40 disparos cerca de 20 bombillos se encienden en rojo.',
      'Bájalo a 646 kV: ahora solo ~4 de los 40 disparos fallan (10 %). Bájalo a 600 kV: prácticamente los 40 quedan en verde.',
      'En la curva en S, mira lo rápido que cae el porcentaje de falla al moverte hacia la cola izquierda.',
    ],
    misconception: 'Decir «la cadena soporta 700 kV porque su CFO es 700 kV». Con 700 kV fallaría la mitad de las maniobras.',
    model: 'Distribución normal acumulada con desviación σ porcentual constante.',
  },
  sources: ['expo77', 'expo39'],
  scene: ({ p, d, t }) => {
    const prob = d.pApplied;
    const trials = 40;
    const seed = (n: number) => {
      const v = Math.sin((n + 1) * 12.9898 + 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    const idx = Math.floor(t * 2.5) % trials;
    const thisFails = seed(idx) < prob;
    let fails = 0;
    for (let i = 0; i <= idx; i++) if (seed(i) < prob) fails++;

    return (
      <SceneCanvas
        legend={[
          { color: PAL.ok, label: 'Disparo soportado (sin arco)' },
          { color: PAL.bad, label: 'Disparo con disrupción (saltó arco)' },
        ]}
        draw={(ctx, w, h) => {
          environment(ctx, w, h, { mood: 'lab' });
          sceneHeader(ctx, 'Banco de 40 disparos de impulso', `Disparando ${fmt(p.uapp, 0)} kV sobre cadena de U₅₀ = ${fmt(p.u50, 0)} kV`);

          // Izquierda: Pórtico con cadena de aisladores bajo prueba
          const gx = w * 0.23;
          const topY = h * 0.26;
          const len = h * 0.44;
          line(ctx, gx - 58, topY, gx + 58, topY, { color: PAL.steel, width: 5 });
          line(ctx, gx - 52, topY, gx - 52, h * 0.88, { color: PAL.steel, width: 3.5 });
          const end = insulatorString(ctx, gx, topY, 9, len, 0, {
            discRadius: 14,
            flashover: thisFails,
            t: t * 5,
          });
          circle(ctx, end.endX, end.endY + 5, 6, { fill: PAL.phase, stroke: '#FFFFFF', width: 1.5 });
          pill(ctx, thisFails ? `Disparo #${idx + 1}: ✕ ARCO` : `Disparo #${idx + 1}: ✓ SOPORTÓ`, gx, h * 0.84, {
            color: thisFails ? PAL.bad : PAL.ok,
            align: 'center',
            mono: true,
          });

          // Derecha: Tablero visual de 40 ensayos (8 columnas × 5 filas)
          const bx = w * 0.46;
          const by = h * 0.2;
          const bw = w * 0.49;
          const bh = h * 0.68;
          ctx.save();
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#CBD5E1';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.roundRect(bx, by, bw, bh, 12);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          text(ctx, `REGISTRO DE ENSAYOS (P teórica = ${fmt(prob * 100, 1)} %)`, bx + 14, by + 20, {
            size: 10,
            weight: 700,
            color: PAL.inkSoft,
          });

          const cols = 8;
          const rows = 5;
          const cellW = (bw - 28) / cols;
          const cellH = (bh - 74) / rows;
          for (let i = 0; i < trials; i++) {
            const c = i % cols;
            const r = Math.floor(i / cols);
            const cx = bx + 14 + cellW * (c + 0.5);
            const cy = by + 40 + cellH * (r + 0.5);
            const done = i <= idx;
            const bad = done && seed(i) < prob;
            circle(ctx, cx, cy, Math.min(cellW, cellH) * 0.34, {
              fill: !done ? '#E2E8F0' : bad ? PAL.bad : PAL.ok,
              stroke: i === idx ? PAL.ink : undefined,
              width: 2,
            });
          }

          text(ctx, `Soportaron: ${idx + 1 - fails}`, bx + 14, by + bh - 16, { size: 11, weight: 700, color: PAL.ok, mono: true });
          text(ctx, `Fallaron: ${fails} de ${idx + 1}`, bx + bw - 14, by + bh - 16, {
            size: 11,
            weight: 700,
            color: fails > 0 ? PAL.bad : PAL.muted,
            align: 'right',
            mono: true,
          });
        }}
        footer={
          <>
            <strong>Mira el tablero de 40 ensayos:</strong> cada círculo es un impulso idéntico de <strong>{fmt(p.uapp, 0)} kV</strong>. Verde significa que la cadena aisló; rojo significa que saltó arco.
          </>
        }
      />
    );
  },
  plot: ({ p, d }) => {
    const sigma = d.sigma;
    const pts: [number, number][] = linspace(p.u50 - 3.8 * sigma, p.u50 + 3.5 * sigma, 220).map((x) => [x, normalCdf(x, p.u50, sigma) * 100]);
    return (
      <Plot
        xDomain={[p.u50 - 3.8 * sigma, p.u50 + 3.5 * sigma]}
        yDomain={[0, 100]}
        xLabel="Voltaje de cresta disparado (kV)"
        yLabel="Probabilidad de que salte arco (%)"
        bands={[{ y1: 0, y2: 10, color: 'rgba(13, 138, 89, 0.09)', label: 'Cola segura (≤ 10 %)', textColor: '#0A6E47' }]}
        series={[{ pts, color: PAL.phase, width: 2.4, area: true, label: `Curva de falla (U₅₀=${fmt(p.u50, 0)}, σ=${fmt(p.sigma, 1)} %)` }]}
        refs={[
          { at: 50, label: `U₅₀ = ${fmt(p.u50, 0)} kV (falla el 50 %)`, color: PAL.bad },
          { at: p.ptarget, label: `Meta ${fmt(p.ptarget, 0)} % → ${fmt(d.up, 1)} kV`, color: PAL.ok, dash: '3 4' },
        ]}
        markers={[{ x: p.uapp, y: d.pApplied * 100, color: PAL.warn, label: `${fmt(p.uapp, 0)} kV (${fmt(d.pApplied * 100, 1)} %)` }]}
        caption={`Cada desviación σ vale ${fmt(sigma, 1)} kV. Bajar 1,28·σ por debajo de U₅₀ deja el riesgo en 10 %; bajar 2,33·σ lo deja en 1 %.`}
      />
    );
  },
};

export const lightningExperiments: Experiment[] = [e04, e05, e06];
