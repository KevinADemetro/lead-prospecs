import type { ComponentProps } from 'react';
import type { QualificationStatus } from '@app/shared';
import type { Badge } from '@/components/ui/badge';

type Tone = NonNullable<ComponentProps<typeof Badge>['tone']>;

export const QUALIFICATION_STATUS_LABELS: Record<
  QualificationStatus,
  { label: string; tone: Tone }
> = {
  PENDING: { label: 'Pendente', tone: 'muted' },
  QUALIFIED: { label: 'Qualificado', tone: 'success' },
  DISQUALIFIED: { label: 'Desqualificado', tone: 'danger' },
};
