import { useState, type FormEvent } from 'react';
import type { Producto } from '../../domain/entities/Producto';
import { useCategorias } from '../../application/inventario/useCategorias';
import { useProductos } from '../../application/inventario/useProductos';
import { container } from '../../infrastructure/container';
import { eliminarImagenProducto, subirImagenProducto } from '../../infrastructure/firebase/storage';
import { BarcodeScanner } from '../../shared/components/BarcodeScanner';

interface ProductoFormModalProps {
  producto?: Producto | null;
  codigoBarrasInicial?: string;
  onGuardado: () => void;
  onCerrar: () => void;
}

const CATEGORIA_NUEVA = '__nueva__';

export function ProductoFormModal({
  producto,
  codigoBarrasInicial,
  onGuardado,
  onCerrar,
}: ProductoFormModalProps) {
  const { categorias, crearCategoria } = useCategorias();
  const { productos } = useProductos();
  const esEdicion = Boolean(producto);

  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [codigoBarras, setCodigoBarras] = useState(producto?.codigoBarras ?? codigoBarrasInicial ?? '');
  const [categoria, setCategoria] = useState(producto?.categoria ?? '');
  const [categoriaNueva, setCategoriaNueva] = useState('');
  const [costo, setCosto] = useState(producto ? String(producto.costo) : '');
  const [precioVenta, setPrecioVenta] = useState(producto ? String(producto.precioVenta) : '');
  const [stock, setStock] = useState(producto ? String(producto.stock) : '0');
  const [stockMinimo, setStockMinimo] = useState(producto ? String(producto.stockMinimo) : '1');
  const [imagenActual] = useState(producto?.imagenUrl ?? null);
  const [imagenArchivo, setImagenArchivo] = useState<File | null>(null);
  const [imagenPreview, setImagenPreview] = useState<string | null>(producto?.imagenUrl ?? null);
  const [mostrarScanner, setMostrarScanner] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImagenSeleccionada(archivo: File | null) {
    setImagenArchivo(archivo);
    if (archivo) {
      setImagenPreview(URL.createObjectURL(archivo));
    } else {
      setImagenPreview(producto?.imagenUrl ?? null);
    }
  }

  async function handleSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setError(null);

    const categoriaFinal = categoria === CATEGORIA_NUEVA ? categoriaNueva.trim() : categoria;
    if (!categoriaFinal) {
      setError('Selecciona o crea una categoría.');
      return;
    }

    const costoNum = Number(costo);
    const precioVentaNum = Number(precioVenta);
    const stockNum = Number(stock);
    const stockMinimoNum = Number(stockMinimo);

    if (!nombre.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    if ([costoNum, precioVentaNum, stockNum, stockMinimoNum].some((valor) => Number.isNaN(valor) || valor < 0)) {
      setError('Costo, precio, stock y stock mínimo deben ser números válidos.');
      return;
    }

    const codigoBarrasFinal = codigoBarras.trim();
    if (codigoBarrasFinal) {
      const duplicado = productos.find(
        (p) => p.codigoBarras === codigoBarrasFinal && p.id !== producto?.id,
      );
      if (duplicado) {
        setError(`Ese código de barras ya lo tiene "${duplicado.nombre}".`);
        return;
      }
    }

    setGuardando(true);
    try {
      let categoriaAGuardar = categoriaFinal;
      if (categoria === CATEGORIA_NUEVA) {
        await crearCategoria(categoriaFinal);
        categoriaAGuardar = categoriaFinal;
      }

      const datosBase = {
        nombre: nombre.trim(),
        codigoBarras: codigoBarrasFinal || null,
        categoria: categoriaAGuardar,
        costo: costoNum,
        precioVenta: precioVentaNum,
        stock: stockNum,
        stockMinimo: stockMinimoNum,
      };

      if (esEdicion && producto) {
        let imagenUrl = imagenActual;
        if (imagenArchivo) {
          imagenUrl = await subirImagenProducto(producto.id, imagenArchivo);
          if (imagenActual) await eliminarImagenProducto(imagenActual);
        }
        await container.productoRepository.actualizar(producto.id, { ...datosBase, imagenUrl });
      } else {
        const nuevoId = await container.productoRepository.crear({ ...datosBase, imagenUrl: null });
        if (imagenArchivo) {
          const imagenUrl = await subirImagenProducto(nuevoId, imagenArchivo);
          await container.productoRepository.actualizar(nuevoId, { imagenUrl });
        }
      }

      onGuardado();
    } catch (err) {
      console.error(err);
      const detalle = err instanceof Error ? err.message : String(err);
      setError(`No se pudo guardar el producto: ${detalle}`);
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminar() {
    if (!producto) return;
    if (!confirm(`¿Eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`)) return;
    setGuardando(true);
    try {
      await container.productoRepository.eliminar(producto.id);
      if (producto.imagenUrl) await eliminarImagenProducto(producto.imagenUrl);
      onGuardado();
    } catch {
      setError('No se pudo eliminar el producto.');
      setGuardando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="max-h-[90svh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl dark:bg-gray-900 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">
            {esEdicion ? 'Editar producto' : 'Nuevo producto'}
          </h2>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800">
              {imagenPreview ? (
                <img src={imagenPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-2xl">📦</span>
              )}
            </div>
            <label className="flex-1 cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-2 text-center text-xs text-gray-500 hover:border-brand-400 dark:border-gray-700 dark:text-gray-400">
              {imagenArchivo ? imagenArchivo.name : 'Subir imagen (opcional)'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImagenSeleccionada(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Nombre</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Código de barras (opcional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={codigoBarras}
                onChange={(e) => setCodigoBarras(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
              />
              <button
                type="button"
                onClick={() => setMostrarScanner(true)}
                className="shrink-0 rounded-lg border border-gray-300 px-3 text-sm dark:border-gray-700 dark:text-gray-200"
                aria-label="Escanear código"
              >
                📷
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              required
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              <option value="" disabled>
                Selecciona una categoría
              </option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.nombre}>
                  {cat.nombre}
                </option>
              ))}
              <option value={CATEGORIA_NUEVA}>+ Nueva categoría…</option>
            </select>
            {categoria === CATEGORIA_NUEVA && (
              <input
                type="text"
                required
                placeholder="Nombre de la nueva categoría"
                value={categoriaNueva}
                onChange={(e) => setCategoriaNueva(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Costo</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={costo}
                onChange={(e) => setCosto(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Precio venta</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Stock mínimo</label>
              <input
                type="number"
                step="1"
                min="0"
                required
                value={stockMinimo}
                onChange={(e) => setStockMinimo(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            {esEdicion && (
              <button
                type="button"
                onClick={() => void handleEliminar()}
                disabled={guardando}
                className="rounded-lg border border-red-200 px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
              >
                Eliminar
              </button>
            )}
            <button
              type="submit"
              disabled={guardando}
              className="flex-1 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {guardando ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>

      {mostrarScanner && (
        <BarcodeScanner
          titulo="Escanear código de barras"
          onDetectado={(codigo) => {
            setCodigoBarras(codigo);
            setMostrarScanner(false);
          }}
          onCerrar={() => setMostrarScanner(false)}
        />
      )}
    </div>
  );
}
