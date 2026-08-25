import { useEffect, useMemo, useRef, useState, type DragEvent } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { TAMANOS_HOJA } from './plantillas';
import {
  AJUSTE_RECORTE_DEFECTO,
  ajustarSinRecortar,
  cargarImagen,
  cargarImagenDesdeUrl,
  estiloRecorte,
  recortarConAjuste,
  rotarImagenDataUrl,
  type AjusteRecorte,
  type Rotacion,
} from './imageUtils';
import { imprimirPaginas } from './imprimir';
import { AjustarRecorteModal } from './AjustarRecorteModal';

interface EntradaImagen {
  id: string;
  archivo: File;
  img: HTMLImageElement;
  previewUrl: string;
  ajuste: AjusteRecorte;
  rotacion: Rotacion;
  imgRotada: HTMLImageElement;
  previewUrlRotada: string;
}

const DPI_EXPORTACION = 300;
const CM_A_PULGADA = 2.54;
const ALTO_TITULO_CM = 1.3;
const CUADRICULAS_RAPIDAS = [
  { columnas: 2, filas: 2 },
  { columnas: 3, filas: 3 },
  { columnas: 4, filas: 4 },
  { columnas: 5, filas: 4 },
  { columnas: 4, filas: 5 },
];

export function CuadriculaImagenesTab() {
  const [entradas, setEntradas] = useState<EntradaImagen[]>([]);
  const [columnas, setColumnas] = useState(4);
  const [filas, setFilas] = useState(4);
  const [hojaId, setHojaId] = useState(TAMANOS_HOJA[0].id);
  const [orientacionHoja, setOrientacionHoja] = useState<'vertical' | 'horizontal'>('vertical');
  const [titulo, setTitulo] = useState('');
  const margenCm = 0.5;
  const [espacioCm, setEspacioCm] = useState(0.2);
  const [recortar, setRecortar] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [entradaEditandoId, setEntradaEditandoId] = useState<string | null>(null);
  const paginaRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rotandoRef = useRef<Set<string>>(new Set());
  const entradasRef = useRef<EntradaImagen[]>(entradas);
  entradasRef.current = entradas;

  useEffect(() => {
    return () => {
      entradasRef.current.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    };
  }, []);

  const hoja = useMemo(() => {
    const base = TAMANOS_HOJA.find((h) => h.id === hojaId) ?? TAMANOS_HOJA[0];
    return orientacionHoja === 'horizontal'
      ? { ...base, anchoCm: base.altoCm, altoCm: base.anchoCm }
      : base;
  }, [hojaId, orientacionHoja]);
  const slotsPorHoja = Math.max(1, columnas) * Math.max(1, filas);
  const celdaAspecto = useMemo(() => {
    const areaAncho = hoja.anchoCm - 2 * margenCm - (columnas - 1) * espacioCm;
    const alturaTitulo = titulo.trim() ? ALTO_TITULO_CM : 0;
    const areaAlto = hoja.altoCm - 2 * margenCm - alturaTitulo - (filas - 1) * espacioCm;
    return (areaAncho / columnas) / (areaAlto / filas);
  }, [hoja, columnas, filas, espacioCm, titulo]);

  const paginas = useMemo(() => {
    if (entradas.length === 0) return [];
    const resultado: EntradaImagen[][] = [];
    for (let i = 0; i < entradas.length; i += slotsPorHoja) {
      resultado.push(entradas.slice(i, i + slotsPorHoja));
    }
    return resultado;
  }, [entradas, slotsPorHoja]);

  async function handleAgregarArchivos(archivos: FileList | null) {
    if (!archivos || archivos.length === 0) return;
    setError(null);
    const resultados = await Promise.allSettled(
      Array.from(archivos).map(async (archivo): Promise<EntradaImagen> => {
        const img = await cargarImagen(archivo);
        return {
          id: `${archivo.name}-${Date.now()}-${Math.random()}`,
          archivo,
          img,
          previewUrl: img.src,
          ajuste: AJUSTE_RECORTE_DEFECTO,
          rotacion: 0,
          imgRotada: img,
          previewUrlRotada: img.src,
        };
      }),
    );
    const nuevas = resultados
      .filter((r): r is PromiseFulfilledResult<EntradaImagen> => r.status === 'fulfilled')
      .map((r) => r.value);
    if (nuevas.length > 0) setEntradas((actuales) => [...actuales, ...nuevas]);
    if (resultados.some((r) => r.status === 'rejected')) {
      setError('No se pudieron cargar una o más imágenes.');
    }
  }

  function handleDrop(evento: DragEvent<HTMLLabelElement>) {
    evento.preventDefault();
    void handleAgregarArchivos(evento.dataTransfer.files);
  }

  function quitarEntrada(id: string) {
    setEntradas((actuales) => {
      const entrada = actuales.find((e) => e.id === id);
      if (entrada) URL.revokeObjectURL(entrada.previewUrl);
      return actuales.filter((e) => e.id !== id);
    });
  }

  function limpiarTodo() {
    entradas.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    setEntradas([]);
  }

  function actualizarAjuste(id: string, ajuste: AjusteRecorte) {
    setEntradas((actuales) => actuales.map((e) => (e.id === id ? { ...e, ajuste } : e)));
    setEntradaEditandoId(null);
  }

  async function rotarEntrada(id: string) {
    if (rotandoRef.current.has(id)) return;
    const entrada = entradas.find((e) => e.id === id);
    if (!entrada) return;
    rotandoRef.current.add(id);
    const nuevaRotacion = ((entrada.rotacion + 90) % 360) as Rotacion;
    try {
      if (nuevaRotacion === 0) {
        setEntradas((actuales) =>
          actuales.map((e) =>
            e.id === id
              ? { ...e, rotacion: 0, imgRotada: e.img, previewUrlRotada: e.previewUrl, ajuste: AJUSTE_RECORTE_DEFECTO }
              : e,
          ),
        );
        return;
      }
      const dataUrl = rotarImagenDataUrl(entrada.img, nuevaRotacion);
      const imgRotada = await cargarImagenDesdeUrl(dataUrl);
      setEntradas((actuales) =>
        actuales.map((e) =>
          e.id === id
            ? { ...e, rotacion: nuevaRotacion, imgRotada, previewUrlRotada: dataUrl, ajuste: AJUSTE_RECORTE_DEFECTO }
            : e,
        ),
      );
    } catch {
      setError('No se pudo girar la imagen.');
    } finally {
      rotandoRef.current.delete(id);
    }
  }

  function calcularCeldas() {
    const areaAncho = hoja.anchoCm - 2 * margenCm;
    const alturaTitulo = titulo.trim() ? ALTO_TITULO_CM : 0;
    const areaAlto = hoja.altoCm - 2 * margenCm - alturaTitulo;
    const celdaAncho = (areaAncho - (columnas - 1) * espacioCm) / columnas;
    const celdaAlto = (areaAlto - (filas - 1) * espacioCm) / filas;
    return { areaAncho, areaAlto, alturaTitulo, celdaAncho, celdaAlto };
  }

  async function exportarPdf() {
    if (paginas.length === 0) return;
    setExportando(true);
    setError(null);
    try {
      const { celdaAncho, celdaAlto, alturaTitulo } = calcularCeldas();
      const pdf = new jsPDF({ unit: 'cm', format: [hoja.anchoCm, hoja.altoCm] });
      const anchoPx = Math.round((celdaAncho / CM_A_PULGADA) * DPI_EXPORTACION);
      const altoPx = Math.round((celdaAlto / CM_A_PULGADA) * DPI_EXPORTACION);

      paginas.forEach((pagina, indicePagina) => {
        if (indicePagina > 0) pdf.addPage([hoja.anchoCm, hoja.altoCm]);

        if (titulo.trim()) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(titulo.trim(), hoja.anchoCm / 2, margenCm + 0.7, { align: 'center' });
        }

        pagina.forEach((entrada, indiceSlot) => {
          const col = indiceSlot % columnas;
          const fila = Math.floor(indiceSlot / columnas);
          const x = margenCm + col * (celdaAncho + espacioCm);
          const y = margenCm + alturaTitulo + fila * (celdaAlto + espacioCm);

          if (recortar) {
            const dataUrl = recortarConAjuste(entrada.imgRotada, anchoPx, altoPx, entrada.ajuste);
            pdf.addImage(dataUrl, 'JPEG', x, y, celdaAncho, celdaAlto);
          } else {
            const ajustada = ajustarSinRecortar(entrada.imgRotada, anchoPx, altoPx);
            const anchoImgCm = (ajustada.anchoPx / DPI_EXPORTACION) * CM_A_PULGADA;
            const altoImgCm = (ajustada.altoPx / DPI_EXPORTACION) * CM_A_PULGADA;
            const offsetX = (celdaAncho - anchoImgCm) / 2;
            const offsetY = (celdaAlto - altoImgCm) / 2;
            pdf.addImage(ajustada.dataUrl, 'JPEG', x + offsetX, y + offsetY, anchoImgCm, altoImgCm);
          }
        });
      });

      pdf.save('cuadricula-imagenes.pdf');
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
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="block cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-6 text-center text-sm text-gray-500 hover:border-brand-400 dark:border-gray-700 dark:text-gray-400"
        >
          Arrastra imágenes aquí o haz clic para elegirlas (cualquier cantidad)
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleAgregarArchivos(e.target.files)}
          />
        </label>

        {entradas.length > 0 && (
          <>
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-gray-500 dark:text-gray-400">{entradas.length} imagen(es)</p>
              <button
                onClick={limpiarTodo}
                className="text-xs font-medium text-red-600 hover:underline dark:text-red-400"
              >
                Quitar todas
              </button>
            </div>
            <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {entradas.map((entrada) => (
                <div key={entrada.id} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                  <img src={entrada.previewUrlRotada} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => void rotarEntrada(entrada.id)}
                    className="absolute bottom-1 left-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    aria-label="Girar"
                    title="Girar 90°"
                  >
                    ↻
                  </button>
                  <button
                    onClick={() => quitarEntrada(entrada.id)}
                    className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-xs text-white opacity-0 transition group-hover:opacity-100"
                    aria-label="Quitar"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
          Título (opcional, aparece arriba de cada hoja)
        </label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          placeholder="Ej. Fotos del evento"
          className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
        />

        <div className="mt-3">
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Cuadrícula rápida</label>
          <div className="flex flex-wrap gap-1.5">
            {CUADRICULAS_RAPIDAS.map((c) => (
              <button
                key={`${c.columnas}x${c.filas}`}
                onClick={() => {
                  setColumnas(c.columnas);
                  setFilas(c.filas);
                }}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  columnas === c.columnas && filas === c.filas
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'border-gray-200 text-gray-600 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                {c.columnas}×{c.filas}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Columnas</label>
            <input
              type="number"
              min="1"
              max="10"
              value={columnas}
              onChange={(e) => setColumnas(Math.max(1, Math.min(10, Number(e.target.value))))}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Filas</label>
            <input
              type="number"
              min="1"
              max="10"
              value={filas}
              onChange={(e) => setFilas(Math.max(1, Math.min(10, Number(e.target.value))))}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
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
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Orientación de la hoja</label>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setOrientacionHoja('vertical')}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                  orientacionHoja === 'vertical'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                ↕️ Vertical
              </button>
              <button
                type="button"
                onClick={() => setOrientacionHoja('horizontal')}
                className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                  orientacionHoja === 'horizontal'
                    ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950 dark:text-brand-300'
                    : 'border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300'
                }`}
              >
                ↔️ Horizontal
              </button>
            </div>
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

        <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 dark:border-gray-800">
          <div>
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">Recortar para llenar la celda</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {recortar
                ? 'La foto llena la celda completa; se recorta lo que sobre.'
                : 'Se ve la foto completa, sin recortar; puede dejar espacio en blanco.'}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={recortar}
            onClick={() => setRecortar((actual) => !actual)}
            className={`relative h-6 w-11 shrink-0 rounded-full transition ${
              recortar ? 'bg-brand-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
                recortar ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {columnas}×{filas} = {slotsPorHoja} imágenes por hoja · {paginas.length} hoja(s) en total
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
              className="mx-auto flex flex-col shadow-sm"
              style={{
                width: '100%',
                maxWidth: 360,
                aspectRatio: `${hoja.anchoCm} / ${hoja.altoCm}`,
                padding: `${(margenCm / hoja.anchoCm) * 100}% ${(margenCm / hoja.anchoCm) * 100}%`,
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
              }}
            >
              {titulo.trim() && (
                <p className="mb-1 shrink-0 text-center text-xs font-semibold text-gray-900 sm:text-sm">
                  {titulo.trim()}
                </p>
              )}
              <div
                className="grid min-h-0 flex-1"
                style={{
                  gridTemplateColumns: `repeat(${columnas}, 1fr)`,
                  gridTemplateRows: `repeat(${filas}, 1fr)`,
                  gap: `${(espacioCm / hoja.altoCm) * 100}% ${(espacioCm / hoja.anchoCm) * 100}%`,
                }}
              >
                {pagina.map((entrada, indiceSlot) =>
                  recortar ? (
                    <div
                      key={`${entrada.id}-${indiceSlot}`}
                      className="group relative h-full w-full overflow-hidden"
                      style={{ backgroundColor: '#ffffff' }}
                    >
                      <img
                        src={entrada.previewUrlRotada}
                        alt=""
                        className="absolute"
                        style={{
                          ...estiloRecorte(entrada.imgRotada, celdaAspecto, entrada.ajuste),
                          maxWidth: 'none',
                          maxHeight: 'none',
                        }}
                      />
                      <button
                        onClick={() => void rotarEntrada(entrada.id)}
                        className="absolute bottom-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-[10px] text-white opacity-70 transition hover:opacity-100 sm:h-6 sm:w-6 sm:text-xs"
                        aria-label="Girar"
                        title="Girar 90°"
                      >
                        ↻
                      </button>
                      <button
                        onClick={() => setEntradaEditandoId(entrada.id)}
                        className="absolute bottom-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-[10px] text-white opacity-70 transition hover:opacity-100 sm:h-6 sm:w-6 sm:text-xs"
                        aria-label="Ajustar recorte"
                        title="Ajustar recorte"
                      >
                        ✏️
                      </button>
                    </div>
                  ) : (
                    <div
                      key={`${entrada.id}-${indiceSlot}`}
                      className="group relative h-full w-full"
                      style={{ backgroundColor: '#ffffff' }}
                    >
                      <img
                        src={entrada.previewUrlRotada}
                        alt=""
                        className="h-full w-full object-contain"
                      />
                      <button
                        onClick={() => void rotarEntrada(entrada.id)}
                        className="absolute bottom-0.5 left-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/50 text-[10px] text-white opacity-70 transition hover:opacity-100 sm:h-6 sm:w-6 sm:text-xs"
                        aria-label="Girar"
                        title="Girar 90°"
                      >
                        ↻
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {entradaEditandoId &&
        (() => {
          const entrada = entradas.find((e) => e.id === entradaEditandoId);
          if (!entrada) return null;
          return (
            <AjustarRecorteModal
              previewUrl={entrada.previewUrlRotada}
              img={entrada.imgRotada}
              celdaAspecto={celdaAspecto}
              ajusteInicial={entrada.ajuste}
              onGuardar={(ajuste) => actualizarAjuste(entrada.id, ajuste)}
              onCerrar={() => setEntradaEditandoId(null)}
            />
          );
        })()}
    </div>
  );
}
