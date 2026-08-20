import { useMemo, useState } from 'react';
import { useProductos } from '../../application/inventario/useProductos';
import { useCategorias } from '../../application/inventario/useCategorias';
import { useMovimientosStock } from '../../application/inventario/useMovimientosStock';
import { useVentas } from '../../application/ventas/useVentas';
import { useClientes } from '../../application/clientes/useClientes';
import { useAbonos } from '../../application/clientes/useAbonos';
import { useInversiones } from '../../application/inversiones/useInversiones';

const VERSION_RESPALDO = 1;

export function RespaldoTab() {
  const { productos, cargando: cargandoProductos } = useProductos();
  const { categorias, cargando: cargandoCategorias } = useCategorias();
  const { movimientos, cargando: cargandoMovimientos } = useMovimientosStock();
  const { ventas, cargando: cargandoVentas } = useVentas();
  const { clientes, cargando: cargandoClientes } = useClientes();
  const { abonos, cargando: cargandoAbonos } = useAbonos();
  const { inversiones, cargando: cargandoInversiones } = useInversiones();
  const [generando, setGenerando] = useState(false);

  const cargando =
    cargandoProductos ||
    cargandoCategorias ||
    cargandoMovimientos ||
    cargandoVentas ||
    cargandoClientes ||
    cargandoAbonos ||
    cargandoInversiones;

  const conteos = useMemo(
    () => [
      { etiqueta: 'Productos', total: productos.length },
      { etiqueta: 'Categorías', total: categorias.length },
      { etiqueta: 'Movimientos de stock', total: movimientos.length },
      { etiqueta: 'Ventas', total: ventas.length },
      { etiqueta: 'Clientes', total: clientes.length },
      { etiqueta: 'Abonos', total: abonos.length },
      { etiqueta: 'Inversiones', total: inversiones.length },
    ],
    [productos, categorias, movimientos, ventas, clientes, abonos, inversiones],
  );

  function descargarRespaldo() {
    setGenerando(true);
    try {
      const respaldo = {
        version: VERSION_RESPALDO,
        generadoEn: new Date().toISOString(),
        productos,
        categorias,
        movimientosStock: movimientos,
        ventas,
        clientes,
        abonos,
        inversiones,
      };
      const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      const fecha = new Date().toISOString().slice(0, 10);
      enlace.href = url;
      enlace.download = `papeleria-respaldo-${fecha}.json`;
      enlace.click();
      URL.revokeObjectURL(url);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Descarga una copia completa de tu información (inventario, ventas, clientes, movimientos e inversiones)
          en un solo archivo. Guárdala en un lugar seguro (correo, USB, Google Drive) de vez en cuando, por si algo
          le pasa a tu cuenta o dispositivo.
        </p>

        <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
          {conteos.map((c) => (
            <li key={c.etiqueta} className="rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">{c.etiqueta}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-50">{cargando ? '…' : c.total}</p>
            </li>
          ))}
        </ul>

        <button
          onClick={descargarRespaldo}
          disabled={cargando || generando}
          className="mt-4 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {cargando ? 'Cargando datos…' : generando ? 'Generando…' : '💾 Descargar respaldo (JSON)'}
        </button>

        <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
          El archivo es solo de lectura: guardarlo no borra ni cambia nada en tu cuenta. Para restaurarlo
          necesitarías ayuda técnica, ya que hoy la app no tiene una opción de "importar respaldo completo".
        </p>
      </div>
    </div>
  );
}
