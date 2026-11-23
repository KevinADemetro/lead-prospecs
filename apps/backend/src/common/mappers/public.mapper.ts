import {
  Permission,
  PublicCampaign,
  PublicCompany,
  PublicCompanyDetail,
  PublicDor,
  PublicLead,
  PublicLeadDetail,
} from '@app/shared';
import {
  CampaignRecord,
  CompanyRecord,
  DorRecord,
  LeadDetailRecord,
  LeadRecord,
  RoleRecord,
  UserRecord,
} from '../database/records';
import { AuthContext, RoleSummary } from '../types/auth-context';
import { uniquePermissions } from '../security/rbac.util';

export function toRoleSummary(role: RoleRecord): RoleSummary {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions,
    isSystem: role.isSystem,
  };
}

export function toAuthContext(user: UserRecord, roles: RoleRecord[]): AuthContext {
  const summaries = roles.map(toRoleSummary);
  const permissions = uniquePermissions(
    summaries.flatMap((role) => role.permissions) as Permission[],
  );
  return {
    id: user.id,
    login: user.login,
    status: user.status,
    roleIds: user.roleIds,
    roles: summaries,
    permissions,
  };
}

export function toPublicUser(user: UserRecord, roles: RoleRecord[]) {
  return {
    id: user.id,
    login: user.login,
    status: user.status,
    roles: roles.map(toRoleSummary),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

export function toPublicRole(role: RoleRecord) {
  return {
    id: role.id,
    name: role.name,
    description: role.description,
    permissions: role.permissions,
    isSystem: role.isSystem,
    createdAt: role.createdAt.toISOString(),
    updatedAt: role.updatedAt.toISOString(),
  };
}

export function toPublicCampaign(campaign: CampaignRecord): PublicCampaign {
  return {
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    location: campaign.location,
    city: campaign.city,
    state: campaign.state,
    categories: campaign.categories,
    status: campaign.status,
    leadCount: campaign.leadCount,
    qualifiedLeadCount: campaign.qualifiedLeadCount,
    createdAt: campaign.createdAt.toISOString(),
    updatedAt: campaign.updatedAt.toISOString(),
  };
}

export function toPublicCompany(company: CompanyRecord): PublicCompany {
  return {
    id: company.id,
    name: company.name,
    legalName: company.legalName,
    cnpj: company.cnpj,
    category: company.category,
    niche: company.niche,
    phone: company.phone,
    email: company.email,
    website: company.website,
    address: company.address,
    neighborhood: company.neighborhood,
    city: company.city,
    state: company.state,
    country: company.country,
    googlePlaceId: company.googlePlaceId,
    googleMapsUrl: company.googleMapsUrl,
    whatsappUrl: company.whatsappUrl,
    instagramUrl: company.instagramUrl,
    facebookUrl: company.facebookUrl,
    openingHours: company.openingHours,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };
}

export function toPublicDor(dor: DorRecord): PublicDor {
  return {
    id: dor.id,
    name: dor.name,
    description: dor.description,
    createdAt: dor.createdAt.toISOString(),
    updatedAt: dor.updatedAt.toISOString(),
  };
}

export function toPublicLead(lead: LeadRecord): PublicLead {
  return {
    id: lead.id,
    companyId: lead.companyId,
    campaignId: lead.campaignId,
    dorId: lead.dorId,
    websiteStatus: lead.websiteStatus,
    whatsappStatus: lead.whatsappStatus,
    instagramStatus: lead.instagramStatus,
    facebookStatus: lead.facebookStatus,
    qualificationStatus: lead.qualificationStatus,
    priority: lead.priority,
    notes: lead.notes,
    dor: lead.dor,
    company: lead.company,
    campaign: lead.campaign,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export function toPublicLeadDetail(lead: LeadDetailRecord): PublicLeadDetail {
  return {
    ...toPublicLead(lead),
    company: toPublicCompany(lead.company),
  };
}

export function toPublicCompanyDetail(
  company: CompanyRecord,
  leads: LeadRecord[],
): PublicCompanyDetail {
  return {
    ...toPublicCompany(company),
    leads: leads.map((lead) => ({
      id: lead.id,
      campaign: lead.campaign,
      qualificationStatus: lead.qualificationStatus,
      createdAt: lead.createdAt.toISOString(),
    })),
  };
}
