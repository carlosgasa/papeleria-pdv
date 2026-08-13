import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useInversiones } from '../../application/inversiones/useInversiones';
import { container } from '../../infrastructure/container';
import { NuevaInversionModal } from './NuevaInversionModal';

interface InversionesPanelProps {
  gananciaAcumulada: number;
  ocultarSaldos?: boolean;
}

export function InversionesPanel({ gananciaAcumulada, ocultarSaldos = false }: InversionesPanelProps) {
  const { inversiones, cargando } = useInversiones();
  const [mostrarModal, setMostrarModal] = useState(false);

  function monto(valor: number): string {
    return ocultarSaldos ? '•••••' : `$${valor.toFixed(2)}`;
  }

  const totalInvertido = useMemo(
    () => inversiones.reduce((acc, inversion) => acc + inversion.monto, 0),
    [inversiones],
  );

  const balance = gananciaAcumulada - totalInvertido;
  const proporcionInversion = totalInvertido + gananciaAcumulada > 0
    ? (totalInvertido / (totalInvertido + gananciaAcumulada)) * 100
    : 0;

  async function handleEliminar(id: string) {
    if (!confirm('¿Eliminar este registro de inversión?')) return;
    await container.inversionRepository.eliminar(id);
  }

  return (
    <div className="rounded-xl border border-t-4 border-gray-200 border-t-amber-500 bg-white p-4 dark:border-gray-800 dark:border-t-amber-500 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Inversiones y gastos</h2>
        <button
          onClick={() => setMostrarModal(true)}
          className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          + Agregar
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Invertido</p>
          <p className="text-lg font-bold text-gray-900 dark:text-gray-50">{monto(totalInvertido)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
          <p className={`text-lg font-bold ${balance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
            {monto(balance)}
          </p>
        </div>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className="h-full rounded-full bg-amber-500"
          style={{ width: `${Math.min(100, Math.max(0, proporcionInversion))}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Inversión vs. ganancia acumulada
      </p>

      <div className="mt-3 max-h-48 space-y-1.5 overflow-y-auto">
        {cargando && <p className="text-xs text-gray-500 dark:text-gray-400">Cargando…</p>}
        {!cargando && inversiones.length === 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400">Sin inversiones registradas.</p>
        )}
        {inversiones.map((inversion) => (
          <div key={inversion.id} className="flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <p className="truncate font-medium text-gray-800 dark:text-gray-200">{inversion.concepto}</p>
              <p className="text-gray-400 dark:text-gray-500">
                {inversion.categoria} · {format(inversion.fecha, 'd MMM yyyy', { locale: es })}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">{monto(inversion.monto)}</span>
              <button
                onClick={() => void handleEliminar(inversion.id)}
                className="text-gray-400 hover:text-red-500"
                aria-label="Eliminar"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {mostrarModal && (
        <NuevaInversionModal onCerrar={() => setMostrarModal(false)} onGuardado={() => setMostrarModal(false)} />
      )}
    </div>
  );
}
