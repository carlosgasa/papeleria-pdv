export interface Producto {
  id: string;
  nombre: string;
  codigoBarras: string | null;
  categoria: string;
  costo: number;
  precioVenta: number;
  stock: number;
  stockMinimo: number;
  imagenUrl: string | null;
  creadoEn: number;
  actualizadoEn: number;
}

export type NuevoProducto = Omit<Producto, 'id' | 'creadoEn' | 'actualizadoEn'>;

export type ActualizacionProducto = Partial<NuevoProducto>;

export function tieneStockBajo(producto: Producto): boolean {
  return producto.stock <= producto.stockMinimo;
}

export function margenGanancia(producto: Producto): number {
  return producto.precioVenta - producto.costo;
}
