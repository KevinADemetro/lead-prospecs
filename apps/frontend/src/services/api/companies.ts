import type { PublicCompanyDetail } from '@app/shared';
import { apiRequest } from './client';

export const companiesApi = {
  get: (id: string) => apiRequest<PublicCompanyDetail>(`/companies/${id}`),
};
