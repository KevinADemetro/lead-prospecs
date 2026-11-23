import { z } from 'zod';
import {
  OUTREACH_MESSAGE_MAX_LENGTH,
  OUTREACH_MESSAGE_STEPS,
  OUTREACH_SORT_FIELDS,
  OUTREACH_STATUSES,
} from '../constants';
import { entityIdSchema } from './common';
import { paginationQuerySchema } from './pagination';

export const outreachStatusSchema = z.enum(OUTREACH_STATUSES);
export const outreachMessageStepSchema = z.enum(OUTREACH_MESSAGE_STEPS);

const followUpStepSchema = z.enum(['FOLLOW_UP_D3', 'FOLLOW_UP_D7', 'FOLLOW_UP_D14']);

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

export const createOutreachSchema = z
  .object({
    leadId: entityIdSchema,
    message: z
      .string()
      .trim()
      .min(1, 'Informe a mensagem inicial')
      .max(OUTREACH_MESSAGE_MAX_LENGTH),
    sentAt: z.coerce.date().optional(),
    status: outreachStatusSchema.optional(),
  })
  .strict();

export const updateOutreachSchema = z
  .object({
    status: outreachStatusSchema.optional(),
    followUp: z
      .object({
        step: followUpStepSchema,
        message: z
          .string()
          .trim()
          .min(1, 'Informe a mensagem do follow-up')
          .max(OUTREACH_MESSAGE_MAX_LENGTH),
        sentAt: z.coerce.date().optional(),
      })
      .strict()
      .optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const outreachListQuerySchema = paginationQuerySchema.extend({
  sort: z.enum(OUTREACH_SORT_FIELDS).optional(),
  leadId: entityIdSchema.optional(),
  status: queryEnumArraySchema(OUTREACH_STATUSES),
  /** When true, only WAITING_REPLY with nextFollowUpAt on today's UTC calendar day. */
  followUpToday: booleanQuerySchema,
});

export type CreateOutreachInput = z.infer<typeof createOutreachSchema>;
export type UpdateOutreachInput = z.infer<typeof updateOutreachSchema>;
export type OutreachListQuery = z.infer<typeof outreachListQuerySchema>;
