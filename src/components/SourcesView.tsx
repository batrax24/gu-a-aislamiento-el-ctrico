import { ALL_SOURCES } from '../content/bibliography';
import { Btn, Chip } from './ui';

const CORRECTIONS = [
  ['Navegación', 'El botón «Siguiente» saltaba 7 simuladores al pasar de tema. AislaLab usa un orden secuencial de los 19.'],
  ['Ruta', 'La miga de pan del tema volvía siempre al Tema 1. Ahora vuelve al inicio.'],
  ['e02', 'El escenario de 500 kV (Uₘ = 550 kV) quedaba limitado por el slider en 420 kV; el rango llega a 550 kV.'],
  ['e05', 'La escena y la nota contradecían el cálculo sobre δ. Ahora U₀, U aplicada y el estado físico coinciden.'],
  ['e07', 'La torre bajaba al aumentar la altitud. Ahora sube por la ladera, con cota y moléculas de aire.'],
  ['e09', 'El CFO corregido se etiquetaba como «nivel del mar» y se dividía por δ dos veces. Se corrige una sola vez.'],
  ['e10', 'La cadena se alejaba de la torre con viento. Ahora se mece hacia el acero y d_h se reduce.'],
  ['e12', 'Faltaban arcos electrogeométricos a escala. Ahora se dibuja intercepción vs. falla de apantallamiento.'],
  ['e15', 'Z₂ mínimo era 5 Ω (impidía el cortocircuito 0 Ω) y se graficaba |Γ|. Ahora Γ conserva su signo.'],
  ['e18', 'Se comprobaba d.margin en vez de d.marginOk, se comparaba contra 1400 kV fijo y se dibujaban líneas inclinadas. Ahora usa p.cfo y barras esfuerzo vs. soporte.'],
  ['e19', 'La ecuación mostraba una exponencial y la gráfica usaba 0..5 en bruto. Ahora usa (1+t/τ)^−1,2 y MΩ en escala log con 30/60/600 s.'],
];

export function SourcesView({ onNavigateHome }: { onNavigateHome: () => void }) {
  return (
    <div className="page sources-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">Trazabilidad · {ALL_SOURCES.length} fuentes</span>
          <h1>De dónde salen los números y qué se corrigió</h1>
          <p>
            AislaLab edición exposición reorganiza el currículo en 11 temas centrados en la exposición (7 temas de la Expo 77 + fundamentos de sobretensiones), conserva los 19 simuladores y los 8 diagnósticos, y suma las dos exposiciones como fuentes principales (16 fuentes en total).
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
                {s.normative ? <Chip tone="accent">Norma IEC</Chip> : <Chip tone="neutral">Material del curso</Chip>}
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
        <h2>Bitácora de correcciones respecto a la versión 2</h2>
        <div className="corrections-table" role="table" aria-label="Correcciones de AislaLab">
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
