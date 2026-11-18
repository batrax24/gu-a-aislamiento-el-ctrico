import { clamp, fmt, linspace } from '../../lib/num';
import { PAL, arrow, circle, dimension, electricArc, environment, glow, insulatorString, latticeTower, line, pill, sceneHeader, stormCloud, text } from '../../lib/draw';
import { Plot, SceneCanvas } from '../../components/ui';
import type { Experiment } from '../types';

/* =============================== e10 =============================== */

const e10: Experiment = {
  id: 'e10',
  topicId: 6,
  contextLabel: 'Cadena mecida por viento',
  title: 'Un vendaval acerca el cable al acero de la torre',
  tagline: 'La distancia en reposo (3,50 m) no es la que queda cuando la cadena se inclina',
  why: 'Verificar la separación mínima fase–estructura con la cadena en movimiento, no solo en el plano de diseño en calma.',
  params: [
    {
      id: 'l',
      group: 'Geometría de la torre',
      label: 'Longitud de la cadena (L)',
      unit: 'm',
      min: 0.8,
      max: 6,
      step: 0.01,
      def: 3.066,
      decimals: 3,
      help: 'Cadena de 21 discos × 0,146 m del ejemplo del curso.',
    },
    {
      id: 'd0',
      group: 'Geometría de la torre',
      label: 'Distancia horizontal en reposo (d₀)',
      unit: 'm',
      min: 1.5,
      max: 6,
      step: 0.01,
      def: 3.5,
      decimals: 2,
      help: 'Distancia del cable al acero aterrizado sin viento.',
    },
    {
      id: 'theta',
      group: 'Viento y requisito',
      label: 'Inclinación de la cadena por viento (θ)',
      unit: '°',
      min: 0,
      max: 55,
      step: 0.5,
      def: 30,
      help: 'Ángulo respecto de la vertical; el viento sopla desde la derecha hacia la torre.',
    },
    {
      id: 'dreq',
      group: 'Viento y requisito',
      label: 'Distancia mínima exigida (d_req)',
      unit: 'm',
      min: 1.2,
      max: 4,
      step: 0.01,
      def: 2.42,
      decimals: 2,
      help: 'Valor del ejemplo del material; depende de norma, tensión y altitud.',
    },
  ],
  presets: [
    {
      id: 'curso',
      label: 'Ejemplo del curso (3,066 m, 30°, 3,50 m)',
      note: 'Con 30° de viento solo quedan 1,967 m: NO cumple los 2,42 m exigidos.',
      values: { l: 3.066, d0: 3.5, theta: 30, dreq: 2.42 },
    },
    {
      id: 'guia',
      label: 'Caso corregido de la guía (28° → 2,061 m)',
      note: 'La guía de ejercicios advirtió que 2,061 m seguía por debajo de 2,42 m. AislaLab lo muestra en rojo.',
      values: { l: 3.066, d0: 3.5, theta: 28, dreq: 2.42 },
    },
    {
      id: 'viento',
      label: 'Viento fuerte (40°)',
      note: 'La cadena se acerca aún más al acero; la distancia cae a ~1,53 m.',
      values: { l: 3.066, d0: 3.5, theta: 40, dreq: 2.42 },
    },
    {
      id: 'reto',
      label: 'Reto: viento moderado (20°)',
      note: 'Con 20° quedan ~2,45 m: apenas supera el requisito de 2,42 m.',
      values: { l: 3.066, d0: 3.5, theta: 20, dreq: 2.42 },
    },
  ],
  compute: (p) => {
    const theta = clamp(p.theta, 0, 90);
    const dx = p.l * Math.sin((theta * Math.PI) / 180);
    const dh = p.d0 - dx;
    const margin = dh - p.dreq;
    const thetaMax = (Math.asin(clamp((p.d0 - p.dreq) / p.l, -1, 1)) * 180) / Math.PI;
    return { dx, dh, margin, thetaMax, ok: margin >= 0 ? 1 : 0 };
  },
  liveStatus: (p, d) =>
    d.ok
      ? {
          tone: 'ok',
          badge: `✓ CUMPLE · ${fmt(d.dh, 3)} m de aire libre`,
          message: `Con θ = ${fmt(p.theta, 1)}°, la cadena se acerca ${fmt(d.dx, 3)} m a la torre y aún supera el requisito de ${fmt(p.dreq, 2)} m por ${fmt(d.margin, 3)} m.`,
        }
      : {
          tone: 'bad',
          badge: `✕ NO CUMPLE · Faltan ${fmt(Math.abs(d.margin), 3)} m`,
          message: `Con θ = ${fmt(p.theta, 1)}°, el cable queda a ${fmt(d.dh, 3)} m del acero, por debajo de ${fmt(p.dreq, 2)} m. Reduce el ángulo o aumenta d₀.`,
        },
  readings: (d, p) => [
    { label: 'Desplazamiento hacia la torre', value: `${fmt(d.dx, 3)} m`, sub: `L·sen θ = ${fmt(p.l, 3)}·sen ${fmt(p.theta, 1)}°` },
    {
      label: 'Distancia restante d_h',
      value: `${fmt(d.dh, 3)} m`,
      sub: `d₀ − Δx = ${fmt(p.d0, 2)} − ${fmt(d.dx, 3)}`,
      tone: d.ok ? 'ok' : 'bad',
    },
    {
      label: 'Margen frente al requisito',
      value: `${fmt(d.margin, 3)} m`,
      sub: `requisito ${fmt(p.dreq, 2)} m`,
      tone: d.ok ? 'ok' : 'bad',
    },
    { label: 'Ángulo máximo admisible', value: `${fmt(d.thetaMax, 1)}°`, sub: 'para esta geometría', tone: 'warn' },
    { label: 'Veredicto', value: d.ok ? 'cumple' : 'no cumple', sub: 'con cadena inclinada', tone: d.ok ? 'ok' : 'bad' },
  ],
  equations: (p, d) => [
    `Δx = L·sen θ = ${fmt(p.l, 3)} × sen(${fmt(p.theta, 1)}°) = ${fmt(d.dx, 3)} m`,
    `d_h = d₀ − Δx = ${fmt(p.d0, 2)} − ${fmt(d.dx, 3)} = ${fmt(d.dh, 3)} m`,
    `margen = d_h − d_req = ${fmt(d.dh, 3)} − ${fmt(p.dreq, 2)} = ${fmt(d.margin, 3)} m`,
    `θ_máx = arcsen((d₀ − d_req)/L) = ${fmt(d.thetaMax, 1)}°`,
    'La geometría real es tridimensional: la distancia mínima también depende de la flecha y del vano.',
  ],
  checks: (_p, d) => [
    { label: 'La distancia se evalúa con la cadena inclinada', ok: true, detail: `${fmt(d.dh, 2)} m` },
    { label: 'Se comparan magnitudes de la misma configuración', ok: true, detail: 'fase–estructura con fase–estructura' },
    { label: 'El requisito no es una constante universal', ok: true, detail: 'depende del estudio y la norma' },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Logra d_h ≥ 2,42 m sin pasar de 22° de inclinación',
      tip: 'Baja el viento a 20–21°, o aumenta d₀ sin cambiar la cadena. No basta con «estar cerca» del requisito.',
      test: (p, d) => d.ok === 1 && p.theta <= 22,
      detail: (p, d) => `d_h = ${fmt(d.dh, 3)} m a ${fmt(p.theta, 1)}°`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Comprueba una falla clara: con 28° el aire libre cae bajo 2,20 m',
      tip: 'Carga «Viento fuerte (28°)» o sube θ; mira cómo la cadena se mece hacia la torre y la cota se vuelve roja.',
      test: (_p, d) => d.ok === 0 && d.dh < 2.2,
      detail: (p, d) => `θ = ${fmt(p.theta, 1)}° · d_h = ${fmt(d.dh, 3)} m`,
    },
  ],
  learn: {
    analogy:
      'Es como colgar una lámpara de un cordel junto a una pared: en calma queda lejos, pero una racha de viento la acerca y puede golpear la pared. Aquí la «pared» es el acero aterrizado de la torre y el golpe sería un arco eléctrico.',
    phenomenon:
      'El conductor cuelga de una cadena de aisladores que puede oscilar. Al inclinarse un ángulo θ, su extremo se desplaza horizontalmente L·sen θ hacia la estructura y reduce el espacio de aire que actúa como aislante.',
    objective:
      'Calcular el desplazamiento, comparar d_h con la distancia requerida y encontrar un ángulo de viento que realmente cumpla.',
    watch: [
      'Las flechas azules soplan de derecha a izquierda: la cadena se inclina HACIA la torre, alejándose de su posición fantasma en reposo.',
      'Sigue la cota roja d_h: se acorta en vivo al subir θ y cambia a rojo cuando cae bajo d_req.',
      'En la gráfica, el cruce con la línea roja es el ángulo máximo admisible θ_máx.',
    ],
    misconception:
      'Aprobar el reto por quedar «cerca» del rango numérico: 28° da 2,061 m y sigue fallando frente a 2,42 m. El requisito manda, no la proximidad.',
    model: 'Plano 2D, cadena recta y desplazamiento solo horizontal. No incluye flecha del conductor ni tercera dimensión.',
  },
  sources: ['expo77'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      legend={[
        { color: PAL.phaseBright, label: 'Posición en reposo (fantasma)' },
        { color: PAL.phase, label: 'Cable con viento (posición real)' },
        { color: d.ok ? PAL.ok : PAL.bad, label: `Distancia d_h = ${fmt(d.dh, 2)} m` },
      ]}
      draw={(ctx, w, h) => {
        environment(ctx, w, h, { mood: 'storm', groundY: h * 0.92, mountains: false });
        sceneHeader(ctx, 'Ventana de torre con viento transversal', `θ = ${fmt(p.theta, 1)}° · d_req = ${fmt(p.dreq, 2)} m`, true);
        stormCloud(ctx, w * 0.2, h * 0.16, w * 0.4, 0.35);

        const tx = w * 0.26;
        const gy = h * 0.92;
        const th = h * 0.72;
        const armHalf = w * 0.16;
        latticeTower(ctx, tx, gy, th, { color: PAL.steelLight, arms: [{ yFrac: 0.8, half: armHalf }] });
        const armY = gy - th * 0.8;

        // Escala en píxeles por metro, común para d₀, L y Δx
        const mPx = Math.min(w * 0.075, (w * 0.7) / Math.max(1, p.d0 + p.l));
        const towerInner = tx + Math.max(16, th * 0.06);
        const ax = towerInner + p.d0 * mPx;
        const chainPx = p.l * mPx;
        const sway = Math.sin(t * 1.7) * 0.6;
        const angleDeg = -(p.theta + sway); // NEGATIVO = se mueve a la izquierda, hacia la torre
        const chain = insulatorString(ctx, ax, armY, 9, chainPx, angleDeg, { dark: true, discRadius: 9 });

        // Cables: fantasma en reposo y posición real con viento
        circle(ctx, ax, armY + chainPx + 4, 5, { stroke: 'rgba(77,163,255,0.5)', width: 1.4 });
        line(ctx, chain.endX, chain.endY + 4, w * 0.94, chain.endY + 4, { color: PAL.phaseBright, width: 2.4 });
        circle(ctx, chain.endX, chain.endY + 4, 6, { fill: PAL.phaseBright, stroke: '#FFFFFF', width: 1.5 });
        line(ctx, towerInner, armY + chainPx + 20, chain.endX, armY + chainPx + 20, {
          color: d.ok ? PAL.okBright : PAL.badBright,
          width: 2.2,
        });

        // Viento de derecha a izquierda y cotas
        for (let i = 0; i < 5; i++) {
          const yy = h * 0.24 + i * 22;
          const len = 38 + Math.sin(t * 3 + i) * 8;
          arrow(ctx, w * 0.86, yy, w * 0.86 - len, yy, 'rgba(180,215,255,0.75)', 1.5);
        }
        text(ctx, 'viento', w * 0.86, h * 0.2, { size: 10, color: '#DCEBFA', align: 'center' });
        dimension(ctx, towerInner, armY + 6, ax, armY + 6, `d₀ = ${fmt(p.d0, 2)} m`, PAL.guardBright, true);
        dimension(ctx, towerInner, chain.endY + 22, chain.endX, chain.endY + 22, `d_h = ${fmt(d.dh, 2)} m`, d.ok ? PAL.okBright : PAL.badBright, true);

        // Límite normativo como línea vertical
        const limitX = towerInner + p.dreq * mPx;
        line(ctx, limitX, armY + 12, limitX, gy - 8, { color: PAL.badBright, dash: [5, 5], width: 1.5 });
        pill(ctx, `límite ${fmt(p.dreq, 2)} m`, limitX, gy - 12, { color: PAL.badBright, dark: true, align: 'center', mono: true, size: 9.4 });
        pill(ctx, d.ok ? '✓ AISLAMIENTO CUMPLE' : '✕ RIESGO DE ARCO A LA TORRE', w * 0.5, 22, {
          color: d.ok ? PAL.okBright : PAL.badBright,
          dark: true,
          align: 'center',
          size: 11,
        });
      }}
      footer={
        <>
          <strong>Observa el sentido:</strong> la cadena se mece <strong>hacia el acero de la torre</strong> (izquierda). El círculo fantasma azul marca dónde estaba el cable sin viento.
        </>
      }
    />
  ),
  plot: ({ p, d }) => {
    const pts: [number, number][] = linspace(0, 55, 150).map((th) => [th, p.d0 - p.l * Math.sin((th * Math.PI) / 180)]);
    return (
      <Plot
        xDomain={[0, 55]}
        yDomain={[0, Math.max(p.d0, p.dreq) + 0.6]}
        xLabel="Inclinación de la cadena por viento θ (°)"
        yLabel="Distancia horizontal restante d_h (m)"
        bands={[{ y1: 0, y2: p.dreq, color: 'rgba(214, 54, 44, 0.09)', label: 'Zona de incumplimiento', textColor: '#B42318' }]}
        series={[{ pts, color: PAL.phase, width: 2.4, label: 'd_h = d₀ − L·sen θ' }]}
        refs={[{ at: p.dreq, label: `Requisito ${fmt(p.dreq, 2)} m`, color: PAL.bad }]}
        markers={[{ x: p.theta, y: d.dh, color: d.ok ? PAL.ok : PAL.bad, label: `${fmt(d.dh, 2)} m` }]}
        caption="El cruce con la franja roja es el ángulo máximo admisible. Pasado ese punto, la cadena ya no cumple la separación mínima."
      />
    );
  },
};

/* =============================== e11 =============================== */

const e11: Experiment = {
  id: 'e11',
  topicId: 6,
  contextLabel: 'Vano entre dos torres',
  title: 'Separación entre fases a mitad del vano',
  tagline: 'Flecha, largo de cadena y voltaje: la geometría antes del diseño normativo',
  why: 'Predimensionar la ventana de la torre aplicando la expresión del curso y ver qué término domina: el geométrico (flecha y cadena) o el eléctrico (tensión).',
  params: [
    { id: 'K', label: 'Coeficiente empírico K', min: 0.5, max: 1, step: 0.01, def: 0.75, help: '0,75 es el valor del ejemplo de la actividad 08; está atado a las unidades de la fórmula.' },
    { id: 'F', label: 'Flecha máxima del conductor (F)', unit: 'm', min: 1, max: 20, step: 0.1, def: 8, help: 'Cuánto baja el cable por temperatura/carga a mitad del vano.' },
    { id: 'L', label: 'Longitud de cadena (L)', unit: 'm', min: 0.5, max: 6, step: 0.01, def: 3, decimals: 2 },
    { id: 'Vn', label: 'Tensión nominal entre fases (Vₙ)', unit: 'kV', min: 66, max: 550, step: 1, def: 230 },
  ],
  presets: [
    {
      id: 'curso',
      label: 'Ejemplo del curso (D ≈ 4,02 m)',
      note: 'K=0,75 · F=8 m · L=3 m · Vₙ=230 kV → D = 2,48 + 1,53 = 4,02 m (actividad 08, p. 26).',
      values: { K: 0.75, F: 8, L: 3, Vn: 230 },
    },
    {
      id: 'vano500',
      label: 'Vano largo de 500 kV (F = 14 m)',
      note: 'Con más flecha y tensión crecen los dos términos: compáralos y observa cuál domina.',
      values: { K: 0.8, F: 14, L: 4, Vn: 500 },
    },
    {
      id: 'linea230',
      label: 'Línea típica 230 kV con flecha 4 m',
      note: 'Holgura didáctica: K=0,75 · F=4 m · L=3 m · Vₙ=230 kV.',
      values: { K: 0.75, F: 4, L: 3, Vn: 230 },
    },
  ],
  compute: (p) => {
    const termGeo = p.K * Math.sqrt(Math.max(0, p.F + p.L));
    const termElec = p.Vn / 150;
    const demp = termGeo + termElec;
    return { termGeo, termElec, demp, governs: termElec >= termGeo ? 1 : 0 };
  },
  liveStatus: (_p, d) => ({
    tone: 'info',
    badge: `${d.governs ? 'MANDA EL TÉRMINO ELÉCTRICO' : 'MANDA EL TÉRMINO GEOMÉTRICO'} · D = ${fmt(d.demp, 2)} m`,
    message: d.governs
      ? `El término Vₙ/150 (${fmt(d.termElec, 2)} m) supera a K·√(F + L) (${fmt(d.termGeo, 2)} m): la tensión es la que obliga a abrir la ventana.`
      : `K·√(F + L) (${fmt(d.termGeo, 2)} m) supera a Vₙ/150 (${fmt(d.termElec, 2)} m): la mecánica del vano es la que fija la ventana.`,
  }),
  readings: (d, p) => [
    {
      label: 'Separación empírica',
      value: `${fmt(d.demp, 3)} m`,
      sub: `${fmt(d.termGeo, 2)} m (geometría) + ${fmt(d.termElec, 2)} m (voltaje)`,
      tone: 'neutral',
    },
    {
      label: 'Término geométrico K·√(F + L)',
      value: `${fmt(d.termGeo, 3)} m`,
      sub: `${fmt(p.K, 2)} × √(${fmt(p.F, 1)} + ${fmt(p.L, 2)})`,
    },
    {
      label: 'Término eléctrico Vₙ/150',
      value: `${fmt(d.termElec, 3)} m`,
      sub: `${fmt(p.Vn, 0)} kV / 150`,
    },
    {
      label: 'Término que manda',
      value: d.governs ? 'eléctrico (Vₙ)' : 'geométrico (F, L)',
      sub: 'el mayor de los dos aportes a D',
      tone: 'neutral',
    },
  ],
  equations: (p, d) => [
    `D ≈ K√(F + L) + Vₙ/150 = ${fmt(p.K, 2)}√(${fmt(p.F, 1)} + ${fmt(p.L, 2)}) + ${fmt(p.Vn, 0)}/150 = ${fmt(d.demp, 3)} m`,
    `Reparto del resultado: ${fmt(d.termGeo, 2)} m (geometría) + ${fmt(d.termElec, 2)} m (voltaje) = ${fmt(d.demp, 2)} m`,
    'Resultado de predimensionamiento (actividad 08): una verificación final debe revisar separaciones e impulsos con el método aplicable al proyecto.',
  ],
  checks: (_p, d) => [
    { label: 'El resultado es de predimensionamiento', ok: true, detail: 'no reemplaza la verificación final del proyecto' },
    { label: 'Se declararon flecha F y cadena L', ok: true, detail: `F + L = ${fmt(_p.F + _p.L, 1)} m` },
    { label: 'Las unidades mandan la fórmula', ok: true, detail: 'K = 0,75 está atado a F y L en metros y Vₙ en kV' },
    { label: 'Se identifica qué término controla', ok: true, detail: d.governs ? 'eléctrico' : 'geométrico' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el ejemplo del curso: D ≈ 4,02 m',
      tip: 'Pulsa «Ejemplo del curso (D ≈ 4,02 m)».',
      test: (_p, d) => Math.abs(d.demp - 4.02) < 0.03,
      detail: (_p, d) => `D = ${fmt(d.demp, 3)} m`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Haz que el término eléctrico supere al geométrico',
      tip: 'Con F = 14 m y L = 4 m, sube Vₙ por encima de ~510 kV o reduce la flecha.',
      test: (_p, d) => d.governs === 1,
      detail: (_p, d) => `Vₙ/150 = ${fmt(d.termElec, 2)} m vs ${fmt(d.termGeo, 2)} m`,
    },
  ],
  learn: {
    analogy:
      'Dos cables colgados entre torres se parecen a dos cuerdas de ropa con peso en el centro: por calor y carga bajan (flecha). Necesitas dejar espacio suficiente para que nunca se toquen ni se acerquen al acero.',
    phenomenon:
      'La separación entre fases debe soportar esfuerzos fase–fase y permitir movimiento por viento, temperatura y cargas. Una expresión empírica da un valor preliminar cuando faltan los datos finos del proyecto.',
    objective:
      'Aplicar D ≈ K√(F + L) + Vₙ/150 del ejemplo de la actividad 08 y reconocer qué término manda.',
    watch: [
      'La escena muestra DOS torres, el conductor con flecha a mitad del vano y la cota de separación D.',
      'Sube Vₙ y mira cómo la barra ámbar del término eléctrico crece linealmente mientras la geométrica no cambia.',
      'Aumenta F: el término geométrico crece con la raíz; el eléctrico queda fijo.',
    ],
    misconception:
      'Tomar la expresión empírica como distancia mínima universal o cambiar unidades sin ajustar K. Los coeficientes están atados a su metodología.',
    model: 'Expresión histórica de predimensionamiento de la actividad 08 (Expo 77, pp. 25–26). No sustituye la verificación final del proyecto ni la revisión de impulsos.',
  },
  sources: ['expo77'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      legend={[
        { color: PAL.phase, label: 'Fase A' },
        { color: PAL.warn, label: 'Fase B' },
        { color: PAL.ok, label: `D = ${fmt(d.demp, 2)} m` },
      ]}
      draw={(ctx, w, h) => {
        environment(ctx, w, h, { mood: 'day', groundY: h * 0.9, mountains: true });
        sceneHeader(ctx, 'Vano completo entre dos torres', `F = ${fmt(p.F, 1)} m · L = ${fmt(p.L, 2)} m · Vₙ = ${fmt(p.Vn, 0)} kV`);

        const gy = h * 0.9;
        const x1 = w * 0.18;
        const x2 = w * 0.82;
        const th = h * 0.62;
        latticeTower(ctx, x1, gy, th, { arms: [{ yFrac: 0.78, half: w * 0.09 }] });
        latticeTower(ctx, x2, gy, th, { arms: [{ yFrac: 0.78, half: w * 0.09 }] });
        const armY = gy - th * 0.78;
        const sA = insulatorString(ctx, x1 + w * 0.09, armY, 5, h * 0.11, 0, { discRadius: 8 });
        const sB = insulatorString(ctx, x2 - w * 0.09, armY, 5, h * 0.11, 0, { discRadius: 8 });

        // Separación dibujada según D (acotada para legibilidad)
        const aY = sA.endY + 5;
        const bY = aY + Math.min(h * 0.22, d.demp * h * 0.035 + 34);
        const sag = Math.min(h * 0.16, p.F * h * 0.012);

        for (const [col, yy] of [
          [PAL.phase, aY],
          [PAL.warn, bY],
        ] as const) {
          ctx.save();
          ctx.strokeStyle = col;
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.moveTo(sA.endX, yy);
          ctx.quadraticCurveTo((x1 + x2) / 2, yy + sag + Math.sin(t * 0.8) * 1.5, sB.endX, yy);
          ctx.stroke();
          ctx.restore();
          circle(ctx, sA.endX, yy, 4.5, { fill: col });
          circle(ctx, sB.endX, yy, 4.5, { fill: col });
        }

        dimension(ctx, x1 + w * 0.03, aY, x1 + w * 0.03, bY, `D = ${fmt(d.demp, 2)} m`, PAL.ok);
        dimension(ctx, (x1 + x2) / 2 - 30, aY, (x1 + x2) / 2 - 30, aY + sag, `F = ${fmt(p.F, 1)} m`, PAL.muted);

        // Barras comparativas
        const bx = w * 0.63;
        const by = h * 0.18;
        const bw = w * 0.25;
        const maxBar = Math.max(d.termGeo, d.termElec, 1);
        const bar = (yy: number, label: string, val: number, col: string) => {
          text(ctx, label, bx, yy - 9, { size: 9.6, color: PAL.inkSoft });
          line(ctx, bx, yy, bx + bw, yy, { color: 'rgba(78,99,120,0.14)', width: 9, cap: 'butt' });
          line(ctx, bx, yy, bx + bw * (val / maxBar), yy, { color: col, width: 9, cap: 'butt' });
          text(ctx, `${fmt(val, 2)} m`, bx + bw + 6, yy, { size: 9.6, color: col, mono: true });
        };
        bar(by, 'Término geométrico', d.termGeo, PAL.phase);
        bar(by + 30, 'Término eléctrico', d.termElec, PAL.warn);
        bar(by + 60, 'D preliminar', d.demp, PAL.ok);
        pill(ctx, d.governs ? 'Manda Vₙ/150' : 'Manda K√(F+L)', bx, by + 92, { color: d.governs ? PAL.warn : PAL.ok });
      }}
      footer={
        <>
          <strong>Mira a mitad del vano:</strong> la flecha baja los conductores y la cota verde muestra la separación fase–fase que se debe dejar.
        </>
      }
    />
  ),
  plot: ({ p, d }) => {
    const emp: [number, number][] = linspace(66, 550, 150).map((v) => [v, p.K * Math.sqrt(p.F + p.L) + v / 150]);
    return (
      <Plot
        xDomain={[66, 550]}
        yDomain={[0, Math.max(12, d.demp * 1.3)]}
        xLabel="Tensión nominal entre fases Vₙ (kV)"
        yLabel="Separación requerida (m)"
        series={[{ pts: emp, color: PAL.phase, width: 2.3, label: 'D = K√(F + L) + Vₙ/150' }]}
        refs={[{ at: p.K * Math.sqrt(p.F + p.L), label: `Aporta geométrico = ${fmt(p.K * Math.sqrt(p.F + p.L), 2)} m`, color: PAL.warn }]}
        markers={[{ x: p.Vn, y: d.demp, color: PAL.ok, label: `${fmt(d.demp, 2)} m` }]}
        caption="La recta crece con Vₙ/150 sobre un piso fijo geométrico. El punto marca la Vₙ elegida."
      />
    );
  },
};

/* =============================== e12 =============================== */

const e12: Experiment = {
  id: 'e12',
  topicId: 7,
  contextLabel: 'Cúpula de la torre con cable de guarda',
  title: 'El cable «paraguas»: α y esferas de atracción',
  tagline: 'Dibuja rayos de diferente corriente y comprueba si la fase queda cubierta o se cuela la descarga',
  why: 'Entender que el ángulo α describe geometría, pero la protección real se evalúa con el modelo electrogeométrico (EGM).',
  params: [
    {
      id: 'dh',
      group: 'Geometría en la torre',
      label: 'Guarda por encima de la fase (Δh)',
      unit: 'm',
      min: 1,
      max: 15,
      step: 0.1,
      def: 5,
      help: 'Diferencia vertical entre el cable de guarda y el conductor de fase.',
    },
    {
      id: 'dx',
      group: 'Geometría en la torre',
      label: 'Guarda desplazada lateralmente (Δx)',
      unit: 'm',
      min: 0,
      max: 12,
      step: 0.1,
      def: 4,
      help: 'Distancia horizontal desde la vertical de la guarda hasta la fase.',
    },
    {
      id: 'i',
      group: 'Rayo que llega',
      label: 'Corriente del rayo considerado',
      unit: 'kA',
      min: 2,
      max: 100,
      step: 1,
      def: 31,
      help: 'Rayos pequeños tienen esfera de atracción pequeña y se cuelan más fácil.',
    },
    {
      id: 'hg',
      group: 'Rayo que llega',
      label: 'Altura media del cable de guarda',
      unit: 'm',
      min: 15,
      max: 70,
      step: 1,
      def: 40,
    },
  ],
  presets: [
    {
      id: 'curso',
      label: 'Ejemplo del curso (Δh=5, Δx=4, 31 kA)',
      note: 'α = arctan(4/5) = 38,7°. Aunque el ángulo supera 30°, la fase queda dentro de la esfera de 93 m del rayo mediano.',
      values: { dh: 5, dx: 4, i: 31, hg: 40 },
    },
    {
      id: 'cero',
      label: 'Guarda justo encima de la fase (0°)',
      note: 'Con Δx = 0, la fase queda directamente bajo el paraguas: interceptación máxima.',
      values: { dh: 5, dx: 0, i: 31, hg: 40 },
    },
    {
      id: 'abierto',
      label: 'Rayo débil con guarda abierta (10 kA, 45°)',
      note: 'α ≈ 45° y r_c ≈ 45 m: la descarga débil puede esquivar la guarda y caer en la fase (falla de apantallamiento).',
      values: { dh: 5, dx: 5, i: 10, hg: 40 },
    },
  ],
  compute: (p) => {
    const alpha = (Math.atan2(p.dx, p.dh) * 180) / Math.PI;
    const rc = 10 * Math.pow(p.i, 0.65);
    const rg = p.hg < 40 ? (3.6 + 1.7 * Math.log(Math.max(1.01, 43 - p.hg))) * Math.pow(p.i, 0.65) : 5.51 * Math.pow(p.i, 0.65);
    const ratio = p.dh / rc;
    const alphaCrit = ratio < 1 ? (Math.acos(ratio) * 180) / Math.PI : 0;
    const dentroEsfera = ratio < 1 ? 1 : 0;
    const angleOk = alpha <= 30 ? 1 : 0;
    // Si la fase cae dentro de la esfera y el ángulo no excede el crítico, la guarda intercepta.
    const shieldOk = dentroEsfera === 1 && alpha <= alphaCrit ? 1 : 0;
    return { alpha, rc, rg, ratio, alphaCrit, dentroEsfera, angleOk, shieldOk, dist: Math.hypot(p.dh, p.dx) };
  },
  liveStatus: (_p, d) => ({
    tone: d.shieldOk ? 'ok' : 'bad',
    badge: d.shieldOk ? `✓ RAYO INTERCEPTADO POR LA GUARDA` : `✕ FALLA DE APANTALLAMIENTO`,
    message: d.shieldOk
      ? `α = ${fmt(d.alpha, 1)}° ≤ α_crítico = ${fmt(d.alphaCrit, 1)}° con r_c = ${fmt(d.rc, 1)} m: el líder conecta primero con el cable de guarda.`
      : `α = ${fmt(d.alpha, 1)}° > α_crítico = ${fmt(d.alphaCrit, 1)}° (o fase fuera de esfera): el rayo esquiva la guarda y golpea la fase.`,
  }),
  readings: (d, p) => [
    {
      label: 'Ángulo de apantallamiento α',
      value: `${fmt(d.alpha, 1)}°`,
      sub: `arctan(${fmt(p.dx, 1)}/${fmt(p.dh, 1)}) desde la vertical`,
      tone: d.angleOk ? 'ok' : 'warn',
    },
    { label: 'Distancia de choque r_c', value: `${fmt(d.rc, 1)} m`, sub: `10·I^0,65 para I = ${fmt(p.i, 0)} kA` },
    { label: 'Distancia al suelo r_g', value: `${fmt(d.rg, 1)} m`, sub: 'modelo del material para la guarda' },
    {
      label: 'Ángulo límite EGM',
      value: d.dentroEsfera ? `${fmt(d.alphaCrit, 1)}°` : 'no aplica',
      sub: 'construcción 2D con esferas de atracción',
    },
    { label: 'Criterio de referencia α ≤ 30°', value: d.angleOk ? 'cumple' : 'no cumple', sub: 'guía, no garantía', tone: d.angleOk ? 'ok' : 'warn' },
    { label: 'Distancia guarda–fase', value: `${fmt(d.dist, 2)} m`, sub: 'comparar con r_c' },
  ],
  equations: (p, d) => [
    `α = arctan(Δx/Δh) = arctan(${fmt(p.dx, 1)}/${fmt(p.dh, 1)}) = ${fmt(d.alpha, 1)}°`,
    `r_c = 10·I^0,65 = 10 × ${fmt(p.i, 0)}^0,65 = ${fmt(d.rc, 1)} m`,
    `r_g = ${p.hg < 40 ? '[3,6 + 1,7·ln(43 − h_g)]·I^0,65' : '5,51·I^0,65'} = ${fmt(d.rg, 1)} m`,
    `α_crítico ≈ arccos(Δh/r_c) = arccos(${fmt(p.dh, 1)}/${fmt(d.rc, 1)}) = ${d.dentroEsfera ? `${fmt(d.alphaCrit, 1)}°` : 'fase fuera de la esfera'}`,
    `Resultado EGM: ${d.shieldOk ? 'la guarda intercepta' : 'falla de apantallamiento'}. El ángulo describe posición; la protección se evalúa con corriente y modelo.`,
  ],
  checks: (_p, d) => [
    { label: 'α se mide desde la vertical', ok: true, detail: 'hacia la fase considerada' },
    { label: 'La fase queda dentro de la esfera de atracción', ok: d.dentroEsfera === 1, detail: `Δh/r_c = ${fmt(d.ratio, 3)}` },
    { label: 'El criterio de 30° es solo una referencia', ok: true, detail: `α = ${fmt(d.alpha, 1)}°` },
    { label: 'Se evalúa también el vano y la flecha', ok: true, info: true, detail: 'este modelo es 2D en la torre' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el ejemplo Δh = 5 m y Δx = 4 m → α = 38,7°',
      tip: 'Pulsa «Ejemplo del curso (Δh=5, Δx=4, 31 kA)».',
      test: (_p, d) => Math.abs(d.alpha - 38.66) < 0.2,
      detail: (_p, d) => `α = ${fmt(d.alpha, 1)}° · r_c = ${fmt(d.rc, 1)} m`,
    },
    {
      id: 'g2',
      label: 'Logra α ≤ 25° manteniendo Δh ≥ 4,5 m',
      tip: 'Acerca la fase a la vertical de la guarda: baja Δx a 2 m o menos sin reducir Δh.',
      test: (p, d) => d.alpha <= 25 && p.dh >= 4.5,
      detail: (p, d) => `α = ${fmt(d.alpha, 1)}° con Δh = ${fmt(p.dh, 1)} m`,
    },
  ],
  learn: {
    analogy:
      'El cable de guarda es un paraguas en lo alto de la torre. Un paraguas estrecho o demasiado ladeado deja pasar el aguacero por el costado: los rayos débiles son como gotas finas que se cuelan aunque la guarda parezca bien puesta.',
    phenomenon:
      'Un líder de rayo baja desde la nube y «elige» el objeto más cercano dentro de su distancia de choque r_c. Esa distancia crece con la corriente; por eso un rayo de 10 kA puede esquivar la guarda mientras uno de 31 kA es atraído por ella.',
    objective:
      'Calcular α y r_c, distinguir una descripción geométrica de una evaluación de desempeño y reconocer visualmente intercepción vs. falla de apantallamiento.',
    watch: [
      'Mira los DOS arcos dibujados a escala: el rayo violeta sólido indica a dónde conecta; el punteado indica el objetivo bloqueado.',
      'Cambia a «Rayo débil con guarda abierta»: la esfera se encoge y el arco fuerte salta hacia la fase azul.',
      'El 38,7° es solo geometría (ejemplo de la lámina 31); por sí solo no demuestra que la línea esté protegida.',
    ],
    misconception:
      'Concluir «línea protegida» solo porque α ≤ 30°, o creer que todos los rayos tienen la misma corriente. La falla de apantallamiento y el flameo inverso son mecanismos distintos.',
    model: 'Construcción electrogeométrica 2D con r_c = 10·I^0,65 y r_g del material. No incluye flecha, terreno ni líderes ascendentes.',
  },
  sources: ['expo77', 'expo39'],
  notes: ['El 38,7° aparece en la lámina 31 como cálculo geométrico, no como prueba de protección.'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      legend={[
        { color: PAL.guardBright, label: `Guarda intercepta (r_c = ${fmt(d.rc, 0)} m)` },
        { color: PAL.badBright, label: 'Falla de apantallamiento (rayo a fase)' },
        { color: PAL.phaseBright, label: 'Conductor de fase energizado' },
      ]}
      draw={(ctx, w, h) => {
        environment(ctx, w, h, { mood: 'storm', groundY: h * 0.9, mountains: false });
        stormCloud(ctx, w * 0.5, h * 0.13, w * 0.62);
        sceneHeader(ctx, 'Sección de torre: esferas de atracción', `I = ${fmt(p.i, 0)} kA · r_c = ${fmt(d.rc, 0)} m · α = ${fmt(d.alpha, 1)}°`, true);

        const gy = h * 0.9;
        const tx = w * 0.36;
        const th = h * 0.68;
        latticeTower(ctx, tx, gy, th, { color: PAL.steelLight, arms: [{ yFrac: 0.82, half: w * 0.16 }] });
        const guardX = tx;
        const guardY = gy - th;
        const armY = gy - th * 0.82;

        // Escala adaptada para que Δh, Δx y la esfera sean comparables en pantalla
        const mPx = Math.min(w * 0.012, h * 0.016);
        const phaseX = guardX + Math.min(w * 0.32, p.dx * mPx * 2.3);
        const phaseY = guardY + Math.min(h * 0.34, p.dh * mPx * 2.3);
        const rcPx = Math.min(Math.max(46, d.rc * mPx), Math.min(w, h) * 0.44);

        // Esferas/círculos de atracción
        circle(ctx, guardX, guardY, rcPx, { stroke: 'rgba(255,202,87,0.55)', width: 2, dash: [7, 5] });
        circle(ctx, phaseX, phaseY, rcPx * 0.86, { stroke: 'rgba(77,163,255,0.30)', width: 1.3, dash: [4, 6] });
        text(ctx, `r_c ≈ ${fmt(d.rc, 0)} m`, guardX + rcPx * 0.66, guardY - rcPx * 0.62, {
          size: 9.8,
          color: PAL.guardBright,
          mono: true,
        });

        // Guarda, fase y aislador
        line(ctx, w * 0.06, guardY + 6, guardX, guardY, { color: PAL.guardBright, width: 2 });
        line(ctx, guardX, guardY, w * 0.86, guardY + 6, { color: PAL.guardBright, width: 2 });
        circle(ctx, guardX, guardY, 5, { fill: PAL.guardBright, stroke: '#FFFFFF', width: 1.3 });
        insulatorString(ctx, phaseX, armY, 5, Math.max(18, phaseY - armY), 0, { dark: true, discRadius: 7 });
        circle(ctx, phaseX, phaseY, 7, { fill: PAL.phaseBright, stroke: '#FFFFFF', width: 1.6 });
        line(ctx, phaseX, phaseY, w * 0.91, phaseY + 8, { color: PAL.phaseBright, width: 2.2 });

        // Ángulo y cotas
        line(ctx, guardX, guardY, guardX, phaseY + 18, { color: 'rgba(220,235,245,0.45)', dash: [4, 4], width: 1.2 });
        line(ctx, guardX, guardY, phaseX, phaseY, { color: PAL.guardBright, width: 1.5 });
        dimension(ctx, phaseX + 12, guardY, phaseX + 12, phaseY, `Δh ${fmt(p.dh, 1)} m`, PAL.guardBright, true);
        dimension(ctx, guardX, phaseY + 22, phaseX, phaseY + 22, `Δx ${fmt(p.dx, 1)} m`, PAL.guardBright, true);
        pill(ctx, `α = ${fmt(d.alpha, 1)}°`, guardX + 28, guardY + 26, { color: d.angleOk ? PAL.okBright : PAL.warnBright, dark: true, mono: true });

        // Líder descendente y DOS arcos claros: intercepción vs. falla de apantallamiento
        const leaderX = guardX + (phaseX - guardX) * 0.44;
        const leaderY = h * 0.2;
        const flicker = 0.8 + 0.2 * Math.sin(t * 7);
        if (d.shieldOk) {
          electricArc(ctx, leaderX, leaderY, guardX, guardY - 3, t * 4, PAL.guardBright, 3 * flicker);
          glow(ctx, guardX, guardY, 30, PAL.guardBright, 0.45);
          line(ctx, leaderX, leaderY, phaseX, phaseY - 6, { color: 'rgba(255,107,99,0.34)', dash: [4, 6], width: 1.2 });
          pill(ctx, '✓ INTERCEPTADO POR LA GUARDA', w * 0.5, 26, { color: PAL.okBright, dark: true, align: 'center' });
        } else {
          electricArc(ctx, leaderX, leaderY, phaseX, phaseY - 6, t * 4, PAL.badBright, 3 * flicker);
          glow(ctx, phaseX, phaseY, 32, PAL.badBright, 0.5);
          line(ctx, leaderX, leaderY, guardX, guardY - 3, { color: 'rgba(255,202,87,0.32)', dash: [4, 6], width: 1.2 });
          pill(ctx, '✕ EL RAYO SE CUELA Y GOLPEA LA FASE', w * 0.5, 26, { color: PAL.badBright, dark: true, align: 'center' });
        }
        pill(ctx, `α_crítico EGM = ${fmt(d.alphaCrit, 1)}°`, 12, h - 16, { color: PAL.guardBright, dark: true, mono: true });
      }}
      footer={
        <>
          <strong>Arcos a escala:</strong> el trazo violeta/ámbar sólido muestra el destino real del líder; el punteado muestra el objetivo que quedó bloqueado. Mover I cambia el tamaño de las esferas.
        </>
      }
    />
  ),
  plot: ({ p, d }) => {
    const curves = [2, p.dh, 10].map((dh, i) => ({
      pts: linspace(0, 12, 100).map((dx) => [dx, (Math.atan2(dx, dh) * 180) / Math.PI] as [number, number]),
      color: [PAL.muted, PAL.ok, PAL.surge][i],
      dash: i === 1 ? undefined : '4 4',
      width: i === 1 ? 2.4 : 1.5,
      label: i === 1 ? `Tu Δh = ${fmt(p.dh, 1)} m` : `Δh = ${fmt(dh, 1)} m`,
    }));
    return (
      <Plot
        xDomain={[0, 12]}
        yDomain={[0, 60]}
        xLabel="Separación horizontal Δx (m)"
        yLabel="Ángulo de apantallamiento α (°)"
        bands={[{ y1: 0, y2: 30, color: 'rgba(13,138,89,0.08)', label: 'Referencia α ≤ 30°', textColor: '#0A6E47' }]}
        series={curves}
        refs={[{ at: 30, label: 'Referencia 30°', color: PAL.bad }]}
        markers={[{ x: p.dx, y: d.alpha, color: PAL.warn, label: `${fmt(d.alpha, 1)}°` }]}
        caption="Tres alturas relativas: la curva verde es la tuya. La referencia de 30° es una guía de diseño; el límite real depende de r_c y de I."
      />
    );
  },
};

export const towerExperiments: Experiment[] = [e10, e11, e12];
