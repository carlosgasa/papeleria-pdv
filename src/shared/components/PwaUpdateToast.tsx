import { useRegisterSW } from 'virtual:pwa-register/react';

export function PwaUpdateToast() {
  const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW();

  const [needsUpdate] = needRefresh;
  const [isOfflineReady, setOfflineReady] = offlineReady;

  if (!needsUpdate && !isOfflineReady) return null;

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto flex max-w-sm items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-800 dark:bg-gray-900 md:bottom-4 md:left-auto md:right-4">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {needsUpdate
          ? 'Hay una nueva versión disponible.'
          : 'La app está lista para usarse sin conexión.'}
      </p>
      <div className="flex shrink-0 gap-2">
        {needsUpdate && (
          <button
            onClick={() => void updateServiceWorker(true)}
            className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
          >
            Actualizar
          </button>
        )}
        <button
          onClick={() => setOfflineReady(false)}
          className="rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
