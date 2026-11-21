import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadFilterOptions, LeadListQuery, UpdateLeadInput } from '@app/shared';
import { LeadsRepository } from './leads.repository';
import { DoresRepository } from '../dores/dores.repository';
import { CampaignsRepository } from '../campaigns/campaigns.repository';
import { CompaniesService } from '../companies/companies.service';
import { CompanyInput } from '../companies/company-identity.util';
import { toPublicLead, toPublicLeadDetail } from '../../common/mappers/public.mapper';
import { LeadListFilter } from '../../common/database/records';

@Injectable()
export class LeadsService {
  constructor(
    private readonly leads: LeadsRepository,
    private readonly dores: DoresRepository,
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
    await this.leads.findByIdOrFail(id);
    if (input.dorId !== undefined && input.dorId !== null) {
      await this.dores.findByIdOrFail(input.dorId);
    }
    const updated = await this.leads.updateDorId(id, input.dorId ?? null);
    if (!updated) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return toPublicLeadDetail(updated);
  }

  filterOptions(): Promise<LeadFilterOptions> {
    return this.leads.filterOptions();
  }

  /** Entry point for prospecting sources: deduplicates the company and links it once per campaign. */
  async addCompanyToCampaign(campaignId: string, company: CompanyInput) {
    const campaign = await this.campaigns.findByIdOrFail(campaignId);
    const saved = await this.companies.upsertByIdentity(company);
    const lead = await this.leads.upsertForCampaign(campaign.id, saved.id);
    return toPublicLead(lead);
  }

  private buildFilter(query: LeadListQuery): LeadListFilter {
    return {
      search: query.search || undefined,
      campaignId: query.campaignId,
      companyId: query.companyId,
      dorId: query.dorId,
      qualificationStatus: query.qualificationStatus,
      trelloStatus: query.trelloStatus,
      websiteStatus: query.websiteStatus,
      whatsappStatus: query.whatsappStatus,
      category: query.category,
      city: query.city,
      scoreMin: query.scoreMin,
      scoreMax: query.scoreMax,
    };
  }
}
