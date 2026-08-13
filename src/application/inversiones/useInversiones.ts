import { useEffect, useState } from 'react';
import type { Inversion } from '../../domain/entities/Inversion';
import { container } from '../../infrastructure/container';

export function useInversiones() {
  const [inversiones, setInversiones] = useState<Inversion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const desuscribir = container.inversionRepository.suscribir((datos) => {
      setInversiones(datos);
      setCargando(false);
    });
    return desuscribir;
  }, []);

  return { inversiones, cargando };
}
