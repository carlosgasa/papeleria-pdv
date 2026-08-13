import type { Venta } from '../../domain/entities/Venta';
import type { Cliente } from '../../domain/entities/Cliente';

export interface ClienteFrecuente {
  clienteId: string;
  nombre: string;
  totalComprado: number;
  cantidadCompras: number;
}

export function totalCompradoCliente(clienteId: string, ventas: Venta[]): number {
  return ventas
    .filter((v) => v.clienteId === clienteId && !v.anulada)
    .reduce((acc, v) => acc + v.total, 0);
}

export function topClientes(ventas: Venta[], clientes: Cliente[], limite: number): ClienteFrecuente[] {
  const nombrePorId = new Map(clientes.map((c) => [c.id, c.nombre]));
  const acumulado = new Map<string, { totalComprado: number; cantidadCompras: number }>();

  for (const venta of ventas) {
    if (venta.anulada || !venta.clienteId) continue;
    const actual = acumulado.get(venta.clienteId) ?? { totalComprado: 0, cantidadCompras: 0 };
    actual.totalComprado += venta.total;
    actual.cantidadCompras += 1;
    acumulado.set(venta.clienteId, actual);
  }

  return [...acumulado.entries()]
    .map(([clienteId, datos]) => ({
      clienteId,
      nombre: nombrePorId.get(clienteId) ?? 'Cliente eliminado',
      ...datos,
    }))
    .sort((a, b) => b.totalComprado - a.totalComprado)
    .slice(0, limite);
}
