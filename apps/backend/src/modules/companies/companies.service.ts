import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import type { UpdateLeadCompanyInput } from '@app/shared';
import { CompaniesRepository } from './companies.repository';
import { LeadsRepository } from '../leads/leads.repository';
import { toPublicCompanyDetail } from '../../common/mappers/public.mapper';
import { CompanyData, CompanyRecord } from '../../common/database/records';
import {
  buildDedupeKey,
  companyIdentity,
  CompanyInput,
  mergeCompanyData,
  toCompanyData,
} from './company-identity.util';

const COMPANY_DETAIL_LEAD_LIMIT = 100;

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companies: CompaniesRepository,
    private readonly leads: LeadsRepository,
  ) {}

  async getById(id: string) {
    const company = await this.companies.findByIdOrFail(id);
    const leads = await this.leads.paginate(
      { companyId: company.id },
      1,
      COMPANY_DETAIL_LEAD_LIMIT,
      'createdAt',
      'desc',
    );
    return toPublicCompanyDetail(company, leads);
  }

  /** Manual edits from the lead form; does not change googlePlaceId / dedupeKey. */
  async updateFromLead(id: string, input: UpdateLeadCompanyInput): Promise<CompanyRecord> {
    await this.companies.findByIdOrFail(id);
    try {
      const updated = await this.companies.updateFields(id, input);
      if (!updated) {
        throw new ConflictException('Não foi possível atualizar a empresa');
      }
      return updated;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('CNPJ já cadastrado em outra empresa');
      }
      throw error;
    }
  }

  /**
   * Returns the existing company matching by Google Place ID, then CNPJ, then
   * normalized name + phone + address; creates one only when nothing matches.
   */
  async upsertByIdentity(input: CompanyInput): Promise<CompanyRecord> {
    const incoming = toCompanyData(input);
    const identity = companyIdentity(input);

    for (let attempt = 0; attempt < 2; attempt += 1) {
      const existing = await this.companies.findByIdentity(identity);
      if (existing) {
        return this.mergeInto(existing, incoming);
      }
      const created = await this.companies.createIfAbsent({
        ...incoming,
        dedupeKey: identity.dedupeKey,
      });
      if (created) {
        return created;
      }
    }
    throw new ConflictException('Não foi possível concluir a operação');
  }

  private async mergeInto(existing: CompanyRecord, incoming: CompanyData) {
    const merged = mergeCompanyData(existing, incoming);
    let dedupeKey = existing.dedupeKey;
    if (!dedupeKey) {
      const candidate = buildDedupeKey(merged);
      const owner = candidate ? await this.companies.findByDedupeKey(candidate) : null;
      dedupeKey = owner ? null : candidate;
    }
    return this.companies.saveMerged(existing.id, { ...merged, dedupeKey });
  }
}
