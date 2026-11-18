import './test/setup';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { DIAGNOSTICS, buildNumericBank, type Diagnostic, type NumericQuestion } from './content/practica';
import { ErrorBoundary } from './components/ErrorBoundary';
import { mulberry32 } from './lib/num';

type Item = { kind: 'num'; q: NumericQuestion } | { kind: 'diag'; q: Diagnostic };

function buildRound(seed: number): Item[] {
  const rnd = mulberry32(seed);
  const numeric = [...buildNumericBank()];
  const diagnostic = [...DIAGNOSTICS];
  const chosen: Item[] = [];
  for (let i = 0; i < 5 && numeric.length > 0; i++) {
    const idx = Math.floor(rnd() * numeric.length);
    const [q] = numeric.splice(idx, 1);
    chosen.push({ kind: 'num', q });
  }
  for (let i = 0; i < 3 && diagnostic.length > 0; i++) {
    const idx = Math.floor(rnd() * diagnostic.length);
    const [q] = diagnostic.splice(idx, 1);
    chosen.push({ kind: 'diag', q });
  }
  for (let i = chosen.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  return chosen;
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

async function setHash(hash: string) {
  window.location.hash = hash;
  await settle();
}

async function renderAt(hash: string) {
  await setHash(hash);
  return render(<App />);
}

let consoleError: ReturnType<typeof vi.spyOn> | undefined;

beforeEach(async () => {
  await setHash('#/');
  localStorage.clear();
  consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
});

afterEach(() => {
  consoleError?.mockRestore();
});

describe('rutas y navegación', () => {
  it('abre las siete rutas principales sin errores de renderizado', async () => {
    const routes: [string, RegExp][] = [
      ['#/', /Coordinación de aislamiento/i],
      ['#/catalogo', /Elige el equipo o fenómeno/i],
      ['#/glosario', /Qué significa cada símbolo/i],
      ['#/tema/1', /Tema 1: Introducción/i],
      ['#/exp/e01', /Tres sobretensiones/i],
      ['#/practica', /Ocho decisiones/i],
      ['#/fuentes', /De dónde salen los números/i],
    ];
    for (const [hash, heading] of routes) {
      const view = await renderAt(hash);
      await waitFor(() => expect(screen.getAllByRole('heading', { name: heading }).length).toBeGreaterThan(0));
      view.unmount();
    }
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('la miga de pan del tema vuelve al inicio y no al Tema 1', async () => {
    await renderAt('#/tema/1');
    const crumb = screen.getByRole('navigation', { name: 'Ruta de navegación' });
    fireEvent.click(within(crumb).getByRole('button', { name: 'Inicio' }));
    await settle();
    await waitFor(() => expect(window.location.hash).toBe('#/'));
    await screen.findByRole('heading', { level: 1, name: /Coordinación de aislamiento/i });
  });

  it('Anterior/Siguiente recorren la secuencia e01 → e02 → e03 sin saltos', async () => {
    await renderAt('#/exp/e01');
    fireEvent.click(screen.getByRole('button', { name: /E02/i }));
    await settle();
    await waitFor(() => expect(window.location.hash).toBe('#/exp/e02'));
    await screen.findByRole('heading', { name: /De entre fases a fase–tierra/i });

    fireEvent.click(screen.getByRole('button', { name: /E03/i }));
    await settle();
    await waitFor(() => expect(window.location.hash).toBe('#/exp/e03'));

    fireEvent.click(screen.getByRole('button', { name: /E02/i }));
    await settle();
    await waitFor(() => expect(window.location.hash).toBe('#/exp/e02'));
  });

  it('muestra una salida amable para un simulador inexistente', async () => {
    await renderAt('#/exp/e99');
    expect(screen.getByRole('heading', { name: /No encontramos ese simulador/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Volver al catálogo/i }));
    await settle();
    await waitFor(() => expect(window.location.hash).toBe('#/catalogo'));
  });
});

describe('interacciones concretas', () => {
  it('el mapa físico abre la ficha de la cadena de discos', async () => {
    await renderAt('#/');
    fireEvent.click(screen.getByRole('button', { name: /Punto 4/i }));
    expect(screen.getByRole('heading', { name: /Cadena de discos aisladores/i })).toBeInTheDocument();
    expect(screen.getByText(/Polvo y sal húmedos crean fugas/i)).toBeInTheDocument();
    const detail = screen.getByRole('heading', { name: /Cadena de discos aisladores/i }).closest('.hotspot-detail');
    expect(detail).toBeTruthy();
    expect(within(detail as HTMLElement).getByRole('button', { name: /E08/i })).toBeInTheDocument();
  });

  it('el mini-simulador del Tema 1 reacciona al esfuerzo y al pararrayos', async () => {
    await renderAt('#/tema/1');
    expect(screen.getByText('Diseño coordinado')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Pico de voltaje que llega/), { target: { value: '1500' } });
    fireEvent.change(screen.getByLabelText(/Techo que impone el pararrayos/), { target: { value: '1200' } });
    expect(screen.getByText('Riesgo de falla')).toBeInTheDocument();
    expect(screen.getByText(/Sin pararrayos: NO soportaba 1.500 kV/i)).toBeInTheDocument();
  });

  it('el catálogo filtra por texto y el glosario por símbolo', async () => {
    const catalog = await renderAt('#/catalogo');
    fireEvent.change(screen.getByPlaceholderText(/Buscar: viento/i), { target: { value: 'Bogotá' } });
    await waitFor(() => expect(screen.getByText('Bogotá 2.640 m: el aire es más delgado')).toBeInTheDocument());
    expect(screen.queryByText('Tres sobretensiones, tres formas de onda')).not.toBeInTheDocument();
    catalog.unmount();

    await renderAt('#/glosario');
    fireEvent.change(screen.getByPlaceholderText(/Buscar: Uₘ/i), { target: { value: 'DAR' } });
    await waitFor(() => expect(screen.getByText(/Índice de absorción/)).toBeInTheDocument());
    expect(screen.queryByText(/Voltaje máximo del equipo/)).not.toBeInTheDocument();
  });

  it('las fuentes muestran la bitácora de correcciones de la v2', async () => {
    await renderAt('#/fuentes');
    expect(screen.getByRole('heading', { name: /Bitácora de correcciones/i })).toBeInTheDocument();
    expect(screen.getByText(/saltaba 7 simuladores/i)).toBeInTheDocument();
    expect(screen.getByText(/se dividía por δ dos veces/i)).toBeInTheDocument();
  });
});

describe('simulacro, reto y progreso', () => {
  it('califica 8/8 al responder la ronda semilla 1 con los valores del banco', async () => {
    const round = buildRound(1);
    const numeric = round.filter((it): it is { kind: 'num'; q: NumericQuestion } => it.kind === 'num').map((it) => it.q);
    const diagnostics = round.filter((it): it is { kind: 'diag'; q: Diagnostic } => it.kind === 'diag').map((it) => it.q);

    await renderAt('#/practica');
    const inputs = screen.getAllByRole('textbox');
    expect(inputs).toHaveLength(5);
    numeric.forEach((q, i) => {
      fireEvent.change(inputs[i], { target: { value: String(q.answer).replace('.', ',') } });
    });
    await settle();

    for (const q of diagnostics) {
      const item = screen.getByText(q.scenario).closest('li');
      expect(item).toBeTruthy();
      const correct = q.options.find((o) => o.id === q.correct);
      expect(correct).toBeTruthy();
      fireEvent.click(within(item as HTMLElement).getByRole('button', { name: correct!.label }));
      await settle();
    }

    fireEvent.click(screen.getByRole('button', { name: /Calificar simulacro/i }));
    await settle();
    await screen.findByText(/Simulacro calificado: 8\/8 respuestas correctas/i);
    expect(screen.getByText(/Aprobado: puedes sustentar/i)).toBeInTheDocument();
  });

  it('cierra el reto e19 con 3 estrellas y guarda 25 XP en localStorage', async () => {
    await renderAt('#/exp/e19');
    fireEvent.click(screen.getByRole('button', { name: 'Aislamiento húmedo y sucio' }));
    await settle(); // el hito de exploración queda registrado
    fireEvent.click(screen.getByRole('button', { name: 'Aislamiento sano (seco y limpio)' }));
    fireEvent.click(screen.getByRole('button', { name: /Aislamiento húmedo o contaminado en la superficie/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Validar reto' }));
    await settle();

    expect(screen.getByText(/Reto cerrado con 3 estrellas/i)).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem('aislalab.progress') ?? '{}');
    expect(stored.xp).toBe(25);
    expect(stored.solved.e19.stars).toBe(3);
    expect(stored.quiz.e19).toBe('a');
  });

  it('reiniciar el avance pide confirmación y limpia el almacenamiento', async () => {
    localStorage.setItem('aislalab.progress', JSON.stringify({ xp: 90, solved: {}, quiz: {}, visits: [], version: 2 }));
    await renderAt('#/');
    fireEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(screen.getByText(/¿Borrar todo el avance\?/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));
    await settle();
    expect(screen.getByText(/Progreso reiniciado/i)).toBeInTheDocument();
    const stored = JSON.parse(localStorage.getItem('aislalab.progress') ?? '{}');
    expect(stored.xp).toBe(0);
    expect(Object.keys(stored.solved)).toHaveLength(0);
    expect(Object.keys(stored.quiz)).toHaveLength(0);
  });
});

describe('contención de errores', () => {
  it('ErrorBoundary muestra una pantalla de recuperación sin perder el marco', () => {
    function Bomb(): never {
      throw new Error('falla deliberada de prueba');
    }
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: /La pantalla se detuvo/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Recargar AislaLab/i })).toBeInTheDocument();
  });
});
