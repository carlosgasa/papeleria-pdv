import { useMemo, useState } from 'react';
import { endOfDay, format, startOfDay, startOfMonth, startOfWeek } from 'date-fns';
import type { Venta } from '../../domain/entities/Venta';
import { descargarArchivo } from '../../shared/utils/descargarArchivo';
import { generarCsvCorte, generarPdfCorte } from './reportes';

type Periodo = 'hoy' | 'semana' | 'mes' | 'personalizado';

function formatoInput(fecha: Date): string {
  return format(fecha, 'yyyy-MM-dd');
}

export function ReportesPanel({ ventas }: { ventas: Venta[] }) {
  const [periodo, setPeriodo] = useState<Periodo>('hoy');
  const [desdeInput, setDesdeInput] = useState(formatoInput(startOfMonth(Date.now())));
  const [hastaInput, setHastaInput] = useState(formatoInput(new Date()));

  const { desde, hasta } = useMemo(() => {
    const ahora = Date.now();
    if (periodo === 'hoy') return { desde: startOfDay(ahora), hasta: endOfDay(ahora) };
    if (periodo === 'semana') return { desde: startOfWeek(ahora, { weekStartsOn: 1 }), hasta: endOfDay(ahora) };
    if (periodo === 'mes') return { desde: startOfMonth(ahora), hasta: endOfDay(ahora) };
    return { desde: startOfDay(new Date(desdeInput)), hasta: endOfDay(new Date(hastaInput)) };
  }, [periodo, desdeInput, hastaInput]);

  const ventasFiltradas = useMemo(
    () => ventas.filter((v) => v.fecha >= desde.getTime() && v.fecha <= hasta.getTime()),
    [ventas, desde, hasta],
  );

  function handleExportarCsv() {
    descargarArchivo(
      `corte-caja-${formatoInput(desde)}-a-${formatoInput(hasta)}.csv`,
      generarCsvCorte(ventasFiltradas),
      'text/csv;charset=utf-8',
    );
  }

  function handleExportarPdf() {
    const doc = generarPdfCorte(ventasFiltradas, desde, hasta);
    doc.save(`corte-caja-${formatoInput(desde)}-a-${formatoInput(hasta)}.pdf`);
  }

  return (
    <div className="rounded-xl border border-t-4 border-gray-200 border-t-teal-500 bg-white p-4 dark:border-gray-800 dark:border-t-teal-500 dark:bg-gray-900">
      <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Reportes / corte de caja</h2>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(['hoy', 'semana', 'mes', 'personalizado'] as Periodo[]).map((opcion) => (
          <button
            key={opcion}
            onClick={() => setPeriodo(opcion)}
            className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition ${
              periodo === opcion
                ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
            }`}
          >
            {opcion}
          </button>
        ))}
      </div>

      {periodo === 'personalizado' && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="date"
            value={desdeInput}
            onChange={(e) => setDesdeInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <span className="text-xs text-gray-400">a</span>
          <input
            type="date"
            value={hastaInput}
            onChange={(e) => setHastaInput(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      )}

      <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
        {ventasFiltradas.length} venta(s) en el periodo seleccionado.
      </p>

      <div className="mt-3 flex gap-2">
        <button
          onClick={handleExportarCsv}
          disabled={ventasFiltradas.length === 0}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          📄 CSV
        </button>
        <button
          onClick={handleExportarPdf}
          disabled={ventasFiltradas.length === 0}
          className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          📑 PDF
        </button>
      </div>
    </div>
  );
}
