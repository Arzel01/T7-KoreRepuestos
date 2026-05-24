import { Outlet } from 'react-router-dom';

import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/**
 * Layout base del panel administrativo.
 *
 * Estructura:
 *   ┌──────────┬──────────────────────────────────┐
 *   │          │            Topbar                │
 *   │ Sidebar  ├──────────────────────────────────┤
 *   │          │                                  │
 *   │  (fixed) │            <Outlet />            │
 *   │          │       (rutas hijas)              │
 *   └──────────┴──────────────────────────────────┘
 *
 * Se usa como `element` de la rama de rutas /admin/* en React Router v6;
 * el `<Outlet />` renderiza la página específica.
 */
export function AdminLayout(): JSX.Element {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-ink-950 text-ink-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-ink-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
