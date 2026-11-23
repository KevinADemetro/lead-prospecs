import {
  CampaignStatus,
  CompanyOpeningHours,
  OutreachMessageStep,
  OutreachStatus,
  Permission,
  QualificationStatus,
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

export type PainPointRecord = {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
};

export type PainPointListFilter = {
  nameContains?: string;
};

export type PainPointSummaryRecord = Pick<PainPointRecord, 'id' | 'name'>;

export type CampaignRecord = {
  id: string;
  name: string;
  description: string;
  location: string;
  city: string;
  state: string;
  categories: string[];
  status: CampaignStatus;
  leadCount: number;
  qualifiedLeadCount: number;
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
  niche: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  googlePlaceId: string | null;
  googleMapsUrl: string | null;
  whatsappUrl: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  openingHours: CompanyOpeningHours | null;
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
  | 'id'
  | 'name'
  | 'category'
  | 'phone'
  | 'website'
  | 'city'
  | 'state'
>;

export type LeadRecord = {
  id: string;
  companyId: string;
  campaignId: string;
  painPointId: string | null;
  outreachId: string | null;
  websiteStatus: WebsiteStatus;
  qualificationStatus: QualificationStatus;
  priority: boolean;
  notes: string | null;
  painPoint: PainPointSummaryRecord | null;
  company: CompanySummaryRecord;
  campaign: CampaignSummaryRecord;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
};

export type OutreachMessageRecord = {
  id: string;
  sentAt: Date;
  message: string;
  step: OutreachMessageStep;
  createdAt: Date;
};

export type OutreachLeadSummaryRecord = {
  id: string;
  qualificationStatus: QualificationStatus;
  company: {
    id: string;
    name: string;
    phone: string | null;
    whatsappUrl: string | null;
  };
  campaign: CampaignSummaryRecord;
};

export type OutreachRecord = {
  id: string;
  leadId: string;
  status: OutreachStatus;
  startedAt: Date;
  nextFollowUpAt: Date | null;
  messages: OutreachMessageRecord[];
  lead: OutreachLeadSummaryRecord;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  deletedBy: string | null;
};

export type OutreachListFilter = {
  leadId?: string;
  search?: string;
  status?: OutreachStatus[];
  followUpToday?: boolean;
};

export type LeadDetailRecord = Omit<LeadRecord, 'company'> & {
  company: CompanyRecord;
};

export type LeadListFilter = {
  campaignId?: string;
  companyId?: string;
  painPointId?: string;
  /** Matches company name, legal name, CNPJ, category or city. */
  search?: string;
  /** When set, matches leads whose status is any of the given values. */
  qualificationStatus?: QualificationStatus[];
  websiteStatus?: WebsiteStatus;
  priority?: boolean;
  category?: string;
  city?: string;
};

export type LeadFilterOptionsRecord = {
  categories: string[];
  cities: string[];
  painPoints: PainPointSummaryRecord[];
};

export type SortDirection = 'asc' | 'desc';
