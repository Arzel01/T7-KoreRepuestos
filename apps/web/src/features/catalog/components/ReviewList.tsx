import { MessageSquare, ThumbsUp } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/features/auth/hooks/AuthContext';
import { productsApi } from '@/features/products/server/products.api';

import { RatingStars } from './RatingStars';
import { ReviewForm } from './ReviewForm';

import type { PaginatedReviewsResponse } from '@kore/shared';

interface ReviewListProps {
  productId: number;
}

export function ReviewList({ productId }: ReviewListProps): JSX.Element {
  const { user } = useAuth();
  const [data, setData] = useState<PaginatedReviewsResponse | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const loadReviews = useCallback(
    async (p: number): Promise<void> => {
      setLoading(true);
      try {
        const result = await productsApi.getReviews(productId, p, 5);
        setData(result);
      } finally {
        setLoading(false);
      }
    },
    [productId],
  );

  useEffect(() => {
    void loadReviews(page);
  }, [loadReviews, page]);

  const handleHelpful = async (reviewId: number): Promise<void> => {
    await productsApi.markReviewHelpful(productId, reviewId);
    void loadReviews(page);
  };

  return (
    <Card className="border-neutral-200">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-lg text-neutral-900">
            <MessageSquare className="w-5 h-5 text-navy-600" />
            Reseñas de clientes
          </CardTitle>
          {data && data.averageRating !== null && (
            <RatingStars productId={productId} rating={data.averageRating} count={data.total} />
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {user &&
          (showForm ? (
            <ReviewForm
              productId={productId}
              onSuccess={() => {
                setShowForm(false);
                void loadReviews(1);
              }}
            />
          ) : (
            <Button variant="outline" onClick={() => setShowForm(true)}>
              Escribir una reseña
            </Button>
          ))}

        {loading && <p className="text-neutral-500 text-sm">Cargando reseñas...</p>}

        {!loading && data && data.items.length === 0 && (
          <p className="text-neutral-500 text-sm italic">Sé el primero en reseñar este producto.</p>
        )}

        {!loading &&
          data &&
          data.items.map((review) => (
            <div key={review.id} className="border-b border-neutral-100 pb-4 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-neutral-900 text-sm">{review.userName}</p>
                  <RatingStars productId={review.id} rating={review.rating} count={0} />
                </div>
                <span className="text-xs text-neutral-500">
                  {new Date(review.createdAt).toLocaleDateString('es-AR')}
                </span>
              </div>
              {review.title && (
                <p className="font-medium text-neutral-800 text-sm mb-1">{review.title}</p>
              )}
              {review.comment && (
                <p className="text-neutral-700 text-sm leading-relaxed">{review.comment}</p>
              )}
              <button
                onClick={() => void handleHelpful(review.id)}
                className="mt-2 flex items-center gap-1 text-xs text-neutral-500 hover:text-navy-600 transition-colors"
              >
                <ThumbsUp className="w-3 h-3" />
                Útil ({review.helpfulVotes})
              </button>
            </div>
          ))}

        {data && data.totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-neutral-600 self-center">
              {page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Siguiente
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
