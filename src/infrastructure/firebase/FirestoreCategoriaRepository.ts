import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import type { CategoriaRepository } from '../../domain/repositories/CategoriaRepository';
import type { Categoria, NuevaCategoria } from '../../domain/entities/Categoria';
import { db } from './firebaseApp';

const COLECCION = 'categorias';

function mapCategoria(snapshot: QueryDocumentSnapshot<DocumentData>): Categoria {
  const data = snapshot.data();
  return { id: snapshot.id, nombre: data.nombre };
}

export class FirestoreCategoriaRepository implements CategoriaRepository {
  suscribir(callback: (categorias: Categoria[]) => void): () => void {
    const categoriasQuery = query(collection(db, COLECCION), orderBy('nombre'));
    return onSnapshot(categoriasQuery, (snapshot) => {
      callback(snapshot.docs.map(mapCategoria));
    });
  }

  async crear(categoria: NuevaCategoria): Promise<string> {
    const referencia = await addDoc(collection(db, COLECCION), categoria);
    return referencia.id;
  }

  async eliminar(id: string): Promise<void> {
    await deleteDoc(doc(db, COLECCION, id));
  }
}
