import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useVentas } from '../../application/ventas/useVentas';
import { container } from '../../infrastructure/container';

const ETIQUETA_METODO: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  fiado: 'Fiado',
};

export function HistorialVentas() {
  const { ventas, cargando } = useVentas();
  const [anulandoId, setAnulandoId] = useState<string | null>(null);

  async function handleAnular(ventaId: string) {
    if (!confirm('¿Anular esta venta? El stock de los productos se restituirá.')) return;
    setAnulandoId(ventaId);
    try {
      await container.ventaRepository.anularVenta(ventaId);
    } catch {
      alert('No se pudo anular la venta. Intenta de nuevo.');
    } finally {
      setAnulandoId(null);
    }
  }

  if (cargando) {
    return <p className="p-4 text-sm text-gray-500 dark:text-gray-400">Cargando historial…</p>;
  }

  if (ventas.length === 0) {
    return <p className="p-4 text-sm text-gray-500 dark:text-gray-400">Aún no hay ventas registradas.</p>;
  }

  return (
    <div className="space-y-2 p-4 md:p-6">
      {ventas.map((venta) => (
        <div
          key={venta.id}
          className={`rounded-xl border p-3 ${
            venta.anulada
              ? 'border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900'
              : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                ${venta.total.toFixed(2)}
                {venta.anulada && (
                  <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
                    Anulada
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {format(venta.fecha, "d 'de' MMM, HH:mm", { locale: es })} · {ETIQUETA_METODO[venta.metodoPago]}
              </p>
            </div>
            {!venta.anulada && (
              <button
                onClick={() => void handleAnular(venta.id)}
                disabled={anulandoId === venta.id}
                className="shrink-0 rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {anulandoId === venta.id ? 'Anulando…' : 'Anular'}
              </button>
            )}
          </div>

          <ul className="mt-2 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
            {venta.items.map((item) => (
              <li key={item.productoId}>
                {item.cantidad} × {item.nombre} — ${(item.cantidad * item.precioUnitario).toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
