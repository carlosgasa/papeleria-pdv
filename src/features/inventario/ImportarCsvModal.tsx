import { useState } from 'react';
import { useProductos } from '../../application/inventario/useProductos';
import { useCategorias } from '../../application/inventario/useCategorias';
import { container } from '../../infrastructure/container';
import { descargarArchivo } from '../../shared/utils/descargarArchivo';
import { interpretarProductosCsv, plantillaProductosCsv, type FilaImportacion } from './csv';
import type { OperacionLoteProducto } from '../../domain/repositories/ProductoRepository';

interface ImportarCsvModalProps {
  onCerrar: () => void;
}

interface ResultadoImportacion {
  creados: number;
  actualizados: number;
  categoriasNuevas: number;
  errores: string[];
}

export function ImportarCsvModal({ onCerrar }: ImportarCsvModalProps) {
  const { productos } = useProductos();
  const { categorias, crearCategoria } = useCategorias();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  async function handleImportar() {
    if (!archivo) return;
    setProcesando(true);
    setResultado(null);

    const texto = await archivo.text();
    const filas = interpretarProductosCsv(texto);
    const errores: string[] = filas
      .filter((f): f is FilaImportacion & { error: string } => Boolean(f.error))
      .map((f) => `Fila ${f.numero}: ${f.error}`);
    const validas = filas.filter((f) => f.datos);

    try {
      // Crea primero las categorías que aún no existen, para no dejar productos
      // con una categoría "huérfana" que no aparece en los selects de la app.
      const categoriasExistentes = new Set(categorias.map((c) => c.nombre.toLowerCase()));
      const categoriasNuevasSet = new Set<string>();
      for (const fila of validas) {
        const nombreCategoria = fila.datos!.categoria;
        if (!categoriasExistentes.has(nombreCategoria.toLowerCase())) {
          categoriasNuevasSet.add(nombreCategoria);
        }
      }
      for (const nombreCategoria of categoriasNuevasSet) {
        await crearCategoria(nombreCategoria);
      }

      // Empareja por código de barras contra los productos ya cargados en memoria
      // (evita una consulta a Firestore por fila y reduce la ventana de condición
      // de carrera si dos importaciones corrieran al mismo tiempo).
      const productosPorCodigo = new Map(
        productos.filter((p) => p.codigoBarras).map((p) => [p.codigoBarras as string, p]),
      );

      const operaciones: OperacionLoteProducto[] = [];
      const codigosNuevosEnArchivo = new Set<string>();
      let creados = 0;
      let actualizados = 0;
      for (const fila of validas) {
        const datos = fila.datos!;
        const existente = datos.codigoBarras ? productosPorCodigo.get(datos.codigoBarras) : undefined;
        if (existente) {
          operaciones.push({ id: existente.id, datos });
          actualizados++;
        } else if (datos.codigoBarras && codigosNuevosEnArchivo.has(datos.codigoBarras)) {
          errores.push(
            `Fila ${fila.numero}: código de barras "${datos.codigoBarras}" repetido en el archivo, se omitió esta fila.`,
          );
        } else {
          if (datos.codigoBarras) codigosNuevosEnArchivo.add(datos.codigoBarras);
          operaciones.push({ id: null, datos });
          creados++;
        }
      }

      if (operaciones.length > 0) {
        await container.productoRepository.guardarLote(operaciones);
      }

      setResultado({ creados, actualizados, categoriasNuevas: categoriasNuevasSet.size, errores });
    } catch {
      setResultado({
        creados: 0,
        actualizados: 0,
        categoriasNuevas: 0,
        errores: [...errores, 'No se pudo completar la importación. Intenta de nuevo.'],
      });
    } finally {
      setProcesando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl dark:bg-gray-900 sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Importar productos (CSV)</h2>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          El archivo debe tener las columnas: nombre, codigoBarras, categoria, costo, precioVenta, stock,
          stockMinimo (el código de barras puede ir vacío, los demás campos no). Si el código de barras ya
          existe, el producto se actualiza; si no, se crea uno nuevo. Las categorías nuevas se crean solas.
        </p>

        <button
          type="button"
          onClick={() => descargarArchivo('plantilla-productos.csv', plantillaProductosCsv(), 'text/csv;charset=utf-8')}
          className="mt-2 text-xs font-medium text-brand-600 hover:underline dark:text-brand-400"
        >
          📋 Descargar plantilla vacía
        </button>

        <label className="mt-3 block cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-500 hover:border-brand-400 dark:border-gray-700 dark:text-gray-400">
          {archivo ? archivo.name : 'Selecciona un archivo .csv'}
          <input
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              setArchivo(e.target.files?.[0] ?? null);
              setResultado(null);
            }}
          />
        </label>

        {procesando && (
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Importando…</p>
        )}

        {resultado && (
          <div className="mt-3 space-y-1 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
            <p className="text-gray-700 dark:text-gray-200">
              ✅ {resultado.creados} creados · {resultado.actualizados} actualizados
              {resultado.categoriasNuevas > 0 && ` · ${resultado.categoriasNuevas} categorías nuevas`}
            </p>
            {resultado.errores.length > 0 && (
              <div className="mt-1 max-h-32 overflow-y-auto text-xs text-red-600 dark:text-red-400">
                {resultado.errores.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => void handleImportar()}
          disabled={!archivo || procesando}
          className="mt-4 w-full rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {procesando ? 'Importando…' : 'Importar'}
        </button>
      </div>
    </div>
  );
}
