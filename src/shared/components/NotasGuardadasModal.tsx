import type { ReactNode } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BorradorBase } from '../hooks/useBorradores';

interface NotasGuardadasModalProps<T extends BorradorBase> {
  titulo: string;
  borradores: T[];
  renderResumen: (borrador: T) => ReactNode;
  onRetomar: (borrador: T) => void;
  onEliminar: (id: string) => void;
  onCerrar: () => void;
}

export function NotasGuardadasModal<T extends BorradorBase>({
  titulo,
  borradores,
  renderResumen,
  onRetomar,
  onEliminar,
  onCerrar,
}: NotasGuardadasModalProps<T>) {
  function handleEliminar(borrador: T) {
    if (confirm(`¿Desechar la nota "${borrador.nombre}"? No se puede deshacer.`)) {
      onEliminar(borrador.id);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="max-h-[85svh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl dark:bg-gray-900 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        {borradores.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aún no tienes notas guardadas en este dispositivo.
          </p>
        ) : (
          <ul className="space-y-2">
            {borradores.map((borrador) => (
              <li key={borrador.id} className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 flex-1 truncate text-sm font-medium text-gray-900 dark:text-gray-50">
                    {borrador.nombre}
                  </p>
                  <span className="shrink-0 text-[10px] text-gray-400 dark:text-gray-500">
                    {format(borrador.actualizadoEn, "d MMM, HH:mm", { locale: es })}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{renderResumen(borrador)}</p>
                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleEliminar(borrador)}
                    className="flex-1 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-950"
                  >
                    Desechar
                  </button>
                  <button
                    onClick={() => onRetomar(borrador)}
                    className="flex-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                  >
                    Retomar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
