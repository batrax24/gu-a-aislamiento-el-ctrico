import { counterpoiseResistance, fmt, linspace, parallelRods, reflection, rodResistance, towerPotential, transmission, lineParams } from '../../lib/num';
import { PAL, arrow, circle, dimension, electricArc, environment, glow, groundSymbol, insulatorString, latticeTower, line, pill, powerTransformer, sceneHeader, soilCutaway, stormCloud, surgeArrester, text } from '../../lib/draw';
import { Plot, SceneCanvas } from '../../components/ui';
import type { Experiment } from '../types';

/* =============================== e13 =============================== */

const e13: Experiment = {
  id: 'e13',
  topicId: 8,
  contextLabel: 'Varillas y contrapesos al pie de la torre',
  title: 'Puesta a tierra: el rayo necesita una salida amplia',
  tagline: 'Distingue la resistividad del suelo (ρ, Ω·m) de la resistencia lograda (R, Ω)',
  why: 'Diseñar para la época seca y entender que enterrar más electrodos no divide la resistencia entre n por interferencia mutua.',
  params: [
    {
      id: 'rho',
      group: 'Terreno',
      label: 'Resistividad del suelo (ρ)',
      unit: 'Ω·m',
      min: 30,
      max: 1000,
      step: 10,
      def: 300,
      help: '30–100 = arcilla húmeda · 300 = suelo mixto · 1000 = roca seca.',
    },
    {
      id: 'seco',
      group: 'Terreno',
      label: 'Temporada de diseño',
      min: 0,
      max: 1,
      step: 1,
      def: 0,
      options: [
        { value: 0, label: 'Húmeda (ρ)' },
        { value: 1, label: 'Seca (ρ × 2)' },
      ],
      help: 'En sequía el suelo pierde agua y su resistividad puede duplicarse.',
    },
    {
      id: 'tipo',
      group: 'Electrodos enterrados',
      label: 'Tipo de electrodo',
      min: 1,
      max: 2,
      step: 1,
      def: 1,
      options: [
        { value: 1, label: 'Varilla vertical' },
        { value: 2, label: 'Contrapeso horizontal' },
      ],
    },
    {
      id: 's',
      group: 'Electrodos enterrados',
      label: 'Longitud del electrodo (s)',
      unit: 'm',
      min: 0.5,
      max: 12,
      step: 0.1,
      def: 3,
      decimals: 1,
    },
    {
      id: 'r',
      group: 'Electrodos enterrados',
      label: 'Radio del electrodo (r)',
      unit: 'm',
      min: 0.005,
      max: 0.03,
      step: 0.001,
      def: 0.01,
      decimals: 3,
    },
    {
      id: 'n',
      group: 'Electrodos enterrados',
      label: 'Electrodos en paralelo (n)',
      min: 1,
      max: 10,
      step: 1,
      def: 1,
    },
    {
      id: 'i',
      group: 'Corriente de falla o rayo',
      label: 'Corriente inyectada al terreno',
      unit: 'kA',
      min: 2,
      max: 40,
      step: 1,
      def: 10,
    },
  ],
  presets: [
    {
      id: 'varilla',
      label: 'Varilla de 3 m en ρ = 300 Ω·m',
      note: 'Caso base: una sola varilla da R₁ ≈ 101,8 Ω, muy por encima de la referencia de 20 Ω.',
      values: { rho: 300, seco: 0, tipo: 1, s: 3, r: 0.01, n: 1, i: 10 },
    },
    {
      id: 'seco',
      label: 'La misma varilla en temporada seca',
      note: 'ρ pasa de 300 a 600 Ω·m y la resistencia se duplica a ~203,6 Ω: un diseño de verano deja de servir.',
      values: { rho: 300, seco: 1, tipo: 1, s: 3, r: 0.01, n: 1, i: 10 },
    },
    {
      id: 'contrapeso',
      label: 'Contrapeso horizontal de 12 m',
      note: 'En suelo rocoso conviene tender cable desnudo largo en zanja en vez de clavar varillas cortas.',
      values: { rho: 300, seco: 0, tipo: 2, s: 12, r: 0.01, n: 1, i: 10 },
    },
    {
      id: 'red',
      label: 'Seis varillas de 6 m en época seca',
      note: 'R ≈ 27,9 Ω: varias varillas y más longitud logran acercarse al objetivo, pero no dividen R entre 6.',
      values: { rho: 300, seco: 1, tipo: 1, s: 6, r: 0.01, n: 6, i: 10 },
    },
  ],
  compute: (p) => {
    const rhoEff = p.rho * (p.seco === 1 ? 2 : 1);
    const r1 = p.tipo === 2 ? counterpoiseResistance(rhoEff, p.s, p.r, 0.6) : rodResistance(rhoEff, p.s, p.r);
    const rTotal = parallelRods(r1, p.n);
    const epr = rTotal * p.i;
    return { rhoEff, r1, rTotal, epr, eprUnsafe: epr > 100 ? 1 : 0 };
  },
  liveStatus: (p, d) => ({
    tone: d.rTotal <= 20 ? 'ok' : d.rTotal <= 40 ? 'warn' : 'bad',
    badge: `${d.rTotal <= 20 ? '✓ TIERRA BAJA' : d.rTotal <= 40 ? 'TIERRA MEJORABLE' : '✕ TIERRA ALTA'} · R = ${fmt(d.rTotal, 1)} Ω`,
    message: `${p.seco === 1 ? 'En sequía' : 'En época húmeda'} el suelo tiene ρ = ${fmt(d.rhoEff, 0)} Ω·m. Con ${fmt(p.n, 0)} electrodo(s) se logra ${fmt(d.rTotal, 1)} Ω y ${fmt(p.i, 0)} kA elevan la torre ~${fmt(d.epr, 0)} kV.`,
  }),
  readings: (d, p) => [
    {
      label: 'Resistividad efectiva ρ',
      value: `${fmt(d.rhoEff, 0)} Ω·m`,
      sub: p.seco === 1 ? 'temporada seca: ρ × 2' : 'temporada húmeda',
    },
    {
      label: 'Resistencia de un electrodo',
      value: `${fmt(d.r1, 1)} Ω`,
      sub: p.tipo === 2 ? 'contrapeso horizontal' : 'varilla vertical',
    },
    {
      label: 'Resistencia del conjunto',
      value: `${fmt(d.rTotal, 1)} Ω`,
      sub: `${fmt(p.n, 0)} electrodo(s) en paralelo`,
      tone: d.rTotal <= 20 ? 'ok' : d.rTotal <= 40 ? 'warn' : 'bad',
    },
    {
      label: 'Elevación de potencial',
      value: `${fmt(d.epr, 1)} kV`,
      sub: `V ≈ R·I con I = ${fmt(p.i, 0)} kA`,
      tone: d.eprUnsafe ? 'bad' : 'warn',
    },
    { label: 'Referencia con cable de guarda', value: '20 Ω', sub: 'guía: faltan paso y contacto' },
  ],
  equations: (p, d) => [
    p.tipo === 2
      ? `R₁ = (ρ/πs)·[ln(2s/√(4r·0,6)) − 1] = ${fmt(d.r1, 1)} Ω (contrapeso a 0,6 m de profundidad)`
      : `R₁ = (ρ/2πs)·ln(2s/r) = (${fmt(d.rhoEff, 0)}/(2π·${fmt(p.s, 1)}))·ln(2·${fmt(p.s, 1)}/${fmt(p.r, 3)}) = ${fmt(d.r1, 1)} Ω`,
    `R_n ≈ R₁ / n^0,78 = ${fmt(d.r1, 1)} / ${fmt(p.n, 0)}^0,78 = ${fmt(d.rTotal, 1)} Ω`,
    `V_t ≈ R·I = ${fmt(d.rTotal, 1)} Ω × ${fmt(p.i, 0)} kA = ${fmt(d.epr, 1)} kV`,
    'ρ es una propiedad del terreno; R es el resultado del conjunto suelo + geometría del electrodo. No son intercambiables.',
  ],
  checks: () => [
    { label: 'Se distingue ρ (Ω·m) de R (Ω)', ok: true, detail: 'no son intercambiables' },
    { label: 'Se diseña para la temporada crítica', ok: true, detail: 'en sequía ρ puede duplicarse' },
    { label: 'Una R baja no demuestra seguridad de personas', ok: true, detail: 'faltan tensión de paso y de contacto' },
    { label: 'El modelo resistivo no cubre impulsos de rayo', ok: true, info: true, detail: 'en rayo aparece L·di/dt (ver e14)' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Con ρ = 300 Ω·m y temporada seca, logra R ≤ 30 Ω',
      tip: 'Usa «Seis varillas de 6 m en época seca» o combina más electrodos y mayor longitud.',
      test: (p, d) => p.rho === 300 && p.seco === 1 && d.rTotal <= 30,
      detail: (p, d) => `R = ${fmt(d.rTotal, 1)} Ω con ${fmt(p.n, 0)} electrodo(s) de ${fmt(p.s, 1)} m`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Muestra que una sola varilla de 3 m en ρ = 300 Ω·m supera 90 Ω',
      tip: 'Pulsa «Varilla de 3 m en ρ = 300 Ω·m».',
      test: (p, d) => p.tipo === 1 && p.n === 1 && Math.abs(p.s - 3) < 0.05 && Math.abs(p.rho - 300) < 1 && d.r1 > 90,
      detail: (_p, d) => `R₁ = ${fmt(d.r1, 1)} Ω`,
    },
  ],
  learn: {
    analogy:
      'La corriente del rayo es como el agua de un aguacero que debe salir por un desagüe. Un tubo estrecho (R alta) hace que el nivel suba en la torre; varios desagües ayudan, pero si están muy juntos se estorban y no rinden el doble.',
    phenomenon:
      'La corriente se dispersa por el terreno desde varillas o contrapesos. La resistividad ρ describe el suelo; la resistencia R depende de ρ y de la geometría enterrada. En sequía el suelo se reseca y R sube.',
    objective:
      'Calcular R para varilla y contrapeso, evaluar el efecto de n electrodos y explicar por qué una R baja no basta para seguridad de personas.',
    watch: [
      'Cambia a «temporada seca»: el color del suelo pasa a ocre, ρ se duplica y la barra de R crece.',
      'Compara una varilla de 3 m con un contrapeso de 12 m y con seis varillas: observa que R no cae como 1/n exacto.',
      'Mira al técnico junto a la torre: las líneas equipotenciales recuerdan que también importan tensión de paso y contacto.',
    ],
    misconception:
      'Medir solo en invierno/época húmeda, o creer que 6 varillas dividen R entre 6. La interferencia mutua reduce el rendimiento (n^0,78).',
    model: 'Fórmulas de estado estacionario del material y rendimiento didáctico n^0,78. No incluye estratificación, ionización del suelo ni respuesta impulsiva.',
  },
  sources: ['expo77', 'expo39', 'guion', 'slides', 'velasco', 'expo'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      legend={[
        { color: PAL.copper, label: 'Varillas / contrapeso de cobre' },
        { color: PAL.guardBright, label: 'Corriente dispersándose en el suelo' },
        { color: PAL.bad, label: d.eprUnsafe ? 'Elevación de potencial alta' : 'Tensión de paso / contacto' },
      ]}
      draw={(ctx, w, h) => {
        environment(ctx, w, h, { mood: 'day', groundY: h * 0.34, mountains: false });
        soilCutaway(ctx, 0, h * 0.34, w, h * 0.66, { dry: p.seco === 1, layers: 4 });
        sceneHeader(ctx, 'Corte al pie de la torre', `${p.seco === 1 ? 'Temporada seca' : 'Temporada húmeda'} · ρ = ${fmt(d.rhoEff, 0)} Ω·m`);

        const gy = h * 0.34;
        const tx = w * 0.36;
        latticeTower(ctx, tx, gy, h * 0.3, { arms: [{ yFrac: 0.84, half: w * 0.07 }] });
        groundSymbol(ctx, tx, gy + 2, 10, PAL.copper);

        // Electrodos reales
        const nShow = Math.min(7, p.n);
        const rodLen = Math.min(h * 0.46, p.s * h * 0.032);
        for (let i = 0; i < nShow; i++) {
          const ex = tx + (i - (nShow - 1) / 2) * Math.min(34, w * 0.045);
          if (p.tipo === 2) {
            line(ctx, tx - w * 0.16, gy + 26 + i * 4, tx + w * 0.22, gy + 26 + i * 4, { color: PAL.copper, width: 3 });
          } else {
            line(ctx, ex, gy, ex, gy + rodLen, { color: PAL.copper, width: 3.2 });
            circle(ctx, ex, gy + rodLen, 3, { fill: PAL.copper });
          }
        }
        dimension(ctx, tx + w * 0.27, gy, tx + w * 0.27, gy + rodLen, `${fmt(p.s, 1)} m`, PAL.copper, true);

        // Equipotenciales y corriente
        const pulse = (t * 1.2) % 1;
        for (let i = 0; i < 5; i++) {
          const rr = 20 + i * 26 + pulse * 14;
          circle(ctx, tx, gy + 42, rr, { stroke: `rgba(201,122,8,${Math.max(0.08, 0.4 - i * 0.06)})`, width: 1.4, dash: [4, 5] });
        }
        for (let i = 0; i < 10; i++) {
          const u = (pulse + i / 10) % 1;
          const ang = 0.15 * Math.PI + (i / 9) * 0.7 * Math.PI;
          const rr = 18 + u * h * 0.42;
          circle(ctx, tx + Math.cos(ang) * rr, gy + 42 + Math.sin(ang) * rr * 0.55, 2.4, {
            fill: PAL.guardBright,
            alpha: 0.75 - u * 0.5,
          });
        }

        // Técnico para escala y tensión de paso
        pill(ctx, `R = ${fmt(d.rTotal, 1)} Ω`, w * 0.7, h * 0.14, { color: d.rTotal <= 20 ? PAL.ok : PAL.warn, mono: true, size: 11 });
        pill(ctx, `V ≈ ${fmt(d.epr, 0)} kV`, w * 0.7, h * 0.14 + 30, { color: d.eprUnsafe ? PAL.bad : PAL.warn, mono: true, size: 11 });
        dimension(ctx, w * 0.78, gy, w * 0.9, gy, 'paso ~1 m', PAL.bad, true);
        arrow(ctx, w * 0.78, gy - 8, w * 0.9, gy - 8, PAL.bad, 1.3);
        text(ctx, 'Verificar tensión de paso y de contacto', w * 0.84, gy + 18, { size: 9.8, color: PAL.bad, align: 'center' });
      }}
      footer={
        <>
          <strong>Corte de suelo:</strong> las varillas de cobre son la «salida» de la corriente. En temporada seca el terreno cambia de color y <strong>ρ se duplica</strong>.
        </>
      }
    />
  ),
  plot: ({ p, d }) => {
    const curve = (n: number, color: string, dash?: string, seco = false, label?: string) => ({
      pts: linspace(0.5, 12, 120).map((s) => {
        const rho = p.rho * (seco ? 2 : 1);
        const r1 = p.tipo === 2 ? counterpoiseResistance(rho, s, p.r, 0.6) : rodResistance(rho, s, p.r);
        return [s, Math.max(0, parallelRods(r1, n))] as [number, number];
      }),
      color,
      dash,
      width: 2.2,
      label,
    });
    return (
      <Plot
        xDomain={[0.5, 12]}
        yDomain={[0, Math.max(260, d.rTotal * 1.5)]}
        xLabel="Longitud del electrodo s (m)"
        yLabel="Resistencia del conjunto R (Ω)"
        bands={[{ y1: 0, y2: 20, color: 'rgba(13,138,89,0.09)', label: 'Zona objetivo ≤ 20 Ω', textColor: '#0A6E47' }]}
        series={[
          curve(p.n, PAL.ok, undefined, p.seco === 1, `Tu caso (n=${fmt(p.n, 0)}, ${p.seco ? 'seco' : 'húmedo'})`),
          curve(1, PAL.phase, '4 4', false, '1 electrodo'),
          curve(6, PAL.surge, '2 5', false, '6 electrodos'),
        ]}
        refs={[{ at: 20, label: 'Referencia 20 Ω', color: PAL.bad }]}
        markers={[{ x: p.s, y: d.rTotal, color: PAL.warn, label: `${fmt(d.rTotal, 1)} Ω` }]}
        caption="Alargar el electrodo ayuda, pero cada vez menos. Las curvas punteadas comparan 1 y 6 electrodos: el rendimiento no es proporcional a n."
      />
    );
  },
};

/* =============================== e14 =============================== */

const e14: Experiment = {
  id: 'e14',
  topicId: 8,
  contextLabel: 'Rayo en la torre y flameo inverso',
  title: 'Flameo inverso: el arco salta desde la torre hacia la fase',
  tagline: 'R_t·i + L·di/dt frente al CFO de la cadena de aisladores',
  why: 'Ver por qué bajar la resistencia de tierra no es el único factor y por qué la rapidez de subida di/dt puede decidir el flameo.',
  params: [
    {
      id: 'i',
      group: 'Descarga',
      label: 'Corriente total del rayo',
      unit: 'kA',
      min: 5,
      max: 150,
      step: 1,
      def: 60,
    },
    {
      id: 'didt',
      group: 'Descarga',
      label: 'Rapidez de subida (di/dt)',
      unit: 'kA/µs',
      min: 2,
      max: 60,
      step: 1,
      def: 20,
      help: 'Cada kA/µs produce 1 kV por cada 1 µH de inductancia.',
    },
    {
      id: 'rt',
      group: 'Torre y acoplamiento',
      label: 'Resistencia de puesta a tierra (R_t)',
      unit: 'Ω',
      min: 1,
      max: 60,
      step: 0.5,
      def: 30,
    },
    {
      id: 'l',
      group: 'Torre y acoplamiento',
      label: 'Inductancia equivalente de torre (L)',
      unit: 'µH',
      min: 0.2,
      max: 3,
      step: 0.1,
      def: 1,
      decimals: 1,
    },
    {
      id: 'ncomparten',
      group: 'Torre y acoplamiento',
      label: 'Torres que comparten la corriente',
      min: 1,
      max: 5,
      step: 1,
      def: 1,
    },
    {
      id: 'k',
      group: 'Torre y acoplamiento',
      label: 'Acoplamiento guarda–fase (k)',
      min: 0,
      max: 0.4,
      step: 0.01,
      def: 0.25,
      decimals: 2,
      help: 'Parte del voltaje de fase acompaña a la torre, reduciendo V_cadena = V_t·(1−k).',
    },
    {
      id: 'cfo',
      group: 'Cadena de aisladores',
      label: 'CFO de la cadena',
      unit: 'kV',
      min: 700,
      max: 1800,
      step: 10,
      def: 1400,
    },
  ],
  presets: [
    {
      id: 'exigente',
      label: 'Caso exigente (60 kA, 30 Ω, 20 kA/µs)',
      note: 'V_t = 1.820 kV y V_cadena = 1.365 kV: está al borde del CFO de 1.400 kV. Baja R_t para aprobar.',
      values: { i: 60, didt: 20, rt: 30, l: 1, ncomparten: 1, k: 0.25, cfo: 1400 },
    },
    {
      id: 'curso',
      label: 'Ejemplo simple del curso (10 kA × 15 Ω)',
      note: 'La parte resistiva es 150 kV; sumando L·di/dt = 10 kV, la torre sube a 160 kV. Muy lejos del flameo.',
      values: { i: 10, didt: 10, rt: 15, l: 1, ncomparten: 1, k: 0, cfo: 1400 },
    },
    {
      id: 'buena',
      label: 'Tierra mejorada (60 kA, 8 Ω)',
      note: 'Con R_t = 8 Ω, V_cadena baja a ~390 kV: la cadena sostiene con holgura.',
      values: { i: 60, didt: 20, rt: 8, l: 1, ncomparten: 1, k: 0.25, cfo: 1400 },
    },
  ],
  compute: (p) => {
    const it = p.i / p.ncomparten;
    const vt = towerPotential(it, p.rt, p.l, p.didt);
    const vRes = it * p.rt;
    const vInd = p.l * p.didt;
    const vacross = vt * (1 - p.k);
    const margin = p.cfo - vacross;
    const flash = vacross >= p.cfo ? 1 : 0;
    const rtMax = Math.max(0, (p.cfo / (1 - p.k) - vInd) / Math.max(0.01, it));
    return { it, vt, vRes, vInd, vacross, margin, flash, rtMax };
  },
  liveStatus: (p, d) => ({
    tone: d.flash ? 'bad' : 'ok',
    badge: d.flash ? '✕ FLAMEO INVERSO' : '✓ LA CADENA SOSTIENE',
    message: d.flash
      ? `La torre sube a ${fmt(d.vt, 0)} kV (${fmt(d.vRes, 0)} resistivos + ${fmt(d.vInd, 0)} inductivos) y saltan ${fmt(d.vacross, 0)} kV sobre la cadena: supera CFO ${fmt(p.cfo, 0)} kV.`
      : `La torre sube a ${fmt(d.vt, 0)} kV y la cadena ve ${fmt(d.vacross, 0)} kV, con ${fmt(d.margin, 0)} kV de holgura frente al CFO.`,
  }),
  readings: (d, p) => [
    { label: 'Corriente por esta torre', value: `${fmt(d.it, 1)} kA`, sub: `${fmt(p.i, 0)} / ${fmt(p.ncomparten, 0)} torres` },
    { label: 'Parte resistiva R_t·i', value: `${fmt(d.vRes, 1)} kV`, sub: `${fmt(p.rt, 1)} Ω × ${fmt(d.it, 1)} kA` },
    { label: 'Parte inductiva L·di/dt', value: `${fmt(d.vInd, 1)} kV`, sub: `${fmt(p.l, 1)} µH × ${fmt(p.didt, 0)} kA/µs` },
    { label: 'Potencial de torre V_t', value: `${fmt(d.vt, 1)} kV`, sub: 'suma de las dos contribuciones', tone: 'warn' },
    { label: 'Tensión sobre la cadena', value: `${fmt(d.vacross, 1)} kV`, sub: `V_t·(1 − k) con k = ${fmt(p.k, 2)}`, tone: d.flash ? 'bad' : 'ok' },
    { label: 'R_t máxima para sostener', value: `${fmt(d.rtMax, 1)} Ω`, sub: 'para estos supuestos', tone: 'warn' },
  ],
  equations: (p, d) => [
    `i_torre = ${fmt(p.i, 0)} kA / ${fmt(p.ncomparten, 0)} = ${fmt(d.it, 1)} kA`,
    `V_t = R_t·i + L·(di/dt) = ${fmt(p.rt, 1)}×${fmt(d.it, 1)} + ${fmt(p.l, 1)}×${fmt(p.didt, 0)} = ${fmt(d.vt, 1)} kV`,
    `V_cadena = V_t·(1 − k) = ${fmt(d.vt, 1)} × ${fmt(1 - p.k, 2)} = ${fmt(d.vacross, 1)} kV`,
    `Comparación: ${fmt(d.vacross, 1)} kV ${d.flash ? '≥' : '<'} CFO ${fmt(p.cfo, 0)} kV → ${d.flash ? 'FLAMEO INVERSO' : 'SOSTIENE'} (margen ${fmt(d.margin, 0)} kV)`,
    'Un rayo en la guarda también puede disparar la línea por flameo inverso, aunque la fase no haya sido impactada directamente.',
  ],
  checks: (p, d) => [
    { label: 'Se incluye la caída inductiva L·di/dt', ok: p.l * p.didt > 0, detail: `${fmt(d.vInd, 1)} kV` },
    { label: 'Se considera el reparto de corriente', ok: true, detail: `${fmt(d.it, 1)} kA por torre` },
    { label: 'El CFO se toma como distribución, no garantía', ok: true, detail: 'U₅₀ falla el 50 % de las veces' },
    { label: 'La tensión instantánea de fase no está modelada', ok: true, info: true, detail: 'se usa acoplamiento constante k' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Con 60 kA, 20 kA/µs, L = 1 µH, k = 0,25 y CFO = 1.400 kV, evita el flameo',
      tip: 'Baja R_t por debajo de ~28,9 Ω o usa el escenario «Tierra mejorada (60 kA, 8 Ω)».',
      test: (p, d) => p.i >= 59 && p.didt >= 19 && Math.abs(p.l - 1) < 0.05 && Math.abs(p.k - 0.25) < 0.01 && d.flash === 0,
      detail: (p, d) => `R_t = ${fmt(p.rt, 1)} Ω → V_cadena = ${fmt(d.vacross, 1)} kV`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Reproduce el ejemplo simple: 10 kA × 15 Ω = 150 kV resistivos',
      tip: 'Pulsa «Ejemplo simple del curso (10 kA × 15 Ω)».',
      test: (p) => Math.abs(p.i - 10) < 0.5 && Math.abs(p.rt - 15) < 0.2 && Math.abs((p.i / p.ncomparten) * p.rt - 150) < 1.5,
      detail: (_p, d) => `R_t·i = ${fmt(d.vRes, 0)} kV · V_t total = ${fmt(d.vt, 1)} kV`,
    },
  ],
  learn: {
    analogy:
      'Si el rayo llega a una torre con un desagüe estrecho (R_t alta), el «nivel» de voltaje del acero sube como el agua en un tanque. Cuando supera la altura del borde (CFO), se derrama hacia el cable: ese derrame es el flameo inverso.',
    phenomenon:
      'La corriente del rayo baja por la torre y encuentra resistencia e inductancia. El potencial del acero sube; entre torre y fase aparece una tensión que puede romper la cadena de aisladores desde la torre hacia el conductor.',
    objective:
      'Calcular V_t = R_t·i + L·di/dt, aplicar el acoplamiento k y comparar V_cadena con el CFO para decidir si hay flameo inverso.',
    watch: [
      'En la escena, la corriente amarilla baja por la torre; si V_cadena ≥ CFO aparece un arco rojo desde el acero hacia el cable azul.',
      'Sube di/dt sin tocar R_t: la barra «parte inductiva» crece y el margen se reduce.',
      'En la gráfica, el cruce de la curva con la línea roja del CFO da la R_t máxima admisible.',
    ],
    misconception:
      'Creer que el flameo inverso depende solo de la resistencia de tierra. La inductancia, el reparto entre torres y el acoplamiento con la fase también deciden.',
    model: 'Modelo concentrado R–L con acoplamiento constante y reparto equitativo. La torre real exige propagación y modelos dependientes de frecuencia.',
  },
  sources: ['expo39', 'expo77', 'guion', 'slides', 'velasco', 'expo'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      legend={[
        { color: PAL.guardBright, label: 'Corriente del rayo bajando por la torre' },
        { color: PAL.phaseBright, label: 'Conductor de fase energizado' },
        { color: PAL.badBright, label: d.flash ? 'Arco de flameo inverso' : 'Cadena sin arco' },
      ]}
      draw={(ctx, w, h) => {
        environment(ctx, w, h, { mood: 'storm', groundY: h * 0.9, mountains: false });
        stormCloud(ctx, w * 0.5, h * 0.13, w * 0.56);
        sceneHeader(ctx, 'Impacto en la cúpula de la torre', `I = ${fmt(p.i, 0)} kA · R_t = ${fmt(p.rt, 1)} Ω · di/dt = ${fmt(p.didt, 0)} kA/µs`, true);

        const tx = w * 0.5;
        const gy = h * 0.9;
        const th = h * 0.72;
        const armHalf = w * 0.15;
        latticeTower(ctx, tx, gy, th, { color: PAL.steelLight, arms: [{ yFrac: 0.8, half: armHalf }] });
        const guardY = gy - th;
        const armY = gy - th * 0.8;
        const chain = insulatorString(ctx, tx - armHalf, armY, 9, h * 0.2, 0, {
          dark: true,
          discRadius: 9,
          flashover: d.flash === 1,
          t: t * 5,
        });
        line(ctx, w * 0.06, guardY + 6, tx, guardY, { color: PAL.guardBright, width: 2 });
        line(ctx, tx, guardY, w * 0.94, guardY + 6, { color: PAL.guardBright, width: 2 });
        line(ctx, w * 0.04, chain.endY + 4, chain.endX, chain.endY + 4, { color: PAL.phaseBright, width: 2.4 });
        circle(ctx, chain.endX, chain.endY + 4, 6, { fill: PAL.phaseBright, stroke: '#FFFFFF', width: 1.5 });

        // Rayo que cae en la punta y corriente bajando
        electricArc(ctx, tx + 8, h * 0.2, tx, guardY, t * 5, PAL.surgeBright, 2.8);
        glow(ctx, tx, guardY, 26, PAL.guardBright, 0.42);
        for (let k = 0; k < 6; k++) {
          const u = (t * 1.8 + k / 6) % 1;
          circle(ctx, tx + Math.sin(k * 2.1) * 8, guardY + u * (gy - guardY), 3.1, { fill: PAL.guardBright, alpha: 0.9 - u * 0.35 });
        }
        if (p.ncomparten > 1) {
          for (let k = 0; k < Math.min(3, p.ncomparten - 1); k++) {
            arrow(ctx, tx + 12 + k * 6, guardY + 22, w * (0.7 + k * 0.08), guardY + 22, PAL.guardBright, 1.3);
          }
          pill(ctx, `+${fmt(p.ncomparten - 1, 0)} torres comparten corriente`, w * 0.5, guardY + 36, {
            color: PAL.guardBright,
            dark: true,
            align: 'center',
            mono: true,
          });
        }

        // Barras de las dos contribuciones
        const bx = w * 0.72;
        const by = h * 0.28;
        const bw = w * 0.22;
        const maxV = Math.max(1, d.vt, p.cfo);
        const bar = (yy: number, label: string, val: number, col: string) => {
          text(ctx, label, bx, yy - 9, { size: 9.5, color: '#DCEBFA' });
          line(ctx, bx, yy, bx + bw, yy, { color: 'rgba(220,235,245,0.18)', width: 10, cap: 'butt' });
          line(ctx, bx, yy, bx + bw * (val / maxV), yy, { color: col, width: 10, cap: 'butt' });
          text(ctx, `${fmt(val, 0)} kV`, bx + bw + 6, yy, { size: 9.5, color: col, mono: true });
        };
        bar(by, 'R_t · i', d.vRes, PAL.guardBright);
        bar(by + 32, 'L · di/dt', d.vInd, PAL.surgeBright);
        bar(by + 64, 'V_cadena', d.vacross, d.flash ? PAL.badBright : PAL.okBright);
        line(ctx, bx, by + 88, bx + bw * (p.cfo / maxV), by + 88, { color: PAL.badBright, dash: [5, 4], width: 2 });
        text(ctx, `CFO ${fmt(p.cfo, 0)} kV`, bx, by + 104, { size: 9.5, color: PAL.badBright, mono: true });

        pill(ctx, d.flash ? '✕ FLAMEO INVERSO' : '✓ SIN FLAMEO', w * 0.5, 26, {
          color: d.flash ? PAL.badBright : PAL.okBright,
          dark: true,
          align: 'center',
        });
        groundSymbol(ctx, tx, gy + 2, 10, PAL.copper);
      }}
      footer={
        <>
          <strong>Fíjate en el sentido del arco:</strong> no viene de la nube a la fase, sino que salta <strong>desde la torre elevada</strong> hacia el conductor cuando V_cadena supera el CFO.
        </>
      }
    />
  ),
  plot: ({ p, d }) => {
    const pts: [number, number][] = linspace(1, 60, 150).map((rt) => [
      rt,
      (towerPotential(p.i / p.ncomparten, rt, p.l, p.didt) * (1 - p.k)),
    ]);
    return (
      <Plot
        xDomain={[1, 60]}
        yDomain={[0, Math.max(p.cfo * 1.35, d.vacross * 1.1)]}
        xLabel="Resistencia de puesta a tierra R_t (Ω)"
        yLabel="Tensión sobre la cadena (kV)"
        bands={[{ y1: p.cfo, y2: Math.max(p.cfo * 1.35, d.vacross * 1.1), color: 'rgba(214,54,44,0.09)', label: 'Zona de flameo inverso', textColor: '#FFB3AE' }]}
        series={[{ pts, color: PAL.phase, width: 2.4, label: `V_cadena con di/dt = ${fmt(p.didt, 0)} kA/µs` }]}
        refs={[{ at: p.cfo, label: `CFO = ${fmt(p.cfo, 0)} kV`, color: PAL.bad }]}
        markers={[{ x: p.rt, y: d.vacross, color: d.flash ? PAL.bad : PAL.ok, label: `${fmt(d.vacross, 0)} kV` }]}
        caption={`El cruce con la línea roja ocurre en R_t ≈ ${fmt(d.rtMax, 1)} Ω. Aunque R_t baje a cero, L·di/dt = ${fmt(d.vInd, 0)} kV sigue elevando la torre.`}
      />
    );
  },
};

/* =============================== e15 =============================== */

const e15: Experiment = {
  id: 'e15',
  topicId: 9,
  contextLabel: 'Línea aérea → cable → subestación',
  title: 'Ondas viajeras: un pulso puede rebotar y casi duplicarse',
  tagline: 'Reflexión Γ (con su signo), transmisión τ y diagrama de Bewley',
  why: 'Entender por qué cambiar de impedancia y alejar el pararrayos del transformador modifica la tensión que realmente llega al equipo.',
  params: [
    {
      id: 'z1',
      group: 'Unión de dos líneas',
      label: 'Impedancia de la línea aérea (Z₁)',
      unit: 'Ω',
      min: 100,
      max: 700,
      step: 5,
      def: 400,
    },
    {
      id: 'z2',
      group: 'Unión de dos líneas',
      label: 'Impedancia del segundo tramo (Z₂)',
      unit: 'Ω',
      min: 0,
      max: 2000,
      step: 5,
      def: 100,
      help: '0 Ω = cortocircuito ideal · 100 Ω ≈ cable · 2000 Ω ≈ equipo de impedancia muy alta.',
    },
    {
      id: 'vi',
      group: 'Pulso y recorrido',
      label: 'Onda incidente (V_i)',
      unit: 'kV',
      min: 20,
      max: 400,
      step: 5,
      def: 100,
    },
    {
      id: 'd',
      group: 'Pulso y recorrido',
      label: 'Distancia al equipo',
      unit: 'm',
      min: 0,
      max: 600,
      step: 5,
      def: 300,
      help: 'Cada ida y vuelta tarda 2d/v; por eso el pararrayos se instala pegado al transformador.',
    },
    {
      id: 'l',
      group: 'Parámetros por km',
      label: "Inductancia L'",
      unit: 'mH/km',
      min: 0.5,
      max: 1.5,
      step: 0.01,
      def: 1,
      decimals: 2,
    },
    {
      id: 'c',
      group: 'Parámetros por km',
      label: "Capacitancia C'",
      unit: 'nF/km',
      min: 6,
      max: 20,
      step: 0.1,
      def: 12,
      decimals: 1,
    },
  ],
  presets: [
    {
      id: 'curso',
      label: 'Ejemplo del curso (400 → 100 Ω, 100 kV)',
      note: 'Γ = −0,60 (pulso invertido) y τ = 0,40 → V_t = 40 kV. Nunca graficamos |Γ|: el signo importa.',
      values: { z1: 400, z2: 100, vi: 100, d: 300, l: 1, c: 12 },
    },
    {
      id: 'abierto',
      label: 'Equipo de impedancia alta (Z₂ = 2.000 Ω)',
      note: 'Γ = +0,667 y τ = 1,667: un pulso de 100 kV se acerca a 166,7 kV. El abierto ideal Γ = +1 es una asíntota.',
      values: { z1: 400, z2: 2000, vi: 100, d: 300, l: 1, c: 12 },
    },
    {
      id: 'corto',
      label: 'Cortocircuito ideal (Z₂ = 0 Ω)',
      note: 'Γ = −1 y τ = 0: el pulso rebota totalmente invertido y no entrega tensión al segundo tramo.',
      values: { z1: 400, z2: 0, vi: 100, d: 300, l: 1, c: 12 },
    },
    {
      id: 'acople',
      label: 'Acople perfecto (Z₂ = Z₁ = 400 Ω)',
      note: 'Γ = 0 y τ = 1: no hay rebote; toda la onda sigue sin cambiar de amplitud.',
      values: { z1: 400, z2: 400, vi: 100, d: 300, l: 1, c: 12 },
    },
  ],
  compute: (p) => {
    const gamma = reflection(p.z1, p.z2);
    const tau = transmission(p.z1, p.z2);
    const vr = gamma * p.vi;
    const vt = tau * p.vi;
    const { zc, v } = lineParams(p.l, p.c);
    const tRound = (2 * p.d) / Math.max(1, v) * 1e6;
    return { gamma, tau, vr, vt, zc, v, tRound, fast: v > 2.998e8 ? 1 : 0, check: p.vi + vr };
  },
  liveStatus: (p, d) => ({
    tone: d.fast ? 'warn' : d.gamma >= 0.6 ? 'bad' : d.gamma < 0 ? 'warn' : 'ok',
    badge: `Γ = ${fmt(d.gamma, 3)} · τ = ${fmt(d.tau, 3)}`,
    message:
      d.fast
        ? `Con L′ = ${fmt(p.l, 2)} mH/km y C′ = ${fmt(p.c, 1)} nF/km, la velocidad calculada supera la luz: revisa esos datos.`
        : `Un pulso de ${fmt(p.vi, 0)} kV produce V_r = ${fmt(d.vr, 1)} kV (${d.vr < 0 ? 'polaridad invertida' : 'misma polaridad'}) y V_t = ${fmt(d.vt, 1)} kV en el equipo.`,
  }),
  readings: (d, p) => [
    {
      label: 'Coeficiente de reflexión Γ',
      value: fmt(d.gamma, 3),
      sub: `(Z₂−Z₁)/(Z₂+Z₁) = (${fmt(p.z2, 0)}−${fmt(p.z1, 0)})/(${fmt(p.z2 + p.z1, 0)})`,
      tone: Math.abs(d.gamma + 0.6) < 0.03 ? 'ok' : 'neutral',
    },
    { label: 'Coeficiente de transmisión τ', value: fmt(d.tau, 3), sub: '1 + Γ = 2Z₂/(Z₂+Z₁)' },
    { label: 'Onda reflejada V_r', value: `${fmt(d.vr, 1)} kV`, sub: 'el signo indica polaridad, no energía negativa', tone: d.vr < 0 ? 'warn' : 'ok' },
    { label: 'Onda transmitida V_t', value: `${fmt(d.vt, 1)} kV`, sub: `V_i + V_r = ${fmt(d.check, 1)} kV`, tone: 'ok' },
    {
      label: 'Z_c y velocidad',
      value: `${fmt(d.zc, 0)} Ω · ${fmt(d.v / 1e8, 3)}×10⁸ m/s`,
      sub: 'de L′ y C′ por unidad de longitud',
      tone: d.fast ? 'warn' : 'neutral',
    },
    { label: 'Ida y vuelta al equipo', value: `${fmt(d.tRound, 2)} µs`, sub: `2d/v con d = ${fmt(p.d, 0)} m` },
  ],
  equations: (p, d) => [
    `Γ = (Z₂ − Z₁)/(Z₂ + Z₁) = (${fmt(p.z2, 0)} − ${fmt(p.z1, 0)})/(${fmt(p.z2 + p.z1, 0)}) = ${fmt(d.gamma, 3)}`,
    `τ = 1 + Γ = ${fmt(d.tau, 3)} · V_r = Γ·V_i = ${fmt(d.vr, 1)} kV · V_t = τ·V_i = ${fmt(d.vt, 1)} kV`,
    `Z_c = √(L′/C′) = ${fmt(d.zc, 0)} Ω · v = 1/√(L′C′) = ${fmt(d.v / 1e8, 3)}×10⁸ m/s`,
    `t_ida_vuelta = 2d/v = ${fmt(d.tRound, 2)} µs`,
    'En un extremo abierto IDEAL (Z₂ → ∞) Γ → +1 y la tensión puede duplicarse; con Z₂ = 2.000 Ω solo se llega a Γ = 0,667.',
  ],
  checks: (_p, d) => [
    { label: 'Se compara la misma onda (tensión) en la unión', ok: true, detail: 'V_i + V_r = V_t' },
    { label: 'El signo de Γ se interpreta como polaridad', ok: true, detail: 'no como |Γ| ni energía negativa' },
    { label: 'La velocidad es físicamente posible', ok: d.fast === 0, detail: d.fast ? 'v > c: revisa L′–C′' : 'v < c' },
    { label: 'El caso «abierto» es un límite, no un valor finito', ok: true, detail: 'Z₂ = 2.000 Ω da Γ = 0,667' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el ejemplo: Z₁=400 Ω, Z₂=100 Ω, V_i=100 kV → Γ=−0,60 y V_t=40 kV',
      tip: 'Pulsa «Ejemplo del curso (400 → 100 Ω, 100 kV)».',
      test: (p, d) => Math.abs(p.z1 - 400) < 1 && Math.abs(p.z2 - 100) < 1 && Math.abs(d.gamma + 0.6) < 0.005 && Math.abs(d.vt - 40) < 0.5,
      detail: (_p, d) => `Γ = ${fmt(d.gamma, 3)} · V_t = ${fmt(d.vt, 1)} kV`,
    },
    {
      id: 'g2',
      label: 'Encuentra Z₂ para Γ ≥ 0,6 (reflexión positiva fuerte) y observa la sobretensión',
      tip: 'Sube Z₂ por encima de 1.600 Ω o pulsa «Equipo de impedancia alta».',
      test: (_p, d) => d.gamma >= 0.6,
      detail: (_p, d) => `Γ = ${fmt(d.gamma, 3)} → V_t ≈ ${fmt(d.vt, 1)} kV`,
    },
  ],
  learn: {
    analogy:
      'Una onda en una cuerda que llega a una cuerda más gruesa rebota «al revés»; si llega a una pared rígida, rebota hacia arriba y se suma. En la línea eléctrica pasa igual: el pulso de voltaje rebota según el cambio de impedancia.',
    phenomenon:
      'Una variación rápida de tensión viaja con velocidad finita. Al encontrar un cambio de Z (línea aérea→cable, o línea→transformador), una parte se refleja y otra se transmite; el signo de Γ indica si el rebote se suma o se resta.',
    objective:
      'Calcular Γ y τ con su signo, estimar Z_c y v, y explicar por qué la distancia entre pararrayos y equipo importa.',
    watch: [
      'Arriba en la escena, el pulso azul viaja hacia la unión y se separa en un pulso rojo (reflejo, hacia abajo si Γ<0) y uno ámbar (transmitido).',
      'Abajo, el diagrama de Bewley dibuja los rebotes en posición–tiempo: cada viaje de ida y vuelta tarda 2d/v.',
      'Pon Z₂ = 0 Ω: Γ = −1 y verás el pulso invertido; pon Z₂ = 2.000 Ω: Γ positivo y V_t crece.',
    ],
    misconception:
      'Graficar |Γ| y perder la inversión de polaridad, o etiquetar Z₂ = 2.000 Ω como «extremo abierto» (Γ sería +1, no +0,667).',
    model: 'Línea ideal sin pérdidas, unión resistiva y coeficientes reales. No incluye atenuación por corona, dispersión ni capacidad del equipo.',
  },
  sources: ['expo77', 'expo39', 'guion', 'slides', 'velasco', 'pararrayos', 'ejercicios'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      legend={[
        { color: PAL.phaseBright, label: `Incidente V_i = ${fmt(p.vi, 0)} kV` },
        { color: d.vr < 0 ? PAL.badBright : PAL.okBright, label: `Reflejado V_r = ${fmt(d.vr, 0)} kV` },
        { color: PAL.guardBright, label: `Transmitido V_t = ${fmt(d.vt, 0)} kV` },
      ]}
      draw={(ctx, w, h) => {
        environment(ctx, w, h, { mood: 'lab' });
        sceneHeader(ctx, 'Pulso viajero en una unión de impedancias', `Γ = ${fmt(d.gamma, 2)} · τ = ${fmt(d.tau, 2)} · 2d/v = ${fmt(d.tRound, 2)} µs`);

        // Tramo físico: línea aérea (torre) → cable → subestación (transformador + pararrayos)
        const y = h * 0.34;
        const x0 = w * 0.07;
        const xj = w * 0.54;
        const x1 = w * 0.92;
        line(ctx, x0, y, xj, y, { color: PAL.phase, width: 3.2 });
        line(ctx, xj, y, x1, y, { color: PAL.guard, width: 3.2 });
        line(ctx, xj, y - 20, xj, y + 20, { color: PAL.ok, dash: [5, 4], width: 1.8 });
        text(ctx, `LÍNEA AÉREA · Z₁ = ${fmt(p.z1, 0)} Ω`, x0 + 4, y - 22, { size: 9.8, color: PAL.phase, mono: true });
        text(ctx, `CABLE / EQUIPO · Z₂ = ${fmt(p.z2, 0)} Ω`, x1 - 4, y - 22, { size: 9.8, color: PAL.guard, align: 'right', mono: true });
        text(ctx, 'unión', xj, y + 30, { size: 9.5, color: PAL.muted, align: 'center' });

        // Iconos concretos de cada lado
        latticeTower(ctx, x0 + w * 0.07, y + 12, h * 0.13, { arms: [{ yFrac: 0.8, half: w * 0.04 }], color: PAL.steelLight, pedestals: false });
        surgeArrester(ctx, x1 - w * 0.04, y - 8, y + h * 0.2, { active: true, t });
        powerTransformer(ctx, x1 - w * 0.16, y + h * 0.24, w * 0.14, h * 0.15, {
          alert: d.vt > p.vi * 1.4,
          label: 'TRANSFORMADOR',
        });

        // Pulso rectangular viajando; amplitudes con signo
        const pos = (t * 0.32) % 1.35;
        const amp = 20;
        const incX = x0 + Math.min(1, pos) * (xj - x0);
        const pulse = (cx: number, cy: number, signed: number, col: string, label: string) => {
          const up = signed >= 0;
          ctx.save();
          ctx.strokeStyle = col;
          ctx.lineWidth = 2.1;
          ctx.beginPath();
          ctx.moveTo(cx - 24, cy);
          ctx.lineTo(cx - 9, cy);
          ctx.lineTo(cx - 9, cy - (up ? 1 : -1) * Math.max(3, Math.abs(signed) * amp));
          ctx.lineTo(cx + 9, cy - (up ? 1 : -1) * Math.max(3, Math.abs(signed) * amp));
          ctx.lineTo(cx + 9, cy);
          ctx.lineTo(cx + 24, cy);
          ctx.stroke();
          ctx.restore();
          text(ctx, label, cx, cy - (up ? 1 : -1) * Math.max(3, Math.abs(signed) * amp) - 10, {
            size: 9.2,
            color: col,
            align: 'center',
            mono: true,
          });
        };
        if (pos <= 1) pulse(incX, y, 1, PAL.phase, `${fmt(p.vi, 0)} kV`);
        else {
          const u = Math.min(1, pos - 1);
          pulse(xj - u * (xj - x0), y, d.gamma, d.vr < 0 ? PAL.bad : PAL.ok, `V_r ${fmt(d.vr, 0)}`);
          pulse(xj + u * (x1 - xj), y, d.tau, PAL.guard, `V_t ${fmt(d.vt, 0)}`);
        }

        // Diagrama de Bewley
        const bx = w * 0.14;
        const by = h * 0.66;
        const bw = w * 0.72;
        const bh = h * 0.24;
        line(ctx, bx, by + bh, bx + bw, by + bh, { color: 'rgba(78,99,120,0.35)', width: 1.2 });
        line(ctx, bx, by + bh, bx, by, { color: 'rgba(78,99,120,0.35)', width: 1.2 });
        text(ctx, 'posición →', bx + bw, by + bh + 14, { size: 9.2, color: PAL.muted, align: 'right' });
        text(ctx, 'tiempo ↑', bx - 6, by + 4, { size: 9.2, color: PAL.muted, align: 'right' });
        for (let i = 0; i < 4; i++) {
          const startX = i % 2 === 0 ? bx : bx + bw;
          const endX = i % 2 === 0 ? bx + bw : bx;
          const y1 = by + bh - (bh * i) / 4;
          const y2 = by + bh - (bh * (i + 1)) / 4;
          line(ctx, startX, y1, endX, y2, { color: i === 0 ? PAL.phase : 'rgba(201,122,8,0.65)', width: i === 0 ? 2 : 1.2, dash: i === 0 ? undefined : [4, 3] });
        }
        pill(ctx, `ida y vuelta = ${fmt(d.tRound, 2)} µs`, bx + bw, by + 12, { color: PAL.guard, align: 'right', mono: true, size: 9.5 });
        pill(ctx, d.fast ? 'v > c: revisa L′–C′' : 'v ≤ c', w - 12, 22, { color: d.fast ? PAL.bad : PAL.ok, align: 'right', mono: true, size: 9.5 });
      }}
      footer={
        <>
          <strong>Clave visual:</strong> el pulso rojo dibujado hacia abajo representa un Γ negativo (polaridad invertida). La gráfica de abajo nunca usa valor absoluto.
        </>
      }
    />
  ),
  plot: ({ p, d }) => {
    const gpts: [number, number][] = linspace(0, 2000, 220).map((z) => [z, reflection(p.z1, z)]);
    const tpts: [number, number][] = linspace(0, 2000, 220).map((z) => [z, transmission(p.z1, z)]);
    return (
      <Plot
        xDomain={[0, 2000]}
        yDomain={[-1.05, 2.05]}
        xLabel="Impedancia del segundo tramo Z₂ (Ω)"
        yLabel="Coeficiente (con signo)"
        bands={[{ y1: -1.05, y2: 0, color: 'rgba(214,54,44,0.07)', label: 'Γ negativo: pulso invertido', textColor: '#B42318' }]}
        series={[
          { pts: gpts, color: PAL.ok, width: 2.4, label: 'Γ (reflexión, con signo)' },
          { pts: tpts, color: PAL.guard, width: 2.1, dash: '5 4', label: 'τ (transmisión)' },
        ]}
        refs={[
          { at: 1, label: 'Γ = +1 (abierto ideal)', color: PAL.ok },
          { at: -1, label: 'Γ = −1 (cortocircuito)', color: PAL.bad },
          { at: 0, label: 'Γ = 0 (acople)', color: PAL.muted, dash: '2 4' },
          { at: p.z1, label: 'Z₂ = Z₁', color: PAL.phase, dash: '2 4', axis: 'x' },
        ]}
        markers={[
          { x: p.z2, y: d.gamma, color: PAL.surge, label: `Γ = ${fmt(d.gamma, 2)}` },
          { x: p.z2, y: d.tau, color: PAL.phase, label: `τ = ${fmt(d.tau, 2)}`, shape: 'ring' },
        ]}
        caption="Γ se grafica con su signo: el área roja indica inversión de polaridad. El extremo abierto es una asíntota; con Z₂ finita Γ se acerca a +1 sin alcanzarlo."
      />
    );
  },
};

export const protectionExperiments: Experiment[] = [e13, e14, e15];
