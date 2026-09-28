import { Controller, Get, Param } from '@nestjs/common';
import { entityIdSchema, PERMISSIONS } from '@app/shared';
import { CompaniesService } from './companies.service';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companies: CompaniesService) {}

  @Get(':id')
  @RequirePermissions(PERMISSIONS.COMPANIES_READ)
  getById(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.companies.getById(id);
  }
}
