import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../database/persistence.module';
import { CampaignsModule } from '../campaigns/campaigns.module';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [PersistenceModule, CampaignsModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
