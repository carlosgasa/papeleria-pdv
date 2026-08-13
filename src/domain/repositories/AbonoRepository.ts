import type { Abono, NuevoAbono } from '../entities/Abono';

export interface AbonoRepository {
  suscribir(callback: (abonos: Abono[]) => void): () => void;
  registrar(abono: NuevoAbono): Promise<string>;
}
