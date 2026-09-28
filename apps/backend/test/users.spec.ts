import { INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PERMISSIONS } from '@app/shared';
import { loginAsAdmin, loginAs, mutating, startTestApp, stopTestApp } from './helpers';

describe('Users, roles and authorization', () => {
  let app: INestApplication;
  let postgres: StartedPostgreSqlContainer;

  beforeAll(async () => {
    const ctx = await startTestApp();
    app = ctx.app;
    postgres = ctx.postgres;
  });

  afterAll(async () => {
    await stopTestApp({ app, postgres });
  });

  it('lists, creates, updates, soft-deletes and hides users', async () => {
    const { http } = await loginAsAdmin(app);
    const roles = await http.get('/api/v1/roles');
    expect(roles.status).toBe(200);
    const adminRoleId = roles.body.data[0].id as string;

    const created = await mutating(http, 'post', '/api/v1/users', {
      login: 'operator1',
      password: 'Operator!Pass12',
      roleIds: [adminRoleId],
      status: 'active',
    });
    expect(created.status).toBe(201);
    expect(created.body.password).toBeUndefined();
    expect(created.body.passwordHash).toBeUndefined();
    const userId = created.body.id as string;

    const listed = await http.get('/api/v1/users?login=operator1&page=1&limit=10');
    expect(listed.status).toBe(200);
    expect(listed.body.meta.total).toBeGreaterThanOrEqual(1);
    expect(listed.body.data[0].login).toBe('operator1');

    const updated = await mutating(http, 'patch', `/api/v1/users/${userId}`, {
      status: 'inactive',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.status).toBe('inactive');

    const removed = await mutating(http, 'delete', `/api/v1/users/${userId}`);
    expect(removed.status).toBe(204);

    const missing = await http.get(`/api/v1/users/${userId}`);
    expect(missing.status).toBe(404);

    const stillListed = await http.get('/api/v1/users?login=operator1');
    expect(stillListed.body.data.find((item: { id: string }) => item.id === userId)).toBeUndefined();
  });

  it('creates a limited role and blocks access without permission', async () => {
    const { http } = await loginAsAdmin(app);
    const role = await mutating(http, 'post', '/api/v1/roles', {
      name: 'reader',
      description: 'somente leitura de usuários',
      permissions: [PERMISSIONS.USERS_READ],
    });
    expect(role.status).toBe(201);

    const user = await mutating(http, 'post', '/api/v1/users', {
      login: 'reader1',
      password: 'Reader!Pass123',
      roleIds: [role.body.id],
      status: 'active',
    });
    expect(user.status).toBe(201);

    const reader = await loginAs(app, 'reader1', 'Reader!Pass123');
    expect(reader.res.status).toBe(200);
    const users = await reader.http.get('/api/v1/users');
    expect(users.status).toBe(200);

    const forbidden = await mutating(reader.http, 'post', '/api/v1/roles', {
      name: 'should-fail',
      permissions: [PERMISSIONS.ROLES_READ],
    });
    expect(forbidden.status).toBe(403);
  });

  it('rejects IDOR-like access to unknown ids', async () => {
    const { http } = await loginAsAdmin(app);
    const res = await http.get('/api/v1/users/aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa');
    expect(res.status).toBe(404);
  });

  it('rejects mass assignment of internal fields', async () => {
    const { http } = await loginAsAdmin(app);
    const roles = await http.get('/api/v1/roles');
    const created = await mutating(http, 'post', '/api/v1/users', {
      login: 'massassign',
      password: 'MassAssign!12x',
      roleIds: [roles.body.data[0].id],
      status: 'active',
      deletedAt: new Date().toISOString(),
      passwordHash: 'hack',
    });
    expect(created.status).toBe(400);
  });
});
