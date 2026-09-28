import { CompanyData, CompanyRecord } from '../../common/database/records';

export type CompanyInput = Partial<CompanyData> & { name: string };

export type CompanyIdentity = {
  cnpj: string | null;
  googlePlaceId: string | null;
  dedupeKey: string | null;
};

const IDENTITY_FIELDS = ['cnpj', 'googlePlaceId'] as const;

export function normalizeCnpj(value?: string | null): string | null {
  const digits = (value ?? '').replace(/\D/g, '');
  return digits.length === 14 ? digits : null;
}

export function normalizeText(value?: string | null): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizePhone(value?: string | null): string {
  let digits = (value ?? '').replace(/\D/g, '');
  if (digits.length >= 12 && digits.startsWith('55')) {
    digits = digits.slice(2);
  }
  return digits.replace(/^0+/, '');
}

/** Returns null when there is not enough data to identify a company by name alone. */
export function buildDedupeKey(input: {
  name?: string | null;
  phone?: string | null;
  address?: string | null;
}): string | null {
  const name = normalizeText(input.name);
  const phone = normalizePhone(input.phone);
  const address = normalizeText(input.address);
  if (!name || (!phone && !address)) {
    return null;
  }
  return `${name}|${phone}|${address}`;
}

export function companyIdentity(input: CompanyInput): CompanyIdentity {
  const googlePlaceId = input.googlePlaceId?.trim() || null;
  return {
    cnpj: normalizeCnpj(input.cnpj),
    googlePlaceId,
    dedupeKey: buildDedupeKey(input),
  };
}

export function toCompanyData(input: CompanyInput): CompanyData {
  const identity = companyIdentity(input);
  return {
    name: input.name.trim(),
    legalName: input.legalName ?? null,
    cnpj: identity.cnpj,
    category: input.category ?? null,
    phone: input.phone ?? null,
    email: input.email ?? null,
    website: input.website ?? null,
    address: input.address ?? null,
    city: input.city ?? null,
    state: input.state ?? null,
    country: input.country ?? null,
    googlePlaceId: identity.googlePlaceId,
    googleMapsUrl: input.googleMapsUrl ?? null,
    googleRating: input.googleRating ?? null,
    googleReviewCount: input.googleReviewCount ?? null,
    instagramUrl: input.instagramUrl ?? null,
    facebookUrl: input.facebookUrl ?? null,
  };
}

/**
 * Identity fields (cnpj, googlePlaceId) are only filled when missing, never replaced.
 * Other fields take the incoming value when it is present.
 */
export function mergeCompanyData(existing: CompanyRecord, incoming: CompanyData): CompanyData {
  const merged = { ...incoming };
  for (const key of Object.keys(merged) as (keyof CompanyData)[]) {
    if (merged[key] === null) {
      (merged as Record<keyof CompanyData, unknown>)[key] = existing[key];
    }
  }
  for (const key of IDENTITY_FIELDS) {
    if (existing[key] !== null) {
      merged[key] = existing[key];
    }
  }
  return merged;
}
