import { useState } from 'react';
import { AcomodoFotosTab } from './AcomodoFotosTab';
import { CalculadoraTintaTab } from './CalculadoraTintaTab';

type Pestana = 'acomodo' | 'tinta';

export function ExperimentalPage() {
  const [pestana, setPestana] = useState<Pestana>('acomodo');

  return (
    <div>
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Herramientas de fotos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Herramientas independientes del punto de venta. No se guarda nada en la nube.
        </p>

        <div className="mt-4 flex gap-1">
          <button
            onClick={() => setPestana('acomodo')}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
              pestana === 'acomodo'
                ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Acomodo de fotos
          </button>
          <button
            onClick={() => setPestana('tinta')}
            className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
              pestana === 'tinta'
                ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Calculadora de tinta
          </button>
        </div>
      </div>

      <div className="p-4 md:p-6">
        {pestana === 'acomodo' ? <AcomodoFotosTab /> : <CalculadoraTintaTab />}
      </div>
    </div>
  );
}
