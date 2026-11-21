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

export const WHATSAPP_STATUSES = ['CONFIRMED', 'NOT_FOUND', 'UNKNOWN'] as const;
export type WhatsappStatus = (typeof WHATSAPP_STATUSES)[number];

export const PRESENCE_STATUSES = ['UNKNOWN', 'NOT_FOUND', 'FOUND'] as const;
export type PresenceStatus = (typeof PRESENCE_STATUSES)[number];

export const QUALIFICATION_STATUSES = ['PENDING', 'QUALIFIED', 'DISQUALIFIED'] as const;
export type QualificationStatus = (typeof QUALIFICATION_STATUSES)[number];

export const TRELLO_STATUSES = ['NOT_SENT', 'CREATED', 'ERROR'] as const;
export type TrelloStatus = (typeof TRELLO_STATUSES)[number];

export const LEAD_SORT_FIELDS = [
  'createdAt',
  'companyName',
  'category',
  'city',
  'score',
] as const;
export type LeadSortField = (typeof LEAD_SORT_FIELDS)[number];

export const SCORE_MIN = 0;
export const SCORE_MAX = 100;

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
export const PAGE_DEFAULT = 1;
export const PAGE_SIZE_DEFAULT = 10;
export const PAGE_SIZE_MAX = 100;

export const LOGIN_PATTERN = /^[a-zA-Z0-9._-]+$/;

export const SYSTEM_ADMIN_ROLE_NAME = 'administrator';
