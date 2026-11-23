import { describe, expect, it } from 'vitest';
import { leadListQuerySchema } from '@app/shared';
import {
  EMPTY_LEAD_FILTERS,
  hasActiveFilters,
  toggleQualificationStatus,
  toQueryFilters,
} from './lead-filters';
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
      category: 'Padaria',
      city: 'Curitiba',
      qualificationStatus: ['QUALIFIED', 'PENDING'],
      priority: 'true',
    });
    expect(filters).toMatchObject({
      search: 'padaria',
      category: 'Padaria',
      city: 'Curitiba',
      qualificationStatus: ['QUALIFIED', 'PENDING'],
      priority: true,
    });
    expect(hasActiveFilters(filters)).toBe(true);
    expect(leadListQuerySchema.safeParse({ page: 1, limit: 10, ...filters }).success).toBe(true);
  });

  it('toggles qualification statuses', () => {
    expect(toggleQualificationStatus([], 'QUALIFIED')).toEqual(['QUALIFIED']);
    expect(toggleQualificationStatus(['QUALIFIED'], 'PENDING')).toEqual([
      'QUALIFIED',
      'PENDING',
    ]);
    expect(toggleQualificationStatus(['QUALIFIED', 'PENDING'], 'QUALIFIED')).toEqual(['PENDING']);
  });
});

describe('lead list query schema', () => {
  it('accepts a single qualification status', () => {
    const parsed = leadListQuerySchema.safeParse({
      page: 1,
      limit: 10,
      qualificationStatus: 'QUALIFIED',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.qualificationStatus).toEqual(['QUALIFIED']);
    }
  });

  it('accepts repeated and comma-separated qualification statuses', () => {
    const repeated = leadListQuerySchema.safeParse({
      page: 1,
      limit: 10,
      qualificationStatus: ['QUALIFIED', 'PENDING'],
    });
    expect(repeated.success).toBe(true);
    if (repeated.success) {
      expect(repeated.data.qualificationStatus).toEqual(['QUALIFIED', 'PENDING']);
    }

    const csv = leadListQuerySchema.safeParse({
      page: 1,
      limit: 10,
      qualificationStatus: 'QUALIFIED,DISQUALIFIED',
    });
    expect(csv.success).toBe(true);
    if (csv.success) {
      expect(csv.data.qualificationStatus).toEqual(['QUALIFIED', 'DISQUALIFIED']);
    }
  });
});

describe('lead status labels', () => {
  it('does not present "not found" as an error', () => {
    expect(WEBSITE_STATUS_LABELS.NOT_FOUND.tone).not.toBe('danger');
    expect(WEBSITE_STATUS_LABELS.ERROR.tone).toBe('danger');
    expect(WEBSITE_STATUS_LABELS.NOT_FOUND.label).not.toBe(WEBSITE_STATUS_LABELS.ERROR.label);
  });
});
