import {
  airDensity,
  bundleEquivalentRadius,
  clamp,
  cfoFromInsulators,
  cfoRequired,
  coronaInception,
  creepageRequired,
  fmt,
  insulatorsFromCfo,
  linspace,
  peekLoss,
} from '../../lib/num';
import { PAL, arrow, circle, electricArc, environment, glow, groundSymbol, insulatorString, latticeTower, line, pill, powerTransformer, sceneHeader, soilCutaway, stormCloud, surgeArrester, technician, text } from '../../lib/draw';
import { BarComparisonPlot, Plot, SceneCanvas } from '../../components/ui';
import type { Experiment } from '../types';

/* =============================== e16 =============================== */

const e16: Experiment = {
  id: 'e16',
  topicId: 11,
  contextLabel: 'Niveles de aislamiento IEC 71-1',
  title: 'Coordinación IEC 71-1: del descargador al BIL',
  tagline: 'BIL = Kᵢ·NPR → BIL_n normalizado → BSL = K·BIL_n → K_b = BSL/NPM ≥ K_m',
  why: 'Ejecutar el procedimiento completo de la lámina 17: obtener los niveles del descargador, normalizar el BIL y verificar la exigencia de maniobras antes de especificar.',
  params: [
    {
      id: 'npr',
      group: 'Descargador (datos de catálogo)',
      label: 'Nivel de protección ante rayo (NPR)',
      unit: 'kV cresta',
      min: 400,
      max: 1400,
      step: 25,
      def: 600,
      help: 'Las láminas no fijan valores: son datos del descargador real. 600 kV es un valor ilustrativo.',
    },
    {
      id: 'npm',
      group: 'Descargador (datos de catálogo)',
      label: 'Nivel de protección ante maniobra (NPM)',
      unit: 'kV cresta',
      min: 300,
      max: 1200,
      step: 25,
      def: 500,
      help: 'Análogo al NPR pero para el frente lento de maniobra (2–20 kHz, lámina 5). Valor ilustrativo.',
    },
    {
      id: 'ki',
      group: 'Factores de seguridad',
      label: 'K_i (relacione BIL y NPR)',
      min: 1.2,
      max: 1.4,
      step: 0.01,
      def: 1.25,
      decimals: 2,
      help: 'Rango 1,2–1,4; valor común 1,25; para niveles < 52 kV se usa 1,4 (lámina 16).',
    },
    {
      id: 'km',
      group: 'Factores de seguridad',
      label: 'K_m (relaciona BSL y NPM)',
      min: 1.05,
      max: 1.3,
      step: 0.01,
      def: 1.15,
      decimals: 2,
      help: 'Valor común 1,15 (lámina 16).',
    },
    {
      id: 'k',
      group: 'Equipo',
      label: 'K = BSL / BIL',
      min: 0,
      max: 1,
      step: 1,
      def: 0,
      options: [
        { value: 0, label: 'Aire · K = 0,75' },
        { value: 1, label: 'Aceite · K = 0,83' },
      ],
      help: '0,83 para equipos aislados en aceite; 0,75 para equipos aislados en aire (lámina 15).',
    },
    {
      id: 'biln',
      group: 'Selección',
      label: 'BIL normalizado elegido (BIL_n)',
      unit: 'kV cresta',
      min: 550,
      max: 1550,
      step: 25,
      def: 750,
      help: 'Se elige de la serie normalizada vigente ≥ BIL (la serie no aparece en las láminas; aquí es un deslizador ilustrativo).',
    },
  ],
  presets: [
    {
      id: 'partida',
      label: 'Punto de partida (falla en maniobras)',
      note: 'NPR = 600 → BIL = 1,25 × 600 = 750 kV. Con BIL_n = 750 y K = 0,75 (aire): BSL = 562,5 y K_b = 1,125 < 1,15. Hay que incrementar BIL_n.',
      values: { npr: 600, npm: 500, ki: 1.25, km: 1.15, k: 0, biln: 750 },
    },
    {
      id: 'aceite',
      label: 'Equipo en aceite (K = 0,83)',
      note: 'Con el mismo BIL_n = 750, en aceite BSL = 622,5 → K_b = 1,245 ≥ 1,15: se especifica BIL.',
      values: { npr: 600, npm: 500, ki: 1.25, km: 1.15, k: 1, biln: 750 },
    },
    {
      id: 'npr900',
      label: 'Descargador mayor (NPR = 900, NPM = 700)',
      note: 'BIL = 1,25 × 900 = 1.125 kV; BIL_n = 1.150 → BSL = 862,5 → K_b = 1,232 ≥ 1,15.',
      values: { npr: 900, npm: 700, ki: 1.25, km: 1.15, k: 0, biln: 1150 },
    },
  ],
  compute: (p) => {
    const k = p.k === 0 ? 0.75 : 0.83;
    const bil = p.ki * p.npr;
    const bilOk = p.biln >= bil - 1e-9 ? 1 : 0;
    const bsl = k * p.biln;
    const kb = bsl / Math.max(1e-9, p.npm);
    const kbOk = kb >= p.km ? 1 : 0;
    const especificar = bilOk === 1 && kbOk === 1 ? 1 : 0;
    return { k, bil, bilOk, bsl, kb, kbOk, especificar };
  },
  liveStatus: (p, d) => ({
    tone: d.especificar ? 'ok' : 'bad',
    badge: d.especificar ? `✓ BIL ESPECIFICADO: ${fmt(p.biln, 0)} kV` : p.biln < d.bil ? '✕ BIL_n < BIL' : '✕ INCREMENTAR BIL_n',
    message: d.especificar
      ? `BIL_n = ${fmt(p.biln, 0)} kV ≥ BIL = ${fmt(d.bil, 0)} kV y K_b = ${fmt(d.kb, 3)} ≥ K_m = ${fmt(p.km, 2)}: el flujo termina en «ESPECIFICAR BIL» (lámina 17).`
      : p.biln < d.bil
        ? `BIL_n = ${fmt(p.biln, 0)} kV es menor que BIL = K_i·NPR = ${fmt(d.bil, 0)} kV: primero normaliza BIL_n ≥ BIL.`
        : `K_b = BSL/NPM = ${fmt(d.bsl, 0)}/${fmt(p.npm, 0)} = ${fmt(d.kb, 3)} < K_m = ${fmt(p.km, 2)}: el lazo «INCREMENTAR BIL_n» de la lámina 17 se repite hasta alcanzar K_b ≥ K_m.`,
  }),
  readings: (d, p) => [
    { label: 'NPR y NPM del descargador', value: `${fmt(p.npr, 0)} / ${fmt(p.npm, 0)} kV cresta`, sub: 'datos de catálogo (ilustrativos)' },
    { label: 'BIL = K_i · NPR', value: `${fmt(d.bil, 0)} kV cresta`, sub: `${fmt(p.ki, 2)} × ${fmt(p.npr, 0)} kV`, tone: 'neutral' },
    {
      label: 'BIL normalizado BIL_n',
      value: `${fmt(p.biln, 0)} kV cresta`,
      sub: d.bilOk ? '≥ BIL: válido' : '< BIL: elige uno mayor',
      tone: d.bilOk ? 'ok' : 'bad',
    },
    { label: 'BSL = K · BIL_n', value: `${fmt(d.bsl, 1)} kV cresta`, sub: `K = ${d.k === 0.75 ? '0,75 (aire)' : '0,83 (aceite)'}` },
    {
      label: 'K_b = BSL / NPM',
      value: fmt(d.kb, 3),
      sub: `≥ K_m = ${fmt(p.km, 2)} ?`,
      tone: d.kbOk ? 'ok' : 'bad',
    },
    {
      label: 'Veredicto del flujo',
      value: d.especificar ? 'ESPECIFICAR BIL' : 'INCREMENTAR BIL_n',
      sub: 'ramas del diagrama de la lámina 17',
      tone: d.especificar ? 'ok' : 'bad',
    },
  ],
  equations: (p, d) => [
    `1 · NPR = ${fmt(p.npr, 0)} kV · NPM = ${fmt(p.npm, 0)} kV (datos del descargador)`,
    `2 · K_i = ${fmt(p.ki, 2)} · K_m = ${fmt(p.km, 2)}`,
    `3 · BIL = K_i × NPR = ${fmt(p.ki, 2)} × ${fmt(p.npr, 0)} = ${fmt(d.bil, 0)} kV`,
    `4 · BIL_n = ${fmt(p.biln, 0)} kV ${d.bilOk ? '≥' : '<'} BIL`,
    `5 · BSL = K × BIL_n = ${d.k === 0.75 ? '0,75' : '0,83'} × ${fmt(p.biln, 0)} = ${fmt(d.bsl, 1)} kV`,
    `6 · K_b = BSL / NPM = ${fmt(d.bsl, 1)} / ${fmt(p.npm, 0)} = ${fmt(d.kb, 3)}  →  ${d.kbOk ? '≥' : '<'} K_m (${fmt(p.km, 2)})`,
    `7 · ${d.especificar ? 'K_b ≥ K_m: ESPECIFICAR BIL = BIL_n' : 'K_b < K_m: INCREMENTAR BIL_n y repetir desde el paso 5'}`,
  ],
  checks: (_p, d) => [
    { label: 'Los niveles van cresta con cresta', ok: true, detail: 'BIL, BSL, NPM y NPR son picos; nada en kV eficaces aquí' },
    { label: 'K se eligió según el medio aislante del equipo', ok: true, detail: d.k === 0.75 ? '0,75 aire' : '0,83 aceite' },
    { label: 'BIL_n ≥ BIL', ok: d.bilOk === 1, detail: `${fmt(d.bil, 0)} kV` },
    { label: 'K_b ≥ K_m', ok: d.kbOk === 1, detail: `K_b = ${fmt(d.kb, 3)} vs K_m = objetivo` },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Incrementa BIL_n hasta que K_b ≥ K_m (sin pasarte: 775 kV basta)',
      tip: 'Pulsa «Punto de partida» y sube BIL_n de 750 a 775 kV.',
      test: (_p, d) => d.especificar === 1 && _p.biln <= 775,
      detail: (_p, d) => `BIL_n = ${fmt(_p.biln, 0)} kV · K_b = ${fmt(d.kb, 3)}`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Cambia el equipo a aceite (K = 0,83) y observa que BSL crece con el mismo BIL_n',
      tip: 'Pulsa «Equipo en aceite (K = 0,83)».',
      test: (_p, d) => d.k === 0.83 && d.kbOk === 1,
      detail: (_p, d) => `BSL = ${fmt(d.bsl, 1)} kV · K_b = ${fmt(d.kb, 3)}`,
    },
  ],
  quiz: {
    question: 'Tras calcular BIL = K_i·NPR, ¿qué falta para especificar el BIL del equipo?',
    options: [
      { id: 'a', label: 'Convertirlo a kV eficaces y dar por terminada la selección.' },
      { id: 'b', label: 'Normalizar BIL_n ≥ BIL, calcular BSL = K·BIL_n y exigir K_b = BSL/NPM ≥ K_m; si no se cumple, incrementar BIL_n (lazo de la lámina 17).' },
      { id: 'c', label: 'Reducir el NPR del descargador hasta que BIL ≤ 500 kV.' },
      { id: 'd', label: 'Usar K = 0,83 sin importar el medio aislante del equipo.' },
    ],
    correct: 'b',
    explanation:
      'La lámina 17 muestra que el procedimiento no termina en BIL = K_i·NPR: BIL se normaliza a BIL_n ≥ BIL, se obtiene BSL = K·BIL_n con K = 0,75 (aire) o 0,83 (aceite) y se verifica K_b = BSL/NPM ≥ K_m = 1,15. Si la desigualdad falla, el lazo «INCREMENTAR BIL_n» se repite hasta que se cumple; solo entonces se especifica el BIL.',
  },
  learn: {
    analogy:
      'Es comprar zapatos en la talla comercial: 27,3 cm no la vende la tienda; llevas la talla normalizada siguiente. Y antes de salir, compruebas que el ajuste (maniobra) también te queda, no solo el largo de fábrica (rayo).',
    phenomenon:
      'El descargador limita la tensión que llega al equipo, pero el aislamiento se especifica en niveles normalizados. IEC 71-1 encadena cuatro comprobaciones cresta con cresta: BIL cubre el rayo con holgura K_i, BIL_n existe en la serie normalizada, BSL cubre la maniobra y K_b ≥ K_m lo confirma.',
    objective:
      'Recorrer el diagrama de la lámina 17, reconocer qué falla cuando K_b < K_m y decidir el incremento correcto de BIL_n.',
    watch: [
      'En la escena, el diagrama se enciende etapa por etapa; el rombo K_b ≥ K_m cambia de verde a rojo según el deslizador BIL_n.',
      'En la gráfica, la recta K_b(BIL_n) cruza a K_m al llegar a 775 kV; antes de ese punto no se puede especificar.',
      'Cambia K entre aire (0,75) y aceite (0,83): con el mismo BIL_n, en aceite el margen de maniobra es mayor.',
    ],
    misconception:
      'Especificar BIL = K_i·NPR sin normalizar ni verificar maniobra. El rayo puede estar cubierto y la maniobra, no: por eso el lazo de la lámina 17 es obligatorio.',
    model: 'Flujo de la lámina 17 de Sobretensiones (pp. 14–17): NPR/NPM → K_i, K_m → BIL → BIL_n ≥ BIL → BSL = K·BIL_n → K_b ≥ K_m. Las láminas no fijan valores numéricos ni la serie normalizada: NPR/NPM y la serie son ilustrativos.',
  },
  sources: ['expo39'],
  notes: ['Las láminas describen el procedimiento y los factores K, K_i y K_m; no dan ejemplos numéricos. NPR, NPM y la serie de BIL_n de esta escena son valores ilustrativos.'],
  scene: ({ p, d }) => {
    const stage = (ok: boolean | 'mid') => (ok === 'mid' ? '#F5B841' : ok ? '#0E9F6E' : '#D6362C');
    const box = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, title: string, sub: string, color: string, active: boolean) => {
      ctx.save();
      ctx.fillStyle = active ? 'rgba(255,255,255,0.96)' : 'rgba(255,255,255,0.55)';
      ctx.strokeStyle = color;
      ctx.lineWidth = active ? 2.4 : 1.3;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 8);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
      text(ctx, title, x + 8, y + 16, { size: 9.5, weight: 800, color: '#17324F' });
      text(ctx, sub, x + 8, y + 32, { size: 9.5, mono: true, color: '#17324F' });
    };
    return (
      <SceneCanvas
        legend={[
          { color: PAL.okBright, label: 'Etapa satisfecha' },
          { color: PAL.warnBright, label: 'Etapa en decisión' },
          { color: PAL.badBright, label: 'Etapa que exige incrementar BIL_n' },
        ]}
        draw={(ctx, w, h) => {
          environment(ctx, w, h, { mood: 'lab' });
          sceneHeader(ctx, 'Flujo IEC 71-1 (lámina 17)', `BIL = ${fmt(d.bil, 0)} kV · BIL_n = ${fmt(p.biln, 0)} kV · K_b = ${fmt(d.kb, 3)}`);
          const bw = Math.min(w * 0.2, 190);
          const bh = 44;
          const y1 = h * 0.2;
          const y2 = h * 0.52;
          const x1 = w * 0.05;
          const x2 = x1 + bw + w * 0.045;
          const x3 = x2 + bw + w * 0.045;
          const x4 = x3 + bw + w * 0.045;
          box(ctx, x1, y1, bw, bh, '1-2 · OBTENER NPR/NPM', `${fmt(p.npr, 0)} / ${fmt(p.npm, 0)} kV`, stage(true), true);
          box(ctx, x2, y1, bw, bh, '2 · K_i y K_m', `${fmt(p.ki, 2)} / ${fmt(p.km, 2)}`, stage(true), true);
          box(ctx, x3, y1, bw, bh, '3 · BIL = K_i·NPR', `${fmt(d.bil, 0)} kV`, stage(true), true);
          box(ctx, x4, y1, bw, bh, '4 · BIL_n normalizado', `${fmt(p.biln, 0)} kV ≥ ${fmt(d.bil, 0)}`, stage(d.bilOk === 1), d.bilOk !== 1);
          box(ctx, x4, y2, bw, bh, '5 · BSL = K·BIL_n', `${fmt(d.bsl, 1)} kV`, stage(d.bilOk === 1), true);
          box(ctx, x3, y2, bw, bh, '6 · K_b = BSL/NPM', `${fmt(d.kb, 3)}`, stage(d.kb >= p.km), true);
          // Rombo de decisión
          const cx = x2 + bw / 2;
          const cy = y2 + bh / 2;
          const rw = bw * 0.78;
          const rh = bh * 1.05;
          ctx.save();
          ctx.fillStyle = d.kb >= p.km ? 'rgba(14,159,110,0.16)' : 'rgba(214,54,44,0.14)';
          ctx.strokeStyle = d.kb >= p.km ? '#0E9F6E' : '#D6362C';
          ctx.lineWidth = 2.2;
          ctx.beginPath();
          ctx.moveTo(cx, cy - rh / 2);
          ctx.lineTo(cx + rw / 2, cy);
          ctx.lineTo(cx, cy + rh / 2);
          ctx.lineTo(cx - rw / 2, cy);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          text(ctx, 'K_b ≥ K_m?', cx, cy + 3, { size: 11, weight: 800, align: 'center', color: '#17324F' });
          // Caja final / lazo
          const finalOk = d.especificar === 1;
          box(ctx, x1, y2, bw, bh, finalOk ? '7 · ESPECIFICAR BIL' : '7 · INCREMENTAR BIL_n', finalOk ? `${fmt(p.biln, 0)} kV ✓` : 'repetir paso 5', stage(finalOk), !finalOk);
          // Flechas
          arrow(ctx, x1 + bw, y1 + bh / 2, x2, y1 + bh / 2, PAL.phase, 1.6);
          arrow(ctx, x2 + bw, y1 + bh / 2, x3, y1 + bh / 2, PAL.phase, 1.6);
          arrow(ctx, x3 + bw, y1 + bh / 2, x4, y1 + bh / 2, PAL.phase, 1.6);
          arrow(ctx, x4 + bw / 2, y1 + bh, x4 + bw / 2, y2, PAL.phase, 1.6);
          arrow(ctx, x4, y2 + bh / 2, x3 + bw, y2 + bh / 2, PAL.phase, 1.6);
          arrow(ctx, x3, y2 + bh / 2, cx + rw / 2, cy, PAL.phase, 1.6);
          arrow(ctx, cx - rw / 2, cy, x1 + bw, y2 + bh / 2, finalOk ? '#0E9F6E' : '#D6362C', 2);
          text(ctx, d.kb >= p.km ? 'SÍ' : 'NO', cx - rw / 2 - 16, cy - 6, { size: 9.5, weight: 800, color: d.kb >= p.km ? '#0E9F6E' : '#D6362C' });
          // Lazo de vuelta desde INCREMENTAR al paso 5
          if (!finalOk) {
            ctx.save();
            ctx.strokeStyle = '#D6362C';
            ctx.setLineDash([6, 5]);
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            ctx.moveTo(x1 + bw / 2, y2 + bh);
            ctx.lineTo(x1 + bw / 2, y2 + bh + h * 0.09);
            ctx.lineTo(x4 + bw / 2, y2 + bh + h * 0.09);
            ctx.lineTo(x4 + bw / 2, y2 + bh + 4);
            ctx.stroke();
            ctx.restore();
          }
          pill(ctx, `K_b = ${fmt(d.kb, 3)}`, w * 0.5, h * 0.12, { color: d.kb >= p.km ? PAL.okBright : PAL.badBright, align: 'center', mono: true, size: 12, dark: true });
        }}
        footer={
          <>
            <strong>El lazo importa:</strong> si el rombo dice «NO», no se especifica: se incrementa BIL_n y se recalcula BSL y K_b. Solo el camino «SÍ» termina en especificar el BIL.
          </>
        }
      />
    );
  },
  plot: ({ p, d }) => (
    <Plot
      xDomain={[550, 1550]}
      yDomain={[0.8, 2]}
      xLabel="BIL normalizado BIL_n (kV cresta)"
      yLabel="K_b = BSL / NPM"
      series={[{ pts: Array.from({ length: 41 }, (_, i) => { const b = 550 + i * 25; return [b, ((p.k === 0 ? 0.75 : 0.83) * b) / Math.max(1e-9, p.npm)] as [number, number]; }), color: PAL.surge, width: 2.4, label: 'K_b(BIL_n)' }]}
      refs={[{ at: p.km, label: `K_m = ${fmt(p.km, 2)}`, color: PAL.bad }]}
      bands={[{ x1: d.bil, x2: 1550, color: 'rgba(13,138,89,0.07)', label: 'BIL_n ≥ BIL', textColor: '#0A6E47' }]}
      markers={[{ x: p.biln, y: d.kb, color: d.especificar ? PAL.ok : PAL.bad, label: `BIL_n = ${fmt(p.biln, 0)}` }]}
      caption="La recta sube con BIL_n. Mientras esté por debajo de K_m no se puede especificar: el lazo de la lámina 17 obliga a incrementar BIL_n."
    />
  ),
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
      'Usar Peek con U < U₀, o creer que cambiar el radio no cambia la incepción: r_eq modifica U₀ y las pérdidas.',
    model: 'Incepción con E₀ = 21,1·δ·m kV/cm (adopción del curso; las láminas no fijan E₀) y pérdidas de Peek para buen tiempo (Expo 77, p. 58). Lluvia, suciedad y geometría real pueden aumentar las pérdidas.',
  },
  sources: ['expo77'],
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
  tagline: 'Cadena, altitud, guarda, tierra y niveles IEC: cinco semáforos en verde a la vez',
  why: 'Integrar todos los criterios en una sola decisión y comprobar que una solución verde en un renglón no compensa un rojo en otro.',
  params: [
    { id: 'um', group: 'Red y sitio', label: 'Tensión máxima Uₘ', unit: 'kV', min: 72.5, max: 500, step: 0.5, def: 245 },
    { id: 'h', group: 'Red y sitio', label: 'Altitud del sitio', unit: 'm', min: 0, max: 4000, step: 10, def: 2640 },
    { id: 'temp', group: 'Red y sitio', label: 'Temperatura', unit: '°C', min: 0, max: 35, step: 1, def: 14 },
    { id: 'kf', group: 'Cadena de aisladores', label: 'Coeficiente de fuga k_f', unit: 'mm/kV', min: 12, max: 35, step: 1, def: 25 },
    { id: 'fuga', group: 'Cadena de aisladores', label: 'Fuga por disco', unit: 'mm', min: 200, max: 450, step: 2, def: 292 },
    { id: 'paso', group: 'Cadena de aisladores', label: 'Paso de montaje', unit: 'm', min: 0.1, max: 0.2, step: 0.002, def: 0.146, decimals: 3 },
    { id: 'dh', group: 'Cable de guarda', label: 'Δh guarda–fase', unit: 'm', min: 2, max: 12, step: 0.1, def: 6, decimals: 1 },
    { id: 'dx', group: 'Cable de guarda', label: 'Δx guarda–fase', unit: 'm', min: 0, max: 10, step: 0.1, def: 2.5, decimals: 1 },
    { id: 'rt', group: 'Torre, rayo y tierra', label: 'Resistencia de tierra R_t', unit: 'Ω', min: 1, max: 50, step: 0.5, def: 20, decimals: 1 },
    { id: 'iRayo', group: 'Torre, rayo y tierra', label: 'Corriente de rayo de diseño', unit: 'kA', min: 10, max: 120, step: 1, def: 60 },
    { id: 'didt', group: 'Torre, rayo y tierra', label: 'di/dt de diseño', unit: 'kA/µs', min: 5, max: 40, step: 1, def: 10 },
    { id: 'npr', group: 'Transformador y niveles IEC', label: 'NPR del descargador', unit: 'kV cresta', min: 400, max: 1400, step: 25, def: 600 },
    { id: 'npm', group: 'Transformador y niveles IEC', label: 'NPM del descargador', unit: 'kV cresta', min: 300, max: 1200, step: 25, def: 500 },
    { id: 'ki', group: 'Transformador y niveles IEC', label: 'K_i', min: 1.2, max: 1.4, step: 0.01, def: 1.25, decimals: 2 },
    { id: 'km', group: 'Transformador y niveles IEC', label: 'K_m', min: 1.05, max: 1.3, step: 0.01, def: 1.15, decimals: 2 },
    { id: 'bil', group: 'Transformador y niveles IEC', label: 'BIL_n del equipo', unit: 'kV cresta', min: 550, max: 1550, step: 25, def: 1150 },
  ],
  presets: [
    {
      id: 'referencia',
      label: 'Proyecto coordinado (245 kV, 2.640 m)',
      note: 'α ≈ 22,6° · cadena por fuga · V_torre limitada · BIL_n = 1.150 kV cubre rayo (BIL = 750 kV) y maniobra (K_b = 1,73).',
      values: { um: 245, h: 2640, temp: 14, kf: 25, fuga: 292, paso: 0.146, dh: 6, dx: 2.5, rt: 20, iRayo: 60, didt: 10, npr: 600, npm: 500, ki: 1.25, km: 1.15, bil: 1150 },
    },
    {
      id: 'curso',
      label: 'Geometría del ejemplo (Δh = 5, Δx = 4 → α = 38,7°)',
      note: 'Solo cambia la guarda: α = 38,7° (ejemplo geométrico de la lámina 31). El diseño no se acepta con el α_obj = 25° de referencia (lámina 36).',
      values: { um: 245, h: 2640, temp: 14, kf: 25, fuga: 292, paso: 0.146, dh: 5, dx: 4, rt: 20, iRayo: 60, didt: 10, npr: 600, npm: 500, ki: 1.25, km: 1.15, bil: 1150 },
    },
    {
      id: 'debil',
      label: 'Tierra alta y BIL insuficiente',
      note: 'R_t = 45 Ω (V_torre supera el CFO de la cadena) y BIL_n = 750 kV (K_b = 1,125 < 1,15): varios criterios en rojo.',
      values: { um: 245, h: 2640, temp: 14, kf: 25, fuga: 292, paso: 0.146, dh: 6, dx: 2.5, rt: 45, iRayo: 60, didt: 10, npr: 600, npm: 500, ki: 1.25, km: 1.15, bil: 750 },
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
    const rc = 10 * Math.pow(Math.max(1e-9, p.iRayo), 0.65);
    const vt = p.rt * p.iRayo + 1 * p.didt;
    const bilCalc = p.ki * p.npr;
    const bilnOk = p.bil >= bilCalc - 1e-9 ? 1 : 0;
    const bsl = 0.75 * p.bil; // K = 0,75 (equipo en aire, lámina 15)
    const kb = bsl / Math.max(1e-9, p.npm);
    const kbOk = kb >= p.km ? 1 : 0;
    const checks = {
      chain: cfoString >= cfoReq ? 1 : 0,
      guard: alpha <= 25 ? 1 : 0,
      ground: vt < cfoString ? 1 : 0,
      bilnOk,
      kbOk,
    };
    const all = Object.values(checks).reduce((a, b) => a * b, 1);
    return { delta, uf, fugaReq, nFuga, cfoReq, nMan, n, length, cfoString, alpha, rc, vt, bilCalc, bsl, kb, ...checks, all };
  },
  liveStatus: (_p, d) => ({
    tone: d.all ? 'ok' : 'bad',
    badge: d.all ? '✓ PROYECTO COORDINADO' : '✕ PROYECTO NO COORDINADO',
    message: d.all
      ? `Las 5 verificaciones pasan: cadena ${fmt(d.n, 0)} discos (CFO ${fmt(d.cfoString, 0)} kV), α = ${fmt(d.alpha, 1)}°, V_torre = ${fmt(d.vt, 0)} kV y K_b = ${fmt(d.kb, 3)}.`
      : 'Al menos un criterio está en rojo. Un valor verde por separado no compensa otro en rojo: revisa la lista de verificaciones.',
  }),
  readings: (d, p) => [
    { label: 'Altitud y densidad', value: `${fmt(p.h, 0)} m · δ = ${fmt(d.delta, 3)}`, sub: `T = ${fmt(p.temp, 0)} °C (δ de la lámina 38)` },
    { label: 'Cadena dimensionada', value: `${fmt(d.n, 0)} discos · ${fmt(d.length, 2)} m`, sub: `fuga ${fmt(d.nFuga, 0)} · maniobra ${fmt(d.nMan, 0)}` },
    {
      label: 'CFO instalado / requerido',
      value: `${fmt(d.cfoString, 0)} / ${fmt(d.cfoReq, 0)} kV`,
      sub: 'maniobra corregida por altitud (÷ δ)',
      tone: d.chain ? 'ok' : 'bad',
    },
    { label: 'Ángulo de guarda α', value: `${fmt(d.alpha, 1)}°`, sub: 'ref.: α_obj = 25° (ejemplo de la lámina 36)', tone: d.guard ? 'ok' : 'bad' },
    {
      label: 'V_torre = R·i + L·di/dt',
      value: `${fmt(d.vt, 0)} kV`,
      sub: `frente a CFO instalado ${fmt(d.cfoString, 0)} kV (r_c ≈ ${fmt(d.rc, 0)} m, lámina 40)`,
      tone: d.ground ? 'ok' : 'bad',
    },
    {
      label: 'BIL_n frente a BIL requerido',
      value: `${fmt(p.bil, 0)} / ${fmt(d.bilCalc, 0)} kV`,
      sub: 'BIL = K_i·NPR, BIL_n ≥ BIL',
      tone: d.bilnOk ? 'ok' : 'bad',
    },
    { label: 'K_b = BSL / NPM', value: fmt(d.kb, 3), sub: `BSL = 0,75·BIL_n · K_m = ${fmt(p.km, 2)}`, tone: d.kbOk ? 'ok' : 'bad' },
    { label: 'Proyecto completo', value: d.all ? 'coordinado' : 'revisar', sub: d.all ? '5/5 verificaciones' : 'al menos una falla', tone: d.all ? 'ok' : 'bad' },
  ],
  equations: (p, d) => [
    `L_f = ${fmt(p.kf, 0)} × ${fmt(p.um, 1)} = ${fmt(d.fugaReq, 0)} mm → N_fuga = ${fmt(d.nFuga, 0)} (actividad 06)`,
    `CFO_req = (1,15 × 2,5 × Û_f)/(1 − 1,3 × 0,06) ÷ δ = ${fmt(d.cfoReq, 0)} kV → N_maniobra = ${fmt(d.nMan, 0)}`,
    `N = máx(${fmt(d.nFuga, 0)}, ${fmt(d.nMan, 0)}) = ${fmt(d.n, 0)} · L = ${fmt(d.n, 0)} × ${fmt(p.paso, 3)} = ${fmt(d.length, 2)} m`,
    `α = arctan(${fmt(p.dx, 1)}/${fmt(p.dh, 1)}) = ${fmt(d.alpha, 1)}° · V_torre = ${fmt(p.rt, 1)}×${fmt(p.iRayo, 0)} + 1×${fmt(p.didt, 0)} = ${fmt(d.vt, 0)} kV`,
    `BIL = K_i×NPR = ${fmt(p.ki, 2)}×${fmt(p.npr, 0)} = ${fmt(d.bilCalc, 0)} kV · BIL_n = ${fmt(p.bil, 0)} ${d.bilnOk ? '≥' : '<'} BIL`,
    `BSL = 0,75×${fmt(p.bil, 0)} = ${fmt(d.bsl, 1)} kV · K_b = BSL/NPM = ${fmt(d.kb, 3)} ${d.kbOk ? '≥' : '<'} K_m = ${fmt(p.km, 2)}`,
  ],
  checks: (p, d) => [
    { label: 'Cadena: CFO instalado ≥ CFO requerido', ok: d.chain === 1, detail: `${fmt(d.cfoString, 0)} ≥ ${fmt(d.cfoReq, 0)} kV` },
    { label: 'Guarda: α ≤ 25° (referencia de diseño)', ok: d.guard === 1, detail: `${fmt(d.alpha, 1)}° — las láminas no fijan un límite universal; α_obj = 25° es el del ejemplo de la lámina 36` },
    { label: 'Tierra y rayo: V_torre < CFO instalado', ok: d.ground === 1, detail: `${fmt(d.vt, 0)} < ${fmt(d.cfoString, 0)} kV` },
    { label: 'BIL_n ≥ BIL = K_i·NPR', ok: d.bilnOk === 1, detail: `${fmt(p.bil, 0)} ≥ ${fmt(d.bilCalc, 0)} kV` },
    { label: 'K_b = BSL/NPM ≥ K_m', ok: d.kbOk === 1, detail: `K_b = ${fmt(d.kb, 3)} vs ${fmt(p.km, 2)}` },
    { label: 'Las láminas no fijan umbral de α', ok: true, info: true, detail: 'informativo: 25° es el α_obj del ejemplo de la lámina 36; el ejemplo geométrico de la lámina 31 da 38,7°' },
  ],
  goals: [
    {
      id: 'r1',
      label: 'Guarda: α ≤ 25°',
      tip: 'Acerca la fase a la vertical de la guarda: baja Δx (o usa «Proyecto coordinado»).',
      test: (_p, d) => d.alpha <= 25,
      detail: (_p, d) => `α = ${fmt(d.alpha, 1)}° (ref. lámina 36)`,
    },
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Logra todo en verde manteniendo BIL_n ≤ 900 kV',
      tip: 'Pulsa «Proyecto coordinado» y baja BIL_n a 900 kV (K_b = 1,35) o menos.',
      test: (_p, d) => d.all === 1 && _p.bil <= 900,
      detail: (_p, d) => `α = ${fmt(d.alpha, 1)}° · BIL_n = ${fmt(_p.bil, 0)} kV`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Deja K_b justo por encima de K_m (< K_m + 0,05)',
      tip: 'Con BIL_n = 775 kV: BSL = 581,25 kV y K_b = 1,1625 (apenas ≥ 1,15).',
      test: (_p, d) => d.all === 1 && d.kb >= _p.km && d.kb < _p.km + 0.05,
      detail: (_p, d) => `K_b = ${fmt(d.kb, 3)}`,
    },
  ],
  learn: {
    analogy:
      'Es el control técnico de un avión antes de despegar: motores, alas, tren, instrumentos y clima. Que cinco luces estén en verde no autoriza el despegue si la sexta está en rojo.',
    phenomenon:
      'La coordinación de aislamiento no es la suma de componentes óptimos por separado: cadena, altitud, guarda, tierra y niveles del transformador se condicionan entre sí. Un solo criterio en rojo invalida el proyecto.',
    objective:
      'Ejecutar el ciclo completo de verificación y explicar por qué cambiar una pieza obliga a revisar las demás.',
    watch: [
      'La escena recorre la línea completa de la nube al transformador y colorea cada semáforo según su verificación.',
      'El diagrama de barras compara esfuerzo (rojo) contra capacidad soportada (verde) en cuatro frentes.',
      'Cambia solo Δx o solo BIL_n: observa cuántas comprobaciones se mueven a la vez.',
    ],
    misconception:
      'Presentar un cálculo aislado como solución. La cifra verde en un renglón no compensa un rojo en otro: el proyecto es el conjunto.',
    model: 'Modelos de las exposiciones: ajuste N(CFO) de la lámina 16, corrección ÷ δ (lámina 15), α de la lámina 31 con α_obj = 25° de la lámina 36, V_torre = R·i + L·di/dt (Expo 77, pp. 53–57) y el flujo IEC 71-1 de la lámina 17 con K = 0,75 (equipo en aire). No hay factores de acoplamiento guarda–fase ni correlaciones de fabricante: V_torre se calcula sin acoplamiento (condición conservadora).',
  },
  sources: ['expo77', 'expo39'],
  notes: [
    'Las láminas no fijan un límite universal de α ni el acoplamiento guarda–fase k_c; V_torre se calcula sin acoplamiento (conservador) y α_obj = 25° es la referencia del ejemplo de la lámina 36.',
    'Los valores de NPR, NPM y la serie de BIL_n son ilustrativos; las láminas describen el procedimiento, no el catálogo.',
  ],
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
        sceneHeader(ctx, 'Proyecto integral: nube → torre → transformador', d.all ? '5/5 VERIFICACIONES EN VERDE' : 'REVISAR SEMÁFOROS EN ROJO', true);

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

        // Transformador con niveles del flujo IEC 71-1
        const ax = w * 0.7;
        surgeArrester(ctx, ax, guardY + 10, gy, { active: true, t });
        powerTransformer(ctx, w * 0.88, gy, w * 0.14, h * 0.22, { alert: d.kbOk === 0 || d.bilnOk === 0, label: `BIL_n ${fmt(p.bil, 0)}` });
        line(ctx, w * 0.68, chain.endY + 4, ax, guardY + 10, { color: PAL.phaseBright, width: 2 });
        line(ctx, ax, guardY + 10, w * 0.88 - w * 0.02, guardY + 10, { color: PAL.phaseBright, width: 2 });
        pill(ctx, `NPM ${fmt(p.npm, 0)} · NPR ${fmt(p.npr, 0)}`, ax, guardY - 12, { color: PAL.surge, align: 'center', mono: true, size: 9.5 });

        // Tablero de 5 semáforos
        const bx = w * 0.56;
        const by = h * 0.36;
        const rows: [string, number][] = [
          ['Cadena / CFO', d.chain],
          ['Guarda α ≤ 25°', d.guard],
          ['Tierra / rayo', d.ground],
          ['BIL_n ≥ BIL', d.bilnOk],
          ['K_b ≥ K_m', d.kbOk],
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
          <strong>La línea completa en una sola mirada:</strong> rayo, guarda, cadena, tierra y niveles IEC del transformador. Un semáforo rojo basta para rechazar el diseño.
        </>
      }
    />
  ),
  plot: ({ p, d }) => (
    <BarComparisonPlot
      groups={[
        { label: 'Maniobra en altura', stress: d.cfoReq, withstand: d.cfoString },
        { label: 'Rayo en la torre', stress: d.vt, withstand: d.cfoString },
        { label: 'Rayo (BIL)', stress: d.bilCalc, withstand: p.bil },
        { label: 'Maniobra (BSL)', stress: p.km * p.npm, withstand: d.bsl },
      ]}
      caption={`Barras rojas = esfuerzo exigido; verdes = capacidad soportada. Se comparan peras con peras y en kV de cresta. δ = ${fmt(d.delta, 3)}, N = ${fmt(d.n, 0)} discos, α = ${fmt(d.alpha, 1)}°, K_b = ${fmt(d.kb, 3)}.`}
    />
  ),
};

export const protection2Experiments: Experiment[] = [e16, e17, e18];
