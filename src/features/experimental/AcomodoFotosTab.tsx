import { useEffect, useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas-pro';
import { PLANTILLAS_FOTO, TAMANOS_HOJA } from './plantillas';
import {
  AJUSTE_RECORTE_DEFECTO,
  cargarImagen,
  estiloRecorte,
  recortarConAjuste,
  type AjusteRecorte,
} from './imageUtils';
import { imprimirPaginas } from './imprimir';
import { AjustarRecorteModal } from './AjustarRecorteModal';
import { CampoNumerico } from '../../shared/components/CampoNumerico';

interface EntradaFoto {
  id: string;
  archivo: File;
  img: HTMLImageElement;
  previewUrl: string;
  copias: number;
  ajuste: AjusteRecorte;
}

const DPI_EXPORTACION = 300;
const CM_A_PULGADA = 2.54;
/** Muchos clientes compran paquetes de 14 fotos tamaño infantil/credencial. */
const COPIAS_INICIALES = 14;

export function AcomodoFotosTab() {
  const [entradas, setEntradas] = useState<EntradaFoto[]>([]);
  const [plantillaId, setPlantillaId] = useState(PLANTILLAS_FOTO[0].id);
  const [anchoPersonalizado, setAnchoPersonalizado] = useState(5);
  const [altoPersonalizado, setAltoPersonalizado] = useState(5);
  const [hojaId, setHojaId] = useState(TAMANOS_HOJA[0].id);
  const [margenCm, setMargenCm] = useState(0.5);
  const [espacioCm, setEspacioCm] = useState(0.2);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState(false);
  const [entradaEditandoId, setEntradaEditandoId] = useState<string | null>(null);
  const paginaRefs = useRef<(HTMLDivElement | null)[]>([]);
  const entradasRef = useRef<EntradaFoto[]>(entradas);
  entradasRef.current = entradas;

  useEffect(() => {
    return () => {
      entradasRef.current.forEach((e) => URL.revokeObjectURL(e.previewUrl));
    };
  }, []);

  const plantilla = useMemo(() => {
    const base = PLANTILLAS_FOTO.find((p) => p.id === plantillaId) ?? PLANTILLAS_FOTO[0];
    if (plantillaId === 'personalizado') {
      return { ...base, anchoCm: anchoPersonalizado, altoCm: altoPersonalizado };
    }
    return base;
  }, [plantillaId, anchoPersonalizado, altoPersonalizado]);

  const hoja = useMemo(() => TAMANOS_HOJA.find((h) => h.id === hojaId) ?? TAMANOS_HOJA[0], [hojaId]);
  const celdaAspecto = useMemo(() => plantilla.anchoCm / plantilla.altoCm, [plantilla]);

  const { columnas, filas, slotsPorHoja } = useMemo(() => {
    const areaAncho = hoja.anchoCm - 2 * margenCm;
    const areaAlto = hoja.altoCm - 2 * margenCm;
    const cols = Math.max(0, Math.floor((areaAncho + espacioCm) / (plantilla.anchoCm + espacioCm)));
    const rows = Math.max(0, Math.floor((areaAlto + espacioCm) / (plantilla.altoCm + espacioCm)));
    return { columnas: cols, filas: rows, slotsPorHoja: cols * rows };
  }, [hoja, margenCm, espacioCm, plantilla]);

  const paginas = useMemo(() => {
    const lista: EntradaFoto[] = [];
    for (const entrada of entradas) {
      for (let i = 0; i < entrada.copias; i++) lista.push(entrada);
    }
    if (slotsPorHoja === 0) return [];
    const resultado: EntradaFoto[][] = [];
    for (let i = 0; i < lista.length; i += slotsPorHoja) {
      resultado.push(lista.slice(i, i + slotsPorHoja));
    }
    return resultado;
  }, [entradas, slotsPorHoja]);

  async function handleAgregarArchivos(archivos: FileList | null) {
    if (!archivos || archivos.length === 0) return;
    setError(null);
    const resultados = await Promise.allSettled(
      Array.from(archivos).map(async (archivo) => {
        const img = await cargarImagen(archivo);
        return {
          id: `${archivo.name}-${Date.now()}-${Math.random()}`,
          archivo,
          img,
          previewUrl: img.src,
          copias: COPIAS_INICIALES,
          ajuste: AJUSTE_RECORTE_DEFECTO,
        } satisfies EntradaFoto;
      }),
    );
    const nuevas = resultados
      .filter((r): r is PromiseFulfilledResult<EntradaFoto> => r.status === 'fulfilled')
      .map((r) => r.value);
    if (nuevas.length > 0) setEntradas((actuales) => [...actuales, ...nuevas]);
    if (resultados.some((r) => r.status === 'rejected')) {
      setError('No se pudieron cargar una o más imágenes.');
    }
  }

  function quitarEntrada(id: string) {
    setEntradas((actuales) => {
      const entrada = actuales.find((e) => e.id === id);
      if (entrada) URL.revokeObjectURL(entrada.previewUrl);
      return actuales.filter((e) => e.id !== id);
    });
  }

  function cambiarCopias(id: string, copias: number) {
    setEntradas((actuales) =>
      actuales.map((e) => (e.id === id ? { ...e, copias: Math.max(1, Math.min(99, copias)) } : e)),
    );
  }

  function actualizarAjuste(id: string, ajuste: AjusteRecorte) {
    setEntradas((actuales) => actuales.map((e) => (e.id === id ? { ...e, ajuste } : e)));
    setEntradaEditandoId(null);
  }

  async function exportarPdf() {
    if (paginas.length === 0) return;
    setExportando(true);
    setError(null);
    try {
      const pdf = new jsPDF({ unit: 'cm', format: [hoja.anchoCm, hoja.altoCm] });
      const anchoPx = Math.round((plantilla.anchoCm / CM_A_PULGADA) * DPI_EXPORTACION);
      const altoPx = Math.round((plantilla.altoCm / CM_A_PULGADA) * DPI_EXPORTACION);

      paginas.forEach((pagina, indicePagina) => {
        if (indicePagina > 0) pdf.addPage([hoja.anchoCm, hoja.altoCm]);
        pagina.forEach((entrada, indiceSlot) => {
          const col = indiceSlot % columnas;
          const fila = Math.floor(indiceSlot / columnas);
          const x = margenCm + col * (plantilla.anchoCm + espacioCm);
          const y = margenCm + fila * (plantilla.altoCm + espacioCm);
          const dataUrl = recortarConAjuste(entrada.img, anchoPx, altoPx, entrada.ajuste);
          pdf.addImage(dataUrl, 'JPEG', x, y, plantilla.anchoCm, plantilla.altoCm);
        });
      });

      pdf.save('acomodo-fotos.pdf');
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

  async function exportarImagenPagina(indice: number) {
    const nodo = paginaRefs.current[indice];
    if (!nodo) return;
    setExportando(true);
    setError(null);
    try {
      const canvas = await html2canvas(nodo, { scale: 3, backgroundColor: '#ffffff' });
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `acomodo-fotos-hoja-${indice + 1}.png`;
        enlace.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch {
      setError('No se pudo generar la imagen.');
    } finally {
      setExportando(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <label className="block cursor-pointer rounded-lg border border-dashed border-gray-300 px-3 py-4 text-center text-sm text-gray-500 hover:border-brand-400 dark:border-gray-700 dark:text-gray-400">
          Agregar fotos (puedes seleccionar varias)
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => void handleAgregarArchivos(e.target.files)}
          />
        </label>

        {entradas.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              ✏️ Ajusta el zoom y encuadre de cada foto — el recorte siempre respeta la proporción del tamaño
              elegido abajo.
            </p>
            {entradas.map((entrada) => (
              <div key={entrada.id} className="flex items-center gap-2 rounded-lg border border-gray-200 p-2 dark:border-gray-800">
                <img src={entrada.previewUrl} alt="" className="h-10 w-10 rounded-md object-cover" />
                <p className="min-w-0 flex-1 truncate text-xs text-gray-600 dark:text-gray-300">{entrada.archivo.name}</p>
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
                <button
                  onClick={() => setEntradaEditandoId(entrada.id)}
                  className="shrink-0 rounded-lg border border-gray-300 px-2 py-1 text-xs text-gray-600 dark:border-gray-700 dark:text-gray-300"
                  title="Ajustar encuadre"
                  aria-label="Ajustar encuadre"
                >
                  ✏️
                </button>
                <button onClick={() => quitarEntrada(entrada.id)} className="text-gray-400 hover:text-red-500" aria-label="Quitar">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Tamaño de foto</label>
          <select
            value={plantillaId}
            onChange={(e) => setPlantillaId(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          >
            {PLANTILLAS_FOTO.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nombre} ({p.anchoCm}×{p.altoCm} cm)
              </option>
            ))}
          </select>
        </div>

        {plantillaId === 'personalizado' && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Ancho (cm)</label>
              <CampoNumerico
                min={1}
                value={anchoPersonalizado}
                onChange={setAnchoPersonalizado}
                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Alto (cm)</label>
              <CampoNumerico
                min={1}
                value={altoPersonalizado}
                onChange={setAltoPersonalizado}
                className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </>
        )}

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
          <CampoNumerico
            min={0}
            value={margenCm}
            onChange={setMargenCm}
            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Espacio (cm)</label>
          <CampoNumerico
            min={0}
            value={espacioCm}
            onChange={setEspacioCm}
            className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400">
        {slotsPorHoja > 0
          ? `${columnas}×${filas} = ${slotsPorHoja} fotos por hoja · ${paginas.length} hoja(s) en total`
          : 'El tamaño de foto elegido no cabe en la hoja con estos márgenes.'}
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
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Hoja {indicePagina + 1} de {paginas.length}
              </p>
              <button
                onClick={() => void exportarImagenPagina(indicePagina)}
                disabled={exportando}
                className="rounded-lg border border-gray-300 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Descargar imagen
              </button>
            </div>
            <div
              ref={(el) => {
                paginaRefs.current[indicePagina] = el;
              }}
              className="mx-auto shadow-sm"
              style={{
                width: '100%',
                maxWidth: 360,
                aspectRatio: `${hoja.anchoCm} / ${hoja.altoCm}`,
                padding: `${(margenCm / hoja.anchoCm) * 100}% ${(margenCm / hoja.anchoCm) * 100}%`,
                boxSizing: 'border-box',
                backgroundColor: '#ffffff',
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
                  <div key={`${entrada.id}-${indiceSlot}`} className="relative h-full w-full overflow-hidden">
                    <img
                      src={entrada.previewUrl}
                      alt=""
                      className="absolute"
                      style={{
                        ...estiloRecorte(entrada.img, celdaAspecto, entrada.ajuste),
                        maxWidth: 'none',
                        maxHeight: 'none',
                      }}
                    />
                  </div>
                ))}
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
              previewUrl={entrada.previewUrl}
              img={entrada.img}
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
