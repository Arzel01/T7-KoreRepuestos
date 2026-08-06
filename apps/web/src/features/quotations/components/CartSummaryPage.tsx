import { AlertCircle, ArrowLeft, FileText, Loader2, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useCart } from '@/features/cart/hooks/CartContext';
import { CatalogNavbar } from '@/features/catalog/components/CatalogNavbar';
import { extractApiErrorMessage } from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';

import { quotationsApi } from '../server/quotations.api';

/**
 * US#21 — página de resumen del carrito (paso previo a la cotización).
 *
 * Muestra el detalle final y los totales antes de confirmar, y desde aquí se
 * genera la cotización (US#22 · POST /quotations), tras lo cual se navega a la
 * vista previa del documento.
 */
export function CartSummaryPage(): JSX.Element {
  const { cart, loading, refresh } = useCart();
  const navigate = useNavigate();
  const [sendEmail, setSendEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = !cart || cart.items.length === 0;

  async function handleGenerate(): Promise<void> {
    setSubmitting(true);
    setError(null);
    try {
      const quotation = await quotationsApi.create({ sendEmail, clearCart: true });
      await refresh(); // el carrito quedó vacío tras emitir.
      navigate(`/quotations/${quotation.id}`, { state: { justCreated: true } });
    } catch (err) {
      setError(extractApiErrorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="storefront min-h-screen bg-muted text-foreground">
      <CatalogNavbar />

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex items-center gap-3">
          <FileText className="size-6 text-primary" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Resumen de tu cotización</h1>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            {error}
          </div>
        )}

        {loading && !cart ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="mr-2 size-5 animate-spin" /> Cargando…
          </div>
        ) : isEmpty ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
              <ShoppingCart className="size-12 text-muted-foreground/50" aria-hidden="true" />
              <p className="font-medium">Tu carrito está vacío</p>
              <Button asChild>
                <Link to="/">Ir al catálogo</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardContent className="px-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-center">Cant.</TableHead>
                      <TableHead className="text-right">P. unit.</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <p className="font-medium">{item.name}</p>
                          <p className="font-mono text-xs text-muted-foreground">{item.sku}</p>
                        </TableCell>
                        <TableCell className="text-center tabular-nums">{item.quantity}</TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-right font-semibold tabular-nums">
                          {formatCurrency(item.lineTotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Totales</CardTitle>
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

                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      id="send-email"
                      checked={sendEmail}
                      onCheckedChange={(v) => setSendEmail(v === true)}
                    />
                    <Label htmlFor="send-email" className="cursor-pointer text-sm font-normal">
                      Enviarme la cotización por email
                    </Label>
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full gap-2"
                disabled={submitting}
                onClick={() => void handleGenerate()}
              >
                {submitting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <FileText className="size-4" />
                )}
                Generar cotización
              </Button>

              <Button variant="outline" asChild className="w-full gap-2">
                <Link to="/cart">
                  <ArrowLeft className="size-4" />
                  Volver al carrito
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
