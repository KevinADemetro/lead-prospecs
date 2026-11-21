import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CampaignListQuery,
  CreateCampaignInput,
  formatCampaignLocation,
  UpdateCampaignInput,
} from '@app/shared';
import { CampaignsRepository } from './campaigns.repository';
import { AuthContext } from '../../common/types/auth-context';
import { toPublicCampaign } from '../../common/mappers/public.mapper';
import { CampaignListFilter, CampaignRecord } from '../../common/database/records';

const CAMPAIGN_SORT: Record<string, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  name: 'name',
  status: 'status',
};

const CANCELLABLE_STATUSES: CampaignRecord['status'][] = ['DRAFT', 'RUNNING'];
const RUNNABLE_STATUSES: CampaignRecord['status'][] = ['DRAFT', 'FAILED'];

@Injectable()
export class CampaignsService {
  constructor(private readonly campaigns: CampaignsRepository) {}

  async list(query: CampaignListQuery) {
    const filter = this.buildFilter(query);
    const sortField = CAMPAIGN_SORT[query.sort ?? 'createdAt'] ?? 'createdAt';
    const order = query.order === 'asc' ? 'asc' : 'desc';
    const [items, total] = await Promise.all([
      this.campaigns.paginate(filter, query.page, query.limit, sortField, order),
      this.campaigns.count(filter),
    ]);
    return {
      data: items.map(toPublicCampaign),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getById(id: string) {
    const campaign = await this.campaigns.findByIdOrFail(id);
    return toPublicCampaign(campaign);
  }

  async create(input: CreateCampaignInput) {
    const city = input.city ?? '';
    const state = input.state ?? '';
    const campaign = await this.campaigns.create({
      name: input.name,
      description: input.description ?? '',
      location: city ? formatCampaignLocation(city, state) : (input.location ?? ''),
      city,
      state,
      categories: input.categories,
      filters: input.filters,
      status: 'DRAFT',
    });
    return toPublicCampaign(campaign);
  }

  async update(id: string, input: UpdateCampaignInput) {
    const campaign = await this.campaigns.findByIdOrFail(id);
    const { status, ...config } = input;
    if (Object.keys(config).length > 0 && campaign.status !== 'DRAFT') {
      throw new ConflictException('Somente campanhas em rascunho podem ser editadas');
    }
    if (status === 'CANCELLED' && !CANCELLABLE_STATUSES.includes(campaign.status)) {
      throw new ConflictException('Campanha não pode ser cancelada no status atual');
    }
    if (status === 'RUNNING' && !RUNNABLE_STATUSES.includes(campaign.status)) {
      throw new ConflictException('Campanha não pode ser executada no status atual');
    }
    if (config.city !== undefined || config.state !== undefined) {
      const city = config.city ?? campaign.city;
      const state = config.state ?? campaign.state;
      if (!city) {
        throw new BadRequestException('Informe a cidade');
      }
      config.location = formatCampaignLocation(city, state);
    }
    const updated = await this.campaigns.updateById(id, {
      ...config,
      ...(status ? { status } : {}),
    });
    if (!updated) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return toPublicCampaign(updated);
  }

  async softDelete(id: string, actor: AuthContext) {
    const campaign = await this.campaigns.findByIdOrFail(id);
    if (campaign.status === 'RUNNING') {
      throw new ConflictException('Cancele a campanha antes de excluí-la');
    }
    await this.campaigns.softDelete(id, actor.id);
  }

  private buildFilter(query: CampaignListQuery): CampaignListFilter {
    const filter: CampaignListFilter = {};
    if (query.search) {
      filter.nameContains = query.search;
    }
    if (query.status) {
      filter.status = query.status;
    }
    return filter;
  }
}
