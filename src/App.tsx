import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TOPICS } from './content/topics';
import { experimentNeighbors, getExperiment, TOTAL_EXPERIMENTS } from './experiments';
import {
  exportProgress,
  importProgress,
  loadProgress,
  rankFor,
  resetProgress,
  saveProgress,
  starsFor,
  type Progress,
} from './lib/storage';
import { CatalogView } from './components/CatalogView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ExperimentView } from './components/ExperimentView';
import { GlossaryView } from './components/GlossaryView';
import { Home } from './components/Home';
import { BrandEmblem } from './components/Icons';
import { PracticeView } from './components/PracticeView';
import { Btn } from './components/ui';
import { SourcesView } from './components/SourcesView';
import { TopicView } from './components/TopicView';

type Route =
  | { name: 'home' }
  | { name: 'tema'; id: number }
  | { name: 'exp'; id: string }
  | { name: 'catalogo' }
  | { name: 'glosario' }
  | { name: 'practica' }
  | { name: 'fuentes' };

function parseHash(): Route {
  const h = decodeURIComponent(window.location.hash.replace(/^#\/?/, ''));
  if (h.startsWith('tema/')) return { name: 'tema', id: Number(h.slice(5)) || 1 };
  if (h.startsWith('exp/')) return { name: 'exp', id: h.slice(4) };
  if (h === 'catalogo') return { name: 'catalogo' };
  if (h === 'glosario') return { name: 'glosario' };
  if (h === 'practica') return { name: 'practica' };
  if (h === 'fuentes') return { name: 'fuentes' };
  return { name: 'home' };
}

function scrollTop() {
  try {
    window.scrollTo(0, 0);
  } catch {
    /* jsdom o navegador sin scroll */
  }
}

export function App() {
  const [route, setRoute] = useState<Route>(() => parseHash());
  const [progress, setProgress] = useState<Progress>(() => loadProgress().progress);
  const [notice, setNotice] = useState<string | null>(null);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  const recovered = useMemo(() => loadProgress().recovered, []);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      scrollTop();
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  useEffect(() => {
    if (recovered) setNotice('Se recuperó el progreso desde la copia de seguridad local.');
  }, [recovered]);

  const update = useCallback((next: Progress) => {
    progressRef.current = next;
    setProgress(next);
    saveProgress(next);
  }, []);

  const markVisit = useCallback(
    (id: string) => {
      const cur = progressRef.current;
      if (cur.visits.includes(id)) return;
      update({ ...cur, visits: [...cur.visits, id], xp: cur.xp + 5 });
    },
    [update],
  );

  const solve = useCallback(
    (expId: string, attempts: number, hint: boolean) => {
      const cur = progressRef.current;
      const prev = cur.solved[expId];
      const stars = starsFor(attempts, hint);
      if (prev && prev.stars >= stars) {
        update({ ...cur, solved: { ...cur.solved, [expId]: { ...prev, attempts } } });
        return prev.stars;
      }
      const gained = prev ? 0 : 20;
      update({
        ...cur,
        xp: cur.xp + gained,
        solved: { ...cur.solved, [expId]: { stars, attempts, hint, at: Date.now() } },
      });
      return stars;
    },
    [update],
  );

  const saveQuiz = useCallback(
    (expId: string, optionId: string) => {
      const cur = progressRef.current;
      update({ ...cur, quiz: { ...cur.quiz, [expId]: optionId } });
    },
    [update],
  );

  const go = (hash: string) => {
    if (window.location.hash === hash) setRoute(parseHash());
    else window.location.hash = hash;
    scrollTop();
  };

  const downloadProgress = () => {
    const text = exportProgress(progressRef.current);
    try {
      const blob = new Blob([text], { type: 'application/json' });
      const url =
        typeof URL.createObjectURL === 'function'
          ? URL.createObjectURL(blob)
          : `data:application/json;charset=utf-8,${encodeURIComponent(text)}`;
      const a = document.createElement('a');
      a.href = url;
      a.download = 'aislalab-progreso.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (url.startsWith('blob:') && typeof URL.revokeObjectURL === 'function') URL.revokeObjectURL(url);
    } catch {
      setNotice('El navegador bloqueó la descarga; copia el JSON desde la consola si necesitas respaldo.');
    }
  };

  const rank = rankFor(progress.xp);
  const solvedCount = Object.keys(progress.solved).length;
  const starsTotal = Object.values(progress.solved).reduce((acc, s) => acc + (s.stars || 0), 0);
  const navActive = (name: Route['name']) =>
    route.name === name || (name === 'catalogo' && route.name === 'exp') || (name === 'home' && route.name === 'tema');

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="brand" onClick={() => go('#/')} aria-label="Ir al inicio de AislaLab">
          <BrandEmblem size={30} />
          <span className="brand-text">
            <strong>AislaLab</strong>
            <small>línea 245 kV · edición exposición</small>
          </span>
        </button>

        <nav className="topnav" aria-label="Navegación principal">
          <button type="button" className={navActive('home') ? 'active' : ''} onClick={() => go('#/')}>
            Inicio
          </button>
          <button type="button" className={navActive('catalogo') ? 'active' : ''} onClick={() => go('#/catalogo')}>
            Catálogo
          </button>
          <button type="button" className={navActive('glosario') ? 'active' : ''} onClick={() => go('#/glosario')}>
            Glosario
          </button>
          <button type="button" className={navActive('practica') ? 'active' : ''} onClick={() => go('#/practica')}>
            Simulacro
          </button>
          <button type="button" className={navActive('fuentes') ? 'active' : ''} onClick={() => go('#/fuentes')}>
            Fuentes
          </button>
        </nav>

        <div className="rank-box" title={`${solvedCount} de ${TOTAL_EXPERIMENTS} retos resueltos · ${starsTotal} estrellas`}>
          <div className="rank-text">
            <span>{rank.name}</span>
            <span className="mono">{progress.xp} XP · {solvedCount}/{TOTAL_EXPERIMENTS}</span>
          </div>
          <div className="rank-bar">
            <span style={{ width: `${rank.pct}%` }} />
          </div>
        </div>
      </header>

      {notice && (
        <div className="notice" role="status">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} aria-label="Cerrar aviso">
            ×
          </button>
        </div>
      )}

      <main id="contenido">
        <ErrorBoundary>
          {route.name === 'home' && (
            <Home
              progress={progress}
              onTopic={(id) => go(`#/tema/${id}`)}
              onExp={(id) => go(`#/exp/${id}`)}
              onPractice={() => go('#/practica')}
              onSources={() => go('#/fuentes')}
              onCatalog={() => go('#/catalogo')}
              onGlossary={() => go('#/glosario')}
              onExport={downloadProgress}
              onImport={(text) => {
                const p = importProgress(text);
                if (p) {
                  update(p);
                  setNotice('Progreso importado correctamente.');
                } else {
                  setNotice('El archivo no contiene un progreso válido de AislaLab.');
                }
              }}
              onReset={() => {
                update(resetProgress());
                setNotice('Progreso reiniciado.');
              }}
            />
          )}

          {route.name === 'catalogo' && (
            <CatalogView
              progress={progress}
              onOpenExperiment={(id) => go(`#/exp/${id}`)}
              onOpenTopic={(id) => go(`#/tema/${id}`)}
            />
          )}

          {route.name === 'glosario' && (
            <GlossaryView
              onOpenExperiment={(id) => go(`#/exp/${id}`)}
              onNavigateCatalog={() => go('#/catalogo')}
            />
          )}

          {route.name === 'tema' && (
            <TopicView
              topicId={route.id}
              progress={progress}
              onNavigateHome={() => go('#/')}
              onOpenTopic={(id) => go(`#/tema/${id}`)}
              onOpenExperiment={(id) => go(`#/exp/${id}`)}
              onNavigateCatalog={() => go('#/catalogo')}
            />
          )}

          {route.name === 'exp' &&
            (() => {
              const exp = getExperiment(route.id);
              if (!exp) {
                return (
                  <div className="page empty-state">
                    <h1>No encontramos ese simulador</h1>
                    <p>El identificador «{route.id}» no está en el catálogo de 18 bancos.</p>
                    <Btn tone="primary" onClick={() => go('#/catalogo')}>
                      Volver al catálogo
                    </Btn>
                  </div>
                );
              }
              const topic = TOPICS.find((t) => t.id === exp.topicId) ?? TOPICS[1];
              const { prev, next } = experimentNeighbors(exp.id);
              return (
                <ExperimentView
                  key={exp.id}
                  exp={exp}
                  topic={topic}
                  solved={progress.solved[exp.id]}
                  quizAnswer={progress.quiz[exp.id]}
                  prev={prev}
                  next={next}
                  onVisit={() => markVisit(exp.id)}
                  onSolve={(attempts, hintOpen) => solve(exp.id, attempts, hintOpen)}
                  onQuiz={(optionId) => saveQuiz(exp.id, optionId)}
                  onHome={() => go('#/')}
                  onCatalog={() => go('#/catalogo')}
                  onBack={() => go(`#/tema/${exp.topicId}`)}
                  onPrev={() => go(prev ? `#/exp/${prev.id}` : '#/')}
                  onNext={() => go(next ? `#/exp/${next.id}` : '#/practica')}
                />
              );
            })()}

          {route.name === 'practica' && (
            <PracticeView
              progress={progress}
              onExp={(id) => go(`#/exp/${id}`)}
              onFinish={(score, total) => setNotice(`Simulacro calificado: ${score}/${total} respuestas correctas.`)}
            />
          )}

          {route.name === 'fuentes' && <SourcesView onNavigateHome={() => go('#/')} />}
        </ErrorBoundary>
      </main>

      <footer className="app-footer">
        <p>
          <strong>AislaLab v4.0.0 · edición exposición</strong> · 11 temas, 18 simuladores, 8 diagnósticos y 2 fuentes (las dos exposiciones del curso). Las cifras son modelos didácticos: no reemplazan normas, catálogos ni estudios de diseño.
        </p>
        <p className="mono">React + canvas + SVG · progreso local, sin servidor · sin recursos externos</p>
      </footer>
    </div>
  );
}
