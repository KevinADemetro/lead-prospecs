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
  createDorSchema,
  CreateDorInput,
  dorListQuerySchema,
  DorListQuery,
  entityIdSchema,
  PERMISSIONS,
  updateDorSchema,
  UpdateDorInput,
} from '@app/shared';
import { DoresService } from './dores.service';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/types/auth-context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('dores')
export class DoresController {
  constructor(private readonly dores: DoresService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.DORES_READ)
  list(@Query(new ZodValidationPipe(dorListQuerySchema)) query: DorListQuery) {
    return this.dores.list(query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.DORES_CREATE)
  create(@Body(new ZodValidationPipe(createDorSchema)) body: CreateDorInput) {
    return this.dores.create(body);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.DORES_READ)
  getById(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.dores.getById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.DORES_UPDATE)
  update(
    @Param('id', new ZodValidationPipe(entityIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateDorSchema)) body: UpdateDorInput,
  ) {
    return this.dores.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.DORES_DELETE)
  async remove(
    @Param('id', new ZodValidationPipe(entityIdSchema)) id: string,
    @CurrentUser() actor: AuthContext,
  ) {
    await this.dores.softDelete(id, actor);
  }

  @Post(':id/restore')
  @RequirePermissions(PERMISSIONS.DORES_UPDATE)
  restore(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.dores.restore(id);
  }
}
