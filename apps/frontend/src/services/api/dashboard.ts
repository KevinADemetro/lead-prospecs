import type { DashboardMetrics } from '@app/shared';
import { apiRequest } from './client';

export const dashboardApi = {
  metrics: () => apiRequest<DashboardMetrics>('/dashboard/metrics'),
};
