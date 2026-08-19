import { NavLink, Outlet } from 'react-router-dom';
import clsx from 'clsx';
import { useAuth } from '../../application/auth/useAuth';
import { ThemeToggle } from '../components/ThemeToggle';
import { PastelBunting } from '../components/PastelBunting';
import { AlertasStockToggle } from '../components/AlertasStockToggle';
import { EstadoConexionBanner } from '../components/EstadoConexionBanner';

const ENLACES = [
  { to: '/', label: 'Inicio', icon: '📊', fin: true },
  { to: '/ventas', label: 'Ventas', icon: '🛒' },
  { to: '/inventario', label: 'Inventario', icon: '📦' },
  { to: '/clientes', label: 'Clientes', icon: '👥' },
  { to: '/experimental', label: 'Herramientas', icon: '🖼️' },
];

function claseEnlace(activo: boolean, variante: 'sidebar' | 'bottom') {
  if (variante === 'sidebar') {
    return clsx(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
      activo
        ? 'bg-brand-600 text-white'
        : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
    );
  }
  return clsx(
    'flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium',
    activo ? 'text-brand-600 dark:text-brand-400' : 'text-gray-500 dark:text-gray-400',
  );
}

export function AppLayout() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <div className="pagina-fondo flex min-h-svh flex-col bg-gray-50 dark:bg-gray-950">
      <EstadoConexionBanner />
      <PastelBunting />

      <div className="flex flex-1 flex-col md:flex-row">
        <aside className="hidden w-56 shrink-0 border-r border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 md:flex md:flex-col">
          <div className="mb-6 flex items-center gap-2 px-1">
            <span className="text-xl">📎</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              Papelería André
            </span>
          </div>

          <nav className="flex flex-1 flex-col gap-1">
            {ENLACES.map((enlace) => (
              <NavLink
                key={enlace.to}
                to={enlace.to}
                end={enlace.fin}
                className={({ isActive }) => claseEnlace(isActive, 'sidebar')}
              >
                <span>{enlace.icon}</span>
                {enlace.label}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-gray-200 pt-3 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <AlertasStockToggle />
            </div>
            <p className="mt-3 truncate px-1 text-xs text-gray-500 dark:text-gray-400">{usuario?.email}</p>
            <button
              onClick={() => void cerrarSesion()}
              className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900 md:hidden">
          <div className="flex items-center gap-2">
            <span className="text-lg">📎</span>
            <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">
              Papelería André
            </span>
          </div>
          <div className="flex items-center gap-1">
            <AlertasStockToggle />
            <ThemeToggle />
            <button
              onClick={() => void cerrarSesion()}
              className="ml-1 text-xs font-medium text-gray-500 dark:text-gray-400"
            >
              Salir
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <Outlet />
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-10 flex border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 md:hidden">
          {ENLACES.map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              end={enlace.fin}
              className={({ isActive }) => claseEnlace(isActive, 'bottom')}
            >
              <span className="text-lg">{enlace.icon}</span>
              {enlace.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
