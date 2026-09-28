import type {
  CampaignListQuery,
  CreateCampaignInput,
  PaginatedResult,
  PublicCampaign,
  UpdateCampaignInput,
} from '@app/shared';
import { apiRequest } from './client';
import { toQuery } from '@/lib/query';

const update = (id: string, input: UpdateCampaignInput) =>
  apiRequest<PublicCampaign>(`/campaigns/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(input),
  });

export const campaignsApi = {
  list: (query: CampaignListQuery) =>
    apiRequest<PaginatedResult<PublicCampaign>>(`/campaigns${toQuery(query)}`),
  get: (id: string) => apiRequest<PublicCampaign>(`/campaigns/${id}`),
  create: (input: CreateCampaignInput) =>
    apiRequest<PublicCampaign>('/campaigns', { method: 'POST', body: JSON.stringify(input) }),
  update,
  run: (id: string) => update(id, { status: 'RUNNING' }),
  cancel: (id: string) => update(id, { status: 'CANCELLED' }),
  remove: (id: string) => apiRequest<void>(`/campaigns/${id}`, { method: 'DELETE' }),
};
