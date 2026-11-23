import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateOutreachInput,
  MarkNoReplyResult,
  OutreachListQuery,
  OutreachSortField,
  UpdateOutreachInput,
} from '@app/shared';
import { AuthContext } from '../../common/types/auth-context';
import { toPublicOutreach } from '../../common/mappers/public.mapper';
import { OutreachListFilter } from '../../common/database/records';
import { LeadsRepository } from '../leads/leads.repository';
import { OutreachRepository } from './outreach.repository';
import {
  nextFollowUpAtAfterStep,
  recalculateNextFollowUpAt,
  utcDayStart,
} from './outreach-schedule.util';

const ELIGIBLE_QUALIFICATION = new Set(['QUALIFIED', 'AUTO_QUALIFIED']);

const OUTREACH_SORT: Record<string, OutreachSortField> = {
  createdAt: 'createdAt',
  startedAt: 'startedAt',
  nextFollowUpAt: 'nextFollowUpAt',
  companyName: 'companyName',
};

@Injectable()
export class OutreachService {
  constructor(
    private readonly outreach: OutreachRepository,
    private readonly leads: LeadsRepository,
  ) {}

  async list(query: OutreachListQuery) {
    const filter = this.buildFilter(query);
    const sortField = OUTREACH_SORT[query.sort ?? 'nextFollowUpAt'] ?? 'nextFollowUpAt';
    const order = query.order === 'asc' ? 'asc' : 'desc';
    const [items, total] = await Promise.all([
      this.outreach.paginate(filter, query.page, query.limit, sortField, order),
      this.outreach.count(filter),
    ]);
    return {
      data: items.map(toPublicOutreach),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / query.limit)),
      },
    };
  }

  async getById(id: string) {
    return toPublicOutreach(await this.outreach.findByIdOrFail(id));
  }

  async create(input: CreateOutreachInput) {
    const lead = await this.leads.findByIdOrFail(input.leadId);
    if (!ELIGIBLE_QUALIFICATION.has(lead.qualificationStatus)) {
      throw new BadRequestException(
        'Só é possível iniciar abordagem para leads qualificados ou auto-qualificados',
      );
    }

    const existing = await this.outreach.findByLeadIdIncludingDeleted(input.leadId);
    if (existing) {
      throw new ConflictException('Já existe uma abordagem para este lead');
    }

    const sentAt = input.sentAt ? utcDayStart(input.sentAt) : utcDayStart(new Date());
    const status = input.status ?? 'WAITING_REPLY';
    const nextFollowUpAt =
      status === 'WAITING_REPLY' ? nextFollowUpAtAfterStep(sentAt, 'INITIAL') : null;

    try {
      const created = await this.outreach.create({
        leadId: input.leadId,
        status,
        startedAt: sentAt,
        nextFollowUpAt,
        message: input.message,
        sentAt,
      });
      return toPublicOutreach(created);
    } catch (error) {
      if (this.isUniqueViolation(error)) {
        throw new ConflictException('Já existe uma abordagem para este lead');
      }
      throw error;
    }
  }

  private isUniqueViolation(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'
    );
  }

  async update(id: string, input: UpdateOutreachInput) {
    const current = await this.outreach.findByIdOrFail(id);

    if (input.followUp) {
      const alreadySent = current.messages.some((message) => message.step === input.followUp!.step);
      if (alreadySent) {
        throw new ConflictException('Este passo de follow-up já foi registrado');
      }
      if (!current.messages.some((message) => message.step === 'INITIAL')) {
        throw new BadRequestException('Abordagem sem mensagem inicial');
      }
      const requiredPrevious: Record<string, string> = {
        FOLLOW_UP_D3: 'INITIAL',
        FOLLOW_UP_D7: 'FOLLOW_UP_D3',
        FOLLOW_UP_D14: 'FOLLOW_UP_D7',
      };
      const previous = requiredPrevious[input.followUp.step];
      if (previous && !current.messages.some((message) => message.step === previous)) {
        throw new BadRequestException('Registre o follow-up anterior antes deste passo');
      }
    }

    const status = input.status ?? current.status;
    const sentAt = input.followUp?.sentAt
      ? utcDayStart(input.followUp.sentAt)
      : utcDayStart(new Date());

    const messagesAfter = input.followUp
      ? [...current.messages.map((message) => message.step), input.followUp.step]
      : current.messages.map((message) => message.step);

    let nextFollowUpAt: Date | null = current.nextFollowUpAt;
    if (status !== 'WAITING_REPLY') {
      nextFollowUpAt = null;
    } else if (input.followUp || input.status === 'WAITING_REPLY') {
      nextFollowUpAt = recalculateNextFollowUpAt(current.startedAt, messagesAfter);
    }

    const updated = await this.outreach.updateById(id, {
      status,
      nextFollowUpAt,
      ...(input.followUp
        ? {
            appendMessage: {
              step: input.followUp.step,
              message: input.followUp.message,
              sentAt,
            },
          }
        : {}),
    });
    if (!updated) {
      throw new NotFoundException('Recurso não encontrado');
    }
    return toPublicOutreach(updated);
  }

  async softDelete(id: string, actor: AuthContext) {
    await this.outreach.findByIdOrFail(id);
    await this.outreach.softDelete(id, actor.id);
  }

  async restore(id: string) {
    await this.outreach.restore(id);
    return this.getById(id);
  }

  async markNoReply(): Promise<MarkNoReplyResult> {
    const updatedCount = await this.outreach.markNoReplyPastThreshold();
    return { updatedCount };
  }

  private buildFilter(query: OutreachListQuery): OutreachListFilter {
    return {
      ...(query.leadId ? { leadId: query.leadId } : {}),
      ...(query.search ? { search: query.search } : {}),
      ...(query.status?.length ? { status: query.status } : {}),
      ...(query.followUpToday ? { followUpToday: true } : {}),
    };
  }
}
