# Papelería André — POS

App de punto de venta para una papelería pequeña, uso interno de un solo negocio (sin multi-tenant). Vive en Firebase Hosting: https://papeleria-pos-a76d1.web.app/

## Stack técnico

- **React 19 + Vite + TypeScript**, Tailwind CSS v4 (theming por variables CSS con bloque `@theme`, dark mode por clase vía `@custom-variant dark (&:where(.dark, .dark *))`)
- **React Router v7** (`BrowserRouter`), rutas protegidas con `ProtectedRoute`
- **Firebase**: Auth, Firestore (con persistencia offline), Storage (imágenes de producto)
- **PWA** vía `vite-plugin-pwa` (instalable, funciona offline)
- `date-fns` (locale `es`), `recharts` (gráficas del dashboard), `@zxing/browser` (escáner de código de barras por cámara), `html2canvas` + `jspdf` (tickets/reportes como imagen o PDF)
- Linter: `oxlint`. Sin test runner configurado.

Scripts: `npm run dev`, `npm run build` (`tsc -b && vite build`), `npm run lint`, `npm run preview`.

## Estructura (arquitectura limpia)

```
src/
  domain/
    entities/       tipos de negocio puros (Producto, Venta, Cliente, Abono, Inversion, MovimientoStock, Categoria, Usuario)
    repositories/    interfaces (contratos), sin dependencias de Firebase
  infrastructure/
    firebase/        implementaciones concretas de los repositorios (Firestore*Repository.ts), firebaseApp.ts, storage.ts
    container.ts     inyección de dependencias: une interfaces de domain/repositories con las implementaciones de Firebase
  application/        hooks de React (useProductos, useVentas, etc.) que consumen el container — es la única capa que las features deben usar para tocar datos
  features/            UI por módulo: auth, inventario, ventas, clientes, dashboard, experimental
  routes/               AppRouter, ProtectedRoute
  shared/               layouts, componentes, hooks y utilidades reusables (compartir.ts, etc.)
```

Regla de la arquitectura: **ninguna feature accede a Firestore/Storage directamente**. Todo pasa por `application/*` → `container.ts` → `infrastructure/firebase/*`. Si se necesita un nuevo tipo de dato, se agrega entidad en `domain/entities`, interfaz en `domain/repositories`, implementación en `infrastructure/firebase`, se registra en `container.ts`, y se expone un hook en `application/`.

## Navegación / módulos

- **Inicio** (`/`) — Dashboard: KPIs, gráficas, inversiones, switch para ocultar montos.
- **Ventas** (`/ventas`) — POS: carrito, checkout con descuento, anulación de venta, ticket compartible (imagen o texto), modo fiado (crédito a cliente).
- **Inventario** (`/inventario`) — CRUD de productos, escaneo de código de barras por cámara, historial de movimientos de stock, notificaciones de stock bajo, exportar/importar CSV con plantilla descargable.
- **Clientes** (`/clientes`) — clientes con saldo fiado y registro de abonos.
- **Herramientas** (`/experimental`) — utilidades sin relación con el punto de venta, nada se guarda en la nube: acomodo de fotos por tamaño para imprimir, cuadrícula de imágenes (con recorte/zoom/pan ajustable por imagen), calculadora de tinta, presupuestos rápidos (cotizaciones a partir del inventario real).

## Autenticación

- **Firebase Auth, email/password.** No hay pantalla de registro público — el único usuario se da de alta manualmente desde la consola de Firebase (Authentication > Users). La app asume una sola cuenta.
- `AuthContext`/`AuthProvider` (`src/application/auth/`) suscriben el estado de sesión (`onAuthStateChanged` vía `AuthRepository`); `ProtectedRoute` redirige a `/login` si no hay sesión.
- No hay flujo de "olvidé mi contraseña" ni gestión de usuarios en la UI — cualquier cambio de credenciales se hace desde la consola de Firebase.

## Firestore: modelo de datos y reglas

Colecciones top-level (todas con documentos autogenerados, sin subcolecciones):

- `productos` — nombre, `codigoBarras` (opcional), categoria, costo, precioVenta, stock, stockMinimo, imagenUrl, creadoEn/actualizadoEn
- `ventas` — items (snapshot de producto/precio/costo al momento de vender), total, descuento, metodoPago (`efectivo | tarjeta | transferencia | fiado`), clienteId opcional, anulada/anuladaEn
- `movimientosStock` — historial de entradas/salidas/ventas/anulaciones por producto, con stock resultante
- `clientes` — nombre, telefono, notas, saldo (vía abonos)
- `abonos` — pagos a cuenta de un cliente (fiado)
- `inversiones` — gastos/compras del negocio (concepto, monto, categoria)
- `categorias` — categorías de producto

**Reglas de seguridad** (`firestore.rules`): cada colección permite `read, write` solo si `request.auth != null`; todo lo demás (`{document=**}`) se deniega por defecto. No se valida un UID específico por documento — la restricción a "un solo usuario" se logra porque **no existe registro público** y solo hay una cuenta dada de alta en Auth, así que cualquier request autenticado es, en la práctica, ese único usuario. Si en algún momento se agregan más cuentas, estas reglas dejarían de ser exclusivas de un solo dueño y habría que añadir validación por UID.

**Escrituras sin transacción a propósito**: `registrarVenta`, `anularVenta` (`FirestoreVentaRepository.ts`) y `registrarAjuste` (`FirestoreMovimientoStockRepository.ts`) usan lectura simple (`getDoc`) + `writeBatch` en vez de `runTransaction`, porque las transacciones de Firestore requieren ida y vuelta al servidor y fallan sin conexión. Esto es una decisión consciente para soportar venta offline, aceptando como trade-off documentado un riesgo pequeño de stock negativo si dos dispositivos venden el mismo producto casi agotado al mismo tiempo estando ambos offline.

**Persistencia offline**: Firestore se inicializa con `persistentLocalCache` + `persistentMultipleTabManager` (`infrastructure/firebase/firebaseApp.ts`), así que la app puede vender sin conexión y sincroniza sola al reconectar.

## Variables de entorno

La config pública de Firebase (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) vive en variables `VITE_FIREBASE_*` leídas por `firebaseApp.ts`. **No hardcodear estos valores ni el UID del usuario en el código o en este archivo.**

- `.env` — valores reales, nunca se commitea (ver `.gitignore`).
- `.env.example` — plantilla vacía, sí se commitea, documenta qué variables se necesitan.

Es seguro exponer estos valores `VITE_FIREBASE_*` en el cliente (son públicos por diseño de Firebase) siempre que `firestore.rules` esté bien configurado, que es lo que realmente protege los datos.

## Decisiones de diseño/UX ya tomadas

- **Temas**: claro, oscuro y "pastel" (estilo volante de papelería, fondo de hoja cuadriculada, banderines de colores), seleccionable y persistido en `localStorage`. Ver `application/theme/ThemeContext.tsx`.
- **Dashboard con acentos de color por tipo de tarjeta** (bordes superiores de color, sutil, no "arcoíris") — cuidado: en dark mode hay que fijar explícitamente `dark:border-t-{color}-500` además del claro, porque `dark:border-gray-800` (shorthand de las 4 aristas) gana la cascada sobre el borde de un solo lado si no se sobreescribe.
- **Código de barras opcional** en productos (no todos los artículos de una papelería vienen con uno).
- **Importación de inventario vía plantilla CSV descargable** (no un importador ad-hoc de un Excel específico) — el usuario llena la plantilla y la sube; celdas vacías de costo/precio/stock deben tratarse como "sin dato", no como `0` (`Number('')` es `0` en JS, hay que chequear `.trim()` antes de convertir).
- **Presupuesto rápido solo con productos reales del inventario** — no se permite agregar artículos de texto libre, para que la cotización sea siempre consistente con lo que existe en stock/precio.
- **Cuadrícula de imágenes**: soporta cualquier cantidad de fotos, grid configurable, recorte automático tipo `cover` con opción de desactivar (switch "deformar sí/no"), y ajuste individual de zoom/pan por imagen antes de exportar a PDF o imprimir. Ojo: el Preflight de Tailwind pone `img { max-width: 100%; height: auto }` global, lo que rompe cualquier `<img>` posicionado por porcentajes (zoom/pan) si no se le agrega `maxWidth: 'none'` explícito en su `style`.
- **Compartir**: tickets de venta y presupuestos se pueden compartir como texto o como imagen (Web Share API con fallback a portapapeles/descarga) — utilidad compartida en `shared/utils/compartir.ts`.
- **Caché de Hosting**: `index.html`, `manifest.webmanifest` y `sw.js` se sirven con `Cache-Control: no-cache` (para que los updates se vean de inmediato); los assets con hash (`/assets/**`) usan `immutable, max-age` largo. Importante: en `firebase.json`, el `source` de un header se matchea contra la ruta *solicitada* (`/`), no contra el archivo destino tras el rewrite (`/index.html`) — hay que declarar ambos.
- **Workflow de deploy**: sin credenciales de GitHub en el entorno de desarrollo asistido; los commits se hacen ahí pero el `git push` lo hace el dueño manualmente. El deploy a Firebase Hosting (`firebase deploy --only hosting`) sí se puede correr directo porque la CLI ya está autenticada.
