import { api } from '@/lib/api-client';

import type {
  CategoryResponse,
  PaginatedResult,
  ProductQueryParams,
  ProductResponse,
} from '@kore/shared';

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

/**
 * Serializa los params del catálogo para la URL: `categoryIds` viaja como
 * string separado por comas y los valores undefined se omiten (axios los
 * descarta, y el backend rechaza params desconocidos/vacíos).
 */
function toQueryParams(params?: ProductQueryParams): Record<string, unknown> | undefined {
  if (!params) return undefined;
  const { categoryIds, ...rest } = params;
  return {
    ...rest,
    categoryIds: categoryIds?.length ? categoryIds.join(',') : undefined,
  };
}

export const productsApi = {
  list: (params?: ProductQueryParams): Promise<PaginatedResult<ProductResponse>> =>
    api.get('/products', toQueryParams(params)),
  getById: (id: string): Promise<ProductResponse> => api.get(`/products/${id}`),
  create: (payload: CreateProductPayload): Promise<ProductResponse> =>
    api.post('/products', payload),
};

export const categoriesApi = {
  list: (): Promise<CategoryResponse[]> => api.get('/categories'),
  tree: (): Promise<CategoryResponse[]> => api.get('/categories/tree'),
};
