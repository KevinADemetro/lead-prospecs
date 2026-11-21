import { INestApplication } from '@nestjs/common';
import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { PERMISSIONS } from '@app/shared';
import { LeadsService } from '../src/modules/leads/leads.service';
import {
  loginAs,
  loginAsAdmin,
  mutating,
  startTestApp,
  stopTestApp,
  type TestAgent,
} from './helpers';

describe('Dores catalog', () => {
  let app: INestApplication;
  let postgres: StartedPostgreSqlContainer;
  let admin: TestAgent;

  beforeAll(async () => {
    const ctx = await startTestApp();
    app = ctx.app;
    postgres = ctx.postgres;
    admin = (await loginAsAdmin(app)).http;
  });

  afterAll(async () => {
    await stopTestApp({ app, postgres });
  });

  it('creates, lists and soft-deletes dores', async () => {
    const created = await mutating(admin, 'post', '/api/v1/dores', {
      name: 'Falta de leads qualificados',
      description: 'Dificuldade em gerar demanda',
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({
      name: 'Falta de leads qualificados',
      description: 'Dificuldade em gerar demanda',
    });

    const listed = await admin.get('/api/v1/dores?search=qualificados');
    expect(listed.status).toBe(200);
    expect(listed.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: created.body.id })]),
    );

    const conflict = await mutating(admin, 'post', '/api/v1/dores', {
      name: 'Falta de leads qualificados',
    });
    expect(conflict.status).toBe(409);

    const removed = await mutating(admin, 'delete', `/api/v1/dores/${created.body.id}`);
    expect(removed.status).toBe(204);

    const missing = await admin.get(`/api/v1/dores/${created.body.id}`);
    expect(missing.status).toBe(404);
  });

  it('blocks delete when a lead uses the dor', async () => {
    const dor = await mutating(admin, 'post', '/api/v1/dores', {
      name: 'Dor em uso',
    });
    expect(dor.status).toBe(201);

    const campaign = await mutating(admin, 'post', '/api/v1/campaigns', {
      name: 'Campanha Dor',
      city: 'Curitiba',
      state: 'PR',
      categories: ['clinica'],
    });
    const leads = app.get(LeadsService);
    const lead = await leads.addCompanyToCampaign(campaign.body.id, {
      name: 'Clinica Dor',
      googlePlaceId: 'place-dor-in-use',
    });
    const linked = await mutating(admin, 'patch', `/api/v1/leads/${lead.id}`, {
      dorId: dor.body.id,
    });
    expect(linked.status).toBe(200);
    expect(linked.body.dor).toEqual({ id: dor.body.id, name: 'Dor em uso' });

    const blocked = await mutating(admin, 'delete', `/api/v1/dores/${dor.body.id}`);
    expect(blocked.status).toBe(403);
  });

  it('requires dores permissions', async () => {
    const role = await mutating(admin, 'post', '/api/v1/roles', {
      name: 'dor-reader',
      permissions: [PERMISSIONS.DORES_READ],
    });
    await mutating(admin, 'post', '/api/v1/users', {
      login: 'dorreader',
      password: 'Dor!Reader12345',
      roleIds: [role.body.id],
      status: 'active',
    });
    const reader = await loginAs(app, 'dorreader', 'Dor!Reader12345');
    expect((await reader.http.get('/api/v1/dores')).status).toBe(200);
    const denied = await mutating(reader.http, 'post', '/api/v1/dores', {
      name: 'Sem permissão',
    });
    expect(denied.status).toBe(403);
  });
});
