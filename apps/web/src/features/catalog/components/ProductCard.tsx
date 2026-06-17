import { ImageOff, ShoppingCart } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';

import { RatingStars } from './RatingStars';

import type { ProductResponse } from '@kore/shared';

/**
 * Tarjeta del catálogo: imagen · título · SKU · rating (placeholder) ·
 * descripción · precio azul · disponibilidad · acciones.
 */
export function ProductCard({ product }: { product: ProductResponse }): JSX.Element {
  const [imageFailed, setImageFailed] = useState(false);
  const available = product.stock > 0;

  return (
    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-md">
      {/* Imagen */}
      <div className="flex h-44 items-center justify-center bg-muted/50">
        {product.imageUrl && !imageFailed ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ImageOff className="size-10 text-muted-foreground/50" aria-label="Sin imagen" />
        )}
      </div>

      {/* Información */}
      <CardContent className="flex-1 space-y-2 pt-4">
        <h3 className="font-semibold leading-snug">{product.name}</h3>
        <p className="font-mono text-xs text-muted-foreground">{product.sku}</p>
        <RatingStars productId={product.id} />
        {product.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{product.description}</p>
        )}
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex-col items-stretch gap-3 pt-0">
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-primary">${product.price.toFixed(2)}</span>
          {available ? (
            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
              {product.stock} disponibles
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-muted-foreground">
              Agotado
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {/* TODO(catalog): página de detalle /products/:id */}
          <Button variant="outline" className="flex-1" title="Detalle (próximamente)">
            Ver Detalles
          </Button>
          {/* TODO(catalog): carrito real */}
          <Button
            size="icon"
            disabled={!available}
            aria-label={`Agregar ${product.name} al carrito`}
            title="Agregar al carrito (próximamente)"
          >
            <ShoppingCart className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
