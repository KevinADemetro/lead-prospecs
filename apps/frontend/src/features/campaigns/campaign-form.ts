import { z } from 'zod';
import {
  BRAZILIAN_STATES,
  campaignFieldSchemas,
  type BrazilianState,
  type CampaignFilters,
  type PublicCampaign,
} from '@app/shared';

export function splitTerms(value: string): string[] {
  return value
    .split(',')
    .map((term) => term.trim())
    .filter(Boolean);
}

export function isBrazilianState(value: string): value is BrazilianState {
  return (BRAZILIAN_STATES as readonly string[]).includes(value);
}

export const campaignFormSchema = z.object({
  name: campaignFieldSchemas.name,
  description: campaignFieldSchemas.description,
  city: campaignFieldSchemas.city,
  state: z.string().refine((value): boolean => isBrazilianState(value), 'Selecione o estado'),
  categories: z
    .string()
    .refine((value) => splitTerms(value).length > 0, 'Informe ao menos uma categoria')
    .refine((value) => splitTerms(value).length <= 20, 'Informe no máximo 20 categorias'),
  filters: z.object({
    withoutWebsite: z.boolean(),
    requirePhone: z.boolean(),
    requireWhatsapp: z.boolean(),
    requireGoogleBusiness: z.boolean(),
  }),
});

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export const emptyCampaignFormValues: CampaignFormValues = {
  name: '',
  description: '',
  city: '',
  state: '',
  categories: '',
  filters: {
    withoutWebsite: false,
    requirePhone: false,
    requireWhatsapp: false,
    requireGoogleBusiness: false,
  },
};

export function toCampaignFormValues(campaign: PublicCampaign): CampaignFormValues {
  const { filters } = campaign;
  return {
    name: campaign.name,
    description: campaign.description,
    city: campaign.city,
    state: campaign.state,
    categories: campaign.categories.join(', '),
    filters: {
      withoutWebsite: filters.withoutWebsite ?? false,
      requirePhone: filters.requirePhone ?? false,
      requireWhatsapp: filters.requireWhatsapp ?? false,
      requireGoogleBusiness: filters.requireGoogleBusiness ?? false,
    },
  };
}

/** Filters not exposed in the form (e.g. maxResults) are preserved from `current`. */
export function toCampaignFilters(
  values: CampaignFormValues['filters'],
  current: CampaignFilters = {},
): CampaignFilters {
  const next: CampaignFilters = {
    maxResults: current.maxResults,
    requireWebsite: current.requireWebsite,
    withoutWebsite: values.withoutWebsite || undefined,
    requirePhone: values.requirePhone || undefined,
    requireWhatsapp: values.requireWhatsapp || undefined,
    requireGoogleBusiness: values.requireGoogleBusiness || undefined,
  };
  if (next.withoutWebsite) next.requireWebsite = undefined;
  return Object.fromEntries(
    Object.entries(next).filter(([, value]) => value !== undefined),
  ) as CampaignFilters;
}
