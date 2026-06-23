import { Search, Wrench } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';

export function HeroSection(): JSX.Element {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');

  function handleSearch(e: FormEvent): void {
    e.preventDefault();
    const q = term.trim();
    navigate(q ? `/catalog?search=${encodeURIComponent(q)}` : '/catalog');
  }

  return (
    <section className="relative overflow-hidden bg-primary py-20 sm:py-28">
      {/* Decorative background rings */}
      <div
        className="pointer-events-none absolute -right-32 -top-32 size-96 rounded-full bg-white/5"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-20 -left-20 size-64 rounded-full bg-white/5"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-4xl px-4 text-center sm:px-6">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white/90">
          <Wrench className="size-3.5" aria-hidden="true" />
          Catálogo de repuestos automotrices
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          El repuesto que necesitas, <span className="text-white/70">cuando lo necesitas</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg text-white/80">
          Miles de repuestos disponibles. Filtrá por categoría, precio y disponibilidad para
          encontrar exactamente lo que buscás.
        </p>

        {/* Search bar */}
        <form role="search" onSubmit={handleSearch} className="mx-auto mt-10 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Buscar repuestos"
              placeholder="Buscar por nombre, SKU, marca…"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="h-12 w-full rounded-full border-0 bg-white pl-11 pr-4 text-sm text-foreground shadow-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-white/50"
            />
          </div>
          <Button
            type="submit"
            size="lg"
            className="rounded-full bg-white px-6 font-semibold text-primary shadow-lg hover:bg-white/90"
          >
            Buscar
          </Button>
        </form>

        <div className="mt-8 flex items-center justify-center gap-4">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <Link to="/catalog">Ver catálogo completo →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
