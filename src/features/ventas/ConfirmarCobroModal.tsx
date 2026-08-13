import { useMemo, useState } from 'react';
import type { MetodoPago } from '../../domain/entities/Venta';
import { useClientes } from '../../application/clientes/useClientes';
import { container } from '../../infrastructure/container';

interface ConfirmarCobroModalProps {
  total: number;
  procesando: boolean;
  error: string | null;
  onConfirmar: (metodoPago: MetodoPago, clienteId: string | null) => void;
  onCerrar: () => void;
}

const METODOS: { valor: MetodoPago; etiqueta: string; icono: string }[] = [
  { valor: 'efectivo', etiqueta: 'Efectivo', icono: '💵' },
  { valor: 'tarjeta', etiqueta: 'Tarjeta', icono: '💳' },
  { valor: 'transferencia', etiqueta: 'Transferencia', icono: '🏦' },
  { valor: 'fiado', etiqueta: 'Fiado', icono: '📒' },
];

const BILLETES_RAPIDOS = [50, 100, 200, 500, 1000];
const CLIENTE_NUEVO = '__nuevo__';

export function ConfirmarCobroModal({
  total,
  procesando,
  error,
  onConfirmar,
  onCerrar,
}: ConfirmarCobroModalProps) {
  const { clientes } = useClientes();
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [nombreClienteNuevo, setNombreClienteNuevo] = useState('');
  const [creandoCliente, setCreandoCliente] = useState(false);
  const [errorCliente, setErrorCliente] = useState<string | null>(null);

  const cambio = useMemo(() => {
    const recibido = Number(montoRecibido);
    if (!montoRecibido.trim() || Number.isNaN(recibido) || recibido < 0) return null;
    return recibido - total;
  }, [montoRecibido, total]);

  async function handleConfirmar() {
    let clienteIdFinal: string | null = null;

    if (clienteId === CLIENTE_NUEVO) {
      if (!nombreClienteNuevo.trim()) {
        setErrorCliente('Escribe el nombre del cliente.');
        return;
      }
      setCreandoCliente(true);
      setErrorCliente(null);
      try {
        clienteIdFinal = await container.clienteRepository.crear({
          nombre: nombreClienteNuevo.trim(),
          telefono: null,
          notas: null,
        });
      } catch {
        setErrorCliente('No se pudo crear el cliente.');
        setCreandoCliente(false);
        return;
      }
      setCreandoCliente(false);
    } else if (clienteId) {
      clienteIdFinal = clienteId;
    }

    if (metodoPago === 'fiado' && !clienteIdFinal) {
      setErrorCliente('Selecciona o crea un cliente para la venta fiada.');
      return;
    }

    onConfirmar(metodoPago, clienteIdFinal);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl dark:bg-gray-900 sm:rounded-2xl">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Confirmar cobro</h2>
        <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-50">${total.toFixed(2)}</p>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {METODOS.map((metodo) => (
            <button
              key={metodo.valor}
              type="button"
              onClick={() => setMetodoPago(metodo.valor)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs font-medium transition ${
                metodoPago === metodo.valor
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                  : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              <span className="text-lg">{metodo.icono}</span>
              {metodo.etiqueta}
            </button>
          ))}
        </div>

        {metodoPago === 'efectivo' && (
          <div className="mt-4 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
              ¿Con cuánto te pagan? (opcional)
            </label>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={montoRecibido}
              onChange={(e) => setMontoRecibido(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
            />

            <div className="mt-2 flex flex-wrap gap-1.5">
              {BILLETES_RAPIDOS.map((billete) => (
                <button
                  key={billete}
                  type="button"
                  onClick={() => setMontoRecibido(String(billete))}
                  className="rounded-full border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  ${billete}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setMontoRecibido(String(total))}
                className="rounded-full border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Exacto
              </button>
            </div>

            {cambio !== null && (
              <p
                className={`mt-3 text-sm font-semibold ${
                  cambio >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {cambio >= 0 ? `Cambio a regresar: $${cambio.toFixed(2)}` : `Falta: $${Math.abs(cambio).toFixed(2)}`}
              </p>
            )}
          </div>
        )}

        <div className="mt-4 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Cliente {metodoPago === 'fiado' ? '(requerido)' : '(opcional)'}
          </label>
          <select
            value={clienteId}
            onChange={(e) => {
              setClienteId(e.target.value);
              setErrorCliente(null);
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Sin cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
            <option value={CLIENTE_NUEVO}>+ Nuevo cliente…</option>
          </select>

          {clienteId === CLIENTE_NUEVO && (
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={nombreClienteNuevo}
              onChange={(e) => setNombreClienteNuevo(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
            />
          )}

          {errorCliente && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errorCliente}</p>}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCerrar}
            disabled={procesando}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleConfirmar()}
            disabled={procesando || creandoCliente}
            className="flex-1 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {procesando || creandoCliente ? 'Procesando…' : 'Confirmar cobro'}
          </button>
        </div>
      </div>
    </div>
  );
}
