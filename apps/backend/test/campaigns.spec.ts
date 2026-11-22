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

describe('Campaigns, companies and leads', () => {
  let app: INestApplication;
  let postgres: StartedPostgreSqlContainer;
  // Login is rate limited (5 per 5 min per IP), so the admin session is shared.
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

  it('creates, lists, updates and soft-deletes campaigns', async () => {
    const http = admin;
    const created = await mutating(http, 'post', '/api/v1/campaigns', {
      name: 'Padarias SP',
      location: 'São Paulo, SP',
      categories: ['padaria', 'padaria'],
    });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('DRAFT');
    expect(created.body.categories).toEqual(['padaria']);
    expect(created.body.leadCount).toBe(0);
    const id = created.body.id as string;

    const listed = await http.get('/api/v1/campaigns?search=padarias&status=DRAFT');
    expect(listed.status).toBe(200);
    expect(listed.body.meta.total).toBe(1);
    expect(listed.body.data[0].id).toBe(id);

    const updated = await mutating(http, 'patch', `/api/v1/campaigns/${id}`, {
      description: 'Zona oeste',
    });
    expect(updated.status).toBe(200);
    expect(updated.body.description).toBe('Zona oeste');

    const cancelled = await mutating(http, 'patch', `/api/v1/campaigns/${id}`, {
      status: 'CANCELLED',
    });
    expect(cancelled.body.status).toBe('CANCELLED');

    const locked = await mutating(http, 'patch', `/api/v1/campaigns/${id}`, { name: 'Outro nome' });
    expect(locked.status).toBe(409);

    const removed = await mutating(http, 'delete', `/api/v1/campaigns/${id}`);
    expect(removed.status).toBe(204);
    expect((await http.get(`/api/v1/campaigns/${id}`)).status).toBe(404);
  });

  it('persists city and state and runs campaigns', async () => {
    const http = admin;
    const created = await mutating(http, 'post', '/api/v1/campaigns', {
      name: 'Academias Recife',
      city: 'Recife',
      state: 'PE',
      categories: ['academia'],
    });
    expect(created.status).toBe(201);
    expect(created.body).toMatchObject({ city: 'Recife', state: 'PE', location: 'Recife, PE' });
    expect(created.body.qualifiedLeadCount).toBe(0);
    expect(created.body.filters).toBeUndefined();
    const id = created.body.id as string;

    const moved = await mutating(http, 'patch', `/api/v1/campaigns/${id}`, {
      city: 'Olinda',
    });
    expect(moved.body).toMatchObject({ city: 'Olinda', state: 'PE', location: 'Olinda, PE' });

    const rejectedFilters = await mutating(http, 'patch', `/api/v1/campaigns/${id}`, {
      filters: { requirePhone: true },
    });
    expect(rejectedFilters.status).toBe(400);

    const running = await mutating(http, 'patch', `/api/v1/campaigns/${id}`, {
      status: 'RUNNING',
    });
    expect(running.status).toBe(200);
    expect(running.body.status).toBe('COMPLETED');

    const runAgain = await mutating(http, 'patch', `/api/v1/campaigns/${id}`, {
      status: 'RUNNING',
    });
    expect(runAgain.status).toBe(409);

    const draft = await mutating(http, 'post', '/api/v1/campaigns', {
      name: 'Cancelável',
      city: 'Recife',
      state: 'PE',
      categories: ['academia'],
    });
    const cancelled = await mutating(http, 'patch', `/api/v1/campaigns/${draft.body.id}`, {
      status: 'CANCELLED',
    });
    expect(cancelled.body.status).toBe('CANCELLED');
  });

  it('rejects invalid or arbitrary campaign payloads', async () => {
    const http = admin;
    const base = { name: 'Valid name', location: 'Recife', categories: ['academia'] };

    const extraField = await mutating(http, 'post', '/api/v1/campaigns', {
      ...base,
      status: 'RUNNING',
    });
    expect(extraField.status).toBe(400);

    const noCategories = await mutating(http, 'post', '/api/v1/campaigns', {
      ...base,
      categories: [],
    });
    expect(noCategories.status).toBe(400);

    const badStatus = await http.get('/api/v1/campaigns?status=UNKNOWN');
    expect(badStatus.status).toBe(400);
  });

  it('links companies to campaigns through leads without duplicating companies', async () => {
    const http = admin;
    const first = await mutating(http, 'post', '/api/v1/campaigns', {
      name: 'Campanha A',
      location: 'Curitiba',
      categories: ['pet shop'],
    });
    const second = await mutating(http, 'post', '/api/v1/campaigns', {
      name: 'Campanha B',
      location: 'Curitiba',
      categories: ['banho e tosa'],
    });
    const leads = app.get(LeadsService);

    const leadA = await leads.addCompanyToCampaign(first.body.id, {
      name: 'Pet Feliz',
      phone: '(41) 3333-4444',
      address: 'Rua XV, 10',
    });
    const leadAByPlace = await leads.addCompanyToCampaign(first.body.id, {
      name: 'PET FELIZ',
      phone: '+55 41 33334444',
      address: 'rua xv 10',
      googlePlaceId: 'place-pet-feliz',
    });
    const leadB = await leads.addCompanyToCampaign(second.body.id, {
      name: 'Pet Feliz Ltda',
      googlePlaceId: 'place-pet-feliz',
      cnpj: '12.345.678/0001-95',
    });
    const leadBByCnpj = await leads.addCompanyToCampaign(second.body.id, {
      name: 'Outro nome',
      cnpj: '12345678000195',
    });

    expect(leadAByPlace.id).toBe(leadA.id);
    expect(leadBByCnpj.id).toBe(leadB.id);
    expect(leadB.companyId).toBe(leadA.companyId);

    const listed = await http.get(`/api/v1/leads?campaignId=${first.body.id}`);
    expect(listed.status).toBe(200);
    expect(listed.body.meta.total).toBe(1);
    expect(listed.body.data[0].company.id).toBe(leadA.companyId);
    expect(listed.body.data[0].campaign.id).toBe(first.body.id);
    expect(listed.body.data[0].qualificationStatus).toBe('PENDING');

    const lead = await http.get(`/api/v1/leads/${leadB.id}`);
    expect(lead.status).toBe(200);
    expect(lead.body.campaign.name).toBe('Campanha B');

    const company = await http.get(`/api/v1/companies/${leadA.companyId}`);
    expect(company.status).toBe(200);
    expect(company.body.cnpj).toBe('12345678000195');
    expect(company.body.googlePlaceId).toBe('place-pet-feliz');
    expect(company.body.leads).toHaveLength(2);
    expect(company.body.dedupeKey).toBeUndefined();

    const campaign = await http.get(`/api/v1/campaigns/${first.body.id}`);
    expect(campaign.body.leadCount).toBe(1);
    expect(campaign.body.qualifiedLeadCount).toBe(0);

    const metrics = await http.get('/api/v1/dashboard/metrics');
    expect(metrics.status).toBe(200);
    expect(metrics.body).toMatchObject({
      companiesFound: 1,
      qualifiedLeads: 0,
      leadsWithoutWebsite: 2,
    });
    expect(metrics.body.leadsSentToTrello).toBeUndefined();
    expect(metrics.body.totalCampaigns).toBeGreaterThanOrEqual(2);
    expect(metrics.body.recentCampaigns.length).toBeLessThanOrEqual(5);
    expect(metrics.body.recentCampaigns[0].id).toBe(second.body.id);

    await mutating(http, 'delete', `/api/v1/campaigns/${second.body.id}`);
    expect((await http.get(`/api/v1/leads/${leadB.id}`)).status).toBe(404);
  });

  it('requires domain permissions', async () => {
    const http = admin;
    const role = await mutating(http, 'post', '/api/v1/roles', {
      name: 'campaign-reader',
      permissions: [PERMISSIONS.CAMPAIGNS_READ],
    });
    await mutating(http, 'post', '/api/v1/users', {
      login: 'campaignreader',
      password: 'Campaign!Read12',
      roleIds: [role.body.id],
      status: 'active',
    });
    const reader = await loginAs(app, 'campaignreader', 'Campaign!Read12');
    expect((await reader.http.get('/api/v1/campaigns')).status).toBe(200);
    expect((await reader.http.get('/api/v1/leads')).status).toBe(403);
    expect((await reader.http.get('/api/v1/dashboard/metrics')).status).toBe(403);
    const forbidden = await mutating(reader.http, 'post', '/api/v1/campaigns', {
      name: 'Nope',
      location: 'Nowhere',
      categories: ['x'],
    });
    expect(forbidden.status).toBe(403);
  });
});
