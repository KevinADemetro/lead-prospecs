import { Injectable, NotFoundException } from '@nestjs/common';
import { CampaignFilters, CampaignStatus, campaignFiltersSchema } from '@app/shared';
import { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from '../../common/database/base.repository';
import { CampaignListFilter, CampaignRecord, SortDirection } from '../../common/database/records';
import { PrismaService } from '../../database/prisma.service';

const campaignWithLeadCount = {
  _count: { select: { leads: { where: { deletedAt: null } } } },
} as const;
type CampaignRow = Prisma.CampaignGetPayload<{ include: typeof campaignWithLeadCount }>;

export type CampaignWriteData = {
  name: string;
  description: string;
  location: string;
  categories: string[];
  searchTerms: string[];
  filters: CampaignFilters;
  status: CampaignStatus;
};

@Injectable()
export class CampaignsRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<CampaignRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const campaign = await this.prisma.campaign.findFirst({
      where: { id, ...this.notDeleted() },
      include: campaignWithLeadCount,
    });
    return campaign ? this.toRecord(campaign) : null;
  }

  async findByIdOrFail(id: string): Promise<CampaignRecord> {
    const campaign = await this.findById(id);
    if (!campaign) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return campaign;
  }

  async create(data: CampaignWriteData): Promise<CampaignRecord> {
    const campaign = await this.prisma.campaign.create({
      data: { ...data, filters: data.filters as Prisma.InputJsonObject },
      include: campaignWithLeadCount,
    });
    return this.toRecord(campaign);
  }

  async updateById(id: string, data: Partial<CampaignWriteData>): Promise<CampaignRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const { filters, ...scalar } = data;
    const result = await this.prisma.campaign.updateMany({
      where: { id, ...this.notDeleted() },
      data: {
        ...scalar,
        ...(filters !== undefined ? { filters: filters as Prisma.InputJsonObject } : {}),
      },
    });
    if (result.count === 0) {
      return null;
    }
    return this.findById(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    this.assertId(id);
    const result = await this.prisma.campaign.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy },
    });
    if (result.count === 0) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }

  count(filter: CampaignListFilter = {}): Promise<number> {
    return this.prisma.campaign.count({ where: this.buildWhere(filter) });
  }

  async paginate(
    filter: CampaignListFilter,
    page: number,
    limit: number,
    sortField: string,
    order: SortDirection,
  ): Promise<CampaignRecord[]> {
    const campaigns = await this.prisma.campaign.findMany({
      where: this.buildWhere(filter),
      include: campaignWithLeadCount,
      orderBy: { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
    });
    return campaigns.map((campaign) => this.toRecord(campaign));
  }

  private buildWhere(filter: CampaignListFilter): Prisma.CampaignWhereInput {
    return {
      ...this.notDeleted(),
      ...(filter.nameContains
        ? { name: { contains: filter.nameContains, mode: 'insensitive' } }
        : {}),
      ...(filter.status ? { status: filter.status } : {}),
    };
  }

  private toRecord(campaign: CampaignRow): CampaignRecord {
    const filters = campaignFiltersSchema.safeParse(campaign.filters);
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      location: campaign.location,
      categories: campaign.categories,
      searchTerms: campaign.searchTerms,
      filters: filters.success ? filters.data : {},
      status: campaign.status,
      leadCount: campaign._count.leads,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      deletedAt: campaign.deletedAt,
      deletedBy: campaign.deletedBy,
    };
  }
}
