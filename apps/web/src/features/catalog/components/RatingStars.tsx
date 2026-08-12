import { Star, StarHalf } from 'lucide-react';

import { getPlaceholderRating } from '../data/vehicle-placeholder';

interface RatingStarsProps {
  productId: number;
  rating?: number | null;
  count?: number;
}

export function RatingStars({
  productId,
  rating: propRating,
  count: propCount,
}: RatingStarsProps): JSX.Element {
  const placeholder = getPlaceholderRating(productId);
  const stars = propRating ?? placeholder.stars;
  const count = propCount ?? placeholder.count;
  const full = Math.floor(stars);
  const hasHalf = stars % 1 >= 0.25 && stars % 1 < 0.75;

  return (
    <div
      className="flex items-center gap-1"
      aria-label={`Calificación: ${stars.toFixed(1)} de 5 estrellas, ${count} reseñas`}
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
        {stars.toFixed(1)} ({count})
      </span>
    </div>
  );
}
