import { useEffect, useState } from 'react';
import type { Abono } from '../../domain/entities/Abono';
import { container } from '../../infrastructure/container';

export function useAbonos() {
  const [abonos, setAbonos] = useState<Abono[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const desuscribir = container.abonoRepository.suscribir((datos) => {
      setAbonos(datos);
      setCargando(false);
    });
    return desuscribir;
  }, []);

  return { abonos, cargando };
}
