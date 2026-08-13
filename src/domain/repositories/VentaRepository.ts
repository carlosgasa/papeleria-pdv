import type { NuevaVenta, Venta } from '../entities/Venta';

export interface VentaRepository {
  suscribir(callback: (ventas: Venta[]) => void): () => void;
  registrarVenta(venta: NuevaVenta): Promise<string>;
  anularVenta(ventaId: string): Promise<void>;
}
