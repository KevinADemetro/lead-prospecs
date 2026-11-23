import {
  PAGE_SIZE_MAX,
  type PublicLead,
  type QualificationStatus,
} from '@app/shared';
import { leadsApi } from '@/services/api/leads';

/** Lead already decided in validation (qualified or disqualified). */
export function isLeadValidationDone(
  status: QualificationStatus | Pick<PublicLead, 'qualificationStatus'>,
): boolean {
  const value = typeof status === 'string' ? status : status.qualificationStatus;
  return value === 'QUALIFIED' || value === 'DISQUALIFIED';
}

export function isLeadPending(
  status: QualificationStatus | Pick<PublicLead, 'qualificationStatus'>,
): boolean {
  return !isLeadValidationDone(status);
}

/** Index of the first pending lead, or -1 when none remain. */
export function findFirstPendingIndex(leads: Pick<PublicLead, 'qualificationStatus'>[]): number {
  return leads.findIndex((lead) => isLeadPending(lead));
}

/** Next pending lead after `fromIndex`, or -1 when none remain. */
export function findNextPendingIndex(
  leads: Pick<PublicLead, 'qualificationStatus'>[],
  fromIndex: number,
): number {
  for (let index = fromIndex + 1; index < leads.length; index += 1) {
    if (isLeadPending(leads[index]!)) return index;
  }
  return -1;
}

/** Loads campaign leads for the validation queue (excludes AUTO_QUALIFIED). */
export async function listCampaignLeadQueue(campaignId: string): Promise<PublicLead[]> {
  const leads: PublicLead[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const result = await leadsApi.list({
      page,
      limit: PAGE_SIZE_MAX,
      sort: 'createdAt',
      order: 'asc',
      campaignId,
    });
    leads.push(
      ...result.data.filter((lead) => lead.qualificationStatus !== 'AUTO_QUALIFIED'),
    );
    totalPages = result.meta.totalPages;
    page += 1;
  } while (page <= totalPages);

  return leads;
}
