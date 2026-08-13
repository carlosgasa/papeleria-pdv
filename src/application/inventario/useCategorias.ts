import { useEffect, useState } from 'react';
import type { Categoria } from '../../domain/entities/Categoria';
import { container } from '../../infrastructure/container';

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const desuscribir = container.categoriaRepository.suscribir((datos) => {
      setCategorias(datos);
      setCargando(false);
    });
    return desuscribir;
  }, []);

  async function crearCategoria(nombre: string): Promise<string> {
    return container.categoriaRepository.crear({ nombre });
  }

  return { categorias, cargando, crearCategoria };
}
