import { NavLink } from 'react-router-dom';

import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { useAuth } from '@/features/auth/hooks/AuthContext';

interface NavItem {
  id: string;
  label: string;
  to: string;
  icon: string;
  disabled?: boolean;
  /** Si se omite: visible para cualquier rol que ya haya entrado al panel. */
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { id: '00', label: 'Dashboard', to: '/admin', icon: '◧' },
  { id: '01', label: 'Cotizaciones', to: '/admin/quotations', icon: '✉' },
  { id: '02', label: 'Productos', to: '/admin/products', icon: '◆', adminOnly: true },
  { id: '03', label: 'Categorías', to: '/admin/categories', icon: '⊞', adminOnly: true },
  { id: '04', label: 'Mantenimiento', to: '/admin/maintenance', icon: '⚙', adminOnly: true },
  { id: '05', label: 'Analíticas', to: '/admin/analytics', icon: '◈', adminOnly: true },
  { id: '06', label: 'Usuarios', to: '/admin/users', icon: '◉', disabled: true, adminOnly: true },
  { id: '07', label: 'Mi Garaje', to: '/garage', icon: '⛐' },
];

interface SidebarProps {
  /** Controla el drawer móvil (<lg). En desktop la barra siempre está visible. */
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

/** Contenido compartido entre la barra fija de desktop y el drawer móvil. */
function SidebarContent({ onNavigate }: { onNavigate?: () => void }): JSX.Element {
  const { user, isAdmin, logout } = useAuth();
  const items = NAV.filter((item) => !item.adminOnly || isAdmin);

  return (
    <div className="flex h-full flex-col">
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
          {items.map((item) =>
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
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    [
                      'group flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 transition-colors',
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
          className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-white/10 text-sm font-medium text-white transition-colors hover:bg-white/15"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

/**
 * Navegación del panel admin (3.4 — responsive).
 *
 * Desktop (lg+): barra fija de 288px, siempre visible.
 * Móvil/tablet (<lg): mismo contenido dentro de un drawer (`Sheet`), abierto
 * por el botón de menú en `Topbar` — mismo patrón que `CatalogSidebar`.
 */
export function Sidebar({ mobileOpen, onMobileOpenChange }: SidebarProps): JSX.Element {
  return (
    <>
      <aside
        className="hidden w-72 shrink-0 flex-col border-r border-white/10 bg-navy-900 text-white lg:flex"
        aria-label="Navegación del panel"
      >
        <SidebarContent />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="border-white/10 bg-navy-900 p-0 text-white"
        >
          <SheetTitle className="sr-only">Navegación del panel</SheetTitle>
          <SheetDescription className="sr-only">
            Secciones del panel administrativo de Kore Repuestos.
          </SheetDescription>
          <SidebarContent onNavigate={() => onMobileOpenChange(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
