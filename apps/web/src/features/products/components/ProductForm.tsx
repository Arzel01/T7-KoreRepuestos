import { type CategoryResponse } from '@kore/shared';
import { useEffect, useState, type FormEvent } from 'react';

import { categoriesApi, type CreateProductPayload } from '../server/products.api';

interface ProductFormProps {
  onSubmit: (payload: CreateProductPayload) => Promise<void>;
  isSubmitting: boolean;
  submitError: string | null;
}

const SKU_REGEX = /^[A-Z0-9-]+$/i;

export function ProductForm({
  onSubmit,
  isSubmitting,
  submitError,
}: ProductFormProps): JSX.Element {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [form, setForm] = useState({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    price: '',
    stock: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    void categoriesApi.list().then((list) => {
      if (!cancelled) setCategories(list);
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
            className="input-technical mt-3 font-mono tracking-wider"
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
            className="input-technical mt-3"
            placeholder="Pastilla de freno delantera"
            autoComplete="off"
          />
        </Field>
      </div>

      {/* Descripción */}
      <Field id="description" label="Descripción" step="03">
        <textarea
          id="description"
          rows={3}
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          className="input-technical mt-3 resize-none"
          placeholder="Detalle técnico, compatibilidad, garantía…"
        />
      </Field>

      {/* Categoría */}
      <Field id="categoryId" label="Categoría" step="04">
        <select
          id="categoryId"
          value={form.categoryId}
          onChange={(e) => update('categoryId', e.target.value)}
          className="input-technical mt-3"
        >
          <option value="">— sin categoría —</option>
          {categories.map((c) => (
            <option key={c.id} value={String(c.id)}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      {/* Datos comerciales */}
      <fieldset className="border border-ink-700 p-6">
        <legend className="px-2 font-mono text-eyebrow uppercase tracking-eyebrow text-signal-500">
          05 → Datos comerciales
        </legend>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Field id="price" label="Precio (S/)" step="" required error={showError('price')}>
            <input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              value={form.price}
              onChange={(e) => update('price', e.target.value)}
              onBlur={blur('price')}
              className="input-technical mt-3 num"
              placeholder="0.00"
              inputMode="decimal"
            />
          </Field>
          <Field id="stock" label="Stock inicial" step="" required error={showError('stock')}>
            <input
              id="stock"
              type="number"
              step="1"
              min="0"
              value={form.stock}
              onChange={(e) => update('stock', e.target.value)}
              onBlur={blur('stock')}
              className="input-technical mt-3 num"
              placeholder="0"
              inputMode="numeric"
            />
          </Field>
        </div>
      </fieldset>

      {submitError && (
        <div
          role="alert"
          className="border-l-2 border-danger-500 bg-danger-700/10 px-4 py-3 font-mono text-xs uppercase tracking-wider text-danger-500"
        >
          ✕ {submitError}
        </div>
      )}

      <div className="flex items-center justify-end gap-4 border-t border-ink-700 pt-6">
        <button type="reset" className="btn-ghost" disabled={isSubmitting}>
          Limpiar
        </button>
        <button type="submit" className="btn-primary" disabled={isSubmitting || !isValid}>
          {isSubmitting ? 'Guardando…' : 'Crear producto'}
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
        className="flex items-baseline gap-2 font-mono text-eyebrow uppercase tracking-eyebrow text-ink-400"
      >
        {step && <span className="text-signal-500">{step} →</span>}
        <span>
          {label}
          {required && <span className="ml-1 text-signal-500">*</span>}
        </span>
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-2 font-mono text-xs text-danger-500">
          ✕ {error}
        </p>
      )}
    </div>
  );
}
