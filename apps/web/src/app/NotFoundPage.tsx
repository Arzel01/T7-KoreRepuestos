import { Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { CatalogNavbar } from '@/features/catalog/components/CatalogNavbar';

export function NotFoundPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-muted text-foreground">
      <CatalogNavbar />

      <section className="relative overflow-hidden bg-primary py-28 sm:py-36">
        <div
          className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-white/5"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-white/5"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-2xl px-4 text-center sm:px-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
            <Wrench className="size-3.5" aria-hidden="true" />
            Error 404
          </div>

          <h1 className="text-6xl font-extrabold tracking-tight text-white sm:text-8xl">404</h1>
          <p className="mt-4 text-2xl font-semibold text-white/90">Pieza no encontrada</p>
          <p className="mx-auto mt-4 max-w-md text-base text-white/70">
            La página que buscás no existe o fue movida. Verificá la dirección o volvé al catálogo.
          </p>

          <Button
            asChild
            size="lg"
            className="mt-10 rounded-full bg-white px-8 font-semibold text-primary shadow-lg hover:bg-white/90"
          >
            <Link to="/">← Volver al inicio</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
