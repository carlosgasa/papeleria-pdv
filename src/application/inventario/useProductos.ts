import { useEffect, useState } from 'react';
import type { Producto } from '../../domain/entities/Producto';
import { container } from '../../infrastructure/container';

export function useProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const desuscribir = container.productoRepository.suscribir((datos) => {
      setProductos(datos);
      setCargando(false);
    });
    return desuscribir;
  }, []);

  return { productos, cargando };
}
