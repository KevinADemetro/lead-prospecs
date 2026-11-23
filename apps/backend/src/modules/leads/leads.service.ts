import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadFilterOptions, LeadListQuery, UpdateLeadInput } from '@app/shared';
import { LeadsRepository } from './leads.repository';
import { PainPointsRepository } from '../pain-points/pain-points.repository';
import { CampaignsRepository } from '../campaigns/campaigns.repository';
import { CompaniesService } from '../companies/companies.service';
import { CompanyInput } from '../companies/company-identity.util';
import { toPublicLead, toPublicLeadDetail } from '../../common/mappers/public.mapper';
import { LeadListFilter } from '../../common/database/records';

@Injectable()
export class LeadsService {
  constructor(
    private readonly leads: LeadsRepository,
    private readonly painPoints: PainPointsRepository,
    private readonly campaigns: CampaignsRepository,
    private readonly companies: CompaniesService,
  ) {}

  async list(query: LeadListQuery) {
    const filter = this.buildFilter(query);
    const sortField = query.sort ?? 'createdAt';
    const order = query.order === 'asc' ? 'asc' : 'desc';
    const [items, total] = await Promise.all([
      this.leads.paginate(filter, query.page, query.limit, sortField, order),
      this.leads.count(filter),
    ]);
    return {
      data: items.map(toPublicLead),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getById(id: string) {
    const lead = await this.leads.findDetailByIdOrFail(id);
    return toPublicLeadDetail(lead);
  }

  async update(id: string, input: UpdateLeadInput) {
    const current = await this.leads.findByIdOrFail(id);
    if (input.painPointId !== undefined && input.painPointId !== null) {
      await this.painPoints.findByIdOrFail(input.painPointId);
    }
    if (input.company) {
      await this.companies.updateFromLead(current.companyId, input.company);
    }
    const hasLeadFields =
      input.painPointId !== undefined ||
      input.websiteStatus !== undefined ||
      input.qualificationStatus !== undefined ||
      input.priority !== undefined ||
      input.notes !== undefined;
    if (hasLeadFields) {
      const updated = await this.leads.updateFields(id, {
        ...(input.painPointId !== undefined ? { painPointId: input.painPointId } : {}),
        ...(input.websiteStatus !== undefined ? { websiteStatus: input.websiteStatus } : {}),
        ...(input.qualificationStatus !== undefined
          ? { qualificationStatus: input.qualificationStatus }
          : {}),
        ...(input.priority !== undefined ? { priority: input.priority } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      });
      if (!updated) {
        throw new NotFoundException('Recurso não encontrado');
      }
      return toPublicLeadDetail(updated);
    }
    return toPublicLeadDetail(await this.leads.findDetailByIdOrFail(id));
  }

  filterOptions(): Promise<LeadFilterOptions> {
    return this.leads.filterOptions();
  }

  /**
   * Entry point for prospecting sources: deduplicates the company and links it once per campaign.
   * Optional `autoQualify` applies only while the lead is still PENDING (create or re-import).
   */
  async addCompanyToCampaign(
    campaignId: string,
    company: CompanyInput,
    autoQualify?: {
      painPointId: string;
      websiteStatus?: 'NOT_FOUND';
    },
  ) {
    const campaign = await this.campaigns.findByIdOrFail(campaignId);
    const saved = await this.companies.upsertByIdentity(company);
    let lead = await this.leads.upsertForCampaign(campaign.id, saved.id);
    if (autoQualify && lead.qualificationStatus === 'PENDING') {
      const updated = await this.leads.updateFields(lead.id, {
        painPointId: autoQualify.painPointId,
        qualificationStatus: 'AUTO_QUALIFIED',
        ...(autoQualify.websiteStatus
          ? { websiteStatus: autoQualify.websiteStatus }
          : {}),
      });
      if (updated) {
        lead = updated;
      }
    }
    return toPublicLead(lead);
  }

  private buildFilter(query: LeadListQuery): LeadListFilter {
    return {
      search: query.search || undefined,
      campaignId: query.campaignId,
      companyId: query.companyId,
      painPointId: query.painPointId,
      qualificationStatus: query.qualificationStatus,
      websiteStatus: query.websiteStatus,
      priority: query.priority,
      category: query.category,
      city: query.city,
    };
  }
}
