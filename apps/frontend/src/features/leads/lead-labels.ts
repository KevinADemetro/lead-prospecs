import type { ComponentProps } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  CircleSlash,
  Clock,
  WifiOff,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import type {
  PresenceStatus,
  QualificationStatus,
  WebsiteStatus,
  WhatsappStatus,
} from '@app/shared';
import type { Badge } from '@/components/ui/badge';

type Tone = NonNullable<ComponentProps<typeof Badge>['tone']>;

export type StatusLabel = { label: string; tone: Tone; icon: LucideIcon; description: string };

export const QUALIFICATION_STATUS_LABELS: Record<QualificationStatus, StatusLabel> = {
  PENDING: {
    label: 'Pendente',
    tone: 'muted',
    icon: Clock,
    description: 'Lead ainda não qualificado',
  },
  QUALIFIED: {
    label: 'Qualificado',
    tone: 'success',
    icon: CheckCircle2,
    description: 'Lead qualificado para abordagem',
  },
  DISQUALIFIED: {
    label: 'Desqualificado',
    tone: 'danger',
    icon: XCircle,
    description: 'Lead descartado na qualificação',
  },
};

/** NOT_FOUND is a verified result (no website); ERROR means the check failed. */
export const WEBSITE_STATUS_LABELS: Record<WebsiteStatus, StatusLabel> = {
  FOUND: {
    label: 'Encontrado',
    tone: 'success',
    icon: CheckCircle2,
    description: 'Website encontrado e respondendo',
  },
  NOT_FOUND: {
    label: 'Sem website',
    tone: 'info',
    icon: CircleSlash,
    description: 'Verificado: a empresa não possui website',
  },
  UNAVAILABLE: {
    label: 'Indisponível',
    tone: 'warning',
    icon: WifiOff,
    description: 'Website existe, mas não respondeu',
  },
  ERROR: {
    label: 'Erro na verificação',
    tone: 'danger',
    icon: AlertTriangle,
    description: 'Não foi possível verificar o website',
  },
  UNKNOWN: {
    label: 'Não verificado',
    tone: 'muted',
    icon: CircleDashed,
    description: 'Website ainda não verificado',
  },
};

export const WHATSAPP_STATUS_LABELS: Record<WhatsappStatus, StatusLabel> = {
  CONFIRMED: {
    label: 'Confirmado',
    tone: 'success',
    icon: CheckCircle2,
    description: 'WhatsApp confirmado',
  },
  NOT_FOUND: {
    label: 'Não encontrado',
    tone: 'info',
    icon: CircleSlash,
    description: 'Verificado: sem WhatsApp',
  },
  UNKNOWN: {
    label: 'Não verificado',
    tone: 'muted',
    icon: CircleDashed,
    description: 'WhatsApp ainda não verificado',
  },
};

export const PRESENCE_STATUS_LABELS: Record<PresenceStatus, StatusLabel> = {
  FOUND: {
    label: 'Encontrado',
    tone: 'success',
    icon: CheckCircle2,
    description: 'Perfil encontrado',
  },
  NOT_FOUND: {
    label: 'Não encontrado',
    tone: 'info',
    icon: CircleSlash,
    description: 'Verificado: sem perfil',
  },
  UNKNOWN: {
    label: 'Não verificado',
    tone: 'muted',
    icon: CircleDashed,
    description: 'Perfil ainda não verificado',
  },
};
