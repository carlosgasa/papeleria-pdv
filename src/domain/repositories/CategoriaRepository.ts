import type { Categoria, NuevaCategoria } from '../entities/Categoria';

export interface CategoriaRepository {
  suscribir(callback: (categorias: Categoria[]) => void): () => void;
  crear(categoria: NuevaCategoria): Promise<string>;
  eliminar(id: string): Promise<void>;
}
