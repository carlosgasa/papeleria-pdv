export interface Cliente {
  id: string;
  nombre: string;
  telefono: string | null;
  notas: string | null;
  creadoEn: number;
}

export type NuevoCliente = Omit<Cliente, 'id' | 'creadoEn'>;

export type ActualizacionCliente = Partial<NuevoCliente>;
