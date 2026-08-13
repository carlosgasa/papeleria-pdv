export function cargarImagen(archivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen "${archivo.name}".`));
    img.src = url;
  });
}

/**
 * Recorta y escala una imagen para llenar por completo un rectángulo destino
 * (comportamiento tipo CSS "object-fit: cover"), devolviendo un data URL JPEG.
 */
export function recortarParaLlenar(
  img: HTMLImageElement,
  anchoDestinoPx: number,
  altoDestinoPx: number,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(anchoDestinoPx);
  canvas.height = Math.round(altoDestinoPx);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar el lienzo de recorte.');

  const escala = Math.max(anchoDestinoPx / img.width, altoDestinoPx / img.height);
  const anchoRecorte = anchoDestinoPx / escala;
  const altoRecorte = altoDestinoPx / escala;
  const origenX = (img.width - anchoRecorte) / 2;
  const origenY = (img.height - altoRecorte) / 2;

  ctx.drawImage(img, origenX, origenY, anchoRecorte, altoRecorte, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.92);
}
