import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer, StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import cookieParser from 'cookie-parser';
import { json } from 'express';
import request from 'supertest';
import { ALL_PERMISSIONS, SYSTEM_ADMIN_ROLE_NAME } from '@app/shared';
import { AppModule } from '../src/app.module';
import { EnvService } from '../src/config/env.service';
import { PasswordService } from '../src/common/security/password.service';
import { RolesRepository } from '../src/modules/roles/roles.repository';
import { UsersRepository } from '../src/modules/users/users.repository';

export const ORIGIN = 'http://localhost:3000';
export const ADMIN_LOGIN = 'admin';
export const ADMIN_PASSWORD = 'ChangeMe!Admin12';

export type TestAgent = ReturnType<typeof request.agent> & { csrfToken?: string };

export type TestApp = {
  app: INestApplication;
  postgres: StartedPostgreSqlContainer;
};

export async function startTestApp(): Promise<TestApp> {
  const postgres = await new PostgreSqlContainer('postgres:17-alpine').start();
  const databaseUrl = postgres.getConnectionUri();
  process.env.DATABASE_URL = databaseUrl;

  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    cwd: resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('api/v1');
  app.use(cookieParser());
  app.use(json({ limit: '100kb' }));
  await app.init();

  const passwords = app.get(PasswordService);
  const roles = app.get(RolesRepository);
  const users = app.get(UsersRepository);
  const env = app.get(EnvService);

  let adminRole = await roles.findByName(SYSTEM_ADMIN_ROLE_NAME);
  if (!adminRole) {
    adminRole = await roles.create({
      name: SYSTEM_ADMIN_ROLE_NAME,
      description: 'admin',
      permissions: [...ALL_PERMISSIONS],
      isSystem: true,
    });
  }
  const existing = await users.findByLogin(env.values.INITIAL_ADMIN_LOGIN);
  if (!existing) {
    await users.create({
      login: env.values.INITIAL_ADMIN_LOGIN.toLowerCase(),
      passwordHash: await passwords.hash(env.values.INITIAL_ADMIN_PASSWORD),
      roleIds: [adminRole.id],
      status: 'active',
    });
  }

  return { app, postgres };
}

export async function stopTestApp(ctx: TestApp): Promise<void> {
  await ctx.app?.close();
  await ctx.postgres?.stop();
}

export function agent(app: INestApplication): TestAgent {
  return request.agent(app.getHttpServer()) as TestAgent;
}

export function csrfFromResponse(res: request.Response, fallback = ''): string {
  const raw = res.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const match = list.find((cookie) => cookie.startsWith('csrf_token='));
  if (!match) {
    return fallback;
  }
  const value = match.split(';')[0]?.split('=')[1] ?? '';
  return decodeURIComponent(value);
}

export function csrfOf(http: TestAgent): string {
  return http.csrfToken ?? '';
}

export async function loginAs(app: INestApplication, login: string, password: string) {
  const http = agent(app);
  const csrfRes = await http.get('/api/v1/auth/csrf').set('Origin', ORIGIN);
  http.csrfToken = (csrfRes.body as { csrfToken?: string }).csrfToken ?? csrfFromResponse(csrfRes);
  const res = await http
    .post('/api/v1/auth/login')
    .set('Origin', ORIGIN)
    .set('X-CSRF-Token', csrfOf(http))
    .send({ login, password });
  http.csrfToken = csrfFromResponse(res, http.csrfToken);
  return { http, res };
}

export async function loginAsAdmin(app: INestApplication) {
  return loginAs(app, ADMIN_LOGIN, ADMIN_PASSWORD);
}

export async function mutating(
  http: TestAgent,
  method: 'post' | 'patch' | 'delete',
  url: string,
  body?: object,
) {
  const req = http[method](url).set('Origin', ORIGIN).set('X-CSRF-Token', csrfOf(http));
  const res = body ? await req.send(body) : await req;
  http.csrfToken = csrfFromResponse(res, http.csrfToken);
  return res;
}
