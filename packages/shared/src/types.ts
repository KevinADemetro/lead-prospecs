import type { Permission } from './permissions';
import type {
  CampaignStatus,
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

export type PublicDor = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type PublicDorSummary = Pick<PublicDor, 'id' | 'name'>;

export type PublicLead = {
  id: string;
  companyId: string;
  campaignId: string;
  dorId: string | null;
  websiteStatus: WebsiteStatus;
  qualificationStatus: QualificationStatus;
  priority: boolean;
  notes: string | null;
  dor: PublicDorSummary | null;
  company: PublicCompanySummary;
  campaign: PublicCampaignSummary;
  createdAt: string;
  updatedAt: string;
};

export type PublicLeadDetail = Omit<PublicLead, 'company'> & {
  company: PublicCompany;
};

export type LeadFilterOptions = {
  categories: string[];
  cities: string[];
  dores: PublicDorSummary[];
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
