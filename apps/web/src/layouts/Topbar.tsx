import { useLocation } from 'react-router-dom';

export function Topbar(): JSX.Element {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <header className="flex items-center justify-between border-b border-ink-700 bg-ink-900 px-8 py-4">
      <nav
        aria-label="Ubicación actual"
        className="flex items-center gap-3 font-mono text-xs uppercase tracking-eyebrow"
      >
        <span className="text-ink-500">PATH</span>
        <span aria-hidden className="text-ink-600">
          /
        </span>
        {segments.length === 0 ? (
          <span className="text-ink-100">root</span>
        ) : (
          segments.map((seg, idx) => (
            <span key={`${seg}-${idx}`} className="flex items-center gap-3">
              <span className={idx === segments.length - 1 ? 'text-signal-500' : 'text-ink-300'}>
                {seg}
              </span>
              {idx < segments.length - 1 && (
                <span aria-hidden className="text-ink-600">
                  /
                </span>
              )}
            </span>
          ))
        )}
      </nav>

      <div className="flex items-center gap-4">
        <span className="tag border-success-500/40 text-success-500">
          <span className="h-1.5 w-1.5 animate-pulse bg-success-500" aria-hidden />
          LIVE
        </span>
        <span className="font-mono text-xs text-ink-500">
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
