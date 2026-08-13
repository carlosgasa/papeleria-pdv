import type { Inversion, NuevaInversion } from '../entities/Inversion';

export interface InversionRepository {
  suscribir(callback: (inversiones: Inversion[]) => void): () => void;
  crear(inversion: NuevaInversion): Promise<string>;
  eliminar(id: string): Promise<void>;
}
