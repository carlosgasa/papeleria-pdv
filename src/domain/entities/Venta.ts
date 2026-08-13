export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia' | 'fiado';

export interface ItemVenta {
  productoId: string;
  nombre: string;
  codigoBarras: string | null;
  cantidad: number;
  precioUnitario: number;
  costoUnitario: number;
}

export interface Venta {
  id: string;
  items: ItemVenta[];
  /** Subtotal de los items menos el descuento; es lo que realmente pagó el cliente. */
  total: number;
  /** Monto en pesos descontado del subtotal (0 si no hubo descuento). */
  descuento: number;
  metodoPago: MetodoPago;
  clienteId: string | null;
  usuarioId: string;
  fecha: number;
  anulada: boolean;
  anuladaEn: number | null;
}

export type NuevaVenta = Omit<Venta, 'id' | 'anulada' | 'anuladaEn'>;

export function calcularSubtotal(items: ItemVenta[]): number {
  return items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0);
}

export function calcularGanancia(venta: Venta): number {
  const gananciaBruta = venta.items.reduce(
    (acc, item) => acc + item.cantidad * (item.precioUnitario - item.costoUnitario),
    0,
  );
  return gananciaBruta - venta.descuento;
}
