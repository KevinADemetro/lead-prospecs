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
  createRoleSchema,
  entityIdSchema,
  PERMISSIONS,
  updateRoleSchema,
  roleListQuerySchema,
  CreateRoleInput,
  UpdateRoleInput,
  RoleListQuery,
} from '@app/shared';
import { RolesService } from './roles.service';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/types/auth-context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('roles')
export class RolesController {
  constructor(private readonly roles: RolesService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  list(@Query(new ZodValidationPipe(roleListQuerySchema)) query: RoleListQuery) {
    return this.roles.list(query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.ROLES_CREATE)
  create(
    @Body(new ZodValidationPipe(createRoleSchema)) body: CreateRoleInput,
    @CurrentUser() actor: AuthContext,
  ) {
    return this.roles.create(body, actor);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.ROLES_READ)
  getById(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.roles.getById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.ROLES_UPDATE)
  update(
    @Param('id', new ZodValidationPipe(entityIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateRoleSchema)) body: UpdateRoleInput,
    @CurrentUser() actor: AuthContext,
  ) {
    return this.roles.update(id, body, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.ROLES_DELETE)
  async remove(
    @Param('id', new ZodValidationPipe(entityIdSchema)) id: string,
    @CurrentUser() actor: AuthContext,
  ) {
    await this.roles.softDelete(id, actor);
  }

  @Post(':id/restore')
  @RequirePermissions(PERMISSIONS.ROLES_UPDATE)
  restore(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.roles.restore(id);
  }
}
