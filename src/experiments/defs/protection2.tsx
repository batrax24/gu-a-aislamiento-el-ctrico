import {
  airDensity,
  bundleEquivalentRadius,
  clamp,
  cfoFromInsulators,
  cfoRequired,
  coronaInception,
  correctTo20,
  creepageRequired,
  dar,
  effectiveProtection,
  fmt,
  insulationCurrents,
  insulationResistance,
  insulatorsFromCfo,
  linspace,
  logspace,
  peekLoss,
  piIndex,
  protectionMargin,
  tovCapability,
  tovEquivalent,
  ucMin,
} from '../../lib/num';
import { PAL, arrow, circle, dimension, electricArc, environment, glow, groundSymbol, insulatorString, latticeTower, line, pill, powerTransformer, sceneHeader, scopeScreen, soilCutaway, stormCloud, surgeArrester, technician, text } from '../../lib/draw';
import { BarComparisonPlot, Plot, SceneCanvas } from '../../components/ui';
import type { Experiment, Params } from '../types';

/* =============================== e16 =============================== */

const e16: Experiment = {
  id: 'e16',
  topicId: 11,
  contextLabel: 'Bahía de entrada de subestación',
  title: 'Pararrayos ZnO: cinco verificaciones a la vez',
  tagline: 'U_c, TOV, U_r, tensión residual, distancia al equipo y margen frente al BIL',
  why: 'Seleccionar un descargador como se hace en un proyecto real: varias condiciones simultáneas, no una sola cifra.',
  params: [
    {
      id: 'um',
      group: 'Red y descargador',
      label: 'Tensión máxima del sistema (Uₘ)',
      unit: 'kV',
      min: 72.5,
      max: 500,
      step: 0.5,
      def: 245,
    },
    {
      id: 'uc',
      group: 'Red y descargador',
      label: 'Tensión continua del ZnO (U_c)',
      unit: 'kV eficaces',
      min: 60,
      max: 300,
      step: 1,
      def: 150,
      help: 'Debe aguantar las 24 h sin calentarse ni envejecer.',
    },
    {
      id: 'ur',
      group: 'Red y descargador',
      label: 'Tensión asignada del catálogo (U_r)',
      unit: 'kV eficaces',
      min: 60,
      max: 360,
      step: 1,
      def: 180,
    },
    {
      id: 'ures',
      group: 'Red y descargador',
      label: 'Tensión residual U_res (onda 8/20 µs)',
      unit: 'kV cresta',
      min: 300,
      max: 1200,
      step: 5,
      def: 600,
      help: 'Techo de voltaje en los BORNES del descargador, no en el transformador.',
    },
    {
      id: 'tovPu',
      group: 'Sobretensión temporal (falla)',
      label: 'TOV durante la falla',
      unit: 'p.u. de U_f',
      min: 1,
      max: 1.8,
      step: 0.01,
      def: 1.25,
      decimals: 2,
    },
    {
      id: 'tovDur',
      group: 'Sobretensión temporal (falla)',
      label: 'Duración de la TOV',
      unit: 's',
      min: 0.1,
      max: 10,
      step: 0.1,
      def: 1,
      decimals: 1,
    },
    {
      id: 'cap1s',
      group: 'Sobretensión temporal (falla)',
      label: 'Capacidad TOV del catálogo a 1 s',
      unit: 'kV eficaces',
      min: 100,
      max: 350,
      step: 1,
      def: 195,
    },
    {
      id: 'd',
      group: 'Conexión física al transformador',
      label: 'Distancia descargador → equipo',
      unit: 'm',
      min: 0,
      max: 30,
      step: 0.5,
      def: 6,
      decimals: 1,
      help: 'Cada metro de cable de conexión suma L_c·di/dt kilovoltios.',
    },
    {
      id: 'lc',
      group: 'Conexión física al transformador',
      label: 'Inductancia del cable de conexión',
      unit: 'µH/m',
      min: 0,
      max: 2,
      step: 0.05,
      def: 1,
      decimals: 2,
    },
    {
      id: 'didt',
      group: 'Conexión física al transformador',
      label: 'Pendiente de corriente del rayo',
      unit: 'kA/µs',
      min: 2,
      max: 30,
      step: 0.5,
      def: 10,
      decimals: 1,
    },
    {
      id: 'bil',
      group: 'Equipo protegido',
      label: 'BIL del transformador',
      unit: 'kV cresta',
      min: 550,
      max: 1800,
      step: 10,
      def: 1050,
    },
  ],
  presets: [
    {
      id: 'curso',
      label: 'Ejemplo del curso (U_res 600 kV + 60 kV)',
      note: 'U_equipo = 660 kV y BIL = 1.050 kV → margen M = 59,1 %. Las 4 verificaciones quedan en verde.',
      values: { um: 245, uc: 150, ur: 180, ures: 600, tovPu: 1.25, tovDur: 1, cap1s: 195, d: 6, lc: 1, didt: 10, bil: 1050 },
    },
    {
      id: 'cerca',
      label: 'Descargador a 1 m del transformador',
      note: 'Solo suma 10 kV inductivos → U_equipo = 610 kV y el margen supera 70 %.',
      values: { um: 245, uc: 150, ur: 180, ures: 600, tovPu: 1.25, tovDur: 1, cap1s: 195, d: 1, lc: 1, didt: 10, bil: 1050 },
    },
    {
      id: 'tov10',
      label: 'TOV de 10 s (más exigente)',
      note: 'La capacidad del catálogo baja con la duración; revisa la curva TOV antes de elegir U_r.',
      values: { um: 245, uc: 150, ur: 180, ures: 600, tovPu: 1.25, tovDur: 10, cap1s: 195, d: 6, lc: 1, didt: 10, bil: 1050 },
    },
    {
      id: 'bajo',
      label: 'Descargador con U_res alta (750 kV)',
      note: 'Aunque U_c y TOV estén bien, el margen cae por debajo de 20 %: el transformador queda desprotegido.',
      values: { um: 245, uc: 150, ur: 180, ures: 750, tovPu: 1.25, tovDur: 1, cap1s: 195, d: 6, lc: 1, didt: 10, bil: 1050 },
    },
  ],
  compute: (p) => {
    const uf = p.um / Math.sqrt(3);
    const ucReq = ucMin(p.um, true);
    const uTov = p.tovPu * uf;
    const ueq = tovEquivalent(uTov, p.tovDur);
    const capAtDur = tovCapability(p.cap1s, p.tovDur);
    const urMin = 1.05 * ueq;
    const uEff = effectiveProtection(p.ures, p.d, p.lc, p.didt);
    const margin = protectionMargin(p.bil, uEff);
    const extra = p.lc * p.d * p.didt;
    const okUc = p.uc >= ucReq ? 1 : 0;
    const okTov = ueq <= capAtDur ? 1 : 0;
    const okUr = p.ur >= urMin ? 1 : 0;
    const okMargin = margin >= 20 ? 1 : 0;
    return { uf, ucReq, uTov, ueq, capAtDur, urMin, uEff, extra, margin, okUc, okTov, okUr, okMargin, all: okUc * okTov * okUr * okMargin };
  },
  liveStatus: (p, d) => ({
    tone: d.all ? 'ok' : 'bad',
    badge: d.all ? `✓ DESCARGADOR ADECUADO · M = ${fmt(d.margin, 1)} %` : `✕ REVISAR SELECCIÓN · M = ${fmt(d.margin, 1)} %`,
    message: d.all
      ? `El transformador ve ${fmt(d.uEff, 0)} kV (U_res ${fmt(d.uEff - d.extra, 0)} + ${fmt(d.extra, 0)} de conexiones) frente a un BIL de ${fmt(p.bil, 0)} kV: las 4 verificaciones pasan.`
      : `Hay al menos una verificación en rojo. U_equipo = ${fmt(d.uEff, 0)} kV, TOV equivalente ${fmt(d.ueq, 1)} kV y U_c mínima ${fmt(d.ucReq, 1)} kV.`,
  }),
  readings: (d, p) => [
    {
      label: 'U_c mínima exigida',
      value: `${fmt(d.ucReq, 1)} kV eficaces`,
      sub: `1,05·Uₘ/√3 (U_f = ${fmt(d.uf, 1)} kV)`,
      tone: d.okUc ? 'ok' : 'bad',
    },
    {
      label: 'TOV equivalente a 10 s',
      value: `${fmt(d.ueq, 1)} kV eficaces`,
      sub: `${fmt(p.tovPu, 2)}·U_f durante ${fmt(p.tovDur, 1)} s`,
      tone: d.okTov ? 'ok' : 'bad',
    },
    {
      label: 'Capacidad del catálogo',
      value: `${fmt(d.capAtDur, 1)} kV eficaces`,
      sub: 'a la MISMA duración de la TOV',
      tone: d.okTov ? 'ok' : 'bad',
    },
    { label: 'U_r mínima requerida', value: `${fmt(d.urMin, 1)} kV eficaces`, sub: '1,05·U_eq', tone: d.okUr ? 'ok' : 'bad' },
    {
      label: 'Voltaje en el transformador',
      value: `${fmt(d.uEff, 1)} kV cresta`,
      sub: `${fmt(p.ures, 0)} + ${fmt(d.extra, 0)} kV (L_c·d·di/dt)`,
      tone: 'warn',
    },
    {
      label: 'Margen de protección',
      value: `${fmt(d.margin, 1)} %`,
      sub: `BIL ${fmt(p.bil, 0)} / U_equipo ${fmt(d.uEff, 0)}`,
      tone: d.okMargin ? 'ok' : 'bad',
    },
  ],
  equations: (p, d) => [
    `U_c ≥ 1,05·Uₘ/√3 = 1,05 × ${fmt(d.uf, 1)} = ${fmt(d.ucReq, 1)} kV eficaces (elegido ${fmt(p.uc, 0)} kV)`,
    `U_TOV = ${fmt(p.tovPu, 2)} × ${fmt(d.uf, 1)} = ${fmt(d.uTov, 1)} kV · U_eq = U_TOV·(t/10)^0,02 = ${fmt(d.ueq, 1)} kV`,
    `U_r ≥ 1,05·U_eq = ${fmt(d.urMin, 1)} kV · capacidad(t) = ${fmt(p.cap1s, 0)}·(1/t)^0,02 = ${fmt(d.capAtDur, 1)} kV`,
    `U_equipo = U_res + L_c·d·di/dt = ${fmt(p.ures, 0)} + ${fmt(p.lc, 2)}×${fmt(p.d, 1)}×${fmt(p.didt, 1)} = ${fmt(d.uEff, 1)} kV`,
    `M = (BIL/U_equipo − 1)·100 = (${fmt(p.bil, 0)}/${fmt(d.uEff, 0)} − 1)·100 = ${fmt(d.margin, 1)} %`,
  ],
  checks: (p, d) => [
    { label: 'U_c suficiente para operación continua', ok: d.okUc === 1, detail: `${fmt(p.uc, 0)} ≥ ${fmt(d.ucReq, 1)} kV` },
    { label: 'TOV equivalente cabe en la curva del catálogo', ok: d.okTov === 1, detail: `${fmt(d.ueq, 1)} ≤ ${fmt(d.capAtDur, 1)} kV` },
    { label: 'U_r cubre la TOV con 5 % de margen', ok: d.okUr === 1, detail: `${fmt(p.ur, 0)} ≥ ${fmt(d.urMin, 1)} kV` },
    { label: 'Margen de protección ≥ 20 %', ok: d.okMargin === 1, detail: `${fmt(d.margin, 1)} %` },
    { label: 'Se comparan crestas con crestas', ok: true, detail: 'impulso 8/20 µs con BIL 1,2/50 µs' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el ejemplo del curso: margen ≈ 59,1 % con U_res 600 kV y 60 kV de conexión',
      tip: 'Pulsa «Ejemplo del curso (U_res 600 kV + 60 kV)».',
      test: (_p, d) => Math.abs(d.margin - 59.09) < 0.4 && d.all === 1,
      detail: (_p, d) => `M = ${fmt(d.margin, 1)} % · U_equipo = ${fmt(d.uEff, 0)} kV`,
    },
    {
      id: 'g2',
      label: 'Acerca el descargador a 1 m y comprueba que el margen supera el 70 %',
      tip: 'Pulsa «Descargador a 1 m del transformador» o baja d a 1 m.',
      test: (p, d) => p.d <= 1.01 && d.margin >= 70 && d.all === 1,
      detail: (p, d) => `d = ${fmt(p.d, 1)} m → M = ${fmt(d.margin, 1)} %`,
    },
  ],
  learn: {
    analogy:
      'El pararrayos es la válvula de seguridad de una olla a presión: aguanta cerrada la presión diaria (U_c), tolera hervores breves (TOV) y se abre al instante ante el pico (U_res). Si la válvula queda al final de un tubo largo (distancia d), la olla igual sufre sobrepresión.',
    phenomenon:
      'Un descargador de ZnO conduce poquísimo a tensión normal y limita la tensión durante un transitorio. La tensión residual se mide en sus bornes; el transformador ve además la caída inductiva de los cables de conexión.',
    objective:
      'Verificar U_c, TOV, U_r, U_res y margen M, y explicar por qué la ubicación y las conexiones cambian el nivel real de protección.',
    watch: [
      'Aleja el descargador del transformador con el control d: la cota ámbar crece y la barra «voltaje en el equipo» sube.',
      'Cambia la duración de la TOV: en la gráfica, el punto de operación se mueve sobre una curva de capacidad que cae con el tiempo.',
      'Pulsa «U_res alta (750 kV)»: U_c y TOV siguen bien, pero el margen cae y la selección se rechaza.',
    ],
    misconception:
      'Comparar U_res directamente con el BIL olvidando las conexiones, o creer que la corriente nominal de descarga resume toda la capacidad energética.',
    model: 'TOV equivalente según IEC 60099-5 con m_d = 0,02 y suma aditiva conservadora L·d·di/dt. La evaluación real exige curvas de fabricante y ondas viajeras.',
  },
  sources: ['expo39', 'expo77', 'guion', 'slides', 'pararrayos', 'velasco', 'iec60099'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      legend={[
        { color: PAL.surge, label: 'Pararrayos de ZnO drenando el rayo' },
        { color: PAL.phase, label: 'Línea de 245 kV' },
        { color: d.okMargin ? PAL.ok : PAL.bad, label: `Voltaje en el equipo ${fmt(d.uEff, 0)} kV` },
      ]}
      draw={(ctx, w, h) => {
        environment(ctx, w, h, { mood: 'day', groundY: h * 0.84, mountains: false });
        soilCutaway(ctx, 0, h * 0.84, w, h * 0.16, { layers: 2 });
        sceneHeader(ctx, 'Bahía de entrada de la subestación', `BIL ${fmt(p.bil, 0)} kV · U_res ${fmt(p.ures, 0)} kV · d = ${fmt(p.d, 1)} m`);

        const gy = h * 0.84;
        const fy = h * 0.2;
        line(ctx, w * 0.06, fy, w * 0.94, fy, { color: PAL.phase, width: 3 });
        text(ctx, `Red Uₘ = ${fmt(p.um, 0)} kV`, w * 0.06, fy - 16, { size: 10, color: PAL.phase, mono: true });

        const ax = w * 0.34;
        surgeArrester(ctx, ax, fy, gy, { active: true, t });
        groundSymbol(ctx, ax, gy + 2, 10, PAL.copper);
        pill(ctx, `U_c ${fmt(p.uc, 0)} · U_r ${fmt(p.ur, 0)} kV`, ax, gy - 12, { color: PAL.surge, align: 'center', mono: true, size: 9.5 });

        const tx = Math.min(w * 0.88, ax + 30 + p.d * w * 0.017);
        const trafo = powerTransformer(ctx, tx, gy, w * 0.17, h * 0.26, {
          alert: !d.okMargin,
          label: `BIL ${fmt(p.bil, 0)} kV`,
        });
        line(ctx, ax, fy, trafo.bushingX, fy, { color: PAL.phase, width: 2.2 });
        line(ctx, trafo.bushingX, fy, trafo.bushingX, trafo.bushingY, { color: PAL.phase, width: 2 });
        dimension(ctx, ax, fy - 28, trafo.bushingX, fy - 28, `d = ${fmt(p.d, 1)} m (+${fmt(d.extra, 0)} kV)`, PAL.warn);

        // Pulso de rayo entrando y recorte en bornes del ZnO
        const u = (t * 0.55) % 1;
        const px = w * 0.06 + u * (ax - w * 0.06);
        circle(ctx, px, fy, 4.5, { fill: PAL.surgeBright, stroke: '#FFFFFF', width: 1.4 });
        electricArc(ctx, px + 4, fy - 8, ax, fy - 2, t * 5, PAL.surge, 1.4);
        glow(ctx, ax, fy + 14, 20, PAL.surge, 0.3);

        // Panel de dos barras: U_res en bornes vs U_equipo
        const bx = w * 0.56;
        const by = h * 0.34;
        const bw = w * 0.3;
        const maxV = Math.max(p.bil, d.uEff) * 1.1;
        const bar = (yy: number, label: string, val: number, col: string) => {
          text(ctx, label, bx, yy - 9, { size: 9.5, color: PAL.inkSoft });
          line(ctx, bx, yy, bx + bw, yy, { color: 'rgba(78,99,120,0.14)', width: 11, cap: 'butt' });
          line(ctx, bx, yy, bx + bw * (val / maxV), yy, { color: col, width: 11, cap: 'butt' });
          text(ctx, `${fmt(val, 0)} kV`, bx + bw + 6, yy, { size: 9.5, color: col, mono: true });
        };
        bar(by, 'U_res en bornes ZnO', p.ures, PAL.surge);
        bar(by + 32, 'U_equipo (incluye conexión)', d.uEff, d.okMargin ? PAL.ok : PAL.bad);
        bar(by + 64, 'BIL del transformador', p.bil, PAL.phase);
        pill(ctx, d.okMargin ? `✓ MARGEN ${fmt(d.margin, 1)} %` : `✕ MARGEN ${fmt(d.margin, 1)} %`, bx, by + 100, {
          color: d.okMargin ? PAL.ok : PAL.bad,
          mono: true,
        });
      }}
      footer={
        <>
          <strong>Observa la cota ámbar:</strong> el descargador recorta en sus propios bornes, pero el transformador recibe <strong>U_res + L_c·d·di/dt</strong>. Por eso se instala lo más cerca posible.
        </>
      }
    />
  ),
  plot: ({ p, d }) => {
    const pts: [number, number][] = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10].map((tt) => [tt, tovCapability(p.cap1s, tt)]);
    return (
      <Plot
        xDomain={[0.05, 10]}
        yDomain={[100, 320]}
        xLog
        xLabel="Duración de la sobretensión TOV (s — escala logarítmica)"
        yLabel="Tensión soportada TOV (kV eficaces)"
        bands={[{ y1: 100, y2: d.ueq, color: 'rgba(13,138,89,0.08)', label: 'Por debajo de la TOV aplicada', textColor: '#0A6E47' }]}
        series={[{ pts, color: PAL.surge, width: 2.4, label: 'Capacidad TOV del catálogo' }]}
        refs={[{ at: d.ueq, label: `TOV equivalente ${fmt(d.ueq, 0)} kV`, color: PAL.bad }]}
        markers={[
          { x: p.tovDur, y: d.ueq, color: d.okTov ? PAL.ok : PAL.bad, label: 'TOV aplicada' },
          { x: p.tovDur, y: d.capAtDur, color: PAL.warn, label: 'Capacidad', shape: 'ring' },
        ]}
        caption="La capacidad TOV baja al aumentar la duración. La comparación debe hacerse a la MISMA duración, no con el valor de 1 s."
      />
    );
  },
};

/* =============================== e17 =============================== */

const e17: Experiment = {
  id: 'e17',
  topicId: 10,
  contextLabel: 'Conductor de fase con halo de corona',
  title: 'Corona: el zumbido y el halo violeta cuestan energía',
  tagline: 'Incepción U₀, gradiente superficial y pérdidas cuadráticas de Peek',
  why: 'Ver por qué un conductor delgado, rugoso o en altura entra en corona y cómo un haz de 2–4 subconductores la evita.',
  params: [
    {
      id: 'u',
      group: 'Operación del conductor',
      label: 'Tensión fase–tierra (U)',
      unit: 'kV eficaces',
      min: 40,
      max: 450,
      step: 2,
      def: 150,
    },
    {
      id: 'delta',
      group: 'Operación del conductor',
      label: 'Densidad relativa del aire (δ)',
      min: 0.6,
      max: 1,
      step: 0.01,
      def: 0.9,
      decimals: 2,
    },
    {
      id: 'm',
      group: 'Operación del conductor',
      label: 'Factor de superficie (m)',
      min: 0.6,
      max: 1,
      step: 0.01,
      def: 1,
      decimals: 2,
      help: '1 = conductor liso y limpio; menos de 1 = rugoso, sucio o mojado.',
    },
    {
      id: 'f',
      group: 'Operación del conductor',
      label: 'Frecuencia',
      unit: 'Hz',
      min: 50,
      max: 60,
      step: 10,
      def: 60,
    },
    {
      id: 'r',
      group: 'Geometría del haz',
      label: 'Radio de cada subconductor',
      unit: 'cm',
      min: 0.3,
      max: 3,
      step: 0.05,
      def: 1.5,
      decimals: 2,
    },
    {
      id: 'n',
      group: 'Geometría del haz',
      label: 'Subconductores por fase',
      min: 1,
      max: 4,
      step: 1,
      def: 1,
    },
    {
      id: 'sep',
      group: 'Geometría del haz',
      label: 'Separación dentro del haz',
      unit: 'cm',
      min: 20,
      max: 100,
      step: 5,
      def: 40,
    },
    {
      id: 's',
      group: 'Geometría del haz',
      label: 'Separación equivalente entre fases',
      unit: 'cm',
      min: 200,
      max: 1200,
      step: 10,
      def: 600,
    },
    {
      id: 'mode',
      group: 'Umbral de incepción',
      label: '¿De dónde sale U₀?',
      min: 0,
      max: 1,
      step: 1,
      def: 0,
      options: [
        { value: 0, label: 'Dato del ejemplo (120 kV)' },
        { value: 1, label: 'Calcular con gradiente' },
      ],
      help: 'El ejemplo numérico del curso usa U₀ = 120 kV como dato, no como resultado de la geometría.',
    },
    {
      id: 'u0in',
      group: 'Umbral de incepción',
      label: 'U₀ dado (solo modo dato)',
      unit: 'kV eficaces',
      min: 60,
      max: 250,
      step: 1,
      def: 120,
    },
  ],
  presets: [
    {
      id: 'curso',
      label: 'Ejemplo de Peek (10,29 kW/km)',
      note: 'U = 150 kV · U₀ = 120 kV · r = 1,5 cm · s = 600 cm · δ = 0,9 · f = 60 Hz → 10,29 kW/km por conductor.',
      values: { u: 150, delta: 0.9, m: 1, f: 60, r: 1.5, n: 1, sep: 40, s: 600, mode: 0, u0in: 120 },
    },
    {
      id: 'calculada',
      label: 'Incepción calculada (sin corona a 150 kV)',
      note: 'Con E₀ = 21,1·δ·m, la U₀ calculada para esta geometría supera 150 kV: el modelo da cero pérdidas.',
      values: { u: 150, delta: 0.9, m: 1, f: 60, r: 1.5, n: 1, sep: 40, s: 600, mode: 1, u0in: 120 },
    },
    {
      id: 'haz',
      label: 'Haz de 2 subconductores',
      note: 'El radio equivalente sube; la corona se aleja y las pérdidas bajan frente a un conductor simple.',
      values: { u: 150, delta: 0.9, m: 1, f: 60, r: 1.5, n: 2, sep: 40, s: 600, mode: 1, u0in: 120 },
    },
    {
      id: 'fino',
      label: 'Conductor fino en altura',
      note: 'r = 0,5 cm, δ = 0,74 y m = 0,9: el campo superficial se concentra y aparece corona.',
      values: { u: 150, delta: 0.74, m: 0.9, f: 60, r: 0.5, n: 1, sep: 40, s: 300, mode: 1, u0in: 120 },
    },
  ],
  compute: (p) => {
    const rEq = bundleEquivalentRadius(p.r, p.n, p.sep / 2);
    const inc = coronaInception(rEq, p.s, p.delta, p.m);
    const u0 = p.mode === 1 ? inc.u0 : p.u0in;
    const loss = peekLoss(rEq, p.s, p.f, p.delta, p.u, u0);
    const gradient = p.u / (rEq * Math.log(Math.max(1.01, p.s / rEq)));
    const over = (p.u - u0) / u0;
    const e0impl = u0 / (rEq * Math.log(Math.max(1.01, p.s / rEq)));
    const coherent = Math.abs(e0impl - inc.e0) / inc.e0 < 0.1 ? 1 : 0;
    return { rEq, e0: inc.e0, u0calc: inc.u0, u0, loss, gradient, over, e0impl, coherent, on: p.u > u0 ? 1 : 0, ratio: gradient / inc.e0 };
  },
  liveStatus: (p, d) => ({
    tone: d.on ? 'bad' : 'ok',
    badge: d.on ? `✕ CORONA ACTIVA · ${fmt(d.loss, 2)} kW/km` : '✓ SIN CORONA',
    message: d.on
      ? `U = ${fmt(p.u, 0)} kV supera U₀ = ${fmt(d.u0, 1)} kV en ${fmt(p.u - d.u0, 1)} kV: el halo ioniza aire y pierde ${fmt(d.loss, 2)} kW por km y conductor.`
      : `U = ${fmt(p.u, 0)} kV está por debajo de U₀ = ${fmt(d.u0, 1)} kV: la ley de Peek da cero pérdidas (no un valor negativo).`,
  }),
  readings: (d, p) => [
    { label: 'Radio equivalente r_eq', value: `${fmt(d.rEq, 2)} cm`, sub: p.n > 1 ? `haz de ${fmt(p.n, 0)} subconductores` : 'conductor simple' },
    { label: 'Gradiente de incepción E₀', value: `${fmt(d.e0, 2)} kV/cm`, sub: `21,1 · δ(${fmt(p.delta, 2)}) · m(${fmt(p.m, 2)})` },
    {
      label: 'Tensión de incepción U₀',
      value: `${fmt(d.u0, 1)} kV`,
      sub: p.mode === 1 ? `calculada: ${fmt(d.u0calc, 1)} kV` : 'dato de entrada del ejemplo',
    },
    {
      label: 'Gradiente superficial actual',
      value: `${fmt(d.gradient, 2)} kV/cm`,
      sub: `${fmt(d.ratio * 100, 0)} % de E₀`,
      tone: d.on ? 'bad' : 'ok',
    },
    {
      label: 'Estado',
      value: d.on ? 'en corona' : 'sin corona',
      sub: d.on ? `exceso U−U₀ = ${fmt(p.u - d.u0, 1)} kV` : 'U ≤ U₀: sin pérdidas por Peek',
      tone: d.on ? 'bad' : 'ok',
    },
    {
      label: 'Pérdidas por corona',
      value: `${fmt(d.loss, 2)} kW/km`,
      sub: 'por conductor, buen tiempo',
      tone: d.loss > 0 ? 'warn' : 'neutral',
    },
    {
      label: 'Coherencia dato ↔ geometría',
      value: d.coherent ? 'consistente' : 'no consistente',
      sub: `dato implica E₀ = ${fmt(d.e0impl, 2)} frente a ${fmt(d.e0, 2)} kV/cm`,
      tone: d.coherent ? 'ok' : 'warn',
    },
  ],
  equations: (p, d) => [
    `r_eq = (n·r·R^(n−1))^(1/n) = ${fmt(d.rEq, 2)} cm`,
    `E₀ = 21,1·δ·m = 21,1 × ${fmt(p.delta, 2)} × ${fmt(p.m, 2)} = ${fmt(d.e0, 2)} kV/cm`,
    `U₀ = E₀·r_eq·ln(s/r_eq) = ${fmt(d.e0, 2)} × ${fmt(d.rEq, 2)} × ln(${fmt(p.s, 0)}/${fmt(d.rEq, 2)}) = ${fmt(d.u0calc, 1)} kV`,
    `P = (242/δ)(f+25)√(r_eq/s)(U − U₀)²·10⁻⁵ = ${fmt(d.loss, 2)} kW/km (solo si U > U₀)`,
    'El U₀ = 120 kV del ejemplo es un DATO de entrada; con la U₀ calculada para esta geometría la línea estaría por debajo de la incepción.',
  ],
  checks: (p, d) => [
    { label: 'La fórmula se aplica solo por encima de la incepción', ok: p.u > d.u0, detail: `U = ${fmt(p.u, 0)} · U₀ = ${fmt(d.u0, 1)} kV` },
    { label: 'La incepción depende de r_eq, δ y superficie', ok: true, detail: 'no es una constante de 21,1 kV/cm' },
    { label: 'El haz se refleja en el radio equivalente', ok: true, detail: `r_eq = ${fmt(d.rEq, 2)} cm` },
    { label: 'El dato de U₀ es coherente con la geometría', ok: d.coherent === 1, detail: d.coherent ? 'sí' : 'el ejemplo es un dato, no un cálculo' },
    { label: 'El resultado es por conductor', ok: true, detail: 'no multiplicar sin declarar el alcance' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Reproduce el ejemplo de Peek: 10,29 kW/km con U₀ = 120 kV',
      tip: 'Pulsa «Ejemplo de Peek (10,29 kW/km)» y mantén el modo «Dato del ejemplo».',
      test: (p, d) => p.mode === 0 && Math.abs(d.loss - 10.29) < 0.15,
      detail: (_p, d) => `P = ${fmt(d.loss, 2)} kW/km`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Con U₀ calculada, adelgaza el conductor hasta que 150 kV entre en corona',
      tip: 'Cambia a «Calcular con gradiente» y baja r a ~0,5 cm (o usa «Conductor fino en altura»).',
      test: (p, d) => p.mode === 1 && d.on === 1,
      detail: (p, d) => `r = ${fmt(p.r, 2)} cm · U₀ = ${fmt(d.u0, 1)} kV · P = ${fmt(d.loss, 1)} kW/km`,
    },
  ],
  learn: {
    analogy:
      'Un cable muy delgado concentra el campo eléctrico como la punta de una aguja. Agrupar 2, 3 o 4 cables con espaciadores es como envolver la aguja en un tubo grueso: el campo se reparte y desaparece el halo.',
    phenomenon:
      'Cuando el gradiente local supera la rigidez del aire, se ioniza una capa delgada alrededor del conductor. No hace falta un arco completo: aparecen luz violeta, zumbido, ozono, interferencia y pérdida continua de energía.',
    objective:
      'Calcular la incepción a partir de r_eq, δ y el estado superficial, y estimar pérdidas con Peek entendiendo sus límites.',
    watch: [
      'El halo de la escena crece con el exceso U − U₀; los filamentitos muestran la ionización local, no un arco entre fases.',
      'Pasa de 1 a 2 subconductores: el radio equivalente sube y la incepción se aleja.',
      'La parábola de pérdidas muestra la ley cuadrática: duplicar el exceso de voltaje cuadruplica la pérdida.',
    ],
    misconception:
      'Usar Peek con U < U₀, o creer que cambiar el radio no cambia la incepción. En la versión 1 el control de haz no afectaba la fórmula; aquí r_eq modifica U₀ y las pérdidas.',
    model: 'Incepción coaxial con E₀ = 21,1 kV/cm y pérdidas de Peek para buen tiempo. Lluvia, suciedad y geometría real pueden aumentar las pérdidas.',
  },
  sources: ['expo77', 'guion', 'slides', 'corona', 'ejercicios'],
  scene: ({ p, d, t }) => {
    const intensity = clamp(d.over, 0, 1);
    return (
      <SceneCanvas
        legend={[
          { color: PAL.surgeBright, label: 'Aire ionizado (halo de corona)' },
          { color: PAL.steelLight, label: 'Subconductores metálicos' },
          { color: PAL.ok, label: `U₀ = ${fmt(d.u0, 1)} kV` },
        ]}
        draw={(ctx, w, h) => {
          environment(ctx, w, h, { mood: 'storm', groundY: h * 0.92, mountains: false });
          sceneHeader(ctx, 'Sección transversal de una fase', `${fmt(p.n, 0)} subconductor(es) · r_eq = ${fmt(d.rEq, 2)} cm · U = ${fmt(p.u, 0)} kV`, true);

          const cx = w * 0.4;
          const cy = h * 0.5;
          const R = Math.max(18, p.sep * 0.85);
          const subR = Math.max(4, p.r * 4.5);

          if (d.on) {
            glow(ctx, cx, cy, Math.min(w * 0.3, 70 + intensity * 95), PAL.surgeBright, 0.28 + intensity * 0.3);
            for (let i = 0; i < 30; i++) {
              const a = (i / 30) * Math.PI * 2;
              const len = 12 + intensity * 34 * (0.6 + 0.4 * Math.sin(t * 4 + i));
              const x1 = cx + Math.cos(a) * (subR + 8);
              const y1 = cy + Math.sin(a) * (subR + 8);
              const x2 = cx + Math.cos(a + 0.18) * (subR + 8 + len);
              const y2 = cy + Math.sin(a + 0.18) * (subR + 8 + len);
              electricArc(ctx, x1, y1, x2, y2, t * 3 + i, PAL.surgeBright, 1.1);
            }
          }

          // Haz de subconductores
          for (let i = 0; i < p.n; i++) {
            const a = (i / p.n) * Math.PI * 2 - Math.PI / 2;
            const sx = p.n === 1 ? cx : cx + Math.cos(a) * R;
            const sy = p.n === 1 ? cy : cy + Math.sin(a) * R;
            circle(ctx, sx, sy, subR, { fill: '#B9C8D6', stroke: PAL.steel, width: 1.8 });
            circle(ctx, sx - subR * 0.35, sy - subR * 0.35, subR * 0.25, { fill: 'rgba(255,255,255,0.7)' });
          }
          if (p.n > 1) {
            circle(ctx, cx, cy, R + subR * 1.4, { stroke: 'rgba(220,235,245,0.35)', width: 1.2, dash: [5, 5] });
            text(ctx, `r_eq = ${fmt(d.rEq, 2)} cm`, cx, cy + R + subR * 2.4, { size: 10, color: '#DCEBFA', align: 'center', mono: true });
          }

          // Panel de estado y pérdidas
          const bx = w * 0.66;
          const by = h * 0.24;
          pill(ctx, d.on ? 'CORONA ACTIVA' : 'SIN CORONA', bx, by, { color: d.on ? PAL.badBright : PAL.okBright, dark: true, size: 11 });
          text(ctx, `E₀ = ${fmt(d.e0, 2)} kV/cm`, bx, by + 30, { size: 10.5, color: '#DCEBFA', mono: true });
          text(ctx, `U₀ = ${fmt(d.u0, 1)} kV`, bx, by + 50, { size: 10.5, color: '#DCEBFA', mono: true });
          text(ctx, `U − U₀ = ${fmt(p.u - d.u0, 1)} kV`, bx, by + 70, { size: 10.5, color: '#DCEBFA', mono: true });
          pill(ctx, `Pérdidas: ${fmt(d.loss, 2)} kW/km`, bx, by + 100, { color: d.on ? PAL.warnBright : PAL.okBright, dark: true, mono: true, size: 11 });
          if (p.mode === 0) {
            pill(ctx, 'U₀ = dato del ejemplo (120 kV)', bx, by + 134, { color: PAL.phaseBright, dark: true, mono: true, size: 9.5 });
          }
        }}
        footer={
          <>
            <strong>El halo no es un arco:</strong> es una capa de aire ionizado pegada al metal. Su intensidad crece con <strong>(U − U₀)²</strong>.
          </>
        }
      />
    );
  },
  plot: ({ p, d }) => {
    const pts: [number, number][] = linspace(40, 450, 220).map((u) => [u, peekLoss(d.rEq, p.s, p.f, p.delta, u, d.u0)]);
    return (
      <Plot
        xDomain={[40, 450]}
        yDomain={[0, Math.max(60, d.loss * 1.4)]}
        xLabel="Tensión fase–tierra U (kV eficaces)"
        yLabel="Pérdidas por corona (kW/km)"
        bands={[{ x1: 40, x2: d.u0, color: 'rgba(13,138,89,0.08)', label: `U ≤ U₀: sin pérdidas`, textColor: '#0A6E47' }]}
        series={[{ pts, color: PAL.surge, width: 2.4, area: true, label: 'Ley cuadrática de Peek' }]}
        refs={[{ at: d.u0, label: `Incepción U₀ = ${fmt(d.u0, 0)} kV`, color: PAL.bad, axis: 'x' }]}
        markers={[{ x: p.u, y: d.loss, color: d.on ? PAL.warn : PAL.ok, label: `${fmt(d.loss, 2)} kW/km` }]}
        caption={`La pérdida crece con (U − U₀)². Con r_eq = ${fmt(d.rEq, 2)} cm y δ = ${fmt(p.delta, 2)}, duplicar el exceso de voltaje cuadruplica kW/km.`}
      />
    );
  },
};

/* =============================== e18 =============================== */

const e18: Experiment = {
  id: 'e18',
  topicId: 11,
  contextLabel: 'Proyecto integral de 245 kV en Bogotá',
  title: 'Misión final: coordinar la línea completa',
  tagline: 'Cadena, altitud, guarda, tierra y pararrayos: seis semáforos en verde a la vez',
  why: 'Integrar todos los criterios en una sola decisión y comprobar que una solución verde en un renglón no compensa un rojo en otro.',
  params: [
    { id: 'um', group: 'Red y sitio', label: 'Tensión máxima Uₘ', unit: 'kV', min: 72.5, max: 500, step: 0.5, def: 245 },
    { id: 'h', group: 'Red y sitio', label: 'Altitud del sitio', unit: 'm', min: 0, max: 4000, step: 10, def: 2640 },
    { id: 'temp', group: 'Red y sitio', label: 'Temperatura', unit: '°C', min: 0, max: 35, step: 1, def: 20 },
    { id: 'kf', group: 'Cadena de aisladores', label: 'Coeficiente de fuga k_f', unit: 'mm/kV', min: 12, max: 35, step: 1, def: 25 },
    { id: 'fuga', group: 'Cadena de aisladores', label: 'Fuga por disco', unit: 'mm', min: 200, max: 450, step: 2, def: 292 },
    { id: 'paso', group: 'Cadena de aisladores', label: 'Paso de montaje', unit: 'm', min: 0.1, max: 0.2, step: 0.002, def: 0.146, decimals: 3 },
    { id: 'dh', group: 'Cable de guarda', label: 'Δh guarda–fase', unit: 'm', min: 2, max: 12, step: 0.1, def: 6, decimals: 1 },
    { id: 'dx', group: 'Cable de guarda', label: 'Δx guarda–fase', unit: 'm', min: 0, max: 10, step: 0.1, def: 3, decimals: 1 },
    { id: 'rt', group: 'Torre, rayo y tierra', label: 'Resistencia de tierra', unit: 'Ω', min: 1, max: 50, step: 0.5, def: 20, decimals: 1 },
    { id: 'iRayo', group: 'Torre, rayo y tierra', label: 'Corriente de rayo de diseño', unit: 'kA', min: 10, max: 120, step: 1, def: 60 },
    { id: 'didt', group: 'Torre, rayo y tierra', label: 'di/dt de diseño', unit: 'kA/µs', min: 5, max: 40, step: 1, def: 20 },
    { id: 'kc', group: 'Torre, rayo y tierra', label: 'Acoplamiento guarda–fase', min: 0, max: 0.4, step: 0.01, def: 0.25, decimals: 2 },
    { id: 'cfo', group: 'Torre, rayo y tierra', label: 'CFO de la cadena', unit: 'kV', min: 900, max: 1800, step: 10, def: 1400 },
    { id: 'uc', group: 'Subestación', label: 'U_c del descargador', unit: 'kV eficaces', min: 80, max: 300, step: 1, def: 150 },
    { id: 'ures', group: 'Subestación', label: 'U_res del descargador', unit: 'kV cresta', min: 350, max: 900, step: 5, def: 600 },
    { id: 'bil', group: 'Subestación', label: 'BIL del equipo', unit: 'kV cresta', min: 650, max: 1800, step: 10, def: 1050 },
    { id: 'dArr', group: 'Subestación', label: 'Distancia descargador–equipo', unit: 'm', min: 0, max: 20, step: 0.5, def: 6, decimals: 1 },
  ],
  presets: [
    {
      id: 'referencia',
      label: 'Proyecto coordinado (245 kV, 2.640 m)',
      note: 'Caso de referencia con α ≈ 26,6°, R_t = 20 Ω y pararrayos a 6 m: las 6 verificaciones deben quedar en verde.',
      values: { um: 245, h: 2640, temp: 20, kf: 25, fuga: 292, paso: 0.146, dh: 6, dx: 3, rt: 20, iRayo: 60, didt: 20, kc: 0.25, cfo: 1400, uc: 150, ures: 600, bil: 1050, dArr: 6 },
    },
    {
      id: 'curso',
      label: 'Geometría del ejemplo (38,7°)',
      note: 'Solo cambia la guarda (Δh=5, Δx=4): α = 38,7° y el proyecto deja de estar coordinado aunque todo lo demás siga igual.',
      values: { um: 245, h: 2640, temp: 20, kf: 25, fuga: 292, paso: 0.146, dh: 5, dx: 4, rt: 20, iRayo: 60, didt: 20, kc: 0.25, cfo: 1400, uc: 150, ures: 600, bil: 1050, dArr: 6 },
    },
    {
      id: 'debil',
      label: 'Tierra alta y descargador insuficiente',
      note: 'R_t = 45 Ω, U_res = 760 kV y d = 12 m: fallan flameo inverso, U_c y margen. Aquí se ven varios semáforos rojos.',
      values: { um: 245, h: 2640, temp: 20, kf: 25, fuga: 292, paso: 0.146, dh: 6, dx: 3, rt: 45, iRayo: 60, didt: 20, kc: 0.25, cfo: 1400, uc: 140, ures: 760, bil: 1050, dArr: 12 },
    },
  ],
  compute: (p) => {
    const delta = airDensity(p.h, p.temp);
    const uf = p.um / Math.sqrt(3);
    const fugaReq = creepageRequired(p.um, p.kf, 1, 1);
    const nFuga = Math.max(1, Math.ceil(fugaReq / p.fuga));
    const cfoReq = cfoRequired(p.um, 2.5, 1.15, 1.3, 6, delta, 1);
    const nMan = Math.max(1, Math.ceil(insulatorsFromCfo(cfoReq)));
    const n = Math.max(nFuga, nMan);
    const length = n * p.paso;
    const cfoString = cfoFromInsulators(n);
    const alpha = (Math.atan2(p.dx, p.dh) * 180) / Math.PI;
    const vt = p.rt * p.iRayo + 1 * p.didt;
    const vChain = vt * (1 - p.kc);
    const ucReq = ucMin(p.um, true);
    const uTov = 1.25 * uf;
    const ueq = tovEquivalent(uTov, 1, 0.02);
    const cap = tovCapability(195, 1, 0.02);
    const uEff = effectiveProtection(p.ures, p.dArr, 1, 10);
    const margin = protectionMargin(p.bil, uEff);
    const marginOk = margin >= 20 ? 1 : 0;
    const checks = {
      chain: cfoString >= cfoReq ? 1 : 0,
      guard: alpha <= 30 ? 1 : 0,
      ground: vChain < p.cfo ? 1 : 0,
      uc: p.uc >= ucReq ? 1 : 0,
      tov: ueq <= cap ? 1 : 0,
      marginOk,
    };
    const all = Object.values(checks).reduce((a, b) => a * b, 1);
    return { delta, uf, fugaReq, nFuga, cfoReq, nMan, n, length, cfoString, alpha, vt, vChain, ucReq, uTov, ueq, cap, uEff, margin, ...checks, all };
  },
  liveStatus: (_p, d) => ({
    tone: d.all ? 'ok' : 'bad',
    badge: d.all ? '✓ PROYECTO COORDINADO' : '✕ PROYECTO NO COORDINADO',
    message: d.all
      ? `Las 6 verificaciones pasan: cadena ${fmt(d.n, 0)} discos, α ${fmt(d.alpha, 1)}°, V_cadena ${fmt(d.vChain, 0)} kV < CFO ${fmt(d.cfoString, 0)} kV y margen ${fmt(d.margin, 1)} %.`
      : `Al menos un criterio está en rojo. Un valor verde por separado no compensa otro en rojo: revisa la lista de verificaciones.`,
  }),
  readings: (d, p) => [
    { label: 'Altitud y densidad', value: `${fmt(p.h, 0)} m · δ = ${fmt(d.delta, 3)}`, sub: `T = ${fmt(p.temp, 0)} °C` },
    { label: 'Cadena dimensionada', value: `${fmt(d.n, 0)} discos · ${fmt(d.length, 2)} m`, sub: `fuga ${fmt(d.nFuga, 0)} · maniobra ${fmt(d.nMan, 0)}` },
    {
      label: 'CFO instalado / requerido',
      value: `${fmt(d.cfoString, 0)} / ${fmt(d.cfoReq, 0)} kV`,
      sub: 'maniobra corregida por altitud',
      tone: d.chain ? 'ok' : 'bad',
    },
    { label: 'Ángulo de guarda', value: `${fmt(d.alpha, 1)}°`, sub: 'referencia ≤ 30°', tone: d.guard ? 'ok' : 'bad' },
    {
      label: 'Tensión sobre cadena (rayo)',
      value: `${fmt(d.vChain, 0)} kV`,
      sub: `frente a CFO elegido ${fmt(p.cfo, 0)} kV`,
      tone: d.ground ? 'ok' : 'bad',
    },
    {
      label: 'Margen del descargador',
      value: `${fmt(d.margin, 1)} %`,
      sub: `U_equipo ${fmt(d.uEff, 0)} · BIL ${fmt(p.bil, 0)}`,
      tone: d.marginOk ? 'ok' : 'bad',
    },
    { label: 'Proyecto completo', value: d.all ? 'coordinado' : 'revisar', sub: d.all ? '6/6 verificaciones' : 'al menos una falla', tone: d.all ? 'ok' : 'bad' },
  ],
  equations: (p, d) => [
    `L_f = ${fmt(p.kf, 0)} × ${fmt(p.um, 1)} = ${fmt(d.fugaReq, 0)} mm → N_fuga = ${fmt(d.nFuga, 0)}`,
    `CFO_req = (1,15 × 2,5 × Û_f)/(1 − 1,3 × 0,06)/δ = ${fmt(d.cfoReq, 0)} kV → N_maniobra = ${fmt(d.nMan, 0)}`,
    `N = máx(${fmt(d.nFuga, 0)}, ${fmt(d.nMan, 0)}) = ${fmt(d.n, 0)} · L = ${fmt(d.n, 0)} × ${fmt(p.paso, 3)} = ${fmt(d.length, 2)} m`,
    `α = arctan(${fmt(p.dx, 1)}/${fmt(p.dh, 1)}) = ${fmt(d.alpha, 1)}° · V_cadena = (${fmt(p.rt, 1)}×${fmt(p.iRayo, 0)} + ${fmt(p.didt, 0)})·(1 − ${fmt(p.kc, 2)}) = ${fmt(d.vChain, 0)} kV`,
    `U_c ≥ 1,05·U_f = ${fmt(d.ucReq, 1)} kV · U_eq = ${fmt(d.ueq, 1)} ≤ ${fmt(d.cap, 1)} kV · M = (${fmt(p.bil, 0)}/${fmt(d.uEff, 0)} − 1)·100 = ${fmt(d.margin, 1)} %`,
  ],
  checks: (p, d) => [
    { label: 'Cadena: CFO instalado ≥ CFO requerido', ok: d.chain === 1, detail: `${fmt(d.cfoString, 0)} ≥ ${fmt(d.cfoReq, 0)} kV` },
    { label: 'Guarda: α ≤ 30°', ok: d.guard === 1, detail: `${fmt(d.alpha, 1)}°` },
    { label: 'Tierra y rayo: V_cadena < CFO elegido', ok: d.ground === 1, detail: `${fmt(d.vChain, 0)} < ${fmt(p.cfo, 0)} kV` },
    { label: 'Descargador: U_c ≥ 1,05·U_f', ok: d.uc === 1, detail: `${fmt(p.uc, 0)} ≥ ${fmt(d.ucReq, 1)} kV` },
    { label: 'Descargador: TOV equivalente ≤ capacidad', ok: d.tov === 1, detail: `${fmt(d.ueq, 1)} ≤ ${fmt(d.cap, 1)} kV` },
    { label: 'Equipo: margen ≥ 20 %', ok: d.marginOk === 1, detail: `${fmt(d.margin, 1)} %` },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Haz que las 6 verificaciones pasen (proyecto coordinado)',
      tip: 'Pulsa «Proyecto coordinado (245 kV, 2.640 m)» o corrige uno por uno los semáforos rojos.',
      test: (_p, d) => d.all === 1,
      detail: (_p, d) => `6/6 · N = ${fmt(d.n, 0)} discos · M = ${fmt(d.margin, 0)} %`,
    },
    {
      id: 'g2',
      label: 'Logra el proyecto coordinado con α ≤ 25° y margen ≥ 40 %',
      tip: 'Desde el proyecto coordinado, baja Δx a ~2,5 m (α ≈ 22,6°) y acerca el pararrayos a 1–2 m.',
      test: (_p, d) => d.all === 1 && d.alpha <= 25 && d.margin >= 40,
      detail: (_p, d) => `α = ${fmt(d.alpha, 1)}° · M = ${fmt(d.margin, 1)} %`,
    },
  ],
  learn: {
    analogy:
      'Es el control técnico de un avión antes de despegar: motores, alas, tren, instrumentos, pista y clima. Que cinco luces estén en verde no autoriza el despegue si la sexta está en rojo.',
    phenomenon:
      'La coordinación de aislamiento no es la suma de componentes óptimos por separado: cadena, altitud, guarda, tierra y descargador se condicionan entre sí. Un solo criterio en rojo invalida el proyecto.',
    objective:
      'Ejecutar el ciclo completo de verificación y explicar por qué cambiar una pieza obliga a revisar las demás.',
    watch: [
      'La escena recorre la línea completa de la nube al transformador y colorea cada semáforo según su verificación.',
      'El diagrama de barras compara esfuerzo (rojo) contra capacidad soportada (verde) en tres frentes: maniobra, rayo y equipo.',
      'Cambia solo Δx o solo dArr: observa cuántas comprobaciones se mueven a la vez.',
    ],
    misconception:
      'Presentar un cálculo aislado como solución. La cifra verde en un renglón no compensa un rojo en otro: el proyecto es el conjunto.',
    model: 'Modelos didácticos de los experimentos anteriores (ajuste CFO–N, TOV equivalente, suma inductiva). Factores 1,05 / 1,15 / 1,25 / 20 % son hipótesis del ejercicio.',
  },
  sources: ['expo77', 'expo39', 'guion', 'slides', 'cardona', 'pararrayos', 'velasco', 'iec60071'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      legend={[
        { color: PAL.ok, label: 'Verificación aprobada' },
        { color: PAL.bad, label: 'Verificación fallida' },
        { color: PAL.phase, label: 'Línea de 245 kV energizada' },
      ]}
      draw={(ctx, w, h) => {
        environment(ctx, w, h, { mood: 'storm', groundY: h * 0.82, mountains: false });
        soilCutaway(ctx, 0, h * 0.82, w, h * 0.18, { layers: 2 });
        stormCloud(ctx, w * 0.16, h * 0.14, w * 0.36, 0.7);
        sceneHeader(ctx, 'Proyecto integral: nube → torre → subestación', d.all ? '6/6 VERIFICACIONES EN VERDE' : 'REVISAR SEMÁFOROS EN ROJO', true);

        const gy = h * 0.82;
        const tx = w * 0.34;
        const th = h * 0.54;
        latticeTower(ctx, tx, gy, th, { color: PAL.steelLight, arms: [{ yFrac: 0.78, half: w * 0.1 }] });
        const guardY = gy - th;
        const armY = gy - th * 0.78;
        const chain = insulatorString(ctx, tx + w * 0.1, armY, 7, h * 0.16, 0, { dark: true, discRadius: 8, flashover: d.ground === 0, t: t * 4 });
        line(ctx, w * 0.05, guardY + 5, tx, guardY, { color: PAL.guardBright, width: 1.8 });
        line(ctx, tx, guardY, w * 0.68, guardY + 5, { color: PAL.guardBright, width: 1.8 });
        line(ctx, chain.endX, chain.endY + 4, w * 0.68, chain.endY + 4, { color: PAL.phaseBright, width: 2.2 });
        circle(ctx, tx, guardY, 4, { fill: PAL.guardBright });
        groundSymbol(ctx, tx, gy + 2, 9, PAL.copper);
        technician(ctx, w * 0.2, gy, h * 0.12, '#DCEBFA');

        if (d.ground === 0) electricArc(ctx, tx + 8, armY, chain.endX, chain.endY, t * 5, PAL.badBright, 2);
        const rayU = (t * 0.4) % 1;
        electricArc(ctx, w * 0.16 + 6, h * 0.2, tx, guardY + rayU * (gy - guardY) * 0.28, t * 4, PAL.surgeBright, 1.8);
        glow(ctx, tx, guardY, 22, PAL.surgeBright, 0.28);

        // Subestación con descargador y transformador
        const ax = w * 0.7;
        surgeArrester(ctx, ax, guardY + 10, gy, { active: d.marginOk === 1, t });
        powerTransformer(ctx, w * 0.88, gy, w * 0.14, h * 0.22, { alert: d.marginOk === 0, label: `BIL ${fmt(p.bil, 0)}` });
        line(ctx, w * 0.68, chain.endY + 4, ax, guardY + 10, { color: PAL.phaseBright, width: 2 });
        line(ctx, ax, guardY + 10, w * 0.88 - w * 0.02, guardY + 10, { color: PAL.phaseBright, width: 2 });
        dimension(ctx, ax, guardY - 4, w * 0.88 - w * 0.02, guardY - 4, `d = ${fmt(p.dArr, 1)} m`, PAL.warnBright, true);

        // Tablero de 6 semáforos
        const bx = w * 0.56;
        const by = h * 0.36;
        const rows: [string, number][] = [
          ['Cadena / CFO', d.chain],
          ['Guarda α', d.guard],
          ['Tierra / rayo', d.ground],
          ['U_c descargador', d.uc],
          ['TOV catálogo', d.tov],
          ['Margen M', d.marginOk],
        ];
        rows.forEach(([label, ok], i) => {
          const yy = by + i * 19;
          circle(ctx, bx, yy, 5, { fill: ok ? PAL.okBright : PAL.badBright });
          text(ctx, `${ok ? '✓' : '✕'} ${label}`, bx + 12, yy, { size: 9.6, color: ok ? PAL.okBright : PAL.badBright, mono: true });
        });
        pill(ctx, d.all ? '✓ PROYECTO COORDINADO' : '✕ FALTA AL MENOS UN CRITERIO', bx, by + rows.length * 19 + 10, {
          color: d.all ? PAL.okBright : PAL.badBright,
          dark: true,
          size: 10.5,
        });
        arrow(ctx, w * 0.68, chain.endY + 4, ax - 8, chain.endY + 4, PAL.phaseBright, 1.4);
      }}
      footer={
        <>
          <strong>La línea completa en una sola mirada:</strong> rayo, guarda, cadena, tierra, pararrayos y transformador. Un semáforo rojo basta para rechazar el diseño.
        </>
      }
    />
  ),
  plot: ({ p, d }) => (
    <BarComparisonPlot
      groups={[
        { label: 'Maniobra en altura', stress: d.cfoReq, withstand: d.cfoString },
        { label: 'Rayo en la torre', stress: d.vChain, withstand: p.cfo },
        { label: 'Equipo / BIL', stress: d.uEff, withstand: p.bil },
      ]}
      caption={`Barras rojas = esfuerzo exigido; verdes = capacidad soportada. Se comparan peras con peras y en kV de cresta. δ = ${fmt(d.delta, 3)}, N = ${fmt(d.n, 0)} discos, α = ${fmt(d.alpha, 1)}°, M = ${fmt(d.margin, 1)} %.`}
    />
  ),
};

/* =============================== e19 =============================== */

const stateOf = (p: Params) => ({
  conductionUA: p.ic,
  absorptionUA: p.ia,
  absTau: p.tau,
  testV: p.vtest,
});

const e19: Experiment = {
  id: 'e19',
  topicId: 11,
  contextLabel: 'Megóhmetro en un transformador',
  title: 'Medir el aislamiento: la aguja cuenta una historia',
  tagline: 'Corriente de carga, absorción y fuga: índices DAR y PI en una curva R(t)',
  why: 'Interpretar una medición de resistencia de aislamiento y no confundir un valor bajo con su causa.',
  params: [
    {
      id: 'ic',
      group: 'Corrientes internas',
      label: 'Corriente de conducción / fuga',
      unit: 'µA',
      min: 0.2,
      max: 40,
      step: 0.1,
      def: 1,
      decimals: 1,
      help: 'Aumenta con humedad, suciedad y envejecimiento.',
    },
    {
      id: 'ia',
      group: 'Corrientes internas',
      label: 'Corriente de absorción inicial',
      unit: 'µA',
      min: 5,
      max: 80,
      step: 1,
      def: 45,
    },
    {
      id: 'tau',
      group: 'Corrientes internas',
      label: 'Constante de absorción',
      unit: 's',
      min: 5,
      max: 120,
      step: 1,
      def: 25,
    },
    {
      id: 'vtest',
      group: 'Condiciones del ensayo',
      label: 'Tensión de ensayo',
      unit: 'V',
      min: 500,
      max: 5000,
      step: 100,
      def: 5000,
    },
    {
      id: 'temp',
      group: 'Condiciones del ensayo',
      label: 'Temperatura del devanado',
      unit: '°C',
      min: 0,
      max: 60,
      step: 1,
      def: 25,
    },
    {
      id: 'hum',
      group: 'Condiciones del ensayo',
      label: 'Humedad relativa',
      unit: '%',
      min: 20,
      max: 95,
      step: 1,
      def: 55,
    },
  ],
  presets: [
    {
      id: 'sano',
      label: 'Aislamiento sano (seco y limpio)',
      note: 'R sigue subiendo: DAR ≥ 1,6 y PI alto. La absorción decae con ley de potencia (1+t/τ)^−1,2.',
      values: { ic: 0.6, ia: 45, tau: 25, vtest: 5000, temp: 25, hum: 50 },
    },
    {
      id: 'humedo',
      label: 'Aislamiento húmedo y sucio',
      note: 'La corriente de fuga domina: DAR < 1,25 y R60 baja. Con 88 % de humedad el ensayo no es concluyente.',
      values: { ic: 30, ia: 30, tau: 25, vtest: 5000, temp: 25, hum: 88 },
    },
    {
      id: 'viejo',
      label: 'Envejecido, con fugas',
      note: 'Menos absorción, más conducción y temperatura alta: la R corregida a 20 °C cambia bastante.',
      values: { ic: 5, ia: 12, tau: 20, vtest: 2500, temp: 45, hum: 60 },
    },
  ],
  compute: (p) => {
    const st = stateOf(p);
    const r30 = insulationResistance(30, st);
    const r60 = insulationResistance(60, st);
    const r10 = insulationResistance(600, st);
    const darV = dar(st);
    const piV = piIndex(st);
    const rCorr = correctTo20(r60, p.temp);
    const invalid = p.hum > 80 || p.temp < 0 ? 1 : 0;
    return { r30, r60, r10, dar: darV, pi: piV, rCorr, invalid, darOk: darV >= 1.25 ? 1 : 0 };
  },
  liveStatus: (p, d) => ({
    tone: d.invalid ? 'warn' : d.dar >= 1.6 && d.pi >= 4 ? 'ok' : d.dar < 1.25 ? 'bad' : 'warn',
    badge: d.invalid ? 'ENSAYO NO CONCLUYENTE' : d.dar >= 1.6 && d.pi >= 4 ? '✓ AISLAMIENTO SANO' : d.dar < 1.25 ? '✕ POSIBLE HUMEDAD / FUGA' : 'ESTADO INTERMEDIO',
    message: d.invalid
      ? `Con ${fmt(p.hum, 0)} % de humedad la superficie puede dominar la lectura: seca, limpia y repite antes de diagnosticar.`
      : `DAR = ${fmt(d.dar, 2)} y PI = ${fmt(d.pi, 2)}. R60 = ${fmt(d.r60, 0)} MΩ; corregida a 20 °C queda en ${fmt(d.rCorr, 0)} MΩ.`,
  }),
  readings: (d, p) => [
    { label: 'R a 30 s / 60 s', value: `${fmt(d.r30, 0)} / ${fmt(d.r60, 0)} MΩ`, sub: `a ${fmt(p.vtest, 0)} V de ensayo` },
    { label: 'R a 10 min', value: `${fmt(d.r10, 0)} MΩ`, sub: 'cerca del valor estable de fuga' },
    {
      label: 'DAR = R₆₀/R₃₀',
      value: fmt(d.dar, 2),
      sub: d.dar < 1.25 ? 'insuficiente' : d.dar < 1.6 ? 'aceptable' : 'excelente',
      tone: d.dar < 1.25 ? 'bad' : d.dar < 1.6 ? 'warn' : 'ok',
    },
    {
      label: 'PI = R₁₀ₘᵢₙ/R₁ₘᵢₙ',
      value: fmt(d.pi, 2),
      sub: d.pi < 2 ? 'problema potencial' : d.pi > 4 ? 'excelente' : 'aceptable',
      tone: d.pi < 2 ? 'bad' : d.pi > 4 ? 'ok' : 'warn',
    },
    { label: 'R₆₀ corregida a 20 °C', value: `${fmt(d.rCorr, 0)} MΩ`, sub: 'se duplica por cada −10 °C' },
    {
      label: 'Condiciones del ensayo',
      value: d.invalid ? 'no concluyente' : 'válidas',
      sub: d.invalid ? 'humedad > 80 %: domina la superficie' : 'temperatura y humedad declaradas',
      tone: d.invalid ? 'bad' : 'ok',
    },
  ],
  equations: (p, d) => [
    `i(t) = I_conducción + I_absorción·(1 + t/τ)^−1,2 + I_carga capacitiva (τ = ${fmt(p.tau, 0)} s)`,
    `R(t) = V_ensayo / i(t) → R₃₀ = ${fmt(d.r30, 1)} MΩ · R₆₀ = ${fmt(d.r60, 1)} MΩ · R₆₀₀ = ${fmt(d.r10, 1)} MΩ`,
    `DAR = R₆₀/R₃₀ = ${fmt(d.dar, 2)} · PI = R₆₀₀/R₆₀ = ${fmt(d.pi, 2)}`,
    `R(20 °C) = R_medida · 2^((T − 20)/10) = ${fmt(d.rCorr, 0)} MΩ (T = ${fmt(p.temp, 0)} °C)`,
    'Un valor bajo y estable sugiere fuga; un valor que sigue subiendo sugiere aislamiento sano. La tendencia importa tanto como el número.',
  ],
  checks: (p, d) => [
    { label: 'Se distingue prueba dieléctrica de medición de resistencia', ok: true, detail: 'la medición es no destructiva' },
    { label: 'Se corrigen las condiciones de temperatura', ok: true, detail: `R(20 °C) = ${fmt(d.rCorr, 0)} MΩ` },
    { label: 'La humedad y el punto de rocío se consideran', ok: d.invalid === 0, detail: d.invalid ? `${fmt(p.hum, 0)} %: ensayo no concluyente` : 'condiciones declaradas' },
    { label: 'Los umbrales de PI no se aplican igual a todos los equipos', ok: true, info: true, detail: 'la guía lo advierte' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Ajusta un aislamiento sano: DAR ≥ 1,6 y R₆₀ ≥ 100 MΩ',
      tip: 'Pulsa «Aislamiento sano (seco y limpio)» o baja la corriente de fuga I_c.',
      test: (_p, d) => d.dar >= 1.6 && d.r60 >= 100,
      detail: (_p, d) => `DAR = ${fmt(d.dar, 2)} · R₆₀ = ${fmt(d.r60, 0)} MΩ`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Reproduce un caso húmedo: DAR < 1,25 y R₆₀ < 150 MΩ',
      tip: 'Pulsa «Aislamiento húmedo y sucio» o sube I_c por encima de 25 µA.',
      test: (_p, d) => d.dar < 1.25 && d.r60 < 150,
      detail: (_p, d) => `DAR = ${fmt(d.dar, 2)} · R₆₀ = ${fmt(d.r60, 0)} MΩ`,
    },
  ],
  quiz: {
    question: 'Un motor de 5 kV se mide con 5.000 V: R30 = 90 MΩ, R60 = 98 MΩ y R10min = 140 MΩ. La temperatura es 25 °C y la humedad 88 %. ¿Cuál es la lectura más defendible?',
    options: [
      { id: 'a', label: 'Aislamiento húmedo o contaminado en la superficie: el DAR es bajo y el ensayo está afectado por la humedad.' },
      { id: 'b', label: 'El aislamiento está sano porque R10min es mayor que R30.' },
      { id: 'c', label: 'Hay una perforación franca del devanado.' },
      { id: 'd', label: 'El megóhmetro está mal calibrado porque la resistencia sube con el tiempo.' },
    ],
    correct: 'a',
    explanation:
      'DAR = 98/90 = 1,09 (< 1,25) y PI es bajo: la corriente de fuga domina sobre la absorción, típico de humedad o contaminación superficial. Con 88 % de humedad el ensayo no es concluyente: hay que secar, limpiar y repetir. Una perforación daría un valor muy bajo y estable, no este patrón.',
  },
  learn: {
    analogy:
      'Al aplicar el megóhmetro, el aislamiento se comporta como una esponja: al principio absorbe corriente y la «resistencia» parece baja; con los segundos se satura y la lectura sube. Si la esponja está empapada (humedad), la aguja casi no se mueve.',
    phenomenon:
      'Al aplicar tensión continua, la corriente total tiene tres partes: carga capacitiva, absorción dieléctrica y fuga. La resistencia aparente crece con el tiempo según una ley de potencia; cómo crece revela el estado del aislamiento.',
    objective:
      'Interpretar R(t), calcular DAR y PI, corregir por temperatura y distinguir humedad superficial de daño interno.',
    watch: [
      'La pantalla del megóhmetro muestra la lectura en el instante animado; compara 30 s, 60 s y 10 min en la gráfica logarítmica.',
      'Sube la corriente de conducción y mira cómo DAR y PI caen aunque la absorción sea la misma.',
      'Cambia a 88 % de humedad: el estado pasa a «ensayo no concluyente» y se recomienda repetir.',
    ],
    misconception:
      'Diagnosticar con un solo valor puntual, sin temperatura ni humedad, o aplicar los umbrales de PI a cualquier equipo. Tampoco es correcto escribir la absorción como e^(−t/τ): aquí se usa (1+t/τ)^−1,2.',
    model: 'Modelo de tres corrientes con absorción en ley de potencia (1+t/τ)^−1,2. Umbrales de la guía: DAR < 1,25 insuficiente; PI < 2 problema potencial.',
  },
  sources: ['expo77', 'expo39', 'medicion', 'guion', 'slides'],
  scene: ({ p, d, t }) => {
    const st = stateOf(p);
    const elapsed = 1 + ((t * 0.8) % 1) * 599;
    const liveR = insulationResistance(elapsed, st);
    const currents = insulationCurrents(elapsed, st);
    return (
      <SceneCanvas
        legend={[
          { color: PAL.phase, label: 'Corriente de absorción (decae)' },
          { color: PAL.bad, label: 'Corriente de fuga (estable)' },
          { color: PAL.ok, label: 'Resistencia aparente R(t) que sube' },
        ]}
        draw={(ctx, w, h) => {
          environment(ctx, w, h, { mood: 'lab' });
          sceneHeader(ctx, 'Megóhmetro conectado a un transformador', `${fmt(p.vtest, 0)} V CC · ${fmt(p.temp, 0)} °C · ${fmt(p.hum, 0)} % HR`);

          // Transformador y cables de prueba
          const gy = h * 0.84;
          const trafo = powerTransformer(ctx, w * 0.24, gy, w * 0.22, h * 0.34, {
            alert: d.dar < 1.25,
            label: 'DEVANADO BAJO PRUEBA',
          });
          groundSymbol(ctx, w * 0.24, gy + 2, 10, PAL.copper);

          // Instrumento de medición con pantalla y aguja
          const ix = w * 0.55;
          const iy = h * 0.13;
          const iw = w * 0.38;
          const ih = h * 0.62;
          scopeScreen(ctx, ix, iy, iw, ih, { title: 'MEGÓHMETRO · LECTURA R(t)' });
          const screenX = ix + 16;
          const screenY = iy + 22;
          const screenW = iw - 32;
          const screenH = ih * 0.42;
          ctx.save();
          ctx.fillStyle = 'rgba(20, 50, 40, 0.92)';
          ctx.beginPath();
          ctx.roundRect(screenX, screenY, screenW, screenH, 6);
          ctx.fill();
          ctx.restore();
          text(ctx, `${fmt(liveR, 0)} MΩ`, screenX + screenW / 2, screenY + 22, {
            size: 20,
            weight: 700,
            color: '#7BE3C8',
            align: 'center',
            mono: true,
          });
          text(ctx, `t = ${fmt(elapsed, 0)} s`, screenX + screenW / 2, screenY + 44, {
            size: 10.5,
            color: '#A9C0D6',
            align: 'center',
            mono: true,
          });

          // Aguja semicircular
          const needleCx = screenX + screenW / 2;
          const needleCy = screenY + screenH - 8;
          const needleR = Math.min(screenW * 0.34, screenH * 0.7);
          const frac = clamp(Math.log10(Math.max(1, liveR)) / Math.log10(Math.max(10, d.r10)), 0.04, 0.96);
          const ang = Math.PI - frac * Math.PI;
          circle(ctx, needleCx, needleCy, needleR, { stroke: 'rgba(123,227,200,0.35)', width: 1.2, dash: [3, 4] });
          arrow(ctx, needleCx, needleCy, needleCx + Math.cos(ang) * needleR, needleCy - Math.sin(ang) * needleR, PAL.okBright, 2);
          circle(ctx, needleCx, needleCy, 4, { fill: PAL.okBright });

          // Barras de corrientes
          const barY = iy + ih - 34;
          const maxI = Math.max(1, currents.total);
          line(ctx, ix + 18, barY, ix + 18 + (currents.ic / maxI) * (iw - 36), barY, { color: PAL.bad, width: 8, cap: 'butt' });
          line(ctx, ix + 18, barY + 14, ix + 18 + (currents.ia / maxI) * (iw - 36), barY + 14, { color: PAL.phase, width: 8, cap: 'butt' });
          text(ctx, `fuga ${fmt(currents.ic, 1)} µA`, ix + 18, barY - 12, { size: 9.2, color: PAL.bad, mono: true });
          text(ctx, `absorción ${fmt(currents.ia, 1)} µA`, ix + 18, barY + 28, { size: 9.2, color: PAL.phase, mono: true });

          // Cables y resultado
          line(ctx, trafo.bushingX, trafo.bushingY, ix + 8, iy + ih * 0.5, { color: PAL.bad, width: 1.8 });
          line(ctx, w * 0.24, gy, ix + 8, iy + ih * 0.72, { color: PAL.copper, width: 1.8 });
          pill(ctx, `DAR ${fmt(d.dar, 2)} · PI ${fmt(d.pi, 2)}`, ix, iy + ih + 14, { color: d.dar >= 1.6 ? PAL.ok : PAL.warn, mono: true, size: 10.5 });
          pill(ctx, d.invalid ? 'Repetir: humedad alta' : 'Ensayo válido', ix + iw, iy + ih + 14, {
            color: d.invalid ? PAL.bad : PAL.ok,
            align: 'right',
            mono: true,
            size: 10.5,
          });
        }}
        footer={
          <>
            <strong>La aguja sube con el tiempo:</strong> eso es bueno. Si se queda casi quieta en un valor bajo, domina la <strong>fuga</strong> y hay que revisar humedad o suciedad.
          </>
        }
      />
    );
  },
  plot: ({ p, d }) => {
    const st = stateOf(p);
    const pts: [number, number][] = logspace(1, 600, 180).map((tt) => [tt, Math.max(0.1, insulationResistance(tt, st))]);
    return (
      <Plot
        xDomain={[1, 600]}
        yDomain={[1, Math.max(4000, d.r10 * 1.5)]}
        xLog
        yLog
        xLabel="Tiempo de medición (s — escala logarítmica)"
        yLabel="Resistencia de aislamiento R(t) (MΩ — escala log)"
        series={[{ pts, color: PAL.ok, width: 2.4, area: true, label: 'R(t) = V / i(t)' }]}
        refs={[
          { at: 30, label: '30 s (DAR)', color: PAL.phase, dash: '3 4', axis: 'x' },
          { at: 60, label: '60 s (DAR / PI)', color: PAL.warn, dash: '3 4', axis: 'x' },
          { at: 600, label: '10 min (PI)', color: PAL.surge, dash: '3 4', axis: 'x' },
        ]}
        markers={[
          { x: 30, y: d.r30, color: PAL.phase, label: `R30 ${fmt(d.r30, 0)}` },
          { x: 60, y: d.r60, color: PAL.warn, label: `R60 ${fmt(d.r60, 0)}` },
          { x: 600, y: d.r10, color: PAL.surge, label: `R10min ${fmt(d.r10, 0)}` },
        ]}
        caption={`Escala logarítmica en MΩ para leer cómodamente 30 s, 60 s y 10 min. DAR = ${fmt(d.dar, 2)} · PI = ${fmt(d.pi, 2)} · R60 corregida a 20 °C = ${fmt(d.rCorr, 0)} MΩ.`}
      />
    );
  },
};

export const protection2Experiments: Experiment[] = [e16, e17, e18, e19];
