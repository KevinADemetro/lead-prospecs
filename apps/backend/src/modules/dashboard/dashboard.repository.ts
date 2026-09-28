import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from '../../common/database/base.repository';
import { PrismaService } from '../../database/prisma.service';

export type LeadMetrics = {
  companiesFound: number;
  qualifiedLeads: number;
  leadsWithoutWebsite: number;
  leadsSentToTrello: number;
};

@Injectable()
export class DashboardRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async leadMetrics(): Promise<LeadMetrics> {
    const visibleLead: Prisma.LeadWhereInput = {
      ...this.notDeleted(),
      campaign: this.notDeleted(),
      company: this.notDeleted(),
    };
    const [companiesFound, qualifiedLeads, leadsWithoutWebsite, leadsSentToTrello] =
      await Promise.all([
        this.prisma.company.count({
          where: {
            ...this.notDeleted(),
            leads: { some: { ...this.notDeleted(), campaign: this.notDeleted() } },
          },
        }),
        this.prisma.lead.count({ where: { ...visibleLead, qualificationStatus: 'QUALIFIED' } }),
        this.prisma.lead.count({
          where: {
            ...visibleLead,
            OR: [
              { websiteStatus: 'NOT_FOUND' },
              { company: { website: null } },
              { company: { website: '' } },
            ],
          },
        }),
        this.prisma.lead.count({ where: { ...visibleLead, trelloStatus: 'CREATED' } }),
      ]);
    return { companiesFound, qualifiedLeads, leadsWithoutWebsite, leadsSentToTrello };
  }
}
