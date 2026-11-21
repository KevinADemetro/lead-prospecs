import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadSortField } from '@app/shared';
import { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from '../../common/database/base.repository';
import {
  LeadDetailRecord,
  LeadFilterOptionsRecord,
  LeadListFilter,
  LeadRecord,
  SortDirection,
} from '../../common/database/records';
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

const leadWithDetail = {
  company: true,
  campaign: { select: { id: true, name: true, status: true } },
} as const;
type LeadDetailRow = Prisma.LeadGetPayload<{ include: typeof leadWithDetail }>;

const visibleRelations = {
  campaign: { deletedAt: null },
  company: { deletedAt: null },
} as const;

const FILTER_OPTIONS_LIMIT = 500;

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

  async findDetailByIdOrFail(id: string): Promise<LeadDetailRecord> {
    const lead = this.isUsableId(id)
      ? await this.prisma.lead.findFirst({
          where: { id, ...this.notDeleted(), ...visibleRelations },
          include: leadWithDetail,
        })
      : null;
    if (!lead) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return this.toDetailRecord(lead);
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
    sortField: LeadSortField,
    order: SortDirection,
  ): Promise<LeadRecord[]> {
    const leads = await this.prisma.lead.findMany({
      where: this.buildWhere(filter),
      include: leadWithRelations,
      orderBy: this.buildOrderBy(sortField, order),
      skip: (page - 1) * limit,
      take: limit,
    });
    return leads.map((lead) => this.toRecord(lead));
  }

  /** Distinct categories and cities among companies with visible leads. */
  async filterOptions(): Promise<LeadFilterOptionsRecord> {
    const companyWhere: Prisma.CompanyWhereInput = {
      ...this.notDeleted(),
      leads: { some: { ...this.notDeleted(), campaign: { deletedAt: null } } },
    };
    const [categories, cities] = await Promise.all([
      this.prisma.company.findMany({
        where: { ...companyWhere, category: { not: null } },
        distinct: ['category'],
        select: { category: true },
        orderBy: { category: 'asc' },
        take: FILTER_OPTIONS_LIMIT,
      }),
      this.prisma.company.findMany({
        where: { ...companyWhere, city: { not: null } },
        distinct: ['city'],
        select: { city: true },
        orderBy: { city: 'asc' },
        take: FILTER_OPTIONS_LIMIT,
      }),
    ]);
    return {
      categories: categories.flatMap((row) => (row.category?.trim() ? [row.category] : [])),
      cities: cities.flatMap((row) => (row.city?.trim() ? [row.city] : [])),
    };
  }

  private buildOrderBy(
    sortField: LeadSortField,
    order: SortDirection,
  ): Prisma.LeadOrderByWithRelationInput[] {
    const nullable = { sort: order, nulls: 'last' } as const;
    const primary: Record<LeadSortField, Prisma.LeadOrderByWithRelationInput> = {
      createdAt: { createdAt: order },
      companyName: { company: { name: order } },
      category: { company: { category: nullable } },
      city: { company: { city: nullable } },
    };
    const tieBreakers: Prisma.LeadOrderByWithRelationInput[] =
      sortField === 'createdAt' ? [{ id: 'asc' }] : [{ createdAt: 'desc' }, { id: 'asc' }];
    return [primary[sortField], ...tieBreakers];
  }

  private buildWhere(filter: LeadListFilter): Prisma.LeadWhereInput {
    const insensitive = (value: string) => ({ equals: value, mode: 'insensitive' as const });
    const contains = (value: string) => ({ contains: value, mode: 'insensitive' as const });
    const searchDigits = filter.search?.replace(/\D/g, '') ?? '';

    return {
      ...this.notDeleted(),
      campaign: { deletedAt: null },
      company: {
        deletedAt: null,
        ...(filter.category ? { category: insensitive(filter.category) } : {}),
        ...(filter.city ? { city: insensitive(filter.city) } : {}),
        ...(filter.search
          ? {
              OR: [
                { name: contains(filter.search) },
                { legalName: contains(filter.search) },
                { category: contains(filter.search) },
                { city: contains(filter.search) },
                ...(searchDigits.length >= 3 ? [{ cnpj: { contains: searchDigits } }] : []),
              ],
            }
          : {}),
      },
      ...(filter.campaignId ? { campaignId: filter.campaignId } : {}),
      ...(filter.companyId ? { companyId: filter.companyId } : {}),
      ...(filter.qualificationStatus ? { qualificationStatus: filter.qualificationStatus } : {}),
      ...(filter.websiteStatus ? { websiteStatus: filter.websiteStatus } : {}),
      ...(filter.whatsappStatus ? { whatsappStatus: filter.whatsappStatus } : {}),
    };
  }

  private toRecord(lead: LeadRow): LeadRecord {
    return {
      ...this.toBaseRecord(lead),
      company: lead.company,
    };
  }

  private toDetailRecord(lead: LeadDetailRow): LeadDetailRecord {
    const { company } = lead;
    return {
      ...this.toBaseRecord(lead),
      company: {
        id: company.id,
        name: company.name,
        legalName: company.legalName,
        cnpj: company.cnpj,
        category: company.category,
        phone: company.phone,
        email: company.email,
        website: company.website,
        address: company.address,
        city: company.city,
        state: company.state,
        country: company.country,
        googlePlaceId: company.googlePlaceId,
        googleMapsUrl: company.googleMapsUrl,
        instagramUrl: company.instagramUrl,
        facebookUrl: company.facebookUrl,
        dedupeKey: company.dedupeKey,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        deletedAt: company.deletedAt,
        deletedBy: company.deletedBy,
      },
    };
  }

  private toBaseRecord(lead: LeadRow | LeadDetailRow): Omit<LeadRecord, 'company'> {
    return {
      id: lead.id,
      companyId: lead.companyId,
      campaignId: lead.campaignId,
      websiteStatus: lead.websiteStatus,
      whatsappStatus: lead.whatsappStatus,
      instagramStatus: lead.instagramStatus,
      facebookStatus: lead.facebookStatus,
      qualificationStatus: lead.qualificationStatus,
      campaign: lead.campaign,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt,
      deletedAt: lead.deletedAt,
      deletedBy: lead.deletedBy,
    };
  }
}
