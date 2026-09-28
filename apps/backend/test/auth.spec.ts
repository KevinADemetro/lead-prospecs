import { INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { ORIGIN, ADMIN_PASSWORD, agent, csrfFromResponse, csrfOf, loginAsAdmin, startTestApp, stopTestApp } from './helpers';

describe('Auth', () => {
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

  it('rejects invalid credentials with a generic message', async () => {
    const http = agent(app);
    const csrfRes = await http.get('/api/v1/auth/csrf').set('Origin', ORIGIN);
    const csrf = (csrfRes.body as { csrfToken: string }).csrfToken;
    const res = await http
      .post('/api/v1/auth/login')
      .set('Origin', ORIGIN)
      .set('X-CSRF-Token', csrf)
      .send({ login: 'admin', password: 'wrong-password-!!' });
    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciais inválidas');
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash/i);
  });

  it('rejects login without CSRF token', async () => {
    const res = await agent(app)
      .post('/api/v1/auth/login')
      .set('Origin', ORIGIN)
      .send({ login: 'admin', password: ADMIN_PASSWORD });
    expect(res.status).toBe(403);
  });

  it('logs in, returns the current user, and refreshes the session', async () => {
    const { http, res } = await loginAsAdmin(app);
    expect(res.status).toBe(200);
    expect(res.body.user.login).toBe('admin');
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.tokens).toBeUndefined();

    const me = await http.get('/api/v1/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.user.permissions).toContain('users.read');

    const refreshed = await http
      .post('/api/v1/auth/refresh')
      .set('Origin', ORIGIN)
      .set('X-CSRF-Token', csrfOf(http));
    expect(refreshed.status).toBe(200);
    expect(refreshed.body.user.login).toBe('admin');
    http.csrfToken = csrfFromResponse(refreshed, http.csrfToken);
  });

  it('logs out and rejects subsequent authenticated calls', async () => {
    const { http } = await loginAsAdmin(app);
    const logout = await http
      .post('/api/v1/auth/logout')
      .set('Origin', ORIGIN)
      .set('X-CSRF-Token', csrfOf(http));
    expect(logout.status).toBe(200);
    const me = await http.get('/api/v1/auth/me');
    expect(me.status).toBe(401);
  });

  it('does not leak stack traces', async () => {
    const res = await agent(app).get('/api/v1/users');
    expect(res.status).toBe(401);
    expect(res.body.stack).toBeUndefined();
  });
});
