import { useState, type FormEvent } from 'react';
import type { Producto } from '../../domain/entities/Producto';
import { useAuth } from '../../application/auth/useAuth';
import { container } from '../../infrastructure/container';

interface AjusteStockModalProps {
  producto: Producto;
  onCerrar: () => void;
  onGuardado: () => void;
}

const MOTIVOS_SUGERIDOS = ['Compra a proveedor', 'Merma / dañado', 'Uso interno', 'Corrección de inventario'];

export function AjusteStockModal({ producto, onCerrar, onGuardado }: AjusteStockModalProps) {
  const { usuario } = useAuth();
  const [tipo, setTipo] = useState<'entrada' | 'salida'>('entrada');
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cantidadNum = Number(cantidad);
  const stockResultante = Number.isFinite(cantidadNum)
    ? tipo === 'entrada'
      ? producto.stock + cantidadNum
      : producto.stock - cantidadNum
    : producto.stock;

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!usuario) return;

    if (!Number.isFinite(cantidadNum) || cantidadNum <= 0) {
      setError('Ingresa una cantidad válida.');
      return;
    }

    setGuardando(true);
    setError(null);
    try {
      await container.movimientoStockRepository.registrarAjuste({
        productoId: producto.id,
        tipo,
        cantidad: cantidadNum,
        motivo: motivo || null,
        usuarioId: usuario.id,
      });
      onGuardado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el movimiento.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl dark:bg-gray-900 sm:rounded-2xl">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Ajustar stock</h2>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>
        <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
          {producto.nombre} · stock actual: {producto.stock}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTipo('entrada')}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                tipo === 'entrada'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              ⬆️ Entrada
            </button>
            <button
              type="button"
              onClick={() => setTipo('salida')}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                tipo === 'salida'
                  ? 'border-red-500 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300'
                  : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              ⬇️ Salida
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Cantidad</label>
            <input
              type="number"
              min="1"
              step="1"
              required
              value={cantidad}
              onChange={(e) => setCantidad(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo (opcional)</label>
            <input
              type="text"
              list="motivos-sugeridos"
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Compra a proveedor"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
            />
            <datalist id="motivos-sugeridos">
              {MOTIVOS_SUGERIDOS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300">
            Stock resultante: <span className="font-semibold">{stockResultante}</span>
          </p>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : 'Registrar movimiento'}
          </button>
        </form>
      </div>
    </div>
  );
}
