import { fmt, impulseMetrics, impulseShape, linspace } from '../../lib/num';
import { PAL, circle, dimension, electricArc, environment, groundSymbol, insulatorString, latticeTower, line, pill, sceneHeader, scopeScreen, text } from '../../lib/draw';
import { Plot, SceneCanvas } from '../../components/ui';
import type { Experiment, Params } from '../types';
import { classifyFront, FRONT_BRIGHT, FRONT_COLOR } from '../common';

/* =============================== e01 =============================== */

const e01class = (p: Params) => classifyFront(p.tFront, p.tTail);

const e01: Experiment = {
  id: 'e01',
  topicId: 2,
  contextLabel: 'Tipos de picos de voltaje',
  title: 'Tres sobretensiones, tres formas de onda',
  tagline: 'Rayo, maniobra y falla temporal: no solo importa la altura del pico, sino qué tan rápido golpea',
  why: 'Reconocer de un vistazo si un pico viene de un rayo, de un interruptor o de una falla, y saber con qué prueba de laboratorio se compara.',
  params: [
    {
      id: 'um',
      group: 'Voltaje del sistema y tamaño del pico',
      label: 'Voltaje máximo entre fases (Uₘ)',
      unit: 'kV',
      min: 72.5,
      max: 500,
      step: 0.5,
      def: 245,
      help: '245 kV corresponde a una línea de transmisión típica de 230 kV.',
    },
    {
      id: 'pu',
      group: 'Voltaje del sistema y tamaño del pico',
      label: 'Tamaño del pico (múltiplo de Û_f)',
      unit: 'p.u.',
      min: 1,
      max: 4,
      step: 0.05,
      def: 2.5,
      help: '2,5 p.u. significa 2,5 veces el pico normal fase–tierra.',
    },
    {
      id: 'tFront',
      group: 'Rapidez y duración de la onda',
      label: 'Tiempo de subida (frente)',
      unit: 'µs',
      min: 0.5,
      max: 6000,
      step: 0.5,
      def: 250,
      help: 'Rayo: ~1,2 µs · Maniobra de interruptor: 100–300 µs · Temporal (falla): ≥ 3.000 µs.',
    },
    {
      id: 'tTail',
      group: 'Rapidez y duración de la onda',
      label: 'Duración hasta caer a la mitad (cola)',
      unit: 'µs',
      min: 20,
      max: 20000,
      step: 10,
      def: 2500,
      help: 'Rayo: ~50 µs · Maniobra: ~2.500 µs · Temporal: ≥ 8.000 µs (ciclos completos).',
    },
  ],
  presets: [
    {
      id: 'rayo',
      label: 'Rayo (1,2/50 µs)',
      note: 'Golpe ultrarrápido: sube en 1,2 microsegundos y dura apenas 50 µs. Se ensaya con impulso tipo rayo en kV de cresta.',
      values: { um: 245, pu: 3.2, tFront: 1.2, tTail: 50 },
    },
    {
      id: 'maniobra',
      label: 'Maniobra de interruptor (250/2500 µs)',
      note: 'Ocurre al abrir o cerrar un interruptor de línea. Sube ~200 veces más lento que un rayo.',
      values: { um: 245, pu: 2.5, tFront: 250, tTail: 2500 },
    },
    {
      id: 'temporal',
      label: 'Falla temporal a tierra (1,4 p.u.)',
      note: 'Sobrevoltaje sostenido a frecuencia de red (50/60 Hz). Se compara en kV eficaces, no con un impulso.',
      values: { um: 245, pu: 1.4, tFront: 5000, tTail: 10000 },
    },
    {
      id: 'curso',
      label: 'Ejemplo de clase (2,5 p.u. en 245 kV)',
      note: 'Caso de la lámina 14: en Uₘ = 245 kV (Û_f = 200,04 kV), una maniobra de 2,5 p.u. alcanza 500,1 kV de cresta.',
      values: { um: 245, pu: 2.5, tFront: 250, tTail: 2500 },
    },
  ],
  compute: (p) => {
    const ufPeak = p.um * Math.sqrt(2 / 3);
    const crest = p.pu * ufPeak;
    const ratio = p.tTail / Math.max(0.001, p.tFront);
    return { ufPeak, ufRms: p.um / Math.sqrt(3), crest, ratio };
  },
  liveStatus: (p, d) => {
    const cls = e01class(p);
    if (cls === 'atmosférica') {
      return {
        tone: 'warn',
        badge: 'ATMOSFÉRICA · Frente rápido (rayo)',
        message: `El pico llega a ${fmt(d.crest, 1)} kV en solo ${fmt(p.tFront, 1)} µs. Se prueba con impulso tipo rayo 1,2/50 µs en kV de cresta.`,
      };
    }
    if (cls === 'maniobra') {
      return {
        tone: 'ok',
        badge: 'MANIOBRA · Frente lento (interruptor)',
        message: `El pico llega a ${fmt(d.crest, 1)} kV en ${fmt(p.tFront, 0)} µs. Se prueba con impulso de maniobra 170–250/2500 µs en kV de cresta.`,
      };
    }
    return {
      tone: 'bad',
      badge: 'TEMPORAL (TOV) · Frecuencia de red',
      message: `Onda sostenida (frente ${fmt(p.tFront, 0)} µs, cola ${fmt(p.tTail, 0)} µs). No es un impulso: se evalúa en kV eficaces con su duración.`,
    };
  },
  readings: (d, p) => {
    const cls = e01class(p);
    const test =
      cls === 'atmosférica'
        ? 'Impulso rayo 1,2/50 µs (cresta)'
        : cls === 'maniobra'
          ? 'Impulso maniobra 170–250/2500 µs (cresta)'
          : 'Frecuencia industrial (kV eficaces)';
    return [
      { label: 'Cresta fase–tierra', value: `${fmt(d.crest, 1)} kV`, sub: `${fmt(p.pu, 2)} veces el pico normal`, tone: 'neutral' },
      { label: 'Base Û_f (pico normal)', value: `${fmt(d.ufPeak, 2)} kV`, sub: `para Uₘ = ${fmt(p.um, 1)} kV` },
      {
        label: 'Familia de sobretensión',
        value: cls,
        sub: cls === 'atmosférica' ? 'origen: rayo' : cls === 'maniobra' ? 'origen: interruptor' : 'origen: falla / rechazo de carga',
        tone: cls === 'atmosférica' ? 'warn' : cls === 'maniobra' ? 'ok' : 'bad',
      },
      { label: 'Ensayo de laboratorio', value: test, sub: 'siempre misma forma y unidad' },
      { label: 'Relación cola / frente', value: fmt(d.ratio, 0), sub: 'qué tan larga es la cola frente a la subida' },
    ];
  },
  equations: (p, d) => [
    `Û_f = √(2/3) · Uₘ = 0,8165 × ${fmt(p.um, 1)} = ${fmt(d.ufPeak, 2)} kV (pico normal fase–tierra)`,
    `U_cresta = ${fmt(p.pu, 2)} × ${fmt(d.ufPeak, 2)} = ${fmt(d.crest, 1)} kV`,
    `Forma: subida ≈ ${fmt(p.tFront, p.tFront < 10 ? 1 : 0)} µs · cola ≈ ${fmt(p.tTail, 0)} µs → familia ${e01class(p)}`,
    'Decir solo «2,5 p.u.» no basta: la misma altura puede venir de un rayo o de una maniobra y el aire responde distinto.',
  ],
  checks: (p, d) => [
    { label: 'Unidad de comparación correcta', ok: true, detail: 'impulsos en kV de cresta; frecuencia industrial en kV eficaces' },
    { label: 'Forma y duración declaradas', ok: true, detail: `relación cola/frente = ${fmt(d.ratio, 0)}` },
    {
      label: 'Se representa con un ensayo de impulso',
      ok: e01class(p) !== 'temporal',
      detail: e01class(p) === 'temporal' ? 'no: las temporales se evalúan en kV eficaces con su duración' : 'sí: impulso tipo rayo 1,2/50 µs o maniobra 250/2500 µs (lámina 36)',
    },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Configura una maniobra con frente entre 100 y 400 µs y cresta ≥ 500 kV',
      tip: 'Prueba el escenario «Ejemplo de clase» o ajusta frente = 250 µs, cola = 2.500 µs y amplitud ≥ 2,5 p.u. en 245 kV.',
      test: (p, d) => d.crest >= 500 && p.tFront >= 100 && p.tFront <= 400 && e01class(p) === 'maniobra',
      detail: (p, d) => `cresta ${fmt(d.crest, 1)} kV · frente ${fmt(p.tFront, 0)} µs`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Configura un rayo con frente ≤ 5 µs y cola ≤ 100 µs',
      tip: 'Usa el botón «Rayo (1,2/50 µs)» o baja el frente a menos de 5 µs y la cola a menos de 100 µs.',
      test: (p) => p.tFront <= 5 && p.tTail <= 100,
      detail: (p) => `frente ${fmt(p.tFront, 1)} µs · cola ${fmt(p.tTail, 0)} µs`,
    },
  ],
  learn: {
    analogy:
      'Imagina tres golpes sobre un vidrio con la misma fuerza máxima: una pedrada instantánea (rayo, microsegundos), un empujón con la mano (maniobra, milisegundos) y apoyarse encima varios segundos (temporal). Aunque el pico de fuerza se parezca, el vidrio reacciona de forma distinta a cada uno.',
    phenomenon:
      'Una sobretensión es cualquier voltaje que supera el nivel normal de operación de la red. Su peligrosidad depende de tres rasgos a la vez: qué tan alto llega (cresta), qué tan rápido sube (frente) y cuánto tarda en apagarse (cola).',
    objective:
      'Distinguir al instante las tres familias de sobretensión, relacionarlas con su causa física en la red y elegir el ensayo normalizado y la unidad correcta (kV de cresta o kV eficaces).',
    watch: [
      'Alterna entre los botones «Rayo», «Maniobra» y «Falla temporal»: mira a la izquierda qué equipo origina el evento y a la derecha cómo cambia la onda.',
      'Observa la línea punteada azul en el osciloscopio: es el voltaje normal (1,0 p.u.); todo lo que sube por encima es el exceso de sobretensión.',
      'En la gráfica inferior, fíjate en qué franja de color cae el punto «Tu onda» al mover el tiempo de subida.',
    ],
    misconception:
      'Creer que decir «hubo una sobretensión de 2,5 p.u.» ya describe el problema. Sin indicar el frente y la duración no se sabe si corresponde a un ensayo de rayo (1,2/50 µs) o de maniobra (170–250/2500 µs).',
    model: 'Doble exponencial descriptiva para impulsos y onda senoidal para el régimen temporal. No incluye propagación a lo largo de la línea.',
  },
  sources: ['expo39', 'expo77'],
  notes: [
    'Frecuencia industrial en kV eficaces (RMS); impulsos tipo rayo y de maniobra en kV de cresta (pico).',
    'Las láminas definen el impulso tipo rayo 1,2/50 µs y el de maniobra 250/2500 µs (Sobretensiones, p. 36), y las clases por duración y frecuencia (pp. 5–6): frente rápido 0,1–20 µs, frente lento 20–5000 µs, temporales ms–s.',
  ],
  scene: ({ p, d, t }) => {
    const cls = e01class(p);
    const col = FRONT_COLOR[cls];
    const bright = FRONT_BRIGHT[cls];
    return (
      <SceneCanvas
        legend={[
          { color: col, label: `Sobretensión actual (${cls})` },
          { color: PAL.phaseBright, label: `Pico normal Û_f (${fmt(d.ufPeak, 0)} kV)` },
        ]}
        draw={(ctx, w, h) => {
          environment(ctx, w, h, { mood: 'lab' });

          // Panel izquierdo: Causa física real en la red
          const lx = 14;
          const ly = 14;
          const lw = w * 0.31;
          const lh = h - 28;
          ctx.save();
          ctx.fillStyle = '#FFFFFF';
          ctx.strokeStyle = '#CBD5E1';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.roundRect(lx, ly, lw, lh, 10);
          ctx.fill();
          ctx.stroke();
          ctx.restore();

          text(ctx, 'ORIGEN EN LA RED', lx + 12, ly + 18, { size: 9.5, weight: 700, color: PAL.muted, mono: true });
          const midX = lx + lw / 2;
          const floorY = ly + lh * 0.68;

          if (cls === 'atmosférica') {
            line(ctx, lx + 12, floorY, lx + lw - 12, floorY, { color: PAL.earth, width: 2 });
            latticeTower(ctx, midX, floorY, lh * 0.38, { arms: [{ yFrac: 0.78, half: lw * 0.28 }] });
            electricArc(ctx, midX + 6, ly + 32, midX, floorY - lh * 0.38, t * 2, PAL.surge, 2.2);
            pill(ctx, 'Impacto de rayo', midX, floorY + 22, { color: PAL.surge, align: 'center' });
            text(ctx, 'Dura millonésimas de s', midX, floorY + 42, { size: 10, color: PAL.muted, align: 'center' });
          } else if (cls === 'maniobra') {
            // Interruptor de alta tensión cerrando/abriendo
            const cy = ly + lh * 0.46;
            line(ctx, lx + 14, cy, midX - 20, cy, { color: PAL.phase, width: 3 });
            line(ctx, midX + 20, cy, lx + lw - 14, cy, { color: PAL.phase, width: 3 });
            circle(ctx, midX - 20, cy, 4, { fill: PAL.steel });
            circle(ctx, midX + 20, cy, 4, { fill: PAL.steel });
            const ang = -0.35 + 0.25 * Math.sin(t * 3);
            line(ctx, midX - 20, cy, midX - 20 + Math.cos(ang) * 38, cy + Math.sin(ang) * 38, { color: PAL.warn, width: 3 });
            electricArc(ctx, midX + 12, cy - 8, midX + 20, cy, t * 3, PAL.warn, 1.8);
            pill(ctx, 'Maniobra interruptor', midX, floorY + 22, { color: PAL.warn, align: 'center' });
            text(ctx, 'Energización o recierre', midX, floorY + 42, { size: 10, color: PAL.muted, align: 'center' });
          } else {
            // Conductor en falla a tierra
            const cy = ly + lh * 0.38;
            line(ctx, lx + 14, cy, lx + lw - 14, cy, { color: PAL.phase, width: 2.6 });
            line(ctx, lx + 14, cy + 16, lx + lw - 14, cy + 16, { color: PAL.bad, width: 2.6 });
            line(ctx, lx + 12, floorY, lx + lw - 12, floorY, { color: PAL.earth, width: 2 });
            electricArc(ctx, midX, cy + 16, midX, floorY, t * 2.5, PAL.bad, 2);
            groundSymbol(ctx, midX, floorY, 10, PAL.copper);
            pill(ctx, 'Falla fase–tierra', midX, floorY + 24, { color: PAL.bad, align: 'center' });
            text(ctx, 'Dura ciclos o segundos', midX, floorY + 44, { size: 10, color: PAL.muted, align: 'center' });
          }

          // Panel derecho: Osciloscopio de laboratorio
          const sx = lx + lw + 18;
          const sy = 20;
          const sw = w - sx - 18;
          const sh = h - 40;
          scopeScreen(ctx, sx, sy, sw, sh, {
            title: `OSCILOSCOPIO · PICO ${fmt(d.crest, 1)} kV (${fmt(p.pu, 2)} p.u.)`,
          });

          const padL = sx + 22;
          const plotW = sw - 38;
          const baseY = cls === 'temporal' ? sy + sh * 0.58 : sy + sh * 0.82;
          const maxAmp = cls === 'temporal' ? sh * 0.32 : sh * 0.56;

          // Línea cero
          line(ctx, padL, baseY, padL + plotW, baseY, { color: 'rgba(180,210,235,0.35)', width: 1.2 });

          // Nivel de referencia normal 1,0 p.u.
          const refY = baseY - maxAmp * (1 / Math.max(1, p.pu));
          line(ctx, padL, refY, padL + plotW, refY, { color: PAL.phaseBright, dash: [5, 4], width: 1.2, alpha: 0.75 });
          text(ctx, `1,0 p.u. (${fmt(d.ufPeak, 0)} kV)`, padL + plotW - 4, refY - 9, {
            size: 9.5,
            color: PAL.phaseBright,
            align: 'right',
            mono: true,
          });

          // Curva de la sobretensión
          ctx.save();
          ctx.strokeStyle = bright;
          ctx.lineWidth = 2.6;
          ctx.beginPath();
          if (cls === 'temporal') {
            for (let i = 0; i <= 260; i++) {
              const u = i / 260;
              const xx = padL + u * plotW;
              const yy = baseY - Math.sin(u * Math.PI * 6 - t * 3.2) * maxAmp;
              if (i === 0) ctx.moveTo(xx, yy);
              else ctx.lineTo(xx, yy);
            }
          } else {
            const tSpan = Math.max(p.tFront * 6, p.tTail * 2.4);
            const tauF = Math.max(0.15, p.tFront / 2.2);
            let peakVal = 0.01;
            for (let i = 0; i <= 300; i++) {
              const tt = (i / 300) * tSpan;
              const v = Math.exp(-tt / p.tTail) * (1 - Math.exp(-tt / tauF));
              if (v > peakVal) peakVal = v;
            }
            for (let i = 0; i <= 320; i++) {
              const u = i / 320;
              const tt = u * tSpan;
              const v = (Math.exp(-tt / p.tTail) * (1 - Math.exp(-tt / tauF))) / peakVal;
              const xx = padL + u * plotW;
              const yy = baseY - v * maxAmp;
              if (i === 0) ctx.moveTo(xx, yy);
              else ctx.lineTo(xx, yy);
            }
          }
          ctx.stroke();
          ctx.restore();

          // Punto viajero animado
          if (cls !== 'temporal') {
            const u = (t * 0.35) % 1;
            const tSpan = Math.max(p.tFront * 6, p.tTail * 2.4);
            const tauF = Math.max(0.15, p.tFront / 2.2);
            const tt = u * tSpan;
            const vRaw = Math.exp(-tt / p.tTail) * (1 - Math.exp(-tt / tauF));
            const tpA = Math.log(1 + p.tTail / tauF) * tauF;
            const pk = Math.max(0.01, Math.exp(-tpA / p.tTail) * (1 - Math.exp(-tpA / tauF)));
            circle(ctx, padL + u * plotW, baseY - (vRaw / pk) * maxAmp, 4.2, { fill: '#FFFFFF', stroke: bright, width: 2 });
          }

          pill(
            ctx,
            `Subida: ${fmt(p.tFront, p.tFront < 10 ? 1 : 0)} µs · Cola: ${fmt(p.tTail, 0)} µs`,
            padL + 4,
            sy + sh - 16,
            { color: bright, dark: true, mono: true, size: 9.8 },
          );
        }}
        footer={
          <>
            <strong>Qué estás viendo:</strong> a la izquierda el evento real en la red y a la derecha cómo se ve su pulso de voltaje comparado con la operación normal (línea azul punteada).
          </>
        }
      />
    );
  },
  plot: ({ p }) => {
    // Curva V (p.u.) vs t (s) tomada de la figura de la lámina 12: tres mesetas.
    const pts: [number, number][] = [
      [1e-7, 6.4], [1e-4, 6.4], [1e-4, 3.9], [1e-2, 3.9], [1e-2, 1.5], [1e1, 1.5], [1e1, 1.3], [1e3, 1.3],
    ];
    const tS = Math.max(p.tFront * 1e-6, 1.05e-7);
    return (
      <Plot
        xDomain={[1e-7, 1e3]}
        yDomain={[0.8, 7]}
        xLog
        xLabel="Tiempo t (s — escala logarítmica)"
        yLabel="V (p.u.)"
        series={[{ pts, color: PAL.surge, width: 2.6, steps: true, label: 'Clasificación por amplitud y duración (lámina 12)' }]}
        refs={[{ at: 1, label: '1,0 p.u. (operación continua)', color: PAL.phase, dash: '3 4' }]}
        markers={[{ x: tS, y: Math.min(p.pu, 6.9), color: FRONT_COLOR[e01class(p)], label: `Tu onda (${e01class(p)})` }]}
        caption="Tres mesetas, según la figura de la lámina 12: atmosféricas ≈ 6,4 p.u. hasta ~10⁻⁴ s · maniobras ≈ 3,9 p.u. (10⁻⁵–10⁻² s) · temporales ≈ 1,5 p.u. (hasta ~10 s) y después ≈ 1,3. La marca muestra dónde cae tu onda."
      />
    );
  },
};

/* =============================== e02 =============================== */

const e02: Experiment = {
  id: 'e02',
  topicId: 2,
  contextLabel: '¿Por qué dividir por √3 y multiplicar por √2?',
  title: 'De entre fases a fase–tierra (y de eficaz a cresta)',
  tagline: 'Dónde se mide cada voltaje en una torre real para nunca mezclar unidades',
  why: 'Evitar el error número uno en aislamiento: comparar los 245 kV entre dos cables (eficaces) con un impulso de rayo medido de un cable a tierra (en cresta).',
  params: [
    {
      id: 'um',
      label: 'Voltaje máximo entre dos fases (Uₘ)',
      unit: 'kV eficaces',
      min: 72.5,
      max: 550,
      step: 0.5,
      def: 245,
      help: 'Valores usuales en Colombia: 123 kV (red de 115), 245 kV (red de 230) y 550 kV (red de 500).',
    },
  ],
  presets: [
    {
      id: 'curso',
      label: 'Ejemplo de clase: Uₘ = 245 kV',
      note: '245 kV entre fases equivale a 141,45 kV eficaces entre un cable y la torre, y llega a picos de 200,04 kV.',
      values: { um: 245 },
    },
    {
      id: '115',
      label: 'Línea de 115 kV (Uₘ = 123 kV)',
      note: 'Red de subtransmisión regional: 71,0 kV eficaces fase–tierra y 100,4 kV de cresta.',
      values: { um: 123 },
    },
    {
      id: '230',
      label: 'Meta del reto (cresta ~195 kV)',
      note: 'Un Uₘ ligeramente menor a 245 kV deja la cresta fase–tierra entre 190 y 200 kV.',
      values: { um: 245 },
    },
    {
      id: '500',
      label: 'Línea troncal de 500 kV (Uₘ = 550 kV)',
      note: 'Red troncal de extra alta tensión: 317,5 kV eficaces fase–tierra y 449,1 kV de cresta.',
      values: { um: 550 },
    },
  ],
  compute: (p) => {
    const uf = p.um / Math.sqrt(3);
    const up = p.um * Math.sqrt(2 / 3);
    return { uf, up, factor: up / uf, ratioUm: p.um / uf };
  },
  liveStatus: (p, d) => ({
    tone: 'info',
    badge: `CONVERSIÓN ACTIVA · Red Uₘ = ${fmt(p.um, 1)} kV`,
    message: `Entre dos cables hay ${fmt(p.um, 1)} kV eficaces → un aislador ve ${fmt(d.uf, 2)} kV eficaces a la torre (÷√3) y picos de ${fmt(d.up, 2)} kV (×√2).`,
  }),
  readings: (d, p) => [
    { label: 'Tensión fase–tierra eficaz', value: `${fmt(d.uf, 2)} kV`, sub: `Paso 1: Uₘ ÷ √3 (con Uₘ = ${fmt(p.um, 1)} kV)`, tone: 'ok' },
    { label: 'Cresta fase–tierra', value: `${fmt(d.up, 2)} kV`, sub: 'Paso 2: U_f × √2 (pico máximo del ciclo)', tone: 'warn' },
    { label: 'Relación cresta / eficaz', value: fmt(d.factor, 3), sub: '√2 ≈ 1,414 en onda senoidal' },
    { label: 'Relación entre fases / fase–tierra', value: fmt(d.ratioUm, 3), sub: '√3 ≈ 1,732 en red trifásica equilibrada' },
  ],
  equations: (p, d) => [
    `Paso 1 (cable a torre, eficaz): U_f = Uₘ / √3 = ${fmt(p.um, 1)} / 1,7321 = ${fmt(d.uf, 2)} kV eficaces`,
    `Paso 2 (pico más alto de la onda): Û_f = √2 · U_f = 1,4142 × ${fmt(d.uf, 2)} = ${fmt(d.up, 2)} kV de cresta`,
    `Atajo directo: Û_f = √(2/3) · Uₘ = 0,8165 × ${fmt(p.um, 1)} = ${fmt(d.up, 2)} kV de cresta`,
    'El aislador cuelga entre UN cable de fase y la torre aterrizada: por eso casi todos los cálculos parten de U_f o Û_f.',
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Observa el caso de clase: Uₘ = 245 kV → 141,45 kV eficaces y 200,04 kV de cresta',
      tip: 'Pulsa el escenario «Ejemplo de clase: Uₘ = 245 kV».',
      test: (_p, d) => Math.abs(d.uf - 141.45) < 0.4 && Math.abs(d.up - 200.04) < 0.5,
      detail: (_p, d) => `U_f = ${fmt(d.uf, 2)} kV · Û_f = ${fmt(d.up, 2)} kV`,
    },
    {
      id: 'g2',
      label: 'Mueve Uₘ para que la cresta fase–tierra (Û_f) quede entre 190 y 200 kV',
      tip: 'Baja un poco el control Uₘ desde 245 kV (por ejemplo entre 233 y 244,5 kV).',
      test: (_p, d) => d.up >= 190 && d.up <= 200,
      detail: (_p, d) => `Û_f actual = ${fmt(d.up, 2)} kV (meta: 190 a 200 kV)`,
    },
  ],
  learn: {
    analogy:
      'Cuando dices «en mi casa hay 120 V», ese es el valor eficaz (el promedio que calienta una plancha), pero 120 veces por segundo el enchufe realmente sube hasta 170 V de pico (120 × √2). En una torre de alta tensión pasa igual: el aislador debe aguantar el pico real, no solo el promedio.',
    phenomenon:
      'Una línea trifásica lleva tres cables (A, B y C) desfasados 120°. El voltaje nombrado de la línea (Uₘ) se mide entre dos cables, pero cada cadena de aisladores está conectada entre un solo cable y la torre a tierra (Uₘ/√3), y su pico instantáneo sube √2 veces más.',
    objective:
      'Pasar sin dudar de Uₘ (entre fases, eficaz) a U_f (fase–tierra, eficaz) y a Û_f (fase–tierra, cresta), entendiendo físicamente dónde aparece cada voltaje en la torre.',
    watch: [
      'En la torre de la izquierda, compara la cota azul Uₘ (de cable A a cable B) con la cota verde U_f (de cable A a la torre/tierra).',
      'En el osciloscopio de la derecha, observa que el nivel eficaz (verde) queda por debajo de la punta amarilla (cresta Û_f).',
      'Cambia entre 123 kV, 245 kV y 550 kV: los tres voltajes escalan juntos manteniendo siempre Û_f = 0,8165 · Uₘ.',
    ],
    misconception:
      'Multiplicar 245 kV directamente por √2 cuando se busca el voltaje a tierra, o comparar 245 kV eficaces con 200 kV de cresta creyendo que 200 es menor. Primero divide entre √3, luego multiplica por √2.',
    model: 'Red trifásica sinusoidal equilibrada en operación normal previa a una falla.',
  },
  sources: ['expo39', 'expo77'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      legend={[
        { color: PAL.phase, label: `Uₘ entre 2 fases (${fmt(p.um, 1)} kV ef.)` },
        { color: PAL.ok, label: `U_f cable–torre (${fmt(d.uf, 1)} kV ef.)` },
        { color: PAL.warn, label: `Û_f pico instantáneo (${fmt(d.up, 1)} kV cresta)` },
      ]}
      draw={(ctx, w, h) => {
        const gy = h * 0.87;
        environment(ctx, w, h, { mood: 'day', groundY: gy });
        sceneHeader(ctx, '¿Dónde está cada voltaje en la torre?', 'Izq: ubicación física · Der: onda en un cable');

        // Izquierda: torre trifásica con cables A y B y cotas reales
        const tx = w * 0.22;
        const th = h * 0.6;
        const armHalf = w * 0.13;
        latticeTower(ctx, tx, gy, th, { arms: [{ yFrac: 0.84, half: armHalf }] });
        groundSymbol(ctx, tx, gy + 3, 11, PAL.copper);

        const armY = gy - th * 0.84;
        const aX = tx - armHalf;
        const bX = tx + armHalf;
        const sA = insulatorString(ctx, aX, armY, 8, 34, 0);
        const sB = insulatorString(ctx, bX, armY, 8, 34, 0);

        circle(ctx, sA.endX, sA.endY + 3, 6, { fill: PAL.phase, stroke: '#FFFFFF', width: 1.5 });
        circle(ctx, sB.endX, sB.endY + 3, 6, { fill: PAL.phase, stroke: '#FFFFFF', width: 1.5 });
        text(ctx, 'Fase A', sA.endX, sA.endY + 18, { size: 10, weight: 700, color: PAL.phase, align: 'center' });
        text(ctx, 'Fase B', sB.endX, sB.endY + 18, { size: 10, weight: 700, color: PAL.phase, align: 'center' });

        // Cota entre fases Um
        dimension(ctx, sA.endX, sA.endY + 34, sB.endX, sB.endY + 34, `Uₘ = ${fmt(p.um, 0)} kV`, PAL.phase);
        // Cota fase a tierra Uf
        dimension(ctx, sA.endX - 18, sA.endY + 3, sA.endX - 18, gy - 2, `U_f = ${fmt(d.uf, 1)} kV`, PAL.ok);

        // Derecha: osciloscopio con senoide de Fase A a tierra
        const sx = w * 0.45;
        const sy = 20;
        const sw = w * 0.51;
        const sh = gy - 32;
        scopeScreen(ctx, sx, sy, sw, sh, { title: 'ONDA DE FASE A RESPECTO A TIERRA (60 Hz)' });

        const x0 = sx + 16;
        const pw = sw - 32;
        const y0 = sy + sh * 0.55;
        const amp = sh * 0.33;

        line(ctx, x0, y0, x0 + pw, y0, { color: 'rgba(180,210,235,0.32)', width: 1.1 });

        const yPk = y0 - amp;
        const yRms = y0 - amp * Math.SQRT1_2;
        line(ctx, x0, yPk, x0 + pw, yPk, { color: PAL.warnBright, dash: [5, 4], width: 1.3 });
        line(ctx, x0, yRms, x0 + pw, yRms, { color: PAL.okBright, dash: [4, 4], width: 1.3 });

        // Senoide viva
        ctx.save();
        ctx.strokeStyle = PAL.phaseBright;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        for (let i = 0; i <= 220; i++) {
          const u = i / 220;
          const xx = x0 + u * pw;
          const yy = y0 - Math.sin(u * Math.PI * 4 - t * 2.2) * amp;
          if (i === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
        ctx.restore();

        pill(ctx, `Cresta Û_f = ${fmt(d.up, 1)} kV (×√2)`, x0 + pw - 4, yPk - 2, {
          color: PAL.warnBright,
          dark: true,
          align: 'right',
          mono: true,
          size: 9.5,
        });
        pill(ctx, `Eficaz U_f = ${fmt(d.uf, 1)} kV (÷√3)`, x0 + 4, yRms + 13, {
          color: PAL.okBright,
          dark: true,
          align: 'left',
          mono: true,
          size: 9.5,
        });
      }}
      footer={
        <>
          <strong>Regla práctica:</strong> de cable a cable tienes <strong>Uₘ</strong>; divide por <strong>√3</strong> para ver el voltaje en el aislador (<strong>U_f</strong>) y multiplica por <strong>√2</strong> para conocer el pico real (<strong>Û_f</strong>).
        </>
      }
    />
  ),
  plot: ({ p, d }) => {
    const pts: [number, number][] = linspace(0, 33.3, 240).map((ms) => [ms, d.up * Math.sin((2 * Math.PI * 60 * ms) / 1000)]);
    return (
      <Plot
        xDomain={[0, 33.3]}
        yDomain={[-d.up * 1.18, d.up * 1.18]}
        xLabel="Tiempo (ms — dos ciclos de red)"
        yLabel="Voltaje cable–tierra (kV)"
        series={[{ pts, color: PAL.phase, label: `Onda instantánea (Uₘ = ${fmt(p.um, 0)} kV)` }]}
        refs={[
          { at: d.up, label: `Cresta Û_f = ${fmt(d.up, 1)} kV`, color: PAL.warn },
          { at: d.uf, label: `Eficaz U_f = ${fmt(d.uf, 1)} kV`, color: PAL.ok },
          { at: -d.uf, color: PAL.ok, dash: '2 4' },
        ]}
        caption="En cada ciclo el voltaje toca dos veces la cresta (±Û_f). El valor eficaz U_f está 1,41 veces más abajo."
      />
    );
  },
};

/* =============================== e03 =============================== */

const e03: Experiment = {
  id: 'e03',
  topicId: 2,
  contextLabel: 'Prueba de rayo en laboratorio',
  title: 'La onda 1,2/50 µs: cómo se mide un impulso de prueba',
  tagline: 'Frente (t₁), cola (t₂) y origen virtual sobre la pantalla del generador de impulsos',
  why: 'Comprender qué significan «1,2» y «50» en la onda impulso tipo rayo (Sobretensiones, p. 36) y por qué no son iguales a las constantes τ₁ y τ₂ de la fórmula.',
  params: [
    {
      id: 'amp',
      label: 'Voltaje pico del disparo (cresta)',
      unit: 'kV',
      min: 200,
      max: 1600,
      step: 10,
      def: 1050,
      help: '1.050 kV es el BIL típico de ensayo para equipos de 245 kV.',
    },
    {
      id: 'tau1',
      label: 'Constante de subida rápida (τ₁)',
      unit: 'µs',
      min: 0.1,
      max: 2,
      step: 0.01,
      def: 0.41,
      help: 'Controla principalmente qué tan empinado sube el frente t₁.',
    },
    {
      id: 'tau2',
      label: 'Constante de descarga lenta (τ₂)',
      unit: 'µs',
      min: 10,
      max: 120,
      step: 0.5,
      def: 66,
      help: 'Controla cuánto tarda la cola en bajar al 50 % (t₂).',
    },
  ],
  presets: [
    {
      id: 'rayo',
      label: 'Impulso normalizado 1,2/50 µs (1.050 kV)',
      note: 'Con τ₁ = 0,41 µs y τ₂ = 66 µs se obtiene t₁ = 1,21 µs y t₂ = 48,5 µs: cumple holgadamente la norma.',
      values: { amp: 1050, tau1: 0.41, tau2: 66 },
    },
    {
      id: 'mal',
      label: 'Generador descalibrado (sube lento, cae rápido)',
      note: 'τ₁ = 1,5 µs y τ₂ = 30 µs dan ~4,1/24 µs: fuera de tolerancia. ¡Intenta calibrarlo tú mismo!',
      values: { amp: 1050, tau1: 1.5, tau2: 30 },
    },
    {
      id: 'curso',
      label: 'Ejemplo de la guía (0,41 / 66 µs)',
      note: 'Demuestra que τ₁ = 0,41 y τ₂ = 66 NO valen 1,2 ni 50, pero producen la onda 1,2/50 µs.',
      values: { amp: 1050, tau1: 0.41, tau2: 66 },
    },
  ],
  compute: (p) => {
    const m = impulseMetrics(p.tau1, p.tau2);
    const okFront = Math.abs(m.t1 - 1.2) <= 0.15 ? 1 : 0;
    const okTail = Math.abs(m.t2 - 50) <= 5 ? 1 : 0;
    return {
      tau1: m.tau1,
      tau2: m.tau2,
      tp: m.tp,
      t30: m.t30,
      t90: m.t90,
      t1: m.t1,
      t0: m.t0,
      t2: m.t2,
      t50: m.t50,
      amp: p.amp,
      okFront,
      okTail,
      okAll: okFront * okTail,
    };
  },
  liveStatus: (p, d) => {
    const label = impulseMetrics(p.tau1, p.tau2).label;
    if (d.okAll) {
      return {
        tone: 'ok',
        badge: `CALIBRADO · Onda ${label}`,
        message: `El generador entrega un impulso válido 1,2/50 µs (frente ${fmt(d.t1, 2)} µs y cola ${fmt(d.t2, 1)} µs) con pico de ${fmt(p.amp, 0)} kV.`,
      };
    }
    return {
      tone: 'warn',
      badge: `POR CALIBRAR · Onda actual ${label}`,
      message: `Ajusta τ₁ para acercar el frente t₁ (${fmt(d.t1, 2)} µs) a 1,2 µs y τ₂ para acercar la cola t₂ (${fmt(d.t2, 1)} µs) a 50 µs.`,
    };
  },
  readings: (d, p) => [
    {
      label: 'Frente t₁ = 1,67·(t₉₀−t₃₀)',
      value: `${fmt(d.t1, 2)} µs`,
      sub: `meta: 1,20 ± 0,15 µs (t₃₀=${fmt(d.t30, 2)}, t₉₀=${fmt(d.t90, 2)})`,
      tone: d.okFront ? 'ok' : 'warn',
    },
    {
      label: 'Semiamplitud de cola t₂',
      value: `${fmt(d.t2, 2)} µs`,
      sub: `meta: 50 ± 5 µs (origen t₀ = ${fmt(d.t0, 2)} µs)`,
      tone: d.okTail ? 'ok' : 'warn',
    },
    { label: 'Etiqueta de la onda', value: impulseMetrics(p.tau1, p.tau2).label, sub: 'formato estándar frente / cola' },
    { label: 'Instante de cresta', value: `${fmt(d.tp, 2)} µs`, sub: `pico de ${fmt(d.amp, 0)} kV` },
    { label: 'Constantes internas τ₁ y τ₂', value: `${fmt(d.tau1, 2)} y ${fmt(d.tau2, 1)} µs`, sub: 'parámetros del circuito, no la etiqueta' },
  ],
  equations: (p, d) => [
    `Onda doble exponencial: v(t) = ${fmt(p.amp, 0)} · (e^(−t/${fmt(p.tau2, 1)}) − e^(−t/${fmt(p.tau1, 2)})) normalizada al pico`,
    `Cruces en la subida: 30 % en t₃₀ = ${fmt(d.t30, 2)} µs · 90 % en t₉₀ = ${fmt(d.t90, 2)} µs`,
    `Tiempo de frente: t₁ = 1,67 · (${fmt(d.t90, 2)} − ${fmt(d.t30, 2)}) = ${fmt(d.t1, 2)} µs`,
    `Tiempo de cola: t₂ = t₅₀ − t₀ = ${fmt(d.t50, 2)} − (${fmt(d.t0, 2)}) = ${fmt(d.t2, 2)} µs → onda ${impulseMetrics(p.tau1, p.tau2).label}`,
  ],
  checks: (_p, d) => [
    { label: 'Frente t₁ dentro de 1,2 ± 0,15 µs', ok: d.okFront === 1, detail: `actual: ${fmt(d.t1, 2)} µs` },
    { label: 'Cola t₂ dentro de 50 ± 5 µs', ok: d.okTail === 1, detail: `actual: ${fmt(d.t2, 2)} µs` },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Calibra τ₁ y τ₂ para lograr una onda 1,2/50 µs (frente ±0,15 µs y cola ±5 µs)',
      tip: 'Si t₁ es muy grande, baja τ₁ cerca de 0,40 µs. Si t₂ es muy corta, sube τ₂ cerca de 65–70 µs.',
      test: (_p, d) => d.okAll === 1,
      detail: (_p, d) => `t₁ = ${fmt(d.t1, 2)} µs · t₂ = ${fmt(d.t2, 2)} µs`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Observa un generador descalibrado: frente > 2 µs o cola < 30 µs',
      tip: 'Carga «Generador descalibrado» y mira los dos semáforos en rojo antes de calibrar.',
      test: (_p, d) => d.t1 > 2 || d.t2 < 30,
      detail: (_p, d) => `t₁ = ${fmt(d.t1, 2)} µs · t₂ = ${fmt(d.t2, 2)} µs`,
    },
  ],
  learn: {
    analogy:
      'Como el inicio real de un disparo en laboratorio suele tener ruido eléctrico, los ingenieros no miden desde el 0 % sino entre el 30 % y el 90 % de la subida (donde la curva es limpia) y proyectan una regla hasta el eje cero: ese cruce es el «origen virtual».',
    phenomenon:
      'El impulso tipo rayo 1,2/50 µs queda definido por el frente convencional t₁ = 1,67·(t₉₀−t₃₀) con origen virtual t₀, y por la cola hasta la semiamplitud t₂ (Sobretensiones, p. 36). Las láminas también definen el impulso de maniobra 250/2500 µs.',
    objective:
      'Saber leer los dos números de «1,2/50 µs», distinguirlos de las constantes exponenciales τ₁ y τ₂, y nunca confundir 1,2/50 µs (voltaje) con 8/20 µs (corriente).',
    watch: [
      'Carga «Generador descalibrado» y mueve primero solo τ₁: verás cómo se endereza la subida t₁ casi sin cambiar la cola.',
      'Ahora mueve τ₂ hasta ~66–68 µs: verás estirarse la cola hasta que la marca del 50 % caiga en 50 µs y el semáforo pase a verde.',
      'Mira la línea punteada que pasa por 30 % y 90 % en la gráfica: así se define t₁ = 1,67·(t₉₀ − t₃₀).',
    ],
    misconception: 'Escribir e^(−t/50) − e^(−t/1,2) creyendo que 1,2 y 50 son τ₁ y τ₂. Si haces eso, el frente real sale de ~3,2 µs, no de 1,2 µs.',
    model: 'Doble exponencial ideal sin oscilaciones superpuestas; origen virtual exacto sobre la secante 30–90 %.',
  },
  sources: ['expo39', 'expo77'],
  notes: ['Las láminas definen las formas de impulso 1,2/50 µs y 250/2500 µs (p. 36) y los dos retardos que gobiernan la ruptura: el estadístico t_s y el formativo t_f (p. 36). Las tolerancias de calibración del generador corresponden a la norma de técnicas de ensayo, fuera del alcance de las láminas.'],
  scene: ({ p, d, t }) => {
    const m = impulseMetrics(p.tau1, p.tau2);
    const waveCol = d.okAll ? PAL.okBright : PAL.warnBright;
    return (
      <SceneCanvas
        legend={[
          { color: waveCol, label: `Pulso generado (${m.label})` },
          { color: PAL.phaseBright, label: 'Marcas 30 % y 90 % (definen frente t₁)' },
          { color: PAL.surgeBright, label: `Caída al 50 % (define cola t₂ = ${fmt(d.t2, 1)} µs)` },
        ]}
        draw={(ctx, w, h) => {
          environment(ctx, w, h, { mood: 'lab' });
          const sx = 20;
          const sy = 18;
          const sw = w - 40;
          const sh = h - 36;
          scopeScreen(ctx, sx, sy, sw, sh, {
            title: `GENERADOR DE IMPULSO MARX · CRESTA ${fmt(p.amp, 0)} kV`,
          });

          const x0 = sx + 42;
          const y0 = sy + sh * 0.8;
          const pw = sw - 64;
          const ph = sh * 0.58;
          const tMax = Math.max(25, m.t50 * 1.55);
          const toX = (tt: number) => x0 + (tt / tMax) * pw;
          const toY = (v: number) => y0 - v * ph;

          line(ctx, x0, y0, x0 + pw, y0, { color: 'rgba(180,210,235,0.35)', width: 1.2 });
          line(ctx, x0, y0, x0, y0 - ph * 1.05, { color: 'rgba(180,210,235,0.35)', width: 1.2 });

          // Línea horizontal 50 % y 100 %
          line(ctx, x0, toY(1), x0 + pw, toY(1), { color: 'rgba(255,202,87,0.28)', dash: [4, 4] });
          line(ctx, x0, toY(0.5), toX(Math.min(tMax, m.t50)), toY(0.5), { color: PAL.surgeBright, dash: [4, 4], width: 1.3 });
          line(ctx, toX(Math.min(tMax, m.t50)), y0, toX(Math.min(tMax, m.t50)), toY(0.5), { color: PAL.surgeBright, dash: [4, 4], width: 1.3 });
          text(ctx, '100 %', x0 - 6, toY(1), { size: 9, color: PAL.warnBright, align: 'right', mono: true });
          text(ctx, '50 %', x0 - 6, toY(0.5), { size: 9, color: PAL.surgeBright, align: 'right', mono: true });

          // Traza completa tenue + barrido brillante
          const sweep = ((t * 0.45) % 1.2) * tMax;
          for (const [limit, alpha, lw] of [
            [tMax, 0.28, 1.6],
            [sweep, 1, 2.7],
          ] as const) {
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = waveCol;
            ctx.lineWidth = lw;
            ctx.beginPath();
            for (let i = 0; i <= 320; i++) {
              const tt = (i / 320) * tMax;
              if (tt > limit) break;
              const v = impulseShape(tt, p.tau1, p.tau2);
              if (i === 0) ctx.moveTo(toX(tt), toY(v));
              else ctx.lineTo(toX(tt), toY(v));
            }
            ctx.stroke();
            ctx.restore();
          }

          // Puntos clave
          circle(ctx, toX(m.t30), toY(0.3), 3.6, { fill: PAL.phaseBright });
          circle(ctx, toX(m.t90), toY(0.9), 3.6, { fill: PAL.phaseBright });
          circle(ctx, toX(m.tp), toY(1), 4.5, { fill: PAL.warnBright, stroke: '#FFFFFF', width: 1.5 });
          if (m.t50 <= tMax) {
            circle(ctx, toX(m.t50), toY(0.5), 4.5, { fill: PAL.surgeBright, stroke: '#FFFFFF', width: 1.5 });
            dimension(ctx, x0, y0 + 16, toX(m.t50), y0 + 16, `cola t₂ = ${fmt(m.t2, 1)} µs`, PAL.surgeBright, true);
          }

          pill(ctx, `frente t₁ = ${fmt(m.t1, 2)} µs`, toX(m.tp) + 12, toY(0.95), { color: PAL.phaseBright, dark: true, mono: true, size: 9.8 });
          pill(ctx, d.okAll ? `✓ ${m.label} (norma 1,2/50)` : `Onda: ${m.label}`, sx + sw - 12, sy + 16, {
            color: waveCol,
            dark: true,
            align: 'right',
            mono: true,
            size: 10,
          });
        }}
        footer={
          <>
            <strong>Clave visual:</strong> el disparo sube casi verticalmente hasta el pico (<strong>t₁ = {fmt(d.t1, 2)} µs</strong>) y luego se descarga despacio hasta cruzar el 50 % (<strong>t₂ = {fmt(d.t2, 1)} µs</strong>).
          </>
        }
      />
    );
  },
  plot: ({ p }) => {
    const m = impulseMetrics(p.tau1, p.tau2);
    const xMax = Math.max(20, p.tau2 * 1.45);
    const pts: [number, number][] = linspace(0, xMax, 280).map((x) => [x, impulseShape(x, p.tau1, p.tau2) * p.amp]);
    const slope = (0.9 - 0.3) / Math.max(1e-6, m.t90 - m.t30);
    const tang: [number, number][] = linspace(Math.max(0, m.t0), m.t90 * 1.11, 24).map((x) => [x, Math.min(p.amp, slope * (x - m.t0) * p.amp)]);
    return (
      <Plot
        xDomain={[0, xMax]}
        yDomain={[0, p.amp * 1.1]}
        xLabel="Tiempo desde el disparo (µs)"
        yLabel="Voltaje de ensayo (kV)"
        series={[
          { pts, color: PAL.porcelain, width: 2.4, area: true, label: `Impulso ${m.label}` },
          { pts: tang, color: PAL.phase, dash: '5 4', width: 1.6, label: 'Recta 30–90 % (frente)' },
        ]}
        markers={[
          { x: m.t30, y: 0.3 * p.amp, color: PAL.phase, label: '30 %' },
          { x: m.t90, y: 0.9 * p.amp, color: PAL.phase, label: '90 %' },
          { x: m.tp, y: p.amp, color: PAL.warn, label: `Cresta (${fmt(p.amp, 0)} kV)` },
          { x: Math.min(xMax, m.t50), y: 0.5 * p.amp, color: PAL.surge, label: `t₂ = ${fmt(m.t2, 1)} µs` },
        ]}
        refs={[{ at: 0.5 * p.amp, label: `Semiamplitud 50 % (${fmt(0.5 * p.amp, 0)} kV)`, color: PAL.surge }]}
        caption={`Frente convencional t₁ = 1,67·(t₉₀ − t₃₀) = ${fmt(m.t1, 2)} µs · cola t₂ = ${fmt(m.t2, 2)} µs · origen virtual t₀ = ${fmt(m.t0, 2)} µs.`}
      />
    );
  },
};

export const overvoltageExperiments: Experiment[] = [e01, e02, e03];
