import { describe, expect, it } from 'vitest';
import { createCampaignSchema, updateCampaignSchema } from '@app/shared';
import {
  campaignFormSchema,
  emptyCampaignFormValues,
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

describe('campaign contract', () => {
  it('rejects unknown fields and accepts run/cancel transitions', () => {
    const base = { name: 'Padarias', city: 'Recife', state: 'PE', categories: ['padaria'] };
    expect(createCampaignSchema.safeParse({ ...base, filters: { requirePhone: true } }).success).toBe(
      false,
    );
    expect(createCampaignSchema.safeParse({ ...base, state: 'XX' }).success).toBe(false);
    expect(updateCampaignSchema.safeParse({ status: 'RUNNING' }).success).toBe(true);
    expect(updateCampaignSchema.safeParse({ status: 'COMPLETED' }).success).toBe(false);
  });
});
