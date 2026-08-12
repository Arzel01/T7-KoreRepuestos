import { Star } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { productsApi } from '@/features/products/server/products.api';
import { extractApiErrorMessage } from '@/lib/api-client';

interface ReviewFormProps {
  productId: number;
  onSuccess: () => void;
}

export function ReviewForm({ productId, onSuccess }: ReviewFormProps): JSX.Element {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (rating === 0) {
      setError('Selecciona una calificación');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await productsApi.createReview(productId, {
        rating,
        title: title.trim() || undefined,
        comment: comment.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-4 p-4 border rounded-lg bg-neutral-50"
    >
      <h3 className="font-semibold text-neutral-900">Escribir una reseña</h3>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setRating(s)}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            className="focus:outline-none"
          >
            <Star
              className={`size-7 transition-colors ${
                s <= (hovered || rating) ? 'fill-yellow-400 text-yellow-400' : 'text-neutral-300'
              }`}
            />
          </button>
        ))}
      </div>

      <Input
        placeholder="Título (opcional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={200}
      />

      <Textarea
        placeholder="Comparte tu experiencia con este producto..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
        maxLength={2000}
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" disabled={submitting || rating === 0} className="w-full">
        {submitting ? 'Publicando...' : 'Publicar reseña'}
      </Button>
    </form>
  );
}
