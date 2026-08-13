import { useEffect, useRef, useState } from 'react';
import { useEstadoConexion } from '../../application/conexion/useEstadoConexion';

export function EstadoConexionBanner() {
  const { enLinea } = useEstadoConexion();
  const [mostrarReconexion, setMostrarReconexion] = useState(false);
  const estuvoOfflineRef = useRef(false);

  useEffect(() => {
    if (!enLinea) {
      estuvoOfflineRef.current = true;
      setMostrarReconexion(false);
      return;
    }
    if (estuvoOfflineRef.current) {
      estuvoOfflineRef.current = false;
      setMostrarReconexion(true);
      const timeout = setTimeout(() => setMostrarReconexion(false), 4000);
      return () => clearTimeout(timeout);
    }
  }, [enLinea]);

  if (!enLinea) {
    return (
      <div className="bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-white">
        📡 Sin conexión — tus ventas y cambios se guardan y se sincronizan solos al reconectar.
      </div>
    );
  }

  if (mostrarReconexion) {
    return (
      <div className="bg-emerald-500 px-4 py-1.5 text-center text-xs font-medium text-white">
        ✅ Conexión restablecida, sincronizando…
      </div>
    );
  }

  return null;
}
