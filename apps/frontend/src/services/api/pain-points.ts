import type {
  CreatePainPointInput,
  PainPointListQuery,
  PaginatedResult,
  PublicPainPoint,
  UpdatePainPointInput,
} from '@app/shared';
import { apiRequest } from './client';
import { toQuery } from '@/lib/query';

export const painPointsApi = {
  list: (query: PainPointListQuery) =>
    apiRequest<PaginatedResult<PublicPainPoint>>(`/pain-points${toQuery(query)}`),
  get: (id: string) => apiRequest<PublicPainPoint>(`/pain-points/${id}`),
  create: (input: CreatePainPointInput) =>
    apiRequest<PublicPainPoint>('/pain-points', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: UpdatePainPointInput) =>
    apiRequest<PublicPainPoint>(`/pain-points/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (id: string) => apiRequest<void>(`/pain-points/${id}`, { method: 'DELETE' }),
};
