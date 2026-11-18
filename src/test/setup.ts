import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

export type CanvasCall = { method: string; args: unknown[] };
export const canvasCalls: CanvasCall[] = [];
export function clearCanvasCalls() {
  canvasCalls.length = 0;
}

/** Devuelve rutas con NaN, Infinity o literales indefinidos detectados en llamadas canvas. */
export function canvasNaNProblems(): string[] {
  const problems: string[] = [];
  const badString = /NaN|Infinity|undefined/;
  const inspect = (value: unknown, path: string) => {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      problems.push(`${path} = ${value}`);
    } else if (typeof value === 'string' && badString.test(value)) {
      problems.push(`${path} = ${value}`);
    } else if (Array.isArray(value)) {
      value.forEach((v, i) => inspect(v, `${path}[${i}]`));
    } else if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
      for (const [k, v] of Object.entries(value)) inspect(v, `${path}.${k}`);
    }
  };
  for (const call of canvasCalls) call.args.forEach((arg, i) => inspect(arg, `${call.method}[${i}]`));
  return problems;
}

/**
 * jsdom no trae un motor de canvas: el stub registra cada llamada para poder
 * verificar que las 19 escenas y gráficas llegan hasta el final sin lanzar.
 */
export function stubCanvasContext() {
  const ctx: Record<string, unknown> = {};
  const methods = [
    'save', 'restore', 'scale', 'translate', 'rotate', 'setTransform', 'resetTransform',
    'clearRect', 'fillRect', 'strokeRect', 'beginPath', 'closePath', 'moveTo', 'lineTo',
    'arc', 'arcTo', 'ellipse', 'bezierCurveTo', 'quadraticCurveTo', 'rect', 'roundRect',
    'fill', 'stroke', 'clip', 'fillText', 'strokeText', 'setLineDash', 'getLineDash',
    'drawImage', 'putImageData', 'transform',
  ];
  for (const method of methods) {
    ctx[method] = vi.fn((...args: unknown[]) => {
      canvasCalls.push({ method, args });
      return undefined;
    });
  }
  ctx.measureText = vi.fn((s: string) => {
    canvasCalls.push({ method: 'measureText', args: [s] });
    return { width: String(s).length * 7 };
  });
  const gradient = () => ({
    addColorStop: vi.fn((...args: unknown[]) => {
      canvasCalls.push({ method: 'addColorStop', args });
    }),
  });
  ctx.createLinearGradient = vi.fn((...args: unknown[]) => {
    canvasCalls.push({ method: 'createLinearGradient', args });
    return gradient();
  });
  ctx.createRadialGradient = vi.fn((...args: unknown[]) => {
    canvasCalls.push({ method: 'createRadialGradient', args });
    return gradient();
  });
  ctx.getImageData = vi.fn(() => ({ data: new Uint8ClampedArray(4) }));

  for (const prop of [
    'globalAlpha', 'lineWidth', 'fillStyle', 'strokeStyle', 'font', 'textAlign',
    'textBaseline', 'lineCap', 'lineJoin', 'lineDashOffset', 'shadowBlur',
    'shadowColor', 'miterLimit', 'globalCompositeOperation',
  ]) {
    Object.defineProperty(ctx, prop, {
      configurable: true,
      enumerable: true,
      get: () => (prop === 'globalAlpha' || prop === 'lineWidth' ? 1 : ''),
      set: (v: unknown) => canvasCalls.push({ method: `set ${prop}`, args: [v] }),
    });
  }
  Object.defineProperty(ctx, 'canvas', {
    configurable: true,
    get: () => ({ width: 600, height: 300 }),
  });

  HTMLCanvasElement.prototype.getContext = vi.fn(() => ctx) as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

stubCanvasContext();

/** Un solo fotograma por prueba: evita bucles infinitos de animación en jsdom. */
let pendingFrame: FrameRequestCallback | null = null;
Object.defineProperty(window, 'requestAnimationFrame', {
  configurable: true,
  value: vi.fn((cb: FrameRequestCallback) => {
    pendingFrame = cb;
    return 1;
  }),
});
Object.defineProperty(window, 'cancelAnimationFrame', {
  configurable: true,
  value: vi.fn(() => {
    pendingFrame = null;
  }),
});
export function flushAnimationFrame(time = performance.now() + 16) {
  const cb = pendingFrame;
  pendingFrame = null;
  if (cb) cb(time);
}

Object.defineProperty(window, 'matchMedia', {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
window.scrollTo = vi.fn();
HTMLAnchorElement.prototype.click = vi.fn();

beforeEach(() => {
  localStorage.clear();
  clearCanvasCalls();
});

afterEach(() => {
  cleanup();
  pendingFrame = null;
});
