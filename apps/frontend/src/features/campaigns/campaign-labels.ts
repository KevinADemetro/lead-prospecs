import type { ComponentProps } from 'react';
import type { CampaignStatus } from '@app/shared';
import type { Badge } from '@/components/ui/badge';

type Tone = NonNullable<ComponentProps<typeof Badge>['tone']>;

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Rascunho', tone: 'muted' },
  RUNNING: { label: 'Em execução', tone: 'info' },
  COMPLETED: { label: 'Concluída', tone: 'success' },
  FAILED: { label: 'Falhou', tone: 'danger' },
  CANCELLED: { label: 'Cancelada', tone: 'warning' },
};
