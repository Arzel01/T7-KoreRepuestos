import { ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/AuthContext';

import { useCart } from '../hooks/CartContext';

/**
 * Widget del ícono del carrito con contador (US#18).
 * Solo visible para usuarios autenticados (el carrito es por usuario).
 */
export function CartIcon(): JSX.Element | null {
  const { isAuthenticated } = useAuth();
  const { itemCount } = useCart();

  if (!isAuthenticated) return null;

  return (
    <Link
      to="/cart"
      aria-label={`Carrito${itemCount > 0 ? ` (${itemCount} artículos)` : ''}`}
      className={buttonVariants({ variant: 'outline', size: 'sm', className: 'relative gap-1.5' })}
    >
      <ShoppingCart className="size-4" aria-hidden="true" />
      {itemCount > 0 && (
        <Badge className="absolute -right-1.5 -top-1.5 h-4 min-w-4 justify-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground">
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </Link>
  );
}
