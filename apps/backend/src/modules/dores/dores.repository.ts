import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from '../../common/database/base.repository';
import { DorListFilter, DorRecord, SortDirection } from '../../common/database/records';
import { PrismaService } from '../../database/prisma.service';

type DorRow = Prisma.DorGetPayload<object>;

@Injectable()
export class DoresRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<DorRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const dor = await this.prisma.dor.findFirst({
      where: { id, ...this.notDeleted() },
    });
    return dor ? this.toRecord(dor) : null;
  }

  async findByIdOrFail(id: string): Promise<DorRecord> {
    const dor = await this.findById(id);
    if (!dor) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return dor;
  }

  async findByNameIncludingDeleted(name: string): Promise<DorRecord | null> {
    const dor = await this.prisma.dor.findUnique({
      where: { name },
    });
    return dor ? this.toRecord(dor) : null;
  }

  async countLeadsUsing(dorId: string): Promise<number> {
    return this.prisma.lead.count({
      where: { dorId, ...this.notDeleted() },
    });
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    this.assertId(id);
    const result = await this.prisma.dor.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy },
    });
    if (result.count === 0) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }

  async restore(id: string): Promise<void> {
    this.assertId(id);
    const result = await this.prisma.dor.updateMany({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null, deletedBy: null },
    });
    if (result.count === 0) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }

  async create(data: { name: string; description: string }): Promise<DorRecord> {
    const dor = await this.prisma.dor.create({
      data: { name: data.name, description: data.description },
    });
    return this.toRecord(dor);
  }

  async updateById(
    id: string,
    data: Partial<Pick<DorRecord, 'name' | 'description'>>,
  ): Promise<DorRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const result = await this.prisma.dor.updateMany({
      where: { id, ...this.notDeleted() },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
      },
    });
    if (result.count === 0) {
      return null;
    }
    return this.findById(id);
  }

  count(filter: DorListFilter = {}): Promise<number> {
    return this.prisma.dor.count({ where: this.buildWhere(filter) });
  }

  async paginate(
    filter: DorListFilter,
    page: number,
    limit: number,
    sortField: string,
    order: SortDirection,
  ): Promise<DorRecord[]> {
    const dores = await this.prisma.dor.findMany({
      where: this.buildWhere(filter),
      orderBy: { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
    });
    return dores.map((dor) => this.toRecord(dor));
  }

  private buildWhere(filter: DorListFilter): Prisma.DorWhereInput {
    return {
      ...this.notDeleted(),
      ...(filter.nameContains
        ? { name: { contains: filter.nameContains, mode: 'insensitive' } }
        : {}),
    };
  }

  private toRecord(dor: DorRow): DorRecord {
    return {
      id: dor.id,
      name: dor.name,
      description: dor.description,
      createdAt: dor.createdAt,
      updatedAt: dor.updatedAt,
      deletedAt: dor.deletedAt,
      deletedBy: dor.deletedBy,
    };
  }
}
