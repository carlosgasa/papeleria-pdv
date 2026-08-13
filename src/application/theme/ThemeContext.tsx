import { createContext, useEffect, useState, type ReactNode } from 'react';

export type Tema = 'claro' | 'oscuro' | 'pastel';

const CLAVE_ALMACENAMIENTO = 'papeleria-pos:tema';

interface ThemeContextValue {
  tema: Tema;
  cambiarTema: (tema: Tema) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function leerTemaInicial(): Tema {
  const guardado = localStorage.getItem(CLAVE_ALMACENAMIENTO);
  if (guardado === 'claro' || guardado === 'oscuro' || guardado === 'pastel') return guardado;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
}

function aplicarTema(tema: Tema) {
  const raiz = document.documentElement;
  raiz.classList.toggle('dark', tema === 'oscuro');
  if (tema === 'pastel') {
    raiz.setAttribute('data-theme', 'pastel');
  } else {
    raiz.removeAttribute('data-theme');
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(leerTemaInicial);

  useEffect(() => {
    aplicarTema(tema);
    localStorage.setItem(CLAVE_ALMACENAMIENTO, tema);
  }, [tema]);

  return <ThemeContext.Provider value={{ tema, cambiarTema: setTema }}>{children}</ThemeContext.Provider>;
}
