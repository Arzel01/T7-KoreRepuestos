import { api } from '@/lib/api-client';

import type {
  CategoryResponse,
  CreateCategoryPayload,
  PaginatedResult,
  ProductImageResponse,
  ProductQueryParams,
  ProductResponse,
  TechnicalSheetEntryResponse,
  UpdateCategoryPayload,
} from '@kore/shared';

export interface CreateProductPayload {
  sku: string;
  name: string;
  description?: string;
  categoryId?: number;
  price: number;
  stock: number;
}

export interface UpdateProductPayload {
  name?: string;
  description?: string;
  categoryId?: number;
  price?: number;
  stock?: number;
  isActive?: boolean;
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
  update: (id: number, payload: UpdateProductPayload): Promise<ProductResponse> =>
    api.patch(`/products/${id}`, payload),
  remove: (id: number): Promise<void> => api.delete(`/products/${id}`),

  // Imágenes
  getImages: (productId: number): Promise<ProductImageResponse[]> =>
    api.get(`/products/${productId}/images`),
  uploadImage: (productId: number, file: File): Promise<ProductImageResponse> => {
    const form = new FormData();
    form.append('file', file);
    return api.postForm(`/products/${productId}/images`, form);
  },
  deleteImage: (productId: number, imageId: number): Promise<void> =>
    api.delete(`/products/${productId}/images/${imageId}`),

  // Fichas técnicas
  getTechnicalSheet: (productId: number): Promise<TechnicalSheetEntryResponse[]> =>
    api.get(`/products/${productId}/technical-sheet`),
  addTechnicalSheetEntry: (
    productId: number,
    payload: { attribute: string; value: string },
  ): Promise<TechnicalSheetEntryResponse> =>
    api.post(`/products/${productId}/technical-sheet`, payload),
  deleteTechnicalSheetEntry: (productId: number, entryId: number): Promise<void> =>
    api.delete(`/products/${productId}/technical-sheet/${entryId}`),
};

export const categoriesApi = {
  list: (): Promise<CategoryResponse[]> => api.get('/categories'),
  tree: (): Promise<CategoryResponse[]> => api.get('/categories/tree'),
  create: (payload: CreateCategoryPayload): Promise<CategoryResponse> =>
    api.post('/categories', payload),
  update: (id: number, payload: UpdateCategoryPayload): Promise<CategoryResponse> =>
    api.patch(`/categories/${id}`, payload),
  remove: (id: number): Promise<void> => api.delete(`/categories/${id}`),
};
