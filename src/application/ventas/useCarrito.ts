import { useMemo, useState } from 'react';
import type { ItemVenta } from '../../domain/entities/Venta';
import { calcularSubtotal } from '../../domain/entities/Venta';
import type { Producto } from '../../domain/entities/Producto';

export function useCarrito() {
  const [items, setItems] = useState<ItemVenta[]>([]);
  const [error, setError] = useState<string | null>(null);

  function agregarProducto(producto: Producto, cantidad = 1) {
    setError(null);
    setItems((actuales) => {
      const existente = actuales.find((item) => item.productoId === producto.id);
      const cantidadActual = existente?.cantidad ?? 0;
      const nuevaCantidad = cantidadActual + cantidad;

      if (nuevaCantidad > producto.stock) {
        setError(`Solo hay ${producto.stock} unidades de "${producto.nombre}" en stock.`);
        return actuales;
      }

      if (existente) {
        return actuales.map((item) =>
          item.productoId === producto.id ? { ...item, cantidad: nuevaCantidad } : item,
        );
      }

      return [
        ...actuales,
        {
          productoId: producto.id,
          nombre: producto.nombre,
          codigoBarras: producto.codigoBarras,
          cantidad,
          precioUnitario: producto.precioVenta,
          costoUnitario: producto.costo,
        },
      ];
    });
  }

  function cambiarCantidad(productoId: string, cantidad: number, stockDisponible: number) {
    setError(null);
    if (cantidad <= 0) {
      quitar(productoId);
      return;
    }
    if (cantidad > stockDisponible) {
      setError(`Solo hay ${stockDisponible} unidades disponibles.`);
      return;
    }
    setItems((actuales) =>
      actuales.map((item) => (item.productoId === productoId ? { ...item, cantidad } : item)),
    );
  }

  function quitar(productoId: string) {
    setItems((actuales) => actuales.filter((item) => item.productoId !== productoId));
  }

  function limpiar() {
    setItems([]);
    setError(null);
  }

  const total = useMemo(() => calcularSubtotal(items), [items]);

  return { items, total, error, agregarProducto, cambiarCantidad, quitar, limpiar };
}
