import { useMemo, useState } from 'react';
import type { Cliente } from '../../domain/entities/Cliente';
import { useClientes } from '../../application/clientes/useClientes';
import { useAbonos } from '../../application/clientes/useAbonos';
import { useVentas } from '../../application/ventas/useVentas';
import { saldoPendienteCliente } from '../../application/clientes/saldo';
import { totalCompradoCliente } from '../../application/clientes/estadisticas';
import { container } from '../../infrastructure/container';
import { ClienteFormModal } from './ClienteFormModal';
import { ClienteDetalleModal } from './ClienteDetalleModal';

export function ClientesPage() {
  const { clientes, cargando } = useClientes();
  const { ventas } = useVentas();
  const { abonos } = useAbonos();
  const [busqueda, setBusqueda] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteEnEdicion, setClienteEnEdicion] = useState<Cliente | null>(null);

  const clientesConSaldo = useMemo(
    () =>
      clientes.map((cliente) => ({
        cliente,
        saldo: saldoPendienteCliente(cliente.id, ventas, abonos),
        totalComprado: totalCompradoCliente(cliente.id, ventas),
      })),
    [clientes, ventas, abonos],
  );

  const filtrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return clientesConSaldo;
    return clientesConSaldo.filter(
      ({ cliente }) =>
        cliente.nombre.toLowerCase().includes(termino) || cliente.telefono?.includes(termino),
    );
  }, [clientesConSaldo, busqueda]);

  const totalPorCobrar = useMemo(
    () => clientesConSaldo.reduce((acc, { saldo }) => acc + Math.max(0, saldo), 0),
    [clientesConSaldo],
  );

  async function handleEliminar(cliente: Cliente, saldo: number) {
    if (saldo > 0) {
      alert(`No puedes eliminar a ${cliente.nombre} porque tiene un saldo pendiente de $${saldo.toFixed(2)}.`);
      return;
    }
    if (!confirm(`¿Eliminar a "${cliente.nombre}"?`)) return;
    await container.clienteRepository.eliminar(cliente.id);
  }

  return (
    <div>
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Clientes</h1>
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Total por cobrar: <span className="font-semibold text-red-600 dark:text-red-400">${totalPorCobrar.toFixed(2)}</span>
            </p>
          </div>
          <button
            onClick={() => {
              setClienteEnEdicion(null);
              setMostrarFormulario(true);
            }}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            + Nuevo
          </button>
        </div>

        <input
          type="text"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o teléfono…"
          className="mt-4 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
        />
      </div>

      <div className="space-y-2 p-4 md:p-6">
        {cargando && <p className="text-sm text-gray-500 dark:text-gray-400">Cargando clientes…</p>}
        {!cargando && filtrados.length === 0 && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {clientes.length === 0 ? 'Aún no hay clientes registrados.' : 'No se encontraron clientes.'}
          </p>
        )}

        {filtrados.map(({ cliente, saldo, totalComprado }) => (
          <div
            key={cliente.id}
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
          >
            <button
              onClick={() => setClienteSeleccionado(cliente)}
              className="flex min-w-0 flex-1 items-center justify-between gap-2 text-left"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{cliente.nombre}</p>
                <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                  {cliente.telefono ? `${cliente.telefono} · ` : ''}
                  Compras: ${totalComprado.toFixed(2)}
                </p>
              </div>
              {saldo > 0 && (
                <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950 dark:text-red-400">
                  Debe ${saldo.toFixed(2)}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setClienteEnEdicion(cliente);
                setMostrarFormulario(true);
              }}
              className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
              aria-label="Editar cliente"
              title="Editar cliente"
            >
              ✏️
            </button>
            <button
              onClick={() => void handleEliminar(cliente, saldo)}
              className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950"
              aria-label="Eliminar cliente"
              title="Eliminar cliente"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {mostrarFormulario && (
        <ClienteFormModal
          cliente={clienteEnEdicion}
          onCerrar={() => setMostrarFormulario(false)}
          onGuardado={() => setMostrarFormulario(false)}
        />
      )}

      {clienteSeleccionado && (
        <ClienteDetalleModal
          cliente={clienteSeleccionado}
          ventas={ventas}
          abonos={abonos}
          onCerrar={() => setClienteSeleccionado(null)}
          onEditar={() => {
            setClienteEnEdicion(clienteSeleccionado);
            setClienteSeleccionado(null);
            setMostrarFormulario(true);
          }}
        />
      )}
    </div>
  );
}
