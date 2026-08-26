import { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { compartirImagenDeElemento, compartirTexto } from '../../shared/utils/compartir';

type TipoQr = 'url' | 'whatsapp' | 'texto';

const TIPOS: { valor: TipoQr; etiqueta: string }[] = [
  { valor: 'url', etiqueta: 'Enlace / página' },
  { valor: 'whatsapp', etiqueta: 'WhatsApp' },
  { valor: 'texto', etiqueta: 'Texto libre' },
];

export function QrTab() {
  const [tipo, setTipo] = useState<TipoQr>('url');
  const [url, setUrl] = useState('');
  const [numeroWhatsapp, setNumeroWhatsapp] = useState('');
  const [mensajeWhatsapp, setMensajeWhatsapp] = useState('');
  const [texto, setTexto] = useState('');
  const [etiqueta, setEtiqueta] = useState('');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const contenido = useMemo(() => {
    if (tipo === 'url') return url.trim();
    if (tipo === 'whatsapp') {
      const numero = numeroWhatsapp.replace(/[^0-9]/g, '');
      if (!numero) return '';
      const mensaje = mensajeWhatsapp.trim();
      return `https://wa.me/${numero}${mensaje ? `?text=${encodeURIComponent(mensaje)}` : ''}`;
    }
    return texto.trim();
  }, [tipo, url, numeroWhatsapp, mensajeWhatsapp, texto]);

  useEffect(() => {
    setMensaje(null);
    if (!contenido) {
      setDataUrl(null);
      setError(null);
      return;
    }
    let cancelado = false;
    QRCode.toDataURL(contenido, {
      width: 500,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#111827', light: '#ffffff' },
    })
      .then((url) => {
        if (!cancelado) {
          setDataUrl(url);
          setError(null);
        }
      })
      .catch(() => {
        if (!cancelado) setError('No se pudo generar el código QR.');
      });
    return () => {
      cancelado = true;
    };
  }, [contenido]);

  function descargarPng() {
    if (!dataUrl) return;
    const enlace = document.createElement('a');
    enlace.href = dataUrl;
    enlace.download = 'codigo-qr.png';
    enlace.click();
  }

  async function handleCompartirImagen() {
    if (!previewRef.current) return;
    setMensaje(null);
    setProcesando(true);
    try {
      const resultado = await compartirImagenDeElemento(previewRef.current, 'codigo-qr.png', 'Código QR');
      if (resultado === 'descargado') setMensaje('Imagen descargada.');
      else if (resultado === 'error') setMensaje('No se pudo generar la imagen.');
    } finally {
      setProcesando(false);
    }
  }

  async function handleCompartirTexto() {
    setMensaje(null);
    const resultado = await compartirTexto(contenido, etiqueta.trim() || 'Código QR');
    if (resultado === 'copiado') setMensaje('Contenido copiado — pégalo donde quieras enviarlo.');
    else if (resultado === 'error') setMensaje('No se pudo compartir ni copiar el contenido.');
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Genera un código QR para tu negocio (WhatsApp, redes, un enlace o cualquier texto). Se genera en tu
          dispositivo, sin conexión.
        </p>

        <div className="mt-3 flex flex-wrap gap-1">
          {TIPOS.map((t) => (
            <button
              key={t.valor}
              onClick={() => setTipo(t.valor)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                tipo === t.valor
                  ? 'bg-brand-600 text-white'
                  : 'border border-gray-300 text-gray-600 dark:border-gray-700 dark:text-gray-300'
              }`}
            >
              {t.etiqueta}
            </button>
          ))}
        </div>

        <div className="mt-3 space-y-2">
          {tipo === 'url' && (
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://facebook.com/tunegocio"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
            />
          )}

          {tipo === 'whatsapp' && (
            <>
              <input
                type="text"
                value={numeroWhatsapp}
                onChange={(e) => setNumeroWhatsapp(e.target.value)}
                placeholder="Número con código de país, ej. 5219981234567"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
              />
              <input
                type="text"
                value={mensajeWhatsapp}
                onChange={(e) => setMensajeWhatsapp(e.target.value)}
                placeholder="Mensaje predefinido (opcional)"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
              />
            </>
          )}

          {tipo === 'texto' && (
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe el texto que quieres codificar"
              rows={3}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
            />
          )}

          <input
            type="text"
            value={etiqueta}
            onChange={(e) => setEtiqueta(e.target.value)}
            placeholder="Título para mostrar debajo del QR (opcional)"
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:focus:ring-brand-900"
          />
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-400">{error}</p>
      )}

      {dataUrl && (
        <>
          <div
            ref={previewRef}
            className="mx-auto flex max-w-xs flex-col items-center gap-2 rounded-xl border border-gray-200 p-4 dark:border-gray-800"
            style={{ backgroundColor: '#ffffff' }}
          >
            <img src={dataUrl} alt="Código QR" className="h-48 w-48" />
            {etiqueta.trim() && <p className="text-center text-sm font-medium text-gray-800">{etiqueta.trim()}</p>}
          </div>

          {mensaje && (
            <p className="mx-auto max-w-xs rounded-lg bg-emerald-50 px-3 py-2 text-center text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              {mensaje}
            </p>
          )}

          <div className="mx-auto flex max-w-xs flex-wrap justify-center gap-2">
            <button
              onClick={descargarPng}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              ⬇️ PNG
            </button>
            <button
              onClick={() => void handleCompartirTexto()}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              💬 Texto
            </button>
            <button
              onClick={() => void handleCompartirImagen()}
              disabled={procesando}
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              🖼️ Imagen
            </button>
          </div>
        </>
      )}
    </div>
  );
}
