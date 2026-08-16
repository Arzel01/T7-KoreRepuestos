import { Car, LogOut, Settings, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { Logo } from '@/components/Logo';
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
import { CartIcon } from '@/features/cart/components/CartIcon';
import { NotificationBell } from '@/features/notifications/components/NotificationBell';

import { SearchAutocomplete } from './SearchAutocomplete';

interface CatalogNavbarProps {
  initialSearch?: string;
  onSearch?: (term: string) => void;
}

export function CatalogNavbar({ initialSearch = '', onSearch }: CatalogNavbarProps): JSX.Element {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout(): Promise<void> {
    await logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link to="/landing" className="flex shrink-0 items-center gap-1">
          <Logo className="h-6 text-primary" />
        </Link>

        {/* Nav links */}
        <Link
          to="/"
          className="hidden shrink-0 text-sm font-medium text-muted-foreground hover:text-primary sm:block"
        >
          Catálogo
        </Link>

        {/* Búsqueda central con autocomplete */}
        <SearchAutocomplete initialSearch={initialSearch} onSearch={onSearch} />

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
          <CartIcon />
          <NotificationBell />
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
