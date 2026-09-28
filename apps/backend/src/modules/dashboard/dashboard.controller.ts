import { Controller, Get } from '@nestjs/common';
import { PERMISSIONS } from '@app/shared';
import { DashboardService } from './dashboard.service';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('metrics')
  @RequirePermissions(PERMISSIONS.CAMPAIGNS_READ, PERMISSIONS.LEADS_READ)
  metrics() {
    return this.dashboard.metrics();
  }
}
