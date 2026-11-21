import { describe, expect, it } from 'vitest';
import { createCampaignSchema, updateCampaignSchema } from '@app/shared';
import {
  campaignFormSchema,
  emptyCampaignFormValues,
  toCampaignFilters,
  type CampaignFormValues,
} from './campaign-form';

const valid: CampaignFormValues = {
  ...emptyCampaignFormValues,
  name: 'Padarias SP',
  city: 'São Paulo',
  state: 'SP',
  categories: 'padaria, confeitaria',
};

describe('campaign form schema', () => {
  it('requires city, state and at least one category', () => {
    const result = campaignFormSchema.safeParse(emptyCampaignFormValues);
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path.join('.'));
    expect(fields).toEqual(expect.arrayContaining(['name', 'city', 'state', 'categories']));
    expect(campaignFormSchema.safeParse(valid).success).toBe(true);
  });
});

describe('toCampaignFilters', () => {
  it('keeps only active filters', () => {
    const filters = toCampaignFilters({
      ...emptyCampaignFormValues.filters,
      withoutWebsite: true,
      requireWhatsapp: true,
    });
    expect(filters).toEqual({
      withoutWebsite: true,
      requireWhatsapp: true,
    });
    const payload = { name: 'Padarias', city: 'Recife', state: 'PE', categories: ['x'], filters };
    expect(createCampaignSchema.safeParse(payload).success).toBe(true);
  });

  it('preserves filters outside the form and clears removed ones', () => {
    const filters = toCampaignFilters(
      { ...emptyCampaignFormValues.filters, withoutWebsite: true },
      { maxResults: 50, requireWebsite: true },
    );
    expect(filters).toEqual({ maxResults: 50, withoutWebsite: true });
  });
});

describe('campaign contract', () => {
  it('rejects conflicting website filters and accepts run/cancel transitions', () => {
    const base = { name: 'Padarias', city: 'Recife', state: 'PE', categories: ['padaria'] };
    expect(
      createCampaignSchema.safeParse({
        ...base,
        filters: { requireWebsite: true, withoutWebsite: true },
      }).success,
    ).toBe(false);
    expect(createCampaignSchema.safeParse({ ...base, state: 'XX' }).success).toBe(false);
    expect(updateCampaignSchema.safeParse({ status: 'RUNNING' }).success).toBe(true);
    expect(updateCampaignSchema.safeParse({ status: 'COMPLETED' }).success).toBe(false);
  });
});
