import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { useAuth } from '@/features/auth/hooks/AuthContext';
import { extractApiErrorMessage } from '@/lib/api-client';

import { cartApi } from '../server/cart.api';

import type { AddCartItemPayload, CartResponse } from '@kore/shared';

interface CartState {
  cart: CartResponse | null;
  /** Suma de cantidades — alimenta el badge del ícono del carrito. */
  itemCount: number;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  addMany: (items: AddCartItemPayload[]) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: ReactNode }): JSX.Element {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      setCart(await cartApi.get());
    } catch (err) {
      setError(extractApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga el carrito al iniciar sesión; lo limpia al cerrarla.
  useEffect(() => {
    if (!isAuthenticated) {
      setCart(null);
      setError(null);
      return;
    }
    void refresh();
  }, [isAuthenticated, refresh]);

  /** Ejecuta una mutación del carrito y refleja la respuesta; propaga el error para la UI. */
  const mutate = useCallback(async (op: () => Promise<CartResponse>): Promise<void> => {
    setError(null);
    try {
      setCart(await op());
    } catch (err) {
      const message = extractApiErrorMessage(err);
      setError(message);
      throw new Error(message);
    }
  }, []);

  const addItem = useCallback(
    (productId: number, quantity = 1) => mutate(() => cartApi.addItem({ productId, quantity })),
    [mutate],
  );

  const addMany = useCallback(
    (items: AddCartItemPayload[]) => mutate(() => cartApi.bulkAdd({ items })),
    [mutate],
  );

  const updateItem = useCallback(
    (itemId: number, quantity: number) => mutate(() => cartApi.updateItem(itemId, { quantity })),
    [mutate],
  );

  const removeItem = useCallback(
    (itemId: number) => mutate(() => cartApi.removeItem(itemId)),
    [mutate],
  );

  const clear = useCallback(() => mutate(() => cartApi.clear()), [mutate]);

  const value = useMemo<CartState>(
    () => ({
      cart,
      itemCount: cart?.itemCount ?? 0,
      loading,
      error,
      refresh,
      addItem,
      addMany,
      updateItem,
      removeItem,
      clear,
    }),
    [cart, loading, error, refresh, addItem, addMany, updateItem, removeItem, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart() debe usarse dentro de <CartProvider>');
  }
  return ctx;
}
