export interface Inversion {
  id: string;
  concepto: string;
  monto: number;
  categoria: string;
  fecha: number;
  usuarioId: string;
}

export type NuevaInversion = Omit<Inversion, 'id'>;
