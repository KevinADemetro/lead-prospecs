import { z } from 'zod';
import {
  LEAD_SORT_FIELDS,
  NAME_MAX_LENGTH,
  QUALIFICATION_STATUSES,
  SCORE_MAX,
  SCORE_MIN,
  TRELLO_STATUSES,
  WEBSITE_STATUSES,
  WHATSAPP_STATUSES,
} from '../constants';
import { entityIdSchema } from './common';
import { paginationQuerySchema } from './pagination';

export const qualificationStatusSchema = z.enum(QUALIFICATION_STATUSES);
export const trelloStatusSchema = z.enum(TRELLO_STATUSES);
export const websiteStatusSchema = z.enum(WEBSITE_STATUSES);
export const whatsappStatusSchema = z.enum(WHATSAPP_STATUSES);

const scoreBoundSchema = z.coerce.number().int().min(SCORE_MIN).max(SCORE_MAX);

export const leadListQuerySchema = paginationQuerySchema
  .extend({
    sort: z.enum(LEAD_SORT_FIELDS).optional(),
    campaignId: entityIdSchema.optional(),
    companyId: entityIdSchema.optional(),
    qualificationStatus: qualificationStatusSchema.optional(),
    trelloStatus: trelloStatusSchema.optional(),
    websiteStatus: websiteStatusSchema.optional(),
    whatsappStatus: whatsappStatusSchema.optional(),
    category: z.string().trim().min(1).max(NAME_MAX_LENGTH).optional(),
    city: z.string().trim().min(1).max(120).optional(),
    scoreMin: scoreBoundSchema.optional(),
    scoreMax: scoreBoundSchema.optional(),
  })
  .refine(
    (query) =>
      query.scoreMin === undefined ||
      query.scoreMax === undefined ||
      query.scoreMin <= query.scoreMax,
    { message: 'Score mínimo não pode ser maior que o máximo', path: ['scoreMin'] },
  );

export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
