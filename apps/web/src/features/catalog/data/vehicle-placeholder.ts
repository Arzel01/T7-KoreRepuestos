/**
 * TODO(catalog): datos reales.
 *
 * Datos ESTÁTICOS de muestra para las partes del diseño que el backend aún
 * no soporta (compatibilidad vehicular y reseñas). Todo lo "fake" del
 * catálogo vive en este archivo y en los componentes hoja que lo consumen
 * (`VehicleSelector`, `RatingStars`) — cablear datos reales después implica
 * reemplazar este import, sin tocar el resto del feature.
 */

export const VEHICLE_TYPES = ['Sedán', 'SUV', 'Hatchback', 'Pickup', 'Furgoneta'] as const;

export const VEHICLE_YEARS = Array.from({ length: 17 }, (_, i) => String(2026 - i));

export interface PlaceholderRating {
  /** Promedio de 3.5 a 5.0 en pasos de 0.5 */
  stars: number;
  /** Cantidad de reseñas (1–30) */
  count: number;
}

/**
 * Rating determinístico derivado del id del producto: el mismo producto
 * siempre muestra las mismas estrellas (evita parpadeos entre renders y
 * resultados distintos por usuario).
 */
export function getPlaceholderRating(productId: number | string): PlaceholderRating {
  const str = String(productId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return {
    stars: 3.5 + (hash % 4) * 0.5,
    count: 1 + (hash % 30),
  };
}
