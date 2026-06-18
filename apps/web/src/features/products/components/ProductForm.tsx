import { type CategoryResponse } from '@kore/shared';
import { useEffect, useState, type FormEvent } from 'react';

import { categoriesApi, type CreateProductPayload } from '../server/products.api';

import { DescriptionEditor } from './DescriptionEditor';

interface ProductFormProps {
  mode?: 'create' | 'edit';
  initialValues?: Partial<CreateProductPayload & { id: number }>;
  onSubmit: (payload: CreateProductPayload) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

interface FlatCategory {
  id: number;
  name: string;
  depth: number;
}

function flattenCategoryTree(nodes: CategoryResponse[], depth = 0): FlatCategory[] {
  return nodes.flatMap((node) => [
    { id: node.id, name: node.name, depth },
    ...flattenCategoryTree(node.children ?? [], depth + 1),
  ]);
}

const SKU_REGEX = /^[A-Z0-9-]+$/i;

export function ProductForm({
  mode = 'create',
  initialValues,
  onSubmit,
  isSubmitting,
  submitError,
}: ProductFormProps): JSX.Element {
  const [flatCategories, setFlatCategories] = useState<FlatCategory[]>([]);
  const [form, setForm] = useState({
    sku: initialValues?.sku ?? '',
    name: initialValues?.name ?? '',
    description: initialValues?.description ?? '',
    categoryId: initialValues?.categoryId ? String(initialValues.categoryId) : '',
    price: initialValues?.price ? String(initialValues.price) : '',
    stock: initialValues?.stock !== undefined ? String(initialValues.stock) : '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    void categoriesApi.tree().then((tree) => {
      if (!cancelled) setFlatCategories(flattenCategoryTree(tree));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const errors = {
    sku: !form.sku.trim()
      ? 'SKU obligatorio'
      : !SKU_REGEX.test(form.sku.trim())
        ? 'Solo letras, dígitos y guiones'
        : null,
    name: !form.name.trim() ? 'Nombre obligatorio' : null,
    price: !form.price
      ? 'Precio obligatorio'
      : Number(form.price) <= 0
        ? 'El precio debe ser mayor que cero'
        : !/^\d+(\.\d{1,2})?$/.test(form.price)
          ? 'Máximo 2 decimales'
          : null,
    stock: !form.stock
      ? 'Stock obligatorio'
      : !/^\d+$/.test(form.stock)
        ? 'Stock debe ser un entero'
        : null,
  } as const;

  const isValid = (Object.values(errors) as Array<string | null>).every((v) => v === null);

  function update<K extends keyof typeof form>(key: K, value: string): void {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();
    setTouched(
      Object.fromEntries(Object.keys(form).map((k) => [k, true])) as Record<string, boolean>,
    );
    if (!isValid) return;

    const payload: CreateProductPayload = {
      sku: form.sku.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      categoryId: form.categoryId ? Number(form.categoryId) : undefined,
      price: Number(form.price),
      stock: Number(form.stock),
    };
    await onSubmit(payload);
  }

  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));
  const showError = (k: keyof typeof errors): string | null =>
    touched[k] ? (errors[k] ?? null) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* SKU + Nombre */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_2fr]">
        <Field id="sku" label="SKU" step="01" required error={showError('sku')}>
          <input
            id="sku"
            type="text"
            value={form.sku}
            onChange={(e) => update('sku', e.target.value.toUpperCase())}
            onBlur={blur('sku')}
            disabled={mode === 'edit'}
            className="mt-3 h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="PAS-001"
            autoComplete="off"
          />
        </Field>
        <Field id="name" label="Nombre del producto" step="02" required error={showError('name')}>
          <input
            id="name"
            type="text"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            onBlur={blur('name')}
            className="mt-3 h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="Pastilla de freno delantera"
            autoComplete="off"
          />
        </Field>
      </div>

      {/* Descripción */}
      <Field id="description" label="Descripción" step="03">
        <DescriptionEditor
          value={form.description}
          onChange={(text) => update('description', text)}
        />
      </Field>

      {/* Categoría */}
      <Field id="categoryId" label="Categoría" step="04">
        <select
          id="categoryId"
          value={form.categoryId}
          onChange={(e) => update('categoryId', e.target.value)}
          className="mt-3 h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">— sin categoría —</option>
          {flatCategories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {'— '.repeat(c.depth)}
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Datos comerciales */}
      <fieldset className="rounded-2xl border border-border p-6">
        <legend className="px-2 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          05 → Datos comerciales
        </legend>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Field id="price" label="Precio ($)" step="" required error={showError('price')}>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              onBlur={blur('price')}
              className="mt-3 h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0.00"
              inputMode="decimal"
            />
          </Field>
          <Field id="stock" label="Stock" step="" required error={showError('stock')}>
            <input
              id="stock"
              type="number"
              step="1"
              min="0"
              value={form.stock}
              onChange={(e) => update('stock', e.target.value)}
              onBlur={blur('stock')}
              className="mt-3 h-10 w-full rounded-lg border border-border bg-muted/30 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0"
              inputMode="numeric"
            />
          </Field>
        </div>
      </fieldset>

      {submitError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          ✕ {submitError}
        </div>
      )}

      <div className="flex items-center justify-end gap-4 border-t border-border pt-6">
        <button
          type="reset"
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground hover:bg-muted"
          disabled={isSubmitting}
        >
          Limpiar
        </button>
        <button
          type="submit"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSubmitting || !isValid}
        >
          {isSubmitting ? 'Guardando…' : mode === 'edit' ? 'Guardar cambios' : 'Crear producto'}
          <span aria-hidden>→</span>
        </button>
      </div>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  step?: string;
  required?: boolean;
  error?: string | null;
  className?: string;
  children: React.ReactNode;
}

function Field({ id, label, step, required, error, className, children }: FieldProps): JSX.Element {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="flex items-baseline gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground"
      >
        {step && <span className="text-primary">{step} →</span>}
        <span>
          {label}
          {required && <span className="ml-1 text-primary">*</span>}
        </span>
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 text-xs text-destructive">
          ✕ {error}
        </p>
      )}
    </div>
  );
}
