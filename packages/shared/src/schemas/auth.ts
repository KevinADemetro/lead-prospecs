import { z } from 'zod';
import { loginSchema } from './common';

export const loginRequestSchema = z
  .object({
    login: loginSchema,
    password: z.string().min(1, 'Senha obrigatória').max(128),
  })
  .strict();

export type LoginRequest = z.infer<typeof loginRequestSchema>;
