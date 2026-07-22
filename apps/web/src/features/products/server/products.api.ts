import { api } from '@/lib/api-client';

import type {
  CategoryResponse,
  CompatibilityItem,
  CreateCategoryPayload,
  MileagePartResponse,
  PaginatedResult,
  PaginatedReviewsResponse,
  ProductImageResponse,
  ProductQueryParams,
  ProductResponse,
  RecommendedProductResponse,
  ReviewResponse,
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

export interface CreateReviewPayload {
  rating: number;
  title?: string;
  comment?: string;
}

function toQueryParams(params?: ProductQueryParams): Record<string, unknown> | undefined {
  if (!params) return undefined;
  const { categoryIds, ...rest } = params;
  return {
    ...rest,
    categoryIds: categoryIds?.length ? categoryIds.join(',') : undefined,
  };
}

export interface ProductSuggestion {
  id: number;
  name: string;
  sku: string;
  price: number;
}

export const productsApi = {
  list: (params?: ProductQueryParams): Promise<PaginatedResult<ProductResponse>> =>
    api.get('/products', toQueryParams(params)),
  getSuggestions: (q: string, signal?: AbortSignal): Promise<ProductSuggestion[]> =>
    api.get('/products/suggestions', { q, limit: 8 }, signal),
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

  // Compatibilidad
  getCompatibility: (productId: number): Promise<CompatibilityItem[]> =>
    api.get(`/products/${productId}/compatibility`),
  addCompatibility: (productId: number, modeloId: number): Promise<void> =>
    api.post(`/products/${productId}/compatibility`, { modeloId }),
  removeCompatibility: (productId: number, modeloId: number): Promise<void> =>
    api.delete(`/products/${productId}/compatibility/${modeloId}`),

  // Reseñas
  getReviews: (productId: number, page = 1, pageSize = 10): Promise<PaginatedReviewsResponse> =>
    api.get(`/products/${productId}/reviews`, { page, pageSize }),
  createReview: (productId: number, payload: CreateReviewPayload): Promise<ReviewResponse> =>
    api.post(`/products/${productId}/reviews`, payload),
  markReviewHelpful: (productId: number, reviewId: number): Promise<void> =>
    api.post(`/products/${productId}/reviews/${reviewId}/helpful`, {}),
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

export const recommendationsApi = {
  getRecommendations: (id: number): Promise<RecommendedProductResponse[]> =>
    api.get(`/recommendations/${id}`),
  getFrequentlyBoughtTogether: (id: number): Promise<RecommendedProductResponse[]> =>
    api.get(`/recommendations/${id}/frequently-bought-together`),
};

export const maintenanceApi = {
  findPartsByMileage: (mileage: number): Promise<MileagePartResponse[]> =>
    api.get('/maintenance/parts', { mileage }),
};
