import { AppRouter } from './routes/AppRouter';
import { PwaUpdateToast } from './shared/components/PwaUpdateToast';
import { ThemeProvider } from './application/theme/ThemeContext';

export function App() {
  return (
    <ThemeProvider>
      <AppRouter />
      <PwaUpdateToast />
    </ThemeProvider>
  );
}
