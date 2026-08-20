import { useMemo, useState } from 'react';
import { PLANTILLAS_FOTO, TAMANOS_HOJA } from './plantillas';

const PRESETS = [
  ...PLANTILLAS_FOTO.filter((p) => p.id !== 'personalizado').map((p) => ({
    id: `foto-${p.id}`,
    nombre: `Foto — ${p.nombre}`,
    anchoCm: p.anchoCm,
    altoCm: p.altoCm,
  })),
  ...TAMANOS_HOJA.map((h) => ({
    id: `hoja-${h.id}`,
    nombre: `Hoja ${h.nombre} completa`,
    anchoCm: h.anchoCm,
    altoCm: h.altoCm,
  })),
  { id: 'personalizado', nombre: 'Personalizado', anchoCm: 10, altoCm: 15 },
];

export function CalculadoraTintaTab() {
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [anchoCm, setAnchoCm] = useState(PRESETS[0].anchoCm);
  const [altoCm, setAltoCm] = useState(PRESETS[0].altoCm);
  const [coberturaPorcentaje, setCoberturaPorcentaje] = useState(30);
  const [mlPorCm2, setMlPorCm2] = useState(0.03);
  const [costoTintaPorMl, setCostoTintaPorMl] = useState(2.5);
  const [costoPapelPorHoja, setCostoPapelPorHoja] = useState(1.5);
  const [cantidadCopias, setCantidadCopias] = useState(1);
  const [margenPorcentaje, setMargenPorcentaje] = useState(50);

  function handlePreset(id: string) {
    setPresetId(id);
    const preset = PRESETS.find((p) => p.id === id);
    if (preset && id !== 'personalizado') {
      setAnchoCm(preset.anchoCm);
      setAltoCm(preset.altoCm);
    }
  }

  const resultado = useMemo(() => {
    const areaCm2 = Math.max(0, anchoCm) * Math.max(0, altoCm);
    const mlPorCopia = areaCm2 * mlPorCm2 * (coberturaPorcentaje / 100);
    const costoTintaPorCopia = mlPorCopia * costoTintaPorMl;
    const costoPorCopia = costoTintaPorCopia + costoPapelPorHoja;
    const copias = Math.max(1, cantidadCopias);
    const precioSugeridoPorCopia = costoPorCopia * (1 + Math.max(0, margenPorcentaje) / 100);
    const costoTotal = costoPorCopia * copias;
    const precioTotalSugerido = precioSugeridoPorCopia * copias;
    return {
      mlPorCopia,
      costoTintaPorCopia,
      costoPorCopia,
      costoTotal,
      precioSugeridoPorCopia,
      precioTotalSugerido,
      gananciaTotal: precioTotalSugerido - costoTotal,
    };
  }, [
    anchoCm,
    altoCm,
    mlPorCm2,
    coberturaPorcentaje,
    costoTintaPorMl,
    costoPapelPorHoja,
    cantidadCopias,
    margenPorcentaje,
  ]);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Estimación aproximada. Ajusta los parámetros según el rendimiento real de tu impresora y el costo de tus
          insumos.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="col-span-2 md:col-span-3">
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Tamaño</label>
            <select
              value={presetId}
              onChange={(e) => handlePreset(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            >
              {PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Ancho (cm)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={anchoCm}
              onChange={(e) => {
                setPresetId('personalizado');
                setAnchoCm(Number(e.target.value));
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Alto (cm)</label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={altoCm}
              onChange={(e) => {
                setPresetId('personalizado');
                setAltoCm(Number(e.target.value));
              }}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Copias</label>
            <input
              type="number"
              step="1"
              min="1"
              value={cantidadCopias}
              onChange={(e) => setCantidadCopias(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Cobertura de tinta (%)</label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={coberturaPorcentaje}
              onChange={(e) => setCoberturaPorcentaje(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Consumo (ml/cm² al 100%)</label>
            <input
              type="number"
              step="0.001"
              min="0"
              value={mlPorCm2}
              onChange={(e) => setMlPorCm2(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Costo tinta ($/ml)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costoTintaPorMl}
              onChange={(e) => setCostoTintaPorMl(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Costo papel ($/hoja)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costoPapelPorHoja}
              onChange={(e) => setCostoPapelPorHoja(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">Margen de ganancia (%)</label>
            <input
              type="number"
              step="1"
              min="0"
              value={margenPorcentaje}
              onChange={(e) => setMargenPorcentaje(Number(e.target.value))}
              className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Tinta por copia</p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-50">{resultado.mlPorCopia.toFixed(2)} ml</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Costo tinta / copia</p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-50">${resultado.costoTintaPorCopia.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Costo total / copia</p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-50">${resultado.costoPorCopia.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400">Costo total ({cantidadCopias} copias)</p>
          <p className="mt-1 text-lg font-bold text-gray-900 dark:text-gray-50">${resultado.costoTotal.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950">
          <p className="text-xs text-brand-700 dark:text-brand-300">Precio sugerido / copia</p>
          <p className="mt-1 text-lg font-bold text-brand-800 dark:text-brand-200">${resultado.precioSugeridoPorCopia.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-900 dark:bg-brand-950">
          <p className="text-xs text-brand-700 dark:text-brand-300">Precio total sugerido</p>
          <p className="mt-1 text-lg font-bold text-brand-800 dark:text-brand-200">${resultado.precioTotalSugerido.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950 col-span-2 md:col-span-2">
          <p className="text-xs text-emerald-700 dark:text-emerald-400">Ganancia total ({cantidadCopias} copias)</p>
          <p className="mt-1 text-lg font-bold text-emerald-800 dark:text-emerald-300">${resultado.gananciaTotal.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
