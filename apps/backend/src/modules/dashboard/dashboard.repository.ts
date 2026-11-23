import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from '../../common/database/base.repository';
import { PrismaService } from '../../database/prisma.service';

export type LeadMetrics = {
  companiesFound: number;
  qualifiedLeads: number;
  leadsWithoutWebsite: number;
  followUpsToday: number;
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
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setUTCDate(tomorrowStart.getUTCDate() + 1);

    const [companiesFound, qualifiedLeads, leadsWithoutWebsite, followUpsToday] =
      await Promise.all([
        this.prisma.company.count({
          where: {
            ...this.notDeleted(),
            leads: { some: { ...this.notDeleted(), campaign: this.notDeleted() } },
          },
        }),
        this.prisma.lead.count({
          where: {
            ...visibleLead,
            qualificationStatus: { in: ['QUALIFIED', 'AUTO_QUALIFIED'] },
          },
        }),
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
        this.prisma.outreach.count({
          where: {
            ...this.notDeleted(),
            status: 'WAITING_REPLY',
            nextFollowUpAt: { gte: todayStart, lt: tomorrowStart },
            lead: {
              deletedAt: null,
              campaign: { deletedAt: null },
              company: { deletedAt: null },
            },
          },
        }),
      ]);
    return { companiesFound, qualifiedLeads, leadsWithoutWebsite, followUpsToday };
  }
}
