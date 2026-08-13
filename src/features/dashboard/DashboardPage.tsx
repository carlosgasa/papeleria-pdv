import { useMemo } from 'react';
import { startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import { tieneStockBajo } from '../../domain/entities/Producto';
import { useProductos } from '../../application/inventario/useProductos';
import { useVentas } from '../../application/ventas/useVentas';
import { useClientes } from '../../application/clientes/useClientes';
import { useAbonos } from '../../application/clientes/useAbonos';
import { saldoPendienteCliente } from '../../application/clientes/saldo';
import { topClientes } from '../../application/clientes/estadisticas';
import { useOcultarSaldos } from '../../application/dashboard/useOcultarSaldos';
import { gananciaAcumulada, resumenPeriodo, topProductos, ventasPorDia } from './estadisticas';
import { VentasChart } from './VentasChart';
import { InversionesPanel } from './InversionesPanel';
import { ReportesPanel } from './ReportesPanel';

function TarjetaKpi({ etiqueta, valor, submuestra }: { etiqueta: string; valor: string; submuestra?: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <p className="text-xs text-gray-500 dark:text-gray-400">{etiqueta}</p>
      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50">{valor}</p>
      {submuestra && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{submuestra}</p>}
    </div>
  );
}

export function DashboardPage() {
  const { ventas, cargando: cargandoVentas } = useVentas();
  const { productos, cargando: cargandoProductos } = useProductos();
  const { clientes } = useClientes();
  const { abonos } = useAbonos();
  const { ocultarSaldos, alternar } = useOcultarSaldos();

  function monto(valor: number): string {
    return ocultarSaldos ? '•••••' : `$${valor.toFixed(2)}`;
  }

  const hoy = useMemo(() => resumenPeriodo(ventas, startOfDay(Date.now()).getTime()), [ventas]);
  const semana = useMemo(
    () => resumenPeriodo(ventas, startOfWeek(Date.now(), { weekStartsOn: 1 }).getTime()),
    [ventas],
  );
  const mes = useMemo(() => resumenPeriodo(ventas, startOfMonth(Date.now()).getTime()), [ventas]);
  const chart = useMemo(() => ventasPorDia(ventas, 14), [ventas]);
  const top = useMemo(() => topProductos(ventas, 5), [ventas]);
  const mejoresClientes = useMemo(() => topClientes(ventas, clientes, 5), [ventas, clientes]);
  const ganancia = useMemo(() => gananciaAcumulada(ventas), [ventas]);
  const productosStockBajo = useMemo(() => productos.filter(tieneStockBajo), [productos]);
  const porCobrar = useMemo(
    () =>
      clientes.reduce((acc, cliente) => acc + Math.max(0, saldoPendienteCliente(cliente.id, ventas, abonos)), 0),
    [clientes, ventas, abonos],
  );

  const cargando = cargandoVentas || cargandoProductos;

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Inicio</h1>
        <button
          onClick={alternar}
          className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          {ocultarSaldos ? '🙈 Mostrar saldos' : '👁️ Ocultar saldos'}
        </button>
      </div>

      {cargando ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Cargando…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <TarjetaKpi etiqueta="Ventas de hoy" valor={monto(hoy.totalVentas)} submuestra={`${hoy.cantidadVentas} ventas`} />
            <TarjetaKpi etiqueta="Ventas de la semana" valor={monto(semana.totalVentas)} submuestra={`${semana.cantidadVentas} ventas`} />
            <TarjetaKpi etiqueta="Ventas del mes" valor={monto(mes.totalVentas)} submuestra={`${mes.cantidadVentas} ventas`} />
            <TarjetaKpi etiqueta="Ticket promedio (mes)" valor={monto(mes.ticketPromedio)} />
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <TarjetaKpi etiqueta="Ganancia de hoy" valor={monto(hoy.ganancia)} />
            <TarjetaKpi etiqueta="Ganancia del mes" valor={monto(mes.ganancia)} />
            <TarjetaKpi etiqueta="Ganancia acumulada" valor={monto(ganancia)} />
            <TarjetaKpi etiqueta="Por cobrar (fiado)" valor={monto(porCobrar)} />
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-4">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 lg:col-span-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Ventas (últimos 14 días)</h2>
              <div className="mt-2">
                <VentasChart datos={chart} ocultarSaldos={ocultarSaldos} />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Top productos</h2>
              {top.length === 0 ? (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Aún no hay ventas registradas.</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {top.map((producto, indice) => (
                    <li key={producto.nombre} className="flex items-center justify-between text-sm">
                      <span className="truncate text-gray-700 dark:text-gray-300">
                        {indice + 1}. {producto.nombre}
                      </span>
                      <span className="shrink-0 font-semibold text-gray-900 dark:text-gray-50">
                        {producto.cantidad}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Top clientes</h2>
              {mejoresClientes.length === 0 ? (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Aún no hay ventas ligadas a un cliente.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {mejoresClientes.map((cliente, indice) => (
                    <li key={cliente.clienteId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="min-w-0 truncate text-gray-700 dark:text-gray-300">
                        {indice + 1}. {cliente.nombre}
                      </span>
                      <span className="shrink-0 font-semibold text-gray-900 dark:text-gray-50">
                        {monto(cliente.totalComprado)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Alertas de stock bajo</h2>
              {productosStockBajo.length === 0 ? (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Todos los productos tienen stock suficiente.
                </p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {productosStockBajo.map((producto) => (
                    <li key={producto.id} className="flex items-center justify-between text-sm">
                      <span className="truncate text-gray-700 dark:text-gray-300">{producto.nombre}</span>
                      <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">
                        {producto.stock} / mín. {producto.stockMinimo}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <InversionesPanel gananciaAcumulada={ganancia} ocultarSaldos={ocultarSaldos} />

            <ReportesPanel ventas={ventas} />
          </div>
        </>
      )}
    </div>
  );
}
