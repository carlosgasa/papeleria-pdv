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
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { ProductoRepository } from '../../domain/repositories/ProductoRepository';
import type { ActualizacionProducto, NuevoProducto, Producto } from '../../domain/entities/Producto';
import { db } from './firebaseApp';

const COLECCION = 'productos';

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
}
