import { useMemo } from 'react';
import { useProductos } from '../../application/inventario/useProductos';
import { emojiDeCategoria } from '../../shared/utils/categoriaEmoji';

type Acento = 'blue' | 'emerald' | 'violet';

const BORDE_ACENTO: Record<Acento, string> = {
  blue: 'border-t-brand-500 dark:border-t-brand-500',
  emerald: 'border-t-emerald-500 dark:border-t-emerald-500',
  violet: 'border-t-violet-500 dark:border-t-violet-500',
};

function TarjetaKpi({
  etiqueta,
  valor,
  submuestra,
  acento,
}: {
  etiqueta: string;
  valor: string;
  submuestra?: string;
  acento: Acento;
}) {
  return (
    <div
      className={`rounded-xl border border-t-4 border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 ${BORDE_ACENTO[acento]}`}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400">{etiqueta}</p>
      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-gray-50">{valor}</p>
      {submuestra && <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{submuestra}</p>}
    </div>
  );
}

function dinero(valor: number): string {
  return `$${valor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function CostosTab() {
  const { productos, cargando } = useProductos();

  const resumen = useMemo(() => {
    let valorCosto = 0;
    let valorVenta = 0;
    let unidades = 0;
    const porCategoria = new Map<string, { costo: number; venta: number; unidades: number }>();

    for (const p of productos) {
      const costoTotal = p.costo * p.stock;
      const ventaTotal = p.precioVenta * p.stock;
      valorCosto += costoTotal;
      valorVenta += ventaTotal;
      unidades += p.stock;

      const actual = porCategoria.get(p.categoria) ?? { costo: 0, venta: 0, unidades: 0 };
      actual.costo += costoTotal;
      actual.venta += ventaTotal;
      actual.unidades += p.stock;
      porCategoria.set(p.categoria, actual);
    }

    const ganancia = valorVenta - valorCosto;
    const margenPct = valorCosto > 0 ? (ganancia / valorCosto) * 100 : 0;

    const categorias = [...porCategoria.entries()]
      .map(([categoria, datos]) => ({ categoria, ...datos, ganancia: datos.venta - datos.costo }))
      .sort((a, b) => b.venta - a.venta);

    return { valorCosto, valorVenta, ganancia, margenPct, unidades, categorias };
  }, [productos]);

  if (cargando) {
    return <p className="p-4 text-sm text-gray-500 dark:text-gray-400 md:p-6">Cargando…</p>;
  }

  if (productos.length === 0) {
    return (
      <p className="p-4 text-sm text-gray-500 dark:text-gray-400 md:p-6">
        Aún no hay productos en el inventario.
      </p>
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TarjetaKpi
          etiqueta="Valor del inventario (costo)"
          valor={dinero(resumen.valorCosto)}
          submuestra={`${resumen.unidades} unidades en stock`}
          acento="blue"
        />
        <TarjetaKpi
          etiqueta="Potencial de venta"
          valor={dinero(resumen.valorVenta)}
          submuestra="Si se vendiera todo el stock al precio de lista"
          acento="emerald"
        />
        <TarjetaKpi
          etiqueta="Ganancia potencial"
          valor={dinero(resumen.ganancia)}
          submuestra={resumen.valorCosto > 0 ? `Margen promedio: ${resumen.margenPct.toFixed(1)}%` : undefined}
          acento="violet"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-50">Por categoría</h2>
        <div className="mt-3 grid grid-cols-1 items-start gap-2 md:grid-cols-2">
          {resumen.categorias.map((cat) => (
            <div
              key={cat.categoria}
              className="flex items-center gap-3 rounded-lg border border-gray-100 p-2.5 text-sm dark:border-gray-800"
            >
              <span className="text-lg">{emojiDeCategoria(cat.categoria)}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-gray-900 dark:text-gray-50">{cat.categoria}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{cat.unidades} unidades</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-semibold text-gray-900 dark:text-gray-50">{dinero(cat.venta)}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">costo {dinero(cat.costo)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Estos valores son un estimado a precio de lista y costo actual; no incluyen mermas, descuentos
        aplicados en ventas ni productos anulados.
      </p>
    </div>
  );
}
