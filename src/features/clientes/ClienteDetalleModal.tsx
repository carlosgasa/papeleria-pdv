import { useMemo, useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Cliente } from '../../domain/entities/Cliente';
import type { MetodoPago, Venta } from '../../domain/entities/Venta';
import type { Abono } from '../../domain/entities/Abono';
import { useAuth } from '../../application/auth/useAuth';
import { saldoPendienteCliente, totalAbonadoCliente } from '../../application/clientes/saldo';
import { container } from '../../infrastructure/container';

interface ClienteDetalleModalProps {
  cliente: Cliente;
  ventas: Venta[];
  abonos: Abono[];
  onCerrar: () => void;
  onEditar: () => void;
}

interface MovimientoCuenta {
  id: string;
  fecha: number;
  tipo: 'compra' | 'abono';
  metodoPago?: MetodoPago;
  anulada?: boolean;
  monto: number;
  detalle: string;
}

const ETIQUETA_METODO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  fiado: 'Fiado',
};

export function ClienteDetalleModal({ cliente, ventas, abonos, onCerrar, onEditar }: ClienteDetalleModalProps) {
  const { usuario } = useAuth();
  const [montoAbono, setMontoAbono] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ventasCliente = useMemo(() => ventas.filter((v) => v.clienteId === cliente.id), [ventas, cliente.id]);
  const abonosCliente = useMemo(() => abonos.filter((a) => a.clienteId === cliente.id), [abonos, cliente.id]);

  const totalComprado = useMemo(
    () => ventasCliente.filter((v) => !v.anulada).reduce((acc, v) => acc + v.total, 0),
    [ventasCliente],
  );
  const saldo = useMemo(() => saldoPendienteCliente(cliente.id, ventas, abonos), [cliente.id, ventas, abonos]);
  const totalAbonado = useMemo(() => totalAbonadoCliente(cliente.id, abonos), [cliente.id, abonos]);

  const movimientos = useMemo<MovimientoCuenta[]>(() => {
    const compras: MovimientoCuenta[] = ventasCliente.map((v) => ({
      id: v.id,
      fecha: v.fecha,
      tipo: 'compra',
      metodoPago: v.metodoPago,
      anulada: v.anulada,
      monto: v.total,
      detalle: v.items.map((item) => `${item.cantidad}x ${item.nombre}`).join(', '),
    }));
    const pagos: MovimientoCuenta[] = abonosCliente.map((a) => ({
      id: a.id,
      fecha: a.fecha,
      tipo: 'abono',
      monto: a.monto,
      detalle: 'Abono a cuenta',
    }));
    return [...compras, ...pagos].sort((a, b) => b.fecha - a.fecha);
  }, [ventasCliente, abonosCliente]);

  async function handleRegistrarAbono(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!usuario) return;
    const monto = Number(montoAbono);
    if (!Number.isFinite(monto) || monto <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await container.abonoRepository.registrar({ clienteId: cliente.id, monto, usuarioId: usuario.id });
      setMontoAbono('');
    } catch {
      setError('No se pudo registrar el abono.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="max-h-[90svh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl dark:bg-gray-900 sm:rounded-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">{cliente.nombre}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onEditar}
              className="rounded-lg px-2 py-1 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              ✏️ Editar
            </button>
            <button
              onClick={onCerrar}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              aria-label="Cerrar"
            >
              ✕
            </button>
          </div>
        </div>
        {cliente.telefono && <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">{cliente.telefono}</p>}

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Total comprado</p>
            <p className="text-xl font-bold text-gray-900 dark:text-gray-50">${totalComprado.toFixed(2)}</p>
          </div>
          <div className="rounded-xl border border-gray-200 p-3 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400">Saldo pendiente</p>
            <p
              className={`text-xl font-bold ${saldo > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}
            >
              ${saldo.toFixed(2)}
            </p>
          </div>
        </div>
        {totalAbonado > 0 && (
          <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
            Abonado hasta ahora: ${totalAbonado.toFixed(2)}
          </p>
        )}

        <form onSubmit={handleRegistrarAbono} className="mt-3 flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="Monto del abono"
            value={montoAbono}
            onChange={(e) => setMontoAbono(e.target.value)}
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
          />
          <button
            type="submit"
            disabled={guardando}
            className="shrink-0 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            Abonar
          </button>
        </form>

        {error && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
            {error}
          </p>
        )}

        <h3 className="mt-4 text-xs font-semibold uppercase text-gray-400 dark:text-gray-500">Historial</h3>
        <div className="mt-2 space-y-1.5">
          {movimientos.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">Sin movimientos todavía.</p>
          )}
          {movimientos.map((mov) => (
            <div key={`${mov.tipo}-${mov.id}`} className="flex items-center justify-between gap-2 text-sm">
              <div className="min-w-0">
                <p className="truncate text-gray-700 dark:text-gray-300">
                  {mov.tipo === 'abono'
                    ? '💵 Abono'
                    : `🧾 ${mov.metodoPago ? ETIQUETA_METODO[mov.metodoPago] : 'Compra'}${mov.anulada ? ' (anulada)' : ''}`}{' '}
                  · {mov.detalle}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {format(mov.fecha, "d MMM yyyy, HH:mm", { locale: es })}
                </p>
              </div>
              <span
                className={`shrink-0 font-semibold ${
                  mov.tipo === 'abono'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : mov.anulada
                      ? 'text-gray-400 line-through dark:text-gray-600'
                      : 'text-gray-900 dark:text-gray-50'
                }`}
              >
                {mov.tipo === 'abono' ? '−' : '+'}${mov.monto.toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
