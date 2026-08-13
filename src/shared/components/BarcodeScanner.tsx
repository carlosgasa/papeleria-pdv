import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import type { IScannerControls } from '@zxing/browser';

interface BarcodeScannerProps {
  onDetectado: (codigo: string) => void;
  onCerrar: () => void;
  titulo?: string;
}

type EstadoCamara = 'iniciando' | 'activa' | 'denegada' | 'no-disponible';

export function BarcodeScanner({ onDetectado, onCerrar, titulo = 'Escanear código' }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [estado, setEstado] = useState<EstadoCamara>('iniciando');
  const [codigoManual, setCodigoManual] = useState('');

  useEffect(() => {
    let cancelado = false;
    const lector = new BrowserMultiFormatReader();

    async function iniciar() {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelado) setEstado('no-disponible');
        return;
      }

      try {
        const dispositivos = await BrowserMultiFormatReader.listVideoInputDevices();
        if (dispositivos.length === 0) {
          if (!cancelado) setEstado('no-disponible');
          return;
        }

        const camaraTrasera = dispositivos.find((dispositivo) =>
          /back|trasera|environment/i.test(dispositivo.label),
        );
        const deviceId = camaraTrasera?.deviceId ?? dispositivos[dispositivos.length - 1].deviceId;

        if (!videoRef.current) return;

        const controles = await lector.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (resultado) => {
            if (resultado) {
              onDetectado(resultado.getText());
            }
          },
        );

        if (cancelado) {
          controles.stop();
          return;
        }

        controlsRef.current = controles;
        setEstado('activa');
      } catch {
        if (!cancelado) setEstado('denegada');
      }
    }

    void iniciar();

    return () => {
      cancelado = true;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [onDetectado]);

  function handleSubmitManual(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    const codigo = codigoManual.trim();
    if (codigo) {
      onDetectado(codigo);
      setCodigoManual('');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-4 shadow-xl dark:bg-gray-900 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">{titulo}</h2>
          <button
            onClick={onCerrar}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-900">
          <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
          {estado === 'iniciando' && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-300">
              Solicitando cámara…
            </div>
          )}
          {estado === 'denegada' && (
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-gray-300">
              No se pudo acceder a la cámara. Revisa los permisos o usa la búsqueda manual.
            </div>
          )}
          {estado === 'no-disponible' && (
            <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-gray-300">
              Este dispositivo no tiene cámara disponible. Usa la búsqueda manual.
            </div>
          )}
          {estado === 'activa' && (
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 -translate-y-1/2 bg-red-500/80" />
          )}
        </div>

        <form onSubmit={handleSubmitManual} className="mt-3 flex gap-2">
          <input
            type="text"
            value={codigoManual}
            onChange={(e) => setCodigoManual(e.target.value)}
            placeholder="O escribe el código manualmente"
            className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
          />
          <button
            type="submit"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            Buscar
          </button>
        </form>
      </div>
    </div>
  );
}
