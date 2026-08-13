import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { MovimientoStockRepository, NuevoAjusteStock } from '../../domain/repositories/MovimientoStockRepository';
import type { MovimientoStock } from '../../domain/entities/MovimientoStock';
import { db } from './firebaseApp';

const COLECCION_MOVIMIENTOS = 'movimientosStock';
const COLECCION_PRODUCTOS = 'productos';

function mapMovimiento(snapshot: QueryDocumentSnapshot<DocumentData>): MovimientoStock {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    productoId: data.productoId,
    productoNombre: data.productoNombre,
    tipo: data.tipo,
    cantidad: data.cantidad,
    stockResultante: data.stockResultante,
    motivo: data.motivo ?? null,
    usuarioId: data.usuarioId,
    fecha: data.fecha?.toMillis?.() ?? Date.now(),
  };
}

export class FirestoreMovimientoStockRepository implements MovimientoStockRepository {
  suscribir(callback: (movimientos: MovimientoStock[]) => void): () => void {
    const movimientosQuery = query(collection(db, COLECCION_MOVIMIENTOS), orderBy('fecha', 'desc'));
    return onSnapshot(movimientosQuery, (snapshot) => {
      callback(snapshot.docs.map(mapMovimiento));
    });
  }

  async registrarAjuste({ productoId, tipo, cantidad, motivo, usuarioId }: NuevoAjusteStock): Promise<void> {
    const productoRef = doc(db, COLECCION_PRODUCTOS, productoId);
    const movimientoRef = doc(collection(db, COLECCION_MOVIMIENTOS));

    // Lectura simple + lote (no transacción) para que también funcione sin conexión.
    const snap = await getDoc(productoRef);
    if (!snap.exists()) {
      throw new Error('El producto ya no existe.');
    }
    const data = snap.data();
    const stockActual = data.stock as number;
    const stockResultante = tipo === 'entrada' ? stockActual + cantidad : stockActual - cantidad;

    if (stockResultante < 0) {
      throw new Error(`No hay suficiente stock. Disponible: ${stockActual}.`);
    }

    const batch = writeBatch(db);

    batch.update(productoRef, {
      stock: stockResultante,
      actualizadoEn: serverTimestamp(),
    });

    batch.set(movimientoRef, {
      productoId,
      productoNombre: data.nombre,
      tipo,
      cantidad,
      stockResultante,
      motivo: motivo?.trim() || null,
      usuarioId,
      fecha: serverTimestamp(),
    });

    await batch.commit();
  }
}
