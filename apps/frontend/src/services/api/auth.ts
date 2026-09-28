import type { AuthUser } from '@app/shared';
import { apiRequest } from './client';

export const authApi = {
  csrf: () => apiRequest<{ csrfToken: string }>('/auth/csrf'),
  login: (login: string, password: string) =>
    apiRequest<{ user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, password }),
    }),
  logout: () => apiRequest<{ success: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => apiRequest<{ user: AuthUser }>('/auth/me'),
  changePassword: (currentPassword: string, newPassword: string) =>
    apiRequest<{ success: boolean }>('/auth/password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword }),
    }),
};
