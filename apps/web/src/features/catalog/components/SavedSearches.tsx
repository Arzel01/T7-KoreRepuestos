import { Bookmark, BookmarkPlus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { extractApiErrorMessage } from '@/lib/api-client';

import type { UseSavedSearches } from '../hooks/useSavedSearches';
import type { SavedSearchParams } from '@kore/shared';

interface SavedSearchesProps extends Pick<
  UseSavedSearches,
  'savedSearches' | 'loading' | 'save' | 'remove'
> {
  /** Parámetros actuales a guardar. */
  currentParams: SavedSearchParams;
  /** Hay al menos un filtro activo (habilita "Guardar"). */
  canSave: boolean;
  /** Re-aplica una búsqueda guardada. */
  onApply: (params: SavedSearchParams) => void;
}

/**
 * Sección "Búsquedas guardadas" del panel de filtros: guardar la búsqueda
 * actual (con nombre) y re-aplicar/eliminar las existentes. Solo visible para
 * usuarios autenticados.
 *
 * Recibe el estado por props (en vez de llamar `useSavedSearches` acá adentro)
 * porque este componente se monta dos veces en paralelo — sidebar desktop y
 * drawer móvil (ver `CatalogPage`) — y ambas copias deben compartir un único
 * fetch y quedar en sync entre sí.
 */
export function SavedSearches({
  currentParams,
  canSave,
  onApply,
  savedSearches,
  loading,
  save,
  remove,
}: SavedSearchesProps): JSX.Element | null {
  const { isAuthenticated } = useAuth();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [nombre, setNombre] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) return null;

  async function handleSave(): Promise<void> {
    if (!nombre.trim()) {
      setError('Ponle un nombre a la búsqueda.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await save(nombre, currentParams);
      setNombre('');
      setDialogOpen(false);
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          <Bookmark className="size-4" aria-hidden="true" />
          Búsquedas guardadas
        </h3>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 gap-1 px-2 text-xs"
          disabled={!canSave}
          onClick={() => {
            setError(null);
            setDialogOpen(true);
          }}
        >
          <BookmarkPlus className="size-4" aria-hidden="true" />
          Guardar
        </Button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Cargando…</p>
      ) : savedSearches.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Aún no tienes búsquedas guardadas. Aplica filtros y pulsa «Guardar».
        </p>
      ) : (
        <ul className="space-y-1">
          {savedSearches.map((s) => (
            <li key={s.id} className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 flex-1 justify-start truncate text-xs"
                title={`Aplicar «${s.nombre}»`}
                onClick={() => onApply(s.parametros)}
              >
                {s.nombre}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Eliminar «${s.nombre}»`}
                onClick={() => void remove(s.id)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Guardar búsqueda</DialogTitle>
            <DialogDescription>
              Guarda los filtros actuales para reutilizarlos con un clic.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="saved-search-name">Nombre</Label>
            <Input
              id="saved-search-name"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Pastillas Toyota Corolla"
              maxLength={120}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void handleSave();
              }}
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
