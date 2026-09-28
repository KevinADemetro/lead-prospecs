import { Module } from '@nestjs/common';
import { PersistenceModule } from '../../database/persistence.module';
import { CompaniesModule } from '../companies/companies.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [PersistenceModule, CompaniesModule],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
