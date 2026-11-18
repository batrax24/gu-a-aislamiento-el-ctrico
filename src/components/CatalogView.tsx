import { useMemo, useState } from 'react';
import { STAGES, TOPICS, stageForTopic } from '../content/topics';
import { EXPERIMENTS } from '../experiments';
import type { Progress } from '../lib/storage';
import { TopicGlyph } from './Icons';
import { Chip, Stars } from './ui';

export function CatalogView({
  progress,
  onOpenExperiment,
  onOpenTopic,
}: {
  progress: Progress;
  onOpenExperiment: (id: string) => void;
  onOpenTopic: (topicId: number) => void;
}) {
  const [query, setQuery] = useState('');
  const [stage, setStage] = useState<'all' | (typeof STAGES)[number]['id']>('all');
  const [onlyPending, setOnlyPending] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXPERIMENTS.filter((e) => {
      const topic = TOPICS.find((t) => t.id === e.topicId);
      const haystack = `${e.id} ${e.title} ${e.contextLabel} ${e.tagline} ${e.why} ${topic?.title ?? ''}`.toLowerCase();
      const matchesQuery = !q || haystack.includes(q);
      const matchesStage = stage === 'all' || stageForTopic(e.topicId).id === stage;
      const solved = progress.solved[e.id];
      const matchesPending = !onlyPending || !solved;
      return matchesQuery && matchesStage && matchesPending;
    });
  }, [query, stage, onlyPending, progress.solved]);

  return (
    <div className="page catalog-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Catálogo visual · {EXPERIMENTS.length} simuladores</span>
          <h1>Elige el equipo o fenómeno que quieres probar</h1>
          <p>
            Cada tarjeta nombra un objeto real de la línea: una cadena de discos, un vendaval, una varilla enterrada o un
            pararrayos junto al transformador. Busca por palabra o filtra por etapa física.
          </p>
        </div>
        <Chip tone="accent">{filtered.length} resultados</Chip>
      </div>

      <div className="catalog-toolbar">
        <label className="field search-field">
          <span className="sr-only">Buscar simulador</span>
          <input
            type="search"
            value={query}
            placeholder="Buscar: viento, Bogotá, pararrayos, rayo, corona…"
            onChange={(ev) => setQuery(ev.target.value)}
          />
        </label>
        <div className="filter-chips" role="group" aria-label="Filtrar por etapa física">
          <button type="button" className={`filter-chip ${stage === 'all' ? 'active' : ''}`} onClick={() => setStage('all')}>
            Todas las etapas
          </button>
          {STAGES.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`filter-chip ${stage === s.id ? 'active' : ''}`}
              onClick={() => setStage(s.id)}
            >
              {s.step}. {s.title}
            </button>
          ))}
        </div>
        <label className="toggle-line">
          <input type="checkbox" checked={onlyPending} onChange={(ev) => setOnlyPending(ev.target.checked)} />
          Solo pendientes
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h2>No encontramos simuladores con ese filtro</h2>
          <p>Prueba otra palabra o vuelve a «Todas las etapas».</p>
        </div>
      ) : (
        <div className="catalog-grid">
          {filtered.map((e) => {
            const topic = TOPICS.find((t) => t.id === e.topicId);
            const st = stageForTopic(e.topicId);
            const solved = progress.solved[e.id];
            const n = EXPERIMENTS.findIndex((x) => x.id === e.id) + 1;
            return (
              <article className={`exp-card stage-${st.color}`} key={e.id}>
                <div className="exp-card-top">
                  <span className="exp-seq">{String(n).padStart(2, '0')}</span>
                  <span className="exp-glyph" aria-hidden="true">
                    {topic && <TopicGlyph icon={topic.icon} size={22} />}
                  </span>
                  <div className="exp-card-stars">
                    {solved ? <Stars n={solved.stars} /> : <span className="pending-dot" aria-label="Pendiente" />}
                  </div>
                </div>
                <span className="exp-context">{e.contextLabel}</span>
                <h2>{e.title}</h2>
                <p className="exp-tagline">{e.tagline}</p>
                <p className="exp-why">{e.why}</p>
                <div className="exp-card-meta">
                  <Chip tone="neutral">Tema {e.topicId}</Chip>
                  <button type="button" className="text-link" onClick={() => onOpenTopic(e.topicId)}>
                    {st.title}
                  </button>
                </div>
                <button type="button" className="exp-card-button" onClick={() => onOpenExperiment(e.id)}>
                  Abrir simulador <span aria-hidden="true">→</span>
                </button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
