import { Search, ShoppingCart, User } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/AuthContext';

interface CatalogNavbarProps {
  initialSearch?: string;
  onSearch?: (term: string) => void;
}

/**
 * Barra de navegación del storefront: logo · búsqueda central redondeada ·
 * acciones "Cuenta" y "Carrito" en azul corporativo.
 *
 * `onSearch` y `initialSearch` son opcionales: cuando no se proveen (ej. en
 * LandingPage), el submit de búsqueda navega a `/catalog?search=<term>`.
 *
 * El carrito es UI-only por ahora (no existe el feature en backend).
 */
export function CatalogNavbar({ initialSearch = '', onSearch }: CatalogNavbarProps): JSX.Element {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState(initialSearch);

  const accountTo = isAuthenticated && isAdmin ? '/admin' : '/auth/login';
  const accountLabel = isAuthenticated ? (user?.firstName ?? 'Cuenta') : 'Cuenta';

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (onSearch) {
      onSearch(term);
    } else {
      const q = term.trim();
      navigate(q ? `/catalog?search=${encodeURIComponent(q)}` : '/catalog');
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link to="/" className="shrink-0 text-2xl font-bold tracking-tight text-primary">
          KORE
          <span className="ml-1 hidden text-sm font-normal text-muted-foreground sm:inline">
            Repuestos
          </span>
        </Link>

        {/* Nav link catálogo */}
        <Link
          to="/catalog"
          className="hidden shrink-0 text-sm font-medium text-muted-foreground hover:text-primary sm:block"
        >
          Catálogo
        </Link>

        {/* Búsqueda central */}
        <form role="search" className="relative mx-auto w-full max-w-xl" onSubmit={handleSubmit}>
          <Search
            className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            type="search"
            aria-label="Buscar repuestos"
            placeholder="Buscar repuestos, SKU, marca…"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="h-10 w-full rounded-full border bg-muted/60 pl-11 pr-4 text-sm
                       transition-colors placeholder:text-muted-foreground
                       focus:border-primary focus:bg-background focus:outline-none"
          />
        </form>

        {/* Acciones */}
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="default" size="sm" className="gap-1.5">
            <Link to={accountTo}>
              <User className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{accountLabel}</span>
            </Link>
          </Button>
          {/* TODO(catalog): carrito real — por ahora solo UI */}
          <Button variant="default" size="sm" className="gap-1.5" title="Carrito (próximamente)">
            <ShoppingCart className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Carrito</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
