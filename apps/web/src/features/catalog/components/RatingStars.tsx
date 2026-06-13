import { Star, StarHalf } from 'lucide-react';

import { getPlaceholderRating } from '../data/vehicle-placeholder';

/**
 * Estrellas de calificación — PLACEHOLDER visual.
 * El backend aún no tiene reseñas; el valor se deriva determinísticamente
 * del id del producto (ver `data/vehicle-placeholder.ts`).
 */
export function RatingStars({ productId }: { productId: number }): JSX.Element {
  const { stars, count } = getPlaceholderRating(productId);
  const full = Math.floor(stars);
  const hasHalf = stars % 1 !== 0;

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Calificación: ${stars} de 5 estrellas, ${count} reseñas`}
    >
      <div className="flex" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => {
          if (i < full) {
            return <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />;
          }
          if (i === full && hasHalf) {
            return (
              <span key={i} className="relative inline-flex">
                <Star className="size-4 text-yellow-400" />
                <StarHalf className="absolute inset-0 size-4 fill-yellow-400 text-yellow-400" />
              </span>
            );
          }
          return <Star key={i} className="size-4 text-yellow-400" />;
        })}
      </div>
      <span className="text-xs text-muted-foreground">
        {stars} ({count})
      </span>
    </div>
  );
}
