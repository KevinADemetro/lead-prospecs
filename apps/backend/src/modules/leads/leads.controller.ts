import { Controller, Get, Param, Query } from '@nestjs/common';
import { entityIdSchema, leadListQuerySchema, LeadListQuery, PERMISSIONS } from '@app/shared';
import { LeadsService } from './leads.service';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.LEADS_READ)
  list(@Query(new ZodValidationPipe(leadListQuerySchema)) query: LeadListQuery) {
    return this.leads.list(query);
  }

  @Get('filter-options')
  @RequirePermissions(PERMISSIONS.LEADS_READ)
  filterOptions() {
    return this.leads.filterOptions();
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.LEADS_READ)
  getById(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.leads.getById(id);
  }
}
