import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { productsApi } from '@/features/products/server/products.api';
import { extractApiErrorMessage } from '@/lib/api-client';

import { useBrands } from '../hooks/useBrands';
import { useModels } from '../hooks/useModels';
import { garageApi } from '../server/garage.api';

import type { CreateMaintenancePlanPayload, CreateTaskPartPayload } from '@kore/shared';
import type { ProductResponse } from '@kore/shared';

interface PartRow extends CreateTaskPartPayload {
  _key: number;
  name: string;
}

interface PlanRow extends Omit<CreateMaintenancePlanPayload, 'parts'> {
  _key: number;
  parts: PartRow[];
}

let _key = 0;
function newRow(): PlanRow {
  return { _key: ++_key, description: '', mileageInterval: 5000, isCritical: false, parts: [] };
}

export function MaintenanceGuideFormPage(): JSX.Element {
  const navigate = useNavigate();
  const { brands } = useBrands();
  const [brandId, setBrandId] = useState<number | null>(null);
  const { models } = useModels(brandId);

  const [modelId, setModelId] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [plans, setPlans] = useState<PlanRow[]>([newRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [allProducts, setAllProducts] = useState<ProductResponse[]>([]);
  useEffect(() => {
    productsApi
      .list({ page: 1 })
      .then((res) => setAllProducts(res.items))
      .catch(() => null);
  }, []);

  function updatePlan(key: number, patch: Partial<PlanRow>) {
    setPlans((prev) => prev.map((p) => (p._key === key ? { ...p, ...patch } : p)));
  }

  function removePlan(key: number) {
    setPlans((prev) => prev.filter((p) => p._key !== key));
  }

  function addPart(planKey: number, productId: number, name: string) {
    setPlans((prev) =>
      prev.map((p) => {
        if (p._key !== planKey) return p;
        if (p.parts.some((pt) => pt.productId === productId)) return p;
        return { ...p, parts: [...p.parts, { _key: ++_key, productId, quantity: 1, name }] };
      }),
    );
  }

  function updatePartQty(planKey: number, partKey: number, quantity: number) {
    setPlans((prev) =>
      prev.map((p) =>
        p._key !== planKey
          ? p
          : { ...p, parts: p.parts.map((pt) => (pt._key === partKey ? { ...pt, quantity } : pt)) },
      ),
    );
  }

  function removePart(planKey: number, partKey: number) {
    setPlans((prev) =>
      prev.map((p) =>
        p._key !== planKey ? p : { ...p, parts: p.parts.filter((pt) => pt._key !== partKey) },
      ),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!modelId) {
      setError('Selecciona un modelo de vehículo.');
      return;
    }
    for (const p of plans) {
      if (!p.description.trim()) {
        setError('Todas las tareas deben tener una descripción.');
        return;
      }
      if (!p.mileageInterval || p.mileageInterval <= 0) {
        setError('El intervalo en km debe ser mayor que cero.');
        return;
      }
    }

    setSaving(true);
    setError(null);
    try {
      await garageApi.createGuide({
        modelId,
        description: description.trim() || undefined,
        plans: plans.map(({ _key: _k, parts, ...rest }) => ({
          ...rest,
          parts: parts.length ? parts.map(({ _key: _pk, name: _n, ...pt }) => pt) : undefined,
        })),
      });
      navigate('/admin/maintenance');
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-12 animate-fade-in-up">
      <header className="mb-10 flex items-end justify-between border-b border-border pb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
            Sprint 3 · US-Maintenance
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
            Nueva guía de mantenimiento<span className="text-primary">.</span>
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Define el plan preventivo oficial para un modelo de vehículo. Solo puede existir una
            guía por modelo.
          </p>
        </div>
        <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          Requiere admin
        </span>
      </header>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-8">
        {/* Vehículo */}
        <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <h2 className="mb-6 text-lg font-semibold text-foreground">Vehículo</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="brand">
                Marca <span className="text-primary">*</span>
              </Label>
              <Select
                value={brandId?.toString() ?? ''}
                onValueChange={(v) => {
                  setBrandId(Number(v));
                  setModelId(null);
                }}
              >
                <SelectTrigger id="brand">
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id.toString()}>
                      {b.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="model">
                Modelo <span className="text-primary">*</span>
              </Label>
              <Select
                value={modelId?.toString() ?? ''}
                onValueChange={(v) => setModelId(Number(v))}
                disabled={!brandId}
              >
                <SelectTrigger id="model">
                  <SelectValue
                    placeholder={brandId ? 'Seleccionar modelo' : 'Primero elige la marca'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {models.map((m) => (
                    <SelectItem key={m.id} value={m.id.toString()}>
                      {m.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 space-y-1.5">
            <Label htmlFor="description">Descripción general (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej. Plan preventivo para motor 1.6L aspirado — revisión cada 5 000 km."
              rows={2}
            />
          </div>
        </section>

        {/* Tareas */}
        <section className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              Tareas de mantenimiento
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({plans.length})
              </span>
            </h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPlans((prev) => [...prev, newRow()])}
            >
              + Agregar tarea
            </Button>
          </div>

          <div className="space-y-4">
            {plans.map((plan, idx) => (
              <div key={plan._key} className="rounded-xl border border-border bg-muted/10 p-5">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Tarea {idx + 1}
                  </span>
                  {plans.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePlan(plan._key)}
                      className="text-xs text-destructive hover:underline"
                    >
                      Eliminar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_140px_140px]">
                  <div className="space-y-1.5">
                    <Label>
                      Descripción <span className="text-primary">*</span>
                    </Label>
                    <Input
                      value={plan.description}
                      onChange={(e) => updatePlan(plan._key, { description: e.target.value })}
                      placeholder="Ej. Cambio de aceite y filtro"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>
                      Intervalo (km) <span className="text-primary">*</span>
                    </Label>
                    <Input
                      type="number"
                      min={1}
                      value={plan.mileageInterval}
                      onChange={(e) =>
                        updatePlan(plan._key, { mileageInterval: Number(e.target.value) })
                      }
                      placeholder="5000"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Intervalo (meses)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={plan.monthInterval ?? ''}
                      onChange={(e) =>
                        updatePlan(plan._key, {
                          monthInterval: e.target.value ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="6"
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <Checkbox
                    id={`critical-${plan._key}`}
                    checked={plan.isCritical ?? false}
                    onCheckedChange={(checked) =>
                      updatePlan(plan._key, { isCritical: checked === true })
                    }
                  />
                  <Label htmlFor={`critical-${plan._key}`} className="cursor-pointer text-sm">
                    Tarea crítica{' '}
                    <span className="text-xs text-muted-foreground">
                      (bloquea circulación si se omite)
                    </span>
                  </Label>
                </div>

                {/* Partes / productos requeridos */}
                <div className="mt-5 border-t border-border pt-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted-foreground">
                    Repuestos requeridos
                  </p>

                  {plan.parts.length > 0 && (
                    <ul className="mb-3 space-y-2">
                      {plan.parts.map((pt) => (
                        <li key={pt._key} className="flex items-center gap-3">
                          <span className="flex-1 truncate text-sm">{pt.name}</span>
                          <Input
                            type="number"
                            min={1}
                            value={pt.quantity ?? 1}
                            onChange={(e) =>
                              updatePartQty(plan._key, pt._key, Number(e.target.value))
                            }
                            className="w-20 text-center"
                          />
                          <span className="text-xs text-muted-foreground">unid.</span>
                          <button
                            type="button"
                            onClick={() => removePart(plan._key, pt._key)}
                            className="text-xs text-destructive hover:underline"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  <Select
                    value=""
                    onValueChange={(v) => {
                      const prod = allProducts.find((p) => p.id.toString() === v);
                      if (prod) addPart(plan._key, prod.id, prod.name);
                    }}
                  >
                    <SelectTrigger className="w-full bg-background text-sm">
                      <SelectValue placeholder="+ Agregar repuesto" />
                    </SelectTrigger>
                    <SelectContent>
                      {allProducts
                        .filter((p) => !plan.parts.some((pt) => pt.productId === p.id))
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name} ({p.sku})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Separator />

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/maintenance')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Crear guía'}
          </Button>
        </div>
      </form>
    </div>
  );
}
