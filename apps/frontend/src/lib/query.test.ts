import { describe, expect, it } from 'vitest';
import { toQuery } from './query';

describe('toQuery', () => {
  it('serializes scalar params', () => {
    expect(toQuery({ page: 1, search: 'padaria', empty: '' })).toBe('?page=1&search=padaria');
  });

  it('appends repeated keys for arrays', () => {
    expect(
      toQuery({
        qualificationStatus: ['QUALIFIED', 'PENDING'],
        websiteStatus: 'FOUND',
      }),
    ).toBe('?qualificationStatus=QUALIFIED&qualificationStatus=PENDING&websiteStatus=FOUND');
  });
});
