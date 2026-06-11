import { ProductUnit, type CategoryResponse } from '@kore/shared';
import { useEffect, useState, type FormEvent } from 'react';

import { categoriesApi, type CreateProductPayload } from '../server/products.api';

/**
 * Formulario interactivo de creación de productos (US#45).
 *
 * Validación cliente sincronizada con `CreateProductDto`:
 *   · sku   no vacío, solo [A-Z0-9-]
 *   · name  no vacío
 *   · price > 0
 *   · stock > 0
 *
 * El cliente no es la fuente de verdad — el backend reaplica todas las
 * reglas con `class-validator`. Aquí buscamos UX: feedback inmediato y
 * evitar roundtrips obvios.
 *
 * El componente es controlado por su parent (recibe `onSubmit`). Esto lo
 * mantiene desacoplado: una página `ProductCreatePage` decide qué hacer
 * con el payload (crear, mostrar toast, navegar).
 */
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
    brand: '',
    categoryId: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    unit: ProductUnit.UNIDAD as string,
    imageUrl: '',
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // -------------------- Carga inicial de categorías --------------------
  useEffect(() => {
    let cancelled = false;
    void categoriesApi.list().then((list) => {
      if (!cancelled) setCategories(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------- Reglas de validación cliente -------------------
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
    cost:
      form.cost && Number(form.cost) <= 0
        ? 'El costo, si se indica, debe ser mayor que cero'
        : null,
    stock: !form.stock
      ? 'Stock obligatorio'
      : !/^\d+$/.test(form.stock)
        ? 'Stock debe ser un entero'
        : Number(form.stock) <= 0
          ? 'El stock debe ser mayor que cero'
          : null,
    minStock:
      form.minStock && (!/^\d+$/.test(form.minStock) || Number(form.minStock) < 0)
        ? 'Stock mínimo debe ser ≥ 0'
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
      brand: form.brand.trim() || undefined,
      categoryId: form.categoryId || undefined,
      price: Number(form.price),
      cost: form.cost ? Number(form.cost) : undefined,
      stock: Number(form.stock),
      minStock: form.minStock ? Number(form.minStock) : undefined,
      unit: form.unit,
      imageUrl: form.imageUrl.trim() || undefined,
    };
    await onSubmit(payload);
  }

  // Helper inline para tocar y mostrar errores tras blur.
  const blur = (k: string) => () => setTouched((t) => ({ ...t, [k]: true }));
  const showError = (k: keyof typeof errors): string | null =>
    touched[k] ? (errors[k] ?? null) : null;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-8">
      {/* ─────────────── SKU + Nombre ─────────────── */}
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

      {/* ─────────────── Descripción ─────────────── */}
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

      {/* ─────────────── Marca + Categoría ─────────────── */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Field id="brand" label="Marca" step="04">
          <input
            id="brand"
            type="text"
            value={form.brand}
            onChange={(e) => update('brand', e.target.value)}
            className="input-technical mt-3"
            placeholder="Bosch / NGK / KYB…"
            autoComplete="off"
          />
        </Field>
        <Field id="categoryId" label="Categoría" step="05">
          <select
            id="categoryId"
            value={form.categoryId}
            onChange={(e) => update('categoryId', e.target.value)}
            className="input-technical mt-3"
          >
            <option value="">— sin categoría —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {/* ─────────────── Bloque numérico (sello técnico) ─────────────── */}
      <fieldset className="border border-ink-700 p-6">
        <legend className="px-2 font-mono text-eyebrow uppercase tracking-eyebrow text-signal-500">
          06 → Datos comerciales
        </legend>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
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

          <Field id="cost" label="Costo (S/)" step="" error={showError('cost')}>
            <input
              id="cost"
              type="number"
              step="0.01"
              min="0.01"
              value={form.cost}
              onChange={(e) => update('cost', e.target.value)}
              onBlur={blur('cost')}
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
              min="1"
              value={form.stock}
              onChange={(e) => update('stock', e.target.value)}
              onBlur={blur('stock')}
              className="input-technical mt-3 num"
              placeholder="1"
              inputMode="numeric"
            />
          </Field>

          <Field id="minStock" label="Stock mínimo" step="" error={showError('minStock')}>
            <input
              id="minStock"
              type="number"
              step="1"
              min="0"
              value={form.minStock}
              onChange={(e) => update('minStock', e.target.value)}
              onBlur={blur('minStock')}
              className="input-technical mt-3 num"
              placeholder="0"
              inputMode="numeric"
            />
          </Field>
        </div>

        <Field id="unit" label="Unidad" step="" className="mt-6">
          <select
            id="unit"
            value={form.unit}
            onChange={(e) => update('unit', e.target.value)}
            className="input-technical mt-3 max-w-xs"
          >
            {Object.values(ProductUnit).map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </Field>
      </fieldset>

      <Field id="imageUrl" label="URL de imagen (opcional)" step="07">
        <input
          id="imageUrl"
          type="url"
          value={form.imageUrl}
          onChange={(e) => update('imageUrl', e.target.value)}
          className="input-technical mt-3"
          placeholder="https://cdn.kore.local/..."
        />
      </Field>

      {/* ─────────────── Error global del backend ─────────────── */}
      {submitError && (
        <div
          role="alert"
          className="border-l-2 border-danger-500 bg-danger-700/10 px-4 py-3 font-mono text-xs uppercase tracking-wider text-danger-500"
        >
          ✕ {submitError}
        </div>
      )}

      {/* ─────────────── Acciones ─────────────── */}
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

// ---------------------------------------------------------------------------
// Field — wrapper de etiqueta + error consistente para todo el formulario
// ---------------------------------------------------------------------------
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
