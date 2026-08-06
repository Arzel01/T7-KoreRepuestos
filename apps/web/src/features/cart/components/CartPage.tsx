import { AlertCircle, Loader2, ShoppingCart, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CatalogNavbar } from '@/features/catalog/components/CatalogNavbar';
import { formatCurrency } from '@/lib/utils';

import { useCart } from '../hooks/CartContext';

import { CartItemRow } from './CartItemRow';

export function CartPage(): JSX.Element {
  const { cart, loading, error, clear } = useCart();

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="storefront min-h-screen bg-muted text-foreground">
      <CatalogNavbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <ShoppingCart className="size-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Mi carrito</h1>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {loading && !cart ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" /> Cargando carrito…
          </div>
        ) : isEmpty ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <ShoppingCart className="size-12 text-muted-foreground/50" aria-hidden="true" />
              <div>
                <p className="font-medium">Tu carrito está vacío</p>
                <p className="text-sm text-muted-foreground">
                  Explora el catálogo y agrega los repuestos que necesites.
                </p>
              </div>
              <Button asChild>
                <Link to="/">Ir al catálogo</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Líneas del carrito */}
            <Card className="lg:col-span-2">
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Precio</TableHead>
                      <TableHead className="text-center">Cantidad</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.items.map((item) => (
                      <CartItemRow key={item.id} item={item} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Resumen de totales (US · Cart Calculations) */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Resumen</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal ({cart.itemCount} art.)</span>
                    <span className="tabular-nums">{formatCurrency(cart.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      IVA ({Math.round(cart.taxRate * 100)}%)
                    </span>
                    <span className="tabular-nums">{formatCurrency(cart.tax)}</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-base font-semibold">
                    <span>Total</span>
                    <span className="tabular-nums text-primary">{formatCurrency(cart.total)}</span>
                  </div>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                className="w-full gap-2 text-destructive"
                onClick={() => void clear()}
              >
                <Trash2 className="size-4" />
                Vaciar carrito
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
