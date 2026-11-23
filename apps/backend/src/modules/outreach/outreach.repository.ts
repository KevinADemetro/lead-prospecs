import { Injectable, NotFoundException } from '@nestjs/common';
import {
  OutreachMessageStep,
  OutreachSortField,
  OutreachStatus,
} from '@app/shared';
import { Prisma } from '../../generated/prisma/client';
import { BaseRepository } from '../../common/database/base.repository';
import {
  OutreachListFilter,
  OutreachRecord,
  SortDirection,
} from '../../common/database/records';
import { PrismaService } from '../../database/prisma.service';
import { noReplyThresholdDate, utcDayRange } from './outreach-schedule.util';

const outreachInclude = {
  messages: { orderBy: { sentAt: 'asc' as const } },
  lead: {
    select: {
      id: true,
      qualificationStatus: true,
      deletedAt: true,
      company: {
        select: {
          id: true,
          name: true,
          phone: true,
          whatsappUrl: true,
          deletedAt: true,
        },
      },
      campaign: {
        select: { id: true, name: true, status: true, deletedAt: true },
      },
    },
  },
} as const;

type OutreachRow = Prisma.OutreachGetPayload<{ include: typeof outreachInclude }>;

const visibleLead = {
  lead: { deletedAt: null, campaign: { deletedAt: null }, company: { deletedAt: null } },
} as const;

@Injectable()
export class OutreachRepository extends BaseRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(id: string): Promise<OutreachRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }
    const outreach = await this.prisma.outreach.findFirst({
      where: { id, ...this.notDeleted(), ...visibleLead },
      include: outreachInclude,
    });
    return outreach ? this.toRecord(outreach) : null;
  }

  async findByIdOrFail(id: string): Promise<OutreachRecord> {
    const outreach = await this.findById(id);
    if (!outreach) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return outreach;
  }

  async findByLeadIdIncludingDeleted(leadId: string): Promise<OutreachRecord | null> {
    if (!this.isUsableId(leadId)) {
      return null;
    }
    const outreach = await this.prisma.outreach.findUnique({
      where: { leadId },
      include: outreachInclude,
    });
    return outreach ? this.toRecord(outreach) : null;
  }

  async create(data: {
    leadId: string;
    status: OutreachStatus;
    startedAt: Date;
    nextFollowUpAt: Date | null;
    message: string;
    sentAt: Date;
  }): Promise<OutreachRecord> {
    const outreach = await this.prisma.outreach.create({
      data: {
        leadId: data.leadId,
        status: data.status,
        startedAt: data.startedAt,
        nextFollowUpAt: data.nextFollowUpAt,
        messages: {
          create: {
            step: 'INITIAL',
            message: data.message,
            sentAt: data.sentAt,
          },
        },
      },
      include: outreachInclude,
    });
    return this.toRecord(outreach);
  }

  async updateById(
    id: string,
    data: {
      status?: OutreachStatus;
      nextFollowUpAt?: Date | null;
      appendMessage?: {
        step: OutreachMessageStep;
        message: string;
        sentAt: Date;
      };
    },
  ): Promise<OutreachRecord | null> {
    if (!this.isUsableId(id)) {
      return null;
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        const result = await tx.outreach.updateMany({
          where: { id, ...this.notDeleted() },
          data: {
            ...(data.status !== undefined ? { status: data.status } : {}),
            ...(data.nextFollowUpAt !== undefined
              ? { nextFollowUpAt: data.nextFollowUpAt }
              : {}),
          },
        });
        if (result.count === 0) {
          throw new NotFoundException('Recurso não encontrado');
        }
        if (data.appendMessage) {
          await tx.outreachMessage.create({
            data: {
              outreachId: id,
              step: data.appendMessage.step,
              message: data.appendMessage.message,
              sentAt: data.appendMessage.sentAt,
            },
          });
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }
      throw error;
    }

    return this.findById(id);
  }

  async softDelete(id: string, deletedBy: string): Promise<void> {
    this.assertId(id);
    const result = await this.prisma.outreach.updateMany({
      where: { id, deletedAt: null },
      data: { deletedAt: new Date(), deletedBy },
    });
    if (result.count === 0) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }

  async restore(id: string): Promise<void> {
    this.assertId(id);
    const result = await this.prisma.outreach.updateMany({
      where: { id, deletedAt: { not: null } },
      data: { deletedAt: null, deletedBy: null },
    });
    if (result.count === 0) {
      throw new NotFoundException('Recurso não encontrado');
    }
  }

  count(filter: OutreachListFilter = {}): Promise<number> {
    return this.prisma.outreach.count({ where: this.buildWhere(filter) });
  }

  async paginate(
    filter: OutreachListFilter,
    page: number,
    limit: number,
    sortField: OutreachSortField,
    order: SortDirection,
  ): Promise<OutreachRecord[]> {
    const rows = await this.prisma.outreach.findMany({
      where: this.buildWhere(filter),
      include: outreachInclude,
      orderBy: this.buildOrderBy(sortField, order),
      skip: (page - 1) * limit,
      take: limit,
    });
    return rows.map((row) => this.toRecord(row));
  }

  async countFollowUpsToday(today: Date = new Date()): Promise<number> {
    return this.prisma.outreach.count({
      where: this.buildWhere({ followUpToday: true }, today),
    });
  }

  /**
   * Bulk-mark WAITING_REPLY outreach past D0+21 as NO_REPLY and clear follow-up.
   */
  async markNoReplyPastThreshold(today: Date = new Date()): Promise<number> {
    const threshold = noReplyThresholdDate(today);
    const result = await this.prisma.outreach.updateMany({
      where: {
        ...this.notDeleted(),
        ...visibleLead,
        status: 'WAITING_REPLY',
        startedAt: { lte: threshold },
      },
      data: {
        status: 'NO_REPLY',
        nextFollowUpAt: null,
      },
    });
    return result.count;
  }

  private buildOrderBy(
    sortField: OutreachSortField,
    order: SortDirection,
  ): Prisma.OutreachOrderByWithRelationInput[] {
    const nullable = { sort: order, nulls: 'last' } as const;
    const primary: Record<OutreachSortField, Prisma.OutreachOrderByWithRelationInput> = {
      createdAt: { createdAt: order },
      startedAt: { startedAt: order },
      nextFollowUpAt: { nextFollowUpAt: nullable },
      companyName: { lead: { company: { name: order } } },
    };
    return [primary[sortField], { id: 'asc' }];
  }

  private buildWhere(
    filter: OutreachListFilter,
    today: Date = new Date(),
  ): Prisma.OutreachWhereInput {
    const { start, end } = utcDayRange(today);
    const contains = (value: string) => ({ contains: value, mode: 'insensitive' as const });

    return {
      ...this.notDeleted(),
      lead: {
        deletedAt: null,
        campaign: { deletedAt: null },
        company: {
          deletedAt: null,
          ...(filter.search ? { name: contains(filter.search) } : {}),
        },
      },
      ...(filter.leadId ? { leadId: filter.leadId } : {}),
      ...(filter.followUpToday
        ? {
            status: 'WAITING_REPLY',
            nextFollowUpAt: { gte: start, lt: end },
          }
        : filter.status?.length
          ? { status: { in: filter.status } }
          : {}),
    };
  }

  private toRecord(row: OutreachRow): OutreachRecord {
    return {
      id: row.id,
      leadId: row.leadId,
      status: row.status,
      startedAt: row.startedAt,
      nextFollowUpAt: row.nextFollowUpAt,
      messages: row.messages.map((message) => ({
        id: message.id,
        sentAt: message.sentAt,
        message: message.message,
        step: message.step,
        createdAt: message.createdAt,
      })),
      lead: {
        id: row.lead.id,
        qualificationStatus: row.lead.qualificationStatus,
        company: {
          id: row.lead.company.id,
          name: row.lead.company.name,
          phone: row.lead.company.phone,
          whatsappUrl: row.lead.company.whatsappUrl,
        },
        campaign: {
          id: row.lead.campaign.id,
          name: row.lead.campaign.name,
          status: row.lead.campaign.status,
        },
      },
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
      deletedBy: row.deletedBy,
    };
  }
}
