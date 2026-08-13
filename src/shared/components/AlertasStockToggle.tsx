import { useAlertasStockBajo } from '../../application/notificaciones/useAlertasStockBajo';

export function AlertasStockToggle() {
  const { permiso, soportado, solicitarPermiso } = useAlertasStockBajo();

  if (!soportado) return null;

  if (permiso === 'granted') {
    return (
      <span
        title="Recibirás una notificación cuando un producto baje del stock mínimo"
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 dark:text-gray-500"
      >
        🔔
      </span>
    );
  }

  if (permiso === 'denied') {
    return (
      <span
        title="Notificaciones bloqueadas. Actívalas desde la configuración del navegador para recibir alertas de stock bajo."
        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-300 dark:text-gray-600"
      >
        🔕
      </span>
    );
  }

  return (
    <button
      onClick={() => void solicitarPermiso()}
      title="Activar alertas de stock bajo"
      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
    >
      🔕
    </button>
  );
}
