import type { ActualizacionCliente, Cliente, NuevoCliente } from '../entities/Cliente';

export interface ClienteRepository {
  suscribir(callback: (clientes: Cliente[]) => void): () => void;
  crear(cliente: NuevoCliente): Promise<string>;
  actualizar(id: string, cambios: ActualizacionCliente): Promise<void>;
  eliminar(id: string): Promise<void>;
}
