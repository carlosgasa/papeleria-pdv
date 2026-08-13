import type { Venta } from '../../domain/entities/Venta';
import type { Abono } from '../../domain/entities/Abono';

export function totalFiadoCliente(clienteId: string, ventas: Venta[]): number {
  return ventas
    .filter((v) => v.clienteId === clienteId && v.metodoPago === 'fiado' && !v.anulada)
    .reduce((acc, v) => acc + v.total, 0);
}

export function totalAbonadoCliente(clienteId: string, abonos: Abono[]): number {
  return abonos.filter((a) => a.clienteId === clienteId).reduce((acc, a) => acc + a.monto, 0);
}

export function saldoPendienteCliente(clienteId: string, ventas: Venta[], abonos: Abono[]): number {
  return totalFiadoCliente(clienteId, ventas) - totalAbonadoCliente(clienteId, abonos);
}
