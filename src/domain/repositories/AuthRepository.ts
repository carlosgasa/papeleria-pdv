import type { Usuario } from '../entities/Usuario';

export interface AuthRepository {
  iniciarSesion(email: string, password: string): Promise<Usuario>;
  cerrarSesion(): Promise<void>;
  suscribirCambiosSesion(callback: (usuario: Usuario | null) => void): () => void;
}
