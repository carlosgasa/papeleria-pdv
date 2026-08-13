import { createContext, useEffect, useState, type ReactNode } from 'react';
import type { Usuario } from '../../domain/entities/Usuario';
import { container } from '../../infrastructure/container';

interface AuthContextValue {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const desuscribir = container.authRepository.suscribirCambiosSesion((usuarioActual) => {
      setUsuario(usuarioActual);
      setCargando(false);
    });
    return desuscribir;
  }, []);

  async function iniciarSesion(email: string, password: string): Promise<void> {
    await container.authRepository.iniciarSesion(email, password);
  }

  async function cerrarSesion(): Promise<void> {
    await container.authRepository.cerrarSesion();
  }

  return (
    <AuthContext.Provider value={{ usuario, cargando, iniciarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}
