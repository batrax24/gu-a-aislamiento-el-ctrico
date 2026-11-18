import { useEffect, useRef, useState, type ReactNode } from 'react';
import { fmt } from '../lib/num';
import type { CheckItem, LegendItem, ParamDef, Reading } from '../experiments/types';

/* ------------------------------- Botones y chips ------------------------ */

export function Btn({
  children,
  onClick,
  tone = 'ghost',
  disabled,
  title,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: 'primary' | 'ghost' | 'warn' | 'soft';
  disabled?: boolean;
  title?: string;
  className?: string;
}) {
  return (
    <button className={`btn btn-${tone} ${className}`.trim()} onClick={onClick} disabled={disabled} title={title} type="button">
      {children}
    </button>
  );
}

export function Chip({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'ok' | 'warn' | 'bad' | 'accent' | 'surge';
}) {
  return <span className={`chip chip-${tone}`}>{children}</span>;
}

export function Stars({ n, size = 13 }: { n: number; size?: number }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${n} de 3 estrellas`} title={`${n} de 3 estrellas`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= n ? 'on' : ''}>
          ★
        </span>
      ))}
    </span>
  );
}

/* -------------------------------- Escena 2D ----------------------------- */

/**
 * Reloj compartido de la escena activa. Las definiciones reciben `t` como un objeto
 * con `valueOf()` que lee este valor en cada fotograma, así las ilustraciones se
 * animan sin volver a renderizar toda la bancada de controles y gráficas.
 */
let sceneClock = 0;
export const getSceneClock = () => sceneClock;

export function SceneCanvas({
  draw,
  aspect = 16 / 9.2,
  footer,
  legend,
}: {
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void;
  aspect?: number;
  footer?: ReactNode;
  legend?: LegendItem[];
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawRef = useRef(draw);
  drawRef.current = draw;
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;
  const elapsedRef = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    let raf = 0;
    let stop = false;
    let last = performance.now();

    const loop = (now: number) => {
      if (stop) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      if (!pausedRef.current) elapsedRef.current += dt;
      sceneClock = elapsedRef.current;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const dpr = Math.min(2, globalThis.devicePixelRatio || 1);
        const rect = canvas.getBoundingClientRect();
        const w = Math.max(320, Math.round(rect.width));
        const h = Math.max(190, Math.round(rect.height));
        if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        drawRef.current(ctx, w, h, elapsedRef.current);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="scene">
      <div className="scene-stage">
        <canvas ref={ref} style={{ aspectRatio: String(aspect) }} aria-label="Simulación visual del fenómeno eléctrico" />
        <div className="scene-controls">
          <button
            type="button"
            className="scene-ctrl-btn"
            onClick={() => setPaused((p) => !p)}
            title={paused ? 'Reanudar animación' : 'Pausar animación para observar con calma'}
          >
            {paused ? '▶ Reanudar' : '❚❚ Pausar'}
          </button>
          <button
            type="button"
            className="scene-ctrl-btn"
            onClick={() => {
              elapsedRef.current = 0;
            }}
            title="Repetir el ciclo desde el inicio"
          >
            ↺ Repetir
          </button>
        </div>
      </div>

      {legend && legend.length > 0 && (
        <div className="scene-legend" aria-label="Leyenda visual">
          {legend.map((it) => (
            <span className="legend-item" key={it.label}>
              <i style={{ background: it.color }} aria-hidden="true" />
              {it.label}
            </span>
          ))}
        </div>
      )}

      {footer && <div className="scene-foot">{footer}</div>}
    </div>
  );
}

/* ------------------------------- Controles ------------------------------ */

export function Control({
  def,
  value,
  onChange,
  format,
}: {
  def: ParamDef;
  value: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
}) {
  const dec = def.decimals ?? (def.step < 0.01 ? 3 : def.step < 0.1 ? 2 : def.step < 1 ? 1 : 0);

  if (def.options) {
    return (
      <div className="control control-choice">
        <div className="control-head">
          <span className="control-label">{def.label}</span>
        </div>
        {def.options.length <= 3 ? (
          <div className="seg-group" role="group" aria-label={def.label}>
            {def.options.map((o) => (
              <button
                key={o.value}
                type="button"
                className={`seg-btn ${value === o.value ? 'active' : ''}`}
                aria-pressed={value === o.value}
                onClick={() => onChange(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
        ) : (
          <select aria-label={def.label} value={value} onChange={(e) => onChange(Number(e.target.value))}>
            {def.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        {def.help && <span className="control-help">{def.help}</span>}
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, ((value - def.min) / Math.max(1e-9, def.max - def.min)) * 100));
  const minDec = Number.isInteger(def.min) ? 0 : dec;
  const maxDec = Number.isInteger(def.max) ? 0 : dec;

  return (
    <label className="control">
      <span className="control-head">
        <span className="control-label">{def.label}</span>
        <span className="control-value mono">
          {format ? format(value) : fmt(value, dec)}
          {def.unit ? ` ${def.unit}` : ''}
        </span>
      </span>
      <input
        type="range"
        min={def.min}
        max={def.max}
        step={def.step}
        value={value}
        style={{ ['--fill' as string]: `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="control-range mono" aria-hidden="true">
        <span>
          {fmt(def.min, minDec)}
          {def.unit ? ` ${def.unit}` : ''}
        </span>
        <span>
          {fmt(def.max, maxDec)}
          {def.unit ? ` ${def.unit}` : ''}
        </span>
      </span>
      {def.help && <span className="control-help">{def.help}</span>}
    </label>
  );
}

/* ------------------------------- Lecturas ------------------------------- */

export function Readouts({ items }: { items: Reading[] }) {
  return (
    <div className="readouts">
      {items.map((r) => (
        <div key={r.label} className={`reading tone-${r.tone ?? 'neutral'}`}>
          <span className="reading-label">{r.label}</span>
          <span className="reading-value mono">{r.value}</span>
          {r.sub && <span className="reading-sub">{r.sub}</span>}
        </div>
      ))}
    </div>
  );
}

export function Equation({ lines, title = 'Cálculo paso a paso con tus valores' }: { lines: string[]; title?: string }) {
  return (
    <div className="equation">
      <div className="equation-title">{title}</div>
      <div className="equation-list">
        {lines.map((l, i) => {
          const isFormula = l.includes('=') || l.includes('≥') || l.includes('≈') || l.includes('→');
          return (
            <div className={isFormula ? 'equation-line mono' : 'equation-note'} key={i}>
              {isFormula && <span className="eq-step">{i + 1}</span>}
              <span>{l}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Checks({ items }: { items: CheckItem[] }) {
  return (
    <ul className="checks">
      {items.map((c) => (
        <li key={c.label} className={c.info ? 'info' : c.ok ? 'ok' : 'bad'}>
          <span className="check-icon" aria-hidden="true">
            {c.info ? 'i' : c.ok ? '✓' : '✕'}
          </span>
          <span>
            <strong>{c.label}</strong>
            {c.detail && <em>{c.detail}</em>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------- Gráficas SVG --------------------------- */

export type Series = {
  pts: [number, number][];
  color: string;
  width?: number;
  dash?: string;
  area?: boolean;
  opacity?: number;
  label?: string;
  steps?: boolean;
};

export type Marker = {
  x: number;
  y: number;
  label?: string;
  color?: string;
  shape?: 'dot' | 'ring' | 'cross';
};

export type RefLine = {
  at: number;
  label?: string;
  color?: string;
  dash?: string;
  axis?: 'x' | 'y';
};

export type Band = {
  x1?: number;
  x2?: number;
  y1?: number;
  y2?: number;
  color?: string;
  label?: string;
  textColor?: string;
};

export function Plot({
  xDomain,
  yDomain,
  xLabel,
  yLabel,
  series = [],
  markers = [],
  refs = [],
  bands = [],
  xLog = false,
  yLog = false,
  caption,
  height = 265,
  ticksX = 5,
  ticksY = 5,
}: {
  xDomain: [number, number];
  yDomain: [number, number];
  xLabel: string;
  yLabel: string;
  series?: Series[];
  markers?: Marker[];
  refs?: RefLine[];
  bands?: Band[];
  xLog?: boolean;
  yLog?: boolean;
  caption?: string;
  height?: number;
  ticksX?: number;
  ticksY?: number;
}) {
  const [hover, setHover] = useState<{ x: number; y: number; svgX: number; svgY: number } | null>(null);
  const W = 600;
  const H = height;
  const m = { l: 62, r: 22, t: 18, b: 42 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;

  const sx = (x: number) => {
    const [a, b] = xDomain;
    if (xLog) {
      const la = Math.log10(Math.max(1e-9, a));
      const lb = Math.log10(Math.max(1e-9, b));
      return m.l + ((Math.log10(Math.max(1e-9, x)) - la) / (lb - la || 1)) * iw;
    }
    return m.l + ((x - a) / (b - a || 1)) * iw;
  };

  const sy = (y: number) => {
    const [a, b] = yDomain;
    if (yLog) {
      const la = Math.log10(Math.max(1e-9, a));
      const lb = Math.log10(Math.max(1e-9, b));
      return m.t + ih - ((Math.log10(Math.max(1e-9, y)) - la) / (lb - la || 1)) * ih;
    }
    return m.t + ih - ((y - a) / (b - a || 1)) * ih;
  };

  const invX = (px: number) => {
    const u = Math.max(0, Math.min(1, (px - m.l) / iw));
    const [a, b] = xDomain;
    if (xLog) {
      const la = Math.log10(Math.max(1e-9, a));
      const lb = Math.log10(Math.max(1e-9, b));
      return Math.pow(10, la + u * (lb - la));
    }
    return a + u * (b - a);
  };

  const ticks = (domain: [number, number], n: number, log: boolean) => {
    const [a, b] = domain;
    if (log) {
      const out: number[] = [];
      const eMin = Math.floor(Math.log10(Math.max(1e-9, a)));
      const eMax = Math.ceil(Math.log10(Math.max(1e-9, b)));
      const mults = eMax - eMin >= 4 ? [1] : [1, 2, 5];
      for (let e = eMin; e <= eMax; e++) {
        for (const k of mults) {
          const v = k * Math.pow(10, e);
          if (v >= a * 0.999 && v <= b * 1.001) out.push(v);
        }
      }
      return out;
    }
    const step = (b - a) / n;
    const mag = Math.pow(10, Math.floor(Math.log10(Math.abs(step) || 1)));
    const norm = step / mag;
    const nice = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
    const s2 = nice * mag;
    const start = Math.ceil(a / s2) * s2;
    const out: number[] = [];
    for (let v = start; v <= b + 1e-9; v += s2) out.push(Number(v.toFixed(10)));
    return out;
  };

  const labelNum = (v: number) => {
    if (Math.abs(v) >= 10000) return `${(v / 1000).toFixed(0)}k`;
    if (Math.abs(v) >= 10) return fmt(v, 0);
    if (Math.abs(v) >= 1) return fmt(v, Number.isInteger(v) ? 0 : 1);
    if (v === 0) return '0';
    return fmt(v, 2);
  };

  const clampX = (px: number) => Math.max(m.l, Math.min(W - m.r, px));
  const clampY = (py: number) => Math.max(m.t, Math.min(H - m.b, py));

  const path = (s: Series) => {
    const pts = s.pts.filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y));
    return pts
      .map(([x, y], i) => {
        const X = clampX(sx(x));
        const Y = clampY(sy(y));
        if (i === 0) return `M${X.toFixed(1)},${Y.toFixed(1)}`;
        if (s.steps) {
          const [px] = pts[i - 1];
          const pxSvg = clampX(sx(px));
          return `L${pxSvg.toFixed(1)},${Y.toFixed(1)} L${X.toFixed(1)},${Y.toFixed(1)}`;
        }
        return `L${X.toFixed(1)},${Y.toFixed(1)}`;
      })
      .join(' ');
  };

  const areaPath = (s: Series) => {
    const p = path(s);
    if (!p || s.pts.length < 2) return '';
    const baseVal = yLog ? yDomain[0] : Math.max(yDomain[0], Math.min(yDomain[1], 0));
    const base = clampY(sy(baseVal));
    const first = s.pts[0];
    const last = s.pts[s.pts.length - 1];
    return `${p} L${clampX(sx(last[0])).toFixed(1)},${base.toFixed(1)} L${clampX(sx(first[0])).toFixed(1)},${base.toFixed(1)} Z`;
  };

  const legendItems = series.filter((s) => s.label);
  const primarySeries = series[0];

  const handlePointer = (ev: React.MouseEvent<SVGSVGElement>) => {
    if (!primarySeries || primarySeries.pts.length < 2) return;
    const rect = ev.currentTarget.getBoundingClientRect();
    if (rect.width <= 0) return;
    const svgPx = ((ev.clientX - rect.left) / rect.width) * W;
    if (svgPx < m.l || svgPx > W - m.r) {
      setHover(null);
      return;
    }
    const targetX = invX(svgPx);
    let best = primarySeries.pts[0];
    let bestDist = Infinity;
    for (const pt of primarySeries.pts) {
      const dist = xLog ? Math.abs(Math.log10(Math.max(1e-9, pt[0])) - Math.log10(Math.max(1e-9, targetX))) : Math.abs(pt[0] - targetX);
      if (dist < bestDist && Number.isFinite(pt[1])) {
        bestDist = dist;
        best = pt;
      }
    }
    setHover({ x: best[0], y: best[1], svgX: clampX(sx(best[0])), svgY: clampY(sy(best[1])) });
  };

  return (
    <figure className="plot">
      {legendItems.length > 0 && (
        <div className="plot-legend">
          {legendItems.map((s) => (
            <span className="plot-legend-item" key={s.label}>
              <i
                style={{
                  borderTopColor: s.color,
                  borderTopStyle: s.dash ? 'dashed' : 'solid',
                }}
                aria-hidden="true"
              />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${yLabel} en función de ${xLabel}`}
        onMouseMove={handlePointer}
        onMouseLeave={() => setHover(null)}
      >
        <rect x={m.l} y={m.t} width={iw} height={ih} rx={4} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.1" />

        {bands.map((b, i) => {
          const x1 = clampX(sx(b.x1 ?? xDomain[0]));
          const x2 = clampX(sx(b.x2 ?? xDomain[1]));
          const y1 = clampY(sy(b.y2 ?? yDomain[1]));
          const y2 = clampY(sy(b.y1 ?? yDomain[0]));
          const bx = Math.min(x1, x2);
          const by = Math.min(y1, y2);
          return (
            <g key={`b${i}`}>
              <rect x={bx} y={by} width={Math.abs(x2 - x1)} height={Math.abs(y2 - y1)} fill={b.color ?? 'rgba(11, 99, 206, 0.08)'} />
              {b.label && (
                <text x={bx + 7} y={by + 14} fontSize="10" fontWeight="600" fill={b.textColor ?? '#33475B'}>
                  {b.label}
                </text>
              )}
            </g>
          );
        })}

        {ticks(xDomain, ticksX, xLog).map((v) => (
          <g key={`x${v}`}>
            <line x1={sx(v)} y1={m.t} x2={sx(v)} y2={H - m.b} stroke="rgba(78, 99, 120, 0.11)" />
            <text x={sx(v)} y={H - m.b + 15} fontSize="9.8" fill="#52667A" textAnchor="middle" fontFamily="ui-monospace, monospace">
              {labelNum(v)}
            </text>
          </g>
        ))}

        {ticks(yDomain, ticksY, yLog).map((v) => (
          <g key={`y${v}`}>
            <line x1={m.l} y1={sy(v)} x2={W - m.r} y2={sy(v)} stroke="rgba(78, 99, 120, 0.11)" />
            <text x={m.l - 8} y={sy(v) + 3} fontSize="9.8" fill="#52667A" textAnchor="end" fontFamily="ui-monospace, monospace">
              {labelNum(v)}
            </text>
          </g>
        ))}

        {refs.map((r, i) => {
          if (r.axis === 'x') {
            const rx = clampX(sx(r.at));
            const col = r.color ?? '#C97A08';
            const nearRight = rx > W - m.r - 95;
            return (
              <g key={`r${i}`}>
                <line x1={rx} y1={m.t} x2={rx} y2={H - m.b} stroke={col} strokeDasharray={r.dash ?? '5 4'} strokeWidth="1.4" />
                {r.label && (
                  <text
                    x={nearRight ? rx - 5 : rx + 5}
                    y={m.t + 13}
                    fontSize="9.8"
                    fontWeight="600"
                    fill={col}
                    textAnchor={nearRight ? 'end' : 'start'}
                  >
                    {r.label}
                  </text>
                )}
              </g>
            );
          }
          const ry = clampY(sy(r.at));
          const col = r.color ?? '#D6362C';
          const nearTop = ry < m.t + 15;
          return (
            <g key={`r${i}`}>
              <line x1={m.l} y1={ry} x2={W - m.r} y2={ry} stroke={col} strokeDasharray={r.dash ?? '5 4'} strokeWidth="1.4" />
              {r.label && (
                <text x={W - m.r - 6} y={nearTop ? ry + 12 : ry - 5} fontSize="9.8" fontWeight="600" fill={col} textAnchor="end">
                  {r.label}
                </text>
              )}
            </g>
          );
        })}

        {series.map((s, i) => (
          <g key={`s${i}`}>
            {s.area && <path d={areaPath(s)} fill={s.color} opacity={s.opacity ?? 0.12} />}
            <path
              d={path(s)}
              fill="none"
              stroke={s.color}
              strokeWidth={s.width ?? 2.3}
              strokeDasharray={s.dash}
              opacity={s.opacity ?? 1}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          </g>
        ))}

        {hover && (
          <g pointerEvents="none">
            <line x1={hover.svgX} y1={m.t} x2={hover.svgX} y2={H - m.b} stroke="rgba(16,32,51,0.28)" strokeDasharray="3 3" />
            <circle cx={hover.svgX} cy={hover.svgY} r={4} fill="#102033" stroke="#FFFFFF" strokeWidth="1.5" />
            <rect
              x={hover.svgX > W - 165 ? hover.svgX - 134 : hover.svgX + 8}
              y={Math.max(m.t + 4, hover.svgY - 26)}
              width={126}
              height={20}
              rx={5}
              fill="rgba(16,32,51,0.9)"
            />
            <text
              x={hover.svgX > W - 165 ? hover.svgX - 71 : hover.svgX + 71}
              y={Math.max(m.t + 17, hover.svgY - 13)}
              fontSize="9.5"
              fill="#FFFFFF"
              textAnchor="middle"
              fontFamily="ui-monospace, monospace"
            >
              {`${labelNum(hover.x)} → ${labelNum(hover.y)}`}
            </text>
          </g>
        )}

        {markers.map((mk, i) => {
          const X = clampX(sx(mk.x));
          const Y = clampY(sy(mk.y));
          const col = mk.color ?? '#0B63CE';
          const nearRight = X > W - m.r - 95;
          const nearTop = Y < m.t + 18;
          return (
            <g key={`m${i}`}>
              {mk.shape === 'cross' ? (
                <>
                  <line x1={X - 4.5} y1={Y - 4.5} x2={X + 4.5} y2={Y + 4.5} stroke={col} strokeWidth="2.2" />
                  <line x1={X - 4.5} y1={Y + 4.5} x2={X + 4.5} y2={Y - 4.5} stroke={col} strokeWidth="2.2" />
                </>
              ) : (
                <>
                  <circle cx={X} cy={Y} r={5.2} fill={mk.shape === 'ring' ? '#FFFFFF' : col} stroke={mk.shape === 'ring' ? col : '#FFFFFF'} strokeWidth="2" />
                  {mk.shape === 'ring' && <circle cx={X} cy={Y} r={2} fill={col} />}
                </>
              )}
              {mk.label && (
                <text
                  x={nearRight ? X - 8 : X + 8}
                  y={nearTop ? Y + 14 : Y - 8}
                  fontSize="10.2"
                  fontWeight="700"
                  fill={col}
                  textAnchor={nearRight ? 'end' : 'start'}
                  fontFamily="ui-monospace, monospace"
                >
                  {mk.label}
                </text>
              )}
            </g>
          );
        })}

        <text x={m.l + iw / 2} y={H - 7} fontSize="11" fontWeight="600" fill="#33475B" textAnchor="middle">
          {xLabel}
        </text>
        <text x={14} y={m.t + ih / 2} fontSize="11" fontWeight="600" fill="#33475B" textAnchor="middle" transform={`rotate(-90 14 ${m.t + ih / 2})`}>
          {yLabel}
        </text>
      </svg>

      {caption && <figcaption className="plot-caption">{caption}</figcaption>}
    </figure>
  );
}

/** Gráfica de barras comparativas Esfuerzo vs. Soporte (ideal para integración y márgenes). */
export function BarComparisonPlot({
  groups,
  unit = 'kV',
  caption,
}: {
  groups: { label: string; stress: number; withstand: number; stressLabel?: string; withstandLabel?: string }[];
  unit?: string;
  caption?: string;
}) {
  const W = 600;
  const H = 265;
  const m = { l: 62, r: 22, t: 26, b: 46 };
  const iw = W - m.l - m.r;
  const ih = H - m.t - m.b;
  const maxV = Math.max(100, ...groups.flatMap((g) => [g.stress, g.withstand])) * 1.18;
  const sy = (v: number) => m.t + ih - (v / maxV) * ih;
  const step = Math.ceil(maxV / 5 / 100) * 100;
  const yTicks: number[] = [];
  for (let v = 0; v <= maxV; v += step) yTicks.push(v);

  return (
    <figure className="plot">
      <div className="plot-legend">
        <span className="plot-legend-item">
          <i style={{ borderTopColor: '#D6362C', borderTopWidth: 6 }} aria-hidden="true" />
          Esfuerzo exigido / aplicado
        </span>
        <span className="plot-legend-item">
          <i style={{ borderTopColor: '#0D8A59', borderTopWidth: 6 }} aria-hidden="true" />
          Capacidad soportada instalada
        </span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Comparación de esfuerzo frente a capacidad soportada">
        <rect x={m.l} y={m.t} width={iw} height={ih} rx={4} fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="1.1" />
        {yTicks.map((v) => (
          <g key={v}>
            <line x1={m.l} y1={sy(v)} x2={W - m.r} y2={sy(v)} stroke="rgba(78, 99, 120, 0.11)" />
            <text x={m.l - 8} y={sy(v) + 3} fontSize="9.8" fill="#52667A" textAnchor="end" fontFamily="ui-monospace, monospace">
              {fmt(v, 0)}
            </text>
          </g>
        ))}

        {groups.map((g, i) => {
          const slotW = iw / groups.length;
          const cx = m.l + slotW * (i + 0.5);
          const bw = Math.min(44, slotW * 0.28);
          const ok = g.withstand >= g.stress;
          const yS = sy(g.stress);
          const yW = sy(g.withstand);
          const base = m.t + ih;
          return (
            <g key={g.label}>
              <rect x={cx - bw - 4} y={yS} width={bw} height={Math.max(2, base - yS)} rx={4} fill="#E05249" />
              <text x={cx - bw / 2 - 4} y={yS - 6} fontSize="9.8" fontWeight="700" fill="#B42318" textAnchor="middle" fontFamily="ui-monospace, monospace">
                {fmt(g.stress, 0)}
              </text>

              <rect x={cx + 4} y={yW} width={bw} height={Math.max(2, base - yW)} rx={4} fill={ok ? '#129A66' : '#D97706'} />
              <text x={cx + bw / 2 + 4} y={yW - 6} fontSize="9.8" fontWeight="700" fill={ok ? '#0A6E47' : '#B45309'} textAnchor="middle" fontFamily="ui-monospace, monospace">
                {fmt(g.withstand, 0)}
              </text>

              <text x={cx} y={base + 17} fontSize="10.8" fontWeight="600" fill="#1E3248" textAnchor="middle">
                {g.label}
              </text>
              <text x={cx} y={base + 32} fontSize="9.8" fontWeight="700" fill={ok ? '#0D8A59' : '#D6362C'} textAnchor="middle">
                {ok ? `✓ Cumple (+${fmt(g.withstand - g.stress, 0)} ${unit})` : `✕ Faltan ${fmt(g.stress - g.withstand, 0)} ${unit}`}
              </text>
            </g>
          );
        })}

        <text x={14} y={m.t + ih / 2} fontSize="11" fontWeight="600" fill="#33475B" textAnchor="middle" transform={`rotate(-90 14 ${m.t + ih / 2})`}>
          {`Tensión de cresta (${unit})`}
        </text>
      </svg>
      {caption && <figcaption className="plot-caption">{caption}</figcaption>}
    </figure>
  );
}
