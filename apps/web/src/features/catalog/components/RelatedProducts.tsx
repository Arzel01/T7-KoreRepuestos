import { Loader } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardContent } from '@/components/ui/card';
import { productsApi } from '@/features/products/server/products.api';
import { extractApiErrorMessage } from '@/lib/api-client';

import type { ProductResponse, PaginatedResult } from '@kore/shared';

interface RelatedProductsProps {
  currentProductId: number;
  categoryId?: number | null;
}

export function RelatedProducts({
  currentProductId,
  categoryId,
}: RelatedProductsProps): JSX.Element {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRelated = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const result: PaginatedResult<ProductResponse> = await productsApi.list({
          categoryIds: categoryId ? [String(categoryId)] : undefined,
          pageSize: 6,
        });

        // Filter out current product and get first 5
        const related = result.items.filter((p) => p.id !== currentProductId).slice(0, 5);

        setProducts(related);
      } catch (err) {
        const message = extractApiErrorMessage(err);
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    void fetchRelated();
  }, [currentProductId, categoryId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="w-8 h-8 text-navy-600 animate-spin" />
      </div>
    );
  }

  if (error || products.length === 0) {
    return <></>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Otros clientes también compraron
        </h2>
        <p className="text-neutral-600">Productos relacionados que podrían interesarte</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <Card
            key={product.id}
            className="h-full border-neutral-200 hover:border-navy-300 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
            onClick={() => navigate(`/product/${product.id}`)}
          >
            {/* Product Image Placeholder */}
            <div className="w-full h-40 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center overflow-hidden relative">
              {product.imageUrl ? (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-neutral-400 text-4xl">📦</span>
                </div>
              )}
            </div>

            <CardContent className="p-3 space-y-2 flex flex-col flex-1">
              <p className="text-xs font-mono text-neutral-500">{product.sku}</p>
              <h3 className="font-semibold text-sm text-neutral-900 line-clamp-2 group-hover:text-navy-600 transition-colors">
                {product.name}
              </h3>

              <div className="flex-1" />

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-lg font-bold text-navy-700">${product.price.toFixed(2)}</p>
                  <p className="text-xs text-neutral-500">+ IVA</p>
                </div>
                <div
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {product.stock > 0 ? 'En stock' : 'Sin stock'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
