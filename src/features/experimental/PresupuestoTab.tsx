import { useMemo, useRef, useState } from 'react';
import { useProductos } from '../../application/inventario/useProductos';
import { compartirImagenDeElemento, compartirTexto } from '../../shared/utils/compartir';

interface ItemPresupuesto {
  id: string;
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

function nuevoId(): string {
  return `${Date.now()}-${Math.random()}`;
}

function generarTextoPresupuesto(cliente: string, items: ItemPresupuesto[], total: number): string {
  const lineas: string[] = [];
  lineas.push('🧾 Papelería André — Presupuesto');
  if (cliente.trim()) lineas.push(`Para: ${cliente.trim()}`);
  lineas.push('------------------------------');
  for (const item of items) {
    lineas.push(`${item.cantidad} x ${item.nombre} — $${(item.cantidad * item.precioUnitario).toFixed(2)}`);
  }
  lineas.push('------------------------------');
  lineas.push(`Total estimado: $${total.toFixed(2)}`);
  lineas.push('Precios sujetos a cambio sin previo aviso.');
  return lineas.join('\n');
}

export function PresupuestoTab() {
  const { productos } = useProductos();
  const [cliente, setCliente] = useState('');
  const [items, setItems] = useState<ItemPresupuesto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const resultados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    if (!termino) return [];
    return productos.filter((p) => p.nombre.toLowerCase().includes(termino)).slice(0, 6);
  }, [busqueda, productos]);

  const total = useMemo(
    () => items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0),
    [items],
  );

  function agregarDesdeProducto(productoId: string, nombre: string, precioUnitario: number) {
    setItems((actuales) => {
      const existente = actuales.find((item) => item.productoId === productoId);
      if (existente) {
        return actuales.map((item) =>
          item.productoId === productoId ? { ...item, cantidad: item.cantidad + 1 } : item,
        );
      }
      return [...actuales, { id: nuevoId(), productoId, nombre, cantidad: 1, precioUnitario }];
    });
    setBusqueda('');
  }

  function actualizarItem(id: string, cambios: Partial<Pick<ItemPresupuesto, 'cantidad' | 'precioUnitario'>>) {
    setItems((actuales) => actuales.map((item) => (item.id === id ? { ...item, ...cambios } : item)));
  }

  function quitarItem(id: string) {
    setItems((actuales) => actuales.filter((item) => item.id !== id));
  }

  function limpiarTodo() {
    setCliente('');
    setItems([]);
    setMensaje(null);
  }

  async function handleCompartirTexto() {
    setMensaje(null);
    const resultado = await compartirTexto(
      generarTextoPresupuesto(cliente, items, total),
      'Papelería André — Presupuesto',
    );
    if (resultado === 'copiado') setMensaje('Presupuesto copiado — pégalo donde quieras enviarlo.');
    else if (resultado === 'error') setMensaje('No se pudo compartir ni copiar el presupuesto.');
  }

  async function handleCompartirImagen() {
    if (!previewRef.current) return;
    setMensaje(null);
    setProcesando(true);
    try {
      const resultado = await compartirImagenDeElemento(
        previewRef.current,
        'presupuesto.png',
        'Papelería André — Presupuesto',
      );
      if (resultado === 'descargado') setMensaje('Imagen descargada.');
      else if (resultado === 'error') setMensaje('No se pudo generar la imagen del presupuesto.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Arma una cotización rápida para un cliente (ej. lista de útiles) usando solo productos de tu
          inventario. No descuenta stock ni se guarda — es solo para calcular y compartir un estimado.
        </p>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Cliente / referencia (opcional)
          </label>
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
            placeholder="Ej. Lista de 3er grado — familia Pérez"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
          />
        </div>

        <div className="relative mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Buscar producto en tu inventario
          </label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej. Cuaderno profesional"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
          />

          {busqueda.trim() && (
            <div className="mt-1 space-y-1 rounded-lg border border-gray-200 bg-white p-1.5 dark:border-gray-800 dark:bg-gray-900">
              {resultados.length === 0 ? (
                <p className="px-2 py-1.5 text-xs text-gray-500 dark:text-gray-400">
                  No se encontraron productos con ese nombre en tu inventario.
                </p>
              ) : (
                resultados.map((producto) => (
                  <button
                    key={producto.id}
                    onClick={() => agregarDesdeProducto(producto.id, producto.nombre, producto.precioVenta)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <span className="truncate text-gray-700 dark:text-gray-300">{producto.nombre}</span>
                    <span className="shrink-0 font-medium text-gray-900 dark:text-gray-50">
                      ${producto.precioVenta.toFixed(2)}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {items.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Lista</h2>
            <button onClick={limpiarTodo} className="text-xs font-medium text-red-600 hover:underline dark:text-red-400">
              Limpiar todo
            </button>
          </div>

          <ul className="mt-3 space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                  {item.nombre}
                </span>
                <input
                  type="number"
                  min="1"
                  value={item.cantidad}
                  onChange={(e) => actualizarItem(item.id, { cantidad: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-14 shrink-0 rounded-lg border border-gray-300 bg-white px-1 py-1.5 text-center text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.precioUnitario}
                  onChange={(e) => actualizarItem(item.id, { precioUnitario: Math.max(0, Number(e.target.value) || 0) })}
                  className="w-20 shrink-0 rounded-lg border border-gray-300 bg-white px-1 py-1.5 text-right text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <button onClick={() => quitarItem(item.id)} className="shrink-0 text-gray-400 hover:text-red-500" aria-label="Quitar">
                  ✕
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Total estimado</span>
            <span className="text-lg font-bold text-gray-900 dark:text-gray-50">${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <>
          <div
            ref={previewRef}
            className="mx-auto max-w-sm rounded-xl border border-dashed border-gray-300 bg-white p-4 dark:border-gray-700"
          >
            <p className="text-center text-sm font-bold text-gray-900">Papelería André</p>
            <p className="text-center text-xs text-gray-500">Presupuesto</p>
            {cliente.trim() && <p className="mt-1 text-center text-xs text-gray-600">Para: {cliente.trim()}</p>}
            <div className="mt-3 space-y-1 border-t border-dashed border-gray-300 pt-2 text-xs text-gray-700">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between gap-2">
                  <span className="truncate">
                    {item.cantidad} x {item.nombre}
                  </span>
                  <span className="shrink-0">${(item.cantidad * item.precioUnitario).toFixed(2)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between border-t border-dashed border-gray-300 pt-2 text-sm font-bold text-gray-900">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-400">Precios sujetos a cambio sin previo aviso.</p>
          </div>

          {mensaje && (
            <p className="mx-auto max-w-sm rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              {mensaje}
            </p>
          )}

          <div className="mx-auto flex max-w-sm gap-2">
            <button
              onClick={() => void handleCompartirTexto()}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              💬 Texto
            </button>
            <button
              onClick={() => void handleCompartirImagen()}
              disabled={procesando}
              className="flex-1 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              🖼️ Imagen
            </button>
          </div>
        </>
      )}
    </div>
  );
}
