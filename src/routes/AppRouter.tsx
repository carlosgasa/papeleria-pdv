import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '../application/auth/AuthContext';
import { LoginPage } from '../features/auth/LoginPage';
import { AppLayout } from '../shared/layouts/AppLayout';
import { ProtectedRoute } from './ProtectedRoute';

const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const InventarioPage = lazy(() =>
  import('../features/inventario/InventarioPage').then((m) => ({ default: m.InventarioPage })),
);
const VentasPage = lazy(() =>
  import('../features/ventas/VentasPage').then((m) => ({ default: m.VentasPage })),
);
const ExperimentalPage = lazy(() =>
  import('../features/experimental/ExperimentalPage').then((m) => ({ default: m.ExperimentalPage })),
);
const ClientesPage = lazy(() =>
  import('../features/clientes/ClientesPage').then((m) => ({ default: m.ClientesPage })),
);

function CargandoPagina() {
  return (
    <div className="flex h-full min-h-[50svh] items-center justify-center">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
    </div>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route
                path="/"
                element={
                  <Suspense fallback={<CargandoPagina />}>
                    <DashboardPage />
                  </Suspense>
                }
              />
              <Route
                path="/inventario"
                element={
                  <Suspense fallback={<CargandoPagina />}>
                    <InventarioPage />
                  </Suspense>
                }
              />
              <Route
                path="/ventas"
                element={
                  <Suspense fallback={<CargandoPagina />}>
                    <VentasPage />
                  </Suspense>
                }
              />
              <Route
                path="/experimental"
                element={
                  <Suspense fallback={<CargandoPagina />}>
                    <ExperimentalPage />
                  </Suspense>
                }
              />
              <Route
                path="/clientes"
                element={
                  <Suspense fallback={<CargandoPagina />}>
                    <ClientesPage />
                  </Suspense>
                }
              />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
