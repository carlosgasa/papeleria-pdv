import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Producto } from '../../domain/entities/Producto';
import type { ItemVenta } from '../../domain/entities/Venta';
import { calcularSubtotal } from '../../domain/entities/Venta';
import { useAuth } from '../../application/auth/useAuth';
import { useProductos } from '../../application/inventario/useProductos';
import { useClientes } from '../../application/clientes/useClientes';
import { useCarrito } from '../../application/ventas/useCarrito';
import { container } from '../../infrastructure/container';
import { BarcodeScanner } from '../../shared/components/BarcodeScanner';
import { ConfirmarCobroModal, type DatosCobro } from './ConfirmarCobroModal';
import { TicketVentaModal } from './TicketVentaModal';
import type { DetalleTicket } from './ticket';
import { HistorialVentas } from './HistorialVentas';
import { emojiDeCategoria } from '../../shared/utils/categoriaEmoji';
import { useBorradores, type BorradorBase } from '../../shared/hooks/useBorradores';
import { GuardarNotaModal } from '../../shared/components/GuardarNotaModal';
import { NotasGuardadasModal } from '../../shared/components/NotasGuardadasModal';
import { CampoNumerico } from '../../shared/components/CampoNumerico';

type Pestana = 'vender' | 'historial';

interface BorradorVenta extends BorradorBase {
  items: ItemVenta[];
}

const CLAVE_BORRADORES_VENTA = 'papeleria-pos:borradores-venta';

interface ContenidoCarritoProps {
  carrito: ReturnType<typeof useCarrito>;
  productosPorId: Map<string, Producto>;
  onCobrar: () => void;
  onGuardarNota: () => void;
  ocultarTitulo?: boolean;
}

function ContenidoCarrito({
  carrito,
  productosPorId,
  onCobrar,
  onGuardarNota,
  ocultarTitulo = false,
}: ContenidoCarritoProps) {
  return (
    <>
      {!ocultarTitulo && <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Carrito</h2>}

      {carrito.error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-950 dark:text-red-400">
          {carrito.error}
        </p>
      )}

      {carrito.items.length === 0 ? (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Busca o escanea un producto para agregarlo.</p>
      ) : (
        <ul className="mt-3 max-h-[40svh] space-y-2 overflow-y-auto md:max-h-none">
          {carrito.items.map((item) => {
            const stockDisponible = productosPorId.get(item.productoId)?.stock ?? item.cantidad;
            return (
              <li key={item.productoId} className="flex items-center gap-2 text-sm">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900 dark:text-gray-50">{item.nombre}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">${item.precioUnitario.toFixed(2)} c/u</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => carrito.cambiarCantidad(item.productoId, item.cantidad - 1, stockDisponible)}
                    className="h-6 w-6 rounded-full border border-gray-300 text-xs dark:border-gray-700"
                  >
                    −
                  </button>
                  <CampoNumerico
                    min={1}
                    max={stockDisponible}
                    value={item.cantidad}
                    onChange={(valor) => carrito.cambiarCantidad(item.productoId, valor, stockDisponible)}
                    className="w-10 rounded border border-gray-300 bg-white text-center text-xs dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <button
                    onClick={() => carrito.cambiarCantidad(item.productoId, item.cantidad + 1, stockDisponible)}
                    className="h-6 w-6 rounded-full border border-gray-300 text-xs dark:border-gray-700"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => carrito.quitar(item.productoId)}
                  className="text-gray-400 hover:text-red-500"
                  aria-label="Quitar"
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-800">
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total</span>
        <span className="text-lg font-bold text-gray-900 dark:text-gray-50">${carrito.total.toFixed(2)}</span>
      </div>

      <div className="mt-3 flex gap-2">
        <button
          onClick={onGuardarNota}
          disabled={carrito.items.length === 0}
          title="Guardar como nota para retomarla después"
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          🗒️ Nota
        </button>
        <button
          onClick={onCobrar}
          disabled={carrito.items.length === 0}
          className="flex-1 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-40"
        >
          Cobrar
        </button>
      </div>
      {carrito.items.length > 0 && (
        <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
          💡 Tip: con el carrito lleno, presiona Enter (sin estar escribiendo en un campo) para cobrar rápido.
        </p>
      )}
    </>
  );
}

export function VentasPage() {
  const { usuario } = useAuth();
  const { productos } = useProductos();
  const { clientes } = useClientes();
  const carrito = useCarrito();
  const [pestana, setPestana] = useState<Pestana>('vender');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [mostrarCobro, setMostrarCobro] = useState(false);
  const [mostrarCarritoMovil, setMostrarCarritoMovil] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [errorCobro, setErrorCobro] = useState<string | null>(null);
  const [avisoScanner, setAvisoScanner] = useState<string | null>(null);
  const [ventaCompletada, setVentaCompletada] = useState<DetalleTicket | null>(null);
  const [mostrarGuardarNota, setMostrarGuardarNota] = useState(false);
  const [mostrarNotas, setMostrarNotas] = useState(false);
  const [notaActivaId, setNotaActivaId] = useState<string | null>(null);
  const inputBusquedaRef = useRef<HTMLInputElement>(null);

  const { borradores: notas, guardar: guardarNotaVenta, eliminar: eliminarNota } =
    useBorradores<BorradorVenta>(CLAVE_BORRADORES_VENTA);

  const productosPorId = useMemo(() => new Map(productos.map((p) => [p.id, p])), [productos]);

  const resultados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return productos;
    return productos
      .filter(
        (producto) =>
          producto.nombre.toLowerCase().includes(termino) || producto.codigoBarras?.includes(termino),
      )
      .slice(0, 8);
  }, [productos, busqueda]);

  function handleCodigoEscaneado(codigo: string) {
    setMostrarScanner(false);
    const producto = productos.find((p) => p.codigoBarras === codigo);
    if (!producto) {
      setAvisoScanner(`No se encontró ningún producto con el código ${codigo}.`);
      return;
    }
    setAvisoScanner(null);
    carrito.agregarProducto(producto);
  }

  function handleBusquedaKeyDown(evento: KeyboardEvent<HTMLInputElement>) {
    if (evento.key !== 'Enter') return;
    const termino = busqueda.trim();
    if (!termino) return;

    const porCodigoExacto = productos.find((p) => p.codigoBarras === termino);
    const candidato = porCodigoExacto ?? (resultados.length === 1 ? resultados[0] : null);

    if (!candidato) {
      setAvisoScanner(`No se encontró ningún producto que coincida con "${termino}".`);
      return;
    }
    if (candidato.stock === 0) {
      setAvisoScanner(`"${candidato.nombre}" está agotado.`);
      return;
    }
    setAvisoScanner(null);
    carrito.agregarProducto(candidato);
    setBusqueda('');
  }

  function abrirCobro() {
    setMostrarCarritoMovil(false);
    setMostrarCobro(true);
  }

  function abrirGuardarNota() {
    setMostrarCarritoMovil(false);
    setMostrarGuardarNota(true);
  }

  function handleGuardarNota(nombre: string) {
    guardarNotaVenta(nombre, { items: carrito.items });
    carrito.limpiar();
    setNotaActivaId(null);
    setMostrarGuardarNota(false);
  }

  function handleRetomarNota(nota: BorradorVenta) {
    if (carrito.items.length > 0 && !confirm('Esto reemplazará lo que tienes ahora en el carrito. ¿Continuar?')) {
      return;
    }
    carrito.cargar(nota.items);
    setNotaActivaId(nota.id);
    setMostrarNotas(false);
    setMostrarCarritoMovil(false);
  }

  // Modo caja rápida: con el foco fuera de cualquier campo de texto, Enter abre el cobro.
  useEffect(() => {
    if (pestana !== 'vender' || mostrarCobro || mostrarScanner) return;

    function handleKeyDown(evento: globalThis.KeyboardEvent) {
      if (evento.key !== 'Enter') return;
      const activo = document.activeElement;
      const enCampoDeTexto = activo instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activo.tagName);
      if (enCampoDeTexto || carrito.items.length === 0) return;
      abrirCobro();
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pestana, mostrarCobro, mostrarScanner, carrito.items.length]);

  useEffect(() => {
    if (pestana === 'vender' && !mostrarCobro && !mostrarScanner) {
      inputBusquedaRef.current?.focus();
    }
  }, [pestana, mostrarCobro, mostrarScanner]);

  async function handleConfirmarCobro(datos: DatosCobro) {
    if (!usuario || carrito.items.length === 0) return;
    setProcesando(true);
    setErrorCobro(null);
    try {
      const subtotal = carrito.total;
      const total = subtotal - datos.descuento;
      const items = carrito.items;

      const ventaId = await container.ventaRepository.registrarVenta({
        items,
        total,
        descuento: datos.descuento,
        metodoPago: datos.metodoPago,
        clienteId: datos.clienteId,
        usuarioId: usuario.id,
        fecha: Date.now(),
      });

      const clienteNombre = datos.clienteId
        ? (clientes.find((c) => c.id === datos.clienteId)?.nombre ?? null)
        : null;
      const cambio = datos.montoRecibido !== null ? datos.montoRecibido - total : null;

      setVentaCompletada({
        ventaId,
        fecha: Date.now(),
        items,
        subtotal,
        descuento: datos.descuento,
        total,
        metodoPago: datos.metodoPago,
        montoRecibido: datos.montoRecibido,
        cambio,
        clienteNombre,
      });

      carrito.limpiar();
      setMostrarCobro(false);
      if (notaActivaId) {
        eliminarNota(notaActivaId);
        setNotaActivaId(null);
      }
    } catch (err) {
      setErrorCobro(err instanceof Error ? err.message : 'No se pudo registrar la venta.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 bg-white px-4 pt-4 dark:border-gray-800 dark:bg-gray-900 md:px-6">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Ventas</h1>
        </div>
        <div className="mt-3 flex gap-1">
          <button
            onClick={() => setPestana('vender')}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
              pestana === 'vender'
                ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Vender
          </button>
          <button
            onClick={() => setPestana('historial')}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
              pestana === 'historial'
                ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Historial
          </button>
        </div>
      </div>

      {pestana === 'historial' ? (
        <div className="flex-1 overflow-y-auto">
          <HistorialVentas />
        </div>
      ) : (
        <div className="flex flex-1 flex-col md:flex-row md:overflow-hidden">
          <div
            className={`p-4 md:flex-1 md:overflow-y-auto md:p-6 ${
              carrito.items.length > 0 ? 'pb-24 md:pb-6' : ''
            }`}
          >
            <div className="flex gap-2">
              <input
                ref={inputBusquedaRef}
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={handleBusquedaKeyDown}
                placeholder="Buscar o escanea con lector (Enter agrega)…"
                className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
              />
              <button
                onClick={() => setMostrarScanner(true)}
                className="shrink-0 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:text-gray-200"
                aria-label="Escanear código"
              >
                📷
              </button>
              <button
                onClick={() => setMostrarNotas(true)}
                className="shrink-0 rounded-lg border border-gray-300 px-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300"
                title="Notas guardadas"
              >
                🗒️{notas.length > 0 ? ` ${notas.length}` : ''}
              </button>
            </div>

            {avisoScanner && (
              <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                {avisoScanner}
              </p>
            )}

            <p className="mt-3 text-xs font-medium text-gray-500 dark:text-gray-400">
              {busqueda.trim() ? 'Resultados' : 'Productos disponibles'}
            </p>

            <div className="mt-2 space-y-2">
              {resultados.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {productos.length === 0 ? 'Aún no hay productos en el inventario.' : 'No se encontraron productos.'}
                </p>
              )}
              {resultados.map((producto) => (
                <button
                  key={producto.id}
                  onClick={() => carrito.agregarProducto(producto)}
                  disabled={producto.stock === 0}
                  className="flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left transition hover:border-brand-300 disabled:opacity-50 dark:border-gray-800 dark:bg-gray-900"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg dark:bg-gray-800">
                    {emojiDeCategoria(producto.categoria)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">
                      {producto.nombre}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Stock: {producto.stock === 0 ? 'agotado' : producto.stock}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-gray-900 dark:text-gray-50">
                    ${producto.precioVenta.toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* En escritorio el carrito es un panel lateral siempre visible. En móvil se
              muestra como barra compacta fija + hoja completa (más abajo), para no
              obligar a hacer scroll por todo el inventario para llegar a él. */}
          <div className="hidden border-t border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:block md:w-80 md:border-l md:border-t-0 md:p-6">
            <ContenidoCarrito
              carrito={carrito}
              productosPorId={productosPorId}
              onCobrar={abrirCobro}
              onGuardarNota={abrirGuardarNota}
            />
          </div>
        </div>
      )}

      {pestana === 'vender' && carrito.items.length > 0 && (
        <button
          onClick={() => setMostrarCarritoMovil(true)}
          className="fixed inset-x-0 bottom-16 z-20 flex items-center justify-between gap-3 border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] dark:border-gray-800 dark:bg-gray-900 md:hidden"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
            🛒 {carrito.items.reduce((acc, i) => acc + i.cantidad, 0)} artículo
            {carrito.items.reduce((acc, i) => acc + i.cantidad, 0) === 1 ? '' : 's'} · Ver carrito
          </span>
          <span className="text-base font-bold text-gray-900 dark:text-gray-50">${carrito.total.toFixed(2)}</span>
        </button>
      )}

      {mostrarCarritoMovil && (
        <div className="fixed inset-0 z-30 flex items-end bg-black/50 md:hidden" onClick={() => setMostrarCarritoMovil(false)}>
          <div
            className="max-h-[80svh] w-full overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-1 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Carrito</h2>
              <button
                onClick={() => setMostrarCarritoMovil(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>
            <ContenidoCarrito
              carrito={carrito}
              productosPorId={productosPorId}
              onCobrar={abrirCobro}
              onGuardarNota={abrirGuardarNota}
              ocultarTitulo
            />
          </div>
        </div>
      )}

      {mostrarScanner && (
        <BarcodeScanner
          titulo="Escanear producto"
          onDetectado={handleCodigoEscaneado}
          onCerrar={() => setMostrarScanner(false)}
        />
      )}

      {mostrarCobro && (
        <ConfirmarCobroModal
          subtotal={carrito.total}
          procesando={procesando}
          error={errorCobro}
          onConfirmar={(datos) => void handleConfirmarCobro(datos)}
          onCerrar={() => setMostrarCobro(false)}
        />
      )}

      {ventaCompletada && (
        <TicketVentaModal detalle={ventaCompletada} onCerrar={() => setVentaCompletada(null)} />
      )}

      {mostrarGuardarNota && (
        <GuardarNotaModal
          titulo="Guardar venta como nota"
          sugerido={`Venta ${format(Date.now(), 'd MMM, HH:mm', { locale: es })}`}
          onGuardar={handleGuardarNota}
          onCerrar={() => setMostrarGuardarNota(false)}
        />
      )}

      {mostrarNotas && (
        <NotasGuardadasModal
          titulo="Notas de venta guardadas"
          borradores={notas}
          renderResumen={(nota) => {
            const cantidadArticulos = nota.items.reduce((acc, i) => acc + i.cantidad, 0);
            return `${cantidadArticulos} artículo${cantidadArticulos === 1 ? '' : 's'} · $${calcularSubtotal(nota.items).toFixed(2)}`;
          }}
          onRetomar={handleRetomarNota}
          onEliminar={eliminarNota}
          onCerrar={() => setMostrarNotas(false)}
        />
      )}
    </div>
  );
}
