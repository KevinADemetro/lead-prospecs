import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  campaignListQuerySchema,
  createCampaignSchema,
  entityIdSchema,
  PERMISSIONS,
  updateCampaignSchema,
  CampaignListQuery,
  CreateCampaignInput,
  UpdateCampaignInput,
} from '@app/shared';
import { CampaignsService } from './campaigns.service';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/types/auth-context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.CAMPAIGNS_READ)
  list(@Query(new ZodValidationPipe(campaignListQuerySchema)) query: CampaignListQuery) {
    return this.campaigns.list(query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.CAMPAIGNS_CREATE)
  create(@Body(new ZodValidationPipe(createCampaignSchema)) body: CreateCampaignInput) {
    return this.campaigns.create(body);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.CAMPAIGNS_READ)
  getById(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.campaigns.getById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.CAMPAIGNS_UPDATE)
  update(
    @Param('id', new ZodValidationPipe(entityIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateCampaignSchema)) body: UpdateCampaignInput,
  ) {
    return this.campaigns.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.CAMPAIGNS_DELETE)
  async remove(
    @Param('id', new ZodValidationPipe(entityIdSchema)) id: string,
    @CurrentUser() actor: AuthContext,
  ) {
    await this.campaigns.softDelete(id, actor);
  }
}
