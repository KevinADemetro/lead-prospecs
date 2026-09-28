import { z } from 'zod';
import { QUALIFICATION_STATUSES, TRELLO_STATUSES } from '../constants';
import { entityIdSchema } from './common';
import { paginationQuerySchema } from './pagination';

export const qualificationStatusSchema = z.enum(QUALIFICATION_STATUSES);
export const trelloStatusSchema = z.enum(TRELLO_STATUSES);

export const leadListQuerySchema = paginationQuerySchema.extend({
  campaignId: entityIdSchema.optional(),
  companyId: entityIdSchema.optional(),
  qualificationStatus: qualificationStatusSchema.optional(),
  trelloStatus: trelloStatusSchema.optional(),
});

export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
