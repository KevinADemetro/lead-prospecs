import { Injectable } from '@nestjs/common';
import { DashboardMetrics } from '@app/shared';
import { CampaignsService } from '../campaigns/campaigns.service';
import { DashboardRepository } from './dashboard.repository';

const RECENT_CAMPAIGNS_LIMIT = 5;

@Injectable()
export class DashboardService {
  constructor(
    private readonly dashboard: DashboardRepository,
    private readonly campaigns: CampaignsService,
  ) {}

  async metrics(): Promise<DashboardMetrics> {
    const [leadMetrics, recent] = await Promise.all([
      this.dashboard.leadMetrics(),
      this.campaigns.list({
        page: 1,
        limit: RECENT_CAMPAIGNS_LIMIT,
        sort: 'createdAt',
        order: 'desc',
      }),
    ]);
    return {
      totalCampaigns: recent.meta.total,
      ...leadMetrics,
      recentCampaigns: recent.data,
    };
  }
}
