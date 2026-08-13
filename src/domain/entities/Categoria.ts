export interface Categoria {
  id: string;
  nombre: string;
}

export type NuevaCategoria = Omit<Categoria, 'id'>;
