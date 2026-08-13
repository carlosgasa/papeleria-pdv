import { FirebaseError } from 'firebase/app';

const MENSAJES: Record<string, string> = {
  'auth/invalid-email': 'El correo no tiene un formato válido.',
  'auth/invalid-credential': 'Correo o contraseña incorrectos.',
  'auth/user-disabled': 'Esta cuenta ha sido deshabilitada.',
  'auth/too-many-requests': 'Demasiados intentos fallidos. Intenta más tarde.',
  'auth/network-request-failed': 'Error de conexión. Revisa tu internet.',
};

export function mensajeErrorAuth(error: unknown): string {
  if (error instanceof FirebaseError) {
    return MENSAJES[error.code] ?? 'No se pudo iniciar sesión. Intenta de nuevo.';
  }
  return 'No se pudo iniciar sesión. Intenta de nuevo.';
}
