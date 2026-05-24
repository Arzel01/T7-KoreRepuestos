import { api } from '@/lib/api-client';

import type { UserResponse } from '@kore/shared';

/**
 * Cliente HTTP del módulo de autenticación.
 *
 * Cada función mapea 1:1 a un endpoint del backend y declara su contrato
 * en términos de tipos compartidos (`@kore/shared`). Si el contrato cambia
 * en el backend, TypeScript marca aquí el error inmediatamente.
 */

export interface AuthTokensDto {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface AuthResponseDto {
  user: UserResponse;
  tokens: AuthTokensDto;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authApi = {
  register: (payload: RegisterPayload): Promise<AuthResponseDto> =>
    api.post<AuthResponseDto>('/auth/register', payload),

  login: (payload: LoginPayload): Promise<AuthResponseDto> =>
    api.post<AuthResponseDto>('/auth/login', payload),

  logout: (refreshToken: string): Promise<void> => api.post<void>('/auth/logout', { refreshToken }),

  me: (): Promise<{ sub: string; email: string; role: string }> => api.get('/auth/me'),
};
