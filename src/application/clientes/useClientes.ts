import { useEffect, useState } from 'react';
import type { Cliente } from '../../domain/entities/Cliente';
import { container } from '../../infrastructure/container';

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const desuscribir = container.clienteRepository.suscribir((datos) => {
      setClientes(datos);
      setCargando(false);
    });
    return desuscribir;
  }, []);

  return { clientes, cargando };
}
