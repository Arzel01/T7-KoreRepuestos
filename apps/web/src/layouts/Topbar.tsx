import { useLocation } from 'react-router-dom';

export function Topbar(): JSX.Element {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <header className="flex items-center justify-between border-b border-white/10 bg-[oklch(0.55_0.22_264.376)] px-6 py-4">
      <nav aria-label="Ubicación actual" className="flex items-center gap-2 text-sm text-white/80">
        <span className="font-semibold uppercase tracking-[0.2em] text-white">Ruta</span>
        <span aria-hidden className="text-white/50">
          /
        </span>
        {segments.length === 0 ? (
          <span className="text-white">Inicio</span>
        ) : (
          segments.map((seg, idx) => (
            <span key={`${seg}-${idx}`} className="flex items-center gap-2">
              <span className={idx === segments.length - 1 ? 'text-white' : 'text-white/80'}>
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

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" aria-hidden />
          En línea
        </span>
        <span className="text-sm text-white/80">
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
