import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UsersRepository } from '../modules/users/users.repository';
import { RolesRepository } from '../modules/roles/roles.repository';
import { RefreshTokensRepository } from '../modules/auth/refresh-tokens.repository';
import { CampaignsRepository } from '../modules/campaigns/campaigns.repository';
import { CompaniesRepository } from '../modules/companies/companies.repository';
import { LeadsRepository } from '../modules/leads/leads.repository';

const repositories = [
  UsersRepository,
  RolesRepository,
  RefreshTokensRepository,
  CampaignsRepository,
  CompaniesRepository,
  LeadsRepository,
];

@Global()
@Module({
  providers: [PrismaService, ...repositories],
  exports: [PrismaService, ...repositories],
})
export class PersistenceModule {}
