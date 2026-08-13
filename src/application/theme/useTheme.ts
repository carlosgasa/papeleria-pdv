import { useContext } from 'react';
import { ThemeContext } from './ThemeContext';

export function useTheme() {
  const contexto = useContext(ThemeContext);
  if (!contexto) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return contexto;
}
