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
  createUserSchema,
  entityIdSchema,
  PERMISSIONS,
  updateUserSchema,
  userListQuerySchema,
  CreateUserInput,
  UpdateUserInput,
  UserListQuery,
} from '@app/shared';
import { UsersService } from './users.service';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthContext } from '../../common/types/auth-context';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermissions(PERMISSIONS.USERS_READ)
  list(@Query(new ZodValidationPipe(userListQuerySchema)) query: UserListQuery) {
    return this.users.list(query);
  }

  @Post()
  @RequirePermissions(PERMISSIONS.USERS_CREATE)
  create(
    @Body(new ZodValidationPipe(createUserSchema)) body: CreateUserInput,
    @CurrentUser() actor: AuthContext,
  ) {
    return this.users.create(body, actor);
  }

  @Get(':id')
  @RequirePermissions(PERMISSIONS.USERS_READ)
  getById(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.users.getById(id);
  }

  @Patch(':id')
  @RequirePermissions(PERMISSIONS.USERS_UPDATE)
  update(
    @Param('id', new ZodValidationPipe(entityIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateUserSchema)) body: UpdateUserInput,
    @CurrentUser() actor: AuthContext,
  ) {
    return this.users.update(id, body, actor);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(PERMISSIONS.USERS_DELETE)
  async remove(
    @Param('id', new ZodValidationPipe(entityIdSchema)) id: string,
    @CurrentUser() actor: AuthContext,
  ) {
    await this.users.softDelete(id, actor);
  }

  @Post(':id/restore')
  @RequirePermissions(PERMISSIONS.USERS_UPDATE)
  restore(@Param('id', new ZodValidationPipe(entityIdSchema)) id: string) {
    return this.users.restore(id);
  }
}
