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
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        onApply();
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="price-min" className="text-xs text-muted-foreground">
            Mín
          </Label>
          <Input
            id="price-min"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="0"
            className="bg-background"
            value={draft.min}
            onChange={(e) => onDraftChange({ ...draft, min: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="price-max" className="text-xs text-muted-foreground">
            Máx
          </Label>
          <Input
            id="price-max"
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            placeholder="999"
            className="bg-background"
            value={draft.max}
            onChange={(e) => onDraftChange({ ...draft, max: e.target.value })}
          />
        </div>
      </div>
      <Button type="submit" className="w-full">
        Buscar
      </Button>
    </form>
  );
}
