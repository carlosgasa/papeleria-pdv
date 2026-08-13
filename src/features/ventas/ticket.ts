import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ItemVenta, MetodoPago } from '../../domain/entities/Venta';

export interface DetalleTicket {
  ventaId: string;
  fecha: number;
  items: ItemVenta[];
  subtotal: number;
  descuento: number;
  total: number;
  metodoPago: MetodoPago;
  montoRecibido: number | null;
  cambio: number | null;
  clienteNombre: string | null;
}

const ETIQUETA_METODO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  fiado: 'Fiado',
};

export function generarTextoTicket(detalle: DetalleTicket): string {
  const lineas: string[] = [];
  lineas.push('🧾 Papelería André');
  lineas.push(format(detalle.fecha, "d 'de' MMMM yyyy, HH:mm", { locale: es }));
  lineas.push('------------------------------');

  for (const item of detalle.items) {
    lineas.push(`${item.cantidad} x ${item.nombre} — $${(item.cantidad * item.precioUnitario).toFixed(2)}`);
  }

  lineas.push('------------------------------');
  if (detalle.descuento > 0) {
    lineas.push(`Subtotal: $${detalle.subtotal.toFixed(2)}`);
    lineas.push(`Descuento: -$${detalle.descuento.toFixed(2)}`);
  }
  lineas.push(`Total: $${detalle.total.toFixed(2)}`);
  lineas.push(`Pago: ${ETIQUETA_METODO[detalle.metodoPago]}`);
  if (detalle.montoRecibido !== null) {
    lineas.push(`Recibido: $${detalle.montoRecibido.toFixed(2)}`);
  }
  if (detalle.cambio !== null && detalle.cambio > 0) {
    lineas.push(`Cambio: $${detalle.cambio.toFixed(2)}`);
  }
  if (detalle.clienteNombre) {
    lineas.push(`Cliente: ${detalle.clienteNombre}`);
  }
  lineas.push('------------------------------');
  lineas.push('¡Gracias por tu compra!');

  return lineas.join('\n');
}

export function generarPdfTicket(detalle: DetalleTicket): jsPDF {
  const anchoMm = 80;
  const margenMm = 4;
  const anchoUtil = anchoMm - margenMm * 2;

  // Alto aproximado según el contenido, para no dejar una hoja larga vacía.
  const altoEstimadoMm = 40 + detalle.items.length * 8 + (detalle.descuento > 0 ? 10 : 0) + 20;

  const doc = new jsPDF({ unit: 'mm', format: [anchoMm, altoEstimadoMm] });
  let y = margenMm + 4;

  function centrado(texto: string, tamano = 10, negrita = false) {
    doc.setFontSize(tamano);
    doc.setFont('helvetica', negrita ? 'bold' : 'normal');
    doc.text(texto, anchoMm / 2, y, { align: 'center' });
    y += tamano * 0.45 + 1.5;
  }

  function linea(texto: string, tamano = 8) {
    doc.setFontSize(tamano);
    doc.setFont('helvetica', 'normal');
    const partes = doc.splitTextToSize(texto, anchoUtil);
    doc.text(partes, margenMm, y);
    y += (Array.isArray(partes) ? partes.length : 1) * (tamano * 0.4) + 1;
  }

  function separador() {
    doc.setDrawColor(180);
    doc.line(margenMm, y, anchoMm - margenMm, y);
    y += 3;
  }

  centrado('Papelería André', 12, true);
  centrado(format(detalle.fecha, "d 'de' MMMM yyyy, HH:mm", { locale: es }), 8);
  y += 1;
  separador();

  for (const item of detalle.items) {
    linea(`${item.cantidad} x ${item.nombre}`);
    linea(`   $${item.precioUnitario.toFixed(2)} c/u = $${(item.cantidad * item.precioUnitario).toFixed(2)}`);
  }

  separador();
  if (detalle.descuento > 0) {
    linea(`Subtotal: $${detalle.subtotal.toFixed(2)}`);
    linea(`Descuento: -$${detalle.descuento.toFixed(2)}`);
  }
  centrado(`Total: $${detalle.total.toFixed(2)}`, 11, true);
  linea(`Pago: ${ETIQUETA_METODO[detalle.metodoPago]}`);
  if (detalle.montoRecibido !== null) {
    linea(`Recibido: $${detalle.montoRecibido.toFixed(2)}`);
  }
  if (detalle.cambio !== null && detalle.cambio > 0) {
    linea(`Cambio: $${detalle.cambio.toFixed(2)}`);
  }
  if (detalle.clienteNombre) {
    linea(`Cliente: ${detalle.clienteNombre}`);
  }
  y += 2;
  separador();
  centrado('¡Gracias por tu compra!', 9);

  return doc;
}
