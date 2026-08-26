const EMOJIS_POR_PALABRA_CLAVE: [RegExp, string][] = [
  [/papel|cuadern|libreta|hoja|folder|carpeta/i, '📓'],
  [/escritura|pluma|bol[ií]grafo|l[áa]piz|lapicero|marcador|resaltador|corrector/i, '✏️'],
  [/oficina|clip|archiv|engrapa|perfora/i, '📎'],
  [/arte|pintura|manualidad|crayon|acuarela/i, '🎨'],
  [/escolar|mochila|regreso a clases/i, '🎒'],
  [/juguete|juego/i, '🧸'],
  [/tecnolog[ií]a|electr[óo]nico|usb|pila|cable|calculadora/i, '🔌'],
  [/limpieza|higiene/i, '🧼'],
  [/regalo|fiesta|globo|envoltura/i, '🎁'],
  [/libro|revista|lectura/i, '📚'],
  [/tinta|cartucho|t[oó]ner|impres/i, '🖨️'],
  [/adhesivo|cinta|pegamento|silic[oó]n|diurex/i, '🧷'],
  [/tijera|corte|cutter|x-acto/i, '✂️'],
  [/gafete|credencial|etiqueta/i, '🏷️'],
  [/foto|imagen|impresi[oó]n fotogr[áa]fica/i, '🖼️'],
];

const PALETA_RESPALDO = ['🗂️', '📐', '🧮', '🗒️', '🧵', '🔖', '🪁', '🧺', '🧯', '📌'];

/**
 * Asigna un emoji a una categoría de producto: primero intenta una coincidencia
 * temática por palabra clave y, si no reconoce el nombre, cae a una paleta fija
 * elegida por hash — así cada categoría "rara" siempre recibe el mismo emoji.
 */
export function emojiDeCategoria(categoria: string | null | undefined): string {
  const normalizado = categoria?.trim() ?? '';
  if (!normalizado) return '📦';

  for (const [patron, emoji] of EMOJIS_POR_PALABRA_CLAVE) {
    if (patron.test(normalizado)) return emoji;
  }

  let hash = 0;
  for (let i = 0; i < normalizado.length; i++) {
    hash = (hash * 31 + normalizado.charCodeAt(i)) >>> 0;
  }
  return PALETA_RESPALDO[hash % PALETA_RESPALDO.length];
}
