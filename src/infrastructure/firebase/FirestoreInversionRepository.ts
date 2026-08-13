import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { InversionRepository } from '../../domain/repositories/InversionRepository';
import type { Inversion, NuevaInversion } from '../../domain/entities/Inversion';
import { db } from './firebaseApp';

const COLECCION = 'inversiones';

function mapInversion(snapshot: QueryDocumentSnapshot<DocumentData>): Inversion {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    concepto: data.concepto,
    monto: data.monto,
    categoria: data.categoria,
    fecha: data.fecha?.toMillis?.() ?? Date.now(),
    usuarioId: data.usuarioId,
  };
}

export class FirestoreInversionRepository implements InversionRepository {
  suscribir(callback: (inversiones: Inversion[]) => void): () => void {
    const inversionesQuery = query(collection(db, COLECCION), orderBy('fecha', 'desc'));
    return onSnapshot(inversionesQuery, (snapshot) => {
      callback(snapshot.docs.map(mapInversion));
    });
  }

  async crear(inversion: NuevaInversion): Promise<string> {
    const referencia = await addDoc(collection(db, COLECCION), {
      ...inversion,
      fecha: serverTimestamp(),
    });
    return referencia.id;
  }

  async eliminar(id: string): Promise<void> {
    await deleteDoc(doc(db, COLECCION, id));
  }
}
