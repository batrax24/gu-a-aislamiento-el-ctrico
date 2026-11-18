import { useState, type KeyboardEvent } from 'react';
import { LINE_HOTSPOTS, type LineHotspot } from '../content/lineMap';
import { stageForTopic, TOPICS } from '../content/topics';
import { EXPERIMENT_BY_ID } from '../experiments';
import { Btn, Chip } from './ui';

const TONE: Record<LineHotspot['tone'], string> = {
  surge: '#6D3CE8',
  guard: '#C97A08',
  phase: '#0B63CE',
  porcelain: '#0F8578',
  copper: '#B55D19',
  ok: '#0D8A59',
};

/** Panorama físico interactivo: de la nube de tormenta hasta el transformador protegido. */
export function LineMap({
  onOpenTopic,
  onOpenExperiment,
}: {
  onOpenTopic: (topicId: number) => void;
  onOpenExperiment: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState('rayo');
  const selected = LINE_HOTSPOTS.find((h) => h.id === selectedId) ?? LINE_HOTSPOTS[0];
  const topic = TOPICS.find((t) => t.id === selected.topicId);
  const stage = stageForTopic(selected.topicId);

  const activate = (id: string) => setSelectedId(id);
  const onKey = (ev: KeyboardEvent<SVGGElement>, id: string) => {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      activate(id);
    }
  };

  return (
    <section className="line-map" aria-labelledby="line-map-title">
      <div className="section-head">
        <div>
          <span className="eyebrow">Mapa físico de la línea</span>
          <h2 id="line-map-title">Toca una parte real de la instalación</h2>
          <p>
            La coordinación de aislamiento ocurre en objetos concretos: una nube, un cable de guarda, discos de porcelana,
            varillas enterradas y un transformador. Explora los 10 puntos numerados.
          </p>
        </div>
        <Chip tone="accent">10 puntos interactivos</Chip>
      </div>

      <div className="line-map-stage">
        <svg className="line-map-svg" viewBox="0 0 1000 400" role="img" aria-label="Panorama de una línea de transmisión desde una tormenta hasta una subestación">
          <defs>
            <linearGradient id="lm-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CFE4FA" />
              <stop offset="60%" stopColor="#EAF3FC" />
              <stop offset="100%" stopColor="#F7FAFD" />
            </linearGradient>
            <linearGradient id="lm-soil" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#A8764C" />
              <stop offset="100%" stopColor="#6F4B2F" />
            </linearGradient>
            <linearGradient id="lm-steel" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#7B8FA3" />
              <stop offset="100%" stopColor="#4E6378" />
            </linearGradient>
          </defs>

          {/* Cielo, cordillera y suelo */}
          <rect x="0" y="0" width="1000" height="326" fill="url(#lm-sky)" />
          <path d="M0 300 L120 220 L220 270 L360 190 L500 260 L640 205 L800 255 L1000 215 L1000 326 L0 326 Z" fill="#D4E2EF" />
          <path d="M0 326 L170 280 L300 305 L460 250 L610 292 L760 265 L1000 300 L1000 400 L0 400 Z" fill="url(#lm-soil)" />
          <path d="M0 326 L170 280 L300 305 L460 250 L610 292 L760 265 L1000 300" fill="none" stroke="#6DA35F" strokeWidth="5" />

          {/* Nube de tormenta */}
          <g>
            <ellipse cx="150" cy="62" rx="68" ry="30" fill="#425B77" />
            <ellipse cx="112" cy="70" rx="40" ry="24" fill="#516B88" />
            <ellipse cx="190" cy="73" rx="44" ry="22" fill="#3C536E" />
            <path d="M164 84 L150 126 L172 120 L156 160 L196 106 L174 110 L190 84 Z" fill="#B694FF" stroke="#6D3CE8" strokeWidth="2" />
            <text x="150" y="30" textAnchor="middle" fontSize="13" fontWeight="700" fill="#33475B">
              TORMENTA
            </text>
          </g>

          {/* Torres de celosía */}
          {[270, 520].map((x, idx) => (
            <g key={x}>
              <path d={`M${x - 42} 326 L${x - 14} 150 L${x} 112 L${x + 14} 150 L${x + 42} 326 Z`} fill="none" stroke="url(#lm-steel)" strokeWidth="3" />
              <path d={`M${x - 42} 326 L${x + 42} 326 M${x - 32} 260 L${x + 32} 260 M${x - 22} 205 L${x + 22} 205 M${x - 14} 150 L${x + 14} 150`} stroke="#7B8FA3" strokeWidth="2" />
              <path d={`M${x - 42} 326 L${x + 32} 260 M${x + 42} 326 L${x - 32} 260 M${x - 32} 260 L${x + 22} 205 M${x + 32} 260 L${x - 22} 205`} stroke="#9FB4C7" strokeWidth="1.4" />
              <line x1={x - 74} y1="176" x2={x + 74} y2="176" stroke="#5C7288" strokeWidth="4" />
              <line x1={x - 58} y1="222" x2={x + 58} y2="222" stroke="#5C7288" strokeWidth="3" />
              <rect x={x - 48} y="322" width="12" height="8" fill="#9BA8B4" />
              <rect x={x + 36} y="322" width="12" height="8" fill="#9BA8B4" />
              <text x={x} y="346" textAnchor="middle" fontSize="11" fontWeight="700" fill="#F4F6F8">
                {idx === 0 ? 'TORRE 1' : 'TORRE 2'}
              </text>
            </g>
          ))}

          {/* Cables: guarda arriba, fases abajo */}
          <path d="M0 118 Q135 105 270 112 T520 112 T690 128" fill="none" stroke="#C97A08" strokeWidth="2.5" />
          <path d="M0 196 Q135 182 270 190 T520 190 T690 204" fill="none" stroke="#0B63CE" strokeWidth="2.8" />
          <path d="M0 240 Q135 226 270 234 T520 234 T690 246" fill="none" stroke="#0B63CE" strokeWidth="2.8" />

          {/* Cadenas de aisladores */}
          {[196, 444].map((x) => (
            <g key={x}>
              <line x1={x} y1="176" x2={x} y2="190" stroke="#4E6378" strokeWidth="2" />
              {[0, 1, 2, 3, 4].map((i) => (
                <ellipse key={i} cx={x} cy={180 + i * 4} rx="10" ry="2.5" fill="#58D5C3" stroke="#0F8578" strokeWidth="1" />
              ))}
            </g>
          ))}

          {/* Viento y vano */}
          <g stroke="#8FB8E8" strokeWidth="2" fill="none" opacity="0.85">
            <path d="M350 210 q24 -10 48 0" />
            <path d="M365 222 q24 -10 48 0" />
            <path d="M380 234 q24 -10 48 0" />
          </g>
          <text x="398" y="198" fontSize="11" fontWeight="700" fill="#60758B" textAnchor="middle">
            VANO CON FLECHA
          </text>

          {/* Puesta a tierra */}
          <g stroke="#B55D19" strokeWidth="3" fill="none">
            <path d="M270 326 L270 368" />
            <path d="M270 356 L230 356 M270 362 L310 362" />
            <path d="M250 368 L290 368" />
          </g>

          {/* Efecto corona */}
          <g opacity="0.75">
            <circle cx="492" cy="190" r="12" fill="none" stroke="#6D3CE8" strokeWidth="2" strokeDasharray="3 3" />
            <circle cx="492" cy="190" r="19" fill="none" stroke="#B694FF" strokeWidth="1.5" strokeDasharray="2 4" />
          </g>

          {/* Subestación: pórtico, pararrayos y transformador */}
          <g>
            <line x1="690" y1="204" x2="690" y2="326" stroke="#4E6378" strokeWidth="5" />
            <line x1="690" y1="204" x2="790" y2="204" stroke="#0B63CE" strokeWidth="3" />
            <rect x="748" y="326" width="14" height="7" fill="#9BA8B4" />
            <rect x="868" y="326" width="14" height="7" fill="#9BA8B4" />
            {/* Pararrayos ZnO */}
            <line x1="762" y1="204" x2="762" y2="224" stroke="#4E6378" strokeWidth="2" />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x="750" y={226 + i * 14} width="24" height="10" rx="2" fill={i % 2 ? '#856F96' : '#6D5A7C'} stroke="#4A3A57" />
            ))}
            <line x1="762" y1="300" x2="762" y2="326" stroke="#B55D19" strokeWidth="2.4" />
            <path d="M748 326 H776 M754 332 H770 M759 338 H765" stroke="#B55D19" strokeWidth="2" />
            <text x="762" y="352" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#F4F6F8">
              ZnO
            </text>
            {/* Transformador */}
            <rect x="856" y="238" width="92" height="84" rx="6" fill="#D5DFE8" stroke="#4E6378" strokeWidth="2.5" />
            <rect x="872" y="228" width="42" height="10" rx="4" fill="#BAC8D6" stroke="#4E6378" />
            <line x1="884" y1="238" x2="884" y2="204" stroke="#0B63CE" strokeWidth="3" />
            {[0, 1, 2, 3].map((i) => (
              <line key={i} x1={873 + i * 18} y1="246" x2={873 + i * 18} y2="314" stroke="rgba(78,99,120,0.5)" strokeWidth="2" />
            ))}
            <text x="902" y="336" textAnchor="middle" fontSize="10.5" fontWeight="700" fill="#F4F6F8">
              TRANSFORMADOR
            </text>
            <text x="902" y="220" textAnchor="middle" fontSize="11" fontWeight="700" fill="#33475B">
              SUBESTACIÓN
            </text>
          </g>

          {/* Etiquetas de contexto */}
          <text x="92" y="182" fontSize="11" fontWeight="700" fill="#33475B">
            BOGOTÁ 2.640 m
          </text>
          <text x="92" y="198" fontSize="10" fill="#60758B">
            δ ≈ 0,74
          </text>

          {/* Hotspots numerados */}
          {LINE_HOTSPOTS.map((h) => {
            const active = h.id === selected.id;
            const col = TONE[h.tone];
            return (
              <g
                key={h.id}
                className={`hotspot ${active ? 'is-active' : ''}`}
                role="button"
                tabIndex={0}
                aria-label={`Punto ${h.num}: ${h.title}`}
                onClick={() => activate(h.id)}
                onKeyDown={(ev) => onKey(ev, h.id)}
              >
                <circle cx={h.x} cy={h.y} r={active ? 18 : 15} fill="#FFFFFF" stroke={col} strokeWidth={active ? 4 : 2.5} />
                <circle cx={h.x} cy={h.y} r={active ? 12 : 10} fill={col} />
                <text x={h.x} y={h.y + 4} textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFFFF">
                  {h.num}
                </text>
                <text
                  x={h.x}
                  y={h.y + 30}
                  textAnchor="middle"
                  fontSize="10.5"
                  fontWeight="700"
                  fill="#102033"
                  stroke="rgba(255,255,255,0.9)"
                  strokeWidth="3"
                  paintOrder="stroke"
                >
                  {h.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="hotspot-detail" style={{ borderTopColor: TONE[selected.tone] }}>
        <div className="hotspot-detail-head">
          <span className="hotspot-num" style={{ background: TONE[selected.tone] }}>
            {selected.num}
          </span>
          <div>
            <span className="eyebrow">
              {stage.title} · Tema {selected.topicId}
            </span>
            <h3>{selected.title}</h3>
          </div>
        </div>

        <div className="hotspot-columns">
          <div>
            <strong>¿Qué es físicamente?</strong>
            <p>{selected.whatIsIt}</p>
          </div>
          <div>
            <strong>¿Qué puede fallar?</strong>
            <p>{selected.whatCanGoWrong}</p>
          </div>
          <div>
            <strong>¿Cómo se resuelve?</strong>
            <p>{selected.howWeSolveIt}</p>
          </div>
        </div>

        <div className="hotspot-actions">
          <Btn tone="primary" onClick={() => onOpenTopic(selected.topicId)}>
            Abrir tema {selected.topicId}: {topic?.title ?? ''}
          </Btn>
          <div className="hotspot-exp-links">
            {selected.expIds.map((id) => {
              const exp = EXPERIMENT_BY_ID[id];
              if (!exp) return null;
              return (
                <button key={id} type="button" className="text-link" onClick={() => onOpenExperiment(id)}>
                  {id.toUpperCase()} · {exp.contextLabel}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
