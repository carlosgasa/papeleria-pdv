import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Venta } from '../../domain/entities/Venta';
import { calcularGanancia } from '../../domain/entities/Venta';

const ETIQUETA_METODO: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  fiado: 'Fiado',
};

function csvEscape(valor: string): string {
  if (/["\n,]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}

export function generarCsvCorte(ventas: Venta[]): string {
  const encabezado = ['fecha', 'hora', 'total', 'ganancia', 'metodoPago', 'anulada', 'items'];
  const filas = ventas.map((venta) => [
    format(venta.fecha, 'yyyy-MM-dd'),
    format(venta.fecha, 'HH:mm'),
    venta.total.toFixed(2),
    calcularGanancia(venta).toFixed(2),
    ETIQUETA_METODO[venta.metodoPago] ?? venta.metodoPago,
    venta.anulada ? 'sí' : 'no',
    venta.items.map((item) => `${item.cantidad}x ${item.nombre}`).join('; '),
  ]);
  return [encabezado, ...filas].map((fila) => fila.map(csvEscape).join(',')).join('\n');
}

export function generarPdfCorte(ventas: Venta[], desde: Date, hasta: Date): jsPDF {
  const vigentes = ventas.filter((v) => !v.anulada);
  const totalVentas = vigentes.reduce((acc, v) => acc + v.total, 0);
  const totalGanancia = vigentes.reduce((acc, v) => acc + calcularGanancia(v), 0);
  const porMetodo = new Map<string, number>();
  for (const venta of vigentes) {
    porMetodo.set(venta.metodoPago, (porMetodo.get(venta.metodoPago) ?? 0) + venta.total);
  }

  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const margen = 15;
  const anchoUtil = doc.internal.pageSize.getWidth() - margen * 2;
  let y = margen;

  function linea(texto: string, tamano = 10, negrita = false) {
    doc.setFontSize(tamano);
    doc.setFont('helvetica', negrita ? 'bold' : 'normal');
    doc.text(texto, margen, y);
    y += tamano * 0.5 + 2;
  }

  function saltoDePaginaSiNecesario(alturaRequerida = 8) {
    if (y + alturaRequerida > doc.internal.pageSize.getHeight() - margen) {
      doc.addPage();
      y = margen;
    }
  }

  linea('Papelería André — Corte de caja', 16, true);
  linea(`Periodo: ${format(desde, "d 'de' MMMM yyyy", { locale: es })} — ${format(hasta, "d 'de' MMMM yyyy", { locale: es })}`);
  linea(`Generado: ${format(new Date(), "d 'de' MMMM yyyy, HH:mm", { locale: es })}`);
  y += 3;

  linea('Resumen', 12, true);
  linea(`Ventas (no anuladas): ${vigentes.length} de ${ventas.length} registradas`);
  linea(`Total vendido: $${totalVentas.toFixed(2)}`);
  linea(`Ganancia: $${totalGanancia.toFixed(2)}`);
  for (const [metodo, monto] of porMetodo) {
    linea(`  ${ETIQUETA_METODO[metodo] ?? metodo}: $${monto.toFixed(2)}`);
  }
  y += 3;

  linea('Detalle de ventas', 12, true);
  const colX = { fecha: margen, hora: margen + 28, metodo: margen + 48, total: margen + 78, items: margen + 98 };
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha', colX.fecha, y);
  doc.text('Hora', colX.hora, y);
  doc.text('Método', colX.metodo, y);
  doc.text('Total', colX.total, y);
  doc.text('Items', colX.items, y);
  y += 5;
  doc.setFont('helvetica', 'normal');

  for (const venta of ventas) {
    saltoDePaginaSiNecesario();
    const itemsTexto = venta.items.map((item) => `${item.cantidad}x ${item.nombre}`).join(', ');
    const itemsRecortado = doc.splitTextToSize(itemsTexto, anchoUtil - (colX.items - margen));
    doc.setFontSize(8.5);
    doc.text(format(venta.fecha, 'dd/MM/yy'), colX.fecha, y);
    doc.text(format(venta.fecha, 'HH:mm'), colX.hora, y);
    doc.text(ETIQUETA_METODO[venta.metodoPago] ?? venta.metodoPago, colX.metodo, y);
    doc.text(`${venta.anulada ? '(anulada) ' : ''}$${venta.total.toFixed(2)}`, colX.total, y);
    doc.text(itemsRecortado, colX.items, y);
    y += Math.max(5, (Array.isArray(itemsRecortado) ? itemsRecortado.length : 1) * 4);
  }

  return doc;
}
