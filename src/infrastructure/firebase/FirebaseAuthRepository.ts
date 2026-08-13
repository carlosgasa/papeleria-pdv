import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import type { AuthRepository } from '../../domain/repositories/AuthRepository';
import type { Usuario } from '../../domain/entities/Usuario';
import { auth } from './firebaseApp';

function mapUsuario(user: User): Usuario {
  return { id: user.uid, email: user.email ?? '' };
}

export class FirebaseAuthRepository implements AuthRepository {
  async iniciarSesion(email: string, password: string): Promise<Usuario> {
    const credenciales = await signInWithEmailAndPassword(auth, email, password);
    return mapUsuario(credenciales.user);
  }

  async cerrarSesion(): Promise<void> {
    await signOut(auth);
  }

  suscribirCambiosSesion(callback: (usuario: Usuario | null) => void): () => void {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? mapUsuario(user) : null);
    });
  }
}
