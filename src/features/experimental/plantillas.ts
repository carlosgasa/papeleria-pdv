export interface PlantillaFoto {
  id: string;
  nombre: string;
  anchoCm: number;
  altoCm: number;
}

// Medidas aproximadas de referencia usadas comúnmente en papelerías.
// Verifica siempre el requisito vigente del trámite antes de imprimir.
export const PLANTILLAS_FOTO: PlantillaFoto[] = [
  { id: 'infantil', nombre: 'Infantil', anchoCm: 2.5, altoCm: 3.0 },
  { id: 'credencial', nombre: 'Profesional / Credencial', anchoCm: 3.5, altoCm: 4.5 },
  { id: 'cartilla', nombre: 'Cartilla militar', anchoCm: 2.5, altoCm: 3.0 },
  { id: 'pasaporte', nombre: 'Pasaporte', anchoCm: 3.5, altoCm: 4.5 },
  { id: 'personalizado', nombre: 'Personalizado', anchoCm: 5, altoCm: 5 },
];

export interface TamanoHoja {
  id: string;
  nombre: string;
  anchoCm: number;
  altoCm: number;
}

export const TAMANOS_HOJA: TamanoHoja[] = [
  { id: 'carta', nombre: 'Carta', anchoCm: 21.59, altoCm: 27.94 },
  { id: 'a4', nombre: 'A4', anchoCm: 21.0, altoCm: 29.7 },
];
