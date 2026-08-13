export interface Abono {
  id: string;
  clienteId: string;
  monto: number;
  fecha: number;
  usuarioId: string;
}

export type NuevoAbono = Omit<Abono, 'id' | 'fecha'>;
