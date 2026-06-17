import { Link } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/AuthContext';

export function DashboardPage(): JSX.Element {
  const { user } = useAuth();

  return (
    <div className="mx-auto max-w-7xl px-8 py-12 animate-fade-in-up">
      <header className="grid grid-cols-1 items-end gap-6 border-b border-ink-700 pb-10 lg:grid-cols-2">
        <div>
          <p className="eyebrow">Buenos días</p>
          <h1 className="display mt-3 text-display-lg text-balance">
            {user?.firstName ?? 'Operador'}
            <span className="text-signal-500">.</span>
          </h1>
          <p className="mt-4 max-w-md font-sans text-base text-ink-300">
            Resumen operativo del día. Use el panel lateral para navegar entre módulos.
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 font-mono text-xs uppercase tracking-eyebrow lg:justify-self-end">
          <div>
            <dt className="text-ink-500">Rol</dt>
            <dd className="mt-1 text-signal-500">{user?.role.toUpperCase()}</dd>
          </div>
          <div>
            <dt className="text-ink-500">Sprint</dt>
            <dd className="mt-1 text-ink-100">01 · ACTIVO</dd>
          </div>
          <div>
            <dt className="text-ink-500">Build</dt>
            <dd className="mt-1 text-ink-100">0.1.0</dd>
          </div>
          <div>
            <dt className="text-ink-500">Env</dt>
            <dd className="mt-1 text-ink-100">DEV</dd>
          </div>
        </dl>
      </header>

      <section
        aria-label="Indicadores"
        className="mt-12 grid grid-cols-1 gap-px bg-ink-700 sm:grid-cols-2 lg:grid-cols-4"
      >
        <Kpi id="01" label="Productos activos" value="—" hint="Crear el primero" />
        <Kpi id="02" label="Categorías" value="11" hint="Seeded · 7 raíz · 4 subcat" />
        <Kpi id="03" label="Usuarios" value="—" hint="Solo admin inicial" />
        <Kpi id="04" label="Sesiones abiertas" value="1" hint="Esta sesión" highlighted />
      </section>

      <section aria-label="Accesos rápidos" className="mt-12">
        <p className="eyebrow mb-6">Operaciones frecuentes</p>
        <div className="grid grid-cols-1 gap-px bg-ink-700 sm:grid-cols-2">
          <QuickAction
            to="/admin/products/new"
            number="045"
            title="Añadir producto"
            description="Registrar un nuevo repuesto en el catálogo activo."
          />
          <QuickAction
            to="/admin/products"
            number="046"
            title="Ver inventario"
            description="Listado completo con stock, precios y estado."
          />
        </div>
      </section>
    </div>
  );
}

function Kpi({
  id,
  label,
  value,
  hint,
  highlighted = false,
}: {
  id: string;
  label: string;
  value: string;
  hint: string;
  highlighted?: boolean;
}): JSX.Element {
  return (
    <article
      className={`flex flex-col gap-3 bg-ink-950 p-6 ${
        highlighted ? 'relative ring-1 ring-inset ring-signal-500/40' : ''
      }`}
    >
      <p className="flex items-center gap-2 font-mono text-eyebrow uppercase tracking-eyebrow text-ink-500">
        <span className="text-signal-500">{id}</span>
        {label}
      </p>
      <p className="display text-6xl text-ink-50">{value}</p>
      <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-500">{hint}</p>
    </article>
  );
}

function QuickAction({
  to,
  number,
  title,
  description,
}: {
  to: string;
  number: string;
  title: string;
  description: string;
}): JSX.Element {
  return (
    <Link
      to={to}
      className="group flex items-start gap-6 bg-ink-950 p-8 transition-colors hover:bg-ink-900"
    >
      <span className="display text-display-sm text-ink-700 transition-colors group-hover:text-signal-500">
        {number}
      </span>
      <div className="flex-1">
        <h3 className="font-sans text-lg font-semibold text-ink-50">{title}</h3>
        <p className="mt-2 font-sans text-sm text-ink-400">{description}</p>
      </div>
      <span
        className="self-center text-2xl text-ink-600 transition-colors group-hover:text-signal-500"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
