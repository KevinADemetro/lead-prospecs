import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateRoleInput,
  Permission,
  SYSTEM_ADMIN_ROLE_NAME,
  UpdateRoleInput,
  RoleListQuery,
} from '@app/shared';
import { RolesRepository } from './roles.repository';
import { UsersRepository } from '../users/users.repository';
import { AuthContext } from '../../common/types/auth-context';
import { actorIsSystemAdmin, canAssignPermissions } from '../../common/security/rbac.util';
import { toPublicRole } from '../../common/mappers/public.mapper';
import { RoleListFilter } from '../../common/database/records';

const ROLE_SORT: Record<string, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  name: 'name',
};

@Injectable()
export class RolesService {
  constructor(
    private readonly roles: RolesRepository,
    private readonly users: UsersRepository,
  ) {}

  async list(query: RoleListQuery) {
    const filter = this.buildFilter(query);
    const sortField = ROLE_SORT[query.sort ?? 'createdAt'] ?? 'createdAt';
    const order = query.order === 'asc' ? 'asc' : 'desc';
    const [items, total] = await Promise.all([
      this.roles.paginate(filter, query.page, query.limit, sortField, order),
      this.roles.count(filter),
    ]);
    return {
      data: items.map(toPublicRole),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getById(id: string) {
    const role = await this.roles.findByIdOrFail(id);
    return toPublicRole(role);
  }

  async create(input: CreateRoleInput, actor: AuthContext) {
    this.assertCanSetPermissions(actor, input.permissions as Permission[]);
    await this.assertNameAvailable(input.name);
    const role = await this.roles.create({
      name: input.name.toLowerCase(),
      description: input.description ?? '',
      permissions: input.permissions as Permission[],
      isSystem: false,
    });
    return toPublicRole(role);
  }

  async update(id: string, input: UpdateRoleInput, actor: AuthContext) {
    const role = await this.roles.findByIdOrFail(id);
    if (role.isSystem && role.name === SYSTEM_ADMIN_ROLE_NAME) {
      if (input.name && input.name.toLowerCase() !== role.name) {
        throw new ForbiddenException('Não é possível alterar o nome do papel de sistema');
      }
      if (input.permissions && !actorIsSystemAdmin(actor)) {
        throw new ForbiddenException('Acesso negado');
      }
    }
    if (input.permissions) {
      this.assertCanSetPermissions(actor, input.permissions as Permission[]);
    }
    if (input.name && input.name.toLowerCase() !== role.name) {
      await this.assertNameAvailable(input.name);
    }
    const updated = await this.roles.updateById(id, {
      ...(input.name ? { name: input.name.toLowerCase() } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.permissions ? { permissions: input.permissions as Permission[] } : {}),
    });
    if (!updated) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return toPublicRole(updated);
  }

  async softDelete(id: string, actor: AuthContext) {
    const role = await this.roles.findByIdOrFail(id);
    if (role.isSystem) {
      throw new ForbiddenException('Não é possível excluir um papel de sistema');
    }
    const inUse = await this.users.countByRoleId(role.id);
    if (inUse > 0) {
      throw new ForbiddenException('Papel em uso por usuários');
    }
    await this.roles.softDelete(id, actor.id);
  }

  async restore(id: string) {
    await this.roles.restore(id);
    return this.getById(id);
  }

  private buildFilter(query: RoleListQuery): RoleListFilter {
    const filter: RoleListFilter = {};
    if (query.search) {
      filter.nameContains = query.search;
    }
    return filter;
  }

  private assertCanSetPermissions(actor: AuthContext, permissions: AuthContext['permissions']) {
    if (!canAssignPermissions(actor.permissions, permissions)) {
      throw new ForbiddenException('Acesso negado');
    }
  }

  private async assertNameAvailable(name: string) {
    const existing = await this.roles.findByNameIncludingDeleted(name);
    if (existing) {
      throw new ConflictException('Não foi possível concluir a operação');
    }
  }
}
