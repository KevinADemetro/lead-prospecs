import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { passwordSchema } from '@app/shared';

function loadEnvFileFromRepo(): void {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  let dir = process.cwd();
  for (;;) {
    const candidate = resolve(dir, '.env');
    if (existsSync(candidate)) {
      process.loadEnvFile(candidate);
      return;
    }
    const parent = resolve(dir, '..');
    if (parent === dir) {
      return;
    }
    dir = parent;
  }
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z
    .string()
    .min(1)
    .refine(
      (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
      'DATABASE_URL must be a PostgreSQL connection string',
    ),
  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_DAYS: z.coerce.number().int().min(1).max(30).default(7),
  COOKIE_SECURE: z
    .string()
    .optional()
    .transform((value) => value === 'true' || value === '1'),
  COOKIE_DOMAIN: z.string().optional().default(''),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  CORS_ORIGINS: z.string().min(1),
  INITIAL_ADMIN_LOGIN: z.string().min(3).max(64),
  INITIAL_ADMIN_PASSWORD: passwordSchema,
  APP_NAME: z.string().min(1).default('Lead Prospecs'),
  ARGON2_MEMORY_COST: z.coerce.number().int().min(1024).max(1048576).default(65536),
  ARGON2_TIME_COST: z.coerce.number().int().min(2).max(10).default(3),
  GOOGLE_PLACES_API_KEY: z.string().min(1, 'GOOGLE_PLACES_API_KEY is required'),
});

export type AppEnv = z.infer<typeof envSchema> & {
  corsOrigins: string[];
  isProduction: boolean;
  isTest: boolean;
};

export function loadEnv(source: NodeJS.ProcessEnv = process.env): AppEnv {
  if (source === process.env) {
    loadEnvFileFromRepo();
  }

  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  const data = parsed.data;
  const corsOrigins = data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS must contain at least one origin');
  }

  if (data.NODE_ENV === 'production' && !data.COOKIE_SECURE) {
    throw new Error('COOKIE_SECURE must be true in production');
  }

  if (data.COOKIE_SAMESITE === 'none' && !data.COOKIE_SECURE) {
    throw new Error('COOKIE_SAMESITE=none requires COOKIE_SECURE=true');
  }

  return {
    ...data,
    corsOrigins,
    isProduction: data.NODE_ENV === 'production',
    isTest: data.NODE_ENV === 'test',
  };
}
