import { airDensity, cfoFromInsulators, cfoRequired, creepageRequired, densityCorrected, fmt, insulatorsFromCfo, linspace, normalCdf, pressureAt, switchingSupport } from '../../lib/num';
import { PAL, circle, dimension, environment, groundSymbol, insulatorString, latticeTower, line, pill, sceneHeader, text } from '../../lib/draw';
import { BarComparisonPlot, Plot, SceneCanvas } from '../../components/ui';
import type { Experiment } from '../types';

/* =============================== e07 =============================== */

const e07: Experiment = {
  id: 'e07',
  topicId: 4,
  contextLabel: 'Línea en la cordillera',
  title: 'Bogotá 2.640 m: el aire es más delgado',
  tagline: 'Mide la presión y la densidad δ, y mira cuánto pierde el aislamiento expuesto al aire',
  why: 'Cuantificar por qué el mismo aislador externo soporta menos tensión en montaña, mientras un transformador sellado conserva su nivel interno.',
  params: [
    {
      id: 'h',
      group: 'Dónde está la línea',
      label: 'Altitud sobre el nivel del mar',
      unit: 'm',
      min: 0,
      max: 4000,
      step: 10,
      def: 2640,
      help: '0 m = Barranquilla/Cartagena · 1.750 m ≈ Manizales · 2.640 m = Bogotá · 3.200 m ≈ páramo.',
    },
    {
      id: 'temp',
      group: 'Dónde está la línea',
      label: 'Temperatura ambiente',
      unit: '°C',
      min: 0,
      max: 35,
      step: 0.5,
      def: 14,
      help: 'El cálculo usa kelvin: T(K) = °C + 273,15.',
    },
    {
      id: 'n',
      group: 'Qué estás comparando',
      label: 'Exponente de corrección (n)',
      min: 0.5,
      max: 1.5,
      step: 0.05,
      def: 1,
      help: 'La corrección del documento (lámina 15 del Expo 77) es dividir por δ: exponente 1. Se deja editable para comparar.',
    },
    {
      id: 'uref',
      group: 'Qué estás comparando',
      label: 'Tensión soportada a nivel del mar (U_ref)',
      unit: 'kV',
      min: 400,
      max: 1400,
      step: 10,
      def: 700,
      help: 'Nivel de referencia de un aislamiento externo expuesto al aire.',
    },
  ],
  presets: [
    {
      id: 'bogota',
      label: 'Bogotá (2.640 m, 14 °C)',
      note: 'Caso real del curso: presión 73,38 kPa y δ = 0,739. La capacidad externa cae ~20 %.',
      values: { h: 2640, temp: 14, n: 1, uref: 700 },
    },
    {
      id: 'mar',
      label: 'Costa Caribe (0 m, 30 °C)',
      note: 'Aire denso y cálido: aún a 30 °C la densidad relativa δ se mantiene cerca de 0,97.',
      values: { h: 0, temp: 30, n: 1, uref: 700 },
    },
    {
      id: 'reto',
      label: 'Reto de la guía (δ ≈ 0,81)',
      note: 'Altitud intermedia ~1.750 m a 20 °C: δ entre 0,80 y 0,82 y U corregida todavía por encima de 575 kV.',
      values: { h: 1750, temp: 20, n: 1, uref: 700 },
    },
    {
      id: 'paramo',
      label: 'Páramo andino (3.200 m, 5 °C)',
      note: 'Aire muy delgado: se requiere más distancia y más discos que en Bogotá, aunque la temperatura sea baja.',
      values: { h: 3200, temp: 5, n: 1, uref: 700 },
    },
  ],
  compute: (p) => {
    const pressure = pressureAt(p.h);
    const delta = airDensity(p.h, p.temp);
    const corrected = densityCorrected(p.uref, delta, p.n);
    return { pressure, delta, corrected, loss: 1 - corrected / p.uref, internal: p.uref };
  },
  liveStatus: (p, d) => {
    if (d.loss >= 0.15) {
      return {
        tone: 'bad',
        badge: `ALTITUD CRÍTICA · δ = ${fmt(d.delta, 3)}`,
        message: `Solo hay ${fmt(d.delta * 100, 0)} % del aire de referencia: el aislamiento externo baja de ${fmt(p.uref, 0)} a ${fmt(d.corrected, 1)} kV (−${fmt(d.loss * 100, 1)} %).`,
      };
    }
    if (d.loss > 0.03) {
      return {
        tone: 'warn',
        badge: `CORRECCIÓN POR ALTURA · δ = ${fmt(d.delta, 3)}`,
        message: `A ${fmt(p.h, 0)} m y ${fmt(p.temp, 1)} °C la presión es ${fmt(d.pressure, 2)} kPa; se corrige solo el aislamiento externo a ${fmt(d.corrected, 1)} kV.`,
      };
    }
    return {
      tone: 'ok',
      badge: `AIRE DENSO · δ = ${fmt(d.delta, 3)}`,
      message: `A ${fmt(p.h, 0)} m la corrección es pequeña: la capacidad externa queda en ${fmt(d.corrected, 1)} kV.`,
    };
  },
  readings: (d, p) => [
    { label: 'Presión atmosférica', value: `${fmt(d.pressure, 2)} kPa`, sub: 'modelo barométrico estándar' },
    {
      label: 'Densidad relativa δ',
      value: fmt(d.delta, 3),
      sub: `(p/101,325)·(293,15/T)`,
      tone: d.delta < 0.8 ? 'warn' : 'ok',
    },
    {
      label: 'Capacidad externa corregida',
      value: `${fmt(d.corrected, 1)} kV`,
      sub: `${fmt(p.uref, 0)} · ${fmt(d.delta, 3)}^${fmt(p.n, 2)}`,
      tone: 'neutral',
    },
    {
      label: 'Pérdida por altitud',
      value: `${fmt(d.loss * 100, 1)} %`,
      sub: 'solo lo que está expuesto al aire',
      tone: d.loss > 0.15 ? 'bad' : 'warn',
    },
    { label: 'Aislamiento interno sellado', value: `${fmt(d.internal, 0)} kV`, sub: 'no se corrige de la misma forma', tone: 'ok' },
  ],
  equations: (p, d) => [
    `p(h) ≈ 101,325·(1 − 2,25577×10⁻⁵·h)^5,25588 = ${fmt(d.pressure, 2)} kPa`,
    `T en kelvin: T = ${fmt(p.temp, 1)} + 273,15 = ${fmt(p.temp + 273.15, 2)} K`,
    `δ = (p/p₀)·(T₀/T) = (${fmt(d.pressure, 2)}/101,325)·(293,15/${fmt(p.temp + 273.15, 2)}) = ${fmt(d.delta, 3)}`,
    `U_h = U_ref·δⁿ = ${fmt(p.uref, 0)} × ${fmt(d.delta, 3)}^${fmt(p.n, 2)} = ${fmt(d.corrected, 1)} kV (pérdida ${fmt(d.loss * 100, 1)} %)`,
    'Importante: δ corrige el medio aire. El aceite o gas sellado dentro de un transformador no se reduce con la misma regla.',
  ],
  checks: (p, d) => [
    { label: 'Se usa temperatura absoluta (K) en δ', ok: true, detail: `${fmt(p.temp + 273.15, 2)} K` },
    { label: 'La corrección se aplica al aislamiento externo', ok: true, detail: `U_h = ${fmt(d.corrected, 1)} kV` },
    {
      label: 'Por encima de 1.000 m se declara la corrección',
      ok: p.h <= 1000 || d.delta < 0.98,
      detail: p.h > 1000 ? `aplicada (δ = ${fmt(d.delta, 3)})` : 'a nivel del mar casi no aplica',
    },
    { label: 'El equipo interno se mantiene en su nivel', ok: true, detail: `${fmt(d.internal, 0)} kV` },
  ],
  goals: [
    {
      id: 'g1',
      label: 'Encuentra una altitud con δ entre 0,80 y 0,82 y U corregida ≥ 575 kV',
      tip: 'Pulsa «Reto de la guía (δ ≈ 0,81)» o baja la altitud desde Bogotá hasta ~1.750 m con 20 °C.',
      test: (_p, d) => d.delta >= 0.8 && d.delta <= 0.82 && d.corrected >= 575,
      detail: (_p, d) => `δ = ${fmt(d.delta, 3)} · U_h = ${fmt(d.corrected, 1)} kV`,
    },
    {
      id: 'g2',
      kind: 'exploracion',
      label: 'Reproduce una condición de alta montaña con δ ≤ 0,75',
      tip: 'El escenario de Bogotá ya muestra δ = 0,739; el páramo es aún menor.',
      test: (_p, d) => d.delta <= 0.75,
      detail: (_p, d) => `δ = ${fmt(d.delta, 3)}`,
    },
  ],
  learn: {
    analogy:
      'En la costa el aire es como una multitud apretada que frena electrones; en la montaña la misma multitud está más separada. Con menos moléculas en el camino, una chispa encuentra vía libre a un voltaje menor.',
    phenomenon:
      'Al subir, baja la presión atmosférica y el aire se vuelve menos denso. El aislamiento externo (aire alrededor de cadenas, conductores y bujes) pierde capacidad; el aislamiento interno hermético de aceite o SF₆ no depende del aire exterior de la misma forma.',
    objective:
      'Calcular δ con presión y temperatura absolutas, corregir una tensión soportada y decidir qué equipos se corrigen y cuáles no.',
    watch: [
      'Mueve la altitud: la torre SUBE por la ladera de la montaña (la cota azul crece) y los puntitos de aire se separan.',
      'Compara la barra verde de la costa con la barra ámbar de la altitud: la segunda es más corta, pero la del equipo sellado permanece igual.',
      'En la gráfica, observa que a igual altitud la curva de 30 °C queda por debajo de la de 0 °C.',
    ],
    misconception:
      'Aplicar δ a todo el equipo o escribir °C dentro de la fórmula δ = (p/p₀)(T₀/T). La temperatura debe estar en kelvin y el alcance se limita al aislamiento externo.',
    model: 'Atmósfera estándar barométrica y corrección del documento CFO/δ (Expo 77, p. 15; Sobretensiones, p. 38). No incluye humedad, lluvia ni contaminación.',
  },
  sources: ['expo39', 'expo77'],
  notes: ['En Colombia, por encima de 1.000 m s.n.m. la corrección por altitud del aislamiento externo es una condición de proyecto, no un detalle opcional.'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      legend={[
        { color: 'rgba(11,99,206,0.45)', label: 'Moléculas de aire (más separadas en altura)' },
        { color: PAL.phase, label: 'Nivel del mar (referencia)' },
        { color: PAL.ok, label: 'Capacidad interna sellada (sin corregir)' },
      ]}
      draw={(ctx, w, h) => {
        const seaY = h * 0.86;
        const groundY = seaY - (p.h / 4000) * h * 0.5;
        environment(ctx, w, h, { mood: 'day', groundY, mountains: true, drySoil: p.temp > 25 });
        sceneHeader(ctx, 'Perfil real de la línea en la cordillera', `${fmt(p.h, 0)} m s.n.m. · ${fmt(p.temp, 1)} °C · δ = ${fmt(d.delta, 3)}`);

        // Línea punteada de referencia al nivel del mar y cota de altura
        line(ctx, 0, seaY, w, seaY, { color: PAL.phase, dash: [6, 5], width: 1.4 });
        text(ctx, 'Nivel del mar (0 m)', 12, seaY + 12, { size: 9.8, color: PAL.phase, mono: true });
        dimension(ctx, w * 0.08, groundY, w * 0.08, seaY, `h = ${fmt(p.h, 0)} m`, PAL.phase);

        // Torre real sobre la ladera (sube al aumentar h)
        const tx = w * 0.7;
        const th = h * 0.32;
        latticeTower(ctx, tx, groundY, th, { arms: [{ yFrac: 0.83, half: w * 0.085 }] });
        const armY = groundY - th * 0.83;
        insulatorString(ctx, tx - w * 0.085, armY, 6, th * 0.22, 0, { discRadius: 8 });
        groundSymbol(ctx, tx, groundY + 2, 9, PAL.copper);
        pill(ctx, `p = ${fmt(d.pressure, 2)} kPa`, tx, groundY - th - 18, { color: PAL.phase, align: 'center', mono: true });

        // Moléculas de aire: más densas si delta es alto
        const count = Math.round(34 + d.delta * 88);
        for (let i = 0; i < count; i++) {
          const ax = w * 0.05 + ((i * 79) % Math.round(w * 0.5));
          const ay = h * 0.1 + ((i * 47) % Math.round(h * 0.56));
          circle(ctx, ax + Math.sin(t * 0.9 + i) * 2.2, ay + Math.cos(t * 0.7 + i) * 1.8, 1.8, {
            fill: 'rgba(78, 130, 185, 0.32)',
          });
        }

        // Barras comparativas de capacidad
        const bx = w * 0.74;
        const by = h * 0.26;
        const bw = w * 0.2;
        const maxBar = bw;
        const bar = (yy: number, label: string, ratio: number, col: string) => {
          text(ctx, label, bx, yy - 10, { size: 9.6, color: PAL.muted });
          line(ctx, bx, yy, bx + maxBar, yy, { color: 'rgba(78,99,120,0.16)', width: 8 });
          line(ctx, bx, yy, bx + maxBar * Math.max(0.03, Math.min(1, ratio)), yy, { color: col, width: 8, cap: 'butt' });
          text(ctx, `${fmt(ratio * 100, 0)} %`, bx + maxBar + 4, yy, { size: 9.6, color: col, mono: true });
        };
        bar(by, 'Aire: nivel del mar', 1, PAL.phase);
        bar(by + 30, `Aire: ${fmt(p.h, 0)} m`, d.corrected / p.uref, PAL.warn);
        bar(by + 60, 'Equipo sellado', 1, PAL.ok);
        pill(ctx, `U_h = ${fmt(d.corrected, 1)} kV`, bx, by + 90, { color: PAL.warn, mono: true });
      }}
      footer={
        <>
          <strong>Observa la torre:</strong> al aumentar la altitud se desplaza <strong>hacia arriba</strong> por la ladera, no hacia abajo. Las barras muestran que solo el aire externo pierde capacidad.
        </>
      }
    />
  ),
  plot: ({ p, d }) => {
    const curve = (temp: number, color: string, dash?: string) => ({
      pts: linspace(0, 4000, 130).map((hh) => [hh, densityCorrected(p.uref, airDensity(hh, temp), p.n)] as [number, number]),
      color,
      dash,
      width: 2.1,
      label: `${fmt(temp, 0)} °C`,
    });
    return (
      <Plot
        xDomain={[0, 4000]}
        yDomain={[Math.max(300, p.uref * 0.48), p.uref * 1.06]}
        xLabel="Altitud sobre el nivel del mar (m)"
        yLabel="Tensión soportada externa (kV)"
        series={[curve(0, PAL.phase), curve(15, PAL.ok, '5 4'), curve(30, PAL.warn, '2 4')]}
        refs={[{ at: 575, label: 'Requisito del reto: 575 kV', color: PAL.bad }]}
        markers={[{ x: p.h, y: d.corrected, color: PAL.porcelain, label: `Tu caso: ${fmt(d.corrected, 0)} kV` }]}
        caption="Tres temperaturas ambiente. A igual altitud, un día más caliente reduce aún más δ y, por tanto, la capacidad de aislamiento externo."
      />
    );
  },
};

/* =============================== e08 =============================== */

const e08: Experiment = {
  id: 'e08',
  topicId: 5,
  contextLabel: 'Cadena de discos aisladores',
  title: '¿Cuántos discos lleva esta torre de 230 kV?',
  tagline: 'El camino en zigzag de la suciedad (fuga) decide el número de aisladores',
  why: 'Calcular la línea de fuga y el número de discos sin confundir los tres largos distintos: fuga superficial, arco en seco y largo de cadena.',
  params: [
    {
      id: 'um',
      group: 'Red y sitio',
      label: 'Tensión máxima entre fases (Uₘ)',
      unit: 'kV',
      min: 72.5,
      max: 500,
      step: 0.5,
      def: 245,
      help: '245 kV es la tensión máxima de una línea nominal de 230 kV.',
    },
    {
      id: 'kf',
      group: 'Red y sitio',
      label: 'Contaminación → fuga específica k_f',
      unit: 'mm/kV',
      min: 12,
      max: 35,
      step: 1,
      def: 25,
      help: 'k_f = 25 mm/kV es el coeficiente del ejemplo de la actividad 06 (lámina 13).',
    },
    {
      id: 'base',
      group: 'Convención y altitud',
      label: '¿A qué tensión se refiere k_f?',
      min: 1,
      max: 2,
      step: 1,
      def: 1,
      options: [
        { value: 1, label: 'Uₘ entre fases (actividad 06)' },
        { value: 2, label: 'U_f fase–tierra (÷ √3)' },
      ],
      help: 'Esta convención cambia el resultado en ×√3 ≈ 1,73. Siempre declárala.',
    },
    {
      id: 'altura',
      group: 'Convención y altitud',
      label: 'Corrección por altitud',
      min: 0,
      max: 1,
      step: 1,
      def: 0,
      options: [
        { value: 0, label: 'Nivel del mar (k_a = 1)' },
        { value: 1, label: 'Bogotá 2.640 m (k_a = δ)' },
      ],
    },
    {
      id: 'fuga',
      group: 'Disco real de porcelana',
      label: 'Fuga aportada por cada disco',
      unit: 'mm',
      min: 200,
      max: 450,
      step: 2,
      def: 292,
      help: 'Valor típico del disco de 254 mm usado en el material del curso.',
    },
    {
      id: 'paso',
      group: 'Disco real de porcelana',
      label: 'Paso mecánico entre discos',
      unit: 'm',
      min: 0.1,
      max: 0.2,
      step: 0.002,
      def: 0.146,
      decimals: 3,
      help: 'Longitud física de la cadena = discos × paso.',
    },
  ],
  presets: [
    {
      id: 'curso',
      label: 'Ejemplo del curso (21 discos, 3,066 m)',
      note: 'Con base entre fases, L_f = 25 × 245 = 6.125 mm → 21 discos → 3,066 m de cadena.',
      values: { um: 245, kf: 25, base: 1, altura: 0, fuga: 292, paso: 0.146 },
    },
    {
      id: 'iec',
      label: 'Base fase–tierra + Bogotá (≤18 discos)',
      note: 'Si k_f se refiere a U_f (fase–tierra), el requisito se divide entre √3; con k_a = δ = 0,739 bastan 17 discos.',
      values: { um: 245, kf: 25, base: 2, altura: 1, fuga: 292, paso: 0.146 },
    },
    {
      id: 'limpio',
      label: 'Zona limpia (16 mm/kV)',
      note: 'En campo abierto y seco, el criterio de contaminación pide menos discos; aun así hay que verificar maniobra y rayo.',
      values: { um: 245, kf: 16, base: 2, altura: 0, fuga: 292, paso: 0.146 },
    },
    {
      id: 'costero',
      label: 'Costa salina (31 mm/kV)',
      note: 'Sal + humedad crean una película conductora; la cadena debe tener más recorrido superficial.',
      values: { um: 245, kf: 31, base: 2, altura: 0, fuga: 292, paso: 0.146 },
    },
  ],
  compute: (p) => {
    const ka = p.altura === 1 ? airDensity(2640, 14) : 1;
    const required = creepageRequired(p.um, p.kf, p.base === 2 ? 2 : 1, ka);
    const nRaw = required / p.fuga;
    const n = Math.max(1, Math.ceil(nRaw));
    const real = n * p.fuga;
    const length = n * p.paso;
    const slack = real - required;
    return { ka, required, nRaw, n, real, length, slack };
  },
  liveStatus: (p, d) => ({
    tone: 'info',
    badge: `CADENA DE ${fmt(d.n, 0)} DISCOS · ${fmt(d.length, 3)} m`,
    message: `Se requieren ${fmt(d.required, 0)} mm de recorrido superficial (${p.base === 2 ? 'base fase–tierra' : 'base entre fases'}, k_a = ${fmt(d.ka, 3)}). Instalando discos de ${fmt(p.fuga, 0)} mm quedan ${fmt(d.real, 0)} mm.`,
  }),
  readings: (d, p) => [
    {
      label: 'Fuga requerida',
      value: `${fmt(d.required, 0)} mm`,
      sub: `${fmt(p.kf, 0)} mm/kV · ${p.base === 2 ? 'Uₘ/√3' : 'Uₘ'} · k_a = ${fmt(d.ka, 3)}`,
      tone: 'neutral',
    },
    { label: 'Discos necesarios', value: `${fmt(d.n, 0)}`, sub: `${fmt(d.nRaw, 2)} → redondeo hacia arriba`, tone: 'ok' },
    { label: 'Fuga instalada', value: `${fmt(d.real, 0)} mm`, sub: `holgura ${fmt(d.slack, 0)} mm` },
    { label: 'Largo físico de cadena', value: `${fmt(d.length, 3)} m`, sub: `${fmt(d.n, 0)} × ${fmt(p.paso, 3)} m` },
    { label: 'Distancia de arco en seco', value: 'no es la fuga', sub: 'es la recta por el aire entre extremos' },
  ],
  equations: (p, d) => [
    `L_f = k_f·Uₘ / (k_a·${p.base === 2 ? '√3' : '1'}) = ${fmt(p.kf, 0)} × ${fmt(p.um, 1)} / (${fmt(d.ka, 3)} × ${p.base === 2 ? '1,7321' : '1'}) = ${fmt(d.required, 0)} mm`,
    `N = ⌈${fmt(d.required, 0)} / ${fmt(p.fuga, 0)}⌉ = ⌈${fmt(d.nRaw, 2)}⌉ = ${fmt(d.n, 0)} discos`,
    `L_cadena = N × paso = ${fmt(d.n, 0)} × ${fmt(p.paso, 3)} = ${fmt(d.length, 3)} m`,
    `Fuga instalada = ${fmt(d.n, 0)} × ${fmt(p.fuga, 0)} = ${fmt(d.real, 0)} mm (${fmt(d.slack, 0)} mm de holgura)`,
    'Ojo: cambiar la base de «entre fases» a «fase–tierra» no es un error de redondeo: divide el requisito entre 1,73.',
  ],
  checks: (p, d) => [
    { label: 'Se declara la base de k_f', ok: true, detail: p.base === 2 ? 'fase–tierra (÷ √3)' : 'entre fases (hipótesis del ejemplo, lámina 13)' },
    { label: 'El número de discos es entero', ok: Number.isInteger(d.n), detail: `${fmt(d.n, 0)} discos` },
    { label: 'Se distingue fuga / arco / longitud', ok: true, detail: 'tres magnitudes físicas diferentes' },
    { label: 'Faltan maniobra, rayo y verificación mecánica', ok: true, info: true, detail: 'este criterio solo cubre contaminación' },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el ejemplo del curso: 21 discos y 3,066 m de cadena',
      tip: 'Pulsa «Ejemplo del curso (21 discos, 3,066 m)».',
      test: (p, d) => d.n === 21 && Math.abs(d.length - 3.066) < 0.002 && p.base === 1,
      detail: (_p, d) => `N = ${fmt(d.n, 0)} · L = ${fmt(d.length, 3)} m`,
    },
    {
      id: 'g2',
      label: 'Con base fase–tierra y corrección por altitud, obtén 18 discos o menos',
      tip: 'Cambia la convención a «U_f fase–tierra (÷ √3)» y activa «Bogotá 2.640 m».',
      test: (p, d) => p.base === 2 && p.altura === 1 && d.n <= 18,
      detail: (_p, d) => `N = ${fmt(d.n, 0)} discos con k_a = ${fmt(d.ka, 3)}`,
    },
  ],
  learn: {
    analogy:
      'El agua sucia no baja en línea recta por un disco: tiene que bordear cada faldón. Es como un camino de montaña en zigzag que mide 6 m aunque la pared tenga solo 3 m de altura. Ese recorrido largo dificulta que la corriente llegue a la torre.',
    phenomenon:
      'Polvo, sal marina o ceniza se humedecen y forman una película conductora sobre la porcelana. Aparecen bandas secas, pequeñas descargas y finalmente un contorneo que puede saltar por fuera de la cadena.',
    objective:
      'Calcular la distancia de fuga requerida y traducirla a discos instalables, sin confundir el recorrido superficial con la distancia de arco ni con el largo mecánico de la cadena.',
    watch: [
      'La línea verde en zigzag sigue los faldones: esa es la fuga. La línea roja de puntos es el camino recto por aire (arco en seco).',
      'Cambia la convención de k_f de «entre fases» a «fase–tierra» y observa cómo baja la cantidad de discos.',
      'Sube k_f a 31 mm/kV: la gráfica salta en escalones porque no se puede instalar medio disco.',
    ],
    misconception:
      'Copiar «25 mm/kV» sin declarar si se refiere a Uₘ o U_f. Y creer que con este cálculo ya está lista la cadena: todavía faltan maniobra, rayo y mecánica.',
    model: 'k_f se aplica a Uₘ o a Uₘ/√3 según la base declarada; k_a = δ corrige por altitud. La lámina no fija procedimiento de contaminación: es una comparación de convenciones, no un diseño por contaminación.',
  },
  sources: ['expo77'],
  scene: ({ p, d, t }) => (
    <SceneCanvas
      legend={[
        { color: PAL.ok, label: `Fuga superficial (${fmt(d.real, 0)} mm)` },
        { color: PAL.bad, label: 'Arco en seco (recta en aire)' },
        { color: PAL.warn, label: `Longitud mecánica (${fmt(d.length, 2)} m)` },
      ]}
      draw={(ctx, w, h) => {
        environment(ctx, w, h, { mood: 'day', groundY: h * 0.93, mountains: false });
        sceneHeader(ctx, 'Cadena de suspensión en una cruceta', `${fmt(d.n, 0)} discos · ${fmt(d.real / 1000, 2)} m de recorrido de fuga`);

        const cx = w * 0.48;
        const topY = h * 0.13;
        const span = h * 0.72;
        const shown = Math.max(5, Math.min(14, d.n));

        // Cruceta y conductor
        line(ctx, cx - w * 0.12, topY, cx + w * 0.12, topY, { color: PAL.steel, width: 5 });
        line(ctx, cx - w * 0.12, topY, cx - w * 0.12, topY - 14, { color: PAL.steel, width: 3 });
        insulatorString(ctx, cx, topY, shown, span, 0, {
          discRadius: Math.min(20, w * 0.028),
          polluted: p.kf >= 25,
        });
        circle(ctx, cx, topY + span + 5, 6, { fill: PAL.phase, stroke: '#FFFFFF', width: 1.5 });
        line(ctx, cx - w * 0.28, topY + span + 5, cx + w * 0.28, topY + span + 5, { color: PAL.phase, width: 2.4 });

        // Camino de fuga zigzag
        ctx.save();
        ctx.strokeStyle = PAL.ok;
        ctx.lineWidth = 2.4;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        const amp = w * 0.048;
        for (let i = 0; i <= shown * 8; i++) {
          const u = i / (shown * 8);
          const xx = cx + Math.sin(u * shown * Math.PI * 2) * amp;
          const yy = topY + u * span;
          if (i === 0) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
        ctx.restore();

        // Arco en seco y cotas
        line(ctx, cx, topY, cx, topY + span, { color: PAL.bad, dash: [6, 5], width: 1.5 });
        dimension(ctx, cx + w * 0.16, topY, cx + w * 0.16, topY + span, `${fmt(d.length, 3)} m`, PAL.warn);
        dimension(ctx, cx - w * 0.16, topY, cx - w * 0.16, topY + span, `${fmt(d.real / 1000, 2)} m de fuga`, PAL.ok, true);

        // Gotas y partículas de contaminación
        for (let i = 0; i < 16; i++) {
          const gx = cx + Math.sin(i * 2.1) * amp * 1.4;
          const gy = topY + ((i * 37 + Math.floor(t * 18)) % Math.max(1, Math.round(span)));
          circle(ctx, gx, gy, i % 3 === 0 ? 2.4 : 1.6, {
            fill: i % 3 === 0 ? 'rgba(201, 147, 75, 0.8)' : 'rgba(77, 163, 255, 0.65)',
          });
        }

        pill(
          ctx,
          `k_f = ${fmt(p.kf, 0)} mm/kV · ${p.base === 2 ? 'base U_f' : 'base Uₘ'} · k_a = ${fmt(d.ka, 3)}`,
          12,
          h - 16,
          { color: PAL.phase, mono: true, size: 9.8 },
        );
      }}
      footer={
        <>
          <strong>Tres medidas distintas:</strong> el zigzag verde es la <strong>fuga</strong> por la superficie, la recta roja es el <strong>arco en seco</strong> y la cota ámbar es el <strong>largo de la cadena</strong>.
        </>
      }
    />
  ),
  plot: ({ p, d }) => {
    const pts: [number, number][] = [];
    for (let kf = 12; kf <= 35; kf += 0.2) {
      const req = creepageRequired(p.um, kf, p.base === 2 ? 2 : 1, p.altura === 1 ? airDensity(2640, 14) : 1);
      pts.push([kf, Math.max(1, Math.ceil(req / p.fuga))]);
    }
    return (
      <Plot
        xDomain={[12, 35]}
        yDomain={[0, Math.max(30, Math.max(...pts.map((q) => q[1])) + 3)]}
        xLabel="Contaminación del sitio: coeficiente k_f (mm/kV)"
        yLabel="Discos que hay que instalar"
        series={[{ pts, color: PAL.ok, width: 2.4, steps: true, label: 'Discos necesarios' }]}
        refs={[
          { at: 16, label: '16 limpio', color: 'rgba(13,138,89,0.65)', dash: '2 4', axis: 'x' },
          { at: 20, label: '20 medio', color: 'rgba(11,99,206,0.65)', dash: '2 4', axis: 'x' },
          { at: 25, label: '25 fuerte', color: 'rgba(201,122,8,0.8)', dash: '2 4', axis: 'x' },
          { at: 31, label: '31 severo', color: 'rgba(214,54,44,0.8)', dash: '2 4', axis: 'x' },
        ]}
        markers={[{ x: p.kf, y: d.n, color: PAL.warn, label: `${fmt(d.n, 0)} discos` }]}
        caption="La curva sube por escalones porque los discos son unidades enteras. Las líneas verticales marcan los niveles de contaminación del material."
      />
    );
  },
};

/* =============================== e09 =============================== */

const e09: Experiment = {
  id: 'e09',
  topicId: 5,
  contextLabel: 'Maniobra de interruptor',
  title: 'La cadena también debe aguantar una maniobra',
  tagline: 'Del esfuerzo de 575,1 kV al CFO requerido y al criterio que manda',
  why: 'Comparar el número de discos exigido por contaminación con el exigido por sobretensión de maniobra, e instalar el mayor.',
  params: [
    {
      id: 'um',
      group: 'Esfuerzo de maniobra',
      label: 'Tensión máxima entre fases (Uₘ)',
      unit: 'kV',
      min: 72.5,
      max: 500,
      step: 0.5,
      def: 245,
    },
    {
      id: 'fv',
      group: 'Esfuerzo de maniobra',
      label: 'Factor de sobretensión (F_v)',
      unit: 'p.u.',
      min: 1.5,
      max: 4,
      step: 0.05,
      def: 2.5,
      help: '2,5 p.u. es el caso de maniobra del curso.',
    },
    {
      id: 'fs',
      group: 'Esfuerzo de maniobra',
      label: 'Factor de seguridad (F_s)',
      min: 1,
      max: 1.3,
      step: 0.01,
      def: 1.15,
    },
    {
      id: 'k',
      group: 'Riesgo y sitio',
      label: 'Desviaciones k (riesgo de flameo)',
      unit: 'σ',
      min: 0,
      max: 3,
      step: 0.05,
      def: 1.3,
      help: '1,3 σ ≈ 10 % de falla · 2,33 σ ≈ 1 % de falla.',
    },
    {
      id: 'sigma',
      group: 'Riesgo y sitio',
      label: 'Dispersión del aislamiento (σ)',
      unit: '% del CFO',
      min: 2,
      max: 10,
      step: 0.5,
      def: 6,
    },
    {
      id: 'h',
      group: 'Riesgo y sitio',
      label: 'Altitud del sitio',
      unit: 'm',
      min: 0,
      max: 4000,
      step: 10,
      def: 0,
      help: 'Se calcula δ con gradiente térmico aproximado de −6,5 °C/km.',
    },
    {
      id: 'kf',
      group: 'Comparación con contaminación',
      label: 'Coeficiente de fuga k_f',
      unit: 'mm/kV',
      min: 12,
      max: 35,
      step: 1,
      def: 25,
    },
    {
      id: 'adicional',
      group: 'Comparación con contaminación',
      label: 'Discos adicionales de margen',
      min: 0,
      max: 2,
      step: 1,
      def: 0,
      options: [
        { value: 0, label: 'Ninguno' },
        { value: 1, label: '+1 suspensión' },
        { value: 2, label: '+2 amarre' },
      ],
    },
  ],
  presets: [
    {
      id: 'curso',
      label: 'Ejemplo del curso (CFO 623,8 kV → 21 discos)',
      note: 'A nivel del mar, U_soporte = 575,12 kV y CFO_req = 623,8 kV → ~7,1 discos por maniobra; gobiernan los 21 de contaminación.',
      values: { um: 245, fv: 2.5, fs: 1.15, k: 1.3, sigma: 6, h: 0, kf: 25, adicional: 0 },
    },
    {
      id: 'riesgo1',
      label: 'Exigir 1 % de flameo (k = 2,33)',
      note: 'Al reducir el riesgo aceptado, CFO requerido sube por encima de 690 kV y el número por maniobra crece.',
      values: { um: 245, fv: 2.5, fs: 1.15, k: 2.33, sigma: 6, h: 0, kf: 25, adicional: 0 },
    },
    {
      id: 'bogota',
      label: 'Misma línea a 2.640 m',
      note: 'El CFO requerido se corrige UNA sola vez dividiendo entre δ; la etiqueta deja claro que ya incluye altitud.',
      values: { um: 245, fv: 2.5, fs: 1.15, k: 1.3, sigma: 6, h: 2640, kf: 25, adicional: 0 },
    },
  ],
  compute: (p) => {
    const temp = 20 - 6.5 * (p.h / 1000);
    const delta = airDensity(p.h, temp);
    const uSupport = switchingSupport(p.um, p.fv, p.fs);
    const cfoBase = uSupport / Math.max(1e-6, 1 - p.k * (p.sigma / 100));
    const cfoReq = cfoRequired(p.um, p.fv, p.fs, p.k, p.sigma, delta, 1); // ya corregido por altitud
    const nIdeal = insulatorsFromCfo(cfoReq);
    const nMan = Math.max(1, Math.ceil(nIdeal));
    const fugaReq = creepageRequired(p.um, p.kf, 1, 1);
    const nFuga = Math.max(1, Math.ceil(fugaReq / 292));
    const nFinal = Math.max(nMan, nFuga) + p.adicional;
    const cfoString = cfoFromInsulators(nFinal);
    return { temp, delta, uSupport, cfoBase, cfoReq, nIdeal, nMan, fugaReq, nFuga, nFinal, cfoString };
  },
  liveStatus: (_p, d) => ({
    tone: d.cfoString >= d.cfoReq ? 'ok' : 'bad',
    badge: `MANDA ${d.nMan >= d.nFuga ? 'MANIOBRA' : 'CONTAMINACIÓN'} · ${fmt(d.nFinal, 0)} DISCOS`,
    message: `El CFO requerido ya corregido por altitud es ${fmt(d.cfoReq, 1)} kV (δ = ${fmt(d.delta, 3)}); la cadena de ${fmt(d.nFinal, 0)} discos ofrece ${fmt(d.cfoString, 0)} kV.`,
  }),
  readings: (d, p) => [
    { label: 'Tensión de soporte requerida', value: `${fmt(d.uSupport, 2)} kV cresta`, sub: `F_s·F_v·Û_f`, tone: 'ok' },
    {
      label: 'CFO requerido (corregido por altitud)',
      value: `${fmt(d.cfoReq, 1)} kV`,
      sub: `${fmt(d.cfoBase, 1)} kV a nivel del mar ÷ δ = ${fmt(d.delta, 3)}`,
      tone: 'warn',
    },
    { label: 'Discos por maniobra', value: `${fmt(d.nMan, 0)}`, sub: `${fmt(d.nIdeal, 2)} equivalentes → entero superior` },
    { label: 'Discos por contaminación', value: `${fmt(d.nFuga, 0)}`, sub: `k_f = ${fmt(p.kf, 0)} mm/kV · 292 mm/disco` },
    {
      label: 'Cadena final instalada',
      value: `${fmt(d.nFinal, 0)} discos`,
      sub: `manda ${d.nMan >= d.nFuga ? 'maniobra' : 'contaminación'}${p.adicional ? ` · +${fmt(p.adicional, 0)} de margen` : ''}`,
      tone: 'ok',
    },
    {
      label: 'CFO de la cadena instalada',
      value: `${fmt(d.cfoString, 0)} kV`,
      sub: d.cfoString >= d.cfoReq ? 'supera el requisito' : 'por debajo del requisito',
      tone: d.cfoString >= d.cfoReq ? 'ok' : 'bad',
    },
  ],
  equations: (p, d) => [
    `U_soporte = F_s·F_v·√(2/3)·Uₘ = ${fmt(p.fs, 2)} × ${fmt(p.fv, 2)} × 0,8165 × ${fmt(p.um, 1)} = ${fmt(d.uSupport, 2)} kV`,
    `CFO a nivel del mar = U_soporte/(1 − k·σ) = ${fmt(d.uSupport, 2)}/(1 − ${fmt(p.k, 2)}×${fmt(p.sigma / 100, 3)}) = ${fmt(d.cfoBase, 1)} kV`,
    `CFO requerido en el sitio = CFO_mar/δ = ${fmt(d.cfoBase, 1)}/${fmt(d.delta, 3)} = ${fmt(d.cfoReq, 1)} kV (UNA sola corrección por altitud)`,
    `N_maniobra = ⌈${fmt(d.nIdeal, 2)}⌉ = ${fmt(d.nMan, 0)} · N_fuga = ⌈${fmt(d.fugaReq, 0)}/292⌉ = ${fmt(d.nFuga, 0)} → N_final = ${fmt(d.nFinal, 0)}`,
    'La relación CFO↔N no es lineal y el ajuste del material solo es válido hasta ~20 unidades; no es una regla de «tantos kV por disco».',
  ],
  checks: (p, d) => [
    { label: 'La tensión de soporte se compara en kV de cresta', ok: true, detail: `${fmt(d.uSupport, 1)} kV` },
    {
      label: 'Se declara el riesgo de flameo',
      ok: true,
      detail: `k = ${fmt(p.k, 2)} σ → ~${fmt(normalCdf(-p.k) * 100, 1)} % de falla`,
    },
    { label: 'La altitud se aplicó una sola vez al CFO', ok: true, detail: `δ = ${fmt(d.delta, 3)} → ${fmt(d.cfoReq, 1)} kV` },
    { label: 'Se instala el criterio más exigente', ok: d.cfoString >= d.cfoReq, detail: `maniobra ${fmt(d.nMan, 0)} · fuga ${fmt(d.nFuga, 0)}` },
  ],
  goals: [
    {
      id: 'g1',
      kind: 'exploracion',
      label: 'Reproduce el caso del curso: U_soporte ≈ 575,1 kV, CFO 623,8 kV y cadena de 21 discos',
      tip: 'Pulsa «Ejemplo del curso (CFO 623,8 kV → 21 discos)».',
      test: (_p, d) => Math.abs(d.uSupport - 575.12) < 0.5 && Math.abs(d.cfoBase - 623.77) < 1 && d.nFinal === 21,
      detail: (_p, d) => `U_soporte = ${fmt(d.uSupport, 1)} kV · CFO_mar = ${fmt(d.cfoBase, 1)} kV · N = ${fmt(d.nFinal, 0)}`,
    },
    {
      id: 'g2',
      label: 'Exige 1 % de probabilidad de flameo (k ≥ 2,3) y observa crecer el CFO requerido',
      tip: 'Usa el escenario «Exigir 1 % de flameo» o sube k hasta 2,33.',
      test: (p, d) => p.k >= 2.3 && d.cfoReq > 690,
      detail: (_p, d) => `CFO requerido = ${fmt(d.cfoReq, 1)} kV con k = 2,33`,
    },
  ],
  learn: {
    analogy:
      'Piensa en dos filtros de seguridad: uno por «suciedad» y otro por «golpe de interruptor». Si el primero pide 21 discos y el segundo 8, no promedias: instalas 21. El más exigente manda.',
    phenomenon:
      'Al cerrar o abrir un interruptor aparece una sobretensión de frente lento. La cadena no falla siempre al mismo voltaje: su CFO tiene dispersión σ, así que se elige cuántas desviaciones por debajo de la media trabajar.',
    objective:
      'Calcular U_soporte, CFO requerido corregido por altitud y el número de discos por maniobra; luego compararlo con el criterio de contaminación.',
    watch: [
      'En la escena, las dos barras de discos se comparan y la barra verde muestra la cadena final instalada.',
      'Sube k de 1,3 a 2,33: la línea roja del CFO requerido se mueve hacia arriba en la gráfica.',
      'Cambia la altitud a 2.640 m: la etiqueta dice «corregido por altitud» y las ecuaciones dividen por δ una sola vez.',
    ],
    misconception:
      'Pensar que U₅₀ = 700 kV significa «soporta 700 kV», o dividir dos veces por δ (una en el cálculo y otra al escribir la fórmula).',
    model: 'Ajuste CFO–N del material UNAL, σ = 6 % y δ con exponente 1. La selección real combina además rayo, contaminación y mecánica.',
  },
  sources: ['expo77'],
  scene: ({ d, t }) => (
    <SceneCanvas
      legend={[
        { color: PAL.phase, label: 'Discos por contaminación' },
        { color: PAL.warn, label: 'Discos por maniobra' },
        { color: PAL.ok, label: 'Cadena final instalada' },
      ]}
      draw={(ctx, w, h) => {
        environment(ctx, w, h, { mood: 'lab' });
        sceneHeader(ctx, 'Torre con cadena y dos criterios', `${fmt(d.nFinal, 0)} discos · CFO ${fmt(d.cfoString, 0)} kV · δ = ${fmt(d.delta, 3)}`);

        const tx = w * 0.26;
        const gy = h * 0.88;
        const th = h * 0.68;
        latticeTower(ctx, tx, gy, th, { arms: [{ yFrac: 0.82, half: w * 0.12 }] });
        const armY = gy - th * 0.82;
        const chain = insulatorString(ctx, tx + w * 0.12, armY, Math.min(14, Math.max(5, d.nFinal)), h * 0.52, 0, {
          discRadius: 11,
        });
        line(ctx, chain.endX, chain.endY + 3, w * 0.44, chain.endY + 3, { color: PAL.phase, width: 2.3 });
        circle(ctx, chain.endX, chain.endY + 3, 5, { fill: PAL.phase, stroke: '#FFFFFF', width: 1.3 });
        if (d.nFinal > 14) {
          pill(ctx, `+${fmt(d.nFinal - 14, 0)} discos`, chain.endX, chain.endY + 20, { color: PAL.warn, align: 'center', mono: true });
        }

        // Pulso de maniobra entrando por el conductor
        const u = (t * 0.5) % 1;
        const px = chain.endX + (w * 0.44 - chain.endX) * u;
        circle(ctx, px, chain.endY + 3, 4.5, { fill: PAL.warnBright, stroke: '#FFFFFF', width: 1.4 });
        pill(ctx, `${fmt(d.uSupport, 0)} kV de maniobra`, w * 0.44, chain.endY - 20, { color: PAL.warn, align: 'right', mono: true });

        // Barras de criterios
        const bx = w * 0.58;
        const bw = w * 0.32;
        const maxN = Math.max(1, d.nMan, d.nFuga, d.nFinal);
        const bar = (yy: number, label: string, value: number, col: string) => {
          text(ctx, label, bx, yy - 10, { size: 10, color: PAL.inkSoft });
          ctx.save();
          ctx.fillStyle = 'rgba(78,99,120,0.12)';
          ctx.fillRect(bx, yy, bw, 14);
          ctx.fillStyle = col;
          ctx.fillRect(bx, yy, (value / maxN) * bw, 14);
          ctx.restore();
          text(ctx, `${fmt(value, 0)}`, bx + bw + 8, yy + 7, { size: 11, weight: 700, color: col, mono: true });
        };
        bar(h * 0.28, 'Contaminación (fuga)', d.nFuga, PAL.phase);
        bar(h * 0.45, 'Maniobra (CFO)', d.nMan, PAL.warn);
        bar(h * 0.62, 'INSTALADA', d.nFinal, PAL.ok);
        pill(ctx, `CFO requerido en el sitio: ${fmt(d.cfoReq, 0)} kV`, bx, h * 0.79, { color: PAL.warn, mono: true });
        text(ctx, 'Se instala el MAYOR de los dos criterios', bx, h * 0.88, { size: 10.5, color: PAL.muted });
      }}
      footer={
        <>
          <strong>Qué manda:</strong> la cadena final es el <strong>máximo</strong> entre discos por contaminación y por maniobra. La altitud ya está incluida en el CFO requerido mostrado.
        </>
      }
    />
  ),
  plot: ({ p, d }) => (
    <BarComparisonPlot
      groups={[
        { label: 'Maniobra en sitio', stress: d.cfoReq, withstand: d.cfoString, stressLabel: 'CFO requerido', withstandLabel: 'CFO cadena' },
        { label: 'Esfuerzo base', stress: d.uSupport, withstand: d.cfoBase, stressLabel: 'U soporte', withstandLabel: 'CFO mar' },
      ]}
      caption={`Barras rojas = esfuerzo exigido; verdes = capacidad instalada. En el sitio (δ = ${fmt(d.delta, 3)}) se compara CFO requerido ${fmt(d.cfoReq, 0)} kV con ${fmt(d.cfoString, 0)} kV. k = ${fmt(p.k, 2)} σ ≈ ${fmt(normalCdf(-p.k) * 100, 1)} % de falla.`}
    />
  ),
};

export const insulationExperiments: Experiment[] = [e07, e08, e09];
