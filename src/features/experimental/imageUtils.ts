export function cargarImagen(archivo: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`No se pudo cargar la imagen "${archivo.name}".`));
    };
    img.src = url;
  });
}

export type Rotacion = 0 | 90 | 180 | 270;

/**
 * Dibuja la imagen rotada (múltiplos de 90°) sobre un canvas y devuelve el
 * data URL resultante. Siempre parte de la imagen original, no de una ya
 * rotada, para no perder calidad al girar varias veces.
 */
export function rotarImagenDataUrl(img: HTMLImageElement, rotacion: Rotacion): string {
  const intercambiar = rotacion === 90 || rotacion === 270;
  const width = intercambiar ? img.height : img.width;
  const height = intercambiar ? img.width : img.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No se pudo preparar el lienzo de rotación.');
  ctx.translate(width / 2, height / 2);
  ctx.rotate((rotacion * Math.PI) / 180);
  ctx.drawImage(img, -img.width / 2, -img.height / 2);
  return canvas.toDataURL('image/png');
}

export function cargarImagenDesdeUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo procesar la imagen rotada.'));
    img.src = url;
  });
}

export interface AjusteRecorte {
  zoom: number;
  posX: number;
  posY: number;
}

export const AJUSTE_RECORTE_DEFECTO: AjusteRecorte = { zoom: 1, posX: 0.5, posY: 0.5 };

/**
 * Recorta y escala una imagen dentro de un rectángulo destino, permitiendo
 * alejar/acercar y elegir qué parte de la imagen queda visible (posX/posY de
 * 0 a 1, 0.5 = centrado). Con zoom=1 se comporta como CSS "object-fit: cover"
 * (llena el rectángulo por completo). Con zoom < 1 la imagen se ve completa y
 * más chica, con margen blanco alrededor (no se puede mover en ese caso, ya
 * que no sobra imagen para desplazar). Reutiliza la misma matemática que
 * estiloRecorte (la vista previa en CSS) para que el recorte final coincida
 * exactamente con lo que se veía.
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

  // JPEG no soporta transparencia: con zoom < 1 sobra espacio alrededor de la
  // imagen (letterbox) que debe rellenarse de blanco, no quedar en negro.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const celdaAspecto = anchoDestinoPx / altoDestinoPx;
  const estilo = estiloRecorte(img, celdaAspecto, ajuste);
  const anchoDibujo = (parseFloat(estilo.width) / 100) * canvas.width;
  const altoDibujo = (parseFloat(estilo.height) / 100) * canvas.height;
  const xDibujo = (parseFloat(estilo.left) / 100) * canvas.width;
  const yDibujo = (parseFloat(estilo.top) / 100) * canvas.height;

  ctx.drawImage(img, 0, 0, img.width, img.height, xDibujo, yDibujo, anchoDibujo, altoDibujo);
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
  // Piso de seguridad muy bajo (no 1): con zoom < 1 la foto se ve completa y
  // más chica dentro del marco, con margen alrededor — es la "reducción" que
  // complementa el acercamiento (zoom > 1).
  const zoom = Math.max(0.1, ajuste.zoom);
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
