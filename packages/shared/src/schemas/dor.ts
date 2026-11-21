import { z } from 'zod';
import { NAME_MAX_LENGTH } from '../constants';
import { paginationQuerySchema } from './pagination';

export const createDorSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(NAME_MAX_LENGTH),
    description: z.string().trim().max(500).optional().or(z.literal('')),
  })
  .strict();

export const updateDorSchema = z
  .object({
    name: z.string().trim().min(2).max(NAME_MAX_LENGTH).optional(),
    description: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const dorListQuerySchema = paginationQuerySchema;

export type CreateDorInput = z.infer<typeof createDorSchema>;
export type UpdateDorInput = z.infer<typeof updateDorSchema>;
export type DorListQuery = z.infer<typeof dorListQuerySchema>;
