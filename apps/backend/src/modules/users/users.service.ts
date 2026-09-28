import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateUserInput,
  SYSTEM_ADMIN_ROLE_NAME,
  UpdateUserInput,
  UserListQuery,
} from '@app/shared';
import { UsersRepository } from './users.repository';
import { RolesRepository } from '../roles/roles.repository';
import { PasswordService } from '../../common/security/password.service';
import { AuthContext } from '../../common/types/auth-context';
import { actorIsSystemAdmin, canAssignPermissions } from '../../common/security/rbac.util';
import { toPublicUser } from '../../common/mappers/public.mapper';
import { RoleRecord, UserListFilter, UserRecord } from '../../common/database/records';

const USER_SORT: Record<string, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  login: 'login',
  status: 'status',
};

@Injectable()
export class UsersService {
  constructor(
    private readonly users: UsersRepository,
    private readonly roles: RolesRepository,
    private readonly passwords: PasswordService,
  ) {}

  async list(query: UserListQuery) {
    const filter = this.buildFilter(query);
    const sortField = USER_SORT[query.sort ?? 'createdAt'] ?? 'createdAt';
    const order = query.order === 'asc' ? 'asc' : 'desc';
    const [items, total] = await Promise.all([
      this.users.paginate(filter, query.page, query.limit, sortField, order),
      this.users.count(filter),
    ]);
    const roles = await this.roles.findByIds([...new Set(items.flatMap((user) => user.roleIds))]);
    const roleMap = new Map(roles.map((role) => [role.id, role]));
    return {
      data: items.map((user) =>
        toPublicUser(
          user,
          user.roleIds.map((id) => roleMap.get(id)).filter(Boolean) as RoleRecord[],
        ),
      ),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getById(id: string) {
    const user = await this.users.findByIdOrFail(id);
    const roles = await this.roles.findByIds(user.roleIds);
    return toPublicUser(user, roles);
  }

  async create(input: CreateUserInput, actor: AuthContext) {
    await this.assertLoginAvailable(input.login);
    const roles = await this.loadRolesOrFail(input.roleIds);
    this.assertCanAssignRoles(actor, roles);
    const user = await this.users.create({
      login: input.login.toLowerCase(),
      passwordHash: await this.passwords.hash(input.password),
      roleIds: roles.map((role) => role.id),
      status: input.status,
    });
    return toPublicUser(user, roles);
  }

  async update(id: string, input: UpdateUserInput, actor: AuthContext) {
    const user = await this.users.findByIdOrFail(id);
    if (input.login && input.login.toLowerCase() !== user.login) {
      await this.assertLoginAvailable(input.login);
    }

    let roles: RoleRecord[] | undefined;
    if (input.roleIds) {
      roles = await this.loadRolesOrFail(input.roleIds);
      this.assertCanAssignRoles(actor, roles);
    }

    if (input.status === 'inactive' || (input.roleIds && this.wouldLoseAdmin(user, roles))) {
      await this.protectLastAdmin(user, input, roles);
    }
    if (input.status === 'inactive' && user.id === actor.id) {
      throw new ForbiddenException('Não é possível desativar o próprio usuário');
    }

    const updated = await this.users.updateById(id, {
      ...(input.login ? { login: input.login.toLowerCase() } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.roleIds && roles ? { roleIds: roles.map((role) => role.id) } : {}),
      ...(input.password ? { passwordHash: await this.passwords.hash(input.password) } : {}),
    });
    if (!updated) {
      throw new NotFoundException('Recurso não encontrado');
    }
    const nextRoles = roles ?? (await this.roles.findByIds(updated.roleIds));
    return toPublicUser(updated, nextRoles);
  }

  async softDelete(id: string, actor: AuthContext) {
    if (id === actor.id) {
      throw new ForbiddenException('Não é possível excluir o próprio usuário');
    }
    const user = await this.users.findByIdOrFail(id);
    await this.protectLastAdmin(user, { status: 'inactive' });
    await this.users.softDelete(id, actor.id);
  }

  async restore(id: string) {
    await this.users.restore(id);
    return this.getById(id);
  }

  private buildFilter(query: UserListQuery): UserListFilter {
    const login = query.login ?? query.search;
    const filter: UserListFilter = {};
    if (login) {
      filter.loginContains = login;
    }
    if (query.status) {
      filter.status = query.status;
    }
    if (query.createdFrom) {
      filter.createdFrom = query.createdFrom;
    }
    if (query.createdTo) {
      const end = new Date(query.createdTo);
      if (end.getHours() === 0 && end.getMinutes() === 0) {
        end.setHours(23, 59, 59, 999);
      }
      filter.createdTo = end;
    }
    return filter;
  }

  private async assertLoginAvailable(login: string) {
    const existing = await this.users.findByLoginIncludingDeleted(login);
    if (existing) {
      throw new ConflictException('Não foi possível concluir a operação');
    }
  }

  private async loadRolesOrFail(ids: string[]): Promise<RoleRecord[]> {
    const unique = [...new Set(ids)];
    const roles = await this.roles.findByIds(unique);
    if (roles.length !== unique.length) {
      throw new BadRequestException('Papel inválido');
    }
    return roles;
  }

  private assertCanAssignRoles(actor: AuthContext, roles: RoleRecord[]) {
    const permissions = roles.flatMap((role) => role.permissions);
    if (!canAssignPermissions(actor.permissions, permissions)) {
      throw new ForbiddenException('Acesso negado');
    }
    const assignsAdmin = roles.some((role) => role.isSystem && role.name === SYSTEM_ADMIN_ROLE_NAME);
    if (assignsAdmin && !actorIsSystemAdmin(actor)) {
      throw new ForbiddenException('Acesso negado');
    }
  }

  private wouldLoseAdmin(user: UserRecord, nextRoles?: RoleRecord[]): boolean {
    if (!nextRoles) return false;
    const currentlyAdmin = user.roleIds.length > 0;
    return currentlyAdmin && !nextRoles.some((role) => role.name === SYSTEM_ADMIN_ROLE_NAME);
  }

  private async protectLastAdmin(
    user: UserRecord,
    input: UpdateUserInput,
    nextRoles?: RoleRecord[],
  ) {
    const currentRoles = await this.roles.findByIds(user.roleIds);
    const isAdmin = currentRoles.some((role) => role.name === SYSTEM_ADMIN_ROLE_NAME && role.isSystem);
    if (!isAdmin) return;

    const losingAdminRole =
      nextRoles !== undefined && !nextRoles.some((role) => role.name === SYSTEM_ADMIN_ROLE_NAME);
    const deactivating = input.status === 'inactive' && user.status === 'active';
    if (!losingAdminRole && !deactivating) return;

    const adminRole = currentRoles.find((role) => role.name === SYSTEM_ADMIN_ROLE_NAME);
    if (!adminRole) return;
    const remaining = await this.users.countActiveAdmins(adminRole.id, user.id);
    if (remaining < 1) {
      throw new ForbiddenException('Não é possível remover o último administrador');
    }
  }
}
