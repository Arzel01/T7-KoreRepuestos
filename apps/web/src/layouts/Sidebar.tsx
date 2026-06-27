import { NavLink } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/AuthContext';

interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: string;
  disabled?: boolean;
}

const NAV: NavItem[] = [
  { id: '00', label: 'Dashboard', to: '/admin', icon: '◧' },
  { id: '01', label: 'Productos', to: '/admin/products', icon: '◆' },
  { id: '02', label: 'Categorías', to: '/admin/categories', icon: '⊞' },
  { id: '03', label: 'Mantenimiento', to: '/admin/maintenance', icon: '⚙' },
  { id: '04', label: 'Usuarios', to: '/admin/users', icon: '◉', disabled: true },
  { id: '05', label: 'Mi Garaje', to: '/garage', icon: '⛐' },
];

export function Sidebar(): JSX.Element {
  const { user, logout } = useAuth();

  return (
    <aside
      className="flex w-72 shrink-0 flex-col border-r border-white/10 bg-navy-900 text-white"
      aria-label="Navegación del panel"
    >
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold tracking-tight text-white">KORE</span>
          <span className="text-[10px] uppercase tracking-[0.3em] text-white/70">v0.1</span>
        </div>
        <p className="mt-1 text-[10px] uppercase tracking-[0.3em] text-white/70">
          Panel administrativo
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto py-4" aria-label="Secciones del panel">
        <ul className="space-y-1 px-3">
          {NAV.map((item) =>
            item.disabled ? (
              <li key={item.to}>
                <div
                  aria-disabled="true"
                  className="flex cursor-not-allowed items-center gap-3 rounded-xl px-4 py-3 text-white/40"
                >
                  <span aria-hidden className="text-base font-semibold">
                    {item.icon}
                  </span>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  <span className="text-[10px] uppercase tracking-wide text-white/30">Pronto</span>
                </div>
              </li>
            ) : (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === '/admin'}
                  className={({ isActive }) =>
                    [
                      'group flex items-center gap-3 rounded-xl px-4 py-3 transition-colors',
                      isActive
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/80 hover:bg-white/10 hover:text-white',
                    ].join(' ')
                  }
                >
                  <span aria-hidden className="text-base font-semibold">
                    {item.icon}
                  </span>
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                </NavLink>
              </li>
            ),
          )}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-6">
        {user && (
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              Sesión activa
            </p>
            <p className="mt-2 truncate text-sm font-semibold text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate text-xs text-white/70">{user.email}</p>
            <span className="mt-2 inline-flex rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white">
              {user.role}
            </span>
          </div>
        )}
        <button
          type="button"
          onClick={() => void logout()}
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-white/10 bg-white/10 text-sm font-medium text-white transition-colors hover:bg-white/15"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
