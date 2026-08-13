import { useEffect, useState } from 'react';

const CLAVE_ALMACENAMIENTO = 'papeleria-pos:ocultar-saldos';

export function useOcultarSaldos() {
  const [ocultarSaldos, setOcultarSaldos] = useState(() => {
    return localStorage.getItem(CLAVE_ALMACENAMIENTO) === '1';
  });

  useEffect(() => {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, ocultarSaldos ? '1' : '0');
  }, [ocultarSaldos]);

  function alternar() {
    setOcultarSaldos((actual) => !actual);
  }

  return { ocultarSaldos, alternar };
}
