import { NavLink } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthContext';

/**
 * Sidebar del panel administrativo.
 *
 * Diseño industrial: numerada, monospace, sin esquinas redondeadas.
 * Cada ítem es un par "ID + label" — como un panel de control real.
 *
 * Estructura accesible:
 *   <nav aria-label="Navegación del panel">
 *     <ul>
 *       <li><NavLink ... /></li>
 *     </ul>
 *   </nav>
 *
 * El estilo "active" lo provee NavLink — recibimos `isActive` y aplicamos
 * un borde naranja a la izquierda + texto blanco.
 */
interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: string; // glifo unicode — evitamos depender de un icon set externo
}

const NAV: NavItem[] = [
  { id: '00', label: 'Dashboard', to: '/admin', icon: '◧' },
  { id: '01', label: 'Productos', to: '/admin/products', icon: '◆' },
  { id: '02', label: 'Categorías', to: '/admin/categories', icon: '⊞' },
  { id: '03', label: 'Usuarios', to: '/admin/users', icon: '◉' },
];

export function Sidebar(): JSX.Element {
  const { user, logout } = useAuth();

  return (
    <aside
      className="flex w-64 shrink-0 flex-col border-r border-ink-700 bg-ink-900"
      aria-label="Navegación del panel"
    >
      {/* ---------- Brand ---------- */}
      <div className="border-b border-ink-700 px-6 py-6">
        <div className="flex items-baseline gap-2">
          <span className="display text-3xl text-signal-500">KORE</span>
          <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-500">
            v0.1
          </span>
        </div>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-ink-500">
          Panel administrativo
        </p>
      </div>

      {/* ---------- Nav ---------- */}
      <nav className="flex-1 overflow-y-auto py-6" aria-label="Secciones del panel">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/admin'}
                className={({ isActive }) =>
                  [
                    'group flex items-center gap-4 border-l-2 px-6 py-3 transition-colors',
                    isActive
                      ? 'border-signal-500 bg-ink-850 text-ink-50'
                      : 'border-transparent text-ink-300 hover:border-ink-600 hover:bg-ink-850 hover:text-ink-50',
                  ].join(' ')
                }
              >
                <span aria-hidden className="font-mono text-lg text-signal-500">
                  {item.icon}
                </span>
                <span className="flex-1">
                  <span className="block font-mono text-[10px] uppercase tracking-eyebrow text-ink-500 group-hover:text-ink-400">
                    {item.id}
                  </span>
                  <span className="font-sans text-sm font-medium">{item.label}</span>
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ---------- Usuario actual ---------- */}
      <div className="border-t border-ink-700 p-6">
        {user && (
          <div className="mb-4">
            <p className="eyebrow">Sesión activa</p>
            <p className="mt-2 truncate font-sans text-sm font-medium text-ink-100">
              {user.firstName} {user.lastName}
            </p>
            <p className="truncate font-mono text-xs text-ink-400">{user.email}</p>
            <span className="tag mt-2 border-signal-500/40 text-signal-500">
              {user.role.toUpperCase()}
            </span>
          </div>
        )}
        <button type="button" onClick={() => void logout()} className="btn-ghost w-full">
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
