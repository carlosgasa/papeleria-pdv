import { useState } from 'react';
import { generarPdfTicket, generarTextoTicket, type DetalleTicket } from './ticket';

interface TicketVentaModalProps {
  detalle: DetalleTicket;
  onCerrar: () => void;
}

export function TicketVentaModal({ detalle, onCerrar }: TicketVentaModalProps) {
  const [copiado, setCopiado] = useState(false);
  const [errorCompartir, setErrorCompartir] = useState<string | null>(null);

  function handleDescargarPdf() {
    const doc = generarPdfTicket(detalle);
    doc.save(`ticket-${detalle.ventaId.slice(0, 8)}.pdf`);
  }

  async function handleCompartir() {
    const texto = generarTextoTicket(detalle);
    setErrorCompartir(null);

    if (navigator.share) {
      try {
        await navigator.share({ text: texto, title: 'Papelería André — Ticket de venta' });
        return;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        // Si falla el share nativo, seguimos con el respaldo de copiar al portapapeles.
      }
    }

    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      setErrorCompartir('No se pudo compartir ni copiar el ticket.');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="max-h-[90svh] w-full max-w-sm overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl dark:bg-gray-900 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">✅ Venta registrada</h2>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <pre className="whitespace-pre-wrap rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 font-mono text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
          {generarTextoTicket(detalle)}
        </pre>

        {copiado && (
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            Ticket copiado — pégalo donde quieras enviarlo.
          </p>
        )}
        {errorCompartir && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-400">
            {errorCompartir}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void handleCompartir()}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            📤 Compartir / copiar
          </button>
          <button
            type="button"
            onClick={handleDescargarPdf}
            className="flex-1 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            📄 Descargar PDF
          </button>
        </div>

        <button
          type="button"
          onClick={onCerrar}
          className="mt-2 w-full rounded-lg px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
