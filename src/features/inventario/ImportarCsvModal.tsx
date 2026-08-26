import { useState } from 'react';
import clsx from 'clsx';
import { useProductos } from '../../application/inventario/useProductos';
import { useCategorias } from '../../application/inventario/useCategorias';
import { container } from '../../infrastructure/container';
import { descargarArchivo } from '../../shared/utils/descargarArchivo';
import {
  interpretarProductosCsv,
  planificarImportacion,
  plantillaProductosCsv,
  type PlanImportacion,
} from './csv';

interface ImportarCsvModalProps {
  onCerrar: () => void;
}

interface ResultadoImportacion {
  creados: number;
  actualizados: number;
  categoriasNuevas: number;
  errores: string[];
}

const ESTILO_BADGE: Record<string, string> = {
  nueva: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  actualiza: 'bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300',
  error: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400',
};

const ETIQUETA_BADGE: Record<string, string> = {
  nueva: 'Nuevo',
  actualiza: 'Actualiza',
  error: 'Atención',
};

export function ImportarCsvModal({ onCerrar }: ImportarCsvModalProps) {
  const { productos } = useProductos();
  const { categorias, crearCategoria } = useCategorias();
  const [archivo, setArchivo] = useState<File | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [plan, setPlan] = useState<PlanImportacion | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoImportacion | null>(null);

  async function handleArchivoSeleccionado(nuevoArchivo: File | null) {
    setArchivo(nuevoArchivo);
    setResultado(null);
    setPlan(null);
    if (!nuevoArchivo) return;

    setAnalizando(true);
    try {
      const texto = await nuevoArchivo.text();
      const filas = interpretarProductosCsv(texto);
      const nombresCategoriasExistentes = new Set(categorias.map((c) => c.nombre.toLowerCase()));
      setPlan(planificarImportacion(filas, productos, nombresCategoriasExistentes));
    } finally {
      setAnalizando(false);
    }
  }

  async function handleConfirmar() {
    if (!plan) return;
    setProcesando(true);

    try {
      for (const nombreCategoria of plan.categoriasNuevas) {
        await crearCategoria(nombreCategoria);
      }
      if (plan.operaciones.length > 0) {
        await container.productoRepository.guardarLote(plan.operaciones);
      }

      setResultado({
        creados: plan.filas.filter((f) => f.estado === 'nueva').length,
        actualizados: plan.filas.filter((f) => f.estado === 'actualiza').length,
        categoriasNuevas: plan.categoriasNuevas.length,
        errores: plan.filas
          .filter((f) => f.estado === 'error')
          .map((f) => `Fila ${f.numero}: ${f.detalle}`),
      });
      setPlan(null);
      setArchivo(null);
    } catch {
      setResultado({
        creados: 0,
        actualizados: 0,
        categoriasNuevas: 0,
        errores: ['No se pudo completar la importación. Intenta de nuevo.'],
      });
    } finally {
      setProcesando(false);
    }
  }

  const nuevas = plan?.filas.filter((f) => f.estado === 'nueva').length ?? 0;
  const actualiza = plan?.filas.filter((f) => f.estado === 'actualiza').length ?? 0;
  const conError = plan?.filas.filter((f) => f.estado === 'error').length ?? 0;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/50 sm:items-center sm:p-4">
      <div className="flex max-h-[90svh] w-full max-w-sm flex-col rounded-t-2xl bg-white p-5 shadow-xl dark:bg-gray-900 sm:rounded-2xl">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Importar productos (CSV)</h2>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
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
              onChange={(e) => void handleArchivoSeleccionado(e.target.files?.[0] ?? null)}
            />
          </label>

          {analizando && (
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Analizando archivo…</p>
          )}

          {plan && !analizando && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                Vista previa — {plan.filas.length} fila{plan.filas.length === 1 ? '' : 's'}:{' '}
                <span className="text-emerald-600 dark:text-emerald-400">{nuevas} nuevas</span> ·{' '}
                <span className="text-brand-600 dark:text-brand-400">{actualiza} actualizan</span>
                {conError > 0 && (
                  <>
                    {' '}
                    · <span className="text-red-600 dark:text-red-400">{conError} necesitan atención</span>
                  </>
                )}
                {plan.categoriasNuevas.length > 0 && (
                  <> · {plan.categoriasNuevas.length} categoría{plan.categoriasNuevas.length === 1 ? '' : 's'} nueva{plan.categoriasNuevas.length === 1 ? '' : 's'}</>
                )}
              </p>

              <div className="max-h-56 space-y-1.5 overflow-y-auto rounded-lg border border-gray-200 p-2 dark:border-gray-800">
                {plan.filas.map((fila) => (
                  <div
                    key={fila.numero}
                    className={clsx(
                      'rounded-lg border p-2 text-xs',
                      fila.estado === 'error'
                        ? 'border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/40'
                        : 'border-gray-200 dark:border-gray-800',
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate font-medium text-gray-900 dark:text-gray-100">
                        Fila {fila.numero}
                        {fila.nombre ? ` · ${fila.nombre}` : ''}
                      </span>
                      <span
                        className={clsx(
                          'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                          ESTILO_BADGE[fila.estado],
                        )}
                      >
                        {ETIQUETA_BADGE[fila.estado]}
                      </span>
                    </div>
                    <p
                      className={clsx(
                        'mt-0.5',
                        fila.estado === 'error'
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400',
                      )}
                    >
                      {fila.detalle}
                    </p>
                  </div>
                ))}
              </div>

              {conError > 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ⚠️ Las filas marcadas "Atención" no se importarán. Corrígelas en tu archivo y vuelve a
                  seleccionarlo si quieres incluirlas.
                </p>
              )}
            </div>
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
        </div>

        <button
          onClick={() => void handleConfirmar()}
          disabled={!plan || plan.operaciones.length === 0 || procesando || analizando}
          className="mt-4 w-full shrink-0 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {procesando
            ? 'Importando…'
            : plan
              ? `Confirmar importación (${plan.operaciones.length})`
              : 'Importar'}
        </button>
      </div>
    </div>
  );
}
