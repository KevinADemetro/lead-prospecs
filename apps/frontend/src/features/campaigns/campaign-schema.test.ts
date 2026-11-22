import { describe, expect, it } from 'vitest';
import { createCampaignSchema } from '@app/shared';

describe('campaign schema', () => {
  it('rejects unknown fields', () => {
    const base = { name: 'Padarias', location: 'São Paulo', categories: ['padaria'] };
    expect(createCampaignSchema.safeParse({ ...base, status: 'RUNNING' }).success).toBe(false);
    expect(createCampaignSchema.safeParse({ ...base, filters: { foo: 1 } }).success).toBe(false);
  });

  it('applies defaults and removes duplicated categories', () => {
    const result = createCampaignSchema.safeParse({
      name: 'Padarias',
      location: 'São Paulo',
      categories: ['padaria', 'padaria'],
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ categories: ['padaria'] });
    expect(result.data).not.toHaveProperty('filters');
  });

  it('requires at least one category', () => {
    const result = createCampaignSchema.safeParse({
      name: 'Padarias',
      location: 'São Paulo',
      categories: [],
    });
    expect(result.success).toBe(false);
  });
});
