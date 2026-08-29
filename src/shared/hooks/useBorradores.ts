import { useEffect, useState } from 'react';

export interface BorradorBase {
  id: string;
  nombre: string;
  creadoEn: number;
  actualizadoEn: number;
}

function nuevoId(): string {
  return `${Date.now()}-${Math.random()}`;
}

function leerDeAlmacenamiento<T>(clave: string): T[] {
  try {
    const guardado = localStorage.getItem(clave);
    return guardado ? (JSON.parse(guardado) as T[]) : [];
  } catch {
    return [];
  }
}

/**
 * Notas/borradores guardados solo en este dispositivo (localStorage), no en
 * Firestore: son simulaciones de trabajo en progreso (una venta o un
 * presupuesto sin terminar), no movimientos reales de negocio, así que no
 * tiene sentido sincronizarlas entre dispositivos ni que sobrevivan a un
 * "borrar datos de navegación". Sí sobreviven a cerrar la pestaña, el
 * navegador o apagar el equipo.
 */
export function useBorradores<T extends BorradorBase>(clave: string) {
  const [borradores, setBorradores] = useState<T[]>(() => leerDeAlmacenamiento<T>(clave));

  useEffect(() => {
    try {
      localStorage.setItem(clave, JSON.stringify(borradores));
    } catch {
      // Almacenamiento lleno o no disponible; el borrador solo vive en memoria de esta sesión.
    }
  }, [clave, borradores]);

  function guardar(nombre: string, datos: Omit<T, 'id' | 'nombre' | 'creadoEn' | 'actualizadoEn'>): string {
    const ahora = Date.now();
    const id = nuevoId();
    setBorradores((actuales) => [
      { ...datos, id, nombre, creadoEn: ahora, actualizadoEn: ahora } as T,
      ...actuales,
    ]);
    return id;
  }

  function eliminar(id: string) {
    setBorradores((actuales) => actuales.filter((b) => b.id !== id));
  }

  return { borradores, guardar, eliminar };
}
