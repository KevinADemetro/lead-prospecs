import { describe, expect, it } from 'vitest';
import { leadListQuerySchema } from '@app/shared';
import { EMPTY_LEAD_FILTERS, hasActiveFilters, toQueryFilters } from './lead-filters';
import { WEBSITE_STATUS_LABELS } from './lead-labels';

describe('lead filters', () => {
  it('ignores empty values', () => {
    const filters = toQueryFilters(EMPTY_LEAD_FILTERS);
    expect(hasActiveFilters(filters)).toBe(false);
  });

  it('builds a query accepted by the shared schema', () => {
    const filters = toQueryFilters({
      ...EMPTY_LEAD_FILTERS,
      search: '  padaria ',
      websiteStatus: 'NOT_FOUND',
      whatsappStatus: 'CONFIRMED',
      category: 'Padaria',
      city: 'Curitiba',
      priority: 'true',
    });
    expect(filters).toMatchObject({
      search: 'padaria',
      category: 'Padaria',
      city: 'Curitiba',
      priority: true,
    });
    expect(hasActiveFilters(filters)).toBe(true);
    expect(leadListQuerySchema.safeParse({ page: 1, limit: 10, ...filters }).success).toBe(true);
  });
});

describe('lead status labels', () => {
  it('does not present "not found" as an error', () => {
    expect(WEBSITE_STATUS_LABELS.NOT_FOUND.tone).not.toBe('danger');
    expect(WEBSITE_STATUS_LABELS.ERROR.tone).toBe('danger');
    expect(WEBSITE_STATUS_LABELS.NOT_FOUND.label).not.toBe(WEBSITE_STATUS_LABELS.ERROR.label);
  });
});
