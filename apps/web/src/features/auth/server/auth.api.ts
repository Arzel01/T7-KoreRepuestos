import { api } from '@/lib/api-client';

import type { IdentificationType } from '@kore/shared';
import type { UserResponse } from '@kore/shared';

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
  identificationType: IdentificationType;
  identificationNumber: string;
  phone?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthValidateResponse {
  valid: true;
  active: true;
  userId: number;
  email: string;
  role: string;
}

export const authApi = {
  register: (payload: RegisterPayload): Promise<AuthResponseDto> =>
    api.post<AuthResponseDto>('/auth/register', payload),

  login: (payload: LoginPayload): Promise<AuthResponseDto> =>
    api.post<AuthResponseDto>('/auth/login', payload),

  logout: (refreshToken: string): Promise<void> => api.post<void>('/auth/logout', { refreshToken }),

  me: (): Promise<UserResponse> => api.get('/auth/me'),

  validate: (): Promise<AuthValidateResponse> => api.get('/auth/validate'),
};
