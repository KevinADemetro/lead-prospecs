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
  createOutreachSchema,
  CreateOutreachInput,
  entityIdSchema,
  outreachListQuerySchema,
  OutreachListQuery,
  PERMISSIONS,
  updateOutreachSchema,
  UpdateOutreachInput,
} from '@app/shared';
import { OutreachService } from './outreach.service';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/types/auth-context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('outreach')
export class OutreachController {
  constructor(private readonly outreach: OutreachService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.OUTREACH_READ)
  list(@Query(new ZodValidationPipe(outreachListQuerySchema)) query: OutreachListQuery) {
    return this.outreach.list(query);
  }

  @Post('mark-no-reply')
  @RequirePermissions(PERMISSIONS.OUTREACH_UPDATE)
  markNoReply() {
    return this.outreach.markNoReply();
  }

  @Post()
  @RequirePermissions(PERMISSIONS.OUTREACH_CREATE)
  create(@Body(new ZodValidationPipe(createOutreachSchema)) body: CreateOutreachInput) {
    return this.outreach.create(body);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.OUTREACH_READ)
  getById(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.outreach.getById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.OUTREACH_UPDATE)
  update(
    @Param('id', new ZodValidationPipe(entityIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateOutreachSchema)) body: UpdateOutreachInput,
  ) {
    return this.outreach.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.OUTREACH_DELETE)
  async remove(
    @Param('id', new ZodValidationPipe(entityIdSchema)) id: string,
    @CurrentUser() actor: AuthContext,
  ) {
    await this.outreach.softDelete(id, actor);
  }

  @Post(':id/restore')
  @RequirePermissions(PERMISSIONS.OUTREACH_UPDATE)
  restore(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.outreach.restore(id);
  }
}
