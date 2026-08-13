import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { Abono, NuevoAbono } from '../../domain/entities/Abono';
import type { AbonoRepository } from '../../domain/repositories/AbonoRepository';
import { db } from './firebaseApp';

const COLECCION = 'abonos';

function mapAbono(snapshot: QueryDocumentSnapshot<DocumentData>): Abono {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    clienteId: data.clienteId,
    monto: data.monto,
    fecha: data.fecha?.toMillis?.() ?? Date.now(),
    usuarioId: data.usuarioId,
  };
}

export class FirestoreAbonoRepository implements AbonoRepository {
  suscribir(callback: (abonos: Abono[]) => void): () => void {
    const abonosQuery = query(collection(db, COLECCION), orderBy('fecha', 'desc'));
    return onSnapshot(abonosQuery, (snapshot) => {
      callback(snapshot.docs.map(mapAbono));
    });
  }

  async registrar(abono: NuevoAbono): Promise<string> {
    const referencia = await addDoc(collection(db, COLECCION), {
      ...abono,
      fecha: serverTimestamp(),
    });
    return referencia.id;
  }
}
