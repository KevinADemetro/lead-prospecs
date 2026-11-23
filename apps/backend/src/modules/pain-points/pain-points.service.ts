import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreatePainPointInput,
  PainPointListQuery,
  UpdatePainPointInput,
} from '@app/shared';
import { PainPointsRepository } from './pain-points.repository';
import { AuthContext } from '../../common/types/auth-context';
import { toPublicPainPoint } from '../../common/mappers/public.mapper';
import { PainPointListFilter } from '../../common/database/records';

const PAIN_POINT_SORT: Record<string, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  name: 'name',
};

@Injectable()
export class PainPointsService {
  constructor(private readonly painPoints: PainPointsRepository) {}

  async list(query: PainPointListQuery) {
    const filter = this.buildFilter(query);
    const sortField = PAIN_POINT_SORT[query.sort ?? 'name'] ?? 'name';
    const order = query.order === 'asc' ? 'asc' : 'desc';
    const [items, total] = await Promise.all([
      this.painPoints.paginate(filter, query.page, query.limit, sortField, order),
      this.painPoints.count(filter),
    ]);
    return {
      data: items.map(toPublicPainPoint),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getById(id: string) {
    const painPoint = await this.painPoints.findByIdOrFail(id);
    return toPublicPainPoint(painPoint);
  }

  async create(input: CreatePainPointInput) {
    await this.assertNameAvailable(input.name);
    const painPoint = await this.painPoints.create({
      name: input.name,
      description: input.description ?? '',
    });
    return toPublicPainPoint(painPoint);
  }

  async update(id: string, input: UpdatePainPointInput) {
    const painPoint = await this.painPoints.findByIdOrFail(id);
    if (input.name && input.name !== painPoint.name) {
      await this.assertNameAvailable(input.name);
    }
    const updated = await this.painPoints.updateById(id, {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    });
    if (!updated) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return toPublicPainPoint(updated);
  }

  async softDelete(id: string, actor: AuthContext) {
    await this.painPoints.findByIdOrFail(id);
    const inUse = await this.painPoints.countLeadsUsing(id);
    if (inUse > 0) {
      throw new ForbiddenException('Dor em uso por leads');
    }
    await this.painPoints.softDelete(id, actor.id);
  }

  async restore(id: string) {
    await this.painPoints.restore(id);
    return this.getById(id);
  }

  private buildFilter(query: PainPointListQuery): PainPointListFilter {
    const filter: PainPointListFilter = {};
    if (query.search) {
      filter.nameContains = query.search;
    }
    return filter;
  }

  private async assertNameAvailable(name: string) {
    const existing = await this.painPoints.findByNameIncludingDeleted(name);
    if (existing) {
      throw new ConflictException('Não foi possível concluir a operação');
    }
  }
}
