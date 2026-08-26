import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { estiloRecorte, type AjusteRecorte } from './imageUtils';

interface AjustarRecorteModalProps {
  previewUrl: string;
  img: HTMLImageElement;
  celdaAspecto: number;
  ajusteInicial: AjusteRecorte;
  onGuardar: (ajuste: AjusteRecorte) => void;
  onCerrar: () => void;
}

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;

export function AjustarRecorteModal({
  previewUrl,
  img,
  celdaAspecto,
  ajusteInicial,
  onGuardar,
  onCerrar,
}: AjustarRecorteModalProps) {
  const [ajuste, setAjuste] = useState<AjusteRecorte>(ajusteInicial);
  const contenedorRef = useRef<HTMLDivElement>(null);
  const arrastreRef = useRef<{ x: number; y: number; posX: number; posY: number } | null>(null);

  const estilo = estiloRecorte(img, celdaAspecto, ajuste);

  function handlePointerDown(evento: ReactPointerEvent<HTMLDivElement>) {
    try {
      (evento.target as HTMLElement).setPointerCapture(evento.pointerId);
    } catch {
      // Algunos navegadores móviles pueden rechazar la captura de puntero;
      // el arrastre sigue funcionando igual sin ella.
    }
    arrastreRef.current = { x: evento.clientX, y: evento.clientY, posX: ajuste.posX, posY: ajuste.posY };
  }

  function handlePointerMove(evento: ReactPointerEvent<HTMLDivElement>) {
    if (!arrastreRef.current || !contenedorRef.current) return;
    const rect = contenedorRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const deltaXPct = ((evento.clientX - arrastreRef.current.x) / rect.width) * 100;
    const deltaYPct = ((evento.clientY - arrastreRef.current.y) / rect.height) * 100;

    setAjuste((actual) => {
      // Recalculado a partir del zoom más reciente (no del `estilo` cerrado en el
      // render que arrancó el arrastre), para que un cambio de zoom justo antes
      // de arrastrar no deje el cálculo de exceso desfasado.
      const estiloActual = estiloRecorte(img, celdaAspecto, actual);
      const excesoAncho = Number(estiloActual.width.replace('%', '')) - 100;
      const excesoAlto = Number(estiloActual.height.replace('%', '')) - 100;
      const nuevoPosX =
        excesoAncho > 0 ? arrastreRef.current!.posX - deltaXPct / excesoAncho : actual.posX;
      const nuevoPosY =
        excesoAlto > 0 ? arrastreRef.current!.posY - deltaYPct / excesoAlto : actual.posY;
      return {
        ...actual,
        posX: Math.min(1, Math.max(0, nuevoPosX)),
        posY: Math.min(1, Math.max(0, nuevoPosY)),
      };
    });
  }

  function handlePointerUp() {
    arrastreRef.current = null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-5 shadow-xl dark:bg-gray-900 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-50">Ajustar recorte</h2>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">Arrastra la foto para moverla dentro del marco.</p>

        <div
          ref={contenedorRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="relative mx-auto touch-none select-none overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
          style={{ width: '100%', aspectRatio: `${celdaAspecto}` }}
        >
          <img
            src={previewUrl}
            alt=""
            draggable={false}
            className="pointer-events-none absolute"
            style={{ ...estilo, maxWidth: 'none', maxHeight: 'none' }}
          />
        </div>

        <div className="mt-4">
          <label className="mb-1 flex items-center justify-between text-xs font-medium text-gray-700 dark:text-gray-300">
            <span>Zoom</span>
            <span>{ajuste.zoom.toFixed(1)}×</span>
          </label>
          <input
            type="range"
            min={ZOOM_MIN}
            max={ZOOM_MAX}
            step={0.1}
            value={ajuste.zoom}
            onChange={(e) => setAjuste((actual) => ({ ...actual, zoom: Number(e.target.value) }))}
            className="w-full"
          />
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => setAjuste({ zoom: 1, posX: 0.5, posY: 0.5 })}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            Restablecer
          </button>
          <button
            type="button"
            onClick={() => onGuardar(ajuste)}
            className="flex-1 rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
}
