import { z } from 'zod';
import { CAMPAIGN_STATUSES, NAME_MAX_LENGTH } from '../constants';
import { paginationQuerySchema } from './pagination';

export const campaignStatusSchema = z.enum(CAMPAIGN_STATUSES);

const termSchema = z.string().trim().min(1).max(NAME_MAX_LENGTH);

const termListSchema = z
  .array(termSchema)
  .max(20, 'Informe no máximo 20 itens')
  .transform((values) => [...new Set(values)]);

export const campaignFiltersSchema = z
  .object({
    minRating: z.number().min(0).max(5).optional(),
    minReviewCount: z.number().int().min(0).max(1_000_000).optional(),
    requirePhone: z.boolean().optional(),
    requireWebsite: z.boolean().optional(),
    maxResults: z.number().int().min(1).max(500).optional(),
  })
  .strict();

const campaignFields = {
  name: z.string().trim().min(3, 'Nome deve ter pelo menos 3 caracteres').max(NAME_MAX_LENGTH),
  description: z.string().trim().max(500),
  location: z.string().trim().min(2, 'Informe a localização').max(120),
  categories: termListSchema,
  searchTerms: termListSchema.refine((values) => values.length > 0, {
    message: 'Informe ao menos um termo de busca',
  }),
  filters: campaignFiltersSchema,
};

export const createCampaignSchema = z
  .object({
    ...campaignFields,
    description: campaignFields.description.optional(),
    categories: campaignFields.categories.default([]),
    filters: campaignFields.filters.default({}),
  })
  .strict();

export const updateCampaignSchema = z
  .object({
    name: campaignFields.name.optional(),
    description: campaignFields.description.optional(),
    location: campaignFields.location.optional(),
    categories: campaignFields.categories.optional(),
    searchTerms: campaignFields.searchTerms.optional(),
    filters: campaignFields.filters.optional(),
    status: z.enum(['CANCELLED']).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const campaignListQuerySchema = paginationQuerySchema.extend({
  status: campaignStatusSchema.optional(),
});

export type CampaignFilters = z.infer<typeof campaignFiltersSchema>;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
export type CampaignListQuery = z.infer<typeof campaignListQuerySchema>;
