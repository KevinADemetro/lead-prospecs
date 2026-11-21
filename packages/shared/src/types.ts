import type { Permission } from './permissions';
import type {
  CampaignStatus,
  PresenceStatus,
  QualificationStatus,
  TrelloStatus,
  UserStatus,
  WebsiteStatus,
  WhatsappStatus,
} from './constants';
import type { CampaignFilters } from './schemas/campaign';

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
  searchTerms: string[];
  filters: CampaignFilters;
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
  leadsSentToTrello: number;
  recentCampaigns: PublicCampaign[];
};

export type PublicCampaignSummary = Pick<PublicCampaign, 'id' | 'name' | 'status'>;

export type PublicCompany = {
  id: string;
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
  instagramUrl: string | null;
  facebookUrl: string | null;
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
  | 'googleRating'
  | 'googleReviewCount'
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
  whatsappStatus: WhatsappStatus;
  instagramStatus: PresenceStatus;
  facebookStatus: PresenceStatus;
  score: number | null;
  scoreReasons: string[];
  qualificationStatus: QualificationStatus;
  trelloStatus: TrelloStatus;
  trelloCardId: string | null;
  trelloCardUrl: string | null;
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
  leads: Pick<PublicLead, 'id' | 'campaign' | 'qualificationStatus' | 'score' | 'createdAt'>[];
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
