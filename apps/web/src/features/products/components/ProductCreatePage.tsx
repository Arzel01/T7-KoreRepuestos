import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { extractApiErrorMessage } from '@/lib/api-client';

import { productsApi, type CreateProductPayload } from '../server/products.api';

import { ProductForm } from './ProductForm';

export function ProductCreatePage(): JSX.Element {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(payload: CreateProductPayload): Promise<void> {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const created = await productsApi.create(payload);
      navigate(`/admin/products/${created.id}`, { replace: true });
    } catch (err) {
      setSubmitError(extractApiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-8 py-12 animate-fade-in-up">
      <header className="mb-10 flex items-end justify-between border-b border-border pb-8">
        <div>
          <p className="text-sm font-semibold text-primary">Op · 045</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
            Añadir producto<span className="text-primary">.</span>
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Complete los campos obligatorios marcados con{' '}
            <span className="font-semibold text-primary">*</span>. El precio y el stock deben ser{' '}
            <strong className="text-foreground">mayores que cero</strong>.
          </p>
        </div>
        <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
          Requiere admin
        </span>
      </header>

      <section className="rounded-2xl border border-border bg-card p-8 shadow-sm lg:p-10">
        <ProductForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </section>
    </div>
  );
}
