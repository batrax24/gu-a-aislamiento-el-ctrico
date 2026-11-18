import { EXPERIMENTS } from '../experiments';
import { defaults } from '../experiments/types';
import { fmt } from '../lib/num';

export type Diagnostic = {
  id: string;
  scenario: string;
  question: string;
  options: { id: string; label: string }[];
  correct: string;
  explanation: string;
  exp: string;
};

export const DIAGNOSTICS: Diagnostic[] = [
  {
    id: 'd1',
    scenario: 'Ensayos de impulso 1,2/50 µs sobre una cadena: 40 disparos con 640 kV y la mitad rompe; con 600 kV rompe 1 de cada 10.',
    question: '¿Qué se puede afirmar del CFO de la cadena?',
    options: [
      { id: 'a', label: 'El CFO está cerca de 640 kV: es la tensión de 50 % de disrupción.' },
      { id: 'b', label: 'El CFO es 600 kV porque es la tensión que casi siempre soporta.' },
      { id: 'c', label: 'No se puede estimar: hace falta medir la corriente.' },
      { id: 'd', label: 'El CFO es 700 kV porque hay que sumar 6 % de dispersión.' },
    ],
    correct: 'a',
    explanation: 'U₅₀ o CFO corresponde al 50 % de probabilidad de disrupción bajo esa onda y polaridad. Que a 600 kV rompa el 10 % no lo convierte en CFO: es un punto de la cola izquierda.',
    exp: 'e06',
  },
  {
    id: 'd2',
    scenario: 'Una línea de 245 kV en zona de contaminación fuerte (k_f = 25 mm/kV) se diseña con 21 discos de 292 mm usando la tensión entre fases. Un revisor aplica la convención fase–tierra y obtiene 17 discos.',
    question: '¿Cuál es la conclusión correcta?',
    options: [
      { id: 'a', label: 'El cálculo de 17 discos es un error de redondeo.' },
      { id: 'b', label: 'La diferencia viene de la base de tensión del coeficiente: hay que declararla y verificar el criterio del proyecto.' },
      { id: 'c', label: 'Siempre se debe usar la tensión entre fases para fuga.' },
      { id: 'd', label: 'La altitud no influye en la fuga.' },
    ],
    correct: 'b',
    explanation: 'Cambiar entre Uₘ y Uₘ/√3 cambia el resultado en √3. El material del curso usa la base entre fases en su ejercicio y Cardona usa fase–tierra (IEC). No es un redondeo: es una convención que debe declararse y verificarse.',
    exp: 'e08',
  },
  {
    id: 'd3',
    scenario: 'Tras un rayo en la guarda, la cadena flamea desde la torre hacia la fase. La resistencia de tierra medida en verano es 15 Ω.',
    question: '¿Qué mecanismo ocurrió y qué revisarías?',
    options: [
      { id: 'a', label: 'Falla de apantallamiento: la guarda no cubrió la fase.' },
      { id: 'b', label: 'Flameo inverso: la elevación de potencial de la torre superó el CFO de la cadena; revisar tierra, di/dt, reparto y acoplamiento.' },
      { id: 'c', label: 'Corona: el conductor se ionizó y descargó a la torre.' },
      { id: 'd', label: 'Sobretensión temporal por rechazo de carga.' },
    ],
    correct: 'b',
    explanation: 'El rayo entró por guarda/torre, subió el potencial de la estructura y la tensión torre–fase superó el CFO: eso es flameo inverso. La resistencia de tierra es un factor, pero también la inductancia, el di/dt y el reparto de corriente.',
    exp: 'e14',
  },
  {
    id: 'd4',
    scenario: 'Un transformador está protegido por un descargador a 12 m. La tensión residual del descargador es 600 kV y el BIL del equipo 1050 kV. Alguien concluye que el margen es 75 %.',
    question: '¿Qué falta en esa conclusión?',
    options: [
      { id: 'a', label: 'Nada: 1050/600 − 1 = 75 % y el equipo está protegido.' },
      { id: 'b', label: 'Sumar la caída inductiva de las conexiones y evaluar la propagación: el equipo puede ver más que U_res.' },
      { id: 'c', label: 'Convertir el BIL a valor eficaz.' },
      { id: 'd', label: 'Comparar con la corriente nominal del descargador.' },
    ],
    correct: 'b',
    explanation: 'La tensión residual se mide en los bornes del descargador. Con 12 m de conexión y di/dt alto, la caída L·di/dt y las reflexiones elevan la tensión en el equipo. El margen se calcula con la tensión que realmente llega al aislamiento.',
    exp: 'e16',
  },
  {
    id: 'd5',
    scenario: 'En un motor, R medido a 30 s es 90 MΩ y a 60 s es 98 MΩ; la humedad relativa es 88 %.',
    question: '¿Cómo se interpreta?',
    options: [
      { id: 'a', label: 'Aislamiento excelente: la resistencia sube con el tiempo.' },
      { id: 'b', label: 'DAR = 1,09: insuficiente; la humedad superficial domina y el ensayo debe repetirse en condiciones secas.' },
      { id: 'c', label: 'Perforación franca del devanado.' },
      { id: 'd', label: 'El megóhmetro está dañado.' },
    ],
    correct: 'b',
    explanation: 'DAR = 98/90 = 1,09, por debajo de 1,25: la corriente de fuga domina sobre la absorción. Con 88 % de humedad, la superficie contaminada explica el patrón; hay que secar, limpiar y repetir antes de diagnosticar daño interno.',
    exp: 'e19',
  },
  {
    id: 'd6',
    scenario: 'En una línea de 245 kV se mide un ángulo de apantallamiento de 38,7° y se declara «línea protegida».',
    question: '¿Qué objeción técnica corresponde?',
    options: [
      { id: 'a', label: 'Ninguna: por debajo de 45° siempre está protegida.' },
      { id: 'b', label: 'El ángulo es una descripción geométrica; la protección se evalúa con un modelo de desempeño y depende de la corriente.' },
      { id: 'c', label: 'El ángulo debe medirse desde la horizontal.' },
      { id: 'd', label: 'Solo importa si hay un solo cable de guarda.' },
    ],
    correct: 'b',
    explanation: 'α = arctan(Δx/Δh) describe la posición. La probabilidad de que un líder alcance una fase depende de la corriente y de la geometría; además el flameo inverso es otro mecanismo. El ángulo, solo, no certifica protección.',
    exp: 'e12',
  },
  {
    id: 'd7',
    scenario: 'Una puesta a tierra de torre mide 8 Ω en temporada húmeda y 22 Ω en la seca. El diseño exigía 20 Ω.',
    question: '¿Cuál es la lectura de diseño correcta?',
    options: [
      { id: 'a', label: 'Cumple: la medición de 8 Ω es la válida.' },
      { id: 'b', label: 'Debe usarse la condición crítica (seca) o corregir por estacionalidad: 22 Ω no cumple.' },
      { id: 'c', label: 'La resistencia de tierra no depende de la humedad.' },
      { id: 'd', label: 'Se resuelve aumentando la tensión de ensayo del megóhmetro.' },
    ],
    correct: 'b',
    explanation: 'La resistividad del terreno depende de la humedad y la temperatura; el secado puede duplicar o más la resistencia. El diseño se verifica en la época crítica, no con la mejor medición.',
    exp: 'e13',
  },
  {
    id: 'd8',
    scenario: 'Una onda de tensión de 100 kV entra a una unión donde Z₂ = 2000 Ω y Z₁ = 400 Ω. El informe dice «extremo abierto: Γ = +1 y tensión doble».',
    question: '¿Qué es incorrecto?',
    options: [
      { id: 'a', label: 'Nada: 2000 Ω es un abierto.' },
      { id: 'b', label: 'Con Z₂ finita, Γ = 0,667 y la tensión transmitida es 166,7 kV; Γ = +1 solo en el límite Z₂ → ∞.' },
      { id: 'c', label: 'El coeficiente de reflexión debería ser negativo.' },
      { id: 'd', label: 'La tensión transmitida siempre es menor que la incidente.' },
    ],
    correct: 'b',
    explanation: 'Γ = (2000−400)/(2000+400) = 0,667 y τ = 1,667: la tensión transmitida es 166,7 kV. El abierto ideal es una asíntota; llamar «abierto» a 2000 Ω es una simplificación que hay que declarar.',
    exp: 'e15',
  },
];

export type NumericQuestion = {
  id: string;
  prompt: string;
  answer: number;
  unit: string;
  tolerance: number;
  solution: string;
  exp: string;
  topicId: number;
};

const NUMBER_RE = /^−?\d{1,3}(?:\.\d{3})*(?:,\d+)?$/;

function parseNumber(value: string): number | null {
  const clean = value.replace(/^10\^/, '').trim();
  const first = clean.split(' ')[0];
  if (!NUMBER_RE.test(first)) return null;
  const normalized = first.replace(/\./g, '').replace('−', '-').replace(',', '.');
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

/** Banco numérico generado desde los mismos presets y lecturas que usa el laboratorio. */
export function buildNumericBank(): NumericQuestion[] {
  const out: NumericQuestion[] = [];
  for (const e of EXPERIMENTS) {
    for (const preset of e.presets.slice(0, 3)) {
      const p = { ...defaults(e), ...preset.values };
      const d = e.compute(p);
      let taken = 0;
      for (const r of e.readings(d, p)) {
        if (taken >= 2) break;
        const tokens = r.value.trim().split(/\s+/);
        if (tokens.length < 2) continue;
        if (/[·/^]/.test(r.value)) continue;
        const n = parseNumber(r.value);
        if (n === null || n === 0) continue;
        const unit = tokens.slice(1).join(' ');
        const eq = e.equations(p, d).slice(0, 3).join(' · ');
        out.push({
          id: `${e.id}-${preset.id}-${out.length}`,
          prompt: `Caso «${preset.label}». ¿Cuánto vale «${r.label}»?`,
          answer: n,
          unit,
          tolerance: Math.max(Math.abs(n) * 0.02, 0.05),
          solution: `${r.label}: ${r.value}. ${eq}`,
          exp: e.id,
          topicId: e.topicId,
        });
        taken++;
      }
    }
  }
  return out;
}

export function fmtAnswer(n: number, unit: string): string {
  return `${fmt(n, Math.abs(n) < 10 ? 2 : Math.abs(n) < 100 ? 1 : 0)} ${unit}`;
}
