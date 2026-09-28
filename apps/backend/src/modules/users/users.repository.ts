import { Injectable, NotFoundException } from '@nestjs/common';
import { UserStatus } from '@app/shared';
import { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from '../../common/database/base.repository';
import { SortDirection, UserListFilter, UserRecord } from '../../common/database/records';
import { PrismaService } from '../../database/prisma.service';

const userWithRoles = { roles: true } as const;
type UserRow = Prisma.UserGetPayload<{ include: typeof userWithRoles }>;

@Injectable()
export class UsersRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<UserRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const user = await this.prisma.user.findFirst({
      where: { id, ...this.notDeleted() },
      include: userWithRoles,
    });
    return user ? this.toRecord(user) : null;
  }

  async findByIdOrFail(id: string): Promise<UserRecord> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return user;
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    this.assertId(id);
    const result = await this.prisma.user.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy },
    });
    if (result.count === 0) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }

  async restore(id: string): Promise<void> {
    this.assertId(id);
    const result = await this.prisma.user.updateMany({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null, deletedBy: null },
    });
    if (result.count === 0) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }

  async create(data: {
    login: string;
    passwordHash: string;
    roleIds: string[];
    status: UserStatus;
  }): Promise<UserRecord> {
    const user = await this.prisma.user.create({
      data: {
        login: data.login,
        passwordHash: data.passwordHash,
        status: data.status,
        roles: { create: data.roleIds.map((roleId) => ({ roleId })) },
      },
      include: userWithRoles,
    });
    return this.toRecord(user);
  }

  async findByLoginForAuth(login: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findFirst({
      where: { login: login.toLowerCase(), ...this.notDeleted() },
      include: userWithRoles,
    });
    return user ? this.toRecord(user, true) : null;
  }

  async findByIdForAuth(id: string): Promise<UserRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const user = await this.prisma.user.findFirst({
      where: { id, ...this.notDeleted() },
      include: userWithRoles,
    });
    return user ? this.toRecord(user, true) : null;
  }

  async findByLogin(login: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findFirst({
      where: { login: login.toLowerCase(), ...this.notDeleted() },
      include: userWithRoles,
    });
    return user ? this.toRecord(user) : null;
  }

  async findByLoginIncludingDeleted(login: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({
      where: { login: login.toLowerCase() },
      include: userWithRoles,
    });
    return user ? this.toRecord(user) : null;
  }

  async updateById(
    id: string,
    data: {
      login?: string;
      passwordHash?: string;
      status?: UserStatus;
      roleIds?: string[];
      failedLoginAttempts?: number;
      lockedUntil?: Date | null;
    },
  ): Promise<UserRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const { roleIds, ...scalar } = data;
    const updated = await this.prisma.$transaction(async (tx) => {
      const match = await tx.user.findFirst({
        where: { id, ...this.notDeleted() },
        select: { id: true },
      });
      if (!match) {
        return null;
      }
      if (roleIds) {
        await tx.userRole.deleteMany({ where: { userId: id } });
        await tx.userRole.createMany({
          data: roleIds.map((roleId) => ({ userId: id, roleId })),
        });
      }
      return tx.user.update({
        where: { id },
        data: scalar,
        include: userWithRoles,
      });
    });
    return updated ? this.toRecord(updated) : null;
  }

  count(filter: UserListFilter): Promise<number> {
    return this.prisma.user.count({ where: this.buildWhere(filter) });
  }

  async paginate(
    filter: UserListFilter,
    page: number,
    limit: number,
    sortField: string,
    order: SortDirection,
  ): Promise<UserRecord[]> {
    const users = await this.prisma.user.findMany({
      where: this.buildWhere(filter),
      include: userWithRoles,
      orderBy: { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
    });
    return users.map((user) => this.toRecord(user));
  }

  countActiveAdmins(adminRoleId: string, excludeUserId?: string): Promise<number> {
    return this.prisma.user.count({
      where: {
        ...this.notDeleted(),
        status: 'active',
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
        roles: { some: { roleId: adminRoleId } },
      },
    });
  }

  countByRoleId(roleId: string): Promise<number> {
    return this.prisma.user.count({
      where: {
        ...this.notDeleted(),
        roles: { some: { roleId } },
      },
    });
  }

  private buildWhere(filter: UserListFilter): Prisma.UserWhereInput {
    const createdAt: Prisma.DateTimeFilter = {};
    if (filter.createdFrom) {
      createdAt.gte = filter.createdFrom;
    }
    if (filter.createdTo) {
      createdAt.lte = filter.createdTo;
    }
    return {
      ...this.notDeleted(),
      ...(filter.loginContains
        ? { login: { contains: filter.loginContains, mode: 'insensitive' } }
        : {}),
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.createdFrom || filter.createdTo ? { createdAt } : {}),
    };
  }

  private toRecord(user: UserRow, includeSecrets = false): UserRecord {
    const record: UserRecord = {
      id: user.id,
      login: user.login,
      status: user.status,
      roleIds: user.roles.map((item) => item.roleId),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      deletedAt: user.deletedAt,
      deletedBy: user.deletedBy,
    };
    if (includeSecrets) {
      record.passwordHash = user.passwordHash;
      record.failedLoginAttempts = user.failedLoginAttempts;
      record.lockedUntil = user.lockedUntil;
    }
    return record;
  }
}
