import { fmt, linspace, normalCdf, normalQuantile } from '../../lib/num';
import { PAL, circle, dimension, electricArc, environment, glow, insulatorString, latticeTower, line, pill, sceneHeader, stormCloud, text } from '../../lib/draw';
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
      help: '31 kA es la mediana: la mitad de los rayos son menores y la mitad mayores.',
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
      help: 'Colombia tiene zonas de muy alta actividad ceráunica (5 a 20+ rayos/km²·año).',
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
  ],
  presets: [
    {
      id: 'mediana',
      label: 'Rayo mediano típico (31 kA)',
      note: 'El 50 % de los rayos supera los 31 kA. Distancia de atracción r_c ≈ 93 m.',
      values: { i: 31, didt: 30, gfd: 5, largo: 100, h: 40 },
    },
    {
      id: 'severa',
      label: 'Rayo extremo (100 kA, 80 kA/µs)',
      note: 'Muy poco frecuente (~3,6 % de probabilidad), pero con enorme distancia de captura (~200 m) y gran efecto inductivo.',
      values: { i: 100, didt: 80, gfd: 5, largo: 100, h: 40 },
    },
    {
      id: 'debil',
      label: 'Rayo pequeño (10 kA)',
      note: 'Casi el 96 % de los rayos lo supera, pero por tener r_c pequeño (45 m) es el que más fácil burla al cable de guarda.',
      values: { i: 10, didt: 12, gfd: 5, largo: 100, h: 40 },
    },
  ],
  compute: (p) => {
    const median = 31;
    const sigmaLn = 0.65;
    const exceed = 1 - normalCdf(Math.log(p.i / median) / sigmaLn);
    const rc = 10 * Math.pow(p.i, 0.65);
    const anchoKm = (28 * Math.pow(p.h, 0.6)) / 1000;
    const flashes = p.gfd * anchoKm * p.largo;
    return { exceed, rc, anchoKm, flashes, lDidt: p.didt };
  },
  liveStatus: (p, d) => ({
    tone: d.exceed <= 0.05 ? 'ok' : d.exceed <= 0.25 ? 'warn' : 'info',
    badge: `I = ${fmt(p.i, 0)} kA · Solo ${fmt(d.exceed * 100, 1)} % de rayos la supera`,
    message: `Esta línea de ${fmt(p.largo, 0)} km recibe ~${fmt(d.flashes, 0)} impactos/año. Un rayo de ${fmt(p.i, 0)} kA «elige» objetivo desde r_c = ${fmt(d.rc, 0)} m.`,
  }),
  readings: (d, p) => [
    {
      label: 'Rayos que superan esta corriente',
      value: `${fmt(d.exceed * 100, 1)} %`,
      sub: 'curva lognormal (mediana 31 kA)',
      tone: d.exceed <= 0.05 ? 'ok' : d.exceed < 0.2 ? 'warn' : 'bad',
    },
    { label: 'Distancia de choque r_c', value: `${fmt(d.rc, 1)} m`, sub: 'radio de atracción 10·I^0,65' },
    { label: 'Efecto inductivo por µH', value: `${fmt(p.didt, 0)} kV/µH`, sub: 'voltaje extra en torres y bajantes' },
    { label: 'Impactos esperados en la línea', value: `${fmt(d.flashes, 0)} /año`, sub: `franja de captura de ${fmt(d.anchoKm * 1000, 0)} m de ancho` },
  ],
  equations: (p, d) => [
    `Probabilidad de exceder I: P(I > ${fmt(p.i, 0)} kA) = 1 − Φ(ln(${fmt(p.i, 0)}/31) / 0,65) = ${fmt(d.exceed * 100, 1)} %`,
    `Distancia de atracción: r_c = 10 · ${fmt(p.i, 0)}^0,65 = ${fmt(d.rc, 1)} m`,
    `Impactos anuales: N ≈ ${fmt(p.gfd, 1)} × (${fmt(d.anchoKm * 1000, 0)} m / 1000) × ${fmt(p.largo, 0)} km = ${fmt(d.flashes, 0)} rayos/año`,
    `Voltaje inductivo: L · di/dt = ${fmt(p.didt, 0)} kV por cada 1 µH de inductancia`,
  ],
  checks: () => [
    { label: 'La corriente de rayo se trata como probabilidad', ok: true, detail: 'diseñar para el 5 % cubre el 95 % de los rayos' },
    { label: 'Tres caminos separados: fase, guarda/torre y suelo vecino', ok: true, detail: 'cada uno se mitiga distinto' },
    { label: 'Importa tanto el pico (kA) como la rapidez di/dt (kA/µs)', ok: true, detail: 'di/dt eleva el potencial inductivo' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Sube la corriente de diseño hasta que solo el 5 % o menos de los rayos la supere',
      tip: 'Desliza la corriente I hacia arriba (~91 kA o más) o prueba «Rayo extremo (100 kA)».',
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
    model: 'Distribución lognormal (mediana 31 kA, σ_ln = 0,65) y r_c = 10·I^0,65 del modelo electrogeométrico del curso.',
  },
  sources: ['expo39', 'expo77', 'guion', 'slides', 'velasco', 'expo'],
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
    const pts: [number, number][] = linspace(2, 200, 200).map((x) => [x, (1 - normalCdf(Math.log(x / 31) / 0.65)) * 100]);
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
        caption="A 31 kA cae el 50 % de los rayos (mediana). Al subir hacia 90–100 kA, menos del 5 % de las descargas supera ese valor."
      />
    );
  },
};

/* =============================== e05 =============================== */

const e05: Experiment = {
  id: 'e05',
  topicId: 4,
  contextLabel: '¿Cuándo salta una chispa en el aire?',
  title: 'Avalancha de electrones: por qué se rompe el aire',
  tagline: 'Dos electrodos, moléculas de aire y la reacción en cadena que enciende un arco eléctrico',
  why: 'Ver físicamente cómo el campo eléctrico, la distancia y la altitud (densidad del aire) deciden si el aire aísla o deja saltar una chispa.',
  params: [
    {
      id: 'e',
      label: 'Campo eléctrico entre las placas (E)',
      unit: 'kV/cm',
      min: 10,
      max: 80,
      step: 0.5,
      def: 30,
      help: 'A nivel del mar, el aire empieza a ionizarse por encima de ~25 kV/cm y rompe cerca de 30 kV/cm en 1 cm.',
    },
    {
      id: 'd',
      label: 'Separación de aire entre electrodos (d)',
      unit: 'cm',
      min: 0.1,
      max: 20,
      step: 0.05,
      def: 1,
      help: 'Al separar los electrodos sube el voltaje U₀ que el espacio de aire logra sostener.',
    },
    {
      id: 'delta',
      label: 'Densidad relativa del aire (δ)',
      unit: '',
      min: 0.6,
      max: 1,
      step: 0.01,
      def: 1,
      help: 'δ = 1,00 en la costa (0 m, 20 °C) · δ = 0,74 en Bogotá (2.640 m, 14 °C).',
    },
  ],
  presets: [
    {
      id: 'std',
      label: 'Nivel del mar: 1 cm a 30 kV/cm',
      note: 'Caso clásico de referencia: 30 kV en 1 cm alcanza justo ~10⁸ electrones (rigidez U₀ ≈ 30 kV).',
      values: { e: 30, d: 1, delta: 1 },
    },
    {
      id: 'bogota',
      label: 'Mismo espacio en Bogotá (δ = 0,74)',
      note: 'Con menos moléculas de aire, 1 cm solo soporta U₀ ≈ 23,5 kV: ¡con 30 kV/cm salta la chispa de inmediato!',
      values: { e: 30, d: 1, delta: 0.74 },
    },
    {
      id: 'gap',
      label: 'Separación de 8 cm en la costa (sostiene 205 kV)',
      note: 'En aire estándar (δ = 1), unos 7,8–8,0 cm sostienen 200 kV. En Bogotá necesitarás más de 10,5 cm.',
      values: { e: 25, d: 8, delta: 1 },
    },
  ],
  compute: (p) => {
    const A = 3.7;
    const kStreamer = Math.log(1e8);
    const eCrit = 25 * p.delta;
    const alpha = A * (p.e - eCrit);
    const lnN = alpha * p.d;
    const logN = lnN / Math.LN10;
    const breakdown = lnN >= kStreamer - 1e-9;
    const u0 = Math.max(0, 25 * p.delta * p.d + kStreamer / A);
    const uApplied = p.e * p.d;
    return { eCrit, alpha, lnN, logN, breakdown: breakdown ? 1 : 0, u0, uApplied };
  },
  liveStatus: (p, d) => {
    if (d.breakdown) {
      return {
        tone: 'bad',
        badge: '✕ CHISPA / DESCARGA EN EL AIRE',
        message: `Aplicas ${fmt(d.uApplied, 1)} kV y esos ${fmt(p.d, 2)} cm de aire solo aguantan U₀ = ${fmt(d.u0, 1)} kV: la avalancha supera 10⁸ electrones y salta el arco.`,
      };
    }
    if (d.alpha > 0) {
      return {
        tone: 'warn',
        badge: 'PRECAUCIÓN · Avalancha incompleta (aún sostiene)',
        message: `Hay ionización (10^${fmt(Math.max(0, d.logN), 1)} electrones), pero no alcanza 10⁸: el espacio soporta hasta U₀ = ${fmt(d.u0, 1)} kV (aplicas ${fmt(d.uApplied, 1)} kV).`,
      };
    }
    return {
      tone: 'ok',
      badge: '✓ AIRE AISLANTE · Sostiene con holgura',
      message: `El campo (${fmt(p.e, 1)} kV/cm) está por debajo del umbral ${fmt(d.eCrit, 1)} kV/cm. Esos ${fmt(p.d, 2)} cm aguantan U₀ = ${fmt(d.u0, 1)} kV.`,
    };
  },
  readings: (d, p) => [
    {
      label: 'Voltaje que aguanta el aire (U₀)',
      value: `${fmt(d.u0, 1)} kV`,
      sub: `para d = ${fmt(p.d, 2)} cm y δ = ${fmt(p.delta, 2)}`,
      tone: d.breakdown ? 'bad' : 'ok',
    },
    {
      label: 'Voltaje aplicado (E · d)',
      value: `${fmt(d.uApplied, 1)} kV`,
      sub: d.breakdown ? 'supera U₀ → salta arco' : 'menor que U₀ → aísla bien',
      tone: d.breakdown ? 'bad' : 'ok',
    },
    { label: 'Umbral de ionización (25·δ)', value: `${fmt(d.eCrit, 1)} kV/cm`, sub: `baja con la altitud (δ = ${fmt(p.delta, 2)})` },
    { label: 'Multiplicación de electrones', value: `10^${fmt(Math.max(0, d.logN), 1)}`, sub: 'salta arco al llegar a 10⁸' },
    { label: 'Coeficiente neto α − η', value: `${fmt(d.alpha, 2)} cm⁻¹`, sub: d.alpha > 0 ? 'ganan choques ionizantes' : 'el aire frena los electrones' },
  ],
  equations: (p, d) => [
    `Ionización neta: α − η = 3,7 · (E − 25·δ) = 3,7 × (${fmt(p.e, 1)} − ${fmt(d.eCrit, 1)}) = ${fmt(d.alpha, 2)} cm⁻¹`,
    `Tamaño de avalancha: n/n₀ = e^((α−η)·d) → log₁₀(n/n₀) = ${fmt(d.logN, 2)} (chispa si ≥ 8,0)`,
    `Voltaje de ruptura del aire: U₀ = 25·δ·d + 5,0 = ${fmt(25 * p.delta * p.d, 1)} + 5,0 = ${fmt(d.u0, 1)} kV`,
    `Comparación: U_aplicada = ${fmt(d.uApplied, 1)} kV frente a U₀ = ${fmt(d.u0, 1)} kV → ${d.breakdown ? 'DESCARGA' : 'SOSTIENE'}`,
  ],
  checks: (_p, d) => [
    { label: 'Condición para iniciar avalancha (α > η)', ok: d.alpha > 0, detail: `α − η = ${fmt(d.alpha, 2)} cm⁻¹` },
    { label: 'El aire resiste sin saltar arco (n < 10⁸)', ok: d.breakdown === 0, detail: d.breakdown ? 'se formó canal conductor' : 'sin canal conductor' },
    { label: 'En altura (δ menor) se necesitan más cm para el mismo voltaje', ok: true, detail: `umbral actual ${fmt(d.eCrit, 1)} kV/cm` },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Al nivel del mar (δ = 1,00), halla la distancia mínima que aguanta 200 kV (U₀ entre 200 y 212 kV)',
      tip: 'Pon δ = 1,00 y lleva la separación d cerca de 7,8–8,2 cm (o pulsa el tercer escenario).',
      test: (p, d) => Math.abs(p.delta - 1) < 0.02 && d.u0 >= 200 && d.u0 <= 212,
      detail: (p, d) => `U₀ = ${fmt(d.u0, 1)} kV con d = ${fmt(p.d, 2)} cm y δ = ${fmt(p.delta, 2)}`,
    },
    {
      id: 'g2',
      label: 'En Bogotá (δ = 0,74), separa más los electrodos hasta volver a aguantar 200 kV (U₀ entre 200 y 215 kV)',
      tip: 'Baja δ a 0,74 y aumenta la separación d hasta unos 10,6–11,2 cm: verás cuántos cm extra exige la altitud.',
      test: (p, d) => Math.abs(p.delta - 0.74) < 0.02 && d.u0 >= 200 && d.u0 <= 215,
      detail: (p, d) => `U₀ = ${fmt(d.u0, 1)} kV con d = ${fmt(p.d, 2)} cm y δ = ${fmt(p.delta, 2)}`,
    },
  ],
  learn: {
    analogy:
      'Imagina una ficha de dominó que golpea a 2, esas 2 a 4, esas 4 a 8… Un solo electrón libre acelerado por el voltaje choca con moléculas de aire y suelta más electrones. Cuando la bola de nieve llega a 100 millones (10⁸), el aire se vuelve un cable luminoso y salta el arco.',
    phenomenon:
      'El aire no tiene un número mágico fijo: se rompe cuando los electrones ganan suficiente energía entre choques para multiplicarse exponencialmente. En Bogotá (δ = 0,74) las moléculas están más separadas, así que el umbral baja y hace falta más distancia de aire.',
    objective:
      'Comprender por qué la rigidez del aire depende de la separación y de la densidad δ, y comprobar que sostener 200 kV exige ~8 cm en la costa pero ~10,8 cm en Bogotá.',
    watch: [
      'Compara «Nivel del mar» con «Mismo espacio en Bogotá»: verás menos moléculas en la cámara y la chispa saltando más fácil.',
      'Separa los electrodos con el control d: las dos placas metálicas se alejan en vivo y sube U₀.',
      'En la gráfica, la línea ámbar (Bogotá) va por debajo de la azul (mar): para llegar a la línea de 200 kV debes moverte más a la derecha (más cm).',
    ],
    misconception:
      'Repetir de memoria que «el aire siempre aguanta 30 kV/cm». Eso solo aplica en campo uniforme, 1 cm y aire estándar; con puntas metálicas, distancias largas o altitud andina aguanta menos por centímetro.',
    model: 'Campo uniforme entre placas paralelas con α − η = 3,7·(E − 25·δ) y criterio de streamer n = 10⁸. No incluye efecto de puntas ni humedad.',
  },
  sources: ['expo77', 'expo39', 'guion', 'slides', 'velasco', 'corona'],
  scene: ({ p, d, t }) => {
    const firing = d.breakdown === 1;
    return (
      <SceneCanvas
        legend={[
          { color: 'rgba(11,99,206,0.45)', label: `Moléculas de aire (δ = ${fmt(p.delta, 2)})` },
          { color: firing ? PAL.bad : PAL.surge, label: 'Avalancha de electrones (e⁻)' },
          { color: PAL.ok, label: `Rigidez U₀ = ${fmt(d.u0, 1)} kV` },
        ]}
        draw={(ctx, w, h) => {
          environment(ctx, w, h, { mood: 'lab' });
          sceneHeader(
            ctx,
            'Cámara de electrodos en aire',
            p.delta < 0.8 ? `Aire de montaña (δ = ${fmt(p.delta, 2)})` : `Aire denso (δ = ${fmt(p.delta, 2)})`,
          );

          // Cámara transparente
          const cx = w * 0.5;
          const cy = h * 0.52;
          const chW = w * 0.82;
          const chH = h * 0.62;
          ctx.save();
          ctx.fillStyle = firing ? 'rgba(254, 242, 242, 0.9)' : 'rgba(235, 245, 255, 0.72)';
          ctx.strokeStyle = firing ? PAL.bad : '#B6C7D9';
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.roundRect(cx - chW / 2, cy - chH / 2, chW, chH, 14);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          // Moléculas de aire (proporcionales a delta)
          const molCount = Math.round(18 + Math.pow((p.delta - 0.55) / 0.45, 1.3) * 58);
          for (let i = 0; i < molCount; i++) {
            const mx = cx - chW * 0.44 + ((i * 73) % (chW * 0.88));
            const my = cy - chH * 0.4 + ((i * 53) % (chH * 0.8));
            circle(ctx, mx + Math.sin(t + i) * 2, my + Math.cos(t * 0.8 + i) * 2, 2.1, {
              fill: 'rgba(78, 130, 185, 0.28)',
            });
          }

          // Electrodos con separación visual proporcional a d
          const halfGap = Math.min(chW * 0.34, Math.max(22, 22 + (p.d / 20) * (chW * 0.31)));
          const x1 = cx - halfGap;
          const x2 = cx + halfGap;
          const plateH = chH * 0.52;

          // Soportes y placas metálicas redondeadas
          line(ctx, cx - chW / 2, cy, x1 - 12, cy, { color: PAL.steel, width: 5 });
          line(ctx, x2 + 12, cy, cx + chW / 2, cy, { color: PAL.steel, width: 5 });
          ctx.save();
          ctx.fillStyle = '#5C7288';
          ctx.strokeStyle = '#2E4052';
          ctx.lineWidth = 1.8;
          ctx.beginPath();
          ctx.roundRect(x1 - 12, cy - plateH / 2, 12, plateH, 5);
          ctx.roundRect(x2, cy - plateH / 2, 12, plateH, 5);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          text(ctx, '−', x1 - 6, cy, { color: '#FFFFFF', weight: 700, size: 13, align: 'center', mono: true });
          text(ctx, '+', x2 + 6, cy, { color: '#FFFFFF', weight: 700, size: 13, align: 'center', mono: true });

          // Nube en abanico de avalancha de electrones
          if (d.alpha > 0) {
            const count = 48;
            const gap = x2 - x1;
            for (let i = 0; i < count; i++) {
              const u = ((i / count) + t * 0.45) % 1;
              const grow = Math.min(1, Math.max(0, (d.alpha * p.d * u) / Math.log(1e8)));
              const spread = 3 + grow * (plateH * 0.36);
              const px = x1 + 3 + u * (gap - 6);
              const py = cy + Math.sin(i * 2.399) * spread;
              circle(ctx, px, py, 1.5 + grow * 2.4, {
                fill: firing ? PAL.bad : PAL.surge,
                alpha: 0.25 + grow * 0.65,
              });
            }
          }

          if (firing) {
            glow(ctx, cx, cy, halfGap * 0.9, PAL.bad, 0.22);
            electricArc(ctx, x1, cy, x2, cy, t * 5, PAL.bad, 3);
            pill(ctx, '⚡ ARCO ELÉCTRICO (n ≥ 10⁸)', cx, cy - plateH * 0.56, { color: PAL.bad, align: 'center' });
          } else {
            pill(ctx, `✓ Sin arco · Aguanta hasta ${fmt(d.u0, 1)} kV`, cx, cy - plateH * 0.56, { color: PAL.ok, align: 'center' });
          }

          dimension(ctx, x1, cy + plateH * 0.58, x2, cy + plateH * 0.58, `d = ${fmt(p.d, 2)} cm`, PAL.phase);
          pill(ctx, `Aplicado: ${fmt(d.uApplied, 1)} kV (${fmt(p.e, 1)} kV/cm)`, w - 14, 21, {
            color: firing ? PAL.bad : PAL.phase,
            align: 'right',
            mono: true,
          });
        }}
        footer={
          <>
            <strong>Observa el cono entre las placas:</strong> los electrones salen del electrodo negativo (−) y se multiplican hacia el positivo (+). Si llegan a 10⁸ antes de terminar el recorrido, salta el arco.
          </>
        }
      />
    );
  },
  plot: ({ p, d }) => {
    const kTerm = Math.log(1e8) / 3.7;
    const sea: [number, number][] = linspace(0.2, 20, 140).map((x) => [x, 25 * 1 * x + kTerm]);
    const bog: [number, number][] = linspace(0.2, 20, 140).map((x) => [x, 25 * 0.74 * x + kTerm]);
    return (
      <Plot
        xDomain={[0, 20]}
        yDomain={[0, 420]}
        xLabel="Separación de aire entre electrodos d (cm)"
        yLabel="Voltaje de ruptura U₀ (kV)"
        series={[
          { pts: sea, color: PAL.phase, width: 2.3, label: 'Nivel del mar (δ = 1,00)' },
          { pts: bog, color: PAL.warn, dash: '5 4', width: 2.2, label: 'Bogotá 2.640 m (δ = 0,74)' },
        ]}
        refs={[{ at: 200, label: 'Meta del reto: sostener 200 kV', color: PAL.ok }]}
        markers={[
          { x: p.d, y: d.u0, color: PAL.porcelain, label: `U₀ = ${fmt(d.u0, 0)} kV` },
          { x: p.d, y: d.uApplied, color: d.breakdown ? PAL.bad : PAL.surge, shape: 'ring', label: `Aplicado ${fmt(d.uApplied, 0)} kV` },
        ]}
        caption="Para sostener 200 kV (línea verde), la curva del mar pide ~7,8 cm mientras que la curva de Bogotá pide ~10,6 cm de aire."
      />
    );
  },
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
      id: 'rayo',
      label: 'Impulso tipo rayo (dispersión menor σ = 3 %)',
      note: 'Con σ = 3 %, la curva es más empinada y la zona de incertidumbre alrededor de U₅₀ es más angosta.',
      values: { u50: 700, sigma: 3, ptarget: 10, uapp: 646 },
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
  sources: ['expo77', 'expo39', 'guion', 'slides', 'cardona', 'velasco'],
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
