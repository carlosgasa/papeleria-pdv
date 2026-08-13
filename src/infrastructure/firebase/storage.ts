import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebaseApp';

export async function subirImagenProducto(productoId: string, archivo: File): Promise<string> {
  const extension = archivo.name.split('.').pop() ?? 'jpg';
  const referencia = ref(storage, `productos/${productoId}/${Date.now()}.${extension}`);
  await uploadBytes(referencia, archivo);
  return getDownloadURL(referencia);
}

export async function eliminarImagenProducto(url: string): Promise<void> {
  try {
    await deleteObject(ref(storage, url));
  } catch {
    // La imagen ya pudo haber sido eliminada; no es crítico.
  }
}
