import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from '../../common/database/base.repository';
import { LeadListFilter, LeadRecord, SortDirection } from '../../common/database/records';
import { PrismaService } from '../../database/prisma.service';

const leadWithRelations = {
  company: {
    select: {
      id: true,
      name: true,
      category: true,
      phone: true,
      website: true,
      city: true,
      state: true,
    },
  },
  campaign: { select: { id: true, name: true, status: true } },
} as const;
type LeadRow = Prisma.LeadGetPayload<{ include: typeof leadWithRelations }>;

const visibleRelations = {
  campaign: { deletedAt: null },
  company: { deletedAt: null },
} as const;

@Injectable()
export class LeadsRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<LeadRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const lead = await this.prisma.lead.findFirst({
      where: { id, ...this.notDeleted(), ...visibleRelations },
      include: leadWithRelations,
    });
    return lead ? this.toRecord(lead) : null;
  }

  async findByIdOrFail(id: string): Promise<LeadRecord> {
    const lead = await this.findById(id);
    if (!lead) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return lead;
  }

  /** A company appears at most once per campaign; re-adding restores a soft-deleted lead. */
  async upsertForCampaign(campaignId: string, companyId: string): Promise<LeadRecord> {
    const lead = await this.prisma.lead.upsert({
      where: { campaignId_companyId: { campaignId, companyId } },
      create: { campaignId, companyId },
      update: { deletedAt: null, deletedBy: null },
      include: leadWithRelations,
    });
    return this.toRecord(lead);
  }

  count(filter: LeadListFilter = {}): Promise<number> {
    return this.prisma.lead.count({ where: this.buildWhere(filter) });
  }

  async paginate(
    filter: LeadListFilter,
    page: number,
    limit: number,
    sortField: string,
    order: SortDirection,
  ): Promise<LeadRecord[]> {
    const leads = await this.prisma.lead.findMany({
      where: this.buildWhere(filter),
      include: leadWithRelations,
      orderBy:
        sortField === 'score'
          ? [{ score: { sort: order, nulls: 'last' } }, { createdAt: 'desc' }]
          : { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
    });
    return leads.map((lead) => this.toRecord(lead));
  }

  private buildWhere(filter: LeadListFilter): Prisma.LeadWhereInput {
    return {
      ...this.notDeleted(),
      campaign: { deletedAt: null },
      company: {
        deletedAt: null,
        ...(filter.companyNameContains
          ? { name: { contains: filter.companyNameContains, mode: 'insensitive' } }
          : {}),
      },
      ...(filter.campaignId ? { campaignId: filter.campaignId } : {}),
      ...(filter.companyId ? { companyId: filter.companyId } : {}),
      ...(filter.qualificationStatus ? { qualificationStatus: filter.qualificationStatus } : {}),
      ...(filter.trelloStatus ? { trelloStatus: filter.trelloStatus } : {}),
    };
  }

  private toRecord(lead: LeadRow): LeadRecord {
    return {
      id: lead.id,
      companyId: lead.companyId,
      campaignId: lead.campaignId,
      websiteStatus: lead.websiteStatus,
      whatsappStatus: lead.whatsappStatus,
      instagramStatus: lead.instagramStatus,
      facebookStatus: lead.facebookStatus,
      score: lead.score,
      scoreReasons: lead.scoreReasons,
      qualificationStatus: lead.qualificationStatus,
      trelloStatus: lead.trelloStatus,
      trelloCardId: lead.trelloCardId,
      trelloCardUrl: lead.trelloCardUrl,
      company: lead.company,
      campaign: lead.campaign,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      deletedAt: lead.deletedAt,
      deletedBy: lead.deletedBy,
    };
  }
}
