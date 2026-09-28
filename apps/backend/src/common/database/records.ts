import {
  CampaignFilters,
  CampaignStatus,
  Permission,
  PresenceStatus,
  QualificationStatus,
  TrelloStatus,
  UserStatus,
  WebsiteStatus,
} from '@app/shared';

export type RoleRecord = {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
};

export type UserRecord = {
  id: string;
  login: string;
  passwordHash?: string;
  status: UserStatus;
  failedLoginAttempts?: number;
  lockedUntil?: Date | null;
  roleIds: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
};

export type RefreshTokenRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  replacedByHash: string;
  userAgent: string;
  ip: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserListFilter = {
  loginContains?: string;
  status?: UserStatus;
  createdFrom?: Date;
  createdTo?: Date;
};

export type RoleListFilter = {
  nameContains?: string;
};

export type CampaignRecord = {
  id: string;
  name: string;
  description: string;
  location: string;
  categories: string[];
  searchTerms: string[];
  filters: CampaignFilters;
  status: CampaignStatus;
  leadCount: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
};

export type CampaignListFilter = {
  nameContains?: string;
  status?: CampaignStatus;
};

export type CompanyData = {
  name: string;
  legalName: string | null;
  cnpj: string | null;
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  googlePlaceId: string | null;
  googleMapsUrl: string | null;
  googleRating: number | null;
  googleReviewCount: number | null;
};

export type CompanyRecord = CompanyData & {
  id: string;
  dedupeKey: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
};

export type CampaignSummaryRecord = Pick<CampaignRecord, 'id' | 'name' | 'status'>;

export type CompanySummaryRecord = Pick<
  CompanyRecord,
  'id' | 'name' | 'category' | 'phone' | 'website' | 'city' | 'state'
>;

export type LeadRecord = {
  id: string;
  companyId: string;
  campaignId: string;
  websiteStatus: WebsiteStatus;
  whatsappStatus: PresenceStatus;
  instagramStatus: PresenceStatus;
  facebookStatus: PresenceStatus;
  score: number | null;
  scoreReasons: string[];
  qualificationStatus: QualificationStatus;
  trelloStatus: TrelloStatus;
  trelloCardId: string | null;
  trelloCardUrl: string | null;
  company: CompanySummaryRecord;
  campaign: CampaignSummaryRecord;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
};

export type LeadListFilter = {
  campaignId?: string;
  companyId?: string;
  companyNameContains?: string;
  qualificationStatus?: QualificationStatus;
  trelloStatus?: TrelloStatus;
};

export type SortDirection = 'asc' | 'desc';
