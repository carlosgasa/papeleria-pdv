import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMovimientosStock } from '../../application/inventario/useMovimientosStock';
import type { TipoMovimientoStock } from '../../domain/entities/MovimientoStock';

const ETIQUETA_TIPO: Record<TipoMovimientoStock, { texto: string; icono: string; clase: string }> = {
  entrada: {
    texto: 'Entrada',
    icono: '⬆️',
    clase: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  salida: { texto: 'Salida', icono: '⬇️', clase: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400' },
  venta: { texto: 'Venta', icono: '🛒', clase: 'bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300' },
  anulacion: {
    texto: 'Anulación',
    icono: '↩️',
    clase: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  },
};

export function MovimientosStockTab() {
  const { movimientos, cargando } = useMovimientosStock();
  const [filtro, setFiltro] = useState<TipoMovimientoStock | 'todos'>('todos');

  const movimientosFiltrados = useMemo(
    () => (filtro === 'todos' ? movimientos : movimientos.filter((m) => m.tipo === filtro)),
    [movimientos, filtro],
  );

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-wrap gap-1.5">
        {(['todos', 'entrada', 'salida', 'venta', 'anulacion'] as const).map((opcion) => (
          <button
            key={opcion}
            onClick={() => setFiltro(opcion)}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
              filtro === opcion
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
            }`}
          >
            {opcion}
          </button>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 items-start gap-2 md:grid-cols-2">
        {cargando && <p className="col-span-full text-sm text-gray-500 dark:text-gray-400">Cargando…</p>}
        {!cargando && movimientosFiltrados.length === 0 && (
          <p className="col-span-full text-sm text-gray-500 dark:text-gray-400">No hay movimientos registrados.</p>
        )}

        {movimientosFiltrados.map((mov) => {
          const info = ETIQUETA_TIPO[mov.tipo];
          const esPositivo = mov.tipo === 'entrada' || mov.tipo === 'anulacion';
          return (
            <div
              key={mov.id}
              className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{mov.productoNombre}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {format(mov.fecha, "d MMM yyyy, HH:mm", { locale: es })}
                  {mov.motivo ? ` · ${mov.motivo}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${info.clase}`}>
                  {info.icono} {info.texto}
                </span>
                <span
                  className={`text-sm font-semibold ${esPositivo ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
                >
                  {esPositivo ? '+' : '−'}
                  {mov.cantidad}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
