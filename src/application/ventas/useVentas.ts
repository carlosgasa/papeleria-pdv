import { useEffect, useState } from 'react';
import type { Venta } from '../../domain/entities/Venta';
import { container } from '../../infrastructure/container';

export function useVentas() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const desuscribir = container.ventaRepository.suscribir((datos) => {
      setVentas(datos);
      setCargando(false);
    });
    return desuscribir;
  }, []);

  return { ventas, cargando };
}
