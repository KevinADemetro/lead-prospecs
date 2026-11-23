import {
  Permission,
  PublicCampaign,
  PublicCompany,
  PublicCompanyDetail,
  PublicPainPoint,
  PublicLead,
  PublicLeadDetail,
  PublicOutreach,
  resolveWhatsappLink,
} from '@app/shared';
import {
  CampaignRecord,
  CompanyRecord,
  PainPointRecord,
  LeadDetailRecord,
  LeadRecord,
  OutreachRecord,
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

export function toPublicPainPoint(painPoint: PainPointRecord): PublicPainPoint {
  return {
    id: painPoint.id,
    name: painPoint.name,
    description: painPoint.description,
    createdAt: painPoint.createdAt.toISOString(),
    updatedAt: painPoint.updatedAt.toISOString(),
  };
}

export function toPublicLead(lead: LeadRecord): PublicLead {
  return {
    id: lead.id,
    companyId: lead.companyId,
    campaignId: lead.campaignId,
    painPointId: lead.painPointId,
    outreachId: lead.outreachId,
    websiteStatus: lead.websiteStatus,
    qualificationStatus: lead.qualificationStatus,
    priority: lead.priority,
    notes: lead.notes,
    painPoint: lead.painPoint,
    company: lead.company,
    campaign: lead.campaign,
    createdAt: lead.createdAt.toISOString(),
    updatedAt: lead.updatedAt.toISOString(),
  };
}

export function toPublicOutreach(outreach: OutreachRecord): PublicOutreach {
  const { company } = outreach.lead;
  return {
    id: outreach.id,
    leadId: outreach.leadId,
    status: outreach.status,
    startedAt: outreach.startedAt.toISOString(),
    nextFollowUpAt: outreach.nextFollowUpAt?.toISOString() ?? null,
    messages: outreach.messages.map((message) => ({
      id: message.id,
      sentAt: message.sentAt.toISOString(),
      message: message.message,
      step: message.step,
      createdAt: message.createdAt.toISOString(),
    })),
    lead: {
      id: outreach.lead.id,
      qualificationStatus: outreach.lead.qualificationStatus,
      company: {
        id: company.id,
        name: company.name,
        phone: company.phone,
        whatsappUrl: company.whatsappUrl,
      },
      campaign: outreach.lead.campaign,
    },
    whatsappLink: resolveWhatsappLink(company.whatsappUrl, company.phone),
    createdAt: outreach.createdAt.toISOString(),
    updatedAt: outreach.updatedAt.toISOString(),
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
