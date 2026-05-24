import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { extractApiErrorMessage } from '@/lib/api-client';

import { productsApi, type CreateProductPayload } from '../api/products.api';
import { ProductForm } from '../components/ProductForm';

/**
 * Página "Crear producto" del panel admin.
 *
 * Conecta el ProductForm puro con:
 *   · La API real (productsApi.create)
 *   · El router (navega al detalle tras éxito)
 *   · El estado de la página (submitting, errores)
 *
 * Diseño editorial: header con número de operación, formulario en panel.
 */
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
      {/* ─── Cabecera editorial ─── */}
      <header className="mb-12 flex items-end justify-between border-b border-ink-700 pb-8">
        <div>
          <p className="eyebrow">Op · 045</p>
          <h1 className="display mt-3 text-display-md">
            Añadir producto<span className="text-signal-500">.</span>
          </h1>
          <p className="mt-3 max-w-2xl font-sans text-sm text-ink-400">
            Complete los campos obligatorios marcados con <span className="text-signal-500">*</span>
            . El precio y el stock deben ser{' '}
            <strong className="text-ink-100">mayores que cero</strong>.
          </p>
        </div>
        <span className="tag border-signal-500/40 text-signal-500">REQUIERE ADMIN</span>
      </header>

      {/* ─── Formulario ─── */}
      <section className="panel p-8 lg:p-10">
        <ProductForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitError={submitError}
        />
      </section>
    </div>
  );
}
