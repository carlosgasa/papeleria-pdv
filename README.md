# Papelería André — POS

PWA de punto de venta e inventario para Papelería André. React + Vite + TypeScript + Tailwind CSS, arquitectura limpia (`domain` / `application` / `infrastructure` / `features`), backend en Firebase (Auth + Firestore + Storage).

## Módulos

- **Inventario**: CRUD de productos, alta rápida escaneando código de barras con la cámara.
- **Ventas**: punto de venta con carrito, cobro (con transacción de Firestore que descuenta stock) e historial con anulación.
- **Inicio**: KPIs de ventas/ganancia, gráfica, top de productos, alertas de stock bajo e inversiones/gastos del negocio.
- **Experimental** (`/experimental`): acomodo de fotos para imprimir, plantillas de tamaños estándar y calculadora aproximada de costo de tinta. Funciona 100% en el cliente, sin Firestore.

## Configuración

1. Instala dependencias:

   ```bash
   npm install
   ```

2. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/), habilita **Authentication** (método correo/contraseña) y crea manualmente los usuarios que podrán entrar (no hay pantalla de registro por diseño). Habilita también **Firestore** y **Storage**.

3. Copia `.env.example` a `.env` y llena los valores con la configuración pública de tu app web de Firebase (Project settings → General → Your apps):

   ```bash
   cp .env.example .env
   ```

4. Despliega las reglas de seguridad (requiere [Firebase CLI](https://firebase.google.com/docs/cli)):

   ```bash
   firebase login
   firebase use --add        # selecciona tu proyecto la primera vez
   firebase deploy --only firestore:rules,storage:rules
   ```

## Desarrollo

```bash
npm run dev       # servidor de desarrollo
npm run lint       # oxlint
npm run build      # type-check + build de producción a dist/
npm run preview    # sirve el build de producción localmente
```

## Despliegue (Firebase Hosting)

```bash
npm run build
firebase deploy --only hosting
```
