import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { tokenStorage } from './token-storage';

/**
 * Cliente HTTP único de la aplicación.
 *
 * Responsabilidades:
 *   · Inyectar el JWT en cada request (interceptor de request).
 *   · Centralizar el manejo de 401 (interceptor de response) → logout suave.
 *
 * No expone axios directamente: solo el método `request()` y atajos REST.
 * Esto facilita migrar a fetch o a un cliente generado más adelante.
 */

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000/api/v1';

let unauthorizedHandler: (() => void) | null = null;

export function onUnauthorized(handler: () => void): void {
  unauthorizedHandler = handler;
}

const instance: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

instance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

instance.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      tokenStorage.clear();
      unauthorizedHandler?.();
    }
    return Promise.reject(error);
  },
);

export const api = {
  get: <T>(url: string, params?: Record<string, unknown>): Promise<T> =>
    instance.get<T>(url, { params }).then((r) => r.data),

  post: <T>(url: string, body?: unknown): Promise<T> =>
    instance.post<T>(url, body).then((r) => r.data),

  patch: <T>(url: string, body?: unknown): Promise<T> =>
    instance.patch<T>(url, body).then((r) => r.data),

  put: <T>(url: string, body?: unknown): Promise<T> =>
    instance.put<T>(url, body).then((r) => r.data),

  delete: <T>(url: string): Promise<T> => instance.delete<T>(url).then((r) => r.data),

  postForm: <T>(url: string, form: FormData): Promise<T> =>
    instance.post<T>(url, form).then((r) => r.data),
};

/** Extrae mensajes de error legibles del payload normalizado de NestJS. */
export function extractApiErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string | string[]; error?: { message?: string } }
      | undefined;
    if (Array.isArray(data?.message)) return data!.message.join(' · ');
    if (typeof data?.message === 'string') return data.message;
    if (data?.error?.message) return data.error.message;
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return 'Error desconocido';
}
