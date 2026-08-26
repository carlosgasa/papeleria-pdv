import { AppRouter } from './routes/AppRouter';
import { PwaUpdateToast } from './shared/components/PwaUpdateToast';
import { ErrorBoundary } from './shared/components/ErrorBoundary';
import { ThemeProvider } from './application/theme/ThemeContext';

export function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AppRouter />
        <PwaUpdateToast />
      </ErrorBoundary>
    </ThemeProvider>
  );
}
