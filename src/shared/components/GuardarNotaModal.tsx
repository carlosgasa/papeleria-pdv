import { useState, type FormEvent } from 'react';

interface GuardarNotaModalProps {
  titulo: string;
  sugerido: string;
  onGuardar: (nombre: string) => void;
  onCerrar: () => void;
}

export function GuardarNotaModal({ titulo, sugerido, onGuardar, onCerrar }: GuardarNotaModalProps) {
  const [nombre, setNombre] = useState(sugerido);

  function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    onGuardar(nombre.trim() || sugerido);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl dark:bg-gray-900 sm:rounded-2xl">
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

        <form onSubmit={handleSubmit}>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Nombre de la nota
          </label>
          <input
            autoFocus
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder={sugerido}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
          />
          <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500">
            Se guarda solo en este dispositivo — no se descuenta del inventario ni se registra como venta hasta que
            la cobres.
          </p>
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            Guardar nota
          </button>
        </form>
      </div>
    </div>
  );
}
