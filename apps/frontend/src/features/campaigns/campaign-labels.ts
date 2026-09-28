import type { ComponentProps } from 'react';
import type { CampaignFilters, CampaignStatus } from '@app/shared';
import type { Badge } from '@/components/ui/badge';

type Tone = NonNullable<ComponentProps<typeof Badge>['tone']>;

export const CAMPAIGN_STATUS_LABELS: Record<CampaignStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: 'Rascunho', tone: 'muted' },
  RUNNING: { label: 'Em execução', tone: 'info' },
  COMPLETED: { label: 'Concluída', tone: 'success' },
  FAILED: { label: 'Falhou', tone: 'danger' },
  CANCELLED: { label: 'Cancelada', tone: 'warning' },
};

type BooleanFilter = keyof Pick<
  CampaignFilters,
  'withoutWebsite' | 'requirePhone' | 'requireWhatsapp' | 'requireGoogleBusiness'
>;

export const CAMPAIGN_BOOLEAN_FILTERS: { key: BooleanFilter; label: string }[] = [
  { key: 'withoutWebsite', label: 'Sem website' },
  { key: 'requirePhone', label: 'Com telefone' },
  { key: 'requireWhatsapp', label: 'Com WhatsApp' },
  { key: 'requireGoogleBusiness', label: 'Com Google Business' },
];

/** Mirrors the transitions enforced by the backend campaigns service. */
export const CAMPAIGN_RULES = {
  canEdit: (status: CampaignStatus) => status === 'DRAFT',
  canRun: (status: CampaignStatus) => status === 'DRAFT' || status === 'FAILED',
  canCancel: (status: CampaignStatus) => status === 'DRAFT' || status === 'RUNNING',
  canDelete: (status: CampaignStatus) => status !== 'RUNNING',
};

export function describeCampaignFilters(filters: CampaignFilters): string[] {
  const labels = CAMPAIGN_BOOLEAN_FILTERS.filter(({ key }) => filters[key]).map(
    ({ label }) => label,
  );
  if (filters.requireWebsite) labels.push('Com website');
  if (filters.minRating !== undefined) labels.push(`Rating mínimo: ${filters.minRating}`);
  if (filters.minReviewCount !== undefined) {
    labels.push(`Avaliações mínimas: ${filters.minReviewCount}`);
  }
  if (filters.maxResults !== undefined) labels.push(`Máximo de resultados: ${filters.maxResults}`);
  return labels;
}
