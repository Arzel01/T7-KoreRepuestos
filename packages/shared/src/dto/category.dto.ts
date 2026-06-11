/**
 * DTO público de categoría de producto, tal como lo expone GET /categories.
 * Compartido entre backend y frontend para mantener el contrato alineado.
 */
export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  description?: string;
  isActive: boolean;
  children?: CategoryResponse[];
}
