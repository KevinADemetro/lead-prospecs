import { z } from 'zod';
import { LOGIN_MAX_LENGTH, LOGIN_MIN_LENGTH, LOGIN_PATTERN, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '../constants';

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres`)
  .max(PASSWORD_MAX_LENGTH, `A senha deve ter no máximo ${PASSWORD_MAX_LENGTH} caracteres`)
  .regex(/[a-z]/, 'A senha deve conter letra minúscula')
  .regex(/[A-Z]/, 'A senha deve conter letra maiúscula')
  .regex(/[0-9]/, 'A senha deve conter número')
  .regex(/[^A-Za-z0-9]/, 'A senha deve conter caractere especial');

export const loginSchema = z
  .string()
  .trim()
  .min(LOGIN_MIN_LENGTH, `Login deve ter pelo menos ${LOGIN_MIN_LENGTH} caracteres`)
  .max(LOGIN_MAX_LENGTH, `Login deve ter no máximo ${LOGIN_MAX_LENGTH} caracteres`)
  .regex(LOGIN_PATTERN, 'Login deve conter apenas letras, números, ponto, hífen ou underscore');

export const entityIdSchema = z.string().uuid('Identificador inválido');
