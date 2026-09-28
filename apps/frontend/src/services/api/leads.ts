import type {
  LeadFilterOptions,
  LeadListQuery,
  PaginatedResult,
  PublicLead,
  PublicLeadDetail,
} from '@app/shared';
import { apiRequest } from './client';
import { toQuery } from '@/lib/query';

export const leadsApi = {
  list: (query: LeadListQuery) =>
    apiRequest<PaginatedResult<PublicLead>>(`/leads${toQuery(query)}`),
  get: (id: string) => apiRequest<PublicLeadDetail>(`/leads/${id}`),
  filterOptions: () => apiRequest<LeadFilterOptions>('/leads/filter-options'),
};
