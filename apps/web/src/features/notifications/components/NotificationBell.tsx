import { Bell } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks/AuthContext';

import { useNotifications } from '../hooks/useNotifications';

function formatWhen(iso: string): string {
  const [date] = iso.split('T');
  const [y, m, d] = date.split('-');
  return `${d}/${m}/${y}`;
}

/**
 * Campana de notificaciones para la barra de navegación (US#2). Muestra el
 * conteo de no leídas y un desplegable con las notificaciones in-app; al abrir
 * un ítem lo marca como leído. No se renderiza para invitados.
 */
export function NotificationBell(): JSX.Element | null {
  const { isAuthenticated } = useAuth();
  const { notifications, unreadCount, loading, markRead } = useNotifications();

  if (!isAuthenticated) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={`Notificaciones${unreadCount > 0 ? ` (${unreadCount} sin leer)` : ''}`}
        className={buttonVariants({
          variant: 'outline',
          size: 'sm',
          className: 'relative gap-1.5',
        })}
      >
        <Bell className="size-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1.5 -top-1.5 h-4 min-w-4 justify-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notificaciones</span>
          {unreadCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {unreadCount} sin leer
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {loading && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">Cargando…</p>
        )}

        {!loading && notifications.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            No tienes notificaciones.
          </p>
        )}

        <div className="max-h-80 overflow-y-auto">
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                if (!n.readAt) void markRead(n.id);
              }}
              className={`flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left last:border-b-0 hover:bg-muted ${
                n.readAt ? 'opacity-60' : 'bg-primary/5'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{n.titulo}</span>
                {!n.readAt && <span className="size-2 shrink-0 rounded-full bg-primary" />}
              </div>
              <span className="text-xs text-muted-foreground">{n.mensaje}</span>
              <span className="text-[10px] text-muted-foreground">{formatWhen(n.createdAt)}</span>
            </button>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
