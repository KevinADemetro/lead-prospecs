import { z } from 'zod';
import {
  BRAZILIAN_STATES,
  campaignFieldSchemas,
  type BrazilianState,
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
});

export type CampaignFormValues = z.infer<typeof campaignFormSchema>;

export const emptyCampaignFormValues: CampaignFormValues = {
  name: '',
  description: '',
  city: '',
  state: '',
  categories: '',
};

export function toCampaignFormValues(campaign: PublicCampaign): CampaignFormValues {
  return {
    name: campaign.name,
    description: campaign.description,
    city: campaign.city,
    state: campaign.state,
    categories: campaign.categories.join(', '),
  };
}
