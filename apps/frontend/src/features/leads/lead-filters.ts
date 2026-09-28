import { SCORE_MAX, SCORE_MIN, type LeadListQuery } from '@app/shared';

export type LeadFilterValues = {
  search: string;
  campaignId: string;
  websiteStatus: string;
  whatsappStatus: string;
  category: string;
  city: string;
  qualificationStatus: string;
  trelloStatus: string;
  scoreMin: string;
  scoreMax: string;
};

export const EMPTY_LEAD_FILTERS: LeadFilterValues = {
  search: '',
  campaignId: '',
  websiteStatus: '',
  whatsappStatus: '',
  category: '',
  city: '',
  qualificationStatus: '',
  trelloStatus: '',
  scoreMin: '',
  scoreMax: '',
};

export type LeadQueryFilters = Omit<LeadListQuery, 'page' | 'limit' | 'sort' | 'order'>;

function parseScore(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return undefined;
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, parsed));
}

/** Converts raw form values into API filters; values are validated again by the backend. */
export function toQueryFilters(values: LeadFilterValues): LeadQueryFilters {
  let scoreMin = parseScore(values.scoreMin);
  let scoreMax = parseScore(values.scoreMax);
  if (scoreMin !== undefined && scoreMax !== undefined && scoreMin > scoreMax) {
    [scoreMin, scoreMax] = [scoreMax, scoreMin];
  }
  return {
    search: values.search.trim() || undefined,
    campaignId: values.campaignId || undefined,
    websiteStatus: (values.websiteStatus || undefined) as LeadQueryFilters['websiteStatus'],
    whatsappStatus: (values.whatsappStatus || undefined) as LeadQueryFilters['whatsappStatus'],
    category: values.category || undefined,
    city: values.city || undefined,
    qualificationStatus: (values.qualificationStatus ||
      undefined) as LeadQueryFilters['qualificationStatus'],
    trelloStatus: (values.trelloStatus || undefined) as LeadQueryFilters['trelloStatus'],
    scoreMin,
    scoreMax,
  };
}

export function hasActiveFilters(filters: LeadQueryFilters): boolean {
  return Object.values(filters).some((value) => value !== undefined);
}
