import { useState } from 'react';
import { AcomodoFotosTab } from './AcomodoFotosTab';
import { CuadriculaImagenesTab } from './CuadriculaImagenesTab';
import { CalculadoraTintaTab } from './CalculadoraTintaTab';
import { PresupuestoTab } from './PresupuestoTab';

type Pestana = 'acomodo' | 'cuadricula' | 'tinta' | 'presupuesto';

const PESTANAS: { valor: Pestana; etiqueta: string }[] = [
  { valor: 'acomodo', etiqueta: 'Fotos por tamaño' },
  { valor: 'cuadricula', etiqueta: 'Cuadrícula de imágenes' },
  { valor: 'tinta', etiqueta: 'Calculadora de tinta' },
  { valor: 'presupuesto', etiqueta: 'Presupuesto' },
];

export function ExperimentalPage() {
  const [pestana, setPestana] = useState<Pestana>('acomodo');

  return (
    <div>
      <div className="border-b border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:p-6">
        <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-50">Herramientas</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Herramientas independientes del punto de venta. No se guarda nada en la nube.
        </p>

        <div className="mt-4 flex flex-wrap gap-1">
          {PESTANAS.map((p) => (
            <button
              key={p.valor}
              onClick={() => setPestana(p.valor)}
              className={`rounded-t-lg px-3 py-2 text-sm font-medium ${
                pestana === p.valor
                  ? 'border-b-2 border-brand-600 text-brand-600 dark:text-brand-400'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {p.etiqueta}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 md:p-6">
        {pestana === 'acomodo' && <AcomodoFotosTab />}
        {pestana === 'cuadricula' && <CuadriculaImagenesTab />}
        {pestana === 'tinta' && <CalculadoraTintaTab />}
        {pestana === 'presupuesto' && <PresupuestoTab />}
      </div>
    </div>
  );
}
