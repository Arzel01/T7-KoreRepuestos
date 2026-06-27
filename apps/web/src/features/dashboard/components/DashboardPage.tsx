import { Link } from 'react-router-dom';

import { useAuth } from '@/features/auth/hooks/AuthContext';

export function DashboardPage(): JSX.Element {
  const { user } = useAuth();

  return (
    <div className="storefront min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10 sm:px-8 lg:py-12">
        <header className="rounded-2xl border border-border bg-card p-8 shadow-sm sm:p-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div>
              <p className="text-sm font-semibold text-primary">Buenos días</p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
                {user?.firstName ?? 'Operador'}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                Resumen operativo del día. Usa el panel lateral para navegar entre módulos.
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-4 rounded-xl bg-muted/30 p-4 text-sm">
              <div>
                <dt className="text-muted-foreground">Rol</dt>
                <dd className="mt-1 font-medium text-primary">{user?.role}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Estado</dt>
                <dd className="mt-1 font-medium text-foreground">Operativo</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Build</dt>
                <dd className="mt-1 font-medium text-foreground">0.1.0</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Entorno</dt>
                <dd className="mt-1 font-medium text-foreground">Dev</dd>
              </div>
            </dl>
          </div>
        </header>

        <section
          aria-label="Indicadores"
          className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <Kpi id="01" label="Productos activos" value="—" hint="Crear el primero" />
          <Kpi id="02" label="Categorías" value="11" hint="Semilla · 7 raíz · 4 subcat" />
          <Kpi id="03" label="Usuarios" value="—" hint="Solo administrador inicial" />
          <Kpi id="04" label="Sesiones abiertas" value="1" hint="Esta sesión" highlighted />
        </section>

        <section aria-label="Accesos rápidos" className="mt-8">
          <p className="mb-6 text-sm font-semibold text-primary">Operaciones frecuentes</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <QuickAction
              to="/admin/products/new"
              number="+"
              title="Añadir producto"
              description="Registrar un nuevo repuesto en el catálogo activo."
            />
            <QuickAction
              to="/admin/products"
              number="✓"
              title="Ver productos"
              description="Listado completo con stock, precios y estado."
            />
          </div>
        </section>
      </div>
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
      className={`rounded-2xl border p-6 transition-colors ${
        highlighted
          ? 'border-primary/30 bg-primary/5'
          : 'border-border bg-card hover:border-primary/20'
      }`}
    >
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-semibold text-primary">{id}</span>
        {label}
      </p>
      <p className="mt-3 text-5xl font-semibold tracking-tight text-foreground">{value}</p>
      <p className="mt-2 text-xs text-muted-foreground">{hint}</p>
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
      className="group flex items-start gap-6 rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      <span className="text-3xl font-semibold text-muted-foreground transition-colors group-hover:text-primary">
        {number}
      </span>
      <div className="flex-1">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      </div>
      <span
        className="self-center text-2xl text-muted-foreground transition-colors group-hover:text-primary"
        aria-hidden
      >
        →
      </span>
    </Link>
  );
}
