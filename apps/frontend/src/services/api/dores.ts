import type {
  CreateDorInput,
  DorListQuery,
  PaginatedResult,
  PublicDor,
  UpdateDorInput,
} from '@app/shared';
import { apiRequest } from './client';
import { toQuery } from '@/lib/query';

export const doresApi = {
  list: (query: DorListQuery) =>
    apiRequest<PaginatedResult<PublicDor>>(`/dores${toQuery(query)}`),
  get: (id: string) => apiRequest<PublicDor>(`/dores/${id}`),
  create: (input: CreateDorInput) =>
    apiRequest<PublicDor>('/dores', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: UpdateDorInput) =>
    apiRequest<PublicDor>(`/dores/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
  remove: (id: string) => apiRequest<void>(`/dores/${id}`, { method: 'DELETE' }),
};
