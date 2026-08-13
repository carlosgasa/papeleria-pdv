import clsx from 'clsx';
import type { Tema } from '../../application/theme/ThemeContext';
import { useTheme } from '../../application/theme/useTheme';

const OPCIONES: { valor: Tema; icono: string; etiqueta: string }[] = [
  { valor: 'claro', icono: '☀️', etiqueta: 'Claro' },
  { valor: 'oscuro', icono: '🌙', etiqueta: 'Oscuro' },
  { valor: 'pastel', icono: '🍯', etiqueta: 'Pastel' },
];

export function ThemeToggle() {
  const { tema, cambiarTema } = useTheme();

  return (
    <div className="inline-flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-800 dark:bg-gray-800">
      {OPCIONES.map((opcion) => (
        <button
          key={opcion.valor}
          type="button"
          onClick={() => cambiarTema(opcion.valor)}
          title={opcion.etiqueta}
          aria-label={opcion.etiqueta}
          aria-pressed={tema === opcion.valor}
          className={clsx(
            'flex h-7 w-7 items-center justify-center rounded-md text-sm transition',
            tema === opcion.valor
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-50'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200',
          )}
        >
          {opcion.icono}
        </button>
      ))}
    </div>
  );
}
