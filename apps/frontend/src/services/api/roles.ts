import type { CreateRoleInput, PaginatedResult, PublicRole, RoleListQuery, UpdateRoleInput } from '@app/shared';
import { apiRequest } from './client';
import { toQuery } from '@/lib/query';

export const rolesApi = {
  list: (query: RoleListQuery) =>
    apiRequest<PaginatedResult<PublicRole>>(`/roles${toQuery(query)}`),
  get: (id: string) => apiRequest<PublicRole>(`/roles/${id}`),
  create: (input: CreateRoleInput) =>
    apiRequest<PublicRole>('/roles', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: UpdateRoleInput) =>
    apiRequest<PublicRole>(`/roles/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: string) => apiRequest<void>(`/roles/${id}`, { method: 'DELETE' }),
};
