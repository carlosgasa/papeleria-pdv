import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { ActualizacionCliente, Cliente, NuevoCliente } from '../../domain/entities/Cliente';
import type { ClienteRepository } from '../../domain/repositories/ClienteRepository';
import { db } from './firebaseApp';

const COLECCION = 'clientes';

function mapCliente(snapshot: QueryDocumentSnapshot<DocumentData>): Cliente {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    nombre: data.nombre,
    telefono: data.telefono ?? null,
    notas: data.notas ?? null,
    creadoEn: data.creadoEn?.toMillis?.() ?? Date.now(),
  };
}

export class FirestoreClienteRepository implements ClienteRepository {
  suscribir(callback: (clientes: Cliente[]) => void): () => void {
    const clientesQuery = query(collection(db, COLECCION), orderBy('nombre'));
    return onSnapshot(clientesQuery, (snapshot) => {
      callback(snapshot.docs.map(mapCliente));
    });
  }

  async crear(cliente: NuevoCliente): Promise<string> {
    const referencia = await addDoc(collection(db, COLECCION), {
      ...cliente,
      creadoEn: serverTimestamp(),
    });
    return referencia.id;
  }

  async actualizar(id: string, cambios: ActualizacionCliente): Promise<void> {
    await updateDoc(doc(db, COLECCION, id), cambios);
  }

  async eliminar(id: string): Promise<void> {
    await deleteDoc(doc(db, COLECCION, id));
  }
}
