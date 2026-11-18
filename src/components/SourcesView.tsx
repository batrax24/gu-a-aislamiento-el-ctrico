import { ALL_SOURCES } from '../content/bibliography';
import { Btn, Chip } from './ui';

const CORRECTIONS = [
  ['Fuentes', 'Toda la guía se reescribió usando las dos exposiciones del curso como única fuente de ejemplos, fórmulas y cifras. Se retiraron normas y bibliografía externa del texto de los simuladores.'],
  ['e04', 'El modelo estadístico del rayo usa las distribuciones de la lámina 25 (negativa Ī = 29,96 kA/σ_ln = 0,65; positiva 35,16/1,23) y la aproximación 1/(1 + (I/31)^2,6) de la lámina 26, en lugar de fórmulas ajenas al material.'],
  ['e05', 'La ruptura en gases se reconstruyó con los tres regímenes DC / AC / impulso y los retardos estadístico t_s y formativo t_f de las láminas 34–36, con la curva V–t cualitativa de la lámina 12.'],
  ['e11', 'La separación fase–fase conserva la expresión del curso D ≈ K·√(F + L) + Vₙ/150 (Expo 77, pp. 25–26) y se retiraron fórmulas externas.'],
  ['e16', 'El simulador se reconstruyó sobre el procedimiento IEC 71-1 de la lámina 17: NPR y NPM del descargador → K_i y K_m → BIL = K_i·NPR → BIL_n normalizado → BSL = K·BIL_n → K_b = BSL/NPM ≥ K_m.'],
  ['e18', 'El proyecto integral verifica cadena, altitud/δ, guarda, tierra y niveles IEC con los modelos de las dos exposiciones; los factores 1,25 / 1,15 / 20 % que las láminas no fijan se declaran como hipótesis adoptadas.'],
  ['e19', 'El simulador de medición de aislamiento (megóhmetro, DAR/PI) se eliminó: no aparece en ninguna de las dos exposiciones.'],
];


export function SourcesView({ onNavigateHome }: { onNavigateHome: () => void }) {
  return (
    <div className="page sources-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Trazabilidad · {ALL_SOURCES.length} fuentes</span>
          <h1>De dónde salen los números y qué cambió</h1>
          <p>
            AislaLab edición exposición reorganiza el currículo en 11 temas centrados en las dos exposiciones del curso (7 temas de la Expo 77 + fundamentos de sobretensiones), conserva 18 simuladores y 8 diagnósticos, y usa las dos exposiciones como única fuente de los ejemplos.
          </p>
        </div>
        <Btn tone="soft" onClick={onNavigateHome}>
          Volver al mapa
        </Btn>
      </div>

      <section className="sources-section">
        <h2>Bibliografía y normas</h2>
        <div className="sources-grid">
          {ALL_SOURCES.map((s, i) => (
            <article className="source-card" key={s.key}>
              <div className="source-top">
                <span className="source-num">{String(i + 1).padStart(2, '0')}</span>
                <Chip tone="neutral">Material del curso</Chip>
              </div>
              <h3>{s.short}</h3>
              <p className="source-title">{s.title}</p>
              <p className="source-author">{s.author}</p>
              <div className="source-meta">
                <span>{s.file}</span>
                <span>{s.pages}</span>
              </div>
              <p className="source-role">{s.role}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="sources-section">
        <h2>Bitácora de esta edición</h2>
        <div className="corrections-table" role="table" aria-label="Cambios de AislaLab">
          <div className="corrections-row corrections-head" role="row">
            <span role="columnheader">Origen</span>
            <span role="columnheader">Corrección aplicada</span>
          </div>
          {CORRECTIONS.map(([where, what]) => (
            <div className="corrections-row" role="row" key={where}>
              <strong role="cell">{where}</strong>
              <span role="cell">{what}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
