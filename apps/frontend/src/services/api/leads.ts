import type { LeadListQuery, PaginatedResult, PublicLead } from '@app/shared';
import { apiRequest } from './client';
import { toQuery } from '@/lib/query';

export const leadsApi = {
  list: (query: LeadListQuery) =>
    apiRequest<PaginatedResult<PublicLead>>(`/leads${toQuery(query)}`),
  get: (id: string) => apiRequest<PublicLead>(`/leads/${id}`),
};
