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
  categoryId?: number;
  price: number;
  stock: number;
}

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
  getById: (id: number): Promise<ProductResponse> => api.get(`/products/${id}`),
  create: (payload: CreateProductPayload): Promise<ProductResponse> =>
    api.post('/products', payload),
};

export const categoriesApi = {
  list: (): Promise<CategoryResponse[]> => api.get('/categories'),
  tree: (): Promise<CategoryResponse[]> => api.get('/categories/tree'),
};
