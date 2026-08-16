import { Check, Loader2, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useCart } from '@/features/cart/hooks/CartContext';
import { extractApiErrorMessage } from '@/lib/api-client';
import { toast } from '@/lib/toast';

import { MarkCompleteModal } from './MarkCompleteModal';

import type { CalendarItemDto } from '@kore/shared';

interface Props {
  item: CalendarItemDto;
  vehicleId: number;
  currentMileage: number;
  onMarkComplete: (
    planId: number,
    mileage: number,
    notes?: string,
    completedAt?: string,
  ) => Promise<void>;
}

export function CalendarItem({
  item,
  vehicleId: _vehicleId,
  currentMileage,
  onMarkComplete,
}: Props) {
  const { addMany } = useCart();
  const [showModal, setShowModal] = useState(false);
  const [addingParts, setAddingParts] = useState(false);
  const [addedParts, setAddedParts] = useState(false);
  const isCompleted = !!item.lastLog;
  const hasParts = item.products.length > 0;

  async function handleAddParts(): Promise<void> {
    if (!hasParts || addingParts) return;
    setAddingParts(true);
    try {
      await addMany(item.products.map((p) => ({ productId: p.id, quantity: p.quantity })));
      setAddedParts(true);
      window.setTimeout(() => setAddedParts(false), 2500);
    } catch (err) {
      toast.error(extractApiErrorMessage(err));
    } finally {
      setAddingParts(false);
    }
  }

  const borderClass = item.isCritical
    ? 'border-warning-foreground/30 bg-warning'
    : 'border-border bg-card';

  function formatDate(dateStr: string) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  return (
    <>
      <Card className={`rounded-2xl border shadow-sm ${borderClass}`}>
        <CardHeader className="px-5 pt-4 pb-2 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-semibold text-foreground ${isCompleted ? 'line-through text-muted-foreground' : ''}`}
            >
              {item.description}
            </h3>
            {item.isCritical && (
              <Badge className="bg-warning-foreground text-white text-xs">Crítico</Badge>
            )}
            {isCompleted && (
              <Badge className="bg-success-foreground text-white text-xs">Completado</Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">{formatDate(item.nextServiceDate)}</span>
        </CardHeader>

        <CardContent className="px-5 pb-5 space-y-3">
          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span>Programado: {item.mileageInterval.toLocaleString()} km</span>
            {item.monthInterval && <span>/ {item.monthInterval} meses</span>}
          </div>
          <div className="text-sm font-medium text-foreground">
            Faltan: <span className="text-primary">{item.kmRemaining.toLocaleString()} km</span>
          </div>

          {item.products.length > 0 && (
            <div className="rounded-xl bg-muted p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">
                Repuestos Necesarios
              </p>
              <ul className="space-y-1">
                {item.products.map((p) => (
                  <li key={p.id} className="flex justify-between text-sm text-foreground">
                    <span>
                      {p.name} {p.quantity > 1 && `(x${p.quantity})`}
                    </span>
                    <span className="font-medium">${(p.price * p.quantity).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 flex justify-between border-t pt-2 text-sm font-semibold text-foreground">
                <span>Costo estimado</span>
                <span>${Math.round(item.estimatedCost).toLocaleString()}</span>
              </div>
            </div>
          )}

          {isCompleted && item.lastLog && (
            <div className="rounded-xl border border-success-foreground/20 bg-success p-3 text-sm">
              <p className="font-medium text-success-foreground">
                Completado: {formatDate(item.lastLog.completedAt)}
              </p>
              <p className="text-success-foreground">
                Kilometraje: {item.lastLog.completedMileage.toLocaleString()} km
              </p>
              {item.lastLog.notes && (
                <p className="text-success-foreground mt-1">Notas: {item.lastLog.notes}</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            {!isCompleted && (
              <Button
                size="sm"
                className="bg-success-foreground hover:bg-success-foreground/90 text-white"
                onClick={() => setShowModal(true)}
              >
                ✔ Marcar Completado
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-primary border-primary/30"
              disabled={!hasParts || addingParts}
              onClick={() => void handleAddParts()}
            >
              {addingParts ? (
                <Loader2 className="size-4 animate-spin" />
              ) : addedParts ? (
                <Check className="size-4" />
              ) : (
                <ShoppingCart className="size-4" />
              )}
              {addedParts ? 'Agregado' : 'Agregar Repuestos'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <MarkCompleteModal
        open={showModal}
        planId={item.planId}
        currentMileage={currentMileage}
        onClose={() => setShowModal(false)}
        onConfirm={onMarkComplete}
      />
    </>
  );
}
