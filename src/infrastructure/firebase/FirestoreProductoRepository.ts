import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { OperacionLoteProducto, ProductoRepository } from '../../domain/repositories/ProductoRepository';
import type { ActualizacionProducto, NuevoProducto, Producto } from '../../domain/entities/Producto';
import { db } from './firebaseApp';

const COLECCION = 'productos';
const TAMANO_LOTE = 400;

function mapProducto(snapshot: QueryDocumentSnapshot<DocumentData>): Producto {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    nombre: data.nombre,
    codigoBarras: data.codigoBarras,
    categoria: data.categoria,
    costo: data.costo,
    precioVenta: data.precioVenta,
    stock: data.stock,
    stockMinimo: data.stockMinimo,
    imagenUrl: data.imagenUrl ?? null,
    creadoEn: data.creadoEn?.toMillis?.() ?? Date.now(),
    actualizadoEn: data.actualizadoEn?.toMillis?.() ?? Date.now(),
  };
}

export class FirestoreProductoRepository implements ProductoRepository {
  suscribir(callback: (productos: Producto[]) => void): () => void {
    const productosQuery = query(collection(db, COLECCION), orderBy('nombre'));
    return onSnapshot(productosQuery, (snapshot) => {
      callback(snapshot.docs.map(mapProducto));
    });
  }

  async obtenerPorId(id: string): Promise<Producto | null> {
    const productosQuery = query(collection(db, COLECCION), where('__name__', '==', id));
    const snapshot = await getDocs(productosQuery);
    if (snapshot.empty) return null;
    return mapProducto(snapshot.docs[0]);
  }

  async buscarPorCodigoBarras(codigoBarras: string): Promise<Producto | null> {
    const productosQuery = query(
      collection(db, COLECCION),
      where('codigoBarras', '==', codigoBarras),
    );
    const snapshot = await getDocs(productosQuery);
    if (snapshot.empty) return null;
    return mapProducto(snapshot.docs[0]);
  }

  async crear(producto: NuevoProducto): Promise<string> {
    const referencia = await addDoc(collection(db, COLECCION), {
      ...producto,
      creadoEn: serverTimestamp(),
      actualizadoEn: serverTimestamp(),
    });
    return referencia.id;
  }

  async actualizar(id: string, cambios: ActualizacionProducto): Promise<void> {
    await updateDoc(doc(db, COLECCION, id), {
      ...cambios,
      actualizadoEn: serverTimestamp(),
    });
  }

  async eliminar(id: string): Promise<void> {
    await deleteDoc(doc(db, COLECCION, id));
  }

  async guardarLote(operaciones: OperacionLoteProducto[]): Promise<void> {
    for (let i = 0; i < operaciones.length; i += TAMANO_LOTE) {
      const grupo = operaciones.slice(i, i + TAMANO_LOTE);
      const batch = writeBatch(db);

      for (const operacion of grupo) {
        if (operacion.id) {
          batch.update(doc(db, COLECCION, operacion.id), {
            ...operacion.datos,
            actualizadoEn: serverTimestamp(),
          });
        } else {
          batch.set(doc(collection(db, COLECCION)), {
            ...operacion.datos,
            creadoEn: serverTimestamp(),
            actualizadoEn: serverTimestamp(),
          });
        }
      }

      await batch.commit();
    }
  }
}
