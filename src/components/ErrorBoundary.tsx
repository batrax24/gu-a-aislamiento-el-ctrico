import { Component, type ErrorInfo, type ReactNode } from 'react';

type State = { error: Error | null };

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // El registro queda en consola para diagnóstico sin exponer datos al usuario.
    console.error('AislaLab: error de renderizado', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary" role="alert">
          <div className="error-card">
            <span className="eyebrow">AislaLab</span>
            <h1>La pantalla se detuvo, pero tu avance está a salvo</h1>
            <p>
              Ocurrió un error al dibujar esta vista. El progreso se guarda automáticamente; recarga la página para
              continuar. Si vuelve a pasar, abre otro simulador desde el catálogo.
            </p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Recargar AislaLab
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
