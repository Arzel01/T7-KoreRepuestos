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
  const isValidPrice = (value: string): boolean => {
    return value === '' || /^\d{0,4}(\.\d{0,2})?$/.test(value);
  };

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
          pattern="\d{1,4}"
          min={0}
          max="9999.99"
          step="0.01"
          inputMode="decimal"
          placeholder="0"
          className="h-9 bg-background"
          value={draft.min}
          onChange={(e) => {
            const val = e.target.value;
            if (isValidPrice(val)) {
              onDraftChange({ ...draft, min: val });
            }
          }}
        />
      </div>

      <div className="flex-1 space-y-1.5">
        <Label htmlFor="price-max" className="text-[11px] text-muted-foreground">
          Máx
        </Label>
        <Input
          id="price-max"
          type="number"
          pattern="\d{1,4}"
          min={0}
          max="9999.99"
          step="0.01"
          inputMode="decimal"
          placeholder="9999"
          className="h-9 bg-background"
          value={draft.max}
          onChange={(e) => {
            const val = e.target.value;
            if (isValidPrice(val)) {
              onDraftChange({ ...draft, max: val });
            }
          }}
        />
      </div>

      <Button
        type="submit"
        size="sm"
        className="h-9 px-3"
        title="Aplicar rango de precio"
        variant="outline"
      >
        <span>
          <ChevronRight />
        </span>
      </Button>
    </form>
  );
}
