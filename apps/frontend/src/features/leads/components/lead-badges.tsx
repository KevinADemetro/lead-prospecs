import { Star } from 'lucide-react';
import type { QualificationStatus, WebsiteStatus } from '@app/shared';
import { Badge } from '@/components/ui/badge';
import {
  QUALIFICATION_STATUS_LABELS,
  WEBSITE_STATUS_LABELS,
  type StatusLabel,
} from '../lead-labels';

function StatusBadge({ status }: { status: StatusLabel }) {
  return (
    <Badge tone={status.tone} icon={status.icon} title={status.description}>
      {status.label}
    </Badge>
  );
}

export function QualificationBadge({ status }: { status: QualificationStatus }) {
  return <StatusBadge status={QUALIFICATION_STATUS_LABELS[status]} />;
}

export function PriorityBadge() {
  return (
    <Badge tone="warning" icon={Star} title="Lead prioritário — alto potencial">
      Prioritário
    </Badge>
  );
}

export function WebsiteStatusBadge({ status }: { status: WebsiteStatus }) {
  return <StatusBadge status={WEBSITE_STATUS_LABELS[status]} />;
}
