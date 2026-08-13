import { useState } from 'react';
import { container } from '../../infrastructure/container';
import { descargarArchivo } from '../../shared/utils/descargarArchivo';
import { interpretarProductosCsv, plantillaProductosCsv, type FilaImportacion } from './csv';

interface ImportarCsvModalProps {
  onCerrar: () => void;
}

interface ResultadoImportacion {
  creados: number;
  actualizados: number;
  errores: string[];
}

export function ImportarCsvModal({ onCerrar }: ImportarCsvModalProps) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
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

    setProgreso({ actual: 0, total: validas.length });

    let creados = 0;
    let actualizados = 0;

    for (const fila of validas) {
      if (!fila.datos) continue;
      try {
        const existente = fila.datos.codigoBarras
          ? await container.productoRepository.buscarPorCodigoBarras(fila.datos.codigoBarras)
          : null;
        if (existente) {
          await container.productoRepository.actualizar(existente.id, fila.datos);
          actualizados++;
        } else {
          await container.productoRepository.crear(fila.datos);
          creados++;
        }
      } catch {
        errores.push(`Fila ${fila.numero}: no se pudo guardar "${fila.datos.nombre}".`);
      }
      setProgreso((p) => ({ ...p, actual: p.actual + 1 }));
    }

    setResultado({ creados, actualizados, errores });
    setProcesando(false);
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
          stockMinimo (el código de barras puede ir vacío). Si el código de barras ya existe, el producto se
          actualiza; si no, se crea uno nuevo.
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
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Procesando {progreso.actual} de {progreso.total}…
          </p>
        )}

        {resultado && (
          <div className="mt-3 space-y-1 rounded-lg bg-gray-50 p-3 text-sm dark:bg-gray-800">
            <p className="text-gray-700 dark:text-gray-200">
              ✅ {resultado.creados} creados · {resultado.actualizados} actualizados
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
