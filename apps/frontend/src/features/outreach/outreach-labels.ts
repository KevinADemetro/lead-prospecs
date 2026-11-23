import type { ComponentProps } from 'react';
import {
  Ban,
  MessageCircle,
  MessageCircleMore,
  MessageCircleX,
  type LucideIcon,
} from 'lucide-react';
import type { OutreachMessageStep, OutreachStatus } from '@app/shared';
import type { Badge } from '@/components/ui/badge';

type Tone = NonNullable<ComponentProps<typeof Badge>['tone']>;

export type StatusLabel = { label: string; tone: Tone; icon: LucideIcon; description: string };

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, StatusLabel> = {
  WAITING_REPLY: {
    label: 'Aguardando resposta',
    tone: 'warning',
    icon: MessageCircle,
    description: 'Mensagem enviada; aguardando retorno do lead',
  },
  IN_CONVERSATION: {
    label: 'Em conversa',
    tone: 'info',
    icon: MessageCircleMore,
    description: 'Lead respondeu e a conversa está em andamento',
  },
  PROPOSAL_DECLINED: {
    label: 'Proposta recusada',
    tone: 'danger',
    icon: Ban,
    description: 'Proposta apresentada e recusada pelo lead',
  },
  NO_REPLY: {
    label: 'Sem resposta',
    tone: 'muted',
    icon: MessageCircleX,
    description: 'Sequência de follow-up concluída sem resposta',
  },
};

export const OUTREACH_STEP_LABELS: Record<OutreachMessageStep, string> = {
  INITIAL: 'D0 — Inicial',
  FOLLOW_UP_D3: 'D+3',
  FOLLOW_UP_D7: 'D+7',
  FOLLOW_UP_D14: 'D+14',
};
