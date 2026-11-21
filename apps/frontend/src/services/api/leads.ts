import type {
  LeadFilterOptions,
  LeadListQuery,
  PaginatedResult,
  PublicLead,
  PublicLeadDetail,
  UpdateLeadInput,
} from '@app/shared';
import { apiRequest } from './client';
import { toQuery } from '@/lib/query';

export const leadsApi = {
  list: (query: LeadListQuery) =>
    apiRequest<PaginatedResult<PublicLead>>(`/leads${toQuery(query)}`),
  get: (id: string) => apiRequest<PublicLeadDetail>(`/leads/${id}`),
  filterOptions: () => apiRequest<LeadFilterOptions>('/leads/filter-options'),
  update: (id: string, input: UpdateLeadInput) =>
    apiRequest<PublicLeadDetail>(`/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
};
