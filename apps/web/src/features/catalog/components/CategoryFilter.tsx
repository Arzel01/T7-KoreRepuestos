import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

import type { CategoryResponse } from '@kore/shared';

interface CategoryFilterProps {
  categories: CategoryResponse[];
  loading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

/** Checkboxes de categoría — aplican el filtro al instante. */
export function CategoryFilter({
  categories,
  loading,
  selectedIds,
  onToggle,
}: CategoryFilterProps): JSX.Element {
  if (loading) {
    return (
      <div className="space-y-2.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-32" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {categories.map((cat) => (
        <div key={cat.id} className="flex items-center gap-2">
          <Checkbox
            id={`cat-${cat.id}`}
            checked={selectedIds.includes(String(cat.id))}
            onCheckedChange={() => onToggle(String(cat.id))}
          />
          <Label htmlFor={`cat-${cat.id}`} className="cursor-pointer text-sm font-normal">
            {cat.name}
          </Label>
        </div>
      ))}
      {categories.length === 0 && (
        <p className="text-xs text-muted-foreground">Sin categorías disponibles.</p>
      )}
    </div>
  );
}
