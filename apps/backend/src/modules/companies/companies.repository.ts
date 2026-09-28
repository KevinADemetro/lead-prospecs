import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from '../../common/database/base.repository';
import { CompanyData, CompanyRecord } from '../../common/database/records';
import { PrismaService } from '../../database/prisma.service';
import { CompanyIdentity } from './company-identity.util';

type CompanyRow = Prisma.CompanyGetPayload<object>;

@Injectable()
export class CompaniesRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<CompanyRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const company = await this.prisma.company.findFirst({
      where: { id, ...this.notDeleted() },
    });
    return company ? this.toRecord(company) : null;
  }

  async findByIdOrFail(id: string): Promise<CompanyRecord> {
    const company = await this.findById(id);
    if (!company) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return company;
  }

  /** Includes soft-deleted rows: identities are unique across the whole table. */
  async findByIdentity(identity: CompanyIdentity): Promise<CompanyRecord | null> {
    const lookups: Prisma.CompanyWhereUniqueInput[] = [];
    if (identity.cnpj) {
      lookups.push({ cnpj: identity.cnpj });
    }
    if (identity.googlePlaceId) {
      lookups.push({ googlePlaceId: identity.googlePlaceId });
    }
    if (identity.dedupeKey) {
      lookups.push({ dedupeKey: identity.dedupeKey });
    }
    for (const where of lookups) {
      const company = await this.prisma.company.findUnique({ where });
      if (company) {
        return this.toRecord(company);
      }
    }
    return null;
  }

  async findByDedupeKey(dedupeKey: string): Promise<CompanyRecord | null> {
    const company = await this.prisma.company.findUnique({ where: { dedupeKey } });
    return company ? this.toRecord(company) : null;
  }

  /** Returns null when a unique identity already exists (concurrent insert). */
  async createIfAbsent(
    data: CompanyData & { dedupeKey: string | null },
  ): Promise<CompanyRecord | null> {
    try {
      const company = await this.prisma.company.create({ data });
      return this.toRecord(company);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        return null;
      }
      throw error;
    }
  }

  /** Updates an identity match, restoring it if it was soft-deleted. */
  async saveMerged(
    id: string,
    data: CompanyData & { dedupeKey: string | null },
  ): Promise<CompanyRecord> {
    this.assertId(id);
    const company = await this.prisma.company.update({
      where: { id },
      data: { ...data, deletedAt: null, deletedBy: null },
    });
    return this.toRecord(company);
  }

  private toRecord(company: CompanyRow): CompanyRecord {
    return {
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
      googleRating: company.googleRating,
      googleReviewCount: company.googleReviewCount,
      dedupeKey: company.dedupeKey,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
      deletedAt: company.deletedAt,
      deletedBy: company.deletedBy,
    };
  }
}
