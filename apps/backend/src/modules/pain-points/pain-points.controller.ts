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
  createPainPointSchema,
  CreatePainPointInput,
  painPointListQuerySchema,
  PainPointListQuery,
  entityIdSchema,
  PERMISSIONS,
  updatePainPointSchema,
  UpdatePainPointInput,
} from '@app/shared';
import { PainPointsService } from './pain-points.service';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/types/auth-context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('pain-points')
export class PainPointsController {
  constructor(private readonly painPoints: PainPointsService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.PAIN_POINTS_READ)
  list(@Query(new ZodValidationPipe(painPointListQuerySchema)) query: PainPointListQuery) {
    return this.painPoints.list(query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.PAIN_POINTS_CREATE)
  create(@Body(new ZodValidationPipe(createPainPointSchema)) body: CreatePainPointInput) {
    return this.painPoints.create(body);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.PAIN_POINTS_READ)
  getById(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.painPoints.getById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.PAIN_POINTS_UPDATE)
  update(
    @Param('id', new ZodValidationPipe(entityIdSchema)) id: string,
    @Body(new ZodValidationPipe(updatePainPointSchema)) body: UpdatePainPointInput,
  ) {
    return this.painPoints.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.PAIN_POINTS_DELETE)
  async remove(
    @Param('id', new ZodValidationPipe(entityIdSchema)) id: string,
    @CurrentUser() actor: AuthContext,
  ) {
    await this.painPoints.softDelete(id, actor);
  }

  @Post(':id/restore')
  @RequirePermissions(PERMISSIONS.PAIN_POINTS_UPDATE)
  restore(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.painPoints.restore(id);
  }
}
