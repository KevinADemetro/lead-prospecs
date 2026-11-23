import { z } from 'zod';
import {
  BRAZILIAN_STATES,
  LEAD_NOTES_MAX_LENGTH,
  NAME_MAX_LENGTH,
  qualificationStatusSchema,
  type BrazilianState,
  type PublicLeadDetail,
  type UpdateLeadInput,
} from '@app/shared';
import { formatCnpj } from './lead-format';

const optionalText = (max: number) => z.string().trim().max(max);

export const leadFormSchema = z.object({
  dorId: z.string(),
  qualificationStatus: qualificationStatusSchema,
  priority: z.boolean(),
  notes: optionalText(LEAD_NOTES_MAX_LENGTH),
  company: z.object({
    name: z.string().trim().min(1, 'Informe o nome').max(NAME_MAX_LENGTH),
    legalName: optionalText(200),
    cnpj: z
      .string()
      .trim()
      .refine((value) => {
        if (!value) return true;
        return value.replace(/\D/g, '').length === 14;
      }, 'CNPJ inválido'),
    category: optionalText(NAME_MAX_LENGTH),
    niche: optionalText(NAME_MAX_LENGTH),
    phone: optionalText(40),
    email: optionalText(160),
    website: optionalText(500),
    address: optionalText(300),
    neighborhood: optionalText(120),
    city: optionalText(120),
    state: z.union([z.enum(BRAZILIAN_STATES), z.literal('')]),
    country: optionalText(80),
    googleMapsUrl: optionalText(500),
    whatsappUrl: optionalText(500),
    instagramUrl: optionalText(500),
    facebookUrl: optionalText(500),
  }),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export function emptyLeadFormValues(): LeadFormValues {
  return {
    dorId: '',
    qualificationStatus: 'PENDING',
    priority: false,
    notes: '',
    company: {
      name: '',
      legalName: '',
      cnpj: '',
      category: '',
      niche: '',
      phone: '',
      email: '',
      website: '',
      address: '',
      neighborhood: '',
      city: '',
      state: '',
      country: '',
      googleMapsUrl: '',
      whatsappUrl: '',
      instagramUrl: '',
      facebookUrl: '',
    },
  };
}

function textOrEmpty(value: string | null | undefined): string {
  return value ?? '';
}

function isBrazilianState(value: string | null): value is BrazilianState {
  return Boolean(value && BRAZILIAN_STATES.includes(value as BrazilianState));
}

export function toLeadFormValues(lead: PublicLeadDetail): LeadFormValues {
  const { company } = lead;
  return {
    dorId: lead.dorId ?? '',
    qualificationStatus: lead.qualificationStatus,
    priority: lead.priority,
    notes: textOrEmpty(lead.notes),
    company: {
      name: company.name,
      legalName: textOrEmpty(company.legalName),
      cnpj: formatCnpj(company.cnpj) ?? textOrEmpty(company.cnpj),
      category: textOrEmpty(company.category),
      niche: textOrEmpty(company.niche),
      phone: textOrEmpty(company.phone),
      email: textOrEmpty(company.email),
      website: textOrEmpty(company.website),
      address: textOrEmpty(company.address),
      neighborhood: textOrEmpty(company.neighborhood),
      city: textOrEmpty(company.city),
      state: isBrazilianState(company.state) ? company.state : '',
      country: textOrEmpty(company.country),
      googleMapsUrl: textOrEmpty(company.googleMapsUrl),
      whatsappUrl: textOrEmpty(company.whatsappUrl),
      instagramUrl: textOrEmpty(company.instagramUrl),
      facebookUrl: textOrEmpty(company.facebookUrl),
    },
  };
}

function blankToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

export function toUpdateLeadInput(values: LeadFormValues): UpdateLeadInput {
  return {
    dorId: values.dorId || null,
    // AUTO_QUALIFIED is system-only; omit so a no-op save does not fail validation.
    ...(values.qualificationStatus === 'AUTO_QUALIFIED'
      ? {}
      : { qualificationStatus: values.qualificationStatus }),
    priority: values.priority,
    notes: blankToNull(values.notes),
    company: {
      name: values.company.name.trim(),
      legalName: blankToNull(values.company.legalName),
      cnpj: blankToNull(values.company.cnpj),
      category: blankToNull(values.company.category),
      niche: blankToNull(values.company.niche),
      phone: blankToNull(values.company.phone),
      email: blankToNull(values.company.email),
      website: blankToNull(values.company.website),
      address: blankToNull(values.company.address),
      neighborhood: blankToNull(values.company.neighborhood),
      city: blankToNull(values.company.city),
      state: values.company.state || null,
      country: blankToNull(values.company.country),
      googleMapsUrl: blankToNull(values.company.googleMapsUrl),
      whatsappUrl: blankToNull(values.company.whatsappUrl),
      instagramUrl: blankToNull(values.company.instagramUrl),
      facebookUrl: blankToNull(values.company.facebookUrl),
    },
  };
}
