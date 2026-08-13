export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'fiado';

export interface ItemVenta {
  productoId: string;
  nombre: string;
  codigoBarras: string;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
}

export interface Venta {
  id: string;
  items: ItemVenta[];
  total: number;
  metodoPago: MetodoPago;
  clienteId: string | null;
  usuarioId: string;
  fecha: number;
  anulada: boolean;
  anuladaEn: number | null;
}

export type NuevaVenta = Omit<Venta, 'id' | 'anulada' | 'anuladaEn'>;

export function calcularTotal(items: ItemVenta[]): number {
  return items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0);
}

export function calcularGanancia(venta: Venta): number {
  return venta.items.reduce(
    (acc, item) => acc + item.cantidad * (item.precioUnitario - item.costoUnitario),
    0,
  );
}
