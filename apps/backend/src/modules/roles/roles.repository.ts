import { Injectable, NotFoundException } from '@nestjs/common';
import { Permission } from '@app/shared';
import { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from '../../common/database/base.repository';
import { RoleListFilter, RoleRecord, SortDirection } from '../../common/database/records';
import { asPermissions } from '../../database/seed-admin';
import { PrismaService } from '../../database/prisma.service';

type RoleRow = Prisma.RoleGetPayload<object>;

@Injectable()
export class RolesRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<RoleRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const role = await this.prisma.role.findFirst({
      where: { id, ...this.notDeleted() },
    });
    return role ? this.toRecord(role) : null;
  }

  async findByIdOrFail(id: string): Promise<RoleRecord> {
    const role = await this.findById(id);
    if (!role) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return role;
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    this.assertId(id);
    const result = await this.prisma.role.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy },
    });
    if (result.count === 0) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }

  async restore(id: string): Promise<void> {
    this.assertId(id);
    const result = await this.prisma.role.updateMany({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null, deletedBy: null },
    });
    if (result.count === 0) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }

  async find(filter: RoleListFilter = {}): Promise<RoleRecord[]> {
    const roles = await this.prisma.role.findMany({
      where: this.buildWhere(filter),
    });
    return roles.map((role) => this.toRecord(role));
  }

  async findByName(name: string): Promise<RoleRecord | null> {
    const role = await this.prisma.role.findFirst({
      where: { name: name.toLowerCase(), ...this.notDeleted() },
    });
    return role ? this.toRecord(role) : null;
  }

  async findByNameIncludingDeleted(name: string): Promise<RoleRecord | null> {
    const role = await this.prisma.role.findUnique({
      where: { name: name.toLowerCase() },
    });
    return role ? this.toRecord(role) : null;
  }

  async findByIds(ids: string[]): Promise<RoleRecord[]> {
    const unique = [...new Set(ids.filter((id) => this.isUsableId(id)))];
    if (unique.length === 0) {
      return [];
    }
    const roles = await this.prisma.role.findMany({
      where: { id: { in: unique }, ...this.notDeleted() },
    });
    return roles.map((role) => this.toRecord(role));
  }

  async create(data: {
    name: string;
    description: string;
    permissions: Permission[];
    isSystem: boolean;
  }): Promise<RoleRecord> {
    const role = await this.prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: data.permissions,
        isSystem: data.isSystem,
      },
    });
    return this.toRecord(role);
  }

  async updateById(
    id: string,
    data: Partial<Pick<RoleRecord, 'name' | 'description' | 'permissions' | 'isSystem'>>,
  ): Promise<RoleRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const result = await this.prisma.role.updateMany({
      where: { id, ...this.notDeleted() },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.permissions !== undefined ? { permissions: data.permissions } : {}),
        ...(data.isSystem !== undefined ? { isSystem: data.isSystem } : {}),
      },
    });
    if (result.count === 0) {
      return null;
    }
    return this.findById(id);
  }

  count(filter: RoleListFilter = {}): Promise<number> {
    return this.prisma.role.count({ where: this.buildWhere(filter) });
  }

  async paginate(
    filter: RoleListFilter,
    page: number,
    limit: number,
    sortField: string,
    order: SortDirection,
  ): Promise<RoleRecord[]> {
    const roles = await this.prisma.role.findMany({
      where: this.buildWhere(filter),
      orderBy: { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
    });
    return roles.map((role) => this.toRecord(role));
  }

  private buildWhere(filter: RoleListFilter): Prisma.RoleWhereInput {
    return {
      ...this.notDeleted(),
      ...(filter.nameContains
        ? { name: { contains: filter.nameContains, mode: 'insensitive' } }
        : {}),
    };
  }

  private toRecord(role: RoleRow): RoleRecord {
    return {
      id: role.id,
      name: role.name,
      description: role.description,
      permissions: asPermissions(role.permissions),
      isSystem: role.isSystem,
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
      deletedAt: role.deletedAt,
      deletedBy: role.deletedBy,
    };
  }
}
