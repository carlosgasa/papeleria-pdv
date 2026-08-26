import type { NuevoProducto, Producto } from '../../domain/entities/Producto';
import type { OperacionLoteProducto } from '../../domain/repositories/ProductoRepository';

const COLUMNAS = ['nombre', 'codigoBarras', 'categoria', 'costo', 'precioVenta', 'stock', 'stockMinimo'] as const;

function csvEscape(valor: string): string {
  if (/["\n,]/.test(valor)) {
    return `"${valor.replace(/"/g, '""')}"`;
  }
  return valor;
}

export function plantillaProductosCsv(): string {
  const ejemplos = [
    ['Bolígrafo azul', '', 'Escritura', '3.5', '6', '12', '3'],
    ['Cuaderno profesional 100h', '7501234567890', 'Papel', '15', '25', '20', '5'],
  ];
  return [COLUMNAS as unknown as string[], ...ejemplos]
    .map((fila) => fila.map(csvEscape).join(','))
    .join('\n');
}

export function productosACsv(productos: Producto[]): string {
  const filas = productos.map((p) => [
    p.nombre,
    p.codigoBarras ?? '',
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
    const costoTexto = fila[idx.costo]?.trim();
    const precioVentaTexto = fila[idx.precioVenta]?.trim();
    const stockTexto = fila[idx.stock]?.trim();
    const stockMinimoTexto = fila[idx.stockMinimo]?.trim();

    if (!nombre || !categoria) {
      return { numero, error: 'Faltan nombre o categoría.' };
    }
    if (!costoTexto || !precioVentaTexto || !stockTexto || !stockMinimoTexto) {
      return { numero, error: 'Faltan costo, precio, stock o stock mínimo.' };
    }

    const costo = Number(costoTexto);
    const precioVenta = Number(precioVentaTexto);
    const stock = Number(stockTexto);
    const stockMinimo = Number(stockMinimoTexto);

    if ([costo, precioVenta, stock, stockMinimo].some((v) => Number.isNaN(v) || v < 0)) {
      return { numero, error: 'Costo, precio, stock o stock mínimo no son números válidos.' };
    }

    return {
      numero,
      datos: {
        nombre,
        codigoBarras: codigoBarras || null,
        categoria,
        costo,
        precioVenta,
        stock,
        stockMinimo,
        imagenUrl: null,
      },
    };
  });
}

export type EstadoFilaImportacion = 'nueva' | 'actualiza' | 'error';

export interface FilaPlanificada {
  numero: number;
  nombre: string | null;
  categoria: string | null;
  estado: EstadoFilaImportacion;
  detalle: string;
}

export interface PlanImportacion {
  filas: FilaPlanificada[];
  operaciones: OperacionLoteProducto[];
  categoriasNuevas: string[];
}

/**
 * Decide fila por fila qué pasará al importar (crear, actualizar o descartar por error),
 * sin tocar Firestore. La usa tanto la vista previa como la importación real para que
 * lo que el usuario ve antes de confirmar sea exactamente lo que se va a ejecutar.
 */
export function planificarImportacion(
  filas: FilaImportacion[],
  productosExistentes: Producto[],
  nombresCategoriasExistentes: Set<string>,
): PlanImportacion {
  const normalizarNombre = (nombre: string) => nombre.trim().toLowerCase();
  const productosPorCodigo = new Map(
    productosExistentes.filter((p) => p.codigoBarras).map((p) => [p.codigoBarras as string, p]),
  );
  const productosPorNombre = new Map(productosExistentes.map((p) => [normalizarNombre(p.nombre), p]));
  const codigosNuevosEnArchivo = new Set<string>();
  const nombresNuevosEnArchivo = new Set<string>();
  const categoriasNuevasSet = new Set<string>();
  const operaciones: OperacionLoteProducto[] = [];

  const filasPlanificadas: FilaPlanificada[] = filas.map((fila) => {
    if (fila.error || !fila.datos) {
      return {
        numero: fila.numero,
        nombre: null,
        categoria: null,
        estado: 'error',
        detalle: fila.error ?? 'Fila inválida.',
      };
    }

    const datos = fila.datos;
    if (!nombresCategoriasExistentes.has(datos.categoria.toLowerCase())) {
      categoriasNuevasSet.add(datos.categoria);
    }

    const existentePorCodigo = datos.codigoBarras ? productosPorCodigo.get(datos.codigoBarras) : undefined;
    if (existentePorCodigo) {
      operaciones.push({ id: existentePorCodigo.id, datos });
      return {
        numero: fila.numero,
        nombre: datos.nombre,
        categoria: datos.categoria,
        estado: 'actualiza',
        detalle: `Actualizará "${existentePorCodigo.nombre}" (código ${datos.codigoBarras})`,
      };
    }

    if (datos.codigoBarras && codigosNuevosEnArchivo.has(datos.codigoBarras)) {
      return {
        numero: fila.numero,
        nombre: datos.nombre,
        categoria: datos.categoria,
        estado: 'error',
        detalle: `Código de barras "${datos.codigoBarras}" repetido en el archivo — se omitirá esta fila.`,
      };
    }

    // Sin código de barras no hay forma exacta de emparejar, así que se usa el nombre
    // para no duplicar el producto si el mismo archivo (u otro parecido) se vuelve a importar.
    if (!datos.codigoBarras) {
      const existentePorNombre = productosPorNombre.get(normalizarNombre(datos.nombre));
      if (existentePorNombre) {
        // No se toca el código de barras que ya tuviera el producto: el archivo no trae uno.
        operaciones.push({ id: existentePorNombre.id, datos: { ...datos, codigoBarras: existentePorNombre.codigoBarras } });
        return {
          numero: fila.numero,
          nombre: datos.nombre,
          categoria: datos.categoria,
          estado: 'actualiza',
          detalle: `Actualizará "${existentePorNombre.nombre}" (coincide por nombre, sin código de barras)`,
        };
      }

      const nombreNormalizado = normalizarNombre(datos.nombre);
      if (nombresNuevosEnArchivo.has(nombreNormalizado)) {
        return {
          numero: fila.numero,
          nombre: datos.nombre,
          categoria: datos.categoria,
          estado: 'error',
          detalle: `Nombre "${datos.nombre}" repetido en el archivo sin código de barras — se omitirá esta fila.`,
        };
      }
      nombresNuevosEnArchivo.add(nombreNormalizado);
    }

    if (datos.codigoBarras) codigosNuevosEnArchivo.add(datos.codigoBarras);
    operaciones.push({ id: null, datos });
    return {
      numero: fila.numero,
      nombre: datos.nombre,
      categoria: datos.categoria,
      estado: 'nueva',
      detalle: 'Se creará como producto nuevo',
    };
  });

  return { filas: filasPlanificadas, operaciones, categoriasNuevas: [...categoriasNuevasSet] };
}

