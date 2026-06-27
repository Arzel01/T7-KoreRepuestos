import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { extractApiErrorMessage } from '@/lib/api-client';

import { productsApi, type UpdateProductPayload } from '../server/products.api';

import { ImageUploader } from './ImageUploader';
import { ProductForm } from './ProductForm';
import { TechnicalSheetEditor } from './TechnicalSheetEditor';

import type { ProductResponse } from '@kore/shared';

export function ProductEditPage(): JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const productId = Number(id);

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    productsApi
      .getById(productId)
      .then((p) => {
        if (!cancelled) {
          setProduct(p);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(extractApiErrorMessage(err));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [productId]);

  async function handleSubmit(payload: UpdateProductPayload): Promise<void> {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await productsApi.update(productId, payload);
      navigate('/admin/products');
    } catch (err) {
      setSubmitError(extractApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-8 py-12">
        <p className="font-mono text-xs text-neutral-500">Cargando producto…</p>
      </div>
    );
  }

  if (loadError || !product) {
    return (
      <div className="mx-auto max-w-7xl px-8 py-12">
        <p className="font-mono text-xs text-red-600">✕ {loadError ?? 'Producto no encontrado'}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-12 animate-fade-in-up">
      <header className="mb-10 border-b border-border pb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">
          Inventario · Editar
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
          {product.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{product.sku}</p>
      </header>

      {/* Datos del producto */}
      <section className="mb-12">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          01 → Datos generales
        </h2>
        <ProductForm
          mode="edit"
          initialValues={{
            id: product.id,
            sku: product.sku,
            name: product.name,
            description: product.description ?? '',
            categoryId: product.categoryId ?? undefined,
            price: product.price,
            stock: product.stock,
          }}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </section>

      {/* Imágenes */}
      <section className="mb-12 border-t border-border pt-10">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          02 → Imágenes
        </h2>
        <ImageUploader productId={productId} />
      </section>

      {/* Ficha técnica */}
      <section className="border-t border-border pt-10">
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          03 → Ficha técnica
        </h2>
        <TechnicalSheetEditor productId={productId} />
      </section>
    </div>
  );
}
