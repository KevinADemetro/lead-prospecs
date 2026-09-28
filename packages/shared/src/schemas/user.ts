import { z } from 'zod';
import { USER_STATUSES } from '../constants';
import { entityIdSchema, loginSchema, passwordSchema } from './common';
import { paginationQuerySchema } from './pagination';

export const userStatusSchema = z.enum(USER_STATUSES);

export const createUserSchema = z
  .object({
    login: loginSchema,
    password: passwordSchema,
    roleIds: z.array(entityIdSchema).min(1, 'Selecione ao menos um papel'),
    status: userStatusSchema.default('active'),
  })
  .strict();

export const updateUserSchema = z
  .object({
    login: loginSchema.optional(),
    password: passwordSchema.optional(),
    roleIds: z.array(entityIdSchema).min(1).optional(),
    status: userStatusSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const userListQuerySchema = paginationQuerySchema.extend({
  login: z.string().trim().max(64).optional(),
  status: userStatusSchema.optional(),
  createdFrom: z.coerce.date().optional(),
  createdTo: z.coerce.date().optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: passwordSchema,
  })
  .strict();

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UserListQuery = z.infer<typeof userListQuerySchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
