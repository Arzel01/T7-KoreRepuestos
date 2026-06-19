import { ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PriceFilterProps {
  draft: { min: string; max: string };
  onDraftChange: (draft: { min: string; max: string }) => void;
  onApply: () => void;
}

/**
 * Rango de precio: borrador local que solo se aplica con el botón "Buscar"
 * (según el diseño — evita refetch en cada tecla).
 */
export function PriceFilter({ draft, onDraftChange, onApply }: PriceFilterProps): JSX.Element {
  return (
    <form
      className="flex items-end gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      <div className="flex-1 space-y-1.5">
        <Label htmlFor="price-min" className="text-[11px] text-muted-foreground">
          Mín
        </Label>
        <Input
          id="price-min"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          placeholder="0"
          className="h-9 bg-background"
          value={draft.min}
          onChange={(e) => onDraftChange({ ...draft, min: e.target.value })}
        />
      </div>

      <div className="flex-1 space-y-1.5">
        <Label htmlFor="price-max" className="text-[11px] text-muted-foreground">
          Máx
        </Label>
        <Input
          id="price-max"
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          placeholder="999"
          className="h-9 bg-background"
          value={draft.max}
          onChange={(e) => onDraftChange({ ...draft, max: e.target.value })}
        />
      </div>

      <Button type="submit" size="sm" className="h-9 px-3" title="Aplicar rango de precio">
        <span>
          <ChevronRight />
        </span>
      </Button>
    </form>
  );
}
