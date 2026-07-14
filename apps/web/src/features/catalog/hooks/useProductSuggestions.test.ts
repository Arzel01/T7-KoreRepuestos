import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { productsApi } from '@/features/products/server/products.api';

import { useProductSuggestions } from './useProductSuggestions';

vi.mock('@/features/products/server/products.api', () => ({
  productsApi: {
    getSuggestions: vi.fn(),
  },
}));

const mockGetSuggestions = vi.mocked(productsApi.getSuggestions);

const MOCK_SUGGESTIONS = [
  { id: 1, name: 'Filtro de aceite', sku: 'FILT-001', price: 12.5 },
  { id: 2, name: 'Filtro de aire', sku: 'FILT-002', price: 8.0 },
];

describe('useProductSuggestions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockGetSuggestions.mockResolvedValue(MOCK_SUGGESTIONS);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('no llama a la API con menos de 2 caracteres', async () => {
    const { result } = renderHook(() => useProductSuggestions('f'));

    await act(() => vi.runAllTimersAsync());

    expect(mockGetSuggestions).not.toHaveBeenCalled();
    expect(result.current.suggestions).toEqual([]);
  });

  it('llama a la API después del debounce con ≥ 2 caracteres', async () => {
    const { result } = renderHook(() => useProductSuggestions('fi'));

    await act(() => vi.advanceTimersByTimeAsync(300));

    await waitFor(() => {
      expect(mockGetSuggestions).toHaveBeenCalledWith('fi', expect.anything());
    });
    expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);
  });

  it('colapsa keystrokes — solo llama una vez con el valor final', async () => {
    const { rerender } = renderHook(({ q }: { q: string }) => useProductSuggestions(q), {
      initialProps: { q: 'fi' },
    });

    rerender({ q: 'fil' });
    rerender({ q: 'filt' });

    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(mockGetSuggestions).toHaveBeenCalledTimes(1);
    expect(mockGetSuggestions).toHaveBeenCalledWith('filt', expect.anything());
  });

  it('vacía sugerencias si el query cae por debajo de 2 chars', async () => {
    const { result, rerender } = renderHook(({ q }: { q: string }) => useProductSuggestions(q), {
      initialProps: { q: 'fi' },
    });

    await act(() => vi.advanceTimersByTimeAsync(300));
    expect(result.current.suggestions).toEqual(MOCK_SUGGESTIONS);

    rerender({ q: 'f' });
    expect(result.current.suggestions).toEqual([]);
  });
});
