import { z } from 'zod';
import {
  BRAZILIAN_STATES,
  LEAD_NOTES_MAX_LENGTH,
  LEAD_SORT_FIELDS,
  MANUAL_QUALIFICATION_STATUSES,
  NAME_MAX_LENGTH,
  QUALIFICATION_STATUSES,
  WEBSITE_STATUSES,
  WHATSAPP_STATUSES,
} from '../constants';
import { entityIdSchema } from './common';
import { paginationQuerySchema } from './pagination';

export const qualificationStatusSchema = z.enum(QUALIFICATION_STATUSES);
export const manualQualificationStatusSchema = z.enum(MANUAL_QUALIFICATION_STATUSES);
export const websiteStatusSchema = z.enum(WEBSITE_STATUSES);
export const whatsappStatusSchema = z.enum(WHATSAPP_STATUSES);

/** Query-string booleans arrive as "true"/"false"; reject other values. */
const booleanQuerySchema = z
  .union([z.boolean(), z.literal('true'), z.literal('false')])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (typeof value === 'boolean') return value;
    return value === 'true';
  });

/**
 * Accepts one value, repeated query keys, or a comma-separated string;
 * normalizes to a non-empty unique array.
 */
function queryEnumArraySchema<T extends readonly [string, ...string[]]>(values: T) {
  const itemSchema = z.enum(values);
  return z.preprocess((value) => {
    if (value === undefined || value === null || value === '') return undefined;
    const parts = Array.isArray(value)
      ? value
      : typeof value === 'string'
        ? value.split(',')
        : [value];
    const normalized = [
      ...new Set(
        parts
          .map((part) => (typeof part === 'string' ? part.trim() : part))
          .filter((part) => part !== '' && part != null),
      ),
    ];
    return normalized.length > 0 ? normalized : undefined;
  }, z.array(itemSchema).min(1).optional());
}

export const leadListQuerySchema = paginationQuerySchema.extend({
  sort: z.enum(LEAD_SORT_FIELDS).optional(),
  campaignId: entityIdSchema.optional(),
  companyId: entityIdSchema.optional(),
  dorId: entityIdSchema.optional(),
  qualificationStatus: queryEnumArraySchema(QUALIFICATION_STATUSES),
  websiteStatus: websiteStatusSchema.optional(),
  whatsappStatus: whatsappStatusSchema.optional(),
  priority: booleanQuerySchema,
  category: z.string().trim().min(1).max(NAME_MAX_LENGTH).optional(),
  city: z.string().trim().min(1).max(120).optional(),
});

/** Empty string becomes null so form inputs can clear optional company fields. */
const optionalNullableText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .optional()
    .transform((value) => (value === '' ? null : value));

const optionalNullableCnpj = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((value, ctx) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    const digits = value.replace(/\D/g, '');
    if (digits.length !== 14) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'CNPJ inválido' });
      return z.NEVER;
    }
    return digits;
  });

const optionalNullableState = z
  .union([z.enum(BRAZILIAN_STATES), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;
    return value;
  });

export const updateLeadCompanySchema = z
  .object({
    name: z.string().trim().min(1, 'Informe o nome').max(NAME_MAX_LENGTH).optional(),
    legalName: optionalNullableText(200),
    cnpj: optionalNullableCnpj,
    category: optionalNullableText(NAME_MAX_LENGTH),
    niche: optionalNullableText(NAME_MAX_LENGTH),
    phone: optionalNullableText(40),
    email: optionalNullableText(160),
    website: optionalNullableText(500),
    address: optionalNullableText(300),
    neighborhood: optionalNullableText(120),
    city: optionalNullableText(120),
    state: optionalNullableState,
    country: optionalNullableText(80),
    googleMapsUrl: optionalNullableText(500),
    whatsappUrl: optionalNullableText(500),
    instagramUrl: optionalNullableText(500),
    facebookUrl: optionalNullableText(500),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo da empresa',
  });

export const updateLeadSchema = z
  .object({
    dorId: entityIdSchema.nullable().optional(),
    websiteStatus: websiteStatusSchema.optional(),
    qualificationStatus: manualQualificationStatusSchema.optional(),
    priority: z.boolean().optional(),
    notes: optionalNullableText(LEAD_NOTES_MAX_LENGTH),
    company: updateLeadCompanySchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
export type UpdateLeadCompanyInput = z.infer<typeof updateLeadCompanySchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
