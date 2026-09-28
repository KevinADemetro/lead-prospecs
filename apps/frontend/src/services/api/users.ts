import type { CreateUserInput, PaginatedResult, PublicUser, UpdateUserInput, UserListQuery } from '@app/shared';
import { apiRequest } from './client';
import { toQuery } from '@/lib/query';

export const usersApi = {
  list: (query: UserListQuery) =>
    apiRequest<PaginatedResult<PublicUser>>(`/users${toQuery(query)}`),
  get: (id: string) => apiRequest<PublicUser>(`/users/${id}`),
  create: (input: CreateUserInput) =>
    apiRequest<PublicUser>('/users', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: UpdateUserInput) =>
    apiRequest<PublicUser>(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: string) => apiRequest<void>(`/users/${id}`, { method: 'DELETE' }),
};
