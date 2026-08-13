import type { MovimientoStock } from '../entities/MovimientoStock';

export interface NuevoAjusteStock {
  productoId: string;
  tipo: 'entrada' | 'salida';
  cantidad: number;
  motivo: string | null;
  usuarioId: string;
}

export interface MovimientoStockRepository {
  suscribir(callback: (movimientos: MovimientoStock[]) => void): () => void;
  registrarAjuste(ajuste: NuevoAjusteStock): Promise<void>;
}
