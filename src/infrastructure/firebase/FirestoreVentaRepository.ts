import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { VentaRepository } from '../../domain/repositories/VentaRepository';
import type { NuevaVenta, Venta } from '../../domain/entities/Venta';
import { db } from './firebaseApp';

const COLECCION_VENTAS = 'ventas';
const COLECCION_PRODUCTOS = 'productos';
const COLECCION_MOVIMIENTOS = 'movimientosStock';

function mapVenta(snapshot: QueryDocumentSnapshot<DocumentData>): Venta {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    items: data.items,
    total: data.total,
    metodoPago: data.metodoPago,
    clienteId: data.clienteId ?? null,
    usuarioId: data.usuarioId,
    fecha: data.fecha?.toMillis?.() ?? Date.now(),
    anulada: data.anulada ?? false,
    anuladaEn: data.anuladaEn?.toMillis?.() ?? null,
  };
}

export class FirestoreVentaRepository implements VentaRepository {
  suscribir(callback: (ventas: Venta[]) => void): () => void {
    const ventasQuery = query(collection(db, COLECCION_VENTAS), orderBy('fecha', 'desc'));
    return onSnapshot(ventasQuery, (snapshot) => {
      callback(snapshot.docs.map(mapVenta));
    });
  }

  async registrarVenta(venta: NuevaVenta): Promise<string> {
    const ventaRef = doc(collection(db, COLECCION_VENTAS));
    const movimientoRefs = venta.items.map(() => doc(collection(db, COLECCION_MOVIMIENTOS)));

    await runTransaction(db, async (transaction) => {
      const productoRefs = venta.items.map((item) => doc(db, COLECCION_PRODUCTOS, item.productoId));
      const productoSnaps = await Promise.all(
        productoRefs.map((ref) => transaction.get(ref)),
      );

      productoSnaps.forEach((snap, index) => {
        const item = venta.items[index];
        if (!snap.exists()) {
          throw new Error(`El producto "${item.nombre}" ya no existe.`);
        }
        const stockActual = snap.data().stock as number;
        if (stockActual < item.cantidad) {
          throw new Error(`Stock insuficiente para "${item.nombre}". Disponible: ${stockActual}.`);
        }
      });

      productoSnaps.forEach((snap, index) => {
        const item = venta.items[index];
        const stockActual = snap.data()!.stock as number;
        const stockResultante = stockActual - item.cantidad;

        transaction.update(productoRefs[index], {
          stock: stockResultante,
          actualizadoEn: serverTimestamp(),
        });

        transaction.set(movimientoRefs[index], {
          productoId: item.productoId,
          productoNombre: item.nombre,
          tipo: 'venta',
          cantidad: item.cantidad,
          stockResultante,
          motivo: null,
          usuarioId: venta.usuarioId,
          fecha: serverTimestamp(),
        });
      });

      transaction.set(ventaRef, {
        items: venta.items,
        total: venta.total,
        metodoPago: venta.metodoPago,
        clienteId: venta.clienteId,
        usuarioId: venta.usuarioId,
        fecha: serverTimestamp(),
        anulada: false,
        anuladaEn: null,
      });
    });

    return ventaRef.id;
  }

  async anularVenta(ventaId: string): Promise<void> {
    const ventaRef = doc(db, COLECCION_VENTAS, ventaId);

    await runTransaction(db, async (transaction) => {
      const ventaSnap = await transaction.get(ventaRef);
      if (!ventaSnap.exists()) {
        throw new Error('La venta no existe.');
      }
      const data = ventaSnap.data();
      if (data.anulada) {
        throw new Error('La venta ya fue anulada.');
      }

      const items = data.items as { productoId: string; nombre: string; cantidad: number }[];
      const productoRefs = items.map((item) => doc(db, COLECCION_PRODUCTOS, item.productoId));
      const movimientoRefs = items.map(() => doc(collection(db, COLECCION_MOVIMIENTOS)));
      const productoSnaps = await Promise.all(
        productoRefs.map((ref) => transaction.get(ref)),
      );

      productoSnaps.forEach((snap, index) => {
        if (!snap.exists()) return;
        const item = items[index];
        const stockActual = snap.data()!.stock as number;
        const stockResultante = stockActual + item.cantidad;

        transaction.update(productoRefs[index], {
          stock: stockResultante,
          actualizadoEn: serverTimestamp(),
        });

        transaction.set(movimientoRefs[index], {
          productoId: item.productoId,
          productoNombre: item.nombre,
          tipo: 'anulacion',
          cantidad: item.cantidad,
          stockResultante,
          motivo: `Anulación de venta`,
          usuarioId: data.usuarioId,
          fecha: serverTimestamp(),
        });
      });

      transaction.update(ventaRef, {
        anulada: true,
        anuladaEn: serverTimestamp(),
      });
    });
  }
}
