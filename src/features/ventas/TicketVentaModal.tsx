import { useRef, useState } from 'react';
import { compartirImagenDeElemento, compartirTexto } from '../../shared/utils/compartir';
import { generarPdfTicket, generarTextoTicket, type DetalleTicket } from './ticket';

interface TicketVentaModalProps {
  detalle: DetalleTicket;
  onCerrar: () => void;
}

export function TicketVentaModal({ detalle, onCerrar }: TicketVentaModalProps) {
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const ticketRef = useRef<HTMLPreElement>(null);

  function handleDescargarPdf() {
    const doc = generarPdfTicket(detalle);
    doc.save(`ticket-${detalle.ventaId.slice(0, 8)}.pdf`);
  }

  async function handleCompartirTexto() {
    setMensaje(null);
    const resultado = await compartirTexto(generarTextoTicket(detalle), 'Papelería André — Ticket de venta');
    if (resultado === 'copiado') setMensaje('Ticket copiado — pégalo donde quieras enviarlo.');
    else if (resultado === 'error') setMensaje('No se pudo compartir ni copiar el ticket.');
  }

  async function handleCompartirImagen() {
    if (!ticketRef.current) return;
    setMensaje(null);
    setProcesando(true);
    try {
      const resultado = await compartirImagenDeElemento(
        ticketRef.current,
        `ticket-${detalle.ventaId.slice(0, 8)}.png`,
        'Papelería André — Ticket de venta',
      );
      if (resultado === 'descargado') setMensaje('Imagen descargada.');
      else if (resultado === 'error') setMensaje('No se pudo generar la imagen del ticket.');
    } finally {
      setProcesando(false);
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

        <pre
          ref={ticketRef}
          className="whitespace-pre-wrap rounded-xl border border-dashed border-gray-300 bg-white p-3 font-mono text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
        >
          {generarTextoTicket(detalle)}
        </pre>

        {mensaje && (
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            {mensaje}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => void handleCompartirTexto()}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            💬 Texto
          </button>
          <button
            type="button"
            onClick={() => void handleCompartirImagen()}
            disabled={procesando}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            🖼️ Imagen
          </button>
        </div>

        <button
          type="button"
          onClick={handleDescargarPdf}
          className="mt-2 w-full rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
        >
          📄 Descargar PDF
        </button>

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
