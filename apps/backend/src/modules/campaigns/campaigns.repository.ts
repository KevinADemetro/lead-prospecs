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
  city: string;
  state: string;
  categories: string[];
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
    if (!campaign) {
      return null;
    }
    const [record] = await this.toRecords([campaign]);
    return record ?? null;
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
    return this.toRecord(campaign, 0);
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
    return this.toRecords(campaigns);
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

  private async qualifiedCounts(campaignIds: string[]): Promise<Map<string, number>> {
    if (campaignIds.length === 0) {
      return new Map();
    }
    const groups = await this.prisma.lead.groupBy({
      by: ['campaignId'],
      where: {
        campaignId: { in: campaignIds },
        qualificationStatus: 'QUALIFIED',
        ...this.notDeleted(),
      },
      _count: { _all: true },
    });
    return new Map(groups.map((group) => [group.campaignId, group._count._all]));
  }

  private async toRecords(campaigns: CampaignRow[]): Promise<CampaignRecord[]> {
    const qualified = await this.qualifiedCounts(campaigns.map((campaign) => campaign.id));
    return campaigns.map((campaign) => this.toRecord(campaign, qualified.get(campaign.id) ?? 0));
  }

  private toRecord(campaign: CampaignRow, qualifiedLeadCount: number): CampaignRecord {
    const filters = campaignFiltersSchema.safeParse(campaign.filters);
    return {
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      location: campaign.location,
      city: campaign.city,
      state: campaign.state,
      categories: campaign.categories,
      filters: filters.success ? filters.data : {},
      status: campaign.status,
      leadCount: campaign._count.leads,
      qualifiedLeadCount,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      deletedAt: campaign.deletedAt,
      deletedBy: campaign.deletedBy,
    };
  }
}
