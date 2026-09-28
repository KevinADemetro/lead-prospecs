import type { CampaignStatus } from '@app/shared';
import { Badge } from '@/components/ui/badge';
import { CAMPAIGN_STATUS_LABELS } from '../campaign-labels';

export function CampaignStatusBadge({ status }: { status: CampaignStatus }) {
  const { label, tone } = CAMPAIGN_STATUS_LABELS[status];
  return <Badge tone={tone}>{label}</Badge>;
}
