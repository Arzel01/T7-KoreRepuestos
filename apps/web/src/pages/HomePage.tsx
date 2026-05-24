import { Link } from 'react-router-dom';

import { useAuth } from '@/features/auth/AuthContext';

/**
 * Landing pública — la cara visible del sistema antes de iniciar sesión.
 *
 * Misma dirección estética que el panel admin: ink + signal + Bebas Neue.
 */
export function HomePage(): JSX.Element {
  const { isAuthenticated, isAdmin } = useAuth();

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink-950">
      <div aria-hidden className="absolute inset-x-0 top-0 h-1 bg-hazard-stripes" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-tech-grid bg-tech-grid opacity-[0.05]"
      />

      <header className="relative mx-auto flex max-w-7xl items-center justify-between px-8 py-8">
        <div className="flex items-baseline gap-3">
          <span className="display text-4xl text-signal-500">KORE</span>
          <span className="font-mono text-xs uppercase tracking-eyebrow text-ink-500">
            Repuestos
          </span>
        </div>
        <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-wider">
          {isAuthenticated ? (
            <Link to={isAdmin ? '/admin' : '/'} className="text-signal-500 hover:underline">
              {isAdmin ? 'Ir al panel →' : 'Mi cuenta →'}
            </Link>
          ) : (
            <>
              <Link to="/auth/login" className="text-ink-300 hover:text-ink-50">
                Iniciar sesión
              </Link>
              <Link to="/auth/register" className="btn-primary px-4 py-2 text-xs">
                Crear cuenta →
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 px-8 py-24 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="eyebrow">Catálogo · 2026</p>
          <h1 className="display mt-6 text-display-lg leading-[0.85] text-balance">
            Repuestos
            <br />
            <span className="text-signal-500">disponibles</span>
            <br />
            sin pérdida.
          </h1>
          <p className="mt-8 max-w-xl font-sans text-lg leading-relaxed text-ink-300">
            Plataforma operacional para distribuidores. Catálogo, planes de mantenimiento y
            cotizaciones — todo en un solo lugar.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Link to="/auth/register" className="btn-primary">
              Empezar ahora <span aria-hidden>→</span>
            </Link>
            <a
              href="#features"
              className="font-mono text-xs uppercase tracking-wider text-ink-400 hover:text-signal-500"
            >
              Ver capacidades ↓
            </a>
          </div>
        </div>

        <aside className="border border-ink-700 bg-ink-900 p-8" aria-label="Ficha técnica">
          <p className="eyebrow">Ficha · 001</p>
          <dl className="mt-6 grid grid-cols-2 gap-y-6 font-mono text-xs uppercase tracking-eyebrow">
            <div className="col-span-2">
              <dt className="text-ink-500">Versión</dt>
              <dd className="mt-1 display text-3xl text-signal-500">0.1.0</dd>
            </div>
            <div>
              <dt className="text-ink-500">Stack</dt>
              <dd className="mt-1 text-ink-100">NestJS</dd>
            </div>
            <div>
              <dt className="text-ink-500">Front</dt>
              <dd className="mt-1 text-ink-100">React 18</dd>
            </div>
            <div>
              <dt className="text-ink-500">DB</dt>
              <dd className="mt-1 text-ink-100">Postgres 16</dd>
            </div>
            <div>
              <dt className="text-ink-500">Cobertura</dt>
              <dd className="mt-1 text-ink-100">e2e + unit</dd>
            </div>
          </dl>
        </aside>
      </section>

      <footer className="relative border-t border-ink-700 px-8 py-6">
        <p className="mx-auto max-w-7xl font-mono text-[10px] uppercase tracking-eyebrow text-ink-500">
          © 2026 Kore Repuestos · Sistema interno · Sprint 1 — auth + catálogo
        </p>
      </footer>
    </main>
  );
}
