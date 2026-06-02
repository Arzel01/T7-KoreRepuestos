import { api } from '@/lib/api-client';

import type { ProductResponse } from '@kore/shared';

export interface CreateProductPayload {
  sku: string;
  name: string;
  description?: string;
  categoryId?: string;
  brand?: string;
  price: number;
  cost?: number;
  stock: number;
  minStock?: number;
  unit?: string;
  imageUrl?: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
}

export const productsApi = {
  list: (): Promise<ProductResponse[]> => api.get('/products'),
  getById: (id: string): Promise<ProductResponse> => api.get(`/products/${id}`),
  create: (payload: CreateProductPayload): Promise<ProductResponse> =>
    api.post('/products', payload),
};

export const categoriesApi = {
  list: (): Promise<CategoryDto[]> => api.get('/categories'),
  tree: (): Promise<CategoryDto[]> => api.get('/categories/tree'),
};
