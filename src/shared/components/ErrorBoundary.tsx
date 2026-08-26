import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Sin esto, cualquier error de render deja la pantalla en blanco sin forma de
 * recuperarse (React desmonta todo el árbol). Con el boundary, al menos se ve
 * un mensaje con opción de recargar en vez de un blanco total.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error('Error no controlado en la app:', error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="pagina-fondo flex min-h-svh flex-col items-center justify-center gap-4 bg-gray-50 px-6 text-center dark:bg-gray-950">
        <div className="text-4xl">😕</div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Algo salió mal</h1>
          <p className="mt-1 max-w-sm text-sm text-gray-500 dark:text-gray-400">
            La pantalla tuvo un error inesperado. Tus datos están a salvo — recarga para continuar.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          Recargar
        </button>
      </div>
    );
  }
}
