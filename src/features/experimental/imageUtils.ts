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

export interface AjusteRecorte {
  zoom: number;
  posX: number;
  posY: number;
}

export const AJUSTE_RECORTE_DEFECTO: AjusteRecorte = { zoom: 1, posX: 0.5, posY: 0.5 };

/**
 * Igual que recortarParaLlenar, pero permite alejar/acercar (zoom ≥ 1) y elegir
 * qué parte de la imagen queda visible (posX/posY de 0 a 1, 0.5 = centrado).
 * Con zoom=1 y posX=posY=0.5 el resultado es idéntico a recortarParaLlenar.
 */
export function recortarConAjuste(
  img: HTMLImageElement,
  anchoDestinoPx: number,
  altoDestinoPx: number,
  ajuste: AjusteRecorte,
): string {
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(anchoDestinoPx);
  canvas.height = Math.round(altoDestinoPx);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar el lienzo de recorte.');

  const escalaBase = Math.max(anchoDestinoPx / img.width, altoDestinoPx / img.height);
  const escala = escalaBase * Math.max(1, ajuste.zoom);
  const anchoRecorte = anchoDestinoPx / escala;
  const altoRecorte = altoDestinoPx / escala;
  const maxOrigenX = Math.max(0, img.width - anchoRecorte);
  const maxOrigenY = Math.max(0, img.height - altoRecorte);
  const origenX = maxOrigenX * Math.min(1, Math.max(0, ajuste.posX));
  const origenY = maxOrigenY * Math.min(1, Math.max(0, ajuste.posY));

  ctx.drawImage(img, origenX, origenY, anchoRecorte, altoRecorte, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.92);
}

/**
 * Calcula el estilo (posición absoluta en %) para mostrar una imagen dentro de
 * un contenedor con overflow:hidden replicando recortarConAjuste, sin
 * necesitar medir el contenedor en píxeles (todo en porcentajes).
 */
export function estiloRecorte(
  img: HTMLImageElement,
  celdaAspecto: number,
  ajuste: AjusteRecorte,
): { width: string; height: string; left: string; top: string } {
  const imgAspecto = img.width / img.height;
  let anchoPct: number;
  let altoPct: number;
  if (imgAspecto >= celdaAspecto) {
    altoPct = 100;
    anchoPct = 100 * (imgAspecto / celdaAspecto);
  } else {
    anchoPct = 100;
    altoPct = 100 * (celdaAspecto / imgAspecto);
  }
  const zoom = Math.max(1, ajuste.zoom);
  anchoPct *= zoom;
  altoPct *= zoom;
  const excesoAncho = anchoPct - 100;
  const excesoAlto = altoPct - 100;
  const posX = Math.min(1, Math.max(0, ajuste.posX));
  const posY = Math.min(1, Math.max(0, ajuste.posY));

  return {
    width: `${anchoPct}%`,
    height: `${altoPct}%`,
    left: `${-excesoAncho * posX}%`,
    top: `${-excesoAlto * posY}%`,
  };
}

/**
 * Escala una imagen para que quepa completa dentro de un rectángulo destino
 * sin recortarla ni deformarla (tipo CSS "object-fit: contain"). Devuelve el
 * data URL y el tamaño real dibujado (menor o igual al destino) para que el
 * llamador la pueda centrar.
 */
export function ajustarSinRecortar(
  img: HTMLImageElement,
  anchoMaxPx: number,
  altoMaxPx: number,
): { dataUrl: string; anchoPx: number; altoPx: number } {
  const escala = Math.min(anchoMaxPx / img.width, altoMaxPx / img.height);
  const anchoPx = Math.max(1, Math.round(img.width * escala));
  const altoPx = Math.max(1, Math.round(img.height * escala));

  const canvas = document.createElement('canvas');
  canvas.width = anchoPx;
  canvas.height = altoPx;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar el lienzo de ajuste.');

  ctx.drawImage(img, 0, 0, anchoPx, altoPx);
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.92), anchoPx, altoPx };
}
