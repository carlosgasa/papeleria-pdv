import { useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useProductos } from '../../application/inventario/useProductos';
import { useClientes } from '../../application/clientes/useClientes';
import { compartirImagenDeElemento, compartirTexto } from '../../shared/utils/compartir';
import { emojiDeCategoria } from '../../shared/utils/categoriaEmoji';
import { useBorradores, type BorradorBase } from '../../shared/hooks/useBorradores';
import { GuardarNotaModal } from '../../shared/components/GuardarNotaModal';
import { NotasGuardadasModal } from '../../shared/components/NotasGuardadasModal';
import { CampoNumerico } from '../../shared/components/CampoNumerico';

interface ItemPresupuesto {
  id: string;
  productoId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
}

interface BorradorPresupuesto extends BorradorBase {
  clienteId: string;
  clienteLibre: string;
  items: ItemPresupuesto[];
}

const CLAVE_BORRADORES_PRESUPUESTO = 'papeleria-pos:borradores-presupuesto';

const CLIENTE_OTRO = '__otro__';

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
  const { clientes } = useClientes();
  const [clienteId, setClienteId] = useState('');
  const [clienteLibre, setClienteLibre] = useState('');
  const [items, setItems] = useState<ItemPresupuesto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [mostrarGuardarNota, setMostrarGuardarNota] = useState(false);
  const [mostrarNotas, setMostrarNotas] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const { borradores: notas, guardar: guardarNotaPresupuesto, eliminar: eliminarNota } =
    useBorradores<BorradorPresupuesto>(CLAVE_BORRADORES_PRESUPUESTO);

  const nombreCliente = useMemo(() => {
    if (clienteId === CLIENTE_OTRO) return clienteLibre.trim();
    if (clienteId) return clientes.find((c) => c.id === clienteId)?.nombre ?? '';
    return '';
  }, [clienteId, clienteLibre, clientes]);

  const resultados = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();
    const base = termino ? productos.filter((p) => p.nombre.toLowerCase().includes(termino)) : productos;
    return [...base].sort((a, b) => a.nombre.localeCompare(b.nombre));
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
  }

  function actualizarItem(id: string, cambios: Partial<Pick<ItemPresupuesto, 'cantidad' | 'precioUnitario'>>) {
    setItems((actuales) => actuales.map((item) => (item.id === id ? { ...item, ...cambios } : item)));
  }

  function quitarItem(id: string) {
    setItems((actuales) => actuales.filter((item) => item.id !== id));
  }

  function limpiarTodo() {
    setClienteId('');
    setClienteLibre('');
    setItems([]);
    setMensaje(null);
  }

  function handleGuardarNota(nombre: string) {
    guardarNotaPresupuesto(nombre, { clienteId, clienteLibre, items });
    limpiarTodo();
    setMostrarGuardarNota(false);
  }

  function handleRetomarNota(nota: BorradorPresupuesto) {
    if (items.length > 0 && !confirm('Esto reemplazará el presupuesto actual. ¿Continuar?')) return;
    setClienteId(nota.clienteId);
    setClienteLibre(nota.clienteLibre);
    setItems(nota.items);
    setMensaje(null);
    setMostrarNotas(false);
  }

  async function handleCompartirTexto() {
    setMensaje(null);
    const resultado = await compartirTexto(
      generarTextoPresupuesto(nombreCliente, items, total),
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
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Arma una cotización rápida para un cliente (ej. lista de útiles) usando solo productos de tu
            inventario. No descuenta stock ni se guarda — es solo para calcular y compartir un estimado.
          </p>
          <button
            onClick={() => setMostrarNotas(true)}
            className="shrink-0 rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:border-gray-700 dark:text-gray-300"
            title="Notas guardadas"
          >
            🗒️ Notas{notas.length > 0 ? ` (${notas.length})` : ''}
          </button>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Cliente (opcional)
          </label>
          <select
            value={clienteId}
            onChange={(e) => {
              setClienteId(e.target.value);
              if (e.target.value !== CLIENTE_OTRO) setClienteLibre('');
            }}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            <option value="">Sin cliente</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
            <option value={CLIENTE_OTRO}>+ Otro / nuevo…</option>
          </select>
          {clienteId === CLIENTE_OTRO && (
            <input
              type="text"
              value={clienteLibre}
              onChange={(e) => setClienteLibre(e.target.value)}
              placeholder="Ej. Lista de 3er grado — familia Pérez"
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
            />
          )}
          <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
            "Otro / nuevo" es solo para el nombre en el presupuesto — no crea un cliente en tu directorio.
          </p>
        </div>

        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
            Buscar producto en tu inventario
          </label>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Ej. Cuaderno profesional (o deja vacío para ver todos)"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
          />

          <p className="mb-1 mt-2 text-xs font-medium text-gray-500 dark:text-gray-400">
            {busqueda.trim() ? `Resultados (${resultados.length})` : `Todos los productos (${resultados.length})`}
          </p>
          <div className="grid max-h-64 grid-cols-1 items-start gap-1 overflow-y-auto rounded-lg border border-gray-200 p-1.5 dark:border-gray-800 md:grid-cols-2">
            {resultados.length === 0 ? (
              <p className="col-span-full px-2 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                {productos.length === 0
                  ? 'Aún no hay productos en tu inventario.'
                  : 'No se encontraron productos con ese nombre.'}
              </p>
            ) : (
              resultados.map((producto) => (
                <button
                  key={producto.id}
                  onClick={() => agregarDesdeProducto(producto.id, producto.nombre, producto.precioVenta)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <span className="shrink-0 text-base">{emojiDeCategoria(producto.categoria)}</span>
                  <span className="min-w-0 flex-1 truncate text-gray-700 dark:text-gray-300">
                    {producto.nombre}
                  </span>
                  <span className="shrink-0 font-medium text-gray-900 dark:text-gray-50">
                    ${producto.precioVenta.toFixed(2)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {items.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Lista</h2>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarGuardarNota(true)}
                className="text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                🗒️ Guardar nota
              </button>
              <button onClick={limpiarTodo} className="text-xs font-medium text-red-600 hover:underline dark:text-red-400">
                Limpiar todo
              </button>
            </div>
          </div>

          <ul className="mt-3 space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm text-gray-700 dark:text-gray-300">
                  {item.nombre}
                </span>
                <CampoNumerico
                  min={1}
                  value={item.cantidad}
                  onChange={(valor) => actualizarItem(item.id, { cantidad: valor })}
                  className="w-14 shrink-0 rounded-lg border border-gray-300 bg-white px-1 py-1.5 text-center text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
                />
                <CampoNumerico
                  min={0}
                  value={item.precioUnitario}
                  onChange={(valor) => actualizarItem(item.id, { precioUnitario: valor })}
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
            {nombreCliente && <p className="mt-1 text-center text-xs text-gray-600">Para: {nombreCliente}</p>}
            <div className="mt-3 space-y-1.5 border-t border-dashed border-gray-300 pt-2 text-xs text-gray-700">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-2">
                  <span className="min-w-0 flex-1 break-words">
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

      {mostrarGuardarNota && (
        <GuardarNotaModal
          titulo="Guardar presupuesto como nota"
          sugerido={nombreCliente || `Presupuesto ${format(Date.now(), 'd MMM, HH:mm', { locale: es })}`}
          onGuardar={handleGuardarNota}
          onCerrar={() => setMostrarGuardarNota(false)}
        />
      )}

      {mostrarNotas && (
        <NotasGuardadasModal
          titulo="Notas de presupuesto guardadas"
          borradores={notas}
          renderResumen={(nota) => {
            const cantidadArticulos = nota.items.reduce((acc, i) => acc + i.cantidad, 0);
            const totalNota = nota.items.reduce((acc, i) => acc + i.cantidad * i.precioUnitario, 0);
            return `${cantidadArticulos} artículo${cantidadArticulos === 1 ? '' : 's'} · $${totalNota.toFixed(2)}`;
          }}
          onRetomar={handleRetomarNota}
          onEliminar={eliminarNota}
          onCerrar={() => setMostrarNotas(false)}
        />
      )}
    </div>
  );
}
