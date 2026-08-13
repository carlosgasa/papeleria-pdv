export type TipoMovimientoStock = 'entrada' | 'salida' | 'venta' | 'anulacion';

export interface MovimientoStock {
  id: string;
  productoId: string;
  productoNombre: string;
  tipo: TipoMovimientoStock;
  cantidad: number;
  stockResultante: number;
  motivo: string | null;
  usuarioId: string;
  fecha: number;
}
