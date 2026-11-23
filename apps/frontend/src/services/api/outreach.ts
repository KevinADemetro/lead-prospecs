import type {
  CreateOutreachInput,
  MarkNoReplyResult,
  OutreachListQuery,
  PaginatedResult,
  PublicOutreach,
  UpdateOutreachInput,
} from '@app/shared';
import { apiRequest } from './client';
import { toQuery } from '@/lib/query';

export const outreachApi = {
  list: (query: OutreachListQuery) =>
    apiRequest<PaginatedResult<PublicOutreach>>(`/outreach${toQuery(query)}`),
  get: (id: string) => apiRequest<PublicOutreach>(`/outreach/${id}`),
  create: (input: CreateOutreachInput) =>
    apiRequest<PublicOutreach>('/outreach', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: UpdateOutreachInput) =>
    apiRequest<PublicOutreach>(`/outreach/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  remove: (id: string) => apiRequest<void>(`/outreach/${id}`, { method: 'DELETE' }),
  markNoReply: () =>
    apiRequest<MarkNoReplyResult>('/outreach/mark-no-reply', { method: 'POST' }),
};
