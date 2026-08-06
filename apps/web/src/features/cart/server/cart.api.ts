import { api } from '@/lib/api-client';

import type {
  AddCartItemPayload,
  BulkAddCartPayload,
  CartResponse,
  UpdateCartItemPayload,
} from '@kore/shared';

export const cartApi = {
  get: (): Promise<CartResponse> => api.get('/cart'),

  addItem: (payload: AddCartItemPayload): Promise<CartResponse> => api.post('/cart/items', payload),

  bulkAdd: (payload: BulkAddCartPayload): Promise<CartResponse> =>
    api.post('/cart/items/bulk', payload),

  updateItem: (itemId: number, payload: UpdateCartItemPayload): Promise<CartResponse> =>
    api.put(`/cart/items/${itemId}`, payload),

  removeItem: (itemId: number): Promise<CartResponse> => api.delete(`/cart/items/${itemId}`),

  clear: (): Promise<CartResponse> => api.delete('/cart'),
};
