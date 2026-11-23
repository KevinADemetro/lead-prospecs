import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UsersRepository } from '../modules/users/users.repository';
import { RolesRepository } from '../modules/roles/roles.repository';
import { RefreshTokensRepository } from '../modules/auth/refresh-tokens.repository';
import { CampaignsRepository } from '../modules/campaigns/campaigns.repository';
import { CompaniesRepository } from '../modules/companies/companies.repository';
import { LeadsRepository } from '../modules/leads/leads.repository';
import { PainPointsRepository } from '../modules/pain-points/pain-points.repository';
import { OutreachRepository } from '../modules/outreach/outreach.repository';
import { DashboardRepository } from '../modules/dashboard/dashboard.repository';

const repositories = [
  UsersRepository,
  RolesRepository,
  RefreshTokensRepository,
  CampaignsRepository,
  CompaniesRepository,
  LeadsRepository,
  PainPointsRepository,
  OutreachRepository,
  DashboardRepository,
];

@Global()
@Module({
  providers: [PrismaService, ...repositories],
  exports: [PrismaService, ...repositories],
})
export class PersistenceModule {}
