import type { Permission } from './permissions';
import type {
  CampaignStatus,
  OutreachMessageStep,
  OutreachStatus,
  QualificationStatus,
  UserStatus,
  WebsiteStatus,
} from './constants';
export type PublicRole = {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = {
  id: string;
  login: string;
  status: UserStatus;
  roles: PublicRole[];
  createdAt: string;
  updatedAt: string;
};

export type PublicCampaign = {
  id: string;
  name: string;
  description: string;
  location: string;
  city: string;
  state: string;
  categories: string[];
  status: CampaignStatus;
  /** Each lead links one distinct company to the campaign. */
  leadCount: number;
  qualifiedLeadCount: number;
  createdAt: string;
  updatedAt: string;
};

export type DashboardMetrics = {
  totalCampaigns: number;
  companiesFound: number;
  qualifiedLeads: number;
  leadsWithoutWebsite: number;
  /** WAITING_REPLY outreach with nextFollowUpAt on today's UTC day. */
  followUpsToday: number;
  recentCampaigns: PublicCampaign[];
};

export type PublicCampaignSummary = Pick<PublicCampaign, 'id' | 'name' | 'status'>;

/** Subset of Places `regularOpeningHours` persisted on the company. */
export type CompanyOpeningHours = {
  openNow?: boolean | null;
  weekdayDescriptions?: string[] | null;
  periods?: Array<{
    open?: { day?: number; hour?: number; minute?: number } | null;
    close?: { day?: number; hour?: number; minute?: number } | null;
  }> | null;
};

export type PublicCompany = {
  id: string;
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
  createdAt: string;
  updatedAt: string;
};

export type PublicCompanySummary = Pick<
  PublicCompany,
  | 'id'
  | 'name'
  | 'category'
  | 'phone'
  | 'website'
  | 'city'
  | 'state'
>;

export type PublicPainPoint = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicPainPointSummary = Pick<PublicPainPoint, 'id' | 'name'>;

export type PublicLead = {
  id: string;
  companyId: string;
  campaignId: string;
  painPointId: string | null;
  /** Active outreach for this lead, if any (1:1). */
  outreachId: string | null;
  websiteStatus: WebsiteStatus;
  qualificationStatus: QualificationStatus;
  priority: boolean;
  notes: string | null;
  painPoint: PublicPainPointSummary | null;
  company: PublicCompanySummary;
  campaign: PublicCampaignSummary;
  createdAt: string;
  updatedAt: string;
};

export type PublicOutreachMessage = {
  id: string;
  sentAt: string;
  message: string;
  step: OutreachMessageStep;
  createdAt: string;
};

export type PublicOutreachLeadSummary = {
  id: string;
  qualificationStatus: QualificationStatus;
  company: Pick<PublicCompany, 'id' | 'name' | 'phone' | 'whatsappUrl'>;
  campaign: PublicCampaignSummary;
};

export type PublicOutreach = {
  id: string;
  leadId: string;
  status: OutreachStatus;
  startedAt: string;
  nextFollowUpAt: string | null;
  messages: PublicOutreachMessage[];
  lead: PublicOutreachLeadSummary;
  /** Resolved WhatsApp link (whatsappUrl or wa.me from phone). */
  whatsappLink: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MarkNoReplyResult = {
  updatedCount: number;
};

export type PublicLeadDetail = Omit<PublicLead, 'company'> & {
  company: PublicCompany;
};

export type LeadFilterOptions = {
  categories: string[];
  cities: string[];
  painPoints: PublicPainPointSummary[];
};

export type PublicCompanyDetail = PublicCompany & {
  leads: Pick<PublicLead, 'id' | 'campaign' | 'qualificationStatus' | 'createdAt'>[];
};

export type AuthUser = PublicUser & {
  permissions: Permission[];
};

export type ApiErrorBody = {
  statusCode: number;
  error: string;
  message: string;
  requestId?: string;
};

export type PaginatedResult<T> = {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
