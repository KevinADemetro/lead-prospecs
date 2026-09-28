import { z } from 'zod';
import { ALL_PERMISSIONS } from '../permissions';
import { NAME_MAX_LENGTH } from '../constants';
import { paginationQuerySchema } from './pagination';

export const permissionValueSchema = z.enum(
  ALL_PERMISSIONS as unknown as [string, ...string[]],
);

export const createRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, 'Nome deve ter pelo menos 3 caracteres')
      .max(NAME_MAX_LENGTH)
      .regex(/^[a-zA-Z0-9._-]+$/, 'Nome deve conter apenas letras, números, ponto, hífen ou underscore'),
    description: z.string().trim().max(200).optional().or(z.literal('')),
    permissions: z.array(permissionValueSchema).min(1, 'Selecione ao menos uma permissão'),
  })
  .strict();

export const updateRoleSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3)
      .max(NAME_MAX_LENGTH)
      .regex(/^[a-zA-Z0-9._-]+$/)
      .optional(),
    description: z.string().trim().max(200).optional(),
    permissions: z.array(permissionValueSchema).min(1).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const roleListQuerySchema = paginationQuerySchema;

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleListQuery = z.infer<typeof roleListQuerySchema>;
