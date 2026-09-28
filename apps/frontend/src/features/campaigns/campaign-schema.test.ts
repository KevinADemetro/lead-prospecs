import { describe, expect, it } from 'vitest';
import { createCampaignSchema } from '@app/shared';

describe('campaign schema', () => {
  it('rejects unknown fields and filters', () => {
    const base = { name: 'Padarias', location: 'São Paulo', searchTerms: ['padaria'] };
    expect(createCampaignSchema.safeParse({ ...base, status: 'RUNNING' }).success).toBe(false);
    expect(createCampaignSchema.safeParse({ ...base, filters: { foo: 1 } }).success).toBe(false);
  });

  it('applies defaults and removes duplicated terms', () => {
    const result = createCampaignSchema.safeParse({
      name: 'Padarias',
      location: 'São Paulo',
      searchTerms: ['padaria', 'padaria'],
    });
    expect(result.success).toBe(true);
    expect(result.data).toMatchObject({ searchTerms: ['padaria'], categories: [], filters: {} });
  });
});
