export const USER_STATUSES = ['active', 'inactive'] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const CAMPAIGN_STATUSES = ['DRAFT', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

/**
 * NOT_FOUND means the check succeeded and the company has no website;
 * UNAVAILABLE means a website exists but did not respond; ERROR means the check itself failed.
 */
export const WEBSITE_STATUSES = ['FOUND', 'NOT_FOUND', 'UNAVAILABLE', 'ERROR', 'UNKNOWN'] as const;
export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number];

export const QUALIFICATION_STATUSES = [
  'PENDING',
  'QUALIFIED',
  'DISQUALIFIED',
  'AUTO_QUALIFIED',
] as const;
export type QualificationStatus = (typeof QUALIFICATION_STATUSES)[number];

/** Statuses selectable in the lead edit UI / update API. AUTO_QUALIFIED is system-only. */
export const MANUAL_QUALIFICATION_STATUSES = ['PENDING', 'QUALIFIED', 'DISQUALIFIED'] as const;
export type ManualQualificationStatus = (typeof MANUAL_QUALIFICATION_STATUSES)[number];

export const LEAD_SORT_FIELDS = [
  'createdAt',
  'companyName',
  'category',
  'city',
] as const;
export type LeadSortField = (typeof LEAD_SORT_FIELDS)[number];

/** Outreach approach lifecycle — mirrored in Prisma enum OutreachStatus. */
export const OUTREACH_STATUSES = [
  'WAITING_REPLY',
  'IN_CONVERSATION',
  'PROPOSAL_DECLINED',
  'NO_REPLY',
] as const;
export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

/** Message steps in the D0 / D+3 / D+7 / D+14 sequence. */
export const OUTREACH_MESSAGE_STEPS = [
  'INITIAL',
  'FOLLOW_UP_D3',
  'FOLLOW_UP_D7',
  'FOLLOW_UP_D14',
] as const;
export type OutreachMessageStep = (typeof OUTREACH_MESSAGE_STEPS)[number];

export const OUTREACH_SORT_FIELDS = [
  'createdAt',
  'startedAt',
  'nextFollowUpAt',
  'companyName',
] as const;
export type OutreachSortField = (typeof OUTREACH_SORT_FIELDS)[number];

/** Days after D0 for each automatic follow-up. */
export const OUTREACH_FOLLOW_UP_DAYS = {
  FOLLOW_UP_D3: 3,
  FOLLOW_UP_D7: 7,
  FOLLOW_UP_D14: 14,
} as const;

/** Days after D+14 with no reply before bulk-marking NO_REPLY (D0 + 21). */
export const OUTREACH_NO_REPLY_GRACE_DAYS = 7;

export const OUTREACH_MESSAGE_MAX_LENGTH = 5000;

export const BRAZILIAN_STATES = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
] as const;
export type BrazilianState = (typeof BRAZILIAN_STATES)[number];

export const SORT_DIRECTIONS = ['asc', 'desc'] as const;
export type SortDirection = (typeof SORT_DIRECTIONS)[number];

export const LOGIN_MIN_LENGTH = 3;
export const LOGIN_MAX_LENGTH = 64;
export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 128;
export const NAME_MAX_LENGTH = 80;
export const LEAD_NOTES_MAX_LENGTH = 2000;
export const PAGE_DEFAULT = 1;
export const PAGE_SIZE_DEFAULT = 10;
export const PAGE_SIZE_MAX = 100;

export const LOGIN_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const SYSTEM_ADMIN_ROLE_NAME = 'administrator';
