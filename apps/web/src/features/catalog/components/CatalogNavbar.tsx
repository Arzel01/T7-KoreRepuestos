import { Car, LogOut, Search, Settings, User } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/features/auth/hooks/AuthContext';

interface CatalogNavbarProps {
  initialSearch?: string;
  onSearch?: (term: string) => void;
}

export function CatalogNavbar({ initialSearch = '', onSearch }: CatalogNavbarProps): JSX.Element {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();
  const [term, setTerm] = useState(initialSearch);

  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    if (onSearch) {
      onSearch(term);
    } else {
      const q = term.trim();
      navigate(q ? `/?search=${encodeURIComponent(q)}` : '/');
    }
  }

  async function handleLogout(): Promise<void> {
    await logout();
    navigate('/');
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

        {/* Nav links */}
        <Link
          to="/"
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
          {isAuthenticated && (
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/garage">
                <Car className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Mi Garaje</span>
              </Link>
            </Button>
          )}
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className={buttonVariants({ variant: 'default', size: 'sm', className: 'gap-1.5' })}
              >
                <User className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">{user?.firstName ?? 'Cuenta'}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel className="font-normal">
                  <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2 cursor-pointer">
                      <Settings className="size-4" />
                      Panel admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => void handleLogout()}
                  className="flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer"
                >
                  <LogOut className="size-4" />
                  Cerrar sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="default" size="sm" className="gap-1.5">
              <Link to="/auth/login">
                <User className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Cuenta</span>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
