import { z } from 'zod';
import { BRAZILIAN_STATES, CAMPAIGN_STATUSES, NAME_MAX_LENGTH } from '../constants';
import { paginationQuerySchema } from './pagination';

export const campaignStatusSchema = z.enum(CAMPAIGN_STATUSES);

const termSchema = z.string().trim().min(1).max(NAME_MAX_LENGTH);

const termListSchema = z
  .array(termSchema)
  .max(20, 'Informe no máximo 20 itens')
  .transform((values) => [...new Set(values)]);

export const campaignFieldSchemas = {
  name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres').max(NAME_MAX_LENGTH),
  description: z.string().trim().max(500, 'Descrição deve ter no máximo 500 caracteres'),
  location: z.string().trim().min(2, 'Informe a localização').max(120),
  city: z.string().trim().min(2, 'Informe a cidade').max(120),
  state: z.enum(BRAZILIAN_STATES, { errorMap: () => ({ message: 'Selecione o estado' }) }),
  categories: termListSchema.refine((values) => values.length > 0, {
    message: 'Informe ao menos uma categoria',
  }),
};

/** Campaigns created with city/state get `location` derived as "City, UF". */
export function formatCampaignLocation(city: string, state: string): string {
  return state ? `${city}, ${state}` : city;
}

export const createCampaignSchema = z
  .object({
    ...campaignFieldSchemas,
    description: campaignFieldSchemas.description.optional(),
    location: campaignFieldSchemas.location.optional(),
    city: campaignFieldSchemas.city.optional(),
    state: campaignFieldSchemas.state.optional(),
  })
  .strict()
  .refine((value) => Boolean(value.city || value.location), {
    message: 'Informe a cidade',
    path: ['city'],
  });

export const CAMPAIGN_STATUS_TRANSITIONS = ['RUNNING', 'CANCELLED'] as const;

export const updateCampaignSchema = z
  .object({
    name: campaignFieldSchemas.name.optional(),
    description: campaignFieldSchemas.description.optional(),
    location: campaignFieldSchemas.location.optional(),
    city: campaignFieldSchemas.city.optional(),
    state: campaignFieldSchemas.state.optional(),
    categories: campaignFieldSchemas.categories.optional(),
    status: z.enum(CAMPAIGN_STATUS_TRANSITIONS).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const campaignListQuerySchema = paginationQuerySchema.extend({
  status: campaignStatusSchema.optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CampaignListQuery = z.infer<typeof campaignListQuerySchema>;
