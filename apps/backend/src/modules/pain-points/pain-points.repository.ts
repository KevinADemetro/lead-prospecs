import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from '../../common/database/base.repository';
import {
  PainPointListFilter,
  PainPointRecord,
  SortDirection,
} from '../../common/database/records';
import { PrismaService } from '../../database/prisma.service';

type PainPointRow = Prisma.PainPointGetPayload<object>;

@Injectable()
export class PainPointsRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<PainPointRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const painPoint = await this.prisma.painPoint.findFirst({
      where: { id, ...this.notDeleted() },
    });
    return painPoint ? this.toRecord(painPoint) : null;
  }

  async findByIdOrFail(id: string): Promise<PainPointRecord> {
    const painPoint = await this.findById(id);
    if (!painPoint) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return painPoint;
  }

  async findByNameIncludingDeleted(name: string): Promise<PainPointRecord | null> {
    const painPoint = await this.prisma.painPoint.findUnique({
      where: { name },
    });
    return painPoint ? this.toRecord(painPoint) : null;
  }

  /** Active pain points keyed by exact name (for campaign auto-qualification). */
  async findActiveByNames(names: string[]): Promise<Map<string, PainPointRecord>> {
    if (names.length === 0) {
      return new Map();
    }
    const painPoints = await this.prisma.painPoint.findMany({
      where: { name: { in: names }, ...this.notDeleted() },
    });
    return new Map(painPoints.map((painPoint) => [painPoint.name, this.toRecord(painPoint)]));
  }

  async countLeadsUsing(painPointId: string): Promise<number> {
    return this.prisma.lead.count({
      where: { painPointId, ...this.notDeleted() },
    });
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    this.assertId(id);
    const result = await this.prisma.painPoint.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy },
    });
    if (result.count === 0) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }

  async restore(id: string): Promise<void> {
    this.assertId(id);
    const result = await this.prisma.painPoint.updateMany({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null, deletedBy: null },
    });
    if (result.count === 0) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }

  async create(data: { name: string; description: string }): Promise<PainPointRecord> {
    const painPoint = await this.prisma.painPoint.create({
      data: { name: data.name, description: data.description },
    });
    return this.toRecord(painPoint);
  }

  async updateById(
    id: string,
    data: Partial<Pick<PainPointRecord, 'name' | 'description'>>,
  ): Promise<PainPointRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const result = await this.prisma.painPoint.updateMany({
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

  count(filter: PainPointListFilter = {}): Promise<number> {
    return this.prisma.painPoint.count({ where: this.buildWhere(filter) });
  }

  async paginate(
    filter: PainPointListFilter,
    page: number,
    limit: number,
    sortField: string,
    order: SortDirection,
  ): Promise<PainPointRecord[]> {
    const painPoints = await this.prisma.painPoint.findMany({
      where: this.buildWhere(filter),
      orderBy: { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
    });
    return painPoints.map((painPoint) => this.toRecord(painPoint));
  }

  private buildWhere(filter: PainPointListFilter): Prisma.PainPointWhereInput {
    return {
      ...this.notDeleted(),
      ...(filter.nameContains
        ? { name: { contains: filter.nameContains, mode: 'insensitive' } }
        : {}),
    };
  }

  private toRecord(painPoint: PainPointRow): PainPointRecord {
    return {
      id: painPoint.id,
      name: painPoint.name,
      description: painPoint.description,
      createdAt: painPoint.createdAt,
      updatedAt: painPoint.updatedAt,
      deletedAt: painPoint.deletedAt,
      deletedBy: painPoint.deletedBy,
    };
  }
}
