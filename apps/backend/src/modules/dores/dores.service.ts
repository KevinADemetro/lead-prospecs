import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateDorInput, DorListQuery, UpdateDorInput } from '@app/shared';
import { DoresRepository } from './dores.repository';
import { AuthContext } from '../../common/types/auth-context';
import { toPublicDor } from '../../common/mappers/public.mapper';
import { DorListFilter } from '../../common/database/records';

const DOR_SORT: Record<string, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  name: 'name',
};

@Injectable()
export class DoresService {
  constructor(private readonly dores: DoresRepository) {}

  async list(query: DorListQuery) {
    const filter = this.buildFilter(query);
    const sortField = DOR_SORT[query.sort ?? 'name'] ?? 'name';
    const order = query.order === 'asc' ? 'asc' : 'desc';
    const [items, total] = await Promise.all([
      this.dores.paginate(filter, query.page, query.limit, sortField, order),
      this.dores.count(filter),
    ]);
    return {
      data: items.map(toPublicDor),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getById(id: string) {
    const dor = await this.dores.findByIdOrFail(id);
    return toPublicDor(dor);
  }

  async create(input: CreateDorInput) {
    await this.assertNameAvailable(input.name);
    const dor = await this.dores.create({
      name: input.name,
      description: input.description ?? '',
    });
    return toPublicDor(dor);
  }

  async update(id: string, input: UpdateDorInput) {
    const dor = await this.dores.findByIdOrFail(id);
    if (input.name && input.name !== dor.name) {
      await this.assertNameAvailable(input.name);
    }
    const updated = await this.dores.updateById(id, {
      ...(input.name ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    });
    if (!updated) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return toPublicDor(updated);
  }

  async softDelete(id: string, actor: AuthContext) {
    await this.dores.findByIdOrFail(id);
    const inUse = await this.dores.countLeadsUsing(id);
    if (inUse > 0) {
      throw new ForbiddenException('Dor em uso por leads');
    }
    await this.dores.softDelete(id, actor.id);
  }

  async restore(id: string) {
    await this.dores.restore(id);
    return this.getById(id);
  }

  private buildFilter(query: DorListQuery): DorListFilter {
    const filter: DorListFilter = {};
    if (query.search) {
      filter.nameContains = query.search;
    }
    return filter;
  }

  private async assertNameAvailable(name: string) {
    const existing = await this.dores.findByNameIncludingDeleted(name);
    if (existing) {
      throw new ConflictException('Não foi possível concluir a operação');
    }
  }
}
