import { useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { PLANTILLAS_ETIQUETA, TAMANOS_HOJA } from './plantillas';
import { imprimirPaginas } from './imprimir';

interface EntradaGafete {
  id: string;
  nombre: string;
  escuela: string;
  grado: string;
  copias: number;
}

const COPIAS_INICIALES = 10;

function nuevoId(): string {
  return `${Date.now()}-${Math.random()}`;
}

export function GafetesTab() {
  const [entradas, setEntradas] = useState<EntradaGafete[]>([]);
  const [nombre, setNombre] = useState('');
  const [escuela, setEscuela] = useState('');
  const [grado, setGrado] = useState('');
  const [plantillaId, setPlantillaId] = useState(PLANTILLAS_ETIQUETA[0].id);
  const [hojaId, setHojaId] = useState(TAMANOS_HOJA[0].id);
  const [margenCm, setMargenCm] = useState(0.5);
  const [espacioCm, setEspacioCm] = useState(0.3);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const paginaRefs = useRef<(HTMLDivElement | null)[]>([]);

  const plantilla = useMemo(
    () => PLANTILLAS_ETIQUETA.find((p) => p.id === plantillaId) ?? PLANTILLAS_ETIQUETA[0],
    [plantillaId],
  );
  const hoja = useMemo(() => TAMANOS_HOJA.find((h) => h.id === hojaId) ?? TAMANOS_HOJA[0], [hojaId]);

  const { columnas, filas, slotsPorHoja } = useMemo(() => {
    const areaAncho = hoja.anchoCm - 2 * margenCm;
    const areaAlto = hoja.altoCm - 2 * margenCm;
    const cols = Math.max(0, Math.floor((areaAncho + espacioCm) / (plantilla.anchoCm + espacioCm)));
    const rows = Math.max(0, Math.floor((areaAlto + espacioCm) / (plantilla.altoCm + espacioCm)));
    return { columnas: cols, filas: rows, slotsPorHoja: cols * rows };
  }, [hoja, margenCm, espacioCm, plantilla]);

  const paginas = useMemo(() => {
    const lista: EntradaGafete[] = [];
    for (const entrada of entradas) {
      for (let i = 0; i < entrada.copias; i++) lista.push(entrada);
    }
    if (slotsPorHoja === 0) return [];
    const resultado: EntradaGafete[][] = [];
    for (let i = 0; i < lista.length; i += slotsPorHoja) {
      resultado.push(lista.slice(i, i + slotsPorHoja));
    }
    return resultado;
  }, [entradas, slotsPorHoja]);

  function agregarEntrada() {
    if (!nombre.trim()) return;
    setEntradas((actuales) => [
      ...actuales,
      { id: nuevoId(), nombre: nombre.trim(), escuela: escuela.trim(), grado: grado.trim(), copias: COPIAS_INICIALES },
    ]);
    setNombre('');
    setEscuela('');
    setGrado('');
  }

  function quitarEntrada(id: string) {
    setEntradas((actuales) => actuales.filter((e) => e.id !== id));
  }

  function cambiarCopias(id: string, copias: number) {
    setEntradas((actuales) =>
      actuales.map((e) => (e.id === id ? { ...e, copias: Math.max(1, Math.min(99, copias)) } : e)),
    );
  }

  async function exportarPdf() {
    if (paginas.length === 0) return;
    setExportando(true);
    setError(null);
    try {
      const pdf = new jsPDF({ unit: 'cm', format: [hoja.anchoCm, hoja.altoCm] });
      const fontNombre = Math.max(8, Math.min(24, plantilla.altoCm * 5.5));
      const fontSub = Math.max(6, Math.min(14, plantilla.altoCm * 3));

      paginas.forEach((pagina, indicePagina) => {
        if (indicePagina > 0) pdf.addPage([hoja.anchoCm, hoja.altoCm]);
        pagina.forEach((entrada, indiceSlot) => {
          const col = indiceSlot % columnas;
          const fila = Math.floor(indiceSlot / columnas);
          const x = margenCm + col * (plantilla.anchoCm + espacioCm);
          const y = margenCm + fila * (plantilla.altoCm + espacioCm);
          const cx = x + plantilla.anchoCm / 2;
          const anchoTexto = plantilla.anchoCm - 0.4;

          pdf.setDrawColor(200);
          pdf.rect(x, y, plantilla.anchoCm, plantilla.altoCm);

          const sub = [entrada.escuela, entrada.grado].filter(Boolean).join(' · ');
          pdf.setTextColor(20);
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(fontNombre);
          if (sub) {
            pdf.text(entrada.nombre, cx, y + plantilla.altoCm * 0.42, { align: 'center', maxWidth: anchoTexto });
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(fontSub);
            pdf.text(sub, cx, y + plantilla.altoCm * 0.68, { align: 'center', maxWidth: anchoTexto });
          } else {
            pdf.text(entrada.nombre, cx, y + plantilla.altoCm / 2, {
              align: 'center',
              baseline: 'middle',
              maxWidth: anchoTexto,
            });
          }
        });
      });

      pdf.save('gafetes.pdf');
    } catch {
      setError('No se pudo generar el PDF.');
    } finally {
      setExportando(false);
    }
  }

  async function handleImprimir() {
    if (paginaRefs.current.length === 0) return;
    setExportando(true);
    setError(null);
    try {
      const nodos = paginaRefs.current.filter((nodo): nodo is HTMLDivElement => nodo !== null);
      const paginasImprimibles = await Promise.all(
        nodos.map(async (nodo) => {
          const canvas = await html2canvas(nodo, { scale: 3, backgroundColor: '#ffffff' });
          return { dataUrl: canvas.toDataURL('image/png') };
        }),
      );
      imprimirPaginas(paginasImprimibles, hoja.anchoCm, hoja.altoCm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo preparar la impresión.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Etiquetas y gafetes con nombre para regreso a clases. Agrega cada nombre una vez y define cuántas copias
          necesitas (ej. una por cuaderno).
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && agregarEntrada()}
            placeholder="Nombre"
            className="col-span-2 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 md:col-span-1"
          />
          <input
            type="text"
            value={escuela}
            onChange={(e) => setEscuela(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && agregarEntrada()}
            placeholder="Escuela (opcional)"
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <input
            type="text"
            value={grado}
            onChange={(e) => setGrado(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && agregarEntrada()}
            placeholder="Grado/grupo (opcional)"
            className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          <button
            onClick={agregarEntrada}
            disabled={!nombre.trim()}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            + Agregar
          </button>
        </div>

        {entradas.length > 0 && (
          <div className="mt-3 space-y-2">
            {entradas.map((entrada) => (
              <div key={entrada.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-800">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-gray-800 dark:text-gray-200">{entrada.nombre}</p>
                  {(entrada.escuela || entrada.grado) && (
                    <p className="truncate text-[11px] text-gray-500 dark:text-gray-400">
                      {[entrada.escuela, entrada.grado].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => cambiarCopias(entrada.id, entrada.copias - 1)}
                    className="h-6 w-6 rounded-full border border-gray-300 text-xs dark:border-gray-700"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-xs">{entrada.copias}</span>
                  <button
                    onClick={() => cambiarCopias(entrada.id, entrada.copias + 1)}
                    className="h-6 w-6 rounded-full border border-gray-300 text-xs dark:border-gray-700"
                  >
                    +
                  </button>
                </div>
                <button onClick={() => quitarEntrada(entrada.id)} className="text-gray-400 hover:text-red-500" aria-label="Quitar">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:grid-cols-4">
        <div className="col-span-2 md:col-span-2">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Tamaño de etiqueta</label>
          <select
            value={plantillaId}
            onChange={(e) => setPlantillaId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {PLANTILLAS_ETIQUETA.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Hoja</label>
          <select
            value={hojaId}
            onChange={(e) => setHojaId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {TAMANOS_HOJA.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nombre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Margen (cm)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={margenCm}
            onChange={(e) => setMargenCm(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Espacio (cm)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={espacioCm}
            onChange={(e) => setEspacioCm(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {slotsPorHoja > 0
          ? `${columnas}×${filas} = ${slotsPorHoja} etiquetas por hoja · ${paginas.length} hoja(s) en total`
          : 'El tamaño elegido no cabe en la hoja con estos márgenes.'}
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      {paginas.length > 0 && (
        <div className="flex justify-end gap-2">
          <button
            onClick={() => void handleImprimir()}
            disabled={exportando}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            🖨️ Imprimir
          </button>
          <button
            onClick={() => void exportarPdf()}
            disabled={exportando}
            className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {exportando ? 'Generando…' : 'Descargar PDF'}
          </button>
        </div>
      )}

      <div className="space-y-4">
        {paginas.map((pagina, indicePagina) => (
          <div key={indicePagina} className="space-y-2">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Hoja {indicePagina + 1} de {paginas.length}
            </p>
            <div
              ref={(el) => {
                paginaRefs.current[indicePagina] = el;
              }}
              className="mx-auto bg-white shadow-sm"
              style={{
                width: '100%',
                maxWidth: 360,
                aspectRatio: `${hoja.anchoCm} / ${hoja.altoCm}`,
                padding: `${(margenCm / hoja.altoCm) * 100}% ${(margenCm / hoja.anchoCm) * 100}%`,
                boxSizing: 'border-box',
              }}
            >
              <div
                className="grid h-full w-full"
                style={{
                  gridTemplateColumns: `repeat(${columnas}, 1fr)`,
                  gridTemplateRows: `repeat(${filas}, 1fr)`,
                  gap: `${(espacioCm / hoja.altoCm) * 100}% ${(espacioCm / hoja.anchoCm) * 100}%`,
                }}
              >
                {pagina.map((entrada, indiceSlot) => (
                  <div
                    key={`${entrada.id}-${indiceSlot}`}
                    className="flex h-full w-full flex-col items-center justify-center gap-0.5 overflow-hidden border border-gray-300 px-1 text-center"
                  >
                    <p className="truncate text-[10px] font-bold leading-tight text-gray-900 sm:text-xs">{entrada.nombre}</p>
                    {(entrada.escuela || entrada.grado) && (
                      <p className="truncate text-[7px] leading-tight text-gray-500 sm:text-[9px]">
                        {[entrada.escuela, entrada.grado].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
