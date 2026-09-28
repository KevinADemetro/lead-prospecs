import { describe, expect, it } from 'vitest';
import { leadListQuerySchema } from '@app/shared';
import { EMPTY_LEAD_FILTERS, hasActiveFilters, toQueryFilters } from './lead-filters';
import { TRELLO_STATUS_LABELS, WEBSITE_STATUS_LABELS } from './lead-labels';

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
      trelloStatus: 'ERROR',
      category: 'Padaria',
      city: 'Curitiba',
      scoreMin: '90',
      scoreMax: '20',
    });
    expect(filters).toMatchObject({ search: 'padaria', scoreMin: 20, scoreMax: 90 });
    expect(hasActiveFilters(filters)).toBe(true);
    expect(leadListQuerySchema.safeParse({ page: 1, limit: 10, ...filters }).success).toBe(true);
  });

  it('clamps score bounds and drops non-integers', () => {
    const filters = toQueryFilters({ ...EMPTY_LEAD_FILTERS, scoreMin: '-5', scoreMax: '7.5' });
    expect(filters.scoreMin).toBe(0);
    expect(filters.scoreMax).toBeUndefined();
  });
});

describe('lead status labels', () => {
  it('does not present "not found" as an error', () => {
    expect(WEBSITE_STATUS_LABELS.NOT_FOUND.tone).not.toBe('danger');
    expect(WEBSITE_STATUS_LABELS.ERROR.tone).toBe('danger');
    expect(WEBSITE_STATUS_LABELS.NOT_FOUND.label).not.toBe(WEBSITE_STATUS_LABELS.ERROR.label);
    expect(TRELLO_STATUS_LABELS.ERROR.tone).toBe('danger');
  });
});
