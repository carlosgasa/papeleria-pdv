import { useMemo, useState } from 'react';
import clsx from 'clsx';
import type { Producto } from '../../domain/entities/Producto';
import { margenGanancia, tieneStockBajo } from '../../domain/entities/Producto';
import { useProductos } from '../../application/inventario/useProductos';
import { container } from '../../infrastructure/container';
import { BarcodeScanner } from '../../shared/components/BarcodeScanner';
import { ProductoFormModal } from './ProductoFormModal';
import { ImportarCsvModal } from './ImportarCsvModal';
import { AjusteStockModal } from './AjusteStockModal';
import { MovimientosStockTab } from './MovimientosStockTab';
import { CostosTab } from './CostosTab';
import { plantillaProductosCsv, productosACsv } from './csv';
import { descargarArchivo } from '../../shared/utils/descargarArchivo';
import { emojiDeCategoria } from '../../shared/utils/categoriaEmoji';

type Pestana = 'productos' | 'movimientos' | 'costos';

export function InventarioPage() {
  const { productos, cargando } = useProductos();
  const [pestana, setPestana] = useState<Pestana>('productos');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [buscandoCodigo, setBuscandoCodigo] = useState(false);
  const [productoEnEdicion, setProductoEnEdicion] = useState<Producto | null>(null);
  const [codigoParaAlta, setCodigoParaAlta] = useState<string | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarImportar, setMostrarImportar] = useState(false);
  const [productoParaAjuste, setProductoParaAjuste] = useState<Producto | null>(null);

  function handleExportarCsv() {
    const fecha = new Date().toISOString().slice(0, 10);
    descargarArchivo(`productos-${fecha}.csv`, productosACsv(productos), 'text/csv;charset=utf-8');
  }

  function handleDescargarPlantilla() {
    descargarArchivo('plantilla-productos.csv', plantillaProductosCsv(), 'text/csv;charset=utf-8');
  }

  const productosFiltrados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return productos;
    return productos.filter(
      (producto) =>
        producto.nombre.toLowerCase().includes(termino) ||
        producto.codigoBarras?.includes(termino) ||
        producto.categoria.toLowerCase().includes(termino),
    );
  }, [productos, busqueda]);

  const conteoPorCategoria = useMemo(() => {
    const conteo = new Map<string, number>();
    for (const producto of productos) {
      conteo.set(producto.categoria, (conteo.get(producto.categoria) ?? 0) + 1);
    }
    return [...conteo.entries()]
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }, [productos]);

  function abrirNuevo() {
    setProductoEnEdicion(null);
    setCodigoParaAlta(null);
    setMostrarFormulario(true);
  }

  function abrirEdicion(producto: Producto) {
    setProductoEnEdicion(producto);
    setCodigoParaAlta(null);
    setMostrarFormulario(true);
  }

  async function handleCodigoEscaneado(codigo: string) {
    setMostrarScanner(false);
    setBuscandoCodigo(true);
    try {
      const existente = await container.productoRepository.buscarPorCodigoBarras(codigo);
      if (existente) {
        setProductoEnEdicion(existente);
        setCodigoParaAlta(null);
      } else {
        setProductoEnEdicion(null);
        setCodigoParaAlta(codigo);
      }
      setMostrarFormulario(true);
    } finally {
      setBuscandoCodigo(false);
    }
  }

  return (
    <div>
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Inventario</h1>
          <div className="flex flex-wrap justify-end gap-2">
            <button
              onClick={handleDescargarPlantilla}
              title="Descargar plantilla CSV"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              📋 Plantilla
            </button>
            <button
              onClick={() => setMostrarImportar(true)}
              title="Importar CSV"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              📥 Importar
            </button>
            <button
              onClick={handleExportarCsv}
              disabled={productos.length === 0}
              title="Exportar CSV"
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              📤 Exportar
            </button>
            <button
              onClick={() => setMostrarScanner(true)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              📷 Escanear
            </button>
            <button
              onClick={abrirNuevo}
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              + Nuevo
            </button>
          </div>
        </div>

        <div className="mt-4 flex gap-1">
          <button
            onClick={() => setPestana('productos')}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
              pestana === 'productos'
                ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Productos
          </button>
          <button
            onClick={() => setPestana('movimientos')}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
              pestana === 'movimientos'
                ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Movimientos
          </button>
          <button
            onClick={() => setPestana('costos')}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
              pestana === 'costos'
                ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Costos
          </button>
        </div>

        {pestana === 'productos' && (
          <>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre, código o categoría…"
              className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
            />

            {buscandoCodigo && (
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Buscando producto…</p>
            )}

            {productos.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
                <span className="rounded-full bg-brand-50 px-2.5 py-1 font-semibold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                  {productos.length} producto{productos.length === 1 ? '' : 's'} en total
                </span>
                {conteoPorCategoria.map(({ categoria, total }) => (
                  <span
                    key={categoria}
                    className="rounded-full border border-gray-200 px-2.5 py-1 text-gray-600 dark:border-gray-700 dark:text-gray-300"
                  >
                    {emojiDeCategoria(categoria)} {categoria}: {total}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {pestana === 'movimientos' ? (
        <MovimientosStockTab />
      ) : pestana === 'costos' ? (
        <CostosTab />
      ) : (
        <div className="grid grid-cols-1 items-start gap-2 p-4 md:grid-cols-2 md:p-6">
          {cargando && <p className="col-span-full text-sm text-gray-500 dark:text-gray-400">Cargando productos…</p>}

          {!cargando && productosFiltrados.length === 0 && (
            <p className="col-span-full text-sm text-gray-500 dark:text-gray-400">
              {productos.length === 0
                ? 'Aún no hay productos. Crea uno o escanea un código de barras.'
                : 'No se encontraron productos con ese criterio.'}
            </p>
          )}

          {productosFiltrados.map((producto) => (
            <div
              key={producto.id}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900"
            >
              <button
                onClick={() => abrirEdicion(producto)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800">
                  {producto.imagenUrl ? (
                    <img src={producto.imagenUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl">{emojiDeCategoria(producto.categoria)}</span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-50">{producto.nombre}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {producto.categoria}
                    {producto.codigoBarras ? ` · ${producto.codigoBarras}` : ''}
                  </p>
                  <p className="truncate text-[11px] text-gray-400 dark:text-gray-500">
                    Costo: ${producto.costo.toFixed(2)} · Margen: ${margenGanancia(producto).toFixed(2)}
                    {producto.costo > 0 && ` (${((margenGanancia(producto) / producto.costo) * 100).toFixed(0)}%)`}
                    {' · Mín: '}
                    {producto.stockMinimo}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">
                    ${producto.precioVenta.toFixed(2)}
                  </p>
                  <p
                    className={clsx(
                      'text-xs font-medium',
                      tieneStockBajo(producto) ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400',
                    )}
                  >
                    Stock: {producto.stock}
                    {tieneStockBajo(producto) && ' ⚠️'}
                  </p>
                </div>
              </button>

              <button
                onClick={() => setProductoParaAjuste(producto)}
                title="Ajustar stock"
                className="shrink-0 rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
              >
                ⚙️
              </button>
            </div>
          ))}
        </div>
      )}

      {mostrarScanner && (
        <BarcodeScanner
          titulo="Escanear producto"
          onDetectado={(codigo) => void handleCodigoEscaneado(codigo)}
          onCerrar={() => setMostrarScanner(false)}
        />
      )}

      {mostrarImportar && <ImportarCsvModal onCerrar={() => setMostrarImportar(false)} />}

      {mostrarFormulario && (
        <ProductoFormModal
          producto={productoEnEdicion}
          codigoBarrasInicial={codigoParaAlta ?? undefined}
          onCerrar={() => setMostrarFormulario(false)}
          onGuardado={() => setMostrarFormulario(false)}
        />
      )}

      {productoParaAjuste && (
        <AjusteStockModal
          producto={productoParaAjuste}
          onCerrar={() => setProductoParaAjuste(null)}
          onGuardado={() => setProductoParaAjuste(null)}
        />
      )}
    </div>
  );
}
