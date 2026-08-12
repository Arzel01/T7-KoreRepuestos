import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';

import { Button } from '@/components/ui/button';

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps): JSX.Element {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <header className="flex items-center justify-between gap-3 border-b border-white/10 bg-navy-700 px-4 py-3 sm:px-6 sm:py-4">
      <div className="flex min-w-0 items-center gap-3">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 hover:text-white lg:hidden"
          onClick={onMenuClick}
          aria-label="Abrir navegación"
        >
          <Menu aria-hidden className="size-5" />
        </Button>

        <nav
          aria-label="Ubicación actual"
          className="flex min-w-0 items-center gap-2 overflow-hidden text-sm text-white/80"
        >
          <span className="hidden font-semibold uppercase tracking-[0.2em] text-white sm:inline">
            Ruta
          </span>
          <span aria-hidden className="hidden text-white/50 sm:inline">
            /
          </span>
          {segments.length === 0 ? (
            <span className="truncate text-white">Inicio</span>
          ) : (
            segments.map((seg, idx) => (
              <span key={`${seg}-${idx}`} className="flex min-w-0 items-center gap-2">
                <span
                  className={`truncate ${idx === segments.length - 1 ? 'text-white' : 'text-white/80'}`}
                >
                  {seg}
                </span>
                {idx < segments.length - 1 && (
                  <span aria-hidden className="text-white/50">
                    /
                  </span>
                )}
              </span>
            ))
          )}
        </nav>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <span className="hidden items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white sm:inline-flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
          En línea
        </span>
        <span className="hidden text-sm text-white/80 sm:inline">
          {new Date().toLocaleDateString('es-PE', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      </div>
    </header>
  );
}
