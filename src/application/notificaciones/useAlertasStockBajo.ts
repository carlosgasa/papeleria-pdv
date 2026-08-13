import { useEffect, useRef, useState } from 'react';
import { tieneStockBajo } from '../../domain/entities/Producto';
import { container } from '../../infrastructure/container';

function soportaNotificaciones(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function useAlertasStockBajo() {
  const [permiso, setPermiso] = useState<NotificationPermission>(() =>
    soportaNotificaciones() ? Notification.permission : 'denied',
  );
  const bajosPreviosRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!soportaNotificaciones()) return;

    const desuscribir = container.productoRepository.suscribir((productos) => {
      const bajosAhora = new Set(productos.filter(tieneStockBajo).map((p) => p.id));

      if (bajosPreviosRef.current && permiso === 'granted') {
        const nuevosBajos = productos.filter(
          (producto) => tieneStockBajo(producto) && !bajosPreviosRef.current!.has(producto.id),
        );

        if (nuevosBajos.length === 1) {
          const producto = nuevosBajos[0];
          new Notification('Stock bajo — Papelería André', {
            body: `${producto.nombre}: quedan ${producto.stock} (mínimo ${producto.stockMinimo}).`,
            icon: '/icons/icon-192.png',
            tag: `stock-bajo-${producto.id}`,
          });
        } else if (nuevosBajos.length > 1) {
          new Notification('Stock bajo — Papelería André', {
            body: `${nuevosBajos.length} productos bajaron de su stock mínimo: ${nuevosBajos
              .slice(0, 5)
              .map((p) => p.nombre)
              .join(', ')}${nuevosBajos.length > 5 ? '…' : ''}`,
            icon: '/icons/icon-192.png',
            tag: 'stock-bajo-lote',
          });
        }
      }

      bajosPreviosRef.current = bajosAhora;
    });

    return desuscribir;
  }, [permiso]);

  async function solicitarPermiso() {
    if (!soportaNotificaciones()) return;
    const resultado = await Notification.requestPermission();
    setPermiso(resultado);
  }

  return { permiso, soportado: soportaNotificaciones(), solicitarPermiso };
}
