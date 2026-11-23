import type { LeadListQuery, QualificationStatus } from '@app/shared';

export type LeadFilterValues = {
  search: string;
  campaignId: string;
  painPointId: string;
  websiteStatus: string;
  category: string;
  city: string;
  qualificationStatus: QualificationStatus[];
  priority: string;
};

export const EMPTY_LEAD_FILTERS: LeadFilterValues = {
  search: '',
  campaignId: '',
  painPointId: '',
  websiteStatus: '',
  category: '',
  city: '',
  qualificationStatus: [],
  priority: '',
};

export type LeadQueryFilters = Omit<LeadListQuery, 'page' | 'limit' | 'sort' | 'order'>;

/** Converts raw form values into API filters; values are validated again by the backend. */
export function toQueryFilters(values: LeadFilterValues): LeadQueryFilters {
  return {
    search: values.search.trim() || undefined,
    campaignId: values.campaignId || undefined,
    painPointId: values.painPointId || undefined,
    websiteStatus: (values.websiteStatus || undefined) as LeadQueryFilters['websiteStatus'],
    category: values.category || undefined,
    city: values.city || undefined,
    qualificationStatus:
      values.qualificationStatus.length > 0 ? values.qualificationStatus : undefined,
    priority:
      values.priority === 'true' ? true : values.priority === 'false' ? false : undefined,
  };
}

export function hasActiveFilters(filters: LeadQueryFilters): boolean {
  return Object.values(filters).some((value) => {
    if (value === undefined) return false;
    if (Array.isArray(value)) return value.length > 0;
    return true;
  });
}

export function toggleQualificationStatus(
  selected: QualificationStatus[],
  status: QualificationStatus,
): QualificationStatus[] {
  return selected.includes(status)
    ? selected.filter((value) => value !== status)
    : [...selected, status];
}
