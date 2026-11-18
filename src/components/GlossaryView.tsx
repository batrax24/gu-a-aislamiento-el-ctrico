import { useMemo, useState } from 'react';
import { GLOSSARY, GLOSSARY_GROUPS, type GlossaryGroup } from '../content/glossary';
import { EXPERIMENT_BY_ID } from '../experiments';
import { Btn, Chip } from './ui';

export function GlossaryView({
  onOpenExperiment,
  onNavigateCatalog,
}: {
  onOpenExperiment: (id: string) => void;
  onNavigateCatalog: () => void;
}) {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<'all' | GlossaryGroup>('all');

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY.filter((it) => {
      const hay = `${it.symbol} ${it.name} ${it.plain} ${it.example} ${it.unit}`.toLowerCase();
      return (!q || hay.includes(q)) && (group === 'all' || it.group === group);
    });
  }, [query, group]);

  return (
    <div className="page glossary-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Diccionario visual · {GLOSSARY.length} términos</span>
          <h1>Qué significa cada símbolo en la línea real</h1>
          <p>
            No es una lista de definiciones memorizadas: cada ficha dice dónde aparece el símbolo en la instalación, trae
            un ejemplo numérico y te lleva al simulador donde se puede mover.
          </p>
        </div>
        <Btn tone="soft" onClick={onNavigateCatalog}>
          Ver los 19 simuladores
        </Btn>
      </div>

      <div className="catalog-toolbar">
        <label className="field search-field">
          <span className="sr-only">Buscar término</span>
          <input
            type="search"
            value={query}
            placeholder="Buscar: Uₘ, δ, CFO, BIL, DAR, r_c…"
            onChange={(ev) => setQuery(ev.target.value)}
          />
        </label>
        <div className="filter-chips" role="group" aria-label="Filtrar por familia">
          <button type="button" className={`filter-chip ${group === 'all' ? 'active' : ''}`} onClick={() => setGroup('all')}>
            Todos
          </button>
          {GLOSSARY_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`filter-chip ${group === g.id ? 'active' : ''}`}
              onClick={() => setGroup(g.id)}
            >
              {g.label}
            </button>
          ))}
        </div>
        <Chip tone="accent">{items.length} fichas</Chip>
      </div>

      <div className="glossary-grid">
        {items.map((it) => {
          const exp = EXPERIMENT_BY_ID[it.expId];
          return (
            <article className="glossary-card" key={it.id}>
              <div className="glossary-symbol mono">{it.symbol}</div>
              <div className="glossary-body">
                <span className="eyebrow">{it.unit}</span>
                <h2>{it.name}</h2>
                <p className="glossary-plain">{it.plain}</p>
                <div className="glossary-example">
                  <strong>En la práctica:</strong> {it.example}
                </div>
                {exp && (
                  <button type="button" className="text-link" onClick={() => onOpenExperiment(it.expId)}>
                    Probar en {it.expId.toUpperCase()} · {exp.contextLabel}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
