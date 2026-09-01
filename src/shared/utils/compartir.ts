import html2canvas from 'html2canvas-pro';

export type ResultadoCompartir = 'compartido' | 'cancelado' | 'copiado' | 'descargado' | 'error';

export async function compartirTexto(texto: string, titulo?: string): Promise<ResultadoCompartir> {
  if (navigator.share) {
    try {
      await navigator.share({ text: texto, title: titulo });
      return 'compartido';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelado';
      // Si el share nativo falla por otra razón, seguimos al respaldo de copiar.
    }
  }

  try {
    await navigator.clipboard.writeText(texto);
    return 'copiado';
  } catch {
    return 'error';
  }
}

export async function compartirImagenDeElemento(
  elemento: HTMLElement,
  nombreArchivo: string,
  titulo?: string,
): Promise<ResultadoCompartir> {
  const canvas = await html2canvas(elemento, { scale: 2, backgroundColor: '#ffffff' });
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) return 'error';

  const archivo = new File([blob], nombreArchivo, { type: 'image/png' });

  if (navigator.canShare?.({ files: [archivo] })) {
    try {
      await navigator.share({ files: [archivo], title: titulo });
      return 'compartido';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelado';
    }
  }

  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
  return 'descargado';
}
