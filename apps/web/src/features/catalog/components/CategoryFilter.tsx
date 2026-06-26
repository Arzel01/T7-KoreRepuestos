import { useEffect, useState } from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

import type { CategoryResponse } from '@kore/shared';

interface CategoryFilterProps {
  categories: CategoryResponse[];
  loading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
  resetTrigger?: number;
}

/** Checkboxes de categoría — aplican el filtro al instante. */
export function CategoryFilter({
  categories,
  loading,
  selectedIds,
  onToggle,
  resetTrigger = 0,
}: CategoryFilterProps): JSX.Element {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setSearchTerm('');
  }, [resetTrigger]);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

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
    <div className="space-y-3">
      <Input
        placeholder="Buscar categoría..."
        className="h-8 text-xs bg-background"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      <div className="flex items-center gap-2 pb-2">
        <Checkbox
          id="cat-all"
          checked={selectedIds.length === 0}
          onCheckedChange={(checked) => {
            if (checked) {
              // Deseleccionar todas para mostrar todas las categorías
              selectedIds.forEach((id) => onToggle(id));
            } else {
              // No hacer nada si desmarca "Todos"
            }
          }}
        />
        <Label htmlFor="cat-all" className="cursor-pointer text-sm font-normal">
          Todos
        </Label>
      </div>
      {filteredCategories.length > 0 ? (
        <div className="max-h-40 overflow-y-auto pr-1">
          <div className="space-y-2.5">
            {filteredCategories.map((cat) => (
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
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No se encontraron categorías.</p>
      )}
    </div>
  );
}
