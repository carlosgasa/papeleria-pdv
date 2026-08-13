import { FirebaseAuthRepository } from './firebase/FirebaseAuthRepository';
import { FirestoreCategoriaRepository } from './firebase/FirestoreCategoriaRepository';
import { FirestoreInversionRepository } from './firebase/FirestoreInversionRepository';
import { FirestoreProductoRepository } from './firebase/FirestoreProductoRepository';
import { FirestoreVentaRepository } from './firebase/FirestoreVentaRepository';
import { FirestoreMovimientoStockRepository } from './firebase/FirestoreMovimientoStockRepository';
import { FirestoreClienteRepository } from './firebase/FirestoreClienteRepository';
import { FirestoreAbonoRepository } from './firebase/FirestoreAbonoRepository';

export const container = {
  authRepository: new FirebaseAuthRepository(),
  productoRepository: new FirestoreProductoRepository(),
  ventaRepository: new FirestoreVentaRepository(),
  inversionRepository: new FirestoreInversionRepository(),
  categoriaRepository: new FirestoreCategoriaRepository(),
  movimientoStockRepository: new FirestoreMovimientoStockRepository(),
  clienteRepository: new FirestoreClienteRepository(),
  abonoRepository: new FirestoreAbonoRepository(),
};
