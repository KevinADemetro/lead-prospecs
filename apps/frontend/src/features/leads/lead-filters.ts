import type { LeadListQuery } from '@app/shared';

export type LeadFilterValues = {
  search: string;
  campaignId: string;
  dorId: string;
  websiteStatus: string;
  whatsappStatus: string;
  category: string;
  city: string;
  qualificationStatus: string;
  priority: string;
};

export const EMPTY_LEAD_FILTERS: LeadFilterValues = {
  search: '',
  campaignId: '',
  dorId: '',
  websiteStatus: '',
  whatsappStatus: '',
  category: '',
  city: '',
  qualificationStatus: '',
  priority: '',
};

export type LeadQueryFilters = Omit<LeadListQuery, 'page' | 'limit' | 'sort' | 'order'>;

/** Converts raw form values into API filters; values are validated again by the backend. */
export function toQueryFilters(values: LeadFilterValues): LeadQueryFilters {
  return {
    search: values.search.trim() || undefined,
    campaignId: values.campaignId || undefined,
    dorId: values.dorId || undefined,
    websiteStatus: (values.websiteStatus || undefined) as LeadQueryFilters['websiteStatus'],
    whatsappStatus: (values.whatsappStatus || undefined) as LeadQueryFilters['whatsappStatus'],
    category: values.category || undefined,
    city: values.city || undefined,
    qualificationStatus: (values.qualificationStatus ||
      undefined) as LeadQueryFilters['qualificationStatus'],
    priority:
      values.priority === 'true' ? true : values.priority === 'false' ? false : undefined,
  };
}

export function hasActiveFilters(filters: LeadQueryFilters): boolean {
  return Object.values(filters).some((value) => value !== undefined);
}
