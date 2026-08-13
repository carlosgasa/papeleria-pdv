import { useEffect, useState } from 'react';
import type { MovimientoStock } from '../../domain/entities/MovimientoStock';
import { container } from '../../infrastructure/container';

export function useMovimientosStock() {
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const desuscribir = container.movimientoStockRepository.suscribir((datos) => {
      setMovimientos(datos);
      setCargando(false);
    });
    return desuscribir;
  }, []);

  return { movimientos, cargando };
}
