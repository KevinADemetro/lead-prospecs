import type { OutreachStatus } from '@app/shared';
import { Badge } from '@/components/ui/badge';
import { OUTREACH_STATUS_LABELS } from '../outreach-labels';

export function OutreachStatusBadge({ status }: { status: OutreachStatus }) {
  const meta = OUTREACH_STATUS_LABELS[status];
  return (
    <Badge tone={meta.tone} icon={meta.icon} title={meta.description}>
      {meta.label}
    </Badge>
  );
}
