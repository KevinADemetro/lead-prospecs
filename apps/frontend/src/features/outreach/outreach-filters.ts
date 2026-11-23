import type { OutreachListQuery, OutreachStatus } from '@app/shared';

export type OutreachFilterValues = {
  search: string;
  status: OutreachStatus[];
  followUpToday: boolean;
};

export const EMPTY_OUTREACH_FILTERS: OutreachFilterValues = {
  search: '',
  status: [],
  followUpToday: false,
};

export function toQueryFilters(values: OutreachFilterValues): Partial<OutreachListQuery> {
  return {
    search: values.search.trim() || undefined,
    status: values.status.length > 0 ? values.status : undefined,
    followUpToday: values.followUpToday || undefined,
  };
}

export function hasActiveFilters(query: Partial<OutreachListQuery>): boolean {
  return Boolean(
    query.search ||
      (query.status && query.status.length > 0) ||
      query.followUpToday ||
      query.leadId,
  );
}

export function filtersFromSearchParams(params: URLSearchParams): OutreachFilterValues {
  const statusParam = params.get('status');
  const status = statusParam
    ? (statusParam.split(',').filter(Boolean) as OutreachStatus[])
    : [];
  return {
    search: params.get('search') ?? '',
    status,
    followUpToday: params.get('followUpToday') === 'true',
  };
}
