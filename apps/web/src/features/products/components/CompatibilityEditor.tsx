import { Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { garageApi } from '@/features/garage/server/garage.api';
import { extractApiErrorMessage } from '@/lib/api-client';

import { productsApi } from '../server/products.api';

import type { CompatibilityItem } from '@kore/shared';
import type { MarcaResponse, ModeloResponse } from '@kore/shared';

interface CompatibilityEditorProps {
  productId: number;
}

export function CompatibilityEditor({ productId }: CompatibilityEditorProps): JSX.Element {
  const [items, setItems] = useState<CompatibilityItem[]>([]);
  const [brands, setBrands] = useState<MarcaResponse[]>([]);
  const [models, setModels] = useState<ModeloResponse[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [selectedModeloId, setSelectedModeloId] = useState<string>('');
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current compatibility
  useEffect(() => {
    let cancelled = false;
    productsApi
      .getCompatibility(productId)
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [productId]);

  // Load brands
  useEffect(() => {
    garageApi
      .getBrands()
      .then(setBrands)
      .catch(() => null);
  }, []);

  // Load models when brand changes
  useEffect(() => {
    if (!selectedBrandId) {
      setModels([]);
      setSelectedModeloId('');
      return;
    }
    garageApi
      .getModels(Number(selectedBrandId))
      .then(setModels)
      .catch(() => null);
    setSelectedModeloId('');
  }, [selectedBrandId]);

  async function handleAdd(): Promise<void> {
    if (!selectedModeloId) return;
    setError(null);
    setAdding(true);
    try {
      await productsApi.addCompatibility(productId, Number(selectedModeloId));
      // Refresh list
      const updated = await productsApi.getCompatibility(productId);
      setItems(updated);
      setSelectedBrandId('');
      setSelectedModeloId('');
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setAdding(false);
    }
  }

  async function handleRemove(modeloId: number): Promise<void> {
    setError(null);
    try {
      await productsApi.removeCompatibility(productId, modeloId);
      setItems((prev) => prev.filter((it) => it.modelId !== modeloId));
    } catch (err) {
      setError(extractApiErrorMessage(err));
    }
  }

  return (
    <div className="space-y-4">
      {items.length > 0 && (
        <div className="border border-neutral-200">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-neutral-200 bg-neutral-100">
              <tr className="font-mono text-eyebrow uppercase tracking-eyebrow text-neutral-600">
                <th className="px-4 py-2 font-medium">Marca</th>
                <th className="px-4 py-2 font-medium">Modelo</th>
                <th className="px-4 py-2 font-medium">Años</th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.modelId} className="border-b border-neutral-200/60">
                  <td className="px-4 py-2 text-sm text-navy-700">{item.brandName}</td>
                  <td className="px-4 py-2 font-mono text-sm text-navy-800">{item.modelName}</td>
                  <td className="px-4 py-2 text-sm text-muted-foreground">
                    {item.yearStart}–{item.yearEnd}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          type="button"
                          aria-label={`Quitar compatibilidad con ${item.modelName}`}
                          className="text-destructive hover:text-destructive/80"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Quitar compatibilidad?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se eliminará la compatibilidad con {item.brandName} {item.modelName} (
                            {item.yearStart}–{item.yearEnd}). Esta acción se puede revertir
                            agregándola nuevamente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => void handleRemove(item.modelId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Quitar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Agregar nueva compatibilidad */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Marca</Label>
          <Select value={selectedBrandId} onValueChange={setSelectedBrandId}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Seleccione marca" />
            </SelectTrigger>
            <SelectContent>
              {brands.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>
                  {b.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Modelo</Label>
          <Select
            value={selectedModeloId}
            onValueChange={setSelectedModeloId}
            disabled={!selectedBrandId}
          >
            <SelectTrigger className="w-52">
              <SelectValue
                placeholder={selectedBrandId ? 'Seleccione modelo' : 'Primero seleccione marca'}
              />
            </SelectTrigger>
            <SelectContent>
              {models.map((m) => (
                <SelectItem key={m.id} value={String(m.id)}>
                  {m.nombre}
                  {m.anioInicio ? ` (${m.anioInicio}–${m.anioFin ?? '?'})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          disabled={adding || !selectedModeloId}
          onClick={() => void handleAdd()}
          className="shrink-0"
        >
          + Agregar
        </Button>
      </div>

      {error && <p className="font-mono text-xs text-destructive">✕ {error}</p>}
    </div>
  );
}
