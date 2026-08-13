import type { ActualizacionProducto, NuevoProducto, Producto } from '../entities/Producto';

export interface ProductoRepository {
  suscribir(callback: (productos: Producto[]) => void): () => void;
  obtenerPorId(id: string): Promise<Producto | null>;
  buscarPorCodigoBarras(codigoBarras: string): Promise<Producto | null>;
  crear(producto: NuevoProducto): Promise<string>;
  actualizar(id: string, cambios: ActualizacionProducto): Promise<void>;
  eliminar(id: string): Promise<void>;
}
