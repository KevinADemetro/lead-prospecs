import { Injectable } from '@nestjs/common';
import { LeadListQuery } from '@app/shared';
import { LeadsRepository } from './leads.repository';
import { CampaignsRepository } from '../campaigns/campaigns.repository';
import { CompaniesService } from '../companies/companies.service';
import { CompanyInput } from '../companies/company-identity.util';
import { toPublicLead } from '../../common/mappers/public.mapper';
import { LeadListFilter } from '../../common/database/records';

const LEAD_SORT: Record<string, string> = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  score: 'score',
};

@Injectable()
export class LeadsService {
  constructor(
    private readonly leads: LeadsRepository,
    private readonly campaigns: CampaignsRepository,
    private readonly companies: CompaniesService,
  ) {}

  async list(query: LeadListQuery) {
    const filter = this.buildFilter(query);
    const sortField = LEAD_SORT[query.sort ?? 'createdAt'] ?? 'createdAt';
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
    const lead = await this.leads.findByIdOrFail(id);
    return toPublicLead(lead);
  }

  /** Entry point for prospecting sources: deduplicates the company and links it once per campaign. */
  async addCompanyToCampaign(campaignId: string, company: CompanyInput) {
    const campaign = await this.campaigns.findByIdOrFail(campaignId);
    const saved = await this.companies.upsertByIdentity(company);
    const lead = await this.leads.upsertForCampaign(campaign.id, saved.id);
    return toPublicLead(lead);
  }

  private buildFilter(query: LeadListQuery): LeadListFilter {
    const filter: LeadListFilter = {};
    if (query.search) {
      filter.companyNameContains = query.search;
    }
    if (query.campaignId) {
      filter.campaignId = query.campaignId;
    }
    if (query.companyId) {
      filter.companyId = query.companyId;
    }
    if (query.qualificationStatus) {
      filter.qualificationStatus = query.qualificationStatus;
    }
    if (query.trelloStatus) {
      filter.trelloStatus = query.trelloStatus;
    }
    return filter;
  }
}
