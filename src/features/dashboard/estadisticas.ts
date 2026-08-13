import { startOfDay, subDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Venta } from '../../domain/entities/Venta';
import { calcularGanancia } from '../../domain/entities/Venta';

export interface ResumenPeriodo {
  totalVentas: number;
  ganancia: number;
  ticketPromedio: number;
  cantidadVentas: number;
}

export function resumenPeriodo(ventas: Venta[], desde: number): ResumenPeriodo {
  const enPeriodo = ventas.filter((venta) => !venta.anulada && venta.fecha >= desde);
  const totalVentas = enPeriodo.reduce((acc, venta) => acc + venta.total, 0);
  const ganancia = enPeriodo.reduce((acc, venta) => acc + calcularGanancia(venta), 0);
  const cantidadVentas = enPeriodo.length;
  return {
    totalVentas,
    ganancia,
    ticketPromedio: cantidadVentas > 0 ? totalVentas / cantidadVentas : 0,
    cantidadVentas,
  };
}

export interface PuntoVentaDiaria {
  fecha: string;
  total: number;
}

export function ventasPorDia(ventas: Venta[], dias: number): PuntoVentaDiaria[] {
  const hoy = startOfDay(Date.now());
  const puntos: PuntoVentaDiaria[] = [];

  for (let i = dias - 1; i >= 0; i--) {
    const dia = subDays(hoy, i);
    const inicioDia = dia.getTime();
    const finDia = inicioDia + 24 * 60 * 60 * 1000;
    const total = ventas
      .filter((venta) => !venta.anulada && venta.fecha >= inicioDia && venta.fecha < finDia)
      .reduce((acc, venta) => acc + venta.total, 0);
    puntos.push({ fecha: format(dia, 'd MMM', { locale: es }), total });
  }

  return puntos;
}

export interface ProductoVendido {
  nombre: string;
  cantidad: number;
}

export function topProductos(ventas: Venta[], limite: number): ProductoVendido[] {
  const conteo = new Map<string, number>();
  for (const venta of ventas) {
    if (venta.anulada) continue;
    for (const item of venta.items) {
      conteo.set(item.nombre, (conteo.get(item.nombre) ?? 0) + item.cantidad);
    }
  }
  return [...conteo.entries()]
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, limite);
}

export function gananciaAcumulada(ventas: Venta[]): number {
  return ventas.filter((venta) => !venta.anulada).reduce((acc, venta) => acc + calcularGanancia(venta), 0);
}
