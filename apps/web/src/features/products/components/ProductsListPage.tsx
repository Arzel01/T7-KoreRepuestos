import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { extractApiErrorMessage } from '@/lib/api-client';

import { productsApi } from '../server/products.api';

import type { ProductResponse } from '@kore/shared';

export function ProductsListPage(): JSX.Element {
  const [items, setItems] = useState<ProductResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    productsApi
      .list({ page: 1, pageSize: 60 })
      .then((res) => {
        if (!cancelled) {
          setItems(res.items);
          setTotal(res.total);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(extractApiErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-8 py-12 animate-fade-in-up">
      <header className="mb-10 flex items-end justify-between border-b border-ink-700 pb-6">
        <div>
          <p className="eyebrow">Inventario · 01</p>
          <h1 className="display mt-3 text-display-md">Productos</h1>
          <p className="mt-2 font-mono text-xs text-ink-400">
            {loading ? 'Cargando…' : `${total} ítems registrados`}
          </p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          + Nuevo producto
        </Link>
      </header>

      {error && (
        <div className="mb-6 border-l-2 border-danger-500 bg-danger-700/10 px-4 py-3 font-mono text-xs uppercase tracking-wider text-danger-500">
          ✕ {error}
        </div>
      )}

      <div className="border border-ink-700">
        <table className="w-full border-collapse text-left">
          <thead className="border-b border-ink-700 bg-ink-900 text-ink-400">
            <tr className="font-mono text-eyebrow uppercase tracking-eyebrow">
              <th className="px-4 py-3 font-medium">SKU</th>
              <th className="px-4 py-3 font-medium">Nombre</th>
              <th className="px-4 py-3 font-medium">Marca</th>
              <th className="px-4 py-3 text-right font-medium">Precio</th>
              <th className="px-4 py-3 text-right font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && !loading && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center font-mono text-xs text-ink-500">
                  ── Aún no hay productos. Cree el primero. ──
                </td>
              </tr>
            )}
            {items.map((p) => (
              <tr
                key={p.id}
                className="border-b border-ink-700/60 transition-colors hover:bg-ink-900"
              >
                <td className="px-4 py-3 font-mono text-sm text-signal-500">{p.sku}</td>
                <td className="px-4 py-3 text-sm text-ink-100">{p.name}</td>
                <td className="px-4 py-3 text-sm text-ink-300">{p.brand ?? '—'}</td>
                <td className="px-4 py-3 text-right font-mono text-sm text-ink-100">
                  S/ {p.price.toFixed(2)}
                </td>
                <td
                  className={`px-4 py-3 text-right font-mono text-sm ${
                    p.stock <= p.minStock ? 'text-warning-400' : 'text-ink-100'
                  }`}
                >
                  {p.stock}
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`tag ${
                      p.isActive
                        ? 'border-success-500/40 text-success-500'
                        : 'border-ink-600 text-ink-400'
                    }`}
                  >
                    {p.isActive ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
