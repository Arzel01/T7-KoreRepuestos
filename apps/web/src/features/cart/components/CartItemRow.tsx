import { Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';

import { useCart } from '../hooks/CartContext';

import type { CartItemResponse } from '@kore/shared';

/**
 * Fila del carrito: editor de cantidad (US#19) + eliminación con
 * confirmación (US#20). Deshabilita los controles durante cada mutación.
 */
export function CartItemRow({ item }: { item: CartItemResponse }): JSX.Element {
  const { updateItem, removeItem } = useCart();
  const [busy, setBusy] = useState(false);

  const atMax = item.quantity >= item.stock;

  async function changeQuantity(next: number): Promise<void> {
    if (next < 1 || next > item.stock || next === item.quantity || busy) return;
    setBusy(true);
    try {
      await updateItem(item.id, next);
    } catch {
      // El error global del carrito ya se muestra en la página.
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove(): Promise<void> {
    setBusy(true);
    try {
      await removeItem(item.id);
    } catch {
      setBusy(false);
    }
  }

  return (
    <TableRow className={busy ? 'opacity-60' : undefined}>
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-muted/40">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="size-full object-cover" />
            ) : (
              <span className="text-[10px] text-muted-foreground">Sin imagen</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{item.name}</p>
            <p className="font-mono text-xs text-muted-foreground">{item.sku}</p>
          </div>
        </div>
      </TableCell>

      <TableCell className="text-right tabular-nums">{formatCurrency(item.unitPrice)}</TableCell>

      <TableCell>
        <div className="flex items-center justify-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Disminuir cantidad"
            disabled={busy || item.quantity <= 1}
            onClick={() => void changeQuantity(item.quantity - 1)}
          >
            <Minus className="size-3.5" />
          </Button>
          <span className="w-9 text-center tabular-nums" aria-live="polite">
            {busy ? <Loader2 className="mx-auto size-4 animate-spin" /> : item.quantity}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Aumentar cantidad"
            disabled={busy || atMax}
            onClick={() => void changeQuantity(item.quantity + 1)}
          >
            <Plus className="size-3.5" />
          </Button>
        </div>
        {atMax && (
          <p className="mt-1 text-center text-[10px] text-muted-foreground">Máx. en stock</p>
        )}
      </TableCell>

      <TableCell className="text-right font-semibold tabular-nums">
        {formatCurrency(item.lineTotal)}
      </TableCell>

      <TableCell className="text-right">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-destructive"
              aria-label={`Eliminar ${item.name}`}
              disabled={busy}
            >
              <Trash2 className="size-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar del carrito?</AlertDialogTitle>
              <AlertDialogDescription>
                Se quitará «{item.name}» de tu carrito. Podrás volver a agregarlo desde el catálogo.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => void handleRemove()}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </TableCell>
    </TableRow>
  );
}
