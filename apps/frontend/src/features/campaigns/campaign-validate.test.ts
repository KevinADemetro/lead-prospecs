import { beforeEach, describe, expect, it, vi } from 'vitest';
import { leadsApi } from '@/services/api/leads';
import {
  findFirstPendingIndex,
  findNextPendingIndex,
  isLeadValidationDone,
  listCampaignLeadQueue,
} from './campaign-validate';

vi.mock('@/services/api/leads', () => ({
  leadsApi: { list: vi.fn() },
}));

describe('listCampaignLeadQueue', () => {
  beforeEach(() => {
    vi.mocked(leadsApi.list).mockReset();
  });

  it('pages through campaign leads in ascending createdAt order and skips AUTO_QUALIFIED', async () => {
    vi.mocked(leadsApi.list)
      .mockResolvedValueOnce({
        data: [
          { id: '1', qualificationStatus: 'PENDING' } as never,
          { id: '2', qualificationStatus: 'AUTO_QUALIFIED' } as never,
        ],
        meta: { page: 1, limit: 100, total: 3, totalPages: 2 },
      })
      .mockResolvedValueOnce({
        data: [{ id: '3', qualificationStatus: 'QUALIFIED' } as never],
        meta: { page: 2, limit: 100, total: 3, totalPages: 2 },
      });

    const leads = await listCampaignLeadQueue('camp-1');

    expect(leads.map((lead) => lead.id)).toEqual(['1', '3']);
    expect(leadsApi.list).toHaveBeenNthCalledWith(1, {
      page: 1,
      limit: 100,
      sort: 'createdAt',
      order: 'asc',
      campaignId: 'camp-1',
    });
    expect(leadsApi.list).toHaveBeenCalledTimes(2);
  });
});

describe('validation queue helpers', () => {
  const queue = [
    { qualificationStatus: 'QUALIFIED' as const },
    { qualificationStatus: 'DISQUALIFIED' as const },
    { qualificationStatus: 'PENDING' as const },
    { qualificationStatus: 'QUALIFIED' as const },
    { qualificationStatus: 'PENDING' as const },
  ];

  it('treats qualified and disqualified as done', () => {
    expect(isLeadValidationDone('QUALIFIED')).toBe(true);
    expect(isLeadValidationDone('DISQUALIFIED')).toBe(true);
    expect(isLeadValidationDone('PENDING')).toBe(false);
  });

  it('finds the first pending lead index', () => {
    expect(findFirstPendingIndex(queue)).toBe(2);
    expect(findFirstPendingIndex(queue.slice(0, 2))).toBe(-1);
  });

  it('finds the next pending lead after an index', () => {
    expect(findNextPendingIndex(queue, 2)).toBe(4);
    expect(findNextPendingIndex(queue, 4)).toBe(-1);
    expect(findNextPendingIndex(queue, -1)).toBe(2);
  });
});
