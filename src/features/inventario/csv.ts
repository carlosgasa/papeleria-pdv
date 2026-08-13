import type { NuevoProducto, Producto } from '../../domain/entities/Producto';

const COLUMNAS = ['nombre', 'codigoBarras', 'categoria', 'costo', 'precioVenta', 'stock', 'stockMinimo'] as const;

function csvEscape(valor: string): string {
  if (/["\n,]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function productosACsv(productos: Producto[]): string {
  const filas = productos.map((p) => [
    p.nombre,
    p.codigoBarras,
    p.categoria,
    String(p.costo),
    String(p.precioVenta),
    String(p.stock),
    String(p.stockMinimo),
  ]);
  return [COLUMNAS as unknown as string[], ...filas].map((fila) => fila.map(csvEscape).join(',')).join('\n');
}

function parsearCsv(texto: string): string[][] {
  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = '';
  let dentroComillas = false;
  const normalizado = texto.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < normalizado.length; i++) {
    const char = normalizado[i];
    if (dentroComillas) {
      if (char === '"') {
        if (normalizado[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          dentroComillas = false;
        }
      } else {
        campo += char;
      }
      continue;
    }

    if (char === '"') {
      dentroComillas = true;
    } else if (char === ',') {
      fila.push(campo);
      campo = '';
    } else if (char === '\n') {
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = '';
    } else {
      campo += char;
    }
  }
  if (campo.length > 0 || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }
  return filas.filter((f) => f.some((c) => c.trim() !== ''));
}

export interface FilaImportacion {
  numero: number;
  datos?: NuevoProducto;
  error?: string;
}

export function interpretarProductosCsv(texto: string): FilaImportacion[] {
  const filas = parsearCsv(texto);
  if (filas.length === 0) return [];

  const [encabezado, ...resto] = filas;
  const indiceDe = (nombre: string) =>
    encabezado.findIndex((h) => h.trim().toLowerCase() === nombre.toLowerCase());

  const idx = {
    nombre: indiceDe('nombre'),
    codigoBarras: indiceDe('codigoBarras'),
    categoria: indiceDe('categoria'),
    costo: indiceDe('costo'),
    precioVenta: indiceDe('precioVenta'),
    stock: indiceDe('stock'),
    stockMinimo: indiceDe('stockMinimo'),
  };

  if (Object.values(idx).some((v) => v === -1)) {
    return [
      {
        numero: 1,
        error: `El encabezado debe incluir las columnas: ${COLUMNAS.join(', ')}.`,
      },
    ];
  }

  return resto.map((fila, i) => {
    const numero = i + 2;
    const nombre = fila[idx.nombre]?.trim();
    const codigoBarras = fila[idx.codigoBarras]?.trim();
    const categoria = fila[idx.categoria]?.trim();
    const costo = Number(fila[idx.costo]);
    const precioVenta = Number(fila[idx.precioVenta]);
    const stock = Number(fila[idx.stock]);
    const stockMinimo = Number(fila[idx.stockMinimo]);

    if (!nombre || !codigoBarras || !categoria) {
      return { numero, error: 'Faltan nombre, código de barras o categoría.' };
    }
    if ([costo, precioVenta, stock, stockMinimo].some((v) => Number.isNaN(v) || v < 0)) {
      return { numero, error: 'Costo, precio, stock o stock mínimo no son números válidos.' };
    }

    return {
      numero,
      datos: { nombre, codigoBarras, categoria, costo, precioVenta, stock, stockMinimo, imagenUrl: null },
    };
  });
}

