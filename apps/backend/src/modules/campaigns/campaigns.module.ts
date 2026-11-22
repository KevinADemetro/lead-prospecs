import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../database/persistence.module';
import { LeadsModule } from '../leads/leads.module';
import { PlacesModule } from '../places/places.module';
import { CampaignRunnerService } from './campaign-runner.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';

@Module({
  imports: [PersistenceModule, PlacesModule, LeadsModule],
  controllers: [CampaignsController],
  providers: [CampaignsService, CampaignRunnerService],
  exports: [CampaignsService],
})
export class CampaignsModule {}
