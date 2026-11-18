/**
 * Kit de ilustración física para las escenas 2D.
 * Diseñado para representar equipos reales y reconocibles (torres de celosía,
 * cadenas de discos de vidrio/porcelana, pararrayos ZnO, transformadores con bujes,
 * montañas andinas, estratos de suelo, electrodos de cobre, osciloscopio y megóhmetro)
 * con etiquetas legibles y semántica de color consistente.
 */

export const PAL = {
  // Tintas sobre fondo claro
  ink: '#102033',
  inkSoft: '#3A4F66',
  muted: '#60758B',
  surface: '#FFFFFF',
  // Semántica física unificada
  phase: '#0B63CE', // Conductor de fase energizado (azul cobalto)
  phaseBright: '#4DA3FF', // Conductor sobre cielo de tormenta / pantalla oscura
  guard: '#C97A08', // Cable de guarda (ámbar latón)
  guardBright: '#FFCA57',
  porcelain: '#0F8578', // Vidrio templado / porcelana de aisladores
  porcelainLight: '#58D5C3',
  ok: '#0D8A59',
  okBright: '#3EE09B',
  warn: '#C97A08',
  warnBright: '#FFC44D',
  bad: '#D6362C',
  badBright: '#FF6B63',
  surge: '#6D3CE8', // Rayo / impulso / corona
  surgeBright: '#B694FF',
  copper: '#B55D19', // Varilla/contrapeso de cobre
  earth: '#8A5A32',
  steel: '#4E6378',
  steelLight: '#9FB4C7',
};

export type SceneMood = 'day' | 'storm' | 'lab';

/** Dibuja un escenario físico completo: cielo diurno andino, cielo de tormenta o banco de laboratorio. */
export function environment(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: { mood?: SceneMood; groundY?: number; mountains?: boolean; drySoil?: boolean } = {},
) {
  const mood = opts.mood ?? 'day';
  const gy = opts.groundY ?? h * 0.84;

  if (mood === 'lab') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#F7F9FC');
    g.addColorStop(1, '#ECF1F7');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(78, 99, 120, 0.075)';
    ctx.lineWidth = 1;
    const step = 24;
    ctx.beginPath();
    for (let x = 0; x <= w; x += step) {
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, h);
    }
    for (let y = 0; y <= h; y += step) {
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(w, y + 0.5);
    }
    ctx.stroke();
    return;
  }

  if (mood === 'storm') {
    const sky = ctx.createLinearGradient(0, 0, 0, gy);
    sky.addColorStop(0, '#162436');
    sky.addColorStop(0.55, '#21354E');
    sky.addColorStop(1, '#314A67');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, gy);

    if (opts.mountains !== false) {
      ctx.fillStyle = 'rgba(18, 32, 48, 0.55)';
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(w * 0.16, gy - h * 0.14);
      ctx.lineTo(w * 0.34, gy - h * 0.06);
      ctx.lineTo(w * 0.58, gy - h * 0.17);
      ctx.lineTo(w * 0.8, gy - h * 0.08);
      ctx.lineTo(w, gy - h * 0.13);
      ctx.lineTo(w, gy);
      ctx.closePath();
      ctx.fill();
    }

    // Suelo nocturno / húmedo
    const earth = ctx.createLinearGradient(0, gy, 0, h);
    earth.addColorStop(0, '#2E4636');
    earth.addColorStop(0.18, '#3B2F26');
    earth.addColorStop(1, '#261E18');
    ctx.fillStyle = earth;
    ctx.fillRect(0, gy, w, h - gy);
    line(ctx, 0, gy, w, gy, { color: '#5D8768', width: 2 });
    return;
  }

  // Día claro andino
  const sky = ctx.createLinearGradient(0, 0, 0, gy);
  sky.addColorStop(0, '#CFE4FA');
  sky.addColorStop(0.55, '#E5F0FC');
  sky.addColorStop(1, '#F5F9FD');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, gy);

  if (opts.mountains !== false) {
    // Cordillera lejana
    ctx.fillStyle = '#D3E1EE';
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(w * 0.14, gy - h * 0.16);
    ctx.lineTo(w * 0.31, gy - h * 0.07);
    ctx.lineTo(w * 0.52, gy - h * 0.19);
    ctx.lineTo(w * 0.74, gy - h * 0.09);
    ctx.lineTo(w * 0.91, gy - h * 0.15);
    ctx.lineTo(w, gy - h * 0.1);
    ctx.lineTo(w, gy);
    ctx.closePath();
    ctx.fill();
  }

  soilCutaway(ctx, 0, gy, w, h - gy, { dry: opts.drySoil });
}

/** Corte geológico del terreno con capa vegetal y estratos. */
export function soilCutaway(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { dry?: boolean; layers?: number } = {},
) {
  const dry = Boolean(opts.dry);
  const layers = opts.layers ?? 3;
  const grass = dry ? '#B9A35E' : '#6DA35F';
  const palette = dry
    ? ['#C9A477', '#B58D60', '#9D764C', '#86623D']
    : ['#9B6E49', '#855C3B', '#6F4B2F', '#5A3C25'];

  for (let i = 0; i < layers; i++) {
    ctx.fillStyle = palette[i % palette.length];
    const y0 = y + (h * i) / layers;
    ctx.fillRect(x, y0, w, h / layers + 1);
  }
  ctx.fillStyle = grass;
  ctx.fillRect(x, y, w, Math.min(6, Math.max(3, h * 0.08)));
  line(ctx, x, y, x + w, y, { color: dry ? '#96803E' : '#4E7E42', width: 1.5 });
}

/** Nube de tormenta realista. */
export function stormCloud(ctx: CanvasRenderingContext2D, cx: number, cy: number, width: number, alpha = 0.92) {
  ctx.save();
  ctx.globalAlpha = alpha;
  const puffs = [
    [-0.34, 0.04, 0.2],
    [-0.16, -0.06, 0.25],
    [0.05, -0.08, 0.27],
    [0.24, -0.02, 0.22],
    [0.38, 0.05, 0.17],
  ];
  for (const [dx, dy, r] of puffs) {
    const g = ctx.createRadialGradient(cx + dx * width, cy + dy * width - 6, 2, cx + dx * width, cy + dy * width, r * width);
    g.addColorStop(0, '#5A718C');
    g.addColorStop(0.7, '#3A4E66');
    g.addColorStop(1, '#2B3B50');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx + dx * width, cy + dy * width, r * width, 0, Math.PI * 2);
    ctx.fill();
  }
  // Signos de carga − en la base de la nube
  ctx.fillStyle = 'rgba(205, 224, 255, 0.55)';
  ctx.font = '700 11px ui-monospace, monospace';
  ctx.textAlign = 'center';
  for (const dx of [-0.24, -0.08, 0.08, 0.24]) {
    ctx.fillText('−', cx + dx * width, cy + width * 0.08);
  }
  ctx.restore();
}

/** Pantalla de osciloscopio enmarcada dentro del banco de laboratorio. */
export function scopeScreen(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts: { divsX?: number; divsY?: number; title?: string } = {},
) {
  ctx.save();
  // Bisel exterior
  ctx.fillStyle = '#DCE4EE';
  ctx.strokeStyle = '#B8C6D6';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(x - 6, y - 6, w + 12, h + 12, 12);
  ctx.fill();
  ctx.stroke();

  // Pantalla oscura tipo osciloscopio digital
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, '#0C1B29');
  g.addColorStop(1, '#091520');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fill();

  // Retícula
  const dx = opts.divsX ?? 8;
  const dy = opts.divsY ?? 5;
  ctx.strokeStyle = 'rgba(130, 185, 220, 0.13)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 1; i < dx; i++) {
    const xx = x + (w * i) / dx;
    ctx.moveTo(xx, y);
    ctx.lineTo(xx, y + h);
  }
  for (let j = 1; j < dy; j++) {
    const yy = y + (h * j) / dy;
    ctx.moveTo(x, yy);
    ctx.lineTo(x + w, yy);
  }
  ctx.stroke();

  if (opts.title) {
    text(ctx, opts.title, x + 10, y + 14, { size: 10, color: '#8BB2CC', mono: true, weight: 600 });
  }
  ctx.restore();
}

export function text(
  ctx: CanvasRenderingContext2D,
  s: string,
  x: number,
  y: number,
  o: { color?: string; size?: number; align?: CanvasTextAlign; mono?: boolean; weight?: number; alpha?: number } = {},
) {
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.fillStyle = o.color ?? PAL.ink;
  ctx.font = `${o.weight ?? 500} ${o.size ?? 12}px ${
    o.mono ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace' : 'system-ui, -apple-system, Segoe UI, sans-serif'
  }`;
  ctx.textAlign = o.align ?? 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
  ctx.restore();
}

export function line(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  o: { color?: string; width?: number; dash?: number[]; alpha?: number; cap?: CanvasLineCap } = {},
) {
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  ctx.strokeStyle = o.color ?? PAL.steel;
  ctx.lineWidth = o.width ?? 1.6;
  ctx.lineCap = o.cap ?? 'round';
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

export function circle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  o: { fill?: string; stroke?: string; width?: number; alpha?: number; dash?: number[] } = {},
) {
  if (r <= 0) return;
  ctx.save();
  ctx.globalAlpha = o.alpha ?? 1;
  if (o.dash) ctx.setLineDash(o.dash);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  if (o.fill) {
    ctx.fillStyle = o.fill;
    ctx.fill();
  }
  if (o.stroke) {
    ctx.strokeStyle = o.stroke;
    ctx.lineWidth = o.width ?? 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

export function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha = 0.45) {
  if (r <= 0) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function arrow(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, color = PAL.phase, width = 2) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  line(ctx, x1, y1, x2, y2, { color, width });
  const s = 5.5 + width;
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - s * Math.cos(a - 0.42), y2 - s * Math.sin(a - 0.42));
  ctx.lineTo(x2 - s * Math.cos(a + 0.42), y2 - s * Math.sin(a + 0.42));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

/** Pastilla de etiqueta con fondo opaco para que el texto nunca se pierda sobre líneas o torres. */
export function pill(
  ctx: CanvasRenderingContext2D,
  label: string,
  x: number,
  y: number,
  o: {
    color?: string;
    dark?: boolean;
    align?: 'left' | 'center' | 'right';
    mono?: boolean;
    size?: number;
  } = {},
) {
  const size = o.size ?? 10.5;
  const color = o.color ?? (o.dark ? '#58D5C3' : PAL.phase);
  ctx.save();
  ctx.font = `600 ${size}px ${o.mono ? 'ui-monospace, SFMono-Regular, Menlo, monospace' : 'system-ui, -apple-system, sans-serif'}`;
  const tw = ctx.measureText(label).width;
  const padX = 8;
  const pw = tw + padX * 2;
  const ph = size + 9;
  const rx = o.align === 'center' ? x - pw / 2 : o.align === 'right' ? x - pw : x;
  const ry = y - ph / 2;

  ctx.fillStyle = o.dark ? 'rgba(10, 22, 35, 0.88)' : 'rgba(255, 255, 255, 0.93)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(rx, ry, pw, ph, ph / 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rx + padX, y + 0.5);
  ctx.restore();
}

/** Encabezado discreto de esquina en la escena. */
export function sceneHeader(ctx: CanvasRenderingContext2D, title: string, sub: string | undefined, dark = false) {
  ctx.save();
  ctx.font = '700 12px system-ui, -apple-system, sans-serif';
  const w1 = ctx.measureText(title).width;
  ctx.font = '500 10.5px system-ui, -apple-system, sans-serif';
  const w2 = sub ? ctx.measureText(sub).width : 0;
  const boxW = Math.max(w1, w2) + 20;
  const boxH = sub ? 38 : 24;
  ctx.fillStyle = dark ? 'rgba(10, 22, 35, 0.78)' : 'rgba(255, 255, 255, 0.86)';
  ctx.strokeStyle = dark ? 'rgba(159, 180, 199, 0.25)' : 'rgba(16, 32, 51, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(10, 9, boxW, boxH, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  text(ctx, title, 20, 21, { size: 12, weight: 700, color: dark ? '#F0F6FC' : PAL.ink });
  if (sub) text(ctx, sub, 20, 36, { size: 10.5, color: dark ? '#A9C0D6' : PAL.muted });
}

/** Cota técnica con topes y pastilla legible en el centro. */
export function dimension(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  label: string,
  color = PAL.phase,
  dark = false,
) {
  if (Math.hypot(x2 - x1, y2 - y1) < 6) return;
  line(ctx, x1, y1, x2, y2, { color, width: 1.4 });
  const perp = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2;
  const tick = 5;
  for (const [px, py] of [
    [x1, y1],
    [x2, y2],
  ]) {
    line(ctx, px - tick * Math.cos(perp), py - tick * Math.sin(perp), px + tick * Math.cos(perp), py + tick * Math.sin(perp), {
      color,
      width: 1.5,
    });
  }
  pill(ctx, label, (x1 + x2) / 2, (y1 + y2) / 2, { color, dark, align: 'center', mono: true, size: 10 });
}

/** Símbolo eléctrico clásico de puesta a tierra ⏚. */
export function groundSymbol(ctx: CanvasRenderingContext2D, x: number, y: number, size = 12, color = PAL.copper) {
  line(ctx, x, y, x, y + size * 0.45, { color, width: 1.8 });
  line(ctx, x - size * 0.65, y + size * 0.45, x + size * 0.65, y + size * 0.45, { color, width: 1.8 });
  line(ctx, x - size * 0.42, y + size * 0.75, x + size * 0.42, y + size * 0.75, { color, width: 1.6 });
  line(ctx, x - size * 0.2, y + size * 1.03, x + size * 0.2, y + size * 1.03, { color, width: 1.4 });
}

/** Torre de transmisión de acero en celosía con cimentación, crucetas y punta de guarda. */
export function latticeTower(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  height: number,
  o: {
    baseHalf?: number;
    arms?: { yFrac: number; half: number; singleSide?: 'left' | 'right' }[];
    color?: string;
    pedestals?: boolean;
  } = {},
) {
  const color = o.color ?? PAL.steel;
  const bw = o.baseHalf ?? Math.max(14, height * 0.16);
  const waistY = groundY - height * 0.64;
  const topY = groundY - height;
  const ww = bw * 0.38;
  const tw = bw * 0.22;

  ctx.save();
  // Pedestales de concreto
  if (o.pedestals !== false) {
    ctx.fillStyle = '#9BA8B4';
    ctx.fillRect(x - bw - 5, groundY - 4, 10, 6);
    ctx.fillRect(x + bw - 5, groundY - 4, 10, 6);
  }

  // Montantes principales
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.1;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x - bw, groundY);
  ctx.lineTo(x - ww, waistY);
  ctx.lineTo(x - tw, topY + height * 0.1);
  ctx.lineTo(x, topY);
  ctx.lineTo(x + tw, topY + height * 0.1);
  ctx.lineTo(x + ww, waistY);
  ctx.lineTo(x + bw, groundY);
  ctx.stroke();

  // Celosía diagonal
  ctx.lineWidth = 1.1;
  ctx.globalAlpha = 0.72;
  ctx.beginPath();
  const bays = 6;
  const bodyH = height * 0.9;
  const halfAt = (f: number) => (f < 0.71 ? bw + (ww - bw) * (f / 0.71) : ww + (tw - ww) * ((f - 0.71) / 0.29));
  for (let i = 0; i < bays; i++) {
    const f0 = i / bays;
    const f1 = (i + 1) / bays;
    const y0 = groundY - f0 * bodyH;
    const y1 = groundY - f1 * bodyH;
    const h0 = halfAt(f0);
    const h1 = halfAt(f1);
    ctx.moveTo(x - h0, y0);
    ctx.lineTo(x + h1, y1);
    ctx.moveTo(x + h0, y0);
    ctx.lineTo(x - h1, y1);
    ctx.moveTo(x - h1, y1);
    ctx.lineTo(x + h1, y1);
  }
  ctx.stroke();

  // Crucetas trianguladas
  ctx.globalAlpha = 1;
  ctx.lineWidth = 1.8;
  for (const arm of o.arms ?? []) {
    const ay = groundY - height * arm.yFrac;
    const bodyHalf = halfAt(Math.min(0.98, arm.yFrac / 0.9));
    ctx.beginPath();
    if (arm.singleSide !== 'right') {
      ctx.moveTo(x - bodyHalf, ay);
      ctx.lineTo(x - arm.half, ay);
      ctx.lineTo(x - bodyHalf, ay - Math.min(13, height * 0.065));
    }
    if (arm.singleSide !== 'left') {
      ctx.moveTo(x + bodyHalf, ay);
      ctx.lineTo(x + arm.half, ay);
      ctx.lineTo(x + bodyHalf, ay - Math.min(13, height * 0.065));
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** Cadena de aisladores de disco (vidrio templado / porcelana) con opción de contaminación y flameo. */
export function insulatorString(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  discs: number,
  lengthPx: number,
  angleDeg = 0,
  o: {
    discRadius?: number;
    polluted?: boolean;
    flashover?: boolean;
    t?: number;
    dark?: boolean;
  } = {},
) {
  const rad = (angleDeg * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = Math.cos(rad);
  const endX = x + dx * lengthPx;
  const endY = y + dy * lengthPx;
  const shown = Math.max(3, Math.min(discs, 16));
  const step = lengthPx / shown;
  const dr = o.discRadius ?? Math.min(13, Math.max(6.5, step * 0.95));

  // Vástago metálico central
  line(ctx, x, y, endX, endY, { color: o.dark ? PAL.steelLight : PAL.steel, width: 1.8 });

  for (let i = 0; i < shown; i++) {
    const cx = x + dx * step * (i + 0.5);
    const cy = y + dy * step * (i + 0.5);
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-rad);
    // Faldón de vidrio/porcelana
    ctx.fillStyle = o.dark ? 'rgba(67, 198, 182, 0.72)' : 'rgba(15, 133, 120, 0.78)';
    ctx.strokeStyle = o.dark ? '#9CF0E4' : '#0A5E55';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(0, 0, dr, Math.max(2.3, step * 0.28), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Caperuza metálica superior
    ctx.fillStyle = o.dark ? '#C5D5E4' : '#5B7085';
    ctx.fillRect(-dr * 0.28, -Math.max(2.2, step * 0.34), dr * 0.56, 2.2);
    // Capa de polvo / salinidad si hay contaminación
    if (o.polluted) {
      ctx.strokeStyle = '#C9934B';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.ellipse(0, step * 0.1, dr * 0.96, Math.max(1.6, step * 0.16), 0, 0, Math.PI);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (o.flashover) {
    electricArc(ctx, x, y, endX, endY, o.t ?? 0, o.dark ? PAL.badBright : PAL.bad, 2.5);
  }
  return { endX, endY };
}

/** Pararrayos (descargador de sobretensiones de ZnO) con aletas y conexión a tierra. */
export function surgeArrester(
  ctx: CanvasRenderingContext2D,
  x: number,
  topY: number,
  groundY: number,
  o: { active?: boolean; t?: number; dark?: boolean } = {},
) {
  const bodyTop = topY + 12;
  const bodyBot = groundY - 26;
  const bodyH = Math.max(36, bodyBot - bodyTop);
  const sheds = 7;

  // Conexión superior y anillo ecualizador
  line(ctx, x, topY, x, bodyTop, { color: o.dark ? PAL.steelLight : PAL.steel, width: 2 });
  ctx.save();
  ctx.strokeStyle = o.dark ? PAL.steelLight : PAL.steel;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(x, bodyTop + 3, 16, 4, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Columna de bloques de ZnO con faldones poliméricos
  for (let i = 0; i < sheds; i++) {
    const yy = bodyTop + (bodyH * i) / sheds;
    const sh = bodyH / sheds - 1.5;
    ctx.fillStyle = i % 2 === 0 ? '#6D5A7C' : '#856F96';
    ctx.strokeStyle = o.dark ? '#CDBCE0' : '#4A3A57';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(x - 11, yy, 22, sh, 3);
    ctx.fill();
    ctx.stroke();
  }

  // Pedestal y cable de bajada a tierra
  ctx.fillStyle = '#6D7E8F';
  ctx.fillRect(x - 13, bodyBot, 26, 6);
  ctx.restore();
  line(ctx, x, bodyBot + 6, x, groundY, { color: PAL.copper, width: 2.2 });
  groundSymbol(ctx, x, groundY, 11, PAL.copper);

  // Pulso de corriente drenada a tierra cuando actúa
  if (o.active) {
    const u = ((o.t ?? 0) * 1.4) % 1;
    const py = topY + u * (groundY - topY);
    glow(ctx, x, py, 14, PAL.surgeBright, 0.55);
    circle(ctx, x, py, 3.5, { fill: PAL.surge });
  }
}

/** Transformador de potencia reconocible: cuba, radiadores, tanque conservador y buje AT. */
export function powerTransformer(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  groundY: number,
  boxW: number,
  boxH: number,
  o: { alert?: boolean; label?: string; dark?: boolean } = {},
) {
  const x = centerX - boxW / 2;
  const y = groundY - boxH;
  const bushingTop = y - boxH * 0.34;

  ctx.save();
  // Base de concreto
  ctx.fillStyle = '#8E9CA8';
  ctx.fillRect(x - 5, groundY - 5, boxW + 10, 5);

  // Cuba principal
  ctx.fillStyle = o.alert ? '#FCE6E5' : '#D5DFE8';
  ctx.strokeStyle = o.alert ? PAL.bad : PAL.steel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, boxW, boxH - 4, 6);
  ctx.fill();
  ctx.stroke();

  // Aletas radiadoras de enfriamiento
  ctx.strokeStyle = o.alert ? 'rgba(214,54,44,0.45)' : 'rgba(78,99,120,0.45)';
  ctx.lineWidth = 2;
  const fins = 4;
  for (let i = 0; i < fins; i++) {
    const fx = x + boxW * (0.2 + (i * 0.6) / Math.max(1, fins - 1));
    ctx.beginPath();
    ctx.moveTo(fx, y + 10);
    ctx.lineTo(fx, groundY - 12);
    ctx.stroke();
  }

  // Tanque conservador de aceite lateral superior
  ctx.fillStyle = '#BAC8D6';
  ctx.strokeStyle = PAL.steel;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(x + boxW * 0.58, y - 13, boxW * 0.38, 9, 4);
  ctx.fill();
  ctx.stroke();

  // Buje aislador de alta tensión (porcelana marrón/gris)
  const bx = centerX - boxW * 0.08;
  for (let i = 0; i < 4; i++) {
    const by = y - 5 - (i * (y - bushingTop - 6)) / 4;
    ctx.fillStyle = '#8F5B3C';
    ctx.beginPath();
    ctx.ellipse(bx, by, 6.5 - i * 0.6, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  circle(ctx, bx, bushingTop, 3, { fill: PAL.phase });
  ctx.restore();

  if (o.label) {
    pill(ctx, o.label, centerX, groundY - boxH * 0.28, {
      color: o.alert ? PAL.bad : PAL.inkSoft,
      align: 'center',
      mono: true,
      size: 9.5,
    });
  }
  return { bushingX: centerX - boxW * 0.08, bushingY: bushingTop, topY: y };
}

/** Rayo o arco eléctrico con núcleo luminoso y resplandor. */
export function electricArc(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  seed = 1,
  color = PAL.surgeBright,
  width = 2.4,
) {
  let s = Math.floor(seed * 17 + 13) % 233280;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 2) return;
  const nx = -dy / len;
  const ny = dx / len;
  const segs = Math.max(6, Math.min(14, Math.round(len / 14)));
  const jitter = Math.min(16, len * 0.12);
  const pts: [number, number][] = [[x1, y1]];
  for (let i = 1; i < segs; i++) {
    const u = i / segs;
    const off = (rnd() - 0.5) * 2 * jitter;
    pts.push([x1 + dx * u + nx * off, y1 + dy * u + ny * off]);
  }
  pts.push([x2, y2]);

  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.lineWidth = width + 2.2;
  ctx.globalAlpha = 0.42;
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.strokeStyle = '#FFFFFF';
  ctx.lineWidth = Math.max(1.2, width * 0.65);
  ctx.beginPath();
  pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = width * 0.45;
  ctx.stroke();
  ctx.restore();
}

/** Persona con casco de seguridad (para escala y tensión de paso/contacto). */
export function technician(ctx: CanvasRenderingContext2D, x: number, groundY: number, h: number, color = PAL.ink) {
  const headR = h * 0.14;
  const headY = groundY - h + headR;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  // Cabeza
  ctx.beginPath();
  ctx.arc(x, headY, headR, 0, Math.PI * 2);
  ctx.stroke();
  // Casco amarillo
  ctx.fillStyle = '#F2B528';
  ctx.beginPath();
  ctx.arc(x, headY - 1, headR * 1.15, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x - headR * 1.35, headY - 2, headR * 2.7, 2.2);
  // Torso, brazos y piernas en paso
  ctx.beginPath();
  ctx.moveTo(x, headY + headR);
  ctx.lineTo(x, groundY - h * 0.38);
  ctx.moveTo(x - h * 0.22, groundY - h * 0.6);
  ctx.lineTo(x + h * 0.22, groundY - h * 0.6);
  ctx.moveTo(x, groundY - h * 0.38);
  ctx.lineTo(x - h * 0.2, groundY);
  ctx.moveTo(x, groundY - h * 0.38);
  ctx.lineTo(x + h * 0.2, groundY);
  ctx.stroke();
  ctx.restore();
}
